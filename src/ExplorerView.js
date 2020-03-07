import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import File from './File';
import ContextMenu from './ContextMenu';
import Modals from './Modals';
import request from './request';
import QuestionUtils from './QuestionUtils';

/**
 * This view displays folders, questions and games as files.
 * It provides useful features such as right-clicking and drag and drop.
 */
class ExplorerView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			contextMenu: { visible: false },
			displayByList: false,
			copiedFile: null
		};

		this.createFolder = this.createFolder.bind(this);
		this.copyFile = this.copyFile.bind(this);
		this.dropFile = this.dropFile.bind(this);
		this.pasteFile = this.pasteFile.bind(this);
		this.handleContextMenu = this.handleContextMenu.bind(this);
		this.hideContextMenu = this.hideContextMenu.bind(this);

		this.props.requestFolder();
	}

	/**
	 * Creates a folder with the specified name
	 *
	 * @param {string} name - the name of the folder
	 */
	createFolder(name) {
		const { folder, refresh } = this.props;
		request('CreateFolder', { name, idParent: folder.active._id }).then( () => refresh() );
	}

	/**
	 * Moves the explorer back up to the specified folder.
	 * A call to this method results from a click on the breadcrumb.
	 *
	 * @param {string} _id - the id of the folder
	 */
	goBack(_id) {
		this.props.requestFolder(_id);
	}

	/**
	 * Specifies a file to copy.
	 * The file will effectively be copied when pasteFile() is called.
	 *
	 * @param {string} _id - the id of the file
	 */
	copyFile(_id) {
		this.setState({ copiedFile: _id });
	}

	/**
	 * Pastes a file which was previously copied.
	 * copyFile() must be called before this method.
	 */
	pasteFile() {
		const { props: { folder: { active: { _id } }, refresh }, state: { copiedFile } } = this;
		request('Paste', { _id: copiedFile, idParent: _id }).then(() => refresh());
	}

	/**
	 * Drops a file as a result of a drag and drop operation.
	 * It is used for two different features:
	 *
	 * - Moving a file to a folder in the active folder
	 * - Moving a file to a folder which is a parent of the active folder
	 *
	 * The former involves dropping the file to the folder directly.
	 * The latter involves dropping the file to the breadcrumb.
	 *
	 * @param {DragEvent} event - the drop event
	 * @param {string} _id - the id of the file to drop
	 */
	dropFile(event, _id) {
		const { refresh } = this.props;
		['folder', 'question', 'jeu'].forEach(type => {
			if (event.dataTransfer.types.includes(type)) {
				const file = JSON.parse(event.dataTransfer.getData(type));
				request('Move', { _id: file._id, idParent: _id }).then(() => refresh());
			}
		});
	}

	/**
	 * Displays a context menu after a right click was performed.
	 * If the right click originates from a file, some extra items will be specified to this method.
	 *
	 * @param {MouseEvent} event - the event resulting from a right click
	 * @param {Array} items - the items to prepend to the context menu
	 */
	handleContextMenu(event, items = []) {
		const { pageX, pageY, screenX, screenY } = event;
		const x = screenX - window.screenX;
		const y = screenY - window.screenY;
		const offset = { x: pageX - x, y: pageY - y };
		this.setState({ contextMenu: { visible: true, x, y, offset, items: this.buildMenuItems(items), onClick: this.hideContextMenu } });
		event.stopPropagation();
		event.preventDefault();
	}

	/**
	 * Builds the items to add to the context menu and appends them to the items specified (if any).
	 *
	 * @param {Array} items - the items to prepend to the context menu
	 */
	buildMenuItems(items) {
		const { props: { createGame, folder, refresh }, state: { copiedFile } } = this;

		const pasteItem = copiedFile ? { label: 'Coller', onClick: this.pasteFile } : [];

		return items.concat(pasteItem).concat(
			{ label: 'Nouveau dossier', onClick: () => {
				Modals.showPromptModal('Nouveau dossier', 'Entrez un nom de dossier ici...').then(name => this.createFolder(name)).catch(() => {});
			}},
			{
				label: 'Nouvelle question', onClick: () => {
					Modals.showQuestionModal(QuestionUtils.createMultipleChoiceQuestion(folder.active._id)).then(quest => {
						request('SaveQuestion', quest).then( () => refresh() );
					}).catch(() => {});
				}
			},
			{ label: 'Nouveau jeu', onClick: () => createGame() }
		);
	}

	/**
	 * Closes the context menu.
	 */
	hideContextMenu() {
		this.setState({ contextMenu: { visible: false } });
	}

	/**
	 * Builds a file child component.
	 *
	 * @param {Object} file - the file represented by the component to build
	 */
	buildFileItem(file) {
		const { handleContextMenu, props: { folder, editGame, requestFolder, refresh } } = this;
		return (
			<File
				folder={folder}
				file={file}
				editGame={editGame}
				copyFile={this.copyFile}
				dropFile={this.dropFile}
				requestFolder={requestFolder}
				refresh={refresh}
				handleContextMenu={handleContextMenu}
			/>
		);
	}

	/**
	 * Toggles the type of display which should be used for files.
	 * There are two types of display:
	 *
	 * - Display by icon (default)
	 * - Display by list
	 *
	 * @param {boolean} displayByList - true if files should be displayed by list, false otherwise
	 */
	toggleDisplay(displayByList) {
		this.setState({ displayByList });
	}

	/**
	 * Processes a drag over event on the breadcrumb.
	 * It creates a drop zone around the folder name which is dragged over.
	 *
	 * @param {DragEvent} event - the drag over event
	 */
	handleDragOver(event) {
		event.target.classList.add('dropZone');
		event.preventDefault();
	}

	/**
	 * Processes a drag leave event on the breadcrumb.
	 * It removes the drop zone which was previously created after a drag over event.
	 *
	 * @param {DragEvent} event - the drag leave event
	 */
	handleDragLeave(event) {
		event.target.classList.remove('dropZone');
	}

	/**
	 * Processes a drop event on the breadcrumb.
	 * It moves the dragged file to the highlighted folder in the breadcrumb.
	 * After that, it removes the drop zone which was previously created after a drag over event.
	 *
	 * @param {DragEvent} event - the drop event
	 * @param {*} _id - the id of the file to drop
	 */
	handleDrop(event, _id) {
		this.dropFile(event, _id);
		event.target.classList.remove('dropZone');
	}

	/**
	 * Renders the ExplorerView with the breadcrumb, context menu and files.
	 */
	render() {
		const {
			props: { folder },
			state: { contextMenu, displayByList }
		} = this;
		const path = folder.path.concat(folder.active.name ? folder.active : []);

		return (
			<div id="explorer" className="view">
				<div id="explorerHeader" className="header">
					<div id="account">
						<Link to={process.env.PUBLIC_URL + '/compte'}>Mon compte</Link>
					</div>

					<div id="path">
						{[].concat(...[{ name: 'Explorer' }, ...path].map(folder => {
							return [
								<span
									onClick={() => this.goBack(folder._id)}
									onDragOver={this.handleDragOver}
									onDragLeave={this.handleDragLeave}
									onDrop={e => this.handleDrop(e, folder._id)}
								>{folder.name}</span>,
								<div className="arrow"/>
							]
						})).slice(0, -1)}
					</div>

					<div id="displayBy">
						<div id="icons" className={displayByList ? '' : 'negative'} onClick={() => this.toggleDisplay(false)}/>
						<div id="list" className={displayByList ? 'negative' : ''} onClick={() => this.toggleDisplay(true)}/>
					</div>
				</div>

				<div className={`scrollable ${displayByList ? 'list' : ''}`} onClick={this.hideContextMenu} onContextMenu={this.handleContextMenu}>
					{this.props.files.map(file => this.buildFileItem(file))}
				</div>

				{contextMenu.visible && <ContextMenu {...contextMenu}/>}
			</div>
		);
	}
}

export default ExplorerView;