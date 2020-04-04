import React, { Component, Fragment } from 'react';
import TextEditor from './TextEditor';
import TagInput from './TagInput';

/**
 * This component contains the UI elements specific to open-ended questions.
 */
class OpenEndedQuestionView extends Component {
	/**
	 * Renders the OpenEndedQuestionView.
	 */
	render() {
		const {
			data,
			updateQuestion,
			updateExactMatch,
			updateWords,
			updatePositiveFeedback,
			updateNegativeFeedback,
		} = this.props;
		return (
			<Fragment>
				<TextEditor onChange={updateQuestion} initialValue={data.label} placeholder="Saisissez votre question ici"/>
				<div id="exactMatch" className="mt-3 mb-1">
					<input type="checkbox" className="mr-2" onChange={updateExactMatch} checked={!!data.exactMatch}/>
					<span>Correspondance exacte</span>
				</div>
				<TagInput onChange={updateWords} tags={data.words}/>
				<TextEditor onChange={updatePositiveFeedback} initialValue={data.positiveFeedback} placeholder="Saisissez votre feedback positif ici" className="mt-3"/>
				<TextEditor onChange={updateNegativeFeedback} initialValue={data.negativeFeedback} placeholder="Saisissez votre feedback négatif ici" className="mt-3"/>
			</Fragment>
		);
	}
}

export default OpenEndedQuestionView;