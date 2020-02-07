import React, { Component } from 'react';

import './style/team_chooser.css';

class StudentViewModal extends Component {
	render() {
		const { title, confirm } = this.props;

		return (
			<div className="darkBackground">
				<div id="studentViewModal" className="color-blue">
					<div id="studentViewModalTitle">{ title }</div>
					<div id="studentViewModalBody">
						{ this.props.children }
					</div>
					{ confirm &&
						<div id="studentViewModalFooter">
							<div className="form-button form-button--small">
								<span className="form-button-content form-button-content--small">Oui</span>
							</div>
							<div className="form-button form-button--small">
								<span className="form-button-content form-button-content--small">Non</span>
							</div>
						</div>
					}
				</div>
			</div>
		);
	}
}

export default StudentViewModal;