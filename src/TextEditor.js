import React, { Component } from 'react';
import { Editor, EditorState, RichUtils, CompositeDecorator, convertFromRaw, convertToRaw } from 'draft-js';
import PromptPopover from './PromptPopover';
import 'draft-js/dist/Draft.css';
import './style/text_editor.css';

class TextEditor extends Component {
	constructor(props) {
		super(props);

		const decorator = new CompositeDecorator([{
			strategy: findLinkEntities,
			component: Link
		}]);

		this.state = {
			focused: false,
			popover: {
				visible: false,
				value: ''
			},
			editorState: props.initialValue && props.initialValue.length
				? EditorState.createWithContent(convertFromRaw(JSON.parse(this.props.initialValue)), decorator)
				: EditorState.createEmpty(decorator)
		};

		this.onChange = (editorState) => this.setState({editorState});

		this.focus = this.focus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handlePopoverChange = this.handlePopoverChange.bind(this);
		this.promptForLink = this.promptForLink.bind(this);
		this.confirmLink = this.confirmLink.bind(this);
		this.removeLink = this.removeLink.bind(this);
	}

	focus() {
		this.refs.editor.focus();
		this.setState({ focused: true });
	}

	handleFocus(event) {
		const { toolbar } = this.refs;

		if (!toolbar.contains(event.target)) {
			this.focus();
		}
	}

	handleBlur(event) {
		const { toolbar } = this.refs;

		if (!toolbar.contains(event.relatedTarget)) {
			const { props: { onChange }, state: { editorState, popover } } = this;
			if (popover.visible) {
				this.setPopover({ value: '', visible: false });
			}
			onChange(JSON.stringify(convertToRaw(editorState.getCurrentContent())));
			this.setState({ focused: false });
		}
	}

	handlePopoverChange(value) {
		const { popover } = this.state;
		this.setState({ popover: { ...popover, value } });
	}

	setPopover(ppv) {
		const { popover } = this.state;
		this.setState({ popover: { ...popover, ...ppv } }, () => {
			if (popover.visible && !ppv.visible) {
				this.focus();
			}
		});
	}

	promptForLink() {
		const { editorState } = this.state;
		const selection = editorState.getSelection();
		if (!selection.isCollapsed()) {
			const contentState = editorState.getCurrentContent();
			const startKey = editorState.getSelection().getStartKey();
			const startOffset = editorState.getSelection().getStartOffset();
			const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
			const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

			let url = '';
			if (linkKey) {
				const linkInstance = contentState.getEntity(linkKey);
				url = linkInstance.getData().url;
			}

			this.setPopover({ value: url, visible: true });
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
		}, () => setTimeout(this.focus, 0));
	}

	removeLink() {
		const { editorState } = this.state;
		const selection = editorState.getSelection();
		if (!selection.isCollapsed()) {
			this.setState({
				editorState: RichUtils.toggleLink(editorState, selection, null)
			}, () => setTimeout(this.focus, 0));
		}
	}

	toggleInlineStyle(event, style) {
		event.preventDefault();

		const { editorState } = this.state;
		const newEditorState = RichUtils.toggleInlineStyle(editorState, style);
		this.setState({ editorState: newEditorState });
	}

	buildInlineStyleControl(style) {
		const currentStyle = this.state.editorState.getCurrentInlineStyle();
		return (
			<button className={`control ${currentStyle.has(style) ? 'active' : ''}`} onMouseDown={e => this.toggleInlineStyle(e, style)}>
				<i className={`fas fa-${style.toLowerCase()}`}></i>
			</button>
		);
	}

	render() {
		const { props: { placeholder, style }, state: { focused, popover, editorState } } = this;
		return (
			<div className="textEditorWrapper" onFocus={this.handleFocus} onBlur={this.handleBlur} style={style}>
				<div className={`toolbar ${focused ? 'visible' : ''}`} ref="toolbar">
					{[
						this.buildInlineStyleControl('BOLD'),
						this.buildInlineStyleControl('ITALIC'),
						this.buildInlineStyleControl('UNDERLINE')
					]}
					<div className="linkControl">
						<button className="control" onClick={this.promptForLink}>
							<i className="fas fa-link"></i>
						</button>

						<PromptPopover
							isOpen={popover.visible}
							value={popover.value}
							onChange={this.handlePopoverChange}
							onConfirm={this.confirmLink}
						/>
					</div>
					<button className="control" onClick={this.removeLink}>
						<i className="fas fa-unlink"></i>
					</button>
				</div>
				<div className="textEditor">
					<Editor
						editorState={editorState}
						onChange={this.onChange}
						placeholder={placeholder}
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
		<a href={url} className="link">
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

export default TextEditor;