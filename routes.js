const express = require('express');
const bodyParser = require('body-parser');
const Impl = require('./impl');

const router = express.Router();

router.use(bodyParser.json());

router.post('/CreateFolder', (req, res) => {
	const folderData = req.body;
	Impl.createFolder(folderData).then( () => res.status(200).end() );
});

router.post('/ListFolder', (req, res) => {
	const { _id } = req.body;
	Impl.listFolder(_id).then(json => res.json(json));
});

router.post('/GetQuestionsByIds', (req, res) => {
	const { _ids } = req.body;
	Impl.getQuestionsByIds(_ids).then(questions => res.json(questions));
});

router.post('/GetQuestionsByTags', (req, res) => {
	const { tags, idParent } = req.body;
	Impl.getQuestionsByTags(tags, idParent).then(questions => res.json(questions));
});

router.post('/GetTagsStartingWith', (req, res) => {
	const { start } = req.body;
	Impl.getTagsStartingWith(start).then(tags => res.json(tags));
});

router.post('/GetQuestionNamesStartingWith', (req, res) => {
	const { start } = req.body;
	Impl.getQuestionNamesStartingWith(start).then(names => res.json(names));
});

router.post('/GetThemesStartingWith', (req, res) => {
	const { start } = req.body;
	Impl.getThemesStartingWith(start).then(themes => res.json(themes));
});

router.post('/Rename', (req, res) => {
	const { _id, name } = req.body;
	Impl.rename(_id, name).then( () => res.status(200).end() );
});

router.post('/Move', (req, res) => {
	const { _id, idParent } = req.body;
	Impl.move(_id, idParent).then(() => res.status(200).end());
});

router.post('/Delete', (req, res) => {
	const { _id } = req.body;
	Impl.delete(_id).then(() => res.status(200).end());
});

router.post('/Paste', (req, res) => {
	const { _id, idParent } = req.body;
	Impl.paste(_id, idParent).then(() => res.status(200).end());
});

router.post('/SaveQuestion', (req, res) => {
	const questionData = { ...req.body, type: 'question'};
	Impl.saveQuestion(questionData).then( () => res.status(200).end() );
});

router.post('/SaveGame', (req, res) => {
	const gameData = { ...req.body, type: 'jeu'};
	Impl.saveGame(gameData).then( () => res.status(200).end() );
});

router.post('/GenerateLink', (req, res) => {
	const { _id } = req.body;
	Impl.generateLink(_id).then(() => res.status(200).end());
});

router.post('/GetGame', (req, res) => {
	const { url } = req.body;
	Impl.getByLink(url).then(questions => res.json(questions));
});

router.post('/SaveSession', (req, res) => {
	const { url, session } = req.body;
	Impl.saveSession(url, session).then(questions => res.json(questions));
});

module.exports = router;