const QuestionUtils = require('./QuestionUtils');

class QuestionManager {
	constructor(questions) {
		this.questions = questions;
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