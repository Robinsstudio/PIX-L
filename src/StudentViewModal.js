import React, { Component } from 'react';

import './style/team_chooser.css';

/**
 * This is a modal used in the StudentView.
 */
class StudentViewModal extends Component {

	/**
	 * Closes the dialog and fires the closed event with the specified boolean.
	 *
	 * @param {boolean} confirmed - true if the user clicked "yes", false otherwise
	 */
	handleClick(confirmed) {
		const { onClosed } = this.props;
		if (typeof onClosed === 'function') {
			onClosed(confirmed);
		}
	}

	/**
	 * Renders a square modal.
	 */
	render() {
		const { title, confirm } = this.props;

		return (
			<div className="darkBackground">
				<div id="studentViewModal" className="color-blue">
					{ title &&
						<div id="studentViewModalTitle">{ title }</div>
					}
					<div id="studentViewModalBody">
						{ this.props.children }
					</div>
					{ confirm &&
						<div id="studentViewModalFooter">
							<div className="form-button form-button--small background-color-blue" onClick={() => this.handleClick(true)}>
								<span className="form-button-content form-button-content--small">Oui</span>
							</div>
							<div className="form-button form-button--small background-color-blue" onClick={() => this.handleClick(false)}>
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