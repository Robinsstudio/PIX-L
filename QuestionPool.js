/**
 * This object manages the questions.
 * It provides features such as revealing, starting and ending questions.
 */

const MAX_SELECTED_QUESTIONS = 2;

class QuestionPool {
	constructor(questionManager) {
		this.questionManager = questionManager;
		this.unselectedQuestions = Array.from({ length: questionManager.getQuestionCount() }, (_,i) => i);
		this.selectedQuestions = [];
		this.pastQuestions = [];
	}

	/**
	 * Returns the questions which are revealed or done.
	 */
	getVisibleQuestions() {
		return this.pastQuestions.concat(this.selectedQuestions);
	}

	/**
	 * Reveals the specified question.
	 * If it is already revealed, then it starts the question.
	 *
	 * @param {number} questionIndex - the index of the selected question
	 */
	selectQuestion(questionIndex) {
		if (!this.questionManager.getActiveQuestion()) {
			const unselectedQuestionIndex = this.unselectedQuestions.indexOf(questionIndex);
			if (unselectedQuestionIndex != -1) {
				if (this.selectedQuestions.length < MAX_SELECTED_QUESTIONS) {
					this.selectedQuestions.push(...this.unselectedQuestions.splice(unselectedQuestionIndex, 1));
					this.fireSelectionChanged({ selectedQuestions: [questionIndex], unselectedQuestions: [] });
				}
			} else if (this.selectedQuestions.includes(questionIndex)) {
				this.fireQuestionStarted(questionIndex);
			}
		}
	}

	/**
	 * Stops the active question.
	 */
	stopQuestion() {
		const activeQuestionIndex = this.questionManager.getActiveQuestionIndex();

		if (activeQuestionIndex != -1) {
			this.pastQuestions.push(...this.selectedQuestions.splice(this.selectedQuestions.indexOf(activeQuestionIndex), 1));

			const unselectedQuestions = this.selectedQuestions;
			this.unselectedQuestions.push(...unselectedQuestions);
			this.selectedQuestions = [];

			this.fireSelectionChanged({ selectedQuestions: [], unselectedQuestions });
			this.fireQuestionDone();
			this.fireQuestionEnded();
		}
	}

	/**
	 * Cancels the active question.
	 */
	cancelQuestion() {
		if (this.questionManager.getActiveQuestion()) {
			this.fireQuestionCanceled();
			this.fireQuestionEnded();
		}
	}

	/**
	 * Hides the question which was last revealed.
	 */
	cancelLastRevealedCard() {
		if (this.selectedQuestions.length) {
			const unselectedQuestion = this.selectedQuestions.pop();
			this.unselectedQuestions.push(unselectedQuestion);

			this.fireSelectionChanged({ selectedQuestions: [], unselectedQuestions: [unselectedQuestion] });
		}
	}

	/**
	 * Returns true if all questions have been answered, false otherwise.
	 */
	allQuestionsAnswered() {
		return !this.selectedQuestions.length && !this.unselectedQuestions.length;
	}

	/**
	 * Returns true if no questions are revealed or done.
	 */
	canDiscard() {
		return !this.selectedQuestions.length && !this.pastQuestions.length;
	}

	/**
	 * Sets a listener to the selection changed event.
	 *
	 * @param {Function} callback - the listener
	 */
	onSelectionChanged(callback) {
		this.onSelectionChangedHandler = callback;
	}

	/**
	 * Sets a listener to the question started event.
	 *
	 * @param {Function} callback - the listener
	 */
	onQuestionStarted(callback) {
		this.onQuestionStartedHandler = callback;
	}

	/**
	 * Sets a listener to the question canceled event.
	 *
	 * @param {Function} callback - the listener
	 */
	onQuestionCanceled(callback) {
		this.onQuestionCanceledHandler = callback;
	}

	/**
	 * Sets a listener to the question done event.
	 *
	 * @param {Function} callback - the listener
	 */
	onQuestionDone(callback) {
		this.onQuestionDoneHandler = callback;
	}

	/**
	 * Sets a listener to the question ended event.
	 *
	 * @param {Function} callback - the listener
	 */
	onQuestionEnded(callback) {
		this.onQuestionEndedHandler = callback;
	}

	/**
	 * Fires the selection changed event.
	 *
	 * @param {Object} questions - an object which contains the newly selected and unselected questions
	 */
	fireSelectionChanged(questions) {
		this.onSelectionChangedHandler(questions);
	}

	/**
	 * Fires the question started event.
	 *
	 * @param {Object} startedQuestion - the started question
	 */
	fireQuestionStarted(startedQuestion) {
		this.onQuestionStartedHandler(startedQuestion);
	}

	/**
	 * Fires the question canceled event.
	 */
	fireQuestionCanceled() {
		this.onQuestionCanceledHandler();
	}

	/**
	 * Fires the question done event.
	 */
	fireQuestionDone() {
		this.onQuestionDoneHandler();
	}

	/**
	 * Fires the question ended event.
	 */
	fireQuestionEnded() {
		this.onQuestionEndedHandler();
	}
}

module.exports = QuestionPool;