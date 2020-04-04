import React, { Component } from 'react';
import { Button, Collapse } from 'reactstrap';
import TextEditor from './TextEditor';
import './style/answer_field.css';

/**
 * This component is an expandable text editor.
 * When it is focused, it reveals another nested text editor.
 * It is used by the MultipleChoiceQuestionView component for multiple choice questions.
 */
class AnswerField extends Component {
	constructor(props) {
		super(props);

		this.handleBlur = this.handleBlur.bind(this);
	}

	/**
	 * Updates the label and the feedback of the associated answer when this component loses focus.
	 *
	 * @param {FocusEvent} event - the blur event
	 */
	handleBlur(event) {
		const { props: { index, updateAnswer }, refs: { focusManager } } = this;
		if (!focusManager.contains(event.relatedTarget)) {
			const { label } = this;
			this.label = null;

			const { feedback } = this;
			this.feedback = null;

			updateAnswer(label, feedback, index);
		}
	}

	/**
	 * Renders the AnswerField.
	 */
	render() {
		const {
			removeAnswer,
			setAnswerFocused,
			toggleAnswerCorrect,
			answer,
			index,
			array
		} = this.props;

		return (
			<div onFocus={() => setAnswerFocused(index)} onBlur={this.handleBlur} ref="focusManager">
				<div className={`${index === array.length - 1 || answer.focused ? 'mb-3' : ''} mt-3 answerWrapper`}>
					<div onClick={() => toggleAnswerCorrect(index)} className="checkbox mr-3" tabIndex="-1">
						<input type="checkbox" checked={answer.correct} readOnly/>
					</div>
					<TextEditor
						onChange={label => this.label = label}
						initialValue={answer.label}
						placeholder="Saisissez votre réponse ici"
						style={{ flexGrow: '1' }}
					/>
					<Button color="danger" onClick={() => removeAnswer(index)} className="delete ml-3">
						<i className="fas fa-times"/>
					</Button>
				</div>
				<Collapse isOpen={answer.focused}>
					<TextEditor
						onChange={feedback => this.feedback = feedback}
						initialValue={answer.feedback}
						placeholder="Saisissez le feedback de votre réponse ici"
					/>
				</Collapse>
			</div>
		);
	}
}

export default AnswerField;