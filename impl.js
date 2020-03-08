const mongoose = require('mongoose');
const JSZip = require('jszip');
const ObjectId = mongoose.Schema.Types.ObjectId;

mongoose.connect('mongodb://localhost:27017/pix-l', { useNewUrlParser: true, useUnifiedTopology: true });

const Question = mongoose.model('Question', {
	/* Common fields */
	type: String,
	questionType: String,
	name: String,
	label: String,
	idParent: ObjectId,
	feedback: String,
	theme: String,
	time: Number,
	points: Number,
	linkedQuestion: {
		_id: ObjectId,
		name: String,
	},

	/* Multiple-choice question fields */
	answers: [{
		label: String,
		correct: Boolean,
		feedback: String
	}],

	/* Open-ended question fields */
	exactMatch: Boolean,
	words: [String],
	positiveFeedback: String,
	negativeFeedback: String,

	/* Matching question fields */
	matchingFields: [{
		label: String,
		answers: [{
			label: String,
			correct: Boolean
		}]
	}]

});

const Game  = mongoose.model('Game', {
	type: String,
	name: String,
	questions: [{ idQuestion: ObjectId }],
	url: String,
	idParent: ObjectId
});

const Folder = mongoose.model('Folder', {
	type: String,
	name: String,
	idParent: ObjectId
});

const Session = mongoose.model('Session', {
	idGame: ObjectId,
	date: Date,
	scores: Object
});

const getById = (_id) => {
	return Promise.all([ Folder.findById(_id), Question.findById(_id), Game.findById(_id) ]).then(result => result[0] || result[1] || result[2]);
}

const getByParams = (params) => {
	return Promise.all([ Folder.find(params), Question.find(params), Game.find(params) ]).then(result => {
		const folders = result[0].sort((file1, file2) => file1.name.localeCompare(file2.name));
		const files = result[1].concat(result[2]).sort((file1, file2) => file1.name.localeCompare(file2.name));
		return folders.concat(files);
	});
}

const getParents = (folder) => {
	return folder.idParent ? Folder.findOne({ _id: folder.idParent }).then(fold => {
		return fold.idParent ? getParents(fold).then(parents => parents.concat(fold)) : [fold];
	}) : Promise.resolve([]);
};

const copyRecursiveTo = (_id, idParent) => {
	return getById(_id).then(file => {
		const newId = mongoose.Types.ObjectId();

		return getByParams({ idParent: file._id }).then(files => {
			return Promise.all(files.map(f => copyRecursiveTo(f._id, newId)));
		}).then(() => {
			file._id = newId;
			file.idParent = idParent;
			file.name += ' - Copie';
			file.isNew = true;
			return file.save();
		});
	});
}

const deleteRecursive = (_id) => {
	return Folder.find({ idParent: _id }).then(folders => Promise.all(folders.map(folder => deleteRecursive(folder)))).then(() => {
		return Promise.all([ Folder.deleteMany({ idParent: _id }), Question.deleteMany({ idParent: _id }), Game.deleteMany({ idParent: _id }) ]);
	});
}

const getQuestionsByIds = (_ids) => {
	return Question.where('_id').in(_ids).then(questions => {
		return questions.sort((q1, q2) => _ids.indexOf(q1.id) - _ids.indexOf(q2.id));
	});
};

const formatTime = time => time.toString().padStart(2, '0');

module.exports = {
	createFolder: (folderData) => {
		return new Folder({ ...folderData, type: 'folder' }).save();
	},

	listFolder: (_id) => {
		if (_id) {
			return Folder.findById(_id).then(folder => {
				return Promise.all([
					folder,
					getParents(folder),
					getByParams({ idParent: folder._id })
				]);
			}).then(([folder, parents, files]) => {
				return { folder: { path: parents, active: folder }, files };
			});
		}
		return getByParams({ idParent: null }).then(files => {
			return { folder: { path: [], active: {} }, files };
		});
	},

	getQuestionsByIds,

	getQuestionNamesStartingWith: (start) => {
		const regex = new RegExp(`^${start}`, 'i');
		return Question.find({ name: regex }).limit(10).select('name');
	},

	getThemesStartingWith: (start) => {
		return Question.distinct('theme', { theme: new RegExp(`^${start}`, 'i') });
	},

	rename: (_id, name) => {
		return getById(_id).then(file => {
			file.name = name;
			file.save();
		});
	},

	move: (_id, idParent) => {
		return getById(_id).then(file => {
			file.idParent = idParent;
			return file.save();
		});
	},

	delete: (_id) => {
		return Promise.all([
			deleteRecursive(_id),
			Folder.deleteOne({ _id }),
			Question.deleteOne({ _id }),
			Game.deleteOne({ _id })
		]);
	},

	paste: (_id, idParent) => {
		return copyRecursiveTo(_id, idParent);
	},

	saveQuestion: (questionData) => {
		if (questionData._id) {
			return Question.findOneAndUpdate({ _id: questionData._id }, questionData, { upsert: true });
		} else {
			return new Question(questionData).save();
		}
	},

	saveGame: (gameData) => {
		if (gameData._id) {
			return Game.findOneAndUpdate({ _id: gameData._id }, gameData, { upsert: true });
		} else {
			return new Game(gameData).save();
		}
	},

	getGameById: (_id) => {
		return Game.find({ _id }).then(games => {
			if (games.length) {
				const game = games[0];
				return getQuestionsByIds(games[0].questions.map(quest => quest.idQuestion)).then(questions => {
					return { name: game.name, questions };
				});
			}
			return Promise.resolve({ name: '', questions: [] });
		});
	},

	saveSession: (sessionData) => {
		return Session.findOneAndReplace({ _id: sessionData._id }, sessionData, { upsert: true }).exec();
	},

	exportSessions: (idGame) => {
		return Session.find({ idGame }).then(sessions => {
			const zip = new JSZip();

			sessions.forEach(session => {
				const scores = session.scores;
				if (scores) {
					const teams = Object.keys(scores);

					const scoresByThemeByTeam = Object.entries(scores).reduce((acc, [team, scoresByQuestion]) => {
						Object.values(scoresByQuestion).forEach(score => {
							acc[score.theme] = acc[score.theme] || {};
							acc[score.theme][team] = acc[score.theme][team] + score.score || score.score;
						});
						return acc;
					}, {});

					const headers = ['Thème'].concat(teams.map(team => 'Équipe ' + team)).join(';');

					const rows = Object.entries(scoresByThemeByTeam).map(([theme, scoresByTeam]) => {
						return [theme].concat(teams.map(team => {
							return scoresByTeam[team] || 0;
						})).join(';');
					}).join('\n');

					const totals = ['Total'].concat(Object.values(scores).map(scoreByQuestion => {
						return Object.values(scoreByQuestion).reduce((acc, {score}) => acc + score, 0);
					})).join(';');

					const date = session.date;
					const fileName =
						`session_${formatTime(date.getFullYear())}_${formatTime(date.getMonth() + 1)}_`
						+ `${formatTime(date.getDate())}_${formatTime(date.getHours())}_${formatTime(date.getMinutes())}.csv`;

					zip.file(fileName, [headers, rows, totals].join('\n'));
				}
			});

			return Game.findById(idGame).select('name').then(game => {
				const name = game.name;
				if (name) {
					return { zip, name };
				}
				return { zip, name: 'sessions' };
			});
		});
	}
}