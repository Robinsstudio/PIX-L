import React, { Component } from 'react';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import EditorDecorator from './EditorDecorator';

/**
 * This component renders text formatted with DraftJS.
 * It is used to render questions, answers and feedbacks in the StudentView.
 */
class TextRenderer extends Component {
	constructor(props) {
		super(props);

		const decorator = new EditorDecorator();

		this.state = {
			editorState: props.initialValue && props.initialValue.length
				? EditorState.createWithContent(convertFromRaw(JSON.parse(this.setNonBreakingSpaces(this.props.initialValue))), decorator)
				: EditorState.createEmpty(decorator)
		};
	}

	/**
	 * Replaces regular spaces with non-breaking spaces before or after specific punctuation marks.
	 *
	 * @param {string} label
	 */
	setNonBreakingSpaces(label) {
		return !label ? label : label
			.replace(/\s(\?|!|;|:|»)/g, '\u00a0$1')
			.replace(/(«)\s/g, '$1\u00a0');
	}

	/**
	 * Renders the text with a read-only DraftJS editor.
	 */
	render() {
		const { editorState } = this.state;

		return (
			<div className="textRenderer">
				<Editor
					editorState={editorState}
					readOnly={true}
				/>
			</div>
		);
	}
}

export default TextRenderer;