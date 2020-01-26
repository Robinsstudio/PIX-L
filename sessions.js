const cookie = require('cookie');
const Impl = require('./impl');
const User = require('./User');
const QuestionPool = require('./QuestionPool');
const QuestionUtils = require('./QuestionUtils');
const ScoreManager = require('./ScoreManager');
const Timer = require('./Timer');

const MAX_TEAMS = 5;

class Session {
	constructor(io, url, questions) {
		this.io = io;
		this.room = url;
		this.questions = questions;
		this.admins = {};
		this.teams = {};
		this.questionPool = new QuestionPool(questions);
		this.scoreManager = new ScoreManager(questions);
		this.timer = new Timer();

		this.questionPool.onSelectionChanged(selection => this.broadcast('questionSelection', selection));
		this.questionPool.onQuestionStarted(question => this.startQuestion(question));
		this.questionPool.onQuestionEnded(() => this.endQuestion());

		this.timer.onCount(seconds => this.broadcast('count', seconds));
		this.timer.onOutOfTime(() => this.questionPool.stopQuestion());

		this.scoreManager.onScoreChange(() => this.broadcast('teamChange', this.getTeams()));
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

				socket.on('disconnect', () => {
					delete this.teams[socket.id];
					this.broadcast('teamChange', this.getTeams());
				});

				socket.removeAllListeners('teamChoice');
			}
		});
		socket.on('answer', question => this.scoreManager.correct(this.teams[socket.id], question));
	}

	addTeam(socket, team) {
		this.teams[socket.id] = team;
		this.scoreManager.addTeam(team);
	}

	getTeams() {
		return this.scoreManager.getTeams(Object.values(this.teams));
	}

	startQuestion(questionIndex) {
		const question = this.questions[questionIndex];

		this.broadcast('questionStart', QuestionUtils.getActiveQuestion(question));
		this.timer.count(question.time);
		this.scoreManager.startQuestion(questionIndex);
	}

	endQuestion() {
		this.broadcast('questionEnd');
		this.timer.reset();
		this.scoreManager.endQuestion();
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
			activeQuestion: this.questionPool.getActiveQuestion(),
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
					Impl.getByLink(data.url).then(questions => {
						if (questions.length) {
							const newSession = new Session(io, data.url, questions);
							newSession.addSocket(socket, { admin });
							sessions[data.url] = newSession;

							socket.removeAllListeners('init');
						}
					});
				}
			});
		});

		socket.on('disconnect', () => console.log('Client disconnected!'));
	});
}

