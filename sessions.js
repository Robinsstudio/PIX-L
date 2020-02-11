const cookie = require('cookie');
const Impl = require('./impl');
const User = require('./User');
const QuestionManager = require('./QuestionManager');
const QuestionPool = require('./QuestionPool');
const QuestionUtils = require('./QuestionUtils');
const ScoreManager = require('./ScoreManager');
const Timer = require('./Timer');

class Session {
	constructor(name, io, url, questions, linkedQuestions) {
		this.name = name;
		this.questionManager = new QuestionManager(io, url, questions, linkedQuestions);
		this.questionPool = new QuestionPool(this.questionManager);
		this.scoreManager = new ScoreManager(this.questionManager);
		this.timer = new Timer();

		this.questionPool.onSelectionChanged(selection => this.broadcast('questionSelection', selection));
		this.questionPool.onQuestionStarted(question => this.startQuestion(question));
		this.questionPool.onQuestionCanceled(() => this.scoreManager.cancelQuestion());
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
		socket.on('submit', question => socket.emit('questionStart', this.getNextQuestion(question)));
		socket.on('cancel', () => this.cancel(socket));
		socket.on('stop', () => this.stop(socket));
		socket.on('confirmStopQuestion', () => this.confirmStopQuestion());
		socket.on('confirmStopSession', () => this.confirmStopSession());
		socket.on('confirmCancelQuestion', () => this.confirmCancelQuestion());

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

				socket.on('submit', question => this.scoreManager.correct(team, question));

				socket.on('disconnect', () => {
					this.questionManager.removeTeam(socket.id);
					this.broadcast('teamChange', this.getTeams());
					this.broadcast('turn', this.scoreManager.getTurn());
				});

				socket.emit('questionStart', this.scoreManager.getFilteredActiveQuestion(team));

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

	getNextQuestion(question) {
		const nextQuestion = this.questionManager.getNextQuestion(question);
		const returnQuestion = nextQuestion ? nextQuestion : this.questionManager.getActiveQuestion();
		return returnQuestion ? QuestionUtils.getActiveQuestion(returnQuestion) : null;
	}

	addSocket(socket, { admin }) {
		if (admin) {
			this.initializeAdminEvents(socket);
		} else {
			this.initializeTeamEvents(socket);
		}
		socket.join(this.getRoom());

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

	confirmStopSession() {
		const { scoreManager } = this;
		const room = this.getRoom();

		scoreManager.saveSession(room);
		this.stopSession(room);

		this.broadcast('greeting', scoreManager.getLeadingTeams());
	}

	stop(socket) {
		const { questionManager, scoreManager, questionPool } = this;

		if (questionManager.getActiveQuestion()) {
			if (scoreManager.teamsAnswered() < questionManager.getTeams().length) {
				socket.emit('confirmStopQuestion');
			} else {
				this.confirmStopQuestion();
			}
		} else {
			if (questionPool.allQuestionsAnswered()) {
				this.confirmStopSession();
			} else {
				socket.emit('confirmStopSession');
			}
		}
	}

	confirmCancelQuestion() {
		this.questionPool.cancelQuestion();
	}

	cancel(socket) {
		if (this.questionManager.getActiveQuestion()) {
			if (this.scoreManager.teamsAnswered() > 0) {
				socket.emit('confirmCancelQuestion');
			} else {
				this.confirmCancelQuestion();
			}
		} else {
			this.questionPool.cancelLastRevealedCard();
		}
	}

	getRoom() {
		return this.questionManager.getRoom();
	}

	getName() {
		return this.name;
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

	function getActiveSessions() {
		return Object.values(sessions).map(session => {
			return {
				name: session.getName(),
				url: session.getRoom()
			}
		});
	}

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
					Impl.getGameById(data.url).then(({name, questions}) => {
						if (questions.length) {
							Impl.getQuestionsByIds(
								questions.filter(question => question.linkedQuestion).map(question => {
									return question.linkedQuestion._id;
								})
							).then(linkedQuestions => {
								const newSession = new Session(name, io, data.url, questions, linkedQuestions);
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

	return { getActiveSessions };
}

