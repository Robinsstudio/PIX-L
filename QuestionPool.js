const MAX_SELECTED_QUESTIONS = 2;

class QuestionPool {
	constructor(questionManager) {
		this.questionManager = questionManager;
		this.unselectedQuestions = Array.from({ length: questionManager.getQuestionCount() }, (_,i) => i);
		this.selectedQuestions = [];
		this.pastQuestions = [];
	}

	getVisibleQuestions() {
		return this.pastQuestions.concat(this.selectedQuestions);
	}

	selectQuestion(question) {
		if (!this.questionManager.getActiveQuestion()) {
			const unselectedQuestionIndex = this.unselectedQuestions.indexOf(question);
			if (unselectedQuestionIndex != -1) {
				if (this.selectedQuestions.length < MAX_SELECTED_QUESTIONS) {
					this.selectedQuestions.push(...this.unselectedQuestions.splice(unselectedQuestionIndex, 1));
					this.fireSelectionChanged({ selectedQuestions: [question], unselectedQuestions: [] });
				}
			} else if (this.selectedQuestions.includes(question)) {
				this.fireQuestionStarted(question);
			}
		}
	}

	stopQuestion() {
		const activeQuestion = this.questionManager.getActiveQuestion();

		if (activeQuestion) {
			const activeQuestionIndex = this.selectedQuestions.indexOf(activeQuestion);
			this.pastQuestions.push(...this.selectedQuestions.splice(activeQuestionIndex, 1));

			const unselectedQuestions = this.selectedQuestions;
			this.unselectedQuestions.push(...unselectedQuestions);
			this.selectedQuestions = [];

			this.fireSelectionChanged({ selectedQuestions: [], unselectedQuestions });
			this.fireQuestionDone();
			this.fireQuestionEnded();
		}
	}

	cancel() {
		if (this.questionManager.getActiveQuestion()) {
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

	onQuestionDone(callback) {
		this.onQuestionDoneHandler = callback;
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

	fireQuestionDone() {
		this.onQuestionDoneHandler();
	}

	fireQuestionEnded(questionEnded) {
		this.onQuestionEndedHandler(questionEnded);
	}
}

module.exports = QuestionPool;