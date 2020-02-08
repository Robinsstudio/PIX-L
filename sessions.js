const cookie = require('cookie');
const Impl = require('./impl');
const User = require('./User');
const QuestionManager = require('./QuestionManager');
const QuestionPool = require('./QuestionPool');
const QuestionUtils = require('./QuestionUtils');
const ScoreManager = require('./ScoreManager');
const Timer = require('./Timer');

class Session {
	constructor(io, url, questions, linkedQuestions) {
		this.questionManager = new QuestionManager(io, url, questions, linkedQuestions);
		this.questionPool = new QuestionPool(this.questionManager);
		this.scoreManager = new ScoreManager(this.questionManager);
		this.timer = new Timer();

		this.questionPool.onSelectionChanged(selection => this.broadcast('questionSelection', selection));
		this.questionPool.onQuestionStarted(question => this.startQuestion(question));
		this.questionPool.onQuestionDone(() => this.updateTurn());
		this.questionPool.onQuestionEnded(() => this.endQuestion());

		this.timer.onCount(seconds => this.broadcast('count', seconds));
		this.timer.onOutOfTime(() => this.scoreManager.timeOut());

		this.scoreManager.onScoreChange(() => this.broadcast('teamChange', this.getTeams()));
		this.scoreManager.onFeedback((feedback, team) => this.emit(team, 'feedback', feedback));
		this.scoreManager.onLinkedQuestionStarted((team, linkedQuestion) => this.emit(team, 'questionStart', linkedQuestion));
	}

	broadcast(event, payload) {
		this.questionManager.broadcast(event, payload);
	}

	emit(team, event, payload) {
		this.questionManager.emit(team, event, payload);
	}

	initializeAdminEvents(socket) {
		socket.on('selectQuestion', index => this.questionPool.selectQuestion(index));
		socket.on('cancel', () => this.questionPool.cancel());
		socket.on('stop', () => this.stop(socket));
		socket.on('confirmStopQuestion', () => this.confirmStopQuestion());

		const activeQuestion = this.questionManager.getActiveQuestion();
		if (activeQuestion) {
			socket.emit('questionStart', QuestionUtils.getActiveQuestion(activeQuestion));
		}

		const turn = this.scoreManager.getTurn();
		if (turn) {
			socket.emit('turn', turn);
		}
	}

	initializeTeamEvents(socket) {
		socket.on('teamChoice', team => {
			if (this.questionManager.getAvailableTeams().includes(team)) {
				this.addTeam(socket, team);
				this.broadcast('teamChange', this.getTeams());

				socket.on('answer', question => this.scoreManager.correct(team, question));

				socket.on('disconnect', () => {
					this.questionManager.removeTeam(socket.id);
					this.broadcast('teamChange', this.getTeams());
					this.broadcast('turn', this.scoreManager.getTurn());
				});

				socket.emit('questionStart', this.scoreManager.getActiveQuestion(team));

				this.broadcast('turn', this.scoreManager.getTurn());

				socket.removeAllListeners('teamChoice');
			}
		});
	}

	addTeam(socket, team) {
		this.questionManager.addTeam(socket, team);
		this.scoreManager.addTeam(team);
	}

	getTeams() {
		return this.scoreManager.getTeams();
	}

	startQuestion(questionIndex) {
		const { questionManager } = this;
		const question = QuestionUtils.getActiveQuestion(questionManager.getQuestion(questionIndex));

		questionManager.startQuestion(questionIndex);
		this.timer.count(question.time);
		this.broadcast('questionStart', question);
	}

	endQuestion() {
		this.timer.reset();
		this.questionManager.endQuestion();
		this.scoreManager.endQuestion();
		this.broadcast('questionEnd');
	}

	updateTurn() {
		this.scoreManager.updateTurn();
		this.broadcast('turn', this.scoreManager.getTurn());
	}

	addSocket(socket, { admin }) {
		if (admin) {
			this.initializeAdminEvents(socket);
		} else {
			this.initializeTeamEvents(socket);
		}
		socket.join(this.questionManager.getRoom());

		socket.emit('init', {
			questions: this.questionManager.getFilteredQuestions(),
			selection: { selectedQuestions: this.questionPool.getVisibleQuestions(), unselectedQuestions: [] },
			teams: this.getTeams(),
			maxPoints: this.questionManager.getMaxPoints()
		});
	}

	confirmStopQuestion() {
		this.questionPool.stopQuestion();
	}

	stop(socket) {
		const { questionManager, scoreManager } = this;

		if (questionManager.getActiveQuestion()) {
			if (scoreManager.teamsAnswered() < questionManager.getTeams().length) {
				socket.emit('confirmStopQuestion');
			} else {
				this.confirmStopQuestion();
			}
		} else {
			const room = questionManager.getRoom();
			scoreManager.saveSession(room);
			this.stopSession(room);
		}
	}
}

function authenticateSocket(socket) {
	if (socket.request.headers.cookie) {
		const { jwt } = cookie.parse(socket.request.headers.cookie);
		return User.checkAuthentication(jwt, socket.request.res).then(
			() => Promise.resolve(true),
			() => Promise.resolve(false)
		);
	}
	return Promise.resolve(false);
}

module.exports = function(server) {
	const io = require('socket.io')(server, {
		serveClient: false
	}).of('/PIX-L');

	const sessions = {};

	function stopSession(id) {
		delete sessions[id];
	}

	io.on('connection', socket => {
		socket.on('init', data => {
			authenticateSocket(socket).then(admin => {
				const session = sessions[data.url];

				if (session) {
					session.addSocket(socket, { admin });

					socket.removeAllListeners('init');
				} else {
					Impl.getGameById(data.url).then(questions => {
						if (questions.length) {
							Impl.getQuestionsByIds(
								questions.filter(question => question.linkedQuestion).map(question => {
									return question.linkedQuestion._id;
								})
							).then(linkedQuestions => {
								const newSession = new Session(io, data.url, questions, linkedQuestions);
								newSession.stopSession = stopSession;
								newSession.addSocket(socket, { admin });
								sessions[data.url] = newSession;

								socket.removeAllListeners('init');
							});
						}
					});
				}
			});
		});
	});
}

