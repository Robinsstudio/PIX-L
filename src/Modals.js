import React, { Component, Fragment } from 'react';
import PromptModal from './PromptModal';
import ConfirmModal from './ConfirmModal';
import QuestionModal from './QuestionModal';
import QuestionUtils from './QuestionUtils';

/**
 * This component wraps three kinds of modals.
 * It contains to root state for those three modals.
 *
 * Note: Only one of each modal can be open at a time.
 *
 * - PromptModal: This modal is used to offer free input to the user
 * - ConfirmModal: This modal is used to ask the user if they wish to confirm an operation
 * - QuestionModal: This modal contains the UI elements to create questions
 */
class Modals extends Component {
	constructor(props) {
		super(props);
		this.state = {
			promptModal: {},
			confirmModal: {},
			questionModal: {
				data: QuestionUtils.createMultipleChoiceQuestion()
			}
		};

		this.updatePromptModal = this.updatePromptModal.bind(this);
		this.hidePromptModal = this.hidePromptModal.bind(this);
		this.hideConfirmModal = this.hideConfirmModal.bind(this);
		this.updateQuestionModal = this.updateQuestionModal.bind(this);
		this.hideQuestionModal = this.hideQuestionModal.bind(this);
	}

	/**
	 * Opens the prompt modal with the specified values.
	 *
	 * @param {string} title - The title to show at the top of the modal
	 * @param {string} placeholder - The placeholder to show in the empty input
	 * @param {string} value - The value which the modal is open with
	 * @param {Promise} promise - The promise which will be resolved when the modal closes
	 *
	 * @private
	 */
	showPromptModal(title, placeholder, value, promise) {
		this.setState({ promptModal: { open: true, title, placeholder, value, promise } });
	}

	/**
	 * Updates the prompt modal input with the specified value.
	 *
	 * @param {string} value - The new value
	 *
	 * @private
	 */
	updatePromptModal(value) {
		this.setState((state) => {
			return { promptModal: { ...state.promptModal, value } };
		});
	}

	/**
	 * Closes the prompt modal.
	 *
	 * @private
	 */
	hidePromptModal() {
		this.setState((state) => {
			return { promptModal: { ...state.promptModal, open: false } };
		});
	}

	/**
	 * Opens the confirm modal with the specified values.
	 *
	 * @param {string} title - The title to show at the top of the modal
	 * @param {string} body - The text to display in the confirm modal
	 * @param {Promise} promise - The promise which will be resolved when the modal closes
	 *
	 * @private
	 */
	showConfirmModal(title, body, promise) {
		this.setState({ confirmModal: { open: true, title, body, promise } });
	}

	/**
	 * Closes the confirm modal.
	 *
	 * @private
	 */
	hideConfirmModal() {
		this.setState((state) => {
			return { confirmModal: { ...state.confirmModal, open: false } };
		});
	}

	/**
	 * Opens the question modal with the specified values.
	 *
	 * @param {Object} data - The question data to display
	 * @param {Promise} promise - The promise which will be resolved when the modal closes
	 *
	 * @private
	 */
	showQuestionModal(data, promise) {
		this.setState({ questionModal: { open: true, data: { ...data, type: 'question' }, promise } });
	}

	/**
	 * Updates the question data in the question modal.
	 *
	 * @param {Object} data - The question data to update
	 *
	 * @private
	 */
	updateQuestionModal(data) {
		this.setState((state) => {
			return { questionModal: { ...state.questionModal, data } };
		});
	}

	/**
	 * Closes the question modal
	 *
	 * @private
	 */

	hideQuestionModal() {
		this.setState((state) => {
			return { questionModal: { ...state.questionModal, open: false } };
		});
	}

	/**
	 * Renders all three modals according to their shared states in this component
	 *
	 * @private
	 */
	render() {
		const { promptModal, confirmModal, questionModal } = this.state;
		return (
			<Fragment>
				<PromptModal
					open={promptModal.open} title={promptModal.title} placeholder={promptModal.placeholder} value={promptModal.value}
					update={this.updatePromptModal} hide={this.hidePromptModal} promise={promptModal.promise}
				/>

				<ConfirmModal
					open={confirmModal.open} title={confirmModal.title} body={confirmModal.body} hide={this.hideConfirmModal} promise={confirmModal.promise}
				/>

				<QuestionModal
					open={questionModal.open} data={questionModal.data} update={this.updateQuestionModal}
					hide={this.hideQuestionModal} promise={questionModal.promise}
				/>
			</Fragment>
		);
	}
}

let component;
const modals = <Modals ref={(comp) => component = comp}/>

export default {
	/**
	 * Returns the Modals instance
	 */
	get: () => modals,

	/**
	 * Opens the prompt modal with the specified values.
	 *
	 * @param {string} title - The title to show at the top of the modal
	 * @param {string} placeholder - The placeholder to show in the empty input
	 * @param {string} value - The value which the modal is open with
	 */
	showPromptModal: (title, placeholder, value = '') => new Promise((resolve, reject) => component.showPromptModal(title, placeholder, value, { resolve, reject })),

	/**
	 * Opens the confirm modal with the specified values.
	 *
	 * @param {string} title - The title to show at the top of the modal
	 * @param {string} body - The text to display in the confirm modal
	 */
	showConfirmModal: (title, body) => new Promise((resolve, reject) => component.showConfirmModal(title, body, { resolve, reject })),

	/**
	 * Opens the question modal with the specified values.
	 *
	 * @param {Object} data - The question data to display
	 */
	showQuestionModal: (data) => new Promise((resolve, reject) => component.showQuestionModal(data, { resolve, reject }))
}