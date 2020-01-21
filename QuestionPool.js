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

	fireSelectionChanged(selectedQuestions) {
		if (typeof this.onSelectionChangedHandler === 'function') {
			this.onSelectionChangedHandler(selectedQuestions);
		}
	}

	fireStartedQuestion(startedQuestion) {
		if (typeof this.onQuestionStartedHandler === 'function') {
			this.onQuestionStartedHandler(startedQuestion);
		}
	}

	getVisibleQuestions() {
		return this.pastQuestions.concat(this.selectedQuestions);
	}

	selectQuestion(question) {
		const unselectedQuestionIndex = this.unselectedQuestions.indexOf(question);
		if (unselectedQuestionIndex != -1) {
			if (this.selectedQuestions.length < MAX_SELECTED_QUESTIONS) {
				this.selectedQuestions.push(...this.unselectedQuestions.splice(unselectedQuestionIndex, 1));

				this.fireSelectionChanged({ selectedQuestions: [question], unselectedQuestions: [] });
			}
		} else {
			const selectedQuestionIndex = this.selectedQuestions.indexOf(question);
			if (selectedQuestionIndex != -1) {
				const unselectedQuestions = this.selectedQuestions.filter(quest => quest !== question);
				this.unselectedQuestions.push(...unselectedQuestions);
				this.selectedQuestions = [question];

				this.fireStartedQuestion(question);
				this.fireSelectionChanged({ selectedQuestions: [], unselectedQuestions });
			}
		}
	}
}

module.exports = QuestionPool;