const express = require('express');
const cookieParser = require('cookie-parser');

const router = express.Router();

router.use(cookieParser());
router.use('/api/', require('./routes'));

if (process.env.NODE_ENV === 'production') {
	router.get('/jeu/:id', (req, res) => {
		res.sendFile(__dirname + '/build/index.html');
	});

	router.use('/', express.static(__dirname + '/build'));

	console.log('Production server is running');
}

module.exports = function(server) {
	require('./sessions')(server);
	return router;
};