const QuestionUtils = require('./QuestionUtils');

const MAX_TEAMS = 5;

class QuestionManager {
	constructor(io, url, questions, linkedQuestions) {
		this.io = io;
		this.room = url;
		this.questions = questions;
		this.linkedQuestions = linkedQuestions;
		this.activeQuestion = null;
		this.teams = {};
		this.admins = {};
	}

	broadcast(event, payload) {
		this.io.to(this.room).emit(event, payload);
	}

	emit(team, event, payload) {
		const socketId = Object.entries(this.teams).find(([_, t]) => t === team)[0];
		this.io.to(socketId).emit(event, payload);
	}

	startQuestion(index) {
		this.activeQuestion = this.questions[index];
	}

	endQuestion() {
		this.activeQuestion = null;
	}

	getActiveQuestion() {
		return this.activeQuestion;
	}

	getActiveQuestionIndex() {
		return this.questions.indexOf(this.activeQuestion);
	}

	getLinkedQuestion(linkedQuestionId) {
		return this.linkedQuestions.find(({_id}) => _id.equals(linkedQuestionId));
	}

	getQuestion(index) {
		return this.questions[index];
	}

	getQuestionCount() {
		return this.questions.length;
	}

	getFilteredQuestions() {
		return this.questions.map(question => QuestionUtils.getQuestion(question));
	}

	getMaxPoints() {
		return this.questions.concat(this.linkedQuestions).reduce((sum, question) => sum + question.points, 0) + Math.ceil(this.questions.length / 2);
	}

	addTeam(socket, team) {
		this.teams[socket.id] = team;
	}

	removeTeam(socketId) {
		delete this.teams[socketId];
	}

	getTeams() {
		return Object.values(this.teams);
	}

	getAvailableTeams() {
		const teams = this.getTeams();
		return Array.from({ length: MAX_TEAMS }, (_,i) => i + 1).filter(team => !teams.includes(team));
	}

	getRoom() {
		return this.room;
	}
}

module.exports = QuestionManager;