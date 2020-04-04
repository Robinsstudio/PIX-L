import React, { Component } from 'react';

/**
 * This component displays a context menu as a result of a right click.
 */
class ContextMenu extends Component {
	constructor(props) {
		super(props);
		this.element = React.createRef();
	}

	/**
	 * Computes where the context menu should be displayed according to the mouse location.
	 */
	computePosition() {
		const { x, y, offset } = this.props;
		const element = this.element.current;
		element.style.left = `${(element.offsetWidth < window.innerWidth - x) ? x + offset.x : x - element.offsetWidth + offset.x}px`;
		element.style.top = `${(element.offsetHeight < window.innerHeight - y) ? y + offset.y : y - element.offsetHeight + offset.y}px`;
	}

	/**
	 * Computes position when this component is mounted
	 */
	componentDidMount() {
		this.computePosition();
	}

	/**
	 * Computes position when this component is updated
	 */
	componentDidUpdate() {
		this.computePosition();
	}

	/**
	 * Builds the specified item.
	 * The item must at least contain a "label" field.
	 * Other fields will be set as attributes.
	 *
	 * Note: A field named "href" will change the item to a link.
	 *
	 * @param {Object} item - the item to build
	 */
	buildMenuItem(item) {
		if (item.href) {
			return <a {...item}>{item.label}</a>;
		}
		return <div {...item}>{item.label}</div>;
	}

	/**
	 * Renders the context menu.
	 */
	render() {
		return (
			<div className="menu" onClick={this.props.onClick} ref={this.element}>
				{this.props.items.map(item => this.buildMenuItem(item))}
			</div>
		);
	}
}

export default ContextMenu;