import React, { Component } from 'react';

/**
 * This component allows the user to create or remove tags.
 * It is used by the OpenEndedQuestionView to create the keywords.
 */
class TagInput extends Component {
	constructor(props) {
		super(props);
		this.state = { input: '' };

		this.add = this.add.bind(this);
		this.remove = this.remove.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);

		this.input = React.createRef();
	}

	/**
	 * Adds a tag.
	 *
	 * @param {string} tag - the tag to add
	 */
	add(tag) {
		const { props: { tags, onChange } } = this;
		this.setState({ input: '' }, () => onChange(tags.concat(tag)) );
	}

	/**
	 * Removes the tag at the specified index.
	 *
	 * @param {number} index - the index of the tag
	 */
	remove(index) {
		const { props: { tags, onChange } } = this;
		onChange(tags.filter((_, i) => i !== index));
	}

	/**
	 * Updates the text input.
	 *
	 * @param {Event} event - the change event
	 */
	handleChange(event) {
		this.setState({ input: event.target.value });
	}

	/**
	 * If the Enter key is pressed, the text input is cleared and a new tag is created with its content.
	 * If the Backspace key is pressed and the text input is empty, then the last tag is removed.
	 *
	 * @param {KeyboardEvent} event - the keydown event
	 */
	handleKeyDown(event) {
		const { props: { tags }, state: { input } } = this;
		if (input.length && ['Enter'].includes(event.key)) {
			this.add(input);
			event.preventDefault();
		} else if (!input.length && event.key === 'Backspace') {
			this.remove(tags.length - 1);
			event.preventDefault();
		}
	}

	/**
	 * Renders the TagInput.
	 */
	render() {
		const { props: { tags }, state: { input } } = this;
		return (
			<div className="tagContainer">
				{ tags.map((tag, index) => {
					return (
						<div className="bg-success tag mr-2">
							<span>{tag}</span>
							<span className="removeTag ml-2" onClick={() => this.remove(index)}>&times;</span>
						</div>
					);
				}) }

				<input
					placeholder="Saisissez un mot-clé ici"
					value={input}
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
					style={{ border: 'none', outline: 'none' }}
					ref={this.input}
				/>
			</div>
		);
	}
}

export default TagInput;