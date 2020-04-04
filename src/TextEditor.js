import React, { Component } from 'react';
import { Editor, EditorState, RichUtils, convertFromRaw, convertToRaw } from 'draft-js';
import EditorDecorator from './EditorDecorator';
import PromptPopover from './PromptPopover';
import 'draft-js/dist/Draft.css';
import './style/text_editor.css';

/**
 * This component is a text editor.
 * It provides styling features such as bold, italic and underline.
 * It also supports hypertext links.
 */
class TextEditor extends Component {
	constructor(props) {
		super(props);

		const decorator = new EditorDecorator();

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

	/**
	 * Focuses the editor.
	 */
	focus() {
		this.refs.editor.focus();
		this.setState({ focused: true });
	}

	/**
	 * Processes a focus event.
	 * If the editor was clicked outside of the toolbar, it focuses the editor.
	 * This behavior prevents the editor from focusing when the toolbar is clicked, which would hide the toolbar.
	 *
	 * @param {FocusEvent} event - the focus event
	 */
	handleFocus(event) {
		const { toolbar } = this.refs;

		if (!toolbar.contains(event.target)) {
			this.focus();
		}
	}

	/**
	 * Processes a blur event.
	 * If the event does not originate from the toolbar, it blurs the editor.
	 * This behavior prevents the editor from losing focus when only the toolbar should lose focus.
	 *
	 * @param {FocusEvent} event - the blur event
	 */
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

	/**
	 * Updates the hypertext link in the popover with the specified value.
	 *
	 * @param {string} value - the hypertext link
	 */
	handlePopoverChange(value) {
		const { popover } = this.state;
		this.setState({ popover: { ...popover, value } });
	}

	/**
	 * Updates the popover.
	 *
	 * @param {Object} ppv - the popover
	 */
	setPopover(ppv) {
		const { popover } = this.state;
		this.setState({ popover: { ...popover, ...ppv } }, () => {
			if (popover.visible && !ppv.visible) {
				this.focus();
			}
		});
	}

	/**
	 * Displays the popover as a result of a click on the link icon in the toolbar.
	 * If the selected text already contains a hypertext link, it appears in the popover.
	 */
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

	/**
	 * Confirms the hypertext link, adds it to the text, and closes the popover.
	 *
	 * @param {string} url - the hypertext link
	 */
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

	/**
	 * Removes all links in the selected text.
	 */
	removeLink() {
		const { editorState } = this.state;
		const selection = editorState.getSelection();
		if (!selection.isCollapsed()) {
			this.setState({
				editorState: RichUtils.toggleLink(editorState, selection, null)
			}, () => setTimeout(this.focus, 0));
		}
	}

	/**
	 * Toggles the specified inline style in the selected text among the three following:
	 *
	 * - Bold
	 * - Italic
	 * - Underline
	 *
	 * @param {MouseEvent} event - the mouse event
	 * @param {string} style - the inline style to toggle
	 */
	toggleInlineStyle(event, style) {
		event.preventDefault();

		const { editorState } = this.state;
		const newEditorState = RichUtils.toggleInlineStyle(editorState, style);
		this.setState({ editorState: newEditorState });
	}

	/**
	 * Builds a button which will be used to toggle the specified inline style in the toolbar.
	 *
	 * @param {string} style - the inline style
	 */
	buildInlineStyleControl(style) {
		const currentStyle = this.state.editorState.getCurrentInlineStyle();
		return (
			<button className={`control ${currentStyle.has(style) ? 'active' : ''}`} onMouseDown={e => this.toggleInlineStyle(e, style)}>
				<i className={`fas fa-${style.toLowerCase()}`}></i>
			</button>
		);
	}

	/**
	 * Renders the TextEditor.
	 */
	render() {
		const { props: { placeholder, style, className }, state: { focused, popover, editorState } } = this;
		return (
			<div className={`textEditorWrapper ${className}`} onFocus={this.handleFocus} onBlur={this.handleBlur} style={style}>
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

export default TextEditor;