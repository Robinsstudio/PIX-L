const QuestionUtils = require('./QuestionUtils');
const Impl = require('./impl');

class ScoreManager {
	constructor(questionManager) {
		this.questionManager = questionManager;
		this.scores = {};
		this.activeQuestions = {};
		this.turn = 0;
	}

	addTeam(team) {
		if (!this.scores[team]) {
			this.scores[team] = {};
		}
		if (!this.activeQuestions[team]) {
			this.activeQuestions[team] = null;
		}
	}

	getTeam(team) {
		return {
			team,
			score: Object.values(this.scores[team]).reduce((sum, {score}) => sum + score, 0)
		}
	}

	getActiveQuestion(team) {
		return this.questionManager.getActiveQuestion()
			? this.activeQuestions[team] || QuestionUtils.getActiveQuestion(this.questionManager.getActiveQuestion()) : null;
	}

	getTeams(teams) {
		return teams.map(team => this.getTeam(team));
	}

	updateScore(team, studentQuestion, originalQuestion, linked) {
		const originalQuestionId = originalQuestion._id.toString();
		const alreadyAnswered = Object.keys(this.scores[team]).includes(originalQuestionId);

		if (!alreadyAnswered) {
			const teams = Object.keys(this.scores);
			let score = QuestionUtils.correctQuestion(studentQuestion, originalQuestion) ? originalQuestion.points : 0;
			const correct = score === originalQuestion.points;

			if (!linked && team == teams[this.turn % teams.length]) {

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

				if (correctAnswers === 0) {
					score++;
				}

				if (answers === teams.length - 1) {
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

				if (originalQuestion.linkedQuestion) {
					const linkedQuestion = this.questionManager.getLinkedQuestion(originalQuestion.linkedQuestion._id);
					if (linkedQuestion) {
						this.fireLinkedQuestionStarted(team, this.activeQuestions[team] = QuestionUtils.getActiveQuestion(linkedQuestion));
					}
				}
			}

			this.fireFeedback(feedback, team);
		}

		return alreadyAnswered && this.scores[team][originalQuestionId].correct;
	}

	correct(team, question) {
		const correctedQuestions = [];
		let currentQuestion = this.questionManager.getActiveQuestion();

		while (
			currentQuestion
			&& !correctedQuestions.includes(currentQuestion)
			&& this.updateScore(team, question, currentQuestion, correctedQuestions.length)
			&& currentQuestion.linkedQuestion
		) {
			correctedQuestions.push(currentQuestion);
			currentQuestion = this.questionManager.getLinkedQuestion(currentQuestion.linkedQuestion._id);
		}
	}

	updateTurn() {
		this.turn++;
	}

	endQuestion() {
		Object.keys(this.activeQuestions).forEach(team => this.activeQuestions[team] = null);
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