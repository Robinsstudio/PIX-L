import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import PrettyInput from './PrettyInput';
import request from './request';

import './style/form_view.css';

/**
 * Form which allows users to change their usernames and passwords
 */
class AccountView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			password: {
				value: '',
				invalid: false
			},
			newUsername: {
				value: '',
				invalid: false
			},
			newPassword: {
				value: '',
				invalid: false
			},
			passwordConfirm: {
				value: '',
				invalid: false
			}
		};

		this.goBack = this.goBack.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	/**
	 * Redirects the user back to the homepage
	 */
	goBack() {
		this.setState({ redirect: true });
	}

	/**
	 * Processes keyboard events.
	 *
	 * If the Enter key is pressed, then the form is submitted.
	 * After that, as a response of the server, if one of the fields is filled with an invalid value, it will animate.
	 *
	 * @param {KeyboardEvent} event - the event to process
	 */
	handleKeyDown(event) {
		const {
			password: { value: password },
			newUsername: { value: newUsername },
			newPassword: { value: newPassword },
			passwordConfirm: { value: passwordConfirm },
		 } = this.state;

		if (event.key === 'Enter') {
			request('UpdateAccount', {
				password,
				fields: {
					password, newUsername, newPassword, passwordConfirm
				}
			}).then(response => {
				if (response.status === 204) {
					this.goBack();
				} else {
					return response.json().then(fields => {
						fields.forEach(field => {
							setTimeout(() => this.setFieldInvalid(field, false), 300);
							this.setFieldInvalid(field, true);
						});
					});
				}
			});
		}
	}

	/**
	 * Processes change events.
	 *
	 * @param {ChangeEvent} event - the event to process
	 * @param {string} field - the field to update
	 */
	updateField(event, field) {
		this.setState({
			[field]: {
				...this.state[field],
				value: event.target.value
			}
		});
	}

	/**
	 * Sets the specified field valid/invalid.
	 *
	 * @param {string} field - the valid/invalid field
	 * @param {boolean} invalid - true if the field is invalid, false otherwise
	 */
	setFieldInvalid(field, invalid) {
		this.setState({
			[field]: {
				...this.state[field],
				invalid
			}
		});
	}

	/**
	 * Given an array of fields, this method returns the DOM elements.
	 * It only returns text inputs.
	 *
	 * The items in the array are as follows:
	 *
	 * {
	 *   field: <name of the field>,
	 *   type: 'text' or 'password',
	 *   invalid: true or false
	 * }
	 *
	 * @param {Array} fields - the array of fields
	 */
	buildFields(fields) {
		return fields.map(({field, type, label}) =>
			<PrettyInput
				id={field}
				type={type}
				label={label}
				onChange={e => this.updateField(e, field)}
				value={this.state[field].value}
				className={this.state[field].invalid ? 'input-text-invalid' : ''}
			/>
		);
	}

	/**
	 * Renders all fields with their values
	 */
	render() {
		if (this.state.redirect) {
			return <Redirect to={process.env.PUBLIC_URL + '/admin'}/>
		}

		return (
			<div className="form-background background-color-blue">
				<div className="form-section">
					<div className="form-section-header"/>
					<div className="form" onKeyDown={this.handleKeyDown}>
						<h1 className="form-header-primary">Mon compte</h1>

						<h2 className="form-header-secondary">D'abord, saisissez votre mot de passe</h2>

						{this.buildFields([
							{ field: 'password', type: 'password', label: 'Mot de passe actuel'}
						])}

						<h2 className="form-header-secondary">Ensuite, mettez à jour vos informations</h2>

						{ this.buildFields([
							{ field: 'newUsername', type: 'text', label: 'Nouveau nom d\'utilisateur'},
							{ field: 'newPassword', type: 'password', label: 'Nouveau mot de passe'},
							{ field: 'passwordConfirm', type: 'password', label: 'Confirmation du mot de passe'}
						])}

						<div className="form-button background-color-blue" onClick={this.goBack}>
							<span className="form-button-content">Retour</span>
						</div>
					</div>
					<div className="form-section-footer"/>
				</div>
			</div>
		);
	}
}

export default AccountView;