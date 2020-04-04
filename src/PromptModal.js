import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

class PromptModal extends Component {
	constructor(props) {
		super(props);

		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	handleKeyDown(event) {
		const { value } = this.props;
		if (event.key === 'Enter') {
			this.onConfirm(value);
		}
	}

	onConfirm(value) {
		const { hide, promise: { resolve } } = this.props;
		resolve(value);
		hide();
	}

	onCancel(value) {
		const { hide, promise: { reject } } = this.props;
		reject(value);
		hide();
	}

	focus(input) {
		setTimeout(() => {
			if (input) {
				input.focus();
			}
		}, 0);
	}

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