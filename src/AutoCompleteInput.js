import React, { Component } from 'react';

/**
 * This component is an input with autocomplete functionality as the user types.
 */
class AutoCompleteInput extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hints: [],
			activeHint: -1
		};

		this.handleChange = this.handleChange.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.clearHints = this.clearHints.bind(this);
	}

	/**
	 * Hides hints.
	 */
	clearHints() {
		this.setState({ hints: [], activeHint: -1 });
	}

	/**
	 * When the text is changed, an async call is performed to the loadHints prop.
	 * This async function returns the hints to be displayed as suggestions to what the user types.
	 *
	 * @param {Event} event - the change event
	 */
	handleChange(event) {
		const { value } = event.target;
		const { loadHints } = this.props;
		this.setState({ activeHint: -1, initialValue: value });
		loadHints(value).then(hints => this.setState({ hints: hints.sort((h1, h2) => {
			return this.buildString(h1).localeCompare(this.buildString(h2));
		}) }));
		this.fireOnChange(value);
	}

	/**
	 * If the key pressed is either ArrowUp or ArrowDown, it highlights the above or below hint in the dropdown menu.
	 *
	 * @param {KeyboardEvent} event - the keydown event
	 */
	handleKeyDown(event) {
		if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
			const { props: { value }, state: { hints, activeHint, initialValue } } = this;
			const newActiveHint = (event.key === 'ArrowDown') ?
				Math.min(activeHint + 1, hints.length - 1) : Math.max(activeHint - 1, -1);

			this.setState({
				activeHint: newActiveHint,
				initialValue: activeHint === -1 ? value : initialValue
			}, () => {
				const { hints, activeHint, initialValue } = this.state;
				this.fireOnChange(activeHint === -1 ? initialValue : hints[activeHint]);
			});

			event.preventDefault();
		} else if (this.props.collapseOnEnter && event.key === 'Enter') {
			this.clearHints();
		}
		this.fireOnKeyDown(event);
	}

	/**
	 * Highlights the hint at the specified index.
	 *
	 * @param {number} index - the index of the hint
	 */
	handleMouseEnter(index) {
		const { hints } = this.state;
		this.setState({ activeHint: index });
		this.fireOnChange(hints[index]);
	}

	/**
	 * Hides hints when the input loses focus.
	 *
	 * @param {FocusEvent} event - the blur event
	 */
	handleBlur(event) {
		this.clearHints();
		this.fireOnBlur(event);
	}

	/**
	 * Forwards props to the nested input element.
	 */
	forwardProps() {
		const selfProps = [ 'loadHints', 'toString', 'component', 'collapseOnEnter'];
		const forwardingProps = {};

		Object.entries(this.props).forEach(prop => {
			if (!selfProps.includes(prop[0])) {
				forwardingProps[prop[0]] = prop[1];
			}
		});

		return forwardingProps;
	}

	/**
	 * Fires a synthetic change event with the entered text.
	 *
	 * @param {string} value - the text of the input
	 */
	fireOnChange(value) {
		const { onChange } = this.props;
		if (typeof onChange === 'function') {
			onChange(value);
		}
	}

	/**
	 * Fires a synthetic keydown event.
	 *
	 * @param {KeyboardEvent} event - the keydown event
	 */
	fireOnKeyDown(event) {
		const { onKeyDown } = this.props;
		if (typeof onKeyDown === 'function') {
			onKeyDown(event);
		}
	}

	/**
	 * Fires a synthetic blur event.
	 *
	 * @param {FocusEvent} event - the blur event
	 */
	fireOnBlur(event) {
		const { onBlur } = this.props;
		if (typeof onBlur === 'function') {
			onBlur(event);
		}
	}

	/**
	 * Builds the nested input element.
	 */
	buildInputComponent() {
		const { component, value } = this.props;
		return React.createElement(component || 'input', {
			...this.forwardProps(),
			value: this.buildString(value),
			onChange: this.handleChange,
			onKeyDown: this.handleKeyDown,
			onBlur: this.handleBlur,
			spellCheck: "false"
		});
	}

	/**
	 * Builds a string for the specified hint.
	 * If the value is a string, it is simply returned.
	 * Otherwise, the function toString provided in the props is called.
	 *
	 * @param {String|Object} value - the value to stringify
	 */
	buildString(value) {
		const { toString } = this.props;
		if (typeof value !== 'string' && typeof toString === 'function') {
			return toString(value);
		}
		return value;
	}

	/**
	 * Renders the AutoCompleteInput.
	 */
	render() {
		const { hints, activeHint } = this.state;
		return (
			<div className="autocomplete">
				{ this.buildInputComponent() }
				{ hints.length > 0 &&
					<div className="menu">
						{ hints.map((hint, index) => {
							return (
								<div
									className={(index === activeHint) ? 'active' : ''}
									onMouseEnter={() => this.handleMouseEnter(index)}
								>{ this.buildString(hint) }</div>
							);
						}) }
					</div>
				}
			</div>
		);
	}
}

export default AutoCompleteInput;