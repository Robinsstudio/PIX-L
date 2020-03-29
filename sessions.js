/**
 * This object represents a game session.
 */

const cookie = require('cookie');
const ObjectId = require('mongoose').Types.ObjectId;
const Impl = require('./impl');
const User = require('./User');
const DataManager = require('./DataManager');
const QuestionPool = require('./QuestionPool');
const QuestionUtils = require('./QuestionUtils');
const ScoreManager = require('./ScoreManager');
const Timer = require('./Timer');

class Session {
	constructor(name, io, url, questions, linkedQuestions) {
		this._id = ObjectId();
		this.name = name;
		this.dataManager = new DataManager(io, url, questions, linkedQuestions);
		this.questionPool = new QuestionPool(this.dataManager);
		this.scoreManager = new ScoreManager(this.dataManager);
		this.timer = new Timer();

		this.questionPool.onSelectionChanged(selection => this.broadcast('questionSelection', selection));
		this.questionPool.onQuestionStarted(question => this.startQuestion(question));
		this.questionPool.onQuestionCanceled(() => this.scoreManager.cancelQuestion());
		this.questionPool.onQuestionDone(() => this.handleQuestionDone());
		this.questionPool.onQuestionEnded(() => this.endQuestion());

		this.timer.onCount(seconds => this.broadcast('count', seconds));
		this.timer.onOutOfTime(() => this.scoreManager.timeOut());

		this.scoreManager.onScoreChange(() => this.broadcast('teamChange', this.getTeams()));
		this.scoreManager.onFeedback((feedback, team) => this.emit(team, 'feedback', feedback));
		this.scoreManager.onLinkedQuestionStarted((team, linkedQuestion) => this.emit(team, 'questionStart', linkedQuestion));
	}

	/**
	 * Broadcasts the specified event.
	 *
	 * @param {string} event - the event
	 * @param {any} payload - the event payload
	 */
	broadcast(event, payload) {
		this.dataManager.broadcast(event, payload);
	}

	/**
	 * Emits the specified event.
	 *
	 * @param {string} team - the team
	 * @param {string} event - the event to emit
	 * @param {any} payload - the event payload
	 */
	emit(team, event, payload) {
		this.dataManager.emit(team, event, payload);
	}

	/**
	 * Initializes the specified socket with administrator events.
	 *
	 * @param {SocketIO.Socket} socket - the socket to initialize
	 */
	initializeAdminEvents(socket) {
		this.dataManager.addAdmin(socket.id);

		socket.on('selectQuestion', index => this.questionPool.selectQuestion(index));
		socket.on('submit', question => socket.emit('questionStart', this.getNextQuestion(question)));
		socket.on('cancel', () => this.cancel(socket));
		socket.on('stop', () => this.stop(socket));
		socket.on('confirmStopQuestion', () => this.confirmStopQuestion());
		socket.on('confirmStopSession', () => this.confirmStopSession());
		socket.on('confirmCancelQuestion', () => this.confirmCancelQuestion());
		socket.on('disconnect', () => {
			this.dataManager.removeAdmin(socket.id);
			this.discard();
		});

		const activeQuestion = this.dataManager.getActiveQuestion();
		if (activeQuestion) {
			socket.emit('questionStart', QuestionUtils.getActiveQuestion(activeQuestion));
		}

		const turn = this.scoreManager.getTurn();
		if (turn) {
			socket.emit('turn', turn);
		}
	}

	/**
	 * Initializes the specified socket with team events.
	 *
	 * @param {SocketIO.Socket} socket - the socket to initialize
	 */
	initializeTeamEvents(socket) {
		socket.on('teamChoice', team => {
			if (this.dataManager.getAvailableTeams().includes(team)) {
				this.addTeam(socket.id, team);
				this.broadcast('teamChange', this.getTeams());

				socket.on('submit', question => this.scoreManager.correct(team, question));

				socket.on('disconnect', () => {
					this.dataManager.removeTeam(socket.id);
					this.broadcast('teamChange', this.getTeams());
					this.broadcast('turn', this.scoreManager.getTurn());

					this.discard();
				});

				socket.emit('questionStart', this.scoreManager.getFilteredActiveQuestion(team));

				this.broadcast('turn', this.scoreManager.getTurn());

				socket.removeAllListeners('teamChoice');
			}
		});
	}

	/**
	 * Adds a team.
	 *
	 * @param {string} socketId - the id of the socket
	 * @param {string} team - the team
	 */
	addTeam(socketId, team) {
		this.dataManager.addTeam(socketId, team);
		this.scoreManager.addTeam(team);
	}

	/**
	 * Returns the scores of all teams.
	 */
	getTeams() {
		return this.scoreManager.getTeams();
	}

	/**
	 * Starts the specified question.
	 *
	 * @param {number} questionIndex - the index of the question
	 */
	startQuestion(questionIndex) {
		const { dataManager } = this;
		const question = QuestionUtils.getActiveQuestion(dataManager.getQuestion(questionIndex));

		dataManager.startQuestion(questionIndex);
		this.timer.count(question.time);
		this.broadcast('questionStart', question);
	}

	/**
	 * Ends the active question.
	 */
	endQuestion() {
		this.timer.reset();
		this.dataManager.endQuestion();
		this.scoreManager.endQuestion();
		this.broadcast('questionEnd');
	}

	/**
	 * Saves the session and updates the team whose turn it is when a question is done.
	 */
	handleQuestionDone() {
		this.scoreManager.saveSession(this._id, this.getRoom());
		this.scoreManager.updateTurn();
		this.broadcast('turn', this.scoreManager.getTurn());
	}

	/**
	 * Returns the next linked question of the specified question if any.
	 *
	 * @param {Object} question - the question
	 */
	getNextQuestion(question) {
		const nextQuestion = this.dataManager.getNextQuestion(question);
		const returnQuestion = nextQuestion ? nextQuestion : this.dataManager.getActiveQuestion();
		return returnQuestion ? QuestionUtils.getActiveQuestion(returnQuestion) : null;
	}

	/**
	 * Adds a socket.
	 *
	 * @param {SocketIO.Socket} socket - the socket to add
	 * @param {Object} payload - an object with a property admin to true if the user is authenticated
	 */
	addSocket(socket, { admin }) {
		if (admin) {
			this.initializeAdminEvents(socket);
		} else {
			this.initializeTeamEvents(socket);
		}
		socket.join(this.getRoom());

		socket.emit('init', {
			questions: this.dataManager.getFilteredQuestions(),
			selection: { selectedQuestions: this.questionPool.getVisibleQuestions(), unselectedQuestions: [] },
			teams: this.getTeams(),
			maxPoints: this.dataManager.getMaxPoints()
		});
	}

	/**
	 * Stops the active question.
	 */
	confirmStopQuestion() {
		this.questionPool.stopQuestion();
	}

	/**
	 * Stops the session.
	 */
	confirmStopSession() {
		this.stopSession(this.getRoom());
		this.broadcast('greeting', this.scoreManager.getLeadingTeams());
	}

	/**
	 * If there is an active question, then it stops it.
	 * Otherwise, it stops the session.
	 *
	 * A confirm modal will occasionnally be shown to the user if some conditions are met.
	 * In this case, the user will have to confirm that they really want to stop the question/session.
	 *
	 * @param {SocketIO.Socket} socket - the socket
	 */
	stop(socket) {
		const { dataManager, scoreManager, questionPool } = this;

		if (dataManager.getActiveQuestion()) {
			if (!this.timer.isOutOfTime() && scoreManager.teamsAnswered() < dataManager.getTeams().length) {
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

	/**
	 * Cancels the active question.
	 */
	confirmCancelQuestion() {
		this.questionPool.cancelQuestion();
	}

	/**
	 * If there is an active question, then it cancels it.
	 * Otherwise, it hides the last revealed question if any.
	 *
	 * A confirm modal will occasionnally be shown to the user if some conditions are met.
	 * In this case, the user will have to confirm that they really want to cancel the question.
	 *
	 * @param {SocketIO.Socket} socket - the socket
	 */
	cancel(socket) {
		if (this.dataManager.getActiveQuestion()) {
			if (this.scoreManager.teamsAnswered() > 0) {
				socket.emit('confirmCancelQuestion');
			} else {
				this.confirmCancelQuestion();
			}
		} else {
			this.questionPool.cancelLastRevealedCard();
		}
	}

	/**
	 * Returns true if the session can be safely discarded without data loss, false otherwise.
	 */
	canDiscard() {
		return this.dataManager.canDiscard()
			&& this.questionPool.canDiscard()
			&& this.scoreManager.canDiscard();
	}

	/**
	 * Discards the session if the required conditions are met.
	 */
	discard() {
		if (this.canDiscard()) {
			this.stopSession(this.getRoom());
		}
	}

	/**
	 * Returns the id of the game.
	 */
	getRoom() {
		return this.dataManager.getRoom();
	}

	/**
	 * Returns the name of the game.
	 */
	getName() {
		return this.name;
	}
}

/**
 * Authenticates the specified socket.
 *
 * @param {SocketIO.Socket} socket - the socket to authenticate
 */
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

	/**
	 * Returns all active sessions.
	 */
	function getActiveSessions() {
		return Object.values(sessions).map(session => {
			return {
				name: session.getName(),
				url: session.getRoom()
			}
		});
	}

	/**
	 * Stops the specified session.
	 *
	 * @param {string} id - the id of the session
	 */
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
