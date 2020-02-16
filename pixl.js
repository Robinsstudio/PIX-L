module.exports = function(server) {
	const express = require('express');
	const cookieParser = require('cookie-parser');

	const router = express.Router();

	router.use(cookieParser());
	router.use('/api/', require('./routes')(server));

	if (process.env.NODE_ENV === 'production') {

		router.use('/', (req, res) => {
			express.static(__dirname + '/build')(req, res, () => {
				res.sendFile(__dirname + '/build/index.html');
			});
		});

		console.log('Production server is running');
	}

	return router;
};