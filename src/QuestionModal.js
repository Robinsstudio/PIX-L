import React, { Component } from 'react';
import Modals from './Modals';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Col, InputGroup, Input } from 'reactstrap';
import TextEditor from './TextEditor';
import AutoCompleteInput from './AutoCompleteInput';
import request from './request';
import AnswerField from './AnswerField';

/* https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript */
function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		//eslint-disable-next-line
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

class QuestionModal extends Component {
	constructor(props) {
		super(props);

		this.updateQuestion = this.updateQuestion.bind(this);
		this.updateAnswer = this.updateAnswer.bind(this);
		this.updateFeedback = this.updateFeedback.bind(this);
		this.updateMinutes = this.updateMinutes.bind(this);
		this.updateSeconds = this.updateSeconds.bind(this);
		this.updatePoints = this.updatePoints.bind(this);
		this.updateLinkedQuestion = this.updateLinkedQuestion.bind(this);
		this.handleLinkedQuestionBlur = this.handleLinkedQuestionBlur.bind(this);
		this.setAnswerFocused = this.setAnswerFocused.bind(this);
		this.toggleAnswerCorrect = this.toggleAnswerCorrect.bind(this);
		this.addAnswer = this.addAnswer.bind(this);
		this.removeAnswer = this.removeAnswer.bind(this);
	}

	updateQuestion(label) {
		const { data, update } = this.props;
		update({ ...data, label});
	}

	updateFeedback(feedback) {
		const { data, update } = this.props;
		update({ ...data, feedback });
	}

	setAnswerFocused(index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, focused: true } : ans) });
	}

	updateAnswer(label, feedback, index) {
		const { data, update } = this.props;
		const answer = {};

		if (label) {
			answer.label = label;
		}

		if (feedback) {
			answer.feedback = feedback;
		}

		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, ...answer, focused: false } : ans) });
	}

	addAnswer() {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.concat({ key: uuidv4(), correct: false }) });
	}

	removeAnswer(index) {
		const { data, update } = this.props;
		update({ ...data,  answers: data.answers.filter((ans, i) => i !== index) });
	}

	toggleAnswerCorrect(index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, correct: !ans.correct } : ans) });
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
		const points = parseFloat(event.target.value) || 0;
		update({ ...data, points });
	}

	updateLinkedQuestion(linkedQuestion) {
		const { data, update } = this.props;
		update({ ...data, linkedQuestion });
	}

	loadHints(start) {
		return request('GetQuestionNamesStartingWith', { start }).then(res => res.json());
	}

	handleLinkedQuestionBlur() {
		if (typeof this.props.data.linkedQuestion === 'string') {
			this.updateLinkedQuestion(null);
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
					<TextEditor onChange={this.updateQuestion} initialValue={data.label} placeholder="Saisissez votre question ici"/>
					{data.answers.map((answer, index, array) => {
						return (
							<AnswerField
								updateAnswer={this.updateAnswer}
								removeAnswer={this.removeAnswer}
								toggleAnswerCorrect={this.toggleAnswerCorrect}
								setAnswerFocused={this.setAnswerFocused}
								answer={answer}
								index={index}
								array={array}
								key={answer.key || answer._id}
							/>
						);
					})}

					<InputGroup className="justify-content-center">
						<Button onClick={this.addAnswer} color="success" className="mt-3 mb-3">
							<i className="fas fa-plus"/>
						</Button>
					</InputGroup>

					<TextEditor onChange={this.updateFeedback} initialValue={data.feedback} placeholder="Saisissez le feedback de votre question ici"/>

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
							<Input type="number" min="1" max="3" step="0.1" value={data.points} onChange={this.updatePoints}/>
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