import React, { Component } from 'react';
import ExplorerView from './ExplorerView';
import EditorView from './EditorView';
import SessionView from './SessionView';
import request from './request';

class AdminView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tags: [],
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
			},
			sessionView: {
				visible: false,
				sessions: []
			}
		};

		this.requestFolder = this.requestFolder.bind(this);
		this.searchByTags = this.searchByTags.bind(this);
		this.create = this.create.bind(this);
		this.edit = this.edit.bind(this);
		this.save = this.save.bind(this);
		this.closeEditor = this.closeEditor.bind(this);
		this.updateEditor = this.updateEditor.bind(this);
		this.refreshEditor = this.refreshEditor.bind(this);
		this.updateSessionView = this.updateSessionView.bind(this);
		this.refresh = this.refresh.bind(this);
	}

	requestFolder(_id) {
		this.setState({ tags: [] });
		request('ListFolder', { _id }).then(res => res.json()).then(({folder, files}) => {
			this.setState({ folder, files });
		});
	}

	searchByTags(tags) {
		if (tags.length) {
			this.setState({ tags });
			request('GetQuestionsByTags', { tags, idParent: this.state.folder.active._id }).then(res => res.json()).then(files => {
				this.setState({ files });
			});
		} else {
			this.refresh();
		}
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
		request('GetQuestionsByIds', { _ids: model.questions.map(quest => quest.idQuestion) }).then(res => res.json()).then(questions => {
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
		}) }).then(this.closeEditor).then(this.refresh);
	}

	closeEditor() {
		this.setState((state) => {
			return { editor: { ...state.editor, visible: false } };
		});
	}

	refreshEditor() {
		const { editor } = this.state;
		request('GetQuestionsByIds', { _ids: editor.questions.map(quest => quest._id) }).then(res => res.json()).then(questions => {
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

	updateSessionView(data) {
		this.setState({
			sessionView: {
				...this.state.sessionView,
				...data
			}
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
		const { folder, files, tags, editor, sessionView } = this.state;
		return (
			<div id="app">
				<ExplorerView
					folder={folder}
					files={files}
					tags={tags}
					requestFolder={this.requestFolder}
					searchByTags={this.searchByTags}
					create={this.create}
					edit={this.edit}
					updateSessionView={this.updateSessionView}
					refresh={this.refresh}
				/>

				<EditorView
					editor={editor}
					folder={folder}
					update={this.updateEditor}
					save={this.save}
					closeEditor={this.closeEditor}
				/>

				<SessionView {...sessionView} updateSessionView={this.updateSessionView}/>
			</div>
		);
	}
}

export default AdminView;