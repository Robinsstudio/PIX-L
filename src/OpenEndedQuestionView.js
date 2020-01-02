import React, { Component, Fragment } from 'react';
import TextEditor from './TextEditor';
import TagInput from './TagInput';

class OpenEndedQuestionView extends Component {
	render() {
		const {
			data,
			updateQuestion,
			updateWords,
			updatePositiveFeedback,
			updateNegativeFeedback,
		} = this.props;
		return (
			<Fragment>
				<TextEditor onChange={updateQuestion} initialValue={data.label} placeholder="Saisissez votre question ici"/>
				<TagInput onChange={updateWords} tags={data.words}/>
				<TextEditor onChange={updatePositiveFeedback} initialValue={data.positiveFeedback} placeholder="Saisissez votre feedback positif ici" className="mt-3"/>
				<TextEditor onChange={updateNegativeFeedback} initialValue={data.negativeFeedback} placeholder="Saisissez votre feedback négatif ici" className="mt-3"/>
			</Fragment>
		);
	}
}

export default OpenEndedQuestionView;