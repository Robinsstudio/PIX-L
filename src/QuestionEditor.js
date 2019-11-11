import React, { Component } from 'react';
import { Button } from 'reactstrap';
import { Editor, EditorState, RichUtils, CompositeDecorator, convertFromRaw, convertToRaw } from 'draft-js';
import Modals from './Modals';

class QuestionEditor extends Component {
	constructor(props) {
		super(props);

		const decorator = new CompositeDecorator([{
			strategy: findLinkEntities,
			component: Link
		}]);

		this.state = {
			editorState: props.initialValue.length
				? EditorState.createWithContent(convertFromRaw(JSON.parse(this.props.initialValue)), decorator)
				: EditorState.createEmpty(decorator)
		};

		this.onChange = (editorState) => this.setState({editorState});

		this.focus = this.focus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.promptForLink = this.promptForLink.bind(this);
		this.confirmLink = this.confirmLink.bind(this);
		this.removeLink = this.removeLink.bind(this);
	}

	focus() {
		this.refs.editor.focus();
	}

	handleBlur() {
		const { props: { updateQuestion }, state: { editorState } } = this;
		updateQuestion(JSON.stringify(convertToRaw(editorState.getCurrentContent())));
	}

	promptForLink() {
		const { editorState } = this.state;
		const selection = editorState.getSelection();
		if (!selection.isCollapsed()) {
			const contentState = editorState.getCurrentContent();
			console.log(convertToRaw(contentState));
			const startKey = editorState.getSelection().getStartKey();
			const startOffset = editorState.getSelection().getStartOffset();
			const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
			const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

			let url = '';
			if (linkKey) {
				const linkInstance = contentState.getEntity(linkKey);
				url = linkInstance.getData().url;
			}

			Modals.showPromptModal('Lien hypertexte', 'Saisissez votre lien ici', url).then(this.confirmLink).catch(() => {});
		}
	}

	confirmLink(url) {
		const { editorState } = this.state;
		const contentState = editorState.getCurrentContent();
		const contentStateWithEntity = contentState.createEntity(
			'LINK',
			'MUTABLE',
			{ url }
		);
		const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
		const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
		this.setState({
			editorState: RichUtils.toggleLink(
				newEditorState,
				newEditorState.getSelection(),
				entityKey
			)
		}, () => {
			setTimeout(this.focus, 0);
		});
	}

	removeLink() {
		const { editorState } = this.state;
		const selection = editorState.getSelection();
		if (!selection.isCollapsed()) {
			this.setState({
				editorState: RichUtils.toggleLink(editorState, selection, null),
			});
		}
	}

	render() {
		return (
			<div onFocus={this.focus} onBlur={this.handleBlur}>
				<Button
					color="success"
					className="mr-1"
					onClick={this.promptForLink}
				>
					<i className="fas fa-link"></i>
				</Button>

				<Button
					color="danger"
					onClick={this.removeLink}
				>
					<i className="fas fa-unlink"></i>
				</Button>

				<div className="mt-3">
					Saisissez votre question ci-dessous :
				</div>

				<div style={styles.editor} className="mt-3">
					<Editor
						editorState={this.state.editorState}
						onChange={this.onChange}
						ref="editor"
					/>
				</div>
			</div>
		);
	}
}

const Link = (props) => {
	const {url} = props.contentState.getEntity(props.entityKey).getData();
	return (
		<a href={url} style={styles.link}>
			{props.children}
		</a>
	);
};

function findLinkEntities(contentBlock, callback, contentState) {
	contentBlock.findEntityRanges(
		(character) => {
			const entityKey = character.getEntity();
			return (
				entityKey !== null &&
				contentState.getEntity(entityKey).getType() === 'LINK'
			);
		},
		callback
	);
}

const styles = {
	editor: {
		padding: '10px',
		border: '1px solid #ced4da'
	},
	link: {
		color: '#3b5998',
		textDecoration: 'underline',
	},
};

	export default QuestionEditor;