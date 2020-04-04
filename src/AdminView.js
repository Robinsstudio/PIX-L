import React, { Component } from 'react';
import ExplorerView from './ExplorerView';
import EditorView from './EditorView';
import request from './request';

/**
 * This view is used by authenticated users.
 * It provides features to create folders, questions and games and organize them.
 *
 * This view has two child components:
 * - ExplorerView: displays and manages files
 * - EditorView: displays and edits games
 */
class AdminView extends Component {
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
				game: {
					questions: []
				}
			}
		};

		this.requestFolder = this.requestFolder.bind(this);
		this.createGame = this.createGame.bind(this);
		this.editGame = this.editGame.bind(this);
		this.save = this.save.bind(this);
		this.closeEditor = this.closeEditor.bind(this);
		this.updateEditor = this.updateEditor.bind(this);
		this.refreshEditor = this.refreshEditor.bind(this);
		this.refresh = this.refresh.bind(this);
	}

	/**
	 * Fetches the content of the specified folder
	 *
	 * @param {string} _id - the id of the folder
	 */
	requestFolder(_id) {
		request('ListFolder', { _id }).then(res => res.json()).then(({folder, files}) => {
			this.setState({ folder, files });
		});
	}

	/**
	 * Creates a new game
	 */
	createGame() {
		this.setState({
			editor: {
				visible: true,
				questions: [],
				game: {
					questions: []
				}
			}
		});
	}

	/**
	 * Splits the screen in two and open the game editor.
	 *
	 * @param {Object} game - the game to edit
	 */
	editGame(game) {
		request('GetQuestionsByIds', { _ids: game.questions.map(quest => quest.idQuestion) }).then(res => res.json()).then(questions => {
			this.setState({
				editor: {
					visible: true,
					game,
					questions
				}
			});
		});
	}

	/**
	 * Updates the state of the game editor.
	 * This method is used by the EditorView.
	 *
	 * @param {Object} editor - the new state of the editor
	 */
	updateEditor(editor) {
		this.setState({ editor });
	}

	/**
	 * Saves the game opened in the game editor.
	 * It can be a new game or an existing game.
	 *
	 * @param {string} name - the name of the game
	 */
	save(name) {
		const { editor, folder } = this.state;
		const idParent = editor.game.idParent || folder.active._id;

		request('SaveGame', { ...editor.game, idParent, name, questions: editor.questions.map(quest => {
			return { idQuestion: quest._id };
		}) }).then(this.closeEditor).then(this.refresh);
	}

	/**
	 * Closes the editor.
	 */
	closeEditor() {
		this.setState((state) => {
			return { editor: { ...state.editor, visible: false } };
		});
	}

	/**
	 * Refreshes the content of the game editor by fetching the questions that the current game contains.
	 */
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

	/**
	 * Refreshes the entire view.
	 * This method refreshes the game editor and the content of the active folder.
	 */
	refresh() {
		const { editor, folder } = this.state;
		if (editor.visible) {
			this.refreshEditor();
		}
		this.requestFolder(folder.active._id);
	}

	/**
	 * Renders the ExplorerView and the EditorView
	 */
	render() {
		const { folder, files, editor } = this.state;
		return (
			<div id="app">
				<ExplorerView
					folder={folder}
					files={files}
					requestFolder={this.requestFolder}
					createGame={this.createGame}
					editGame={this.editGame}
					refresh={this.refresh}
				/>

				<EditorView
					editor={editor}
					folder={folder}
					update={this.updateEditor}
					save={this.save}
					close={this.closeEditor}
				/>
			</div>
		);
	}
}

export default AdminView;