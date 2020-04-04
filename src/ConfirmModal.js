import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

/**
 * This component is a modal which asks the user if they want to confirm an action.
 */
class ConfirmModal extends Component {
	constructor(props) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	}

	/**
	 * Called if the user presses the 'Yes' button.
	 */
	onConfirm() {
		const { hide, promise: { resolve } } = this.props;
		resolve();
		hide();
	}

	/**
	 * Called if the user pressed the 'No' button or dismisses the modal.
	 */
	onCancel() {
		const { hide, promise: { reject } } = this.props;
		reject();
		hide();
	}

	/**
	 * Renders the ConfirmDialog.
	 */
	render() {
		const { open, title, body } = this.props;
		return (
			<Modal isOpen={open} toggle={this.onCancel}>
				<ModalHeader>{title}</ModalHeader>
				<ModalBody>
					<p>{body}</p>
				</ModalBody>
				<ModalFooter>
					<Button color="primary" onClick={this.onConfirm}>Oui</Button>
					<Button color="secondary" onClick={this.onCancel}>Non</Button>
				</ModalFooter>
			</Modal>
		);
	}
}

export default ConfirmModal;