import React, { Component, Fragment } from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import io from 'socket.io-client';
import TextRenderer from './TextRenderer';
import PrettyInput from './PrettyInput';

import './style/form_view.css';
import './style/student_view.css';
import './style/team_chooser.css';
import StudentViewModal from './StudentViewModal';

const MAX_TEAMS = 5;

class StudentView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			teams: [],
			questions: [],
			time: null
		};

		this.dismissFeedback = this.dismissFeedback.bind(this);
		this.handleCancelClicked = this.handleCancelClicked.bind(this);
		this.handleStopClicked = this.handleStopClicked.bind(this);
		this.handleOpenEndedAnswerChanged = this.handleOpenEndedAnswerChanged.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleConfirmedStopQuestion = this.handleConfirmedStopQuestion.bind(this);
		this.handleConfirmedStopSession = this.handleConfirmedStopSession.bind(this);
		this.handleConfirmedCancelQuestion = this.handleConfirmedCancelQuestion.bind(this);
		this.buildMultipleChoiceQuestionBody = this.buildMultipleChoiceQuestionBody.bind(this);
		this.buildOpenEndedQuestionBody = this.buildOpenEndedQuestionBody.bind(this);
		this.buildMatchingQuestionBody = this.buildMatchingQuestionBody.bind(this);

		this.buildersByQuestionType = {
			multipleChoice: this.buildMultipleChoiceQuestionBody,
			openEnded: this.buildOpenEndedQuestionBody,
			matching: this.buildMatchingQuestionBody
		};
	}

	componentDidMount() {
		const socket = io('/PIX-L');
		socket.on('connect', () => socket.emit('init', { url: this.props.match.params.url }));

		socket.on('questionSelection', selection => this.updateSelection(selection));
		socket.on('questionStart', question => this.startQuestion(question));
		socket.on('questionEnd', () => this.endQuestion());

		socket.on('teamChange', teams => this.updateTeams(teams));
		socket.on('count', time => this.count(time));
		socket.on('feedback', feedback => this.updateFeedback(feedback));
		socket.on('turn', turn => this.updateTurn(turn))

		socket.on('confirmStopQuestion', () => this.setState({ confirmStopQuestion: true }));
		socket.on('confirmStopSession', () => this.setState({ confirmStopSession: true }));
		socket.on('confirmCancelQuestion', () => this.setState({ confirmCancelQuestion: true }));
		socket.on('greeting', winners => this.setState({ winners }));

		socket.on('init', data => {
			this.updateQuestions(data.questions);
			this.updateSelection(data.selection);
			this.updateTeams(data.teams);
			this.updateMaxPoints(data.maxPoints);
			this.setState({ initialized: true });
		});
		this.socket = socket;
	}

	isAuthenticated() {
		return this.props.authenticated;
	}

	updateQuestions(questions) {
		this.setState({ questions });
	}

	updateSelection({ selectedQuestions, unselectedQuestions }) {
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

	updateFeedback(feedback) {
		this.setState({ feedback: { ...feedback, visible: true } });
	}

	dismissFeedback() {
		this.setState({ feedback: { ...this.state.feedback, visible: false } });
	}

	updateTurn(turn) {
		this.setState({ turn });
	}

	updateMaxPoints(maxPoints) {
		this.setState({ maxPoints });
	}

	startQuestion(activeQuestion) {
		this.setState({ activeQuestion });
	}

	endQuestion() {
		this.setState({ activeQuestion: null, time: null });
	}

	count(time) {
		this.setState({ time });
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

	handleCancelClicked() {
		this.socket.emit('cancel');
	}

	handleStopClicked() {
		this.socket.emit('stop');
	}

	handleConfirmedStopQuestion(confirmed) {
		if (confirmed) {
			this.socket.emit('confirmStopQuestion');
		}
		this.setState({ confirmStopQuestion: false });
	}

	handleConfirmedStopSession(confirmed) {
		if (confirmed) {
			this.socket.emit('confirmStopSession');
		}
		this.setState({ confirmStopSession: false });
	}

	handleConfirmedCancelQuestion(confirmed) {
		if (confirmed) {
			this.socket.emit('confirmCancelQuestion');
		}
		this.setState({ confirmCancelQuestion: false });
	}

	handleSubmit() {
		this.socket.emit('submit', this.state.activeQuestion);
	}

	handleMultipleChoiceAnswerChanged(index) {
		const { activeQuestion } = this.state;
		const correct = !activeQuestion.answers[index].correct;

		this.setState({
			activeQuestion: {
				...activeQuestion,
				answers: activeQuestion.answers.map((answer, i) => {
					return { ...answer, correct: index === i ? correct : false };
				})
			}
		});
	}

	handleOpenEndedAnswerChanged(event) {
		this.setState({
			activeQuestion: {
				...this.state.activeQuestion,
				openEndedAnswer: event.target.value
			}
		});
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
							<input type="checkbox" checked={!!answer.correct} className="mr-3" readOnly/>
							<TextRenderer key={answer.label} initialValue={answer.label}/>
						</div>
					);
				})}
			</div>
		);
	}

	buildOpenEndedQuestionBody() {
		const { openEndedAnswer } = this.state.activeQuestion;

		return (
			<PrettyInput
				id="openEndedAnswer"
				type="text"
				label="Réponse"
				onChange={this.handleOpenEndedAnswerChanged}
				value={openEndedAnswer || ''}
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
						<TextRenderer key={activeQuestion.label} initialValue={this.setNonBreakingSpaces(activeQuestion.label)}/>
					</div>
				</div>

				{ this.buildActiveQuestionBody() }

				<div className="form-button" onClick={this.handleSubmit}>
					<span className="form-button-content">{ this.isAuthenticated() ? 'Suivant' : 'Valider' }</span>
				</div>
			</div>
		);
	}

	buildScore() {
		const { teams, turn, maxPoints } = this.state;

		return (
			<div id="score">
				{ turn &&
					<div id="team-turn" className="color-blue">
						Tour : <span className={`color-team-${turn}`}>Équipe { turn }</span>
					</div>
				}
				<div id="points-container">
					{teams.map(({team, score}) => {
						return (
							<div
								className={`points-rectangle background-color-team-${team}`}
								style={{ height: `${100 * score / maxPoints}%` }}
								key={team}
							>
								<div className={`points-value color-team-${team}`}>{score}</div>
							</div>
						);
					})}
				</div>
				<div id="points-label">pts</div>
			</div>
		);
	}

	buildTeamChooser() {
		const { initialized, team, teams } = this.state;
		if (initialized && !team && !this.isAuthenticated()) {
			return (
				<StudentViewModal title="Veuillez choisir une équipe">
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
				</StudentViewModal>
			);
		}
	}

	buildConfirmStopQuestion() {
		const { confirmStopQuestion } = this.state;

		return (
			confirmStopQuestion &&
				<StudentViewModal title="Terminer la question" onClosed={this.handleConfirmedStopQuestion} confirm>
					Toutes les équipes n'ont pas encore répondu à la question. Voulez-vous vraiment la terminer ?
				</StudentViewModal>
		);
	}

	buildConfirmStopSession() {
		const { confirmStopSession } = this.state;

		return (
			confirmStopSession &&
				<StudentViewModal title="Terminer la session" onClosed={this.handleConfirmedStopSession} confirm>
					Toutes les questions n'ont pas été terminées. Voulez-vous vraiment terminer la session ?
				</StudentViewModal>
		);
	}

	buildConfirmCancelQuestion() {
		const { confirmCancelQuestion } = this.state;

		return (
			confirmCancelQuestion &&
				<StudentViewModal title="Annuler la question" onClosed={this.handleConfirmedCancelQuestion} confirm>
					Certaines équipes ont déjà répondu à la question.
					Si vous annulez cette dernière, les points attribués leur seront retirés.
					Voulez-vous vraiment annuler la question ?
				</StudentViewModal>
		);
	}

	buildGreeting() {
		const { winners } = this.state;

		return (
			winners && winners.length &&
				<StudentViewModal>
					<div id="greeting">
						Félicitations
						{winners.map((winner, i, winners) => {
							const lastIndex = winners.length - 1;
							const separator =
								i > 0 && i < lastIndex ? ', '
								: i > 0 && i === lastIndex ? ' et '
								: ' ';

							return (
								<Fragment>
									<span>{separator}à l'</span>
									<span className={`color-team-${winner}`}>équipe {winner + (i < lastIndex ? '' : ' ')}</span>
								</Fragment>
							);
						})}
						qui remporte{winners.length > 1 ? 'nt' : ''} la victoire !
					</div>
				</StudentViewModal>
		);
	}

	formatTime(time) {
		return `${((time - time % 60) / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
	}

	buildTopBar() {
		const { activeQuestion, time } = this.state;
		return (
			<div id="topBar">
				<div id="countdown" className="color-orange">
					{ activeQuestion && time != null
						? this.formatTime(time)
						: ( activeQuestion
							? this.formatTime(activeQuestion.time)
							: '' )
					}
				</div>
				{ this.isAuthenticated() &&
					<div>
						<div id="cancelLast" className="color-blue" onClick={this.handleCancelClicked}>
							{ activeQuestion ? 'Annuler la question' : 'Annuler la dernière carte retournée' }
						</div>
						<div id="stopLast" className="color-blue" onClick={this.handleStopClicked}>
							{ activeQuestion ? 'Terminer la question' : 'Terminer la session' }
						</div>
					</div>
				}
			</div>
		);
	}

	buildFeedback() {
		const { feedback } = this.state;
		const visible = feedback && feedback.visible;
		const positive = feedback && feedback.positive;

		return (
			<div id="feedback" className={`${visible ? 'visible' : ''} ${positive ? 'positive-feedback' : 'negative-feedback'}`}>
				<i className="dismiss fas fa-times" onClick={this.dismissFeedback}/>
				{ feedback && feedback.specific ? <TextRenderer key={feedback.specific} initialValue={feedback.specific}/> : null }
				{ feedback && feedback.general ? <TextRenderer key={feedback.general} initialValue={feedback.general}/> : null }
			</div>
		);
	}

	render() {
		const { activeQuestion } = this.state;

		return (
			<Fragment>
				<div id="gameWrapper">
					<div id="gameHeader"/>
					<div id="gameContainer">
						{ this.buildTopBar() }
						<div id="game">
							{ activeQuestion ? this.buildActiveQuestion() : this.buildCards() }
						</div>
						{ this.buildFeedback() }
						{ this.buildScore() }
					</div>
					<div id="gameFooter"/>
				</div>
				{ this.buildTeamChooser() }
				{ this.buildConfirmStopQuestion() }
				{ this.buildConfirmStopSession() }
				{ this.buildConfirmCancelQuestion() }
				{ this.buildGreeting() }
			</Fragment>
		);
	}
}

export default StudentView;