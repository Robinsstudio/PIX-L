import React, { Component } from 'react';
import AutoFocusInput from './AutoFocusInput';
import Modals from './Modals';
import request from './request';
import download from './download';

/**
 * This component represents a file in the ExplorerView.
 */
class File extends Component {
	constructor(props) {
		super(props);
		this.state = {
			renaming: false,
			dragging: false
		};

		this.open = this.open.bind(this);
		this.rename = this.rename.bind(this);
		this.remove = this.remove.bind(this);
		this.startRenaming = this.startRenaming.bind(this);
		this.stopRenaming = this.stopRenaming.bind(this);
		this.handleContextMenu = this.handleContextMenu.bind(this);
		this.handleDragStart = this.handleDragStart.bind(this);
		this.handleDragEnd = this.handleDragEnd.bind(this);
		this.handleDragOver = this.handleDragOver.bind(this);
		this.handleDragLeave = this.handleDragLeave.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
	}

	/**
	 * Opens the file. Each type of file has its own behavior:
	 *
	 * - Folder: Move ExplorerView to the opened folder.
	 * - Question: Opens the QuestionModal with the opened question.
	 * - Game: Opens the game editor with the opened game.
	 */
	open() {
		const { editGame, requestFolder, refresh, file } = this.props;
		if (file.type === 'folder') {
			requestFolder(file._id);
		} else if (file.type === 'question') {
			Modals.showQuestionModal(file).then(quest => {
				request('SaveQuestion', quest).then( () => refresh() );
			}).catch(() => {});
		} else if (file.type === 'jeu') {
			editGame(file);
		}
	}

	/**
	 * Removes the files.
	 */
	remove() {
		const { refresh, file: { _id } } = this.props;
		request('Delete', { _id }).then( () => refresh() );
	}

	/**
	 * Renames the file.
	 *
	 * @param {string} name - the new name of the file
	 */
	rename(name) {
		const { refresh, file: { _id } } = this.props;
		request('Rename', { _id, name }).then( () => refresh() );
	}

	/**
	 * Starts renaming the file.
	 * This shows an input in place of the filename which allows the user to change the name.
	 */
	startRenaming() {
		this.setState({ renaming: true });
	}

	/**
	 * Stops renaming the file.
	 * This hides the input and makes the specified filename visible.
	 *
	 * @param {string} name - the new name of the file
	 */
	stopRenaming(newName) {
		if (newName) {
			this.rename(newName);
		}
		this.setState({ renaming: false });
	}

	/**
	 * This utility method copies a value to the clipboard.
	 *
	 * @param {string} value - the value to copy
	 */
	copyToClipboard(value) {
		const hiddenElement = document.createElement('input');
		hiddenElement.style.background = 'transparent';
		hiddenElement.value = value;

		document.body.appendChild(hiddenElement);
		hiddenElement.select();
		document.execCommand('copy');
		document.body.removeChild(hiddenElement);
	}

	/**
	 * Displays a context menu after a right click was performed.
	 * This method prepends items which are specific to this file to the context menu.
	 * It then calls handleContextMenu() in the parent ExplorerView component.
	 *
	 * @param {MouseEvent} event - the event resulting from a right click
	 */
	handleContextMenu(event) {
		const {
			file: { name, type, _id },
			copyFile,
			handleContextMenu
		} = this.props;

		const copyLinkItem = {
			label: 'Copier le lien partageable',
			onClick: () => this.copyToClipboard(`${window.location.host}${process.env.PUBLIC_URL}/jeu/${_id}`)
		};

		const downloadResultsItem = {
			label: 'Télécharger les résultats',
			href: download.getDownloadLink(_id),
			download: true
		};

		const menuItems = [
			{ label: 'Ouvrir', onClick: this.open },
			{ label: 'Renommer', onClick: this.startRenaming },
			{
				label: 'Supprimer',
				onClick: () => Modals.showConfirmModal('Supprimer', `Voulez-vous vraiment supprimer ${name} ?`)
					.then(this.remove).catch(() => {})
			},
			{ label: 'Copier', onClick: () => copyFile(_id) }
		]
		.concat(type === 'jeu' ? [copyLinkItem, downloadResultsItem] : []);

		handleContextMenu(event, menuItems);
	}

	/**
	 * Processes a drag start event.
	 * The file switches to dragging mode.
	 *
	 * @param {DragEvent} event - the drag start event
	 */
	handleDragStart(event) {
		const { file } = this.props;
		event.dataTransfer.setData(file.type, JSON.stringify(file));
		this.setState({ dragging: true });
	}

	/**
	 * Processes a drag end event.
	 * The file is no longer is dragging mode.
	 */
	handleDragEnd() {
		this.setState({ dragging: false });
	}

	/**
	 * Processes a drag over event.
	 * If the file is a folder, the icon is magnified to suggest that the dragged file can be dropped.
	 *
	 * @param {DragEvent} event - the drag over event
	 */
	handleDragOver(event) {
		const { dragging } = this.state;
		const element = event.target;
		if (!dragging && element.classList.contains('folder')) {
			element.classList.add('grow');
		}
		event.preventDefault();
	}

	/**
	 * Processes a drag leave event.
	 * If the file is a folder, the icon is no longer magnified.
	 *
	 * @param {DragEvent} event - the drag leave event
	 */
	handleDragLeave(event) {
		const element = event.target;
		element.classList.remove('grow');
	}

	/**
	 * Processes a drop event.
	 * If the file is a folder, the dropped file is moved to that folder.
	 *
	 * @param {DragEvent} event - the drop event
	 */
	handleDrop(event) {
		const { props: { file: { _id }, dropFile }, state: { dragging } } = this;
		const element = event.target;

		if (!dragging && element.classList.contains('folder')) {
			dropFile(event, _id);
			element.classList.remove('grow');
		}
	}

	/**
	 * Renders the file
	 */
	render() {
		const { props: { file: { type, name } }, state: { renaming } } = this;

		return (
			<div
				className={`file ${renaming ? 'renaming' : ''}`}
				onDoubleClick={this.open}
				onContextMenu={this.handleContextMenu}
				onDragStart={this.handleDragStart}
				onDragEnd={this.handleDragEnd}
				onDragOver={this.handleDragOver}
				onDragLeave={this.handleDragLeave}
				onDrop={this.handleDrop}
				draggable
			>
				<div className={type}/>
				<div className="fileName">
					{(renaming) ? <AutoFocusInput value={name} onStopEditing={this.stopRenaming}/> : name}
				</div>
			</div>
		);
	}
}

export default File;