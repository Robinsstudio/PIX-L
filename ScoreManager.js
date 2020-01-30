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
		this.scores[team][originalQuestion._id] = {
			theme: originalQuestion.theme,
			score: QuestionUtils.correctQuestion(studentQuestion, originalQuestion) ? originalQuestion.points : 0
		};

		this.fireScoreChange();
	}

	correct(team, question) {
		const activeQuestion = this.questionManager.getActiveQuestion();

		if (activeQuestion) {
			const activeQuestionId = activeQuestion._id.toString();

			if (!Object.keys(this.scores[team]).includes(activeQuestionId)) {
				this.updateScore(team, question, activeQuestion);
			}
		}
	}

	onScoreChange(callback) {
		this.onScoreChangeHandler = callback;
	}

	fireScoreChange() {
		this.onScoreChangeHandler();
	}
}

module.exports = ScoreManager;