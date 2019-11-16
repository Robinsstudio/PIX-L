import React, { Component } from 'react';
import Modals from './Modals';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Col, Collapse, InputGroup, InputGroupAddon, InputGroupText, Input, Label } from 'reactstrap';
import QuestionEditor from './QuestionEditor';
import AutoCompleteInput from './AutoCompleteInput';
import request from './request';

class QuestionModal extends Component {
	constructor(props) {
		super(props);

		this.updateQuestion = this.updateQuestion.bind(this);
		this.updateFeedback = this.updateFeedback.bind(this);
		this.updateMinutes = this.updateMinutes.bind(this);
		this.updateSeconds = this.updateSeconds.bind(this);
		this.updatePoints = this.updatePoints.bind(this);
		this.updateLinkedQuestion = this.updateLinkedQuestion.bind(this);
		this.handleLinkedQuestionBlur = this.handleLinkedQuestionBlur.bind(this);
		this.addAnswer = this.addAnswer.bind(this);
	}

	updateQuestion(label) {
		const { data, update } = this.props;
		update({ ...data, label});
	}

	updateFeedback(event) {
		const { data, update } = this.props;
		update({ ...data, feedback: event.target.value });
	}

	updateAnswerFeedback(event, index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, feedback: { ...(ans.feedback), label: event.target.value } } : ans) });
	}

	setAnswerFeedbackVisible(visible, index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, feedback: { ...(ans.feedback), visible } } : ans) });
	}

	updateAnswer(event, index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, label: event.target.value } : ans) });
	}

	addAnswer() {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.concat({ label: '', correct: false, feedback: { visible: false, label: '' } }) });
	}

	removeAnswer(index) {
		const { data, update } = this.props;
		update({ ...data,  answers: data.answers.filter((ans, i) => i !== index) });
	}

	setAnswerCorrect(event, index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, correct: event.target.checked } : ans) });
	}

	updateMinutes(event) {
		const { data, update } = this.props;
		const minutes = parseInt(event.target.value) || 0;
		update({ ...data, time: minutes * 60 + data.time % 60 });
	}

	updateSeconds(event) {
		const { data, update } = this.props;
		const seconds = parseInt(event.target.value) || 0;
		update({ ...data, time: data.time - data.time % 60 + seconds });
	}

	updatePoints(event) {
		const { data, update } = this.props;
		const points = parseInt(event.target.value) || 0;
		update({ ...data, points });
	}

	updateLinkedQuestion(linkedQuestion) {
		const { data, update } = this.props;
		update({ ...data, linkedQuestion });
	}

	loadHints(start) {
		return request('/GetQuestionNamesStartingWith', { start }).then(res => res.json());
	}

	handleLinkedQuestionBlur() {
		if (typeof this.props.data.linkedQuestion === 'string') {
			this.updateLinkedQuestion('');
		}
	}

	onConfirm(data) {
		const { hide, promise: { resolve } } = this.props;
		if (data.name) {
			resolve(data);
			hide();
		} else {
			Modals.showPromptModal('Nouvelle question', 'Saississez un nom de question ici...').then(name => {
				resolve({ ...data, name });
				hide();
			}).catch(() => {});
		}
	}

	onCancel(data) {
		const { hide, promise: { reject } } = this.props;
		reject(data);
		hide();
	}

	render() {
		const { open, data } = this.props;
		return (
			<Modal isOpen={open} toggle={e => this.onCancel(data)} size="lg">
				<ModalHeader>Saisir une question</ModalHeader>
				<ModalBody>
					<QuestionEditor updateQuestion={this.updateQuestion} initialValue={data.label}/>
					{data.answers.map((ans, index, array) => {
						return (
							<div onFocus={() => this.setAnswerFeedbackVisible(true, index)} onBlur={() => this.setAnswerFeedbackVisible(false, index)}>
								<InputGroup className={`${index === array.length - 1 || ans.feedback.visible ? 'mb-3' : ''} mt-3`}>
									<InputGroupAddon addonType="prepend">
										<InputGroupText>
											<Input addon type="checkbox" checked={ans.correct} onChange={e => this.setAnswerCorrect(e, index)}/>
										</InputGroupText>
									</InputGroupAddon>
									<Input className="mr-3" type="text" placeholder="Saisissez votre réponse ici" spellCheck="false" value={ans.label} onChange={e => this.updateAnswer(e, index)}/>
									<Button color="danger" onClick={e => this.removeAnswer(index)}>
										<i className="fas fa-times"/>
									</Button>
								</InputGroup>
								<Collapse isOpen={ans.feedback.visible}>
									<Input type="textarea" onChange={e => this.updateAnswerFeedback(e, index)} value={ans.feedback.label} placeholder="Saisissez le feedback de votre réponse ici"/>
								</Collapse>
							</div>
						);
					})}

					<InputGroup className="justify-content-center">
						<Button onClick={this.addAnswer} color="success" className="mt-3 mb-3">
							<i className="fas fa-plus"/>
						</Button>
					</InputGroup>

					<Input type="textarea" value={data.feedback} onChange={this.updateFeedback} placeholder="Saisissez le feedback de votre question ici" className="mt-3"/>

					<AutoCompleteInput
						loadHints={this.loadHints}
						value={data.linkedQuestion || ''}
						onChange={this.updateLinkedQuestion}
						onBlur={this.handleLinkedQuestionBlur}
						toString={question => question.name}
						component={Input}
						collapseOnEnter
						placeholder="Saisissez les premières lettres du nom de votre question liée ici"
						className="mt-3"
					/>

					<InputGroup className="justify-content-start align-items-center mt-3">
						<Col xs="2" className="pl-0">
							<Input type="number" min="0" value={(data.time - data.time % 60) / 60} onChange={this.updateMinutes}/>
						</Col>
						minutes
						<Col xs="2">
							<Input type="number" min="0" value={data.time % 60} onChange={this.updateSeconds}/>
						</Col>
						secondes
					</InputGroup>

					<InputGroup className="justify-content-start align-items-center mt-3">
						<Col xs="2" className="pl-0">
							<Input type="number" min="1" max="3" value={data.points} onChange={this.updatePoints}/>
						</Col>
						points
					</InputGroup>
				</ModalBody>
				<ModalFooter>
					<Button color="primary" onClick={e => this.onConfirm(data)}>Enregistrer</Button>
					<Button color="secondary" onClick={e => this.onCancel(data)}>Annuler</Button>
				</ModalFooter>
			</Modal>
		);
	}
}

export default QuestionModal;