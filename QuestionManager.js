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
}

module.exports = QuestionManager;