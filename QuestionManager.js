const Impl = require('./impl');
const QuestionUtils = require('./QuestionUtils');

class QuestionManager {
	constructor(questions, linkedQuestions) {
		this.questions = questions;
		this.linkedQuestions = linkedQuestions;
		this.activeQuestion = null;
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

	getLinkedQuestion(linkedQuestionId) {
		return this.linkedQuestions.find(({_id}) => _id.equals(linkedQuestionId));
	}

	getClearedActiveQuestion() {
		return this.activeQuestion ? QuestionUtils.getActiveQuestion(this.activeQuestion) : null;
	}

	getQuestion(index) {
		return this.questions[index];
	}

	getQuestionCount() {
		return this.questions.length;
	}
}

module.exports = QuestionManager;