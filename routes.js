module.exports = function(server) {
	const express = require('express');
	const bodyParser = require('body-parser');
	const Impl = require('./impl');
	const User = require('./User');
	const sessions = require('./sessions')(server);

	const router = express.Router();

	router.use(bodyParser.json());

	router.post('/CreateFolder', User.isAuthenticated, (req, res) => {
		const folderData = req.body;
		Impl.createFolder(folderData).then( () => res.status(200).end() );
	});

	router.post('/ListFolder', User.isAuthenticated, (req, res) => {
		const { _id } = req.body;
		Impl.listFolder(_id).then(json => res.json(json));
	});

	router.post('/GetQuestionsByIds', User.isAuthenticated, (req, res) => {
		const { _ids } = req.body;
		Impl.getQuestionsByIds(_ids).then(questions => res.json(questions));
	});

	router.post('/GetQuestionNamesStartingWith', User.isAuthenticated, (req, res) => {
		const { start } = req.body;
		Impl.getQuestionNamesStartingWith(start).then(names => res.json(names));
	});

	router.post('/GetThemesStartingWith', User.isAuthenticated, (req, res) => {
		const { start } = req.body;
		Impl.getThemesStartingWith(start).then(themes => res.json(themes));
	});

	router.post('/Rename', User.isAuthenticated, (req, res) => {
		const { _id, name } = req.body;
		Impl.rename(_id, name).then( () => res.status(200).end() );
	});

	router.post('/Move', User.isAuthenticated, (req, res) => {
		const { _id, idParent } = req.body;
		Impl.move(_id, idParent).then(() => res.status(200).end());
	});

	router.post('/Delete', User.isAuthenticated, (req, res) => {
		const { _id } = req.body;
		Impl.delete(_id).then(() => res.status(200).end());
	});

	router.post('/Paste', User.isAuthenticated, (req, res) => {
		const { _id, idParent } = req.body;
		Impl.paste(_id, idParent).then(() => res.status(200).end());
	});

	router.post('/SaveQuestion', User.isAuthenticated, (req, res) => {
		const questionData = { ...req.body, type: 'question'};
		Impl.saveQuestion(questionData).then( () => res.status(200).end() );
	});

	router.post('/SaveGame', User.isAuthenticated, (req, res) => {
		const gameData = { ...req.body, type: 'jeu'};
		Impl.saveGame(gameData).then( () => res.status(200).end() );
	});

	router.post('/UpdateAccount', User.isAuthenticated, (req, res) => {
		const { body: { password, fields }, jwt: { userId } } = req;
		User.updateAccount(userId, password, fields).then(
			() => res.status(204).end(),
			err => res.status(409).json(err)
		);
	});

	router.get('/export/:idGame', User.isAuthenticated, (req, res) => {
		const { idGame } = req.params;

		Impl.exportSessions(idGame).then(({name, zip}) => {
			res.setHeader('Content-disposition', `attachment; filename=${name}.zip`);
			res.setHeader('Content-type', 'application/zip');

			zip.generateNodeStream().pipe(res)
		});
	});

	router.post('/GetGame', (req, res) => {
		const { url } = req.body;
		Impl.getByLink(url).then(questions => res.json(questions));
	});

	router.post('/GetActiveSessions', (req, res) => {
		res.json(sessions.getActiveSessions());
	});

	router.post('/Authenticate', (req, res) => {
		const { username, password } = req.body;
		User.authenticate(username, password).then(token => {
			res.cookie('jwt', token, { httpOnly: true /*, secure: true */ }).status(200).json({ authenticated: true });
		}, error => {
			res.status(200).json({ authenticated: false });
		});
	});

	router.post('/isAuthenticated', (req, res) => {
		User.checkAuthentication(req.cookies.jwt, res).then(
			() => res.status(200).json({ authenticated: true }),
			() => res.status(200).json({ authenticated: false })
		);
	});

	return router;
}
