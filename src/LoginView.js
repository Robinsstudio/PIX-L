import React, { Component } from 'react';
import PrettyInput from './PrettyInput';
import request from './request';

import './style/form_view.css';

/**
 * This view allows an administrator to log in their account.
 */
class LoginView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: '',
			password: '',
			authenticationFailed: false,
		}

		this.authenticate = this.authenticate.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.updateField = this.updateField.bind(this);
	}

	/**
	 * Authenticates the user by a call to the back-end API.
	 * If the authentication is successful, a token is stored as a cookie.
	 * If it fails, then the two text fields will animate.
	 *
	 * @param {Object} credentials - an object containing the username and the password
	 */
	authenticate(credentials) {
		const { setAuthenticated } = this.props;

		request('Authenticate', credentials).then(resp => resp.json()).then(({authenticated}) => {
			if (!authenticated) {
				setTimeout(() => this.setState({ authenticationFailed: false }), 300);
			}
			this.setState({ authenticationFailed: !authenticated });

			setAuthenticated(authenticated);
		});
	}

	/**
	 * When the Enter key is pressed, the authentication process starts.
	 *
	 * @param {KeyboardEvent} event - the keydown event
	 */
	handleKeyDown(event) {
		const { username, password } = this.state;
		if (event.key === 'Enter') {
			this.authenticate({ username, password });
		}
	}

	/**
	 * Updates the specified field (username or password).
	 *
	 * @param {Event} event - the change event
	 * @param {string} field - the name of the field
	 */
	updateField(event, field) {
		this.setState({ [field]: event.target.value });
	}

	/**
	 * Builds the fields.
	 *
	 * @param {Array} fields - the array of fields
	 */
	buildFields(fields) {
		const { authenticationFailed } = this.state;

		return fields.map(({field, type, label}) =>
			<PrettyInput
				id={field}
				type={type}
				label={label}
				onChange={e => this.updateField(e, field)}
				value={this.state[field]}
				className={authenticationFailed ? 'input-text-invalid' : ''}
			/>
		);
	}

	/**
	 * Renders the LoginView.
	 */
	render() {
		return (
			<div className="form-background background-color-blue">
				<div className="form-section">
					<div className="form-section-header"/>
					<div className="form" onKeyDown={this.handleKeyDown}>
						<h1 className="form-header-primary">PIX-L</h1>
						{ this.buildFields([
							{ field: 'username', type: 'text', label: 'Nom d\'utilisateur'},
							{ field: 'password', type: 'password', label: 'Mot de passe'}
						])}
					</div>
					<div className="form-section-footer"/>
				</div>
			</div>
		);
	}
}

export default LoginView;