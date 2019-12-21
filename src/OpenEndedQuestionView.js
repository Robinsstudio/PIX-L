import React, { Component, Fragment } from 'react';
import TextEditor from './TextEditor';
import TagInput from './TagInput';

class OpenEndedQuestionView extends Component {
	render() {
		const { data, updateQuestion, updateWords } = this.props;
		return (
			<Fragment>
				<TextEditor onChange={updateQuestion} initialValue={data.label} placeholder="Saisissez votre question ici"/>
				<TagInput onChange={updateWords} tags={data.words}/>
			</Fragment>
		);
	}
}

export default OpenEndedQuestionView;