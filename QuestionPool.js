const QuestionUtils = require('./QuestionUtils');

const MAX_SELECTED_QUESTIONS = 2;

class QuestionPool {
	constructor(questions) {
		this.questions = questions;
		this.unselectedQuestions = Array.from({ length: questions.length }, (_,i) => i);
		this.selectedQuestions = [];
		this.pastQuestions = [];
	}

	getVisibleQuestions() {
		return this.pastQuestions.concat(this.selectedQuestions);
	}

	getActiveQuestion() {
		return this.activeQuestion;
	}

	selectQuestion(question) {
		const unselectedQuestionIndex = this.unselectedQuestions.indexOf(question);
		if (unselectedQuestionIndex != -1) {
			if (this.selectedQuestions.length < MAX_SELECTED_QUESTIONS) {
				this.selectedQuestions.push(...this.unselectedQuestions.splice(unselectedQuestionIndex, 1));

				this.fireSelectionChanged({ selectedQuestions: [question], unselectedQuestions: [] });
			}
		} else if (this.selectedQuestions.includes(question)) {
			this.activeQuestion = this.questions[question];
			this.fireQuestionStarted(QuestionUtils.getActiveQuestion(this.activeQuestion));
		}
	}

	stopQuestion() {
		const activeQuestionIndex = this.selectedQuestions.indexOf(this.activeQuestion);
		this.pastQuestions.push(...this.selectedQuestions.splice(activeQuestionIndex, 1));

		const unselectedQuestions = this.selectedQuestions;
		this.unselectedQuestions.push(...unselectedQuestions);
		this.selectedQuestions = [];
		this.fireSelectionChanged({ selectedQuestions: [], unselectedQuestions });

		this.activeQuestion = null;
		this.fireQuestionEnded();
	}

	cancel() {
		if (this.activeQuestion) {
			this.activeQuestion = null;
			this.fireQuestionEnded();
		} else if (this.selectedQuestions.length) {
			const unselectedQuestion = this.selectedQuestions.pop();
			this.unselectedQuestions.push(unselectedQuestion);

			this.fireSelectionChanged({ selectedQuestions: [], unselectedQuestions: [unselectedQuestion] });
		}
	}

	onSelectionChanged(callback) {
		this.onSelectionChangedHandler = callback;
	}

	onQuestionStarted(callback) {
		this.onQuestionStartedHandler = callback;
	}

	onQuestionEnded(callback) {
		this.onQuestionEndedHandler = callback;
	}

	fireSelectionChanged(questions) {
		this.onSelectionChangedHandler(questions);
	}

	fireQuestionStarted(startedQuestion) {
		this.onQuestionStartedHandler(startedQuestion);
	}

	fireQuestionEnded(questionEnded) {
		this.onQuestionEndedHandler(questionEnded);
	}
}

module.exports = QuestionPool;