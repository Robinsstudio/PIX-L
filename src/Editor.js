import React, { Component } from 'react';
import { Alert, Button } from 'reactstrap';
import Modals from './Modals';

class Editor extends Component {
	constructor(props) {
		super(props);

		this.removeQuestion = this.removeQuestion.bind(this);
		this.save = this.save.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
		this.handleDragOver = this.handleDragOver.bind(this);
		this.handleDragLeave = this.handleDragLeave.bind(this);
		this.handleDragStart = this.handleDragStart.bind(this);
	}

	removeQuestion(index) {
		const { editor, update } = this.props;
		update({ 
			...editor,
			questions: editor.questions.filter((quest, i) => i !== index)
		});
	}

	save() {
		const { editor, folder, save } = this.props;
		if (editor.file) {
			save(editor.file);
		} else {
			Modals.showPromptModal('Nouveau QCM', 'Entrez un nom de QCM ici...').then(file => save(folder.concat(file))).catch(() => {});
		}
	}

	handleDrop(event) {
		const { editor, update } = this.props;
		const index = parseInt(event.target.dataset.index);
		
		if (event.dataTransfer.types.includes('question')) {
			const question = event.dataTransfer.getData('question');

			update({
				...editor,
				questions: [...editor.questions.slice(0, index), JSON.parse(question), ...editor.questions.slice(index)]
			});
		} else if (event.dataTransfer.types.includes('srcindex')) {
			const questions = editor.questions.slice();
			const srcIndex = parseInt(event.dataTransfer.getData('srcindex'));
			const dstIndex = srcIndex < index ? index - 1 : index;

			questions.splice(dstIndex, 0, questions.splice(srcIndex, 1)[0]);
			update({ ...editor, questions });
		}
		event.target.classList.remove('dropZone');
	}

	handleDragOver(event) {
		if (event.dataTransfer.types.some(e => ['question', 'srcindex'].includes(e))) {
			event.target.classList.add('dropZone');
		}
		event.preventDefault();
	}

	handleDragLeave(event) {
		event.target.classList.remove('dropZone');
	}

	handleDragStart(event, index) {
		event.dataTransfer.setData('srcindex', index);
	}

	buildDropZone(index, stretch = '') {
		return <div data-index={index} className={`mt-2 mb-2 ml-3 mr-3 ${stretch} separator`} onDrop={this.handleDrop} onDragOver={this.handleDragOver} onDragLeave={this.handleDragLeave}/>;
	}

	render() {
		const { editor, closeEditor } = this.props;
		return (
			<div id="editor" className={`view ${editor.visible ? 'editing' : ''}`}>
				<div id="editorHeader" className="header">
					<span className="ml-3">Éditer un QCM</span>
					<div id="buttons" className="mr-3">
						<Button color="primary" className="mr-2" onClick={this.save}>Enregistrer</Button>
						<Button color="secondary" className="mr-2" onClick={closeEditor}>Annuler</Button>
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

export default Editor;