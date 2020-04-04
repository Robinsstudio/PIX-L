import React, { Component } from 'react';

/**
 * This is an input which automatically selects all its content and gains focus when it is mounted.
 */
class AutoFocusInput extends Component {
	constructor(props) {
		super(props);
		this.input = React.createRef();
		this.handleBlur = this.handleBlur.bind(this);
	}

	/**
	 * Processes a blur event.
	 * It fires the stopEditing event with the current value of the input.
	 */
	handleBlur() {
		this.props.onStopEditing(this.input.current.value);
	}

	/**
	 * Processes a key down event.
	 * If the key pressed is Enter, the stopEditing event is fired with the current value of the input.
	 * If the key pressed is Escape, the stopEditing event is fired with null.
	 *
	 * @param {KeyboardEvent} event - the keyboard event
	 */
	handleKeyDown(event) {
		if (event.key === 'Enter') {
			this.props.onStopEditing(this.input.current.value);
		} else if (event.key === 'Escape') {
			this.props.onStopEditing(null);
		}
	}

	/**
	 * Selects content and gains focus.
	 */
	componentDidMount() {
		const input = this.input.current;
		input.value = this.props.value;
		input.select();
		input.focus();
	}

	/**
	 * Renders the input
	 */
	render() {
		return <input type='text' spellCheck='false' onBlur={this.handleBlur} onKeyDown={e => this.handleKeyDown(e)} ref={this.input}/>
	}
}

export default AutoFocusInput;