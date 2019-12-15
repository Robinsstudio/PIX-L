import React, { Component, Fragment } from 'react';
import { Input } from 'reactstrap';
import Modals from './Modals';
import request from './request';

import './style/student_view.css';

class StudentView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			name: {
				value: '',
				typingEnded: false
			},
			questions: [],
			current: 0,
			editable: true
		};

		this.setName = this.setName.bind(this);
		this.endTyping = this.endTyping.bind(this);
		this.handleAnswersChanged = this.handleAnswersChanged.bind(this);
		this.handleCurrentQuestionChanged = this.handleCurrentQuestionChanged.bind(this);
		this.handleDone = this.handleDone.bind(this);

		request('GetGame', { url: this.props.match.params.url })
		.then(res => res.json())
		.then(questions => this.setState({ questions }));
	}

	setName(event) {
		const { value } = event.target;
		this.setState({ name: { ...this.state.name, value } });
	}

	endTyping(event) {
		const { name } = this.state;
		if (event.key === 'Enter' && !name.value.match(/^\s*$/)) {
			this.setState({ name: { ...name, typingEnded: true } });
		}
	}

	handleAnswersChanged(questions) {
		this.setState({ questions });
	}

	handleCurrentQuestionChanged(current) {
		this.setState({ current });
	}

	handleDone() {
		const { url } = this.props.match.params;
		const { questions, name } = this.state;

		Modals.showConfirmModal('Confirmation des réponses',
				'En cliquant sur "Terminé", '
				+ 'vous validez l\'ensemble de vos réponses. Confirmez-vous votre choix ?')
		.then(() => {
			return request('SaveSession', {
				url,
				session: {
					name: name.value,
					questions
				}
			})
			.then(res => res.json())
			.then(questions => this.setState({ questions, current: 0, editable: false }));
		}, () => {});
	}

	buildNameInput() {
		const { value } = this.state.name;
		return (
			<Fragment>
				<label htmlFor="nameInput">Saisissez votre nom:</label>
				<Input
					id="nameInput"
					type="text"
					spellCheck="false"
					onChange={this.setName}
					onKeyDown={this.endTyping}
					value={value}
				/>
			</Fragment>
		);
	}

	render() {
		const { questions } = this.state;

		return (
			<div id="gameWrapper">
				<div id="gameHeader"/>
				<div id="gameContainer">
					{ questions.map((_,i) => {
						return (
							<div className="card">
								<div className="number">{i + 1}</div>
							</div>
						);
					})}
				</div>
				<div id="gameFooter"/>
			</div>
		);
	}
}

export default StudentView;