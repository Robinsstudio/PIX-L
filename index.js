const express = require('express');
const app = express();

app.use('/', require('./pixl'));

app.listen(8080);