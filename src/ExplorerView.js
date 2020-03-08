import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import File from './File';
import ContextMenu from './ContextMenu';
import Modals from './Modals';
import request from './request';
import QuestionUtils from './QuestionUtils';

class ExplorerView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			contextMenu: { visible: false },
			sessionView: { visible: false, sessions: [] },
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

	createFolder(name) {
		const { folder, refresh } = this.props;
		request('CreateFolder', { name, idParent: folder.active._id }).then( () => refresh() );
	}

	goBack(_id) {
		this.props.requestFolder(_id);
	}

	copyFile(_id) {
		this.setState({ copiedFile: _id });
	}

	pasteFile() {
		const { props: { folder: { active: { _id } }, refresh }, state: { copiedFile } } = this;
		request('Paste', { _id: copiedFile, idParent: _id }).then(() => refresh());
	}

	dropFile(event, _id) {
		const { refresh } = this.props;
		['folder', 'question', 'jeu'].forEach(type => {
			if (event.dataTransfer.types.includes(type)) {
				const file = JSON.parse(event.dataTransfer.getData(type));
				request('Move', { _id: file._id, idParent: _id }).then(() => refresh());
			}
		});
	}

	handleContextMenu(event, items = []) {
		const { pageX, pageY, screenX, screenY } = event;
		const x = screenX - window.screenX;
		const y = screenY - window.screenY;
		const offset = { x: pageX - x, y: pageY - y };
		this.setState({ contextMenu: { visible: true, x, y, offset, items: this.buildMenuItems(items), onClick: this.hideContextMenu } });
		event.stopPropagation();
		event.preventDefault();
	}

	buildMenuItems(items) {
		const { props: { create, folder, refresh }, state: { copiedFile } } = this;

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
			{ label: 'Nouveau jeu', onClick: () => create() }
		);
	}

	hideContextMenu() {
		this.setState({ contextMenu: { visible: false } });
	}

	buildFileItem(file) {
		const { handleContextMenu, props: { folder, edit, requestFolder, refresh, updateSessionView } } = this;
		return (
			<File
				folder={folder}
				file={file}
				edit={edit}
				copyFile={this.copyFile}
				dropFile={this.dropFile}
				requestFolder={requestFolder}
				refresh={refresh}
				handleContextMenu={handleContextMenu}
				updateSessionView={updateSessionView}
			/>
		);
	}

	toggleDisplay(displayByList) {
		this.setState({ displayByList });
	}

	handleDragOver(event) {
		event.target.classList.add('dropZone');
		event.preventDefault();
	}

	handleDragLeave(event) {
		event.target.classList.remove('dropZone');
	}

	handleDrop(event, _id) {
		this.dropFile(event, _id);
		event.target.classList.remove('dropZone');
	}

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