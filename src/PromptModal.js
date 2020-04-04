import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

/**
 * This component is a modal which allows the user to type text.
 */
class PromptModal extends Component {
	constructor(props) {
		super(props);

		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	/**
	 * If the Enter key is pressed, then the modal closes with the entered text.
	 *
	 * @param {KeyboardEvent} event - the keydown event
	 */
	handleKeyDown(event) {
		const { value } = this.props;
		if (event.key === 'Enter') {
			this.onConfirm(value);
		}
	}

	/**
	 * Called if the user presses the Enter key or the 'Validate' button.
	 *
	 * @param {string} value - the text typed by the user
	 */
	onConfirm(value) {
		const { hide, promise: { resolve } } = this.props;
		resolve(value);
		hide();
	}

	/**
	 * Called if the user pressed the 'Cancel' button or dismisses the modal.
	 *
	 * @param {string} value - the text typed by the user
	 */
	onCancel(value) {
		const { hide, promise: { reject } } = this.props;
		reject(value);
		hide();
	}

	/**
	 * Automatically focuses the input when the modal is opened.
	 *
	 * @param {HTMLInputElement} input - the input element to focus
	 */
	focus(input) {
		setTimeout(() => {
			if (input) {
				input.focus();
			}
		}, 0);
	}

	/**
	 * Renders the PromptModal.
	 */
	render() {
		const { open, title, placeholder, value, update } = this.props;

		return (
			<Modal isOpen={open} toggle={e => this.onCancel(value)}>
				<ModalHeader>{title}</ModalHeader>
				<ModalBody>
					<input
						className="form-control"
						type="text"
						spellCheck="false"
						placeholder={placeholder}
						value={value}
						onChange={e => update(e.target.value)}
						onKeyDown={this.handleKeyDown}
						ref={input => this.focus(input)}
					/>
				</ModalBody>
				<ModalFooter>
					<Button color="primary" onClick={e => this.onConfirm(value)}>Valider</Button>
					<Button color="secondary" onClick={e => this.onCancel(value)}>Annuler</Button>
				</ModalFooter>
			</Modal>
		);
	}
}

export default PromptModal;