import React, { Component } from 'react';

class ContextMenu extends Component {
	constructor(props) {
		super(props);
		this.element = React.createRef();
	}

	computePosition() {
		const { x, y, offset } = this.props;
		const element = this.element.current;
		element.style.left = `${(element.offsetWidth < window.innerWidth - x) ? x + offset.x : x - element.offsetWidth + offset.x}px`;
		element.style.top = `${(element.offsetHeight < window.innerHeight - y) ? y + offset.y : y - element.offsetHeight + offset.y}px`;
	}
	
	componentDidMount() {
		this.computePosition();
	}
	
	componentDidUpdate() {
		this.computePosition();
	}

	buildMenuItem(item) {
		if (item.href) {
			return <a {...item}>{item.label}</a>;
		}
		return <div {...item}>{item.label}</div>;
	}
	
	render() {
		return (
			<div className="menu" onClick={this.props.onClick} ref={this.element}>
				{this.props.items.map(item => this.buildMenuItem(item))}
			</div>
		);
	}
}

export default ContextMenu;