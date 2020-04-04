import React from 'react';
import { CompositeDecorator } from 'draft-js';

class EditorDecorator extends CompositeDecorator {
	constructor() {
		super([{
			strategy: findLinkEntities,
			component: Link
		}]);
	}
}

function handleClick(event, url) {
	window.open(url);
	event.stopPropagation();
}

const Link = (props) => {
	const {url} = props.contentState.getEntity(props.entityKey).getData();
	return (
		<span onClick={e => handleClick(e, url)} className="link">
			{props.children}
		</span>
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

export default EditorDecorator;