class ScoreManager {
	constructor() {
		this.scores = {};
	}

	addTeam(team) {
		if (this.scores[team] === undefined) {
			this.scores[team] = 0;
		}
	}

	getTeams(teams) {
		return teams.map(team => { return { team, score: this.scores[team] } });
	}

	startQuestion(question) {
		this.activeQuestion = question;
	}

	endQuestion() {
		this.activeQuestion = null;
	}
}

module.exports = ScoreManager;