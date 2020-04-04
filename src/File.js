import React, { Component } from 'react';
import AutoFocusInput from './AutoFocusInput';
import Modals from './Modals';
import request from './request';
import download from './download';

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

	open() {
		const { edit, requestFolder, refresh, file } = this.props;
		if (file.type === 'folder') {
			requestFolder(file._id);
		} else if (file.type === 'question') {
			Modals.showQuestionModal(file).then(quest => {
				request('SaveQuestion', quest).then( () => refresh() );
			}).catch(() => {});
		} else if (file.type === 'jeu') {
			edit(file);
		}
	}

	remove() {
		const { refresh, file: { _id } } = this.props;
		request('Delete', { _id }).then( () => refresh() );
	}

	rename(name) {
		const { refresh, file: { _id } } = this.props;
		request('Rename', { _id, name }).then( () => refresh() );
	}

	startRenaming() {
		this.setState({ renaming: true });
	}

	stopRenaming(newName) {
		if (newName) {
			this.rename(newName);
		}
		this.setState({ renaming: false });
	}

	copyToClipboard(value) {
		const hiddenElement = document.createElement('input');
		hiddenElement.style.background = 'transparent';
		hiddenElement.value = value;

		document.body.appendChild(hiddenElement);
		hiddenElement.select();
		document.execCommand('copy');
		document.body.removeChild(hiddenElement);
	}

	handleContextMenu(event) {
		const {
			file: { name, type, _id },
			copyFile
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

		this.props.handleContextMenu(event, menuItems);
	}

	handleDragStart(event) {
		const { file } = this.props;
		event.dataTransfer.setData(file.type, JSON.stringify(file));
		this.setState({ dragging: true });
	}

	handleDragEnd() {
		this.setState({ dragging: false });
	}

	handleDragOver(event) {
		const { dragging } = this.state;
		const element = event.target;
		if (!dragging && element.classList.contains('folder')) {
			element.classList.add('grow');
		}
		event.preventDefault();
	}

	handleDragLeave(event) {
		const element = event.target;
		element.classList.remove('grow');
	}

	handleDrop(event) {
		const { props: { file: { _id }, dropFile }, state: { dragging } } = this;
		const element = event.target;

		if (!dragging && element.classList.contains('folder')) {
			dropFile(event, _id);
			element.classList.remove('grow');
		}
	}

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