import React, { Component } from 'react';

import './style/team_chooser.css';

class StudentViewModal extends Component {
	render() {
		const { title } = this.props;

		return (
			<div className="darkBackground">
				<div id="studentViewModal" className="color-blue">
					<div id="studentViewModalTitle">{ title }</div>
					<div id="studentViewModalBody">
						{ this.props.children }
					</div>
				</div>
			</div>
		);
	}
}

export default StudentViewModal;