import React, { Component } from 'react';

import './style/pretty_input.css';

/**
 * This component is a custom text input.
 */
class PrettyInput extends Component {
	constructor(props) {
		super(props);

		this.state = { active: false };

		this.handleChange = this.handleChange.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
	}

	/**
	 * Processes a change event.
	 *
	 * @param {Event} event - the change event
	 */
	handleChange(event) {
		const { onChange } = this.props;
		if (typeof onChange === 'function') {
			onChange(event);
		}
	}

	/**
	 * Focuses the input.
	 */
	handleFocus() {
		this.setState({ active: true });
	}

	/**
	 * Blurs the input.
	 */
	handleBlur() {
		const { value } = this.props;
		if (!value) {
			this.setState({ active: false });
		}
	}

	/**
	 * Renders the input.
	 */
	render() {
		const { props: { type, id, value, label, className }, state: { active } } = this;
		return (
			<div className={`input-text ${className ? className : ''}`} onFocus={this.handleFocus} onBlur={this.handleBlur}>
				<input type={type} id={id} onChange={this.handleChange} value={value} spellCheck="false" autoComplete="off"/>
				<label className={`input-text-placeholder ${active ? 'input-text-placeholder--active' : ''}`} htmlFor={id}>{ label }</label>
			</div>
		);
	}
}

export default PrettyInput;