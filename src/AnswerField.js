import React, { Component } from 'react';
import { Button, Collapse } from 'reactstrap';
import TextEditor from './TextEditor';
import './style/answer_field.css';

class AnswerField extends Component {
	constructor(props) {
		super(props);

		this.handleBlur = this.handleBlur.bind(this);
	}

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