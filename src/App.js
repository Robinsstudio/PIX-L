import React, { Component } from 'react';
import ExplorerView from './ExplorerView';
import Editor from './Editor';
import Modals from './Modals';
import request from './request';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			files: [],
			folder: {
				path: [],
				active: {}
			},
			editor: {
				visible: false,
				questions: [],
				model: {
					questions: []
				}
			}
		};

		this.requestFolder = this.requestFolder.bind(this);
		this.create = this.create.bind(this);
		this.edit = this.edit.bind(this);
		this.save = this.save.bind(this);
		this.closeEditor = this.closeEditor.bind(this);
		this.updateEditor = this.updateEditor.bind(this);
		this.refreshEditor = this.refreshEditor.bind(this);
		this.refresh = this.refresh.bind(this);
	}

	requestFolder(_id) {
		request('ListFolder', { _id }).then(res => res.json()).then( ({folder, files}) => {
			this.setState({folder, files})
		});
	}

	create() {
		this.setState({
			editor: {
				visible: true,
				questions: [],
				model: {
					questions: []
				}
			}
		});
	}

	edit(model) {
		request('GetQuestions', { _ids: model.questions.map(quest => quest.idQuestion) }).then(res => res.json()).then(questions => {
			this.setState({
				editor: {
					visible: true,
					model,
					questions
				}
			});
		});
	}

	updateEditor(editor) {
		this.setState({ editor });
	}

	save(name) {
		const { editor, folder } = this.state;
		const idParent = editor.model.idParent || folder.active._id;

		request('SaveMultipleChoice', { ...editor.model, idParent, name, questions: editor.questions.map(quest => {
			return { idQuestion: quest._id };
		}) }).then(this.closeEditor);
	}

	closeEditor() {
		this.setState((state) => {
			return { editor: { ...state.editor, visible: false } }
		}, () => this.refresh() );
	}

	refreshEditor() {
		const { editor } = this.state;
		request('GetQuestions', { _ids: editor.questions.map(quest => quest._id) }).then(res => res.json()).then(questions => {
			this.setState(state => {
				return {
					editor: {
						...state.editor,
						questions
					}
				};
			});
		});
	}

	refresh() {
		const { editor, folder } = this.state;
		if (editor.visible) {
			this.refreshEditor();
		}
		this.requestFolder(folder.active._id);
	}

	render() {
		const { folder, files, editor } = this.state;
		return (
			<div id="app">
				<ExplorerView editing={editor.visible} folder={folder} files={files} requestFolder={this.requestFolder} create={this.create} edit={this.edit} refresh={this.refresh}/>
				<Editor editor={editor} folder={folder} update={this.updateEditor} save={this.save} closeEditor={this.closeEditor}/>
				{Modals.get()}
			</div>
		);
	}
}

export default App;