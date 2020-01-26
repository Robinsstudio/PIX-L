const QuestionUtils = require('./QuestionUtils');

class ScoreManager {
	constructor(questions) {
		this.questions = questions;
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
			score: Object.values(this.scores[team]).reduce((sum, score) => sum + score, 0)
		}
	}

	getTeams(teams) {
		return teams.map(team => this.getTeam(team));
	}

	startQuestion(question) {
		this.activeQuestion = this.questions[question];
	}

	endQuestion() {
		this.activeQuestion = null;
	}

	correct(team, question) {
		if (
			this.activeQuestion
			&& !Object.keys(this.scores[team]).includes(this.activeQuestion.theme)
			&& QuestionUtils.correctQuestion(question, this.activeQuestion)
		) {
			this.scores[team][this.activeQuestion.theme] = this.activeQuestion.points;
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