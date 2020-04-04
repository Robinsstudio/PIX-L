import React, { Component } from 'react';
import { Button } from 'reactstrap';
import './style/popover.css'

/**
 * This component is a popover which allows the user to enter text.
 * It used by the TextEditor component to enter hypertext links.
 */
class PromptPopover extends Component {
	constructor(props) {
		super(props);

		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.fireOnChange = this.fireOnChange.bind(this);
		this.fireOnConfirm = this.fireOnConfirm.bind(this);
	}

	/**
	 * Focuses the popover when it is open.
	 */
	componentDidUpdate() {
		if (this.props.isOpen) {
			this.refs.input.focus();
		}
	}

	/**
	 * Confirms the entered text when the Enter key is pressed.
	 *
	 * @param {KeyboardEvent} event - the keydown event
	 */
	handleKeyDown(event) {
		if (event.key === 'Enter') {
			this.fireOnConfirm();
		}
	}

	/**
	 * Fires a synthetic change event with the entered text when it is changed.
	 *
	 * @param {Event} event - the change event
	 */
	fireOnChange(event) {
		const { onChange } = this.props;
		if (typeof onChange === 'function') {
			onChange(event.target.value);
		}
	}

	/**
	 * Fires a synthetic confirm event.
	 */
	fireOnConfirm() {
		const { onConfirm, value } = this.props;
		if (typeof onConfirm === 'function') {
			onConfirm(value);
		}
	}

	/**
	 * Renders the PromptPopover.
	 */
	render() {
		const { isOpen, value } = this.props;
		return (
			<div className={`promptPopover ${isOpen ? 'visible' : ''}`} tabIndex="-1" ref="popover">
				<input
					type="text"
					value={value}
					onChange={this.fireOnChange}
					onKeyDown={this.handleKeyDown}
					placeholder="Saisissez votre lien hypertexte ici"
					spellCheck="false"
					className="form-control"
					ref="input"
				/>
				<Button color="success" className="ml-3" onClick={this.fireOnConfirm}>
					<i className="fas fa-check"></i>
				</Button>
			</div>
		);
	}
}

export default PromptPopover;