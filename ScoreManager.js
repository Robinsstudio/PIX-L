/**
 * This object manages the scoring of the teams of students.
 */

const QuestionUtils = require('./QuestionUtils');
const Impl = require('./impl');

class ScoreManager {
	constructor(dataManager) {
		this.dataManager = dataManager;
		this.scores = {};
		this.turn = 0;
		this.date = Date.now();
		this.outOfTime = false;
	}

	/**
	 * Adds a team.
	 *
	 * @param {string} team - the team
	 */
	addTeam(team) {
		if (!this.scores[team]) {
			this.scores[team] = {};
		}
	}

	/**
	 * Returns the score of the specified team.
	 *
	 * @param {string} team - the team
	 */
	getTeam(team) {
		return {
			team,
			score: Object.values(this.scores[team]).reduce((sum, {score}) => sum + score, 0)
		}
	}

	/**
	 * Returns the team whose turn it is.
	 */
	getTurn() {
		const teams = this.dataManager.getTeams();
		return teams.length ? teams[this.turn % teams.length] : null;
	}


	/**
	 * Returns the active question and all its linked questions.
	 */
	getQuestions() {
		const questions = [];
		let currentQuestion = this.dataManager.getActiveQuestion();

		while (currentQuestion && !questions.includes(currentQuestion)) {
			questions.push(currentQuestion);
			if (currentQuestion.linkedQuestion) {
				currentQuestion = this.dataManager.getLinkedQuestion(currentQuestion.linkedQuestion._id);
			}
		}

		return questions;
	}

	/**
	 * Returns the active question for the specified team.
	 * If the team has already answered the active question, then it returns its linked question if any.
	 * This process continues if there are multiple linked questions.
	 *
	 * @param {string} team - the team
	 */
	getActiveQuestion(team) {
		const unansweredQuestions = this.getQuestions().filter(({_id}) => !this.scores[team][_id]);
		if (unansweredQuestions.length) {
			return unansweredQuestions[0];
		}
	}

	/**
	 * Returns the active question for the specified team by a call to getActiveQuestion(team).
	 * After that, it filters out the answer fields and returns it.
	 *
	 * @param {string} team - the team
	 */
	getFilteredActiveQuestion(team) {
		const teamActiveQuestion = this.getActiveQuestion(team);
		if (teamActiveQuestion) {
			return QuestionUtils.getActiveQuestion(teamActiveQuestion);
		}
	}

	/**
	 * Returns the scores of all currently connected teams.
	 */
	getTeams() {
		return this.dataManager.getTeams().map(team => this.getTeam(team));
	}

	/**
	 * Returns the team which has the highest score.
	 */
	getLeadingTeams() {
		return Object.keys(this.scores).map(team => this.getTeam(team)).reduce((prev, current) => {
			if (prev.score < current.score) {
				prev = { teams: [current.team], score: current.score };
			} else if (prev.score === current.score) {
				prev.teams.push(current.team);
			}
			return prev;
		}, { teams: [], score: 0 }).teams;
	}

	/**
	 * Checks the answer of the team to their active question and updates their score accordingly.
	 *
	 * @param {string} team - the team
	 * @param {Object} studentQuestion - the answer from the team
	 * @param {Object} originalQuestion - the original question
	 * @param {boolean} linked - true if the question is a linked question, false otherwise
	 */
	updateScore(team, studentQuestion, originalQuestion, linked) {
		if (!this.outOfTime) {
			const originalQuestionId = originalQuestion._id.toString();
			const alreadyAnswered = this.scores[team][originalQuestionId];

			if (!alreadyAnswered) {
				const teams = this.dataManager.getTeams();
				let score = QuestionUtils.correctQuestion(studentQuestion, originalQuestion) ? originalQuestion.points : 0;
				const correct = score === originalQuestion.points;

				if (!linked && team === this.getTurn()) {

					const [answers, correctAnswers] = Object.values(this.scores).reduce((acc, score) => {
						let [ answers, correctAnswers ] = acc;

						if (score[originalQuestionId]) {
							answers++;

							if (score[originalQuestionId].correct) {
								correctAnswers++;
							}
						}

						return [ answers, correctAnswers ];
					}, [0, 0]);

					if (correct && correctAnswers === 0) {
						score++;
					}

					if (correct && answers === teams.length - 1) {
						score--;
					}
				}

				this.scores[team][originalQuestionId] = {
					theme: originalQuestion.theme,
					score,
					correct
				};

				this.fireScoreChange();

				const feedback = QuestionUtils.getFeedback(studentQuestion, originalQuestion);
				feedback.positive = !!correct;

				this.fireFeedback(feedback, team);

				if (originalQuestion.linkedQuestion) {
					const linkedQuestion = this.dataManager.getLinkedQuestion(originalQuestion.linkedQuestion._id);
					if (linkedQuestion) {
						this.fireLinkedQuestionStarted(team, QuestionUtils.getActiveQuestion(linkedQuestion));
					}
				}
			}
			return alreadyAnswered;
		}
	}

	/**
	 * Checks the answer of the team to the specified question.
	 *
	 * @param {string} team - the team
	 * @param {Object} question - the question that the team answered
	 */
	correct(team, question) {
		const activeQuestion = this.dataManager.getActiveQuestion();
		const teamActiveQuestion = this.getActiveQuestion(team);

		if (activeQuestion && teamActiveQuestion) {
			this.updateScore(team, question, teamActiveQuestion, activeQuestion !== teamActiveQuestion);
		}
	}

	/**
	 * Returns the number of teams which asked the active questions.
	 */
	teamsAnswered() {
		const activeQuestion = this.dataManager.getActiveQuestion();

		if (activeQuestion) {
			const activeQuestionId = activeQuestion._id.toString();

			return Object.values(this.scores).reduce((acc, score) => {
				return acc + (score[activeQuestionId] ? 1 : 0);
			}, 0);
		} else {
			return 0;
		}
	}

	/**
	 * Removes the points gained by the teams to the active question as a result of the question being canceled.
	 */
	cancelQuestion() {
		this.getQuestions().forEach(question => {
			const questionId = question._id.toString();
			Object.values(this.scores).forEach(score => delete score[questionId]);
		});

		this.fireScoreChange();
	}

	/**
	 * Updates the team whose turn it is.
	 */
	updateTurn() {
		this.turn++;
	}

	/**
	 * Sets the time as elapsed.
	 */
	timeOut() {
		this.outOfTime = true;
	}

	/**
	 * Reset the time.
	 */
	endQuestion() {
		this.outOfTime = false;
	}

	/**
	 * Saves the session.
	 *
	 * @param {string} _id - the id of the session
	 * @param {string} idGame - the id of the game
	 */
	saveSession(_id, idGame) {
		Impl.saveSession({ _id, idGame, scores: this.scores, date: this.date });
	}

	/**
	 * Returns true if no teams answered any question, false otherwise.
	 */
	canDiscard() {
		return Object.values(this.scores).every(score => !Object.keys(score).length);
	}

	/**
	 * Sets a listener to the score change event.
	 *
	 * @param {Function} callback - the listener
	 */
	onScoreChange(callback) {
		this.onScoreChangeHandler = callback;
	}

	/**
	 * Sets a listener to the feedback event.
	 *
	 * @param {Function} callback - the listener
	 */
	onFeedback(callback) {
		this.onFeedbackHandler = callback;
	}

	/**
	 * Sets a listener to the linked question started event.
	 *
	 * @param {Function} callback - the listener
	 */
	onLinkedQuestionStarted(callback) {
		this.onLinkedQuestionStarted = callback;
	}

	/**
	 * Fires the score change event.
	 */
	fireScoreChange() {
		this.onScoreChangeHandler();
	}

	/**
	 * Fires the feedback event.
	 *
	 * @param {Object} feedback - the feedback to respond to the team
	 * @param {string} team - the team
	 */
	fireFeedback(feedback, team) {
		this.onFeedbackHandler(feedback, team);
	}

	/**
	 * Fires the linked question started event.
	 *
	 * @param {string} team - the team
	 * @param {Object} linkedQuestion - the linked question which has started
	 */
	fireLinkedQuestionStarted(team, linkedQuestion) {
		this.onLinkedQuestionStarted(team, linkedQuestion);
	}
}

module.exports = ScoreManager;