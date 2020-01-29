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

	correct(team, question) {
		const activeQuestion = this.questionManager.getActiveQuestion();
		const activeQuestionId = activeQuestion._id.toString();

		if (
			activeQuestion
			&& !Object.keys(this.scores[team]).includes(activeQuestionId)
		) {
			this.scores[team][activeQuestionId] = {
				theme: activeQuestion.theme,
				score: QuestionUtils.correctQuestion(question, activeQuestion) ? activeQuestion.points : 0
			};

			this.fireScoreChange();
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