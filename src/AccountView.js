import React, { Component } from 'react';
import PrettyInput from './PrettyInput';
import request from './request';

import './style/form_view.css';

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

		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	goBack() {
		window.location.href = process.env.PUBLIC_URL + '/';
	}

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

	updateField(event, field) {
		this.setState({
			[field]: {
				...this.state[field],
				value: event.target.value
			}
		});
	}

	setFieldInvalid(field, invalid) {
		this.setState({
			[field]: {
				...this.state[field],
				invalid
			}
		});
	}

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

	render() {
		return (
			<div className="form-background">
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

						<div className="form-button" onClick={this.goBack}>
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