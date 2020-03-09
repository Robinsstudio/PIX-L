import React, { Component, Fragment } from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import io from 'socket.io-client';
import TextRenderer from './TextRenderer';
import PrettyInput from './PrettyInput';
import StudentViewModal from './StudentViewModal';

import './style/form_view.css';
import './style/student_view.css';
import './style/team_chooser.css';

const MAX_TEAMS = 5;

/**
 * This view is used to play games with students.
 */
class StudentView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			teams: [],
			questions: [],
			time: null,
			zoomFactor: 100
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

	/**
	 * Initializes Socket.IO events
	 */
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

	/**
	 * Disconnects the socket if the user leaves the page.
	 */
	componentWillUnmount() {
		this.socket.disconnect();
	}

	/**
	 * Returns true is the user is authenticated, false otherwise.
	 * Students are not authenticated while admins are.
	 */
	isAuthenticated() {
		return this.props.authenticated;
	}

	/**
	 * Updates the questions.
	 *
	 * @param {Array} questions - the questions of the game
	 */
	updateQuestions(questions) {
		this.setState({ questions });
	}

	/**
	 * Updates the selected and unselected questions with the specified selection.
	 * The selection contains two fields:
	 *
	 * - selectedQuestions: the array of selected questions
	 * - unselectedQuestion: the array of unselected questions
	 *
	 * @param {Object} selection - the selected and unselected questions
	 */
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

	/**
	 * Updates the teams of students.
	 *
	 * @param {Array} teams - the teams of students
	 */
	updateTeams(teams) {
		this.setState({ teams: teams.sort((t1, t2) => t1.team - t2.team) })
	}

	/**
	 * Updates the feedback to display to the students after they answered a question.
	 * The feedback contains two fields:
	 *
	 * - specific: a feedback specific to the team's answer (optional)
	 * - general: a general feedback about the question
	 *
	 * The general feedback is displayed below the specific feedback.
	 *
	 * @param {Object} feedback - the feedback to display
	 */
	updateFeedback(feedback) {
		this.setState({ feedback: { ...feedback, visible: true } });
	}

	/**
	 * Hides the feedback.
	 */
	dismissFeedback() {
		this.setState({ feedback: { ...this.state.feedback, visible: false } });
	}


	/**
	 * Updates the team whose turn it is.
	 *
	 * @param {string} turn - the team whose turn it is
	 */
	updateTurn(turn) {
		this.setState({ turn });
	}

	/**
	 * Updates the maximum number of points which a team can obtain.
	 * This value is used to determine the size of scoring bars.
	 *
	 * @param {number} maxPoints - the maximum number of points
	 */
	updateMaxPoints(maxPoints) {
		this.setState({ maxPoints });
	}

	/**
	 * Starts a question.
	 *
	 * @param {Object} activeQuestion - the started question
	 */
	startQuestion(activeQuestion) {
		this.setState({ activeQuestion });
	}

	/**
	 * Ends a question.
	 */
	endQuestion() {
		this.setState({ activeQuestion: null, time: null });
	}

	/**
	 * Updates the remaining time for the active question.
	 */
	count(time) {
		this.setState({ time });
	}

	/**
	 * Chooses a team.
	 *
	 * Only students choose teams.
	 *
	 * @param {string} team - the choosen team
	 */
	handleTeamClicked(team) {
		this.socket.emit('teamChoice', team);
		this.setState({ team });
	}

	/**
	 * Choose a question to reveal / start.
	 *
	 * The first click reveals the theme of the question as well as its number of points.
	 * The second click starts the question.
	 *
	 * @param {number} index - the index of the question
	 */
	handleCardClicked(index) {
		if (this.isAuthenticated()) {
			this.socket.emit('selectQuestion', index);
		}
	}

	/**
	 * Cancels the last operation performed by an admin.
	 *
	 * There are two operations which can be cancelled:
	 *
	 * - Starting a question
	 * - Revealing a question
	 */
	handleCancelClicked() {
		this.socket.emit('cancel');
	}

	/**
	 * If a question is in progress, stops the question.
	 * Otherwise, stops the session.
	 *
	 * This feature is only available to admins.
	 */
	handleStopClicked() {
		this.socket.emit('stop');
	}

	/**
	 * Confirms that an admin wants to stop the active question.
	 *
	 * @param {boolean} confirmed - true if the admin confirmed, false otherwise
	 */
	handleConfirmedStopQuestion(confirmed) {
		if (confirmed) {
			this.socket.emit('confirmStopQuestion');
		}
		this.setState({ confirmStopQuestion: false });
	}

	/**
	 * Confirms that an admin wants to stop the session.
	 *
	 * @param {boolean} confirmed - true if the admin confirmed, false otherwise
	 */
	handleConfirmedStopSession(confirmed) {
		if (confirmed) {
			this.socket.emit('confirmStopSession');
		}
		this.setState({ confirmStopSession: false });
	}

	/**
	 * Confirms that an admin wants to cancel the active question.
	 *
	 * @param {boolean} confirmed - true if the admin confirmed, false otherwise
	 */
	handleConfirmedCancelQuestion(confirmed) {
		if (confirmed) {
			this.socket.emit('confirmCancelQuestion');
		}
		this.setState({ confirmCancelQuestion: false });
	}

	/**
	 * If the user is a team of students, submits the team's answer to the active question.
	 * If the user is an admin, shows the following linked question (if any).
	 */
	handleSubmit() {
		this.socket.emit('submit', this.state.activeQuestion);
	}

	/**
	 * Updates the team's answer to the active multiple choice question.
	 *
	 * @param {number} index - the index of the answer
	 */
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

	/**
	 * Updates the team's answer to the active open ended question.
	 *
	 * @param {Event} event - the change event
	 */
	handleOpenEndedAnswerChanged(event) {
		this.setState({
			activeQuestion: {
				...this.state.activeQuestion,
				openEndedAnswer: event.target.value
			}
		});
	}


	/**
	 * Updates the team's answer to the active matching question.
	 *
	 * @param {number} fieldIndex - the index of the field
	 * @param {number} answerIndex - the index of the answer in the field
	 */
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

	/**
	 * Builds the game.
	 */
	buildGame() {
		const { activeQuestion, zoomFactor } = this.state;

		const factor = zoomFactor / 100;

		const style = {
			'--card-width': `${factor * 11.25}rem`,
			'--card-margin': `${factor * 2}rem`,
			'--number-font-size': `${factor * 1.5}rem`,
			'--theme-font-size': `${factor}rem`,
			'--card-shadow': `${factor}rem`,
			'--card-shadow-active': `${factor * .5}rem`,
			'--card-border-radius': `${factor * .375}rem`
		};

		return (
			<div id="game" style={style}>
				{ activeQuestion ? this.buildActiveQuestion() : this.buildCards() }
			</div>
		);
	}

	/**
	 * Builds the cards.
	 */
	buildCards() {
		const { questions } = this.state;

		return (
			questions.map((question, i) => {
				return (
					<div className={`card ${question.selected ? 'selected' : 'background-color-blue'}`} key={question._id} onClick={() => this.handleCardClicked(i)}>
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

	/**
	 * Builds the multiple choice question body.
	 */
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

	/**
	 * Builds the open ended question body.
	 */
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

	/**
	 * Builds the matching question body.
	 */
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

	/**
	 * Builds the active question body.
	 * Depending on the question type, one of the following method will be called:
	 *
	 * - buildMultipleChoiceQuestionBody()
	 * - buildOpenEndedQuestionBody()
	 * - buildMatchingQuestionBody()
	 */
	buildActiveQuestionBody() {
		const { buildersByQuestionType, state: { activeQuestion } } = this;
		return buildersByQuestionType[activeQuestion.questionType]();
	}

	/**
	 * Builds the active question.
	 */
	buildActiveQuestion() {
		const { activeQuestion } = this.state;

		return (
			<div id="questionSection">
				<div id="questionLabel" className="color-blue">
					<div id="questionLabelRenderer">
						<TextRenderer key={activeQuestion.label} initialValue={activeQuestion.label}/>
					</div>
				</div>

				{ this.buildActiveQuestionBody() }

				<div className="form-button background-color-blue" onClick={this.handleSubmit}>
					<span className="form-button-content">{ this.isAuthenticated() ? 'Suivant' : 'Valider' }</span>
				</div>
			</div>
		);
	}

	/**
	 * Builds the scoring.
	*/
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

	/**
	 * Builds the team chooser.
	 * It is a dialog which allows students to choose their team.
	 */
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

	/**
	 * Builds a confirm dialog.
	 * This confirm dialog asks the admin if they really want to stop the active question.
	 */
	buildConfirmStopQuestion() {
		const { confirmStopQuestion } = this.state;

		return (
			confirmStopQuestion &&
				<StudentViewModal title="Terminer la question" onClosed={this.handleConfirmedStopQuestion} confirm>
					Certaines équipes n'ont pas encore répondu à la question. Voulez-vous vraiment la terminer ?
				</StudentViewModal>
		);
	}

	/**
	 * Builds a confirm dialog.
	 * This confirm dialog asks the admin if they really want to stop the session.
	 */
	buildConfirmStopSession() {
		const { confirmStopSession } = this.state;

		return (
			confirmStopSession &&
				<StudentViewModal title="Terminer la session" onClosed={this.handleConfirmedStopSession} confirm>
					Certaines questions n'ont pas encore été terminées. Voulez-vous vraiment terminer la session ?
				</StudentViewModal>
		);
	}

	/**
	 * Builds a confirm dialog.
	 * This confirm dialog asks the admin if they really want to cancel the active question.
	 */
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

	/**
	 * Builds the greeting dialog.
	 * It informs everyone of the winning teams.
	 */
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

	/**
	 * Builds the zoom bar.
	 * It allows resizing cards.
	 */
	buildZoom() {
		const { zoomFactor } = this.state;

		return (
			<div id="zoomWrapper">
				<div className="square-button background-color-blue mr-3" onClick={() => this.setState({ zoomFactor: Math.max(zoomFactor - 10, 30) })}>
					<i className="fas fa-minus"/>
				</div>
				<span className="color-blue">{ zoomFactor } %</span>
				<div className="square-button background-color-blue ml-3" onClick={() => this.setState({ zoomFactor: zoomFactor + 10 })}>
					<i className="fas fa-plus"/>
				</div>
			</div>
		);
	}

	/**
	 * Formats the remaining time for the active question.
	 */
	formatTime(time) {
		return `${((time - time % 60) / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
	}

	/**
	 * Builds the top bar.
	 * It contains three elements:
	 *
	 * - The remaining time
	 * - The cancel option (see handleCancelClicked())
	 * - The stop option (see handleStopClicked())
	 */
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

	/**
	 * Builds the feedback to display to the team of students after they answered the active question.
	 */
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

	/**
	 * Renders the StudentView.
	 */
	render() {
		return (
			<Fragment>
				<div id="gameWrapper">
					<div id="gameHeader"/>
					<div id="gameContainer">
						{ this.buildZoom() }
						{ this.buildTopBar() }
						{ this.buildGame() }
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