const cookie = require('cookie');
const Impl = require('./impl');
const User = require('./User');
const QuestionPool = require('./QuestionPool');
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
		this.timer = new Timer();

		this.questionPool.onSelectionChanged(questions => this.broadcast('questionSelection', questions));
		this.questionPool.onQuestionStarted(question => this.startQuestion(question));
		this.questionPool.onQuestionEnded(() => this.endQuestion());

		this.timer.onCount(seconds => this.broadcast('count', seconds));
		this.timer.onOutOfTime(() => this.questionPool.endQuestion());
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

				this.teams[socket.id] = { team, score: 0 };
				this.broadcast('teamChange', Object.values(this.teams));

				socket.on('disconnect', () => {
					delete this.teams[socket.id];
					this.broadcast('teamChange', Object.values(this.teams));
				});

				socket.removeAllListeners('teamChoice');
			}
		});
	}

	startQuestion(question) {
		this.broadcast('questionStart', question);
		this.timer.count(this.questions[question].time);
	}

	endQuestion() {
		this.broadcast('questionEnd');
		this.timer.reset();
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
			questions: { selectedQuestions: this.questionPool.getVisibleQuestions(), unselectedQuestions: [] },
			activeQuestion: this.questionPool.getActiveQuestion(),
			teams: Object.values(this.teams)
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

