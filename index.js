const app = require('express')();
const server = require('http').createServer(app);

app.use('/PIX-L', require('./pixl')(server));

server.listen(8080);