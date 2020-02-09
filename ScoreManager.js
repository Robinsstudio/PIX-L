const QuestionUtils = require('./QuestionUtils');
const Impl = require('./impl');

class ScoreManager {
	constructor(questionManager) {
		this.questionManager = questionManager;
		this.scores = {};
		this.turn = 0;
		this.outOfTime = false;
	}

	addTeam(team) {
		if (!this.scores[team]) {
			this.scores[team] = {};
		}
	}

	getTeam(team) {
		return {
			team,
			score: Object.values(this.scores[team]).reduce((sum, {score}) => sum + score, 0)
		}
	}

	getTurn() {
		const teams = this.questionManager.getTeams();
		return teams.length ? teams[this.turn % teams.length] : null;
	}

	getQuestions() {
		const questions = [];
		let currentQuestion = this.questionManager.getActiveQuestion();

		while (currentQuestion && !questions.includes(currentQuestion)) {
			questions.push(currentQuestion);
			if (currentQuestion.linkedQuestion) {
				currentQuestion = this.questionManager.getLinkedQuestion(currentQuestion.linkedQuestion._id);
			}
		}

		return questions;
	}

	getActiveQuestion(team) {
		const unansweredQuestions = this.getQuestions().filter(({_id}) => !this.scores[team][_id]);
		if (unansweredQuestions.length) {
			return unansweredQuestions[0];
		}
	}

	getTeams() {
		return this.questionManager.getTeams().map(team => this.getTeam(team));
	}

	getLeadingTeams() {
		return this.getTeams().reduce((prev, current) => {
			if (prev.score < current.score) {
				prev = { teams: [current.team], score: current.score };
			} else if (prev.score === current.score) {
				prev.teams.push(current.team);
			}
			return prev;
		}, { teams: [], score: 0 }).teams;
	}

	updateScore(team, studentQuestion, originalQuestion, linked) {
		if (!this.outOfTime) {
			const originalQuestionId = originalQuestion._id.toString();
			const alreadyAnswered = this.scores[team][originalQuestionId];

			if (!alreadyAnswered) {
				const teams = this.questionManager.getTeams();
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

				if (correct) {
					feedback.positive = true;
				}

				this.fireFeedback(feedback, team);

				if (originalQuestion.linkedQuestion) {
					const linkedQuestion = this.questionManager.getLinkedQuestion(originalQuestion.linkedQuestion._id);
					if (linkedQuestion) {
						this.fireLinkedQuestionStarted(team, QuestionUtils.getActiveQuestion(linkedQuestion));
					}
				}
			}
			return alreadyAnswered;
		}
	}

	correct(team, question) {
		const activeQuestion = this.questionManager.getActiveQuestion();
		const teamActiveQuestion = this.getActiveQuestion(team);

		if (activeQuestion && teamActiveQuestion) {
			this.updateScore(team, question, teamActiveQuestion, activeQuestion !== teamActiveQuestion);
		}
	}

	teamsAnswered() {
		const activeQuestion = this.questionManager.getActiveQuestion();
		const activeQuestionId = activeQuestion._id.toString();

		if (activeQuestion) {
			return Object.values(this.scores).reduce((acc, score) => {
				return acc + (score[activeQuestionId] ? 1 : 0);
			}, 0);
		} else {
			return 0;
		}
	}

	updateTurn() {
		this.turn++;
	}

	timeOut() {
		this.outOfTime = true;
	}

	endQuestion() {
		this.outOfTime = false;
	}

	saveSession(idGame) {
		Impl.saveSession(idGame, this.scores);
	}

	onScoreChange(callback) {
		this.onScoreChangeHandler = callback;
	}

	onFeedback(callback) {
		this.onFeedbackHandler = callback;
	}

	onLinkedQuestionStarted(callback) {
		this.onLinkedQuestionStarted = callback;
	}

	fireScoreChange() {
		this.onScoreChangeHandler();
	}

	fireFeedback(feedback, team) {
		this.onFeedbackHandler(feedback, team);
	}

	fireLinkedQuestionStarted(team, linkedQuestion) {
		this.onLinkedQuestionStarted(team, linkedQuestion);
	}
}

module.exports = ScoreManager;