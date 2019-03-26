import React, { Component } from 'react';
import File from './File';
import ContextMenu from './ContextMenu';
import Modals from './Modals';
import request from './request';

class ExplorerView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			contextMenu: { visible: false },
			displayByList: false
		};

		this.createFolder = this.createFolder.bind(this);
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
		const { create, folder, refresh } = this.props;
		return items.concat(
			{ label: 'Nouveau dossier', onClick: () => {
				Modals.showPromptModal('Nouveau dossier', 'Entrez un nom de dossier ici...').then(name => this.createFolder(name)).catch(() => {});
			}},
			{ label: 'Nouvelle question', onClick: () => Modals.showQuestionModal({ label: '', answers: [], idParent: folder.active._id }).then(quest => {
				request('SaveQuestion', quest).then( () => refresh() );
			}).catch(() => {}) },
			{ label: 'Nouveau QCM', onClick: () => create() }
		);
	}

	hideContextMenu() {
		this.setState({ contextMenu: { visible: false } });
	}
  
	buildFileItem(file) {
		const { handleContextMenu, props: { folder, edit, requestFolder, refresh } } = this;
		return <File folder={folder} file={file} edit={edit} requestFolder={requestFolder} refresh={refresh} handleContextMenu={handleContextMenu}/>
	}

	toggleDisplay(displayByList) {
		this.setState({ displayByList });
	}
	
	render() {
		const { props: { editing, folder }, state: { contextMenu, displayByList } } = this;
		const path = folder.path.concat(folder.active.name ? folder.active : []);

		return (
			<div id="explorer" className={`view ${editing ? 'editing' : ''}`}>
				<div id="explorerHeader" className="header">
					<div id="path">
						{[].concat(...[{ name: 'Explorer' }, ...path].map(folder => {
							return [
								<span onClick={() => this.goBack(folder._id)}>{folder.name}</span>,
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