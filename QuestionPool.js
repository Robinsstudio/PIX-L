const MAX_SELECTED_QUESTIONS = 2;

class QuestionPool {
	constructor(questions) {
		this.questions = questions;
		this.unselectedQuestions = Array.from({ length: questions.length }, (_,i) => i);
		this.selectedQuestions = [];
		this.pastQuestions = [];
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
		if (typeof this.onSelectionChangedHandler === 'function') {
			this.onSelectionChangedHandler(questions);
		}
	}

	fireQuestionStarted(startedQuestion) {
		if (typeof this.onQuestionStartedHandler === 'function') {
			this.onQuestionStartedHandler(startedQuestion);
		}
	}

	fireQuestionEnded(questionEnded) {
		if (typeof this.onQuestionEndedHandler === 'function') {
			this.onQuestionEndedHandler(questionEnded);
		}
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
			this.activeQuestion = question;
			this.fireQuestionStarted(question);
		}
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
}

module.exports = QuestionPool;