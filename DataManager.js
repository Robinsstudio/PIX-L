/**
 * This object manages the shared data.
 * It is used as a single source of truth.
 */

const QuestionUtils = require('./QuestionUtils');

const MAX_TEAMS = 5;

class DataManager {
	constructor(io, url, questions, linkedQuestions) {
		this.io = io;
		this.room = url;
		this.questions = questions;
		this.linkedQuestions = linkedQuestions;
		this.activeQuestion = null;
		this.teams = {};
		this.admins = {};
	}

	/**
	 * Broadcasts the specified event to all connected users.
	 *
	 * @param {string} event - the event to broadcast
	 * @param {any} payload - the event payload
	 */
	broadcast(event, payload) {
		this.io.to(this.room).emit(event, payload);
	}

	/**
	 * Emits the specified event to the specified team.
	 *
	 * @param {string} team - the team
	 * @param {string} event - the event
	 * @param {any} payload - the event payload
	 */
	emit(team, event, payload) {
		const socketId = Object.entries(this.teams).find(([_, t]) => t === team)[0];
		this.io.to(socketId).emit(event, payload);
	}

	/**
	 * Starts the specified question.
	 *
	 * @param {number} index - the index of the question
	 */
	startQuestion(index) {
		this.activeQuestion = this.questions[index];
	}

	/**
	 * Ends the active question.
	 */
	endQuestion() {
		this.activeQuestion = null;
	}

	/**
	 * Returns the active question.
	 */
	getActiveQuestion() {
		return this.activeQuestion;
	}

	/**
	 * Returns the index of the active question.
	 */
	getActiveQuestionIndex() {
		return this.questions.indexOf(this.activeQuestion);
	}

	/**
	 * Returns the specified linked question.
	 *
	 * @param {string} linkedQuestionId - the id of the linkedQuestion
	 */
	getLinkedQuestion(linkedQuestionId) {
		return this.linkedQuestions.find(({_id}) => _id.equals(linkedQuestionId));
	}

	/**
	 * Returns the specified question.
	 *
	 * @param {number} index - the index of the question
	 */
	getQuestion(index) {
		return this.questions[index];
	}

	/**
	 * Returns the next linked question of the specified question if any.
	 *
	 * @param {Object} question - the question
	 */
	getNextQuestion(question) {
		if (question) {
			const currentQuestion = this.questions.find(({_id}) => _id.equals(question._id));
			if (currentQuestion && currentQuestion.linkedQuestion) {
				return this.getLinkedQuestion(currentQuestion.linkedQuestion._id);
			}
		}
	}

	/**
	 * Returns the number of questions (excluding linked questions)
	 */
	getQuestionCount() {
		return this.questions.length;
	}

	/**
	 * Returns all questions with only three fields:
	 *
	 * - id
	 * - theme
	 * - points
	 */
	getFilteredQuestions() {
		return this.questions.map(question => QuestionUtils.getQuestion(question));
	}

	/**
	 * Returns the maximum number of points that a team can reach.
	 */
	getMaxPoints() {
		return this.questions.concat(this.linkedQuestions).reduce((sum, question) => sum + question.points, 0) + Math.ceil(this.questions.length / 2);
	}

	/**
	 * Adds an administrator.
	 *
	 * @param {string} socketId - the id of the socket
	 */
	addAdmin(socketId) {
		this.admins[socketId] = true;
	}

	/**
	 * Adds a team.
	 *
	 * @param {string} socketId - the id of the socket
	 * @param {string} team - the team
	 */
	addTeam(socketId, team) {
		this.teams[socketId] = team;
	}

	/**
	 * Removes a team.
	 *
	 * @param {string} socketId - the id of the socket
	 */
	removeTeam(socketId) {
		delete this.teams[socketId];
	}

	/**
	 * Removes an administrator.
	 *
	 * @param {string} socketId - the id of the socket
	 */
	removeAdmin(socketId) {
		delete this.admins[socketId];
	}

	/**
	 * Returns all connected teams.
	 */
	getTeams() {
		return Object.values(this.teams).sort();
	}

	/**
	 * Returns all disconnected teams.
	 */
	getAvailableTeams() {
		const teams = this.getTeams();
		return Array.from({ length: MAX_TEAMS }, (_,i) => i + 1).filter(team => !teams.includes(team));
	}

	/**
	 * Returns the id of the game.
	 */
	getRoom() {
		return this.room;
	}

	/**
	 * Returns true if there is no active questions and no users connected.
	 */
	canDiscard() {
		return this.activeQuestion === null
			&& !Object.keys(this.teams).length
			&& !Object.keys(this.admins).length;
	}
}

module.exports = DataManager;