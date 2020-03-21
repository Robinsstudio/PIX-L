import React from 'react';
import { CompositeDecorator } from 'draft-js';

/**
 * This class inherits from CompositeDecorator in DraftJS.
 * It defines the behavior of hypertext links in the TextEditor component.
 */
class EditorDecorator extends CompositeDecorator {
	constructor() {
		super([{
			strategy: findLinkEntities,
			component: Link
		}]);
	}
}

/**
 * Opens the link in a new tab when it is clicked.
 *
 * @param {MouseEvent} event - the mouse event
 * @param {string} url - the link to open
 */
function handleClick(event, url) {
	window.open(url);
	event.stopPropagation();
}

/**
 * Function component representing a link.
 *
 * @param {Object} props - the props of the link
 */
const Link = (props) => {
	const {url} = props.contentState.getEntity(props.entityKey).getData();
	return (
		<span onClick={e => handleClick(e, url)} className="link">
			{props.children}
		</span>
	);
};

/**
 * This function is used by DraftJS to find hypertext links in the text.
 */
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

export default EditorDecorator;