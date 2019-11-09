import React, { Component } from 'react';
import Modals from './Modals';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Collapse, InputGroup, InputGroupAddon, InputGroupText, Input } from 'reactstrap';
import CodeMirror from 'react-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/addon/display/placeholder';

class QuestionModal extends Component {
	constructor(props) {
		super(props);

		this.codeMirror = React.createRef();

		this.updateQuestion = this.updateQuestion.bind(this);
		this.updateFeedback = this.updateFeedback.bind(this);
		this.addAnswer = this.addAnswer.bind(this);
		this.updateTags = this.updateTags.bind(this);
		this.toggle = this.toggle.bind(this);
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

	updateTags(tags) {
		const { data, update } = this.props;
		update({ ...data, tags });
	}

	toggle() {
		const { data, update } = this.props;
		setTimeout(() => this.codeMirror.current.getCodeMirror().refresh(), 20);
		update({ ...data, expand: !data.expand });
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
					<CodeMirror
						value={data.label}
						onChange={this.updateQuestion}
						options={{ mode: 'text/x-markdown', placeholder: 'Saisissez votre question...', indentUnit: 4, indentWithTabs: true }}
						className="border mb-3"
						ref={this.codeMirror}
					/>
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