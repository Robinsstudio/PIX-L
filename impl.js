/**
 * This file contain the implementation of all features related to the file explorer.
 */

const mongoose = require('mongoose');
const JSZip = require('jszip');
const ObjectId = mongoose.Types.ObjectId;

mongoose.connect('mongodb://localhost:27017/pix-l', { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * Question model
 */
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

/**
 * Game model
 */
const Game  = mongoose.model('Game', {
	type: String,
	name: String,
	questions: [{ idQuestion: ObjectId }],
	url: String,
	idParent: ObjectId
});

/**
 * Folder model
 */
const Folder = mongoose.model('Folder', {
	type: String,
	name: String,
	idParent: ObjectId
});

/**
 * Session model
 */
const Session = mongoose.model('Session', {
	idGame: ObjectId,
	date: Date,
	scores: Object
});

/**
 * Returns a file by id.
 * A file can be a folder, a question or a game.
 *
 * @param {string} _id - the id of the file
 */
const getById = (_id) => {
	return Promise.all([ Folder.findById(_id), Question.findById(_id), Game.findById(_id) ]).then(result => result[0] || result[1] || result[2]);
}

/**
 * Returns files which match the specified parameters.
 * A file can be a folder, a question or a game.
 *
 * @param {Object} params - the parameters to filter files
 */
const getByParams = (params) => {
	return Promise.all([ Folder.find(params), Question.find(params), Game.find(params) ]).then(result => {
		const folders = result[0].sort((file1, file2) => file1.name.localeCompare(file2.name));
		const files = result[1].concat(result[2]).sort((file1, file2) => file1.name.localeCompare(file2.name));
		return folders.concat(files);
	});
}

/**
 * Recursively returns all ancestors of the specified folder.
 *
 * @param {Object} folder - the folder for which the ancestors must be returned
 */
const getParents = (folder) => {
	return folder.idParent ? Folder.findOne({ _id: folder.idParent }).then(fold => {
		return fold.idParent ? getParents(fold).then(parents => parents.concat(fold)) : [fold];
	}) : Promise.resolve([]);
};


/**
 * Recursively returns all questions contained in the folder and its subfolders with the specified id.
 *
 * @param {string} idParent - the id of the folder
 */
const getQuestionsByIdParentRecursive = (idParent) => {
	return Promise.all([
		Question.find({ idParent }),
		Folder.find({ idParent }).then(folders => {
			return Promise.all(folders.map(folder => getQuestionsByIdParentRecursive(folder._id)));
		})
	]).then(([children, descendants]) => children.concat(descendants.flat()));
};

/**
 * Creates a deep copy of the specified file in the target folder.
 * If the file is a folder, then all its content is recursively copied.
 *
 * @param {string} _id - the id of the file to copy
 * @param {string} idParent - the id of the target folder
 */
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

/**
 * Deletes the specified file.
 * If the file is a folder, then all its content is recursively deleted.
 *
 * @param {string} _id - the id of the file to delete
 */
const deleteRecursive = (_id) => {
	return Folder.find({ idParent: _id }).then(folders => Promise.all(folders.map(folder => deleteRecursive(folder)))).then(() => {
		return Promise.all([ Folder.deleteMany({ idParent: _id }), Question.deleteMany({ idParent: _id }), Game.deleteMany({ idParent: _id }) ]);
	});
}

/**
 * Returns all specified questions.
 *
 * @param {Array} _ids - the ids of the questions to return
 */
const getQuestionsByIds = (_ids) => {
	return Question.where('_id').in(_ids).then(questions => {
		return questions.sort((q1, q2) => _ids.indexOf(q1.id) - _ids.indexOf(q2.id));
	});
};

/**
 * Pads the specified number with up to two leading zeroes.
 *
 * @param {number} time - the number to format
 */
const formatTime = time => time.toString().padStart(2, '0');

module.exports = {
	/**
	 * Creates a new folder.
	 *
	 * @param {Object} folderData - the folder data
	 */
	createFolder: (folderData) => {
		return new Folder({ ...folderData, type: 'folder' }).save();
	},

	/**
	 * Returns all files contained in the specified folder.
	 * It also returns the ancestors of the folder for the breadcrumb.
	 *
	 * @param {string} _id - the id of the folder
	 */
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

	/**
	 * Returns all questions contained in the specified folder and its subfolders.
	 *
	 * @param {string} idParent - the id of the folder
	 */
	getQuestionsByIdParent: (idParent) => {
		return getQuestionsByIdParentRecursive(idParent);
	},

	/**
	 * Returns the name of the specified question.
	 *
	 * @param {string} _id - the id of the question
	 */
	getQuestionNameById: (_id) => {
		return Question.findById(_id).select('name');
	},

	/**
	 * Returns all questions whose names start with the specified string.
	 *
	 * @param {string} start - the beginning string
	 */
	getQuestionNamesStartingWith: (start) => {
		const regex = new RegExp(`^${start}`, 'i');
		return Question.find({ name: regex }).limit(10).select('name');
	},

	/**
	 * Returns all themes which start with the specified string.
	 *
	 * @param {string} start - the beginning string
	 */
	getThemesStartingWith: (start) => {
		return Question.distinct('theme', { theme: new RegExp(`^${start}`, 'i') });
	},

	/**
	 * Renames the specified file.
	 *
	 * @param {string} _id - the id of the file
	 * @param {string} name - the new name
	 */
	rename: (_id, name) => {
		return getById(_id).then(file => {
			file.name = name;
			file.save();
		});
	},

	/**
	 * Moves the specified file to a target folder.
	 *
	 * @param {string} _id - the id of the file
	 * @param {string} idParent - the id of the target folder
	 */
	move: (_id, idParent) => {
		return getById(_id).then(file => {
			file.idParent = idParent;
			return file.save();
		});
	},

	/**
	 * Deletes the specified file.
	 *
	 * @param {string} _id - the id of the file
	 */
	delete: (_id) => {
		return Promise.all([
			deleteRecursive(_id),
			Folder.deleteOne({ _id }),
			Question.deleteOne({ _id }),
			Game.deleteOne({ _id })
		]);
	},

	/**
	 * Pastes a file to a target folder.
	 *
	 * @param {string} _id - the id of the file
	 * @param {string} idParent - the id of the target folder
	 */
	paste: (_id, idParent) => {
		return copyRecursiveTo(_id, idParent);
	},

	/**
	 * Saves the specified question.
	 *
	 * @param {Object} questionData - the question data
	 */
	saveQuestion: (questionData) => {
		if (questionData._id) {
			return Question.findOneAndUpdate({ _id: questionData._id }, questionData, { upsert: true });
		} else {
			return new Question(questionData).save();
		}
	},

	/**
	 * Saves the specified game.
	 *
	 * @param {Object} - the game data
	 */
	saveGame: (gameData) => {
		if (gameData._id) {
			return Game.findOneAndUpdate({ _id: gameData._id }, gameData, { upsert: true });
		} else {
			return new Game(gameData).save();
		}
	},

	/**
	 * Returns all questions from the specified game.
	 *
	 * @param {string} _id - the id of the game
	 */
	getGameById: (_id) => {
		const emptyGame = { name: '', questions: [] };

		if (_id && _id.toString().match(/^[0-9a-f]{24}$/i)) {
			return Game.findById(_id).then(game => {
				if (game) {
					return getQuestionsByIds(game.questions.map(quest => quest.idQuestion)).then(questions => {
						return { name: game.name, questions };
					});
				}
				return emptyGame;
			});
		}
		return Promise.resolve(emptyGame);
	},

	/**
	 * Saves the specified session.
	 *
	 * @param {Object} sessionData - the session data
	 */
	saveSession: (sessionData) => {
		return Session.findOneAndReplace({ _id: sessionData._id }, sessionData, { upsert: true }).exec();
	},

	/**
	 * Creates a ZIP file with all sessions of the specified game and downloads it to the client.
	 *
	 * @param {string} idGame - the id of the game
	 */
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