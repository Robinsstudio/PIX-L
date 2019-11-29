import React, { Component } from 'react';
import { Button } from 'reactstrap';
import './style/popover.css'

class PromptPopover extends Component {
	constructor(props) {
		super(props);

		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.fireOnChange = this.fireOnChange.bind(this);
		this.fireOnConfirm = this.fireOnConfirm.bind(this);
	}

	componentDidUpdate() {
		if (this.props.isOpen) {
			this.refs.input.focus();
		}
	}

	handleKeyDown(event) {
		if (event.key === 'Enter') {
			this.fireOnConfirm();
		}
	}

	fireOnChange(event) {
		const { onChange } = this.props;
		if (typeof onChange === 'function') {
			onChange(event.target.value);
		}
	}

	fireOnConfirm() {
		const { onConfirm, value } = this.props;
		if (typeof onConfirm === 'function') {
			onConfirm(value);
		}
	}

	render() {
		const { isOpen, value } = this.props;
		return (
			<div className={`promptPopover ${isOpen ? 'visible' : ''}`} tabindex="-1" ref="popover">
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
						<i class="fas fa-check"></i>
				</Button>
			</div>
		);
	}
}

export default PromptPopover;