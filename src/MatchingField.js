import React, { Component } from 'react';
import { InputGroup, Input, Button, Collapse } from 'reactstrap';

/**
 * This component creates a matching field in a matching question.
 *
 * Similarly to the AnswerField component, it is an expandable text editor.
 * The main difference is that this component can contain as many nested text inputs as desired.
 * Those inputs can be freely added and removed by the user.
 *
 * During a session with the teams of students, a matching field will be shown as a dropdown.
 * The dropdown will contain all nested text input values.
 *
 * The main text editor will be used as a label next to the dropdown.
 */
class MatchingField extends Component {
	/**
	 * Focuses this matching field.
	 * This results in expanding all nested text inputs.
	 *
	 * @param {number} index - the index of this matching field
	 */
	setMatchingFieldFocused(index) {
		const { field, updateMatchingField } = this.props;
		if (!field.focused) {
			updateMatchingField({ focused: true }, index);
		}
	}

	/**
	 * Blurs this matching field.
	 * This results in collapsing all nested text inputs.
	 *
	 * @param {FocusEvent} event - the blur event
	 * @param {number} index - the index of this matching field
	 */
	setMatchingFieldUnfocused(event, index) {
		const { props: { updateMatchingField }, refs: { focusManager } } = this;
		if (!focusManager.contains(event.relatedTarget)) {
			updateMatchingField({ focused: false }, index);
		}
	}

	/**
	 * Updates the label of this matching field.
	 *
	 * @param {Event} event - the change event
	 * @param {number} index - the index of this matching field
	 */
	setMatchingFieldLabel(event, index) {
		const { updateMatchingField } = this.props;
		updateMatchingField({ label: event.target.value }, index);
	}

	/**
	 * Adds an answer to this matching field.
	 *
	 * @param {number} index - the index of this matching field
	 */
	addAnswerToMatchingField(index) {
		const { field, updateMatchingField } = this.props;
		const answers = field.answers.concat({ label: '', correct: false });
		updateMatchingField({ answers }, index);
	}

	/**
	 * Removes an answer from this matching field.
	 *
	 * @param {number} fieldIndex - the index of this matching field
	 * @param {number} answerIndex - the index of the answer in this matching field
	 */
	removeAnswerFromMatchingField(fieldIndex, answerIndex) {
		const { props: { field, updateMatchingField }, refs: { matchingFieldInput } } = this;
		const answers = field.answers.filter((_,i) => i !== answerIndex);
		updateMatchingField({ answers }, fieldIndex);
		matchingFieldInput.focus();
	}

	/**
	 * Updates the answer at the specified index in this matching field.
	 *
	 * @param {Event} event - the change event
	 * @param {number} fieldIndex - the index of this matching field
	 * @param {number} answerIndex - the index of the answer in this matching field
	 */
	updateAnswerFromMatchingField(event, fieldIndex, answerIndex) {
		const { field, updateMatchingField } = this.props;
		const answers = field.answers.map((answer,i) => (i === answerIndex) ? { ...answer, label: event.target.value } : answer);
		updateMatchingField({ answers }, fieldIndex);
	}

	/**
	 * Toggles the correctness of the answer at the specified index in this matching field.
	 *
	 * @param {number} fieldIndex - the index of this matching field
	 * @param {number} answerIndex - the index of the answer in this matching field
	 */
	toggleAnswerFromMatchingFieldCorrect(fieldIndex, answerIndex) {
		const { field, updateMatchingField } = this.props;
		const answers = field.answers.map((answer,i) => (i === answerIndex) ? { ...answer, correct: !answer.correct } : answer);
		updateMatchingField({ answers }, fieldIndex);
	}

	/**
	 * Renders the MatchingField.
	 */
	render() {
		const {
			field,
			index,
			removeMatchingField
		} = this.props;
		return (
			<div onFocus={() => this.setMatchingFieldFocused(index)} onBlur={e => this.setMatchingFieldUnfocused(e, index)} ref="focusManager">
				<InputGroup className="align-items-center mb-3">
					<input
						type="text"
						placeholder="Saisissez votre sous-question ici"
						onChange={e => this.setMatchingFieldLabel(e, index)}
						value={field.label}
						className="form-control"
						ref="matchingFieldInput"
					/>
					<Button color="danger" className="delete ml-3" onClick={() => removeMatchingField(index)}>
						<i className="fas fa-times"/>
					</Button>
				</InputGroup>
				<Collapse isOpen={field.focused}>
					{field.answers.map((answer, i) => {
						return (
							<InputGroup className="mb-3">
								<div onClick={() => this.toggleAnswerFromMatchingFieldCorrect(index, i)} className="checkbox mr-3" tabIndex="-1">
									<input type="checkbox" checked={answer.correct} readOnly/>
								</div>
								<Input
									type="text"
									placeholder="Saisissez votre réponse ici"
									onChange={e => this.updateAnswerFromMatchingField(e, index, i)}
									value={answer.label}
								/>
								<Button color="danger" className="delete ml-3" onClick={() => this.removeAnswerFromMatchingField(index, i)}>
									<i className="fas fa-times"/>
								</Button>
							</InputGroup>
						);
					})}

					<InputGroup className="justify-content-center">
						<Button onClick={() => this.addAnswerToMatchingField(index)} color="success" className="mb-3">
							<i className="fas fa-plus"/>
						</Button>
					</InputGroup>
				</Collapse>
			</div>
		);
	}
}

export default MatchingField;