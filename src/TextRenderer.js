import React, { Component } from 'react';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import EditorDecorator from './EditorDecorator';

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

	setNonBreakingSpaces(label) {
		return !label ? label : label
			.replace(/\s(\?|!|;|:|»)/g, '\u00a0$1')
			.replace(/(«)\s/g, '$1\u00a0');
	}

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