import React, { Component } from 'react';
import { InputGroup, Input, Button, Collapse } from 'reactstrap';

class MatchingField extends Component {
	setMatchingFieldFocused(index) {
		const { field, updateMatchingField } = this.props;
		if (!field.focused) {
			updateMatchingField({ focused: true }, index);
		}
	}

	setMatchingFieldUnfocused(event, index) {
		const { props: { updateMatchingField }, refs: { focusManager } } = this;
		if (!focusManager.contains(event.relatedTarget)) {
			updateMatchingField({ focused: false }, index);
		}
	}

	setMatchingFieldLabel(event, index) {
		const { updateMatchingField } = this.props;
		updateMatchingField({ label: event.target.value }, index);
	}

	addAnswerToMatchingField(fieldIndex) {
		const { field, updateMatchingField } = this.props;
		const answers = field.answers.concat({ label: '', correct: false });
		updateMatchingField({ answers }, fieldIndex);
	}

	removeAnswerFromMatchingField(fieldIndex, answerIndex) {
		const { props: { field, updateMatchingField }, refs: { matchingFieldInput } } = this;
		const answers = field.answers.filter((_,i) => i !== answerIndex);
		updateMatchingField({ answers }, fieldIndex);
		matchingFieldInput.focus();
	}

	updateAnswerFromMatchingField(event, fieldIndex, answerIndex) {
		const { field, updateMatchingField } = this.props;
		const answers = field.answers.map((answer,i) => (i === answerIndex) ? { ...answer, label: event.target.value } : answer);
		updateMatchingField({ answers }, fieldIndex);
	}

	toggleAnswerFromMatchingFieldCorrect(fieldIndex, answerIndex) {
		const { field, updateMatchingField } = this.props;
		const answers = field.answers.map((answer,i) => (i === answerIndex) ? { ...answer, correct: !answer.correct } : answer);
		updateMatchingField({ answers }, fieldIndex);
	}

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