const QuestionUtils = require('./QuestionUtils');
const Impl = require('./impl');

class ScoreManager {
	constructor(questionManager) {
		this.questionManager = questionManager;
		this.scores = {};
		this.turn = 0;
		this.date = Date.now();
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

	getFilteredActiveQuestion(team) {
		const teamActiveQuestion = this.getActiveQuestion(team);
		if (teamActiveQuestion) {
			return QuestionUtils.getActiveQuestion(teamActiveQuestion);
		}
	}

	getTeams() {
		return this.questionManager.getTeams().map(team => this.getTeam(team));
	}

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
				feedback.positive = !!correct;

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

		if (activeQuestion) {
			const activeQuestionId = activeQuestion._id.toString();

			return Object.values(this.scores).reduce((acc, score) => {
				return acc + (score[activeQuestionId] ? 1 : 0);
			}, 0);
		} else {
			return 0;
		}
	}

	cancelQuestion() {
		this.getQuestions().forEach(question => {
			const questionId = question._id.toString();
			Object.values(this.scores).forEach(score => delete score[questionId]);
		});

		this.fireScoreChange();
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

	saveSession(_id, idGame) {
		Impl.saveSession({ _id, idGame, scores: this.scores, date: this.date });
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