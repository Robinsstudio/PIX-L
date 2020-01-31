const QuestionUtils = require('./QuestionUtils');

class ScoreManager {
	constructor(questionManager) {
		this.questionManager = questionManager;
		this.scores = {};
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

	getTeams(teams) {
		return teams.map(team => this.getTeam(team));
	}

	updateScore(team, studentQuestion, originalQuestion) {
		const originalQuestionId = originalQuestion._id.toString();
		const alreadyAnswered = Object.keys(this.scores[team]).includes(originalQuestionId);

		if (!alreadyAnswered) {
			const score = QuestionUtils.correctQuestion(studentQuestion, originalQuestion) ? originalQuestion.points : 0;

			this.scores[team][originalQuestionId] = {
				theme: originalQuestion.theme,
				score
			};

			this.fireScoreChange();

			if (score === originalQuestion.points && originalQuestion.linkedQuestion) {
				const linkedQuestion = this.questionManager.getLinkedQuestion(originalQuestion.linkedQuestion._id);
				if (linkedQuestion) {
					this.fireLinkedQuestionStarted(team, QuestionUtils.getActiveQuestion(linkedQuestion));
				}
			}
		}

		return alreadyAnswered && this.scores[team][originalQuestionId].score === originalQuestion.points;
	}

	correct(team, question) {
		const correctedQuestions = [];
		let currentQuestion = this.questionManager.getActiveQuestion();

		while (
			currentQuestion
			&& !correctedQuestions.includes(currentQuestion)
			&& this.updateScore(team, question, currentQuestion)
			&& currentQuestion.linkedQuestion
		) {
			correctedQuestions.push(currentQuestion);
			currentQuestion = this.questionManager.getLinkedQuestion(currentQuestion.linkedQuestion._id);
		}
	}

	onScoreChange(callback) {
		this.onScoreChangeHandler = callback;
	}

	onLinkedQuestionStarted(callback) {
		this.onLinkedQuestionStarted = callback;
	}

	fireScoreChange() {
		this.onScoreChangeHandler();
	}

	fireLinkedQuestionStarted(team, linkedQuestion) {
		this.onLinkedQuestionStarted(team, linkedQuestion);
	}
}

module.exports = ScoreManager;