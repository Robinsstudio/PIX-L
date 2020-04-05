import React, { Component } from 'react';
import { Alert, Button } from 'reactstrap';
import Modals from './Modals';
import request from './request';

/**
 * This view is the game editor.
 * It offers drag and drop features to create games.
 */
class EditorView extends Component {
	constructor(props) {
		super(props);

		this.removeQuestion = this.removeQuestion.bind(this);
		this.save = this.save.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
		this.handleDragOver = this.handleDragOver.bind(this);
		this.handleDragLeave = this.handleDragLeave.bind(this);
		this.handleDragStart = this.handleDragStart.bind(this);
	}

	/**
	 * Adds the specified questions to the game at the specified index.
	 *
	 * @param {Array} questions - the questions to add
	 * @param {number} index - the index where to start adding the questions
	 */
	addQuestions(questions, index) {
		const { editor, update } = this.props;

		update({
			...editor,
			questions: [...editor.questions.slice(0, index), ...questions, ...editor.questions.slice(index)]
		});
	}

	/**
	 * Removes a question from the game.
	 *
	 * @param {number} index - the index of the question
	 */
	removeQuestion(index) {
		const { editor, update } = this.props;
		update({
			...editor,
			questions: editor.questions.filter((quest, i) => i !== index)
		});
	}

	/**
	 * Saves the game.
	 */
	save() {
		const { editor, save } = this.props;
		if (editor.game.name) {
			save(editor.game.name);
		} else {
			Modals.showPromptModal('Nouveau jeu', 'Entrez un nom ici...').then(name => save(name)).catch(() => {});
		}
	}

	/**
	 * Processes a drop event.
	 *
	 * This method allows two use cases:
	 *
	 * - Dragging a question from the ExplorerView to the EditorView.
	 * It allows adding questions to a game very easily.
	 *
	 * - Dragging a folder from the ExplorerView to the EditorView.
	 * It allows adding all questions from a folder and its subfolders.
	 *
	 * - Reordering questions in the EditorView.
	 *
	 * @param {DragEvent} event - the drop event
	 */
	handleDrop(event) {
		const { editor, update } = this.props;
		const index = parseInt(event.target.dataset.index);

		if (event.dataTransfer.types.includes('question')) {
			const question = JSON.parse(event.dataTransfer.getData('question'));

			if (!editor.questions.some(quest => question._id === quest._id)) {
				this.addQuestions([question], index);
			}

		} else if (event.dataTransfer.types.includes('srcindex')) {
			const questions = editor.questions.slice();
			const srcIndex = parseInt(event.dataTransfer.getData('srcindex'));
			const dstIndex = srcIndex < index ? index - 1 : index;

			questions.splice(dstIndex, 0, questions.splice(srcIndex, 1)[0]);
			update({ ...editor, questions });

		} else if (event.dataTransfer.types.includes('folder')) {
			const folder = JSON.parse(event.dataTransfer.getData('folder'));
			request('GetQuestionsByIdParent', { idParent: folder._id })
			.then(r => r.json())
			.then(questions => this.addQuestions(questions, index));
		}
		event.target.classList.remove('dropZone');
	}

	/**
	 * Processes a drag over event.
	 *
	 * Displays a drop zone that indicates to the user where the question/folder will be dropped.
	 *
	 * @param {DragEvent} event - the drag over event
	 */
	handleDragOver(event) {
		if (event.dataTransfer.types.some(e => ['question', 'srcindex', 'folder'].includes(e))) {
			event.target.classList.add('dropZone');
		}
		event.preventDefault();
	}

	/**
	 * Processes a drag leave event
	 *
	 * Removes the drop zone.
	 *
	 * @param {DragEvent} event - the drag event
	 */
	handleDragLeave(event) {
		event.target.classList.remove('dropZone');
	}

	/**
	 * Starts dragging a question.
	 *
	 * It uses the drag and drop API to store the index of the question which will be reordered.
	 *
	 * @param {DragEvent} event - the drag start event
	 * @param {number} index - the index of the question
	 */
	handleDragStart(event, index) {
		event.dataTransfer.setData('srcindex', index);
	}

	/**
	 * Builds the drop zone as a blue rectangle.
	 *
	 * @param {number} index - the new index of the question if it is dropped
	 * @param {boolean} stretch - true if the drop zone is below the last question, false otherwise
	 */
	buildDropZone(index, stretch = '') {
		return <div data-index={index} className={`mt-2 mb-2 ml-3 mr-3 ${stretch} separator`} onDrop={this.handleDrop} onDragOver={this.handleDragOver} onDragLeave={this.handleDragLeave}/>;
	}

	/**
	 * Renders the EditorView with its header and its questions.
	 */
	render() {
		const { editor, close } = this.props;
		return (
			<div id="editor" className={`view ${editor.visible ? 'visible' : ''}`}>
				<div id="editorHeader" className="header">
					<span className="ml-3">Éditer un jeu</span>
					<div id="buttons" className="mr-3">
						<Button color="primary" className="mr-2" onClick={this.save}>Enregistrer</Button>
						<Button color="secondary" onClick={close}>Annuler</Button>
					</div>
				</div>

				<div id="questions" className="scrollable">
					{editor.questions.map((quest, index) => {
						return [
							this.buildDropZone(index),
							<Alert color="primary" className="ml-3 mr-3 mb-0" toggle={() => this.removeQuestion(index)} onDragStart={e => this.handleDragStart(e, index)} fade={false} draggable>{quest.name}</Alert>
						];
					}).concat(this.buildDropZone(editor.questions.length, 'stretch'))}
				</div>
			</div>
		);
	}
}

export default EditorView;