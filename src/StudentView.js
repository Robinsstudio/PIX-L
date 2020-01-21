import React, { Component, Fragment } from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import io from 'socket.io-client';
import TextRenderer from './TextRenderer';
import PrettyInput from './PrettyInput';
import request from './request';

import './style/form_view.css';
import './style/student_view.css';
import './style/team_chooser.css';

const MAX_TEAMS = 5;

class StudentView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			teams: [],
			questions: [],
			openEndedAnswer: '',
		};

		this.handleOpenEndedAnswerChanged = this.handleOpenEndedAnswerChanged.bind(this);
		this.buildMultipleChoiceQuestionBody = this.buildMultipleChoiceQuestionBody.bind(this);
		this.buildOpenEndedQuestionBody = this.buildOpenEndedQuestionBody.bind(this);
		this.buildMatchingQuestionBody = this.buildMatchingQuestionBody.bind(this);

		this.buildersByQuestionType = {
			multipleChoice: this.buildMultipleChoiceQuestionBody,
			openEnded: this.buildOpenEndedQuestionBody,
			matching: this.buildMatchingQuestionBody
		};

		request('GetGame', { url: this.props.match.params.url })
		.then(res => res.json())
		.then(questions => this.setState({ questions }));
	}

	componentDidMount() {
		const socket = io('/PIX-L');
		socket.on('connect', () => socket.emit('init', { url: this.props.match.params.url }));

		socket.on('questionSelection', questions => this.changeSelection(questions));
		socket.on('questionStart', question => this.startQuestion(question));

		socket.on('teamChange', teams => this.updateTeams(teams));

		socket.on('init', data => {
			this.changeSelection(data.questions);
			this.updateTeams(data.teams);
			this.setState({ initialized: true });
		});
		this.socket = socket;
	}

	isAuthenticated() {
		return this.props.authenticated;
	}

	changeSelection({ selectedQuestions, unselectedQuestions }) {
		this.setState({
			questions: this.state.questions.map((quest, i) => {
				if (selectedQuestions.includes(i)) {
					return { ...quest, selected: true };
				}
				if (unselectedQuestions.includes(i)) {
					return { ...quest, selected: false };
				}
				return quest;
			})
		});
	}

	updateTeams(teams) {
		this.setState({ teams: teams.sort((t1, t2) => t1.team - t2.team) })
	}

	startQuestion(index) {
		this.setState({ activeQuestion: this.state.questions[index] });
	}

	handleTeamClicked(team) {
		this.socket.emit('teamChoice', team);
		this.setState({ team });
	}

	handleCardClicked(index) {
		if (this.isAuthenticated()) {
			this.socket.emit('selectQuestion', index);
		}
	}

	handleMultipleChoiceAnswerChanged(index) {
		const { activeQuestion } = this.state;
		this.setState({
			activeQuestion: {
				...activeQuestion,
				answers: activeQuestion.answers.map((answer, i) => {
					return index === i ? { ...answer, correct: !answer.correct } : answer;
				})
			}
		});
	}

	handleOpenEndedAnswerChanged(event) {
		this.setState({ openEndedAnswer: event.target.value });
	}

	handleMatchingFieldAnswerChanged(fieldIndex, answerIndex) {
		const { activeQuestion } = this.state;
		this.setState({
			activeQuestion: {
				...activeQuestion,
				matchingFields: activeQuestion.matchingFields.map((field, i) => {
					return fieldIndex === i ? {
						...field,
						answers: field.answers.map((answer, j) => {
							return answerIndex === j ? { ...answer, correct: true } : { ...answer, correct: false }
						})
					} : field;
				})
			}
		});
	}

	buildCards() {
		const { questions } = this.state;

		return (
			questions.map((question, i) => {
				return (
					<div className={`card ${question.selected ? 'selected' : ''}`} key={question._id} onClick={() => this.handleCardClicked(i)}>
						<div className="card-background">
							<div className="number">{i + 1}</div>
						</div>
						<div className="theme">{ question.theme }</div>
						<div className="points">{ `${question.points} pt${question.points > 1 ? 's' : ''}` }</div>
					</div>
				);
			})
		);
	}

	buildMultipleChoiceQuestionBody() {
		const { answers } = this.state.activeQuestion;

		return (
			<div id="cardContainer">
				{answers.map((answer, i) => {
					return (
						<div className="card card--wide" key={answer._id} onClick={() => this.handleMultipleChoiceAnswerChanged(i)}>
							<input type="checkbox" checked={answer.correct} className="mr-3"/>
							<TextRenderer initialValue={answer.label}/>
						</div>
					);
				})}
			</div>
		);
	}

	buildOpenEndedQuestionBody() {
		const { openEndedAnswer } = this.state;

		return (
			<PrettyInput
				id="openEndedAnswer"
				type="text"
				label="Réponse"
				onChange={this.handleOpenEndedAnswerChanged}
				value={openEndedAnswer}
				large
			/>
		);
	}

	buildMatchingQuestionBody() {
		const { matchingFields } = this.state.activeQuestion;

		return (
			<div id="matchingFieldsDropdowns">
				{matchingFields.map((field, i) => {
					const correctAnswer = field.answers.find(answer => answer.correct);

					return (
						<Fragment>
							<label className="matchingFieldLabel color-blue">{ field.label }</label>
							<UncontrolledDropdown className="matchingFieldDropdown">
								<DropdownToggle caret>
									{correctAnswer ? correctAnswer.label : 'Sélectionnez la bonne réponse'}
								</DropdownToggle>
								<DropdownMenu>
									{field.answers.map((answer, j) =>
										<DropdownItem onClick={() => this.handleMatchingFieldAnswerChanged(i,j)}>{ answer.label }</DropdownItem>
									)}
								</DropdownMenu>
							</UncontrolledDropdown>
						</Fragment>
					);
				})}
			</div>
		);
	}

	buildActiveQuestionBody() {
		const { buildersByQuestionType, state: { activeQuestion } } = this;
		return buildersByQuestionType[activeQuestion.questionType]();
	}

	setNonBreakingSpaces(label) {
		return !label ? label : label.replace(/\s\?/g, '\u00a0?');
	}

	buildActiveQuestion() {
		const { activeQuestion } = this.state;

		return (
			<div id="questionSection">
				<div id="questionLabel" className="color-blue">
					<div id="questionLabelRenderer">
						<TextRenderer initialValue={this.setNonBreakingSpaces(activeQuestion.label)}/>
					</div>
				</div>

				{ this.buildActiveQuestionBody() }

				<div className="form-button" onClick={() => alert('Validé')}>
					<span className="form-button-content">Valider</span>
				</div>
			</div>
		);
	}

	buildTeamChooser() {
		const { initialized, team, teams } = this.state;
		if (initialized && !team && !this.isAuthenticated()) {
			return (
				<div className="darkBackground">
					<div id="teamChooser" className="color-blue">
						<div id="teamChooserTitle">Veuillez choisir une équipe</div>
						<div id="teamChooserBody">
							{Array.from({ length: MAX_TEAMS }, (_,i) => i + 1)
							.filter(team => !teams.find(t => team === t.team))
							.map(team => {
								return (
									<div className="teamOption" onClick={() => this.handleTeamClicked(team)}>
										Équipe {team}
										<div className={`teamOptionRectangle background-color-team-${team}`}/>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			);
		}
	}

	render() {
		const { activeQuestion, teams } = this.state;

		return (
			<Fragment>
				<div id="gameWrapper">
					<div id="gameHeader"/>
					<div id="gameContainer">
						<div id="game">
							{ activeQuestion ? this.buildActiveQuestion() : this.buildCards() }
						</div>
						<div id="score">
							<div className="points-container">
								{teams.map(({team, score}) => {
									return (
										<div className={`points-rectangle background-color-team-${team}`}>
											<div className={`points-value color-team-${team}`}>{score}</div>
										</div>
									);
								})}
							</div>
							<div class="points-label">pts</div>
						</div>
					</div>
					<div id="gameFooter"/>
				</div>
				{ this.buildTeamChooser() }
			</Fragment>
		);
	}
}

export default StudentView;