const cookie = require('cookie');
const Impl = require('./impl');
const User = require('./User');
const QuestionManager = require('./QuestionManager');
const QuestionPool = require('./QuestionPool');
const QuestionUtils = require('./QuestionUtils');
const ScoreManager = require('./ScoreManager');
const Timer = require('./Timer');

const MAX_TEAMS = 5;

class Session {
	constructor(io, url, questions, linkedQuestions) {
		this.io = io;
		this.room = url;
		this.questions = questions;
		this.admins = {};
		this.teams = {};
		this.questionManager = new QuestionManager(questions, linkedQuestions);
		this.questionPool = new QuestionPool(this.questionManager);
		this.scoreManager = new ScoreManager(this.questionManager);
		this.timer = new Timer();

		this.questionPool.onSelectionChanged(selection => this.broadcast('questionSelection', selection));
		this.questionPool.onQuestionStarted(question => this.startQuestion(question));
		this.questionPool.onQuestionEnded(() => this.endQuestion());

		this.timer.onCount(seconds => this.broadcast('count', seconds));
		this.timer.onOutOfTime(() => this.questionPool.stopQuestion());

		this.scoreManager.onScoreChange(() => this.broadcast('teamChange', this.getTeams()));
		this.scoreManager.onFeedback((feedback, team) => this.getSocket(team).emit('feedback', feedback));
		this.scoreManager.onLinkedQuestionStarted((team, linkedQuestion) => this.getSocket(team).emit('questionStart', linkedQuestion));
	}

	broadcast(event, payload) {
		this.io.to(this.room).emit(event, payload);
	}

	getAvailableTeams() {
		const teams = Object.values(this.teams);
		return Array.from({ length: MAX_TEAMS }, (_,i) => i + 1).filter(team => !teams.includes(team));
	}

	isAdmin(socket) {
		return this.admins[socket.id];
	}

	initializeAdminEvents(socket) {
		socket.on('selectQuestion', index => this.questionPool.selectQuestion(index));
		socket.on('cancel', () => this.questionPool.cancel());
	}

	initializeTeamEvents(socket) {
		socket.on('teamChoice', team => {
			if (this.getAvailableTeams().includes(team)) {

				this.addTeam(socket, team);
				this.broadcast('teamChange', this.getTeams());

				socket.on('answer', question => this.scoreManager.correct(team, question));

				socket.on('disconnect', () => {
					delete this.teams[socket.id];
					this.broadcast('teamChange', this.getTeams());
				});

				socket.emit('questionStart', this.scoreManager.getActiveQuestion(team));

				socket.removeAllListeners('teamChoice');
			}
		});
	}

	addTeam(socket, team) {
		this.teams[socket.id] = team;
		this.scoreManager.addTeam(team);
	}

	getTeams() {
		return this.scoreManager.getTeams(Object.values(this.teams));
	}

	getSocket(team) {
		const socketId = Object.entries(this.teams).find(([_, t]) => t === team)[0];
		return this.io.to(socketId);
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

	addSocket(socket, { admin }) {
		if (admin) {
			this.admins[socket.id] = true;
			this.initializeAdminEvents(socket);
		} else {
			this.initializeTeamEvents(socket);
		}
		socket.join(this.room);

		socket.emit('init', {
			questions: this.questions.map(question => QuestionUtils.getQuestion(question)),
			selection: { selectedQuestions: this.questionPool.getVisibleQuestions(), unselectedQuestions: [] },
			teams: this.getTeams(),
			maxPoints: this.questions.reduce((sum, question) => sum + question.points, 0)
		});

		console.log('Listening to socket ' + socket.id);
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
								newSession.addSocket(socket, { admin });
								sessions[data.url] = newSession;

								socket.removeAllListeners('init');
							});
						}
					});
				}
			});
		});

		socket.on('disconnect', () => console.log('Client disconnected!'));
	});
}

