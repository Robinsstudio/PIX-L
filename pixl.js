const express = require('express');

const router = express.Router();

router.use('/api/', require('./routes'));

if (process.env.NODE_ENV === 'production') {
	router.get('/qcm/:id', (req, res) => {
		res.sendFile(__dirname + '/build/index.html');
	});

	router.use('/', express.static(__dirname + '/build'));

	console.log('Production server is running');
}

module.exports = router;