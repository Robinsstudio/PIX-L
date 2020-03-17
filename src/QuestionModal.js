import React, { Component } from 'react';
import Modals from './Modals';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, InputGroup } from 'reactstrap';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import MultipleChoiceQuestionView from './MultipleChoiceQuestionView';
import OpenEndedQuestionView from './OpenEndedQuestionView';
import QuestionUtils from './QuestionUtils';
import QuestionFooterView from './QuestionFooterView';
import MatchingQuestionView from './MatchingQuestionView';

import './style/question_modal.css';

/* https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript */
function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		//eslint-disable-next-line
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/**
 * This component is a modal which allows the user to edit questions.
 * Three types of questions can be created:
 *
 * - Multiple choice questions
 * - Open-ended questions
 * - Matching field questions
 */
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
		this.updateTheme = this.updateTheme.bind(this);
		this.updateExactMatch = this.updateExactMatch.bind(this);
		this.updateWords = this.updateWords.bind(this);
		this.updatePositiveFeedback = this.updatePositiveFeedback.bind(this);
		this.updateNegativeFeedback = this.updateNegativeFeedback.bind(this);
		this.updateMatchingField = this.updateMatchingField.bind(this);
		this.setAnswerFocused = this.setAnswerFocused.bind(this);
		this.toggleAnswerCorrect = this.toggleAnswerCorrect.bind(this);
		this.addAnswer = this.addAnswer.bind(this);
		this.removeAnswer = this.removeAnswer.bind(this);
		this.addMatchingField = this.addMatchingField.bind(this);
		this.removeMatchingField = this.removeMatchingField.bind(this);
		this.buildMultipleChoiceQuestionView = this.buildMultipleChoiceQuestionView.bind(this);
		this.buildOpenEndedQuestionView = this.buildOpenEndedQuestionView.bind(this);
		this.buildMatchingQuestionView = this.buildMatchingQuestionView.bind(this);

		this.TYPES = {
			multipleChoice: {
				label: 'Question à choix multiple',
				getView: this.buildMultipleChoiceQuestionView,
				create: QuestionUtils.createMultipleChoiceQuestion
			},
			openEnded: {
				label: 'Question à réponse libre',
				getView: this.buildOpenEndedQuestionView,
				create: QuestionUtils.createOpenEndedQuestion
			},
			matching: {
				label: 'Question à appariements',
				getView: this.buildMatchingQuestionView,
				create: QuestionUtils.createMatchingQuestion
			}
		};
	}

	/**
	 * Updates the label of the question.
	 *
	 * @param {string} label - the label of the question
	 */
	updateQuestion(label) {
		const { data, update } = this.props;
		update({ ...data, label});
	}

	/**
	 * Updates the general feedback of the question.
	 *
	 * @param {string} feedback - the general feedback of the question
	 */
	updateFeedback(feedback) {
		const { data, update } = this.props;
		update({ ...data, feedback });
	}

	/**
	 * Focuses the answer at the specified index.
	 * This is used for multiple choice questions only.
	 *
	 * @param {number} index - the index of the answer to focus
	 */
	setAnswerFocused(index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, focused: true } : ans) });
	}

	/**
	 * Updates the answer at the specified index.
	 * This is used for multiple choice questions only.
	 *
	 * @param {string} label - the label of the answer to update
	 * @param {string} feedback - the feedback specific to the answer
	 * @param {number} index - the index of the answer
	 */
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

	/**
	 * Adds an answer to the question.
	 * This is used for multiple choice questions only.
	 */
	addAnswer() {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.concat({ key: uuidv4(), correct: false }) });
	}

	/**
	 * Removes an answer from the question.
	 * This is used for multiple choice questions only.
	 *
	 * @param {number} index - the index of the answer
	 */
	removeAnswer(index) {
		const { data, update } = this.props;
		update({ ...data,  answers: data.answers.filter((ans, i) => i !== index) });
	}

	/**
	 * Toggles the correctness of the answer at the specified index.
	 * This is used for multiple choice questions only.
	 *
	 * @param {number} index - the index of the answer
	 */
	toggleAnswerCorrect(index) {
		const { data, update } = this.props;
		update({ ...data, answers: data.answers.map((ans, i) => (i === index) ? { ...ans, correct: !ans.correct } : ans) });
	}

	/**
	 * Updates the number of minutes that teams will have to answer the question.
	 *
	 * @param {Event} event - the change event
	 */
	updateMinutes(event) {
		const { data, update } = this.props;
		const minutes = parseInt(event.target.value) || 0;
		update({ ...data, time: minutes * 60 + data.time % 60 });
	}

	/**
	 * Updates the number of seconds that teams will have to answer the question.
	 *
	 * @param {Event} event - the change event
	 */
	updateSeconds(event) {
		const { data, update } = this.props;
		const seconds = parseInt(event.target.value) || 0;
		update({ ...data, time: data.time - data.time % 60 + seconds });
	}

	/**
	 * Updates the number of points that teams will have to answer the question.
	 *
	 * @param {Event} event - the change event
	 */
	updatePoints(event) {
		const { data, update } = this.props;
		const points = parseFloat(event.target.value) || 0;
		update({ ...data, points });
	}

	/**
	 * Updates the linked question of the current question.
	 *
	 * @param {Object} linkedQuestion - the linked question of the current question
	 */
	updateLinkedQuestion(linkedQuestion) {
		const { data, update } = this.props;
		update({ ...data, linkedQuestion });
	}

	/**
	 * Updates the theme of the question.
	 *
	 * @param {string} theme - the theme of the question
	 */
	updateTheme(theme) {
		const { data, update } = this.props;
		update({ ...data, theme });
	}

	/**
	 * Updates if the keyword typed by a team should match exactly one of the keywords of the question.
	 *
	 * @param {Event} event - the change event
	 */
	updateExactMatch(event) {
		const { data, update } = this.props;
		update({ ...data, exactMatch: event.target.checked });
	}

	/**
	 * Updates the keywords of the question.
	 * This is used for open-ended questions only.
	 *
	 * @param {Array} words
	 */
	updateWords(words) {
		const { data, update } = this.props;
		update({ ...data, words });
	}

	/**
	 * Updates the positive feedback to display if a team answers correctly an open-ended question.
	 * This is used for open-ended questions only.
	 *
	 * @param {string} positiveFeedback - the positive feedback
	 */
	updatePositiveFeedback(positiveFeedback) {
		const { data, update } = this.props;
		update({ ...data, positiveFeedback });
	}

	/**
	 * Updates the negative feedback to display if a team answers incorrectly an open-ended question.
	 * This is used for open-ended questions only.
	 *
	 * @param {string} negativeFeedback - the negative feedback
	 */
	updateNegativeFeedback(negativeFeedback) {
		const { data, update } = this.props;
		update({ ...data, negativeFeedback });
	}

	/**
	 * Updates the matching field at the specified index.
	 * This is used for matching field questions only.
	 *
	 * @param {Object} matchingField - the matching field to update
	 * @param {number} index - the index of the matching field
	 */
	updateMatchingField(matchingField, index) {
		const { data, update } = this.props;
		update({ ...data, matchingFields: data.matchingFields.map((field, i) => i === index ? { ...field, ...matchingField } : field)});
	}

	/**
	 * Adds a matching field to the question.
	 * This is used for matching field questions only.
	 */
	addMatchingField() {
		const { data, update } = this.props;
		update({ ...data, matchingFields: data.matchingFields.concat({ key: uuidv4(), label: '', answers: [] }) });
	}

	/**
	 * Removes the matching field at the specified index.
	 * This is used for matching field questions only.
	 *
	 * @param {number} index - the index of the matching field
	 */
	removeMatchingField(index) {
		const { data, update } = this.props;
		update({ ...data, matchingFields: data.matchingFields.filter((_,i) => i !== index) });
	}

	/**
	 * Updates the type of the current question.
	 *
	 * @param {string} questionType - the type of the question
	 */
	updateQuestionType(questionType) {
		const { props: { data, update }, TYPES } = this;
		if (questionType !== data.questionType) {
			const question = TYPES[questionType].create(data.idParent);
			update({
				...question,
				_id: data._id,
				name: data.name,
				theme: data.theme,
				linkedQuestion: data.linkedQuestion,
				time: data.time,
				points: data.points
			});
		}
	}

	/**
	 * Called when the user presses the save button.
	 *
	 * @param {Object} data - the question data
	 */
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

	/**
	 * Called when the user presses the cancel button or dismisses the QuestionModal.
	 *
	 * @param {Object} data - the question data
	 */
	onCancel(data) {
		const { hide, promise: { reject } } = this.props;
		reject(data);
		hide();
	}

	/**
	 * Builds the user interface for multiple choice questions.
	 */
	buildMultipleChoiceQuestionView() {
		const { data } = this.props;
		return (
			<MultipleChoiceQuestionView
				data={data}
				updateQuestion={this.updateQuestion}
				updateAnswer={this.updateAnswer}
				removeAnswer={this.removeAnswer}
				toggleAnswerCorrect={this.toggleAnswerCorrect}
				setAnswerFocused={this.setAnswerFocused}
				addAnswer={this.addAnswer}
			/>
		);
	}

	/**
	 * Builds the user interface for open-ended questions.
	 */
	buildOpenEndedQuestionView() {
		const { data } = this.props;
		return (
			<OpenEndedQuestionView
				data={data}
				updateQuestion={this.updateQuestion}
				updateExactMatch={this.updateExactMatch}
				updateWords={this.updateWords}
				updatePositiveFeedback={this.updatePositiveFeedback}
				updateNegativeFeedback={this.updateNegativeFeedback}
			/>
		);
	}

	/**
	 * Builds the user interface for matching field questions.
	 */
	buildMatchingQuestionView() {
		const { data } = this.props;
		return (
			<MatchingQuestionView
				data={data}
				updateQuestion={this.updateQuestion}
				addMatchingField={this.addMatchingField}
				removeMatchingField={this.removeMatchingField}
				updateMatchingField={this.updateMatchingField}
				addAnswerToMatchingField={this.addAnswerToMatchingField}
			/>
		);
	}

	/**
	 * Renders the QuestionModal.
	 */
	render() {
		const { props: { open, data }, TYPES } = this;
		return (
			<Modal isOpen={open} toggle={e => this.onCancel(data)} size="lg">
				<ModalHeader>Saisir une question</ModalHeader>
				<ModalBody>
					<InputGroup className="justify-content-center align-items-center mb-3">
						<UncontrolledDropdown>
							<DropdownToggle caret>
								Type : { TYPES[data.questionType].label }
							</DropdownToggle>
							<DropdownMenu>
								{ Object.entries(TYPES).map(e => <DropdownItem onClick={() => this.updateQuestionType(e[0])}>{e[1].label}</DropdownItem>) }
							</DropdownMenu>
						</UncontrolledDropdown>
					</InputGroup>

					{ TYPES[data.questionType].getView() }

					<QuestionFooterView
						data={data}
						updateFeedback={this.updateFeedback}
						updateLinkedQuestion={this.updateLinkedQuestion}
						updateTheme={this.updateTheme}
						updateMinutes={this.updateMinutes}
						updateSeconds={this.updateSeconds}
						updatePoints={this.updatePoints}
					/>
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