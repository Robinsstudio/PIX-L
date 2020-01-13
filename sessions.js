const cookie = require('cookie');
const Impl = require('./impl');
const User = require('./User');

class Session {
	constructor(io, url, questions) {
		this.io = io;
		this.room = url;
		this.questions = questions;
		this.admins = {};
		this.visibleQuestions = [];
	}

	broadcast(event, payload) {
		this.io.to(this.room).emit(event, payload);
	}

	isAdmin(socket) {
		return this.admins[socket.id];
	}

	initializeAdminEvents(socket) {
		socket.on('selectCard', index => {
			if (this.visibleQuestions.includes(index)) {
				this.broadcast('questionSelected', { index, selected: true });

				this.visibleQuestions = this.visibleQuestions.filter(index => {
					this.broadcast('cardSelected', { index, selected: false });
				});
			} else {
				this.visibleQuestions.push(index);
				this.broadcast('cardSelected', { index, selected: true });
			}
		});
	}

	addSocket(socket, { admin }) {
		if (admin) {
			this.admins[socket.id] = true;
			this.initializeAdminEvents(socket);
		}
		socket.join(this.room);

		this.visibleQuestions.forEach(index => socket.emit('cardSelected', { index, selected: true }));

		console.log('Listening to socket ' + socket.id);
	}
}

function authenticateSocket(socket) {
	if (socket.request.headers.cookie) {
		const { jwt } = cookie.parse(socket.request.headers.cookie);
		return User.checkAuthentication(jwt, socket.request.res).then(
			() => Promise.resolve({ admin: true }),
			() => Promise.resolve({ admin: false })
		);
	}
	return Promise.resolve({ admin: false });
}

module.exports = function(server) {
	const io = require('socket.io')(server, {
		serveClient: false
	}).of('/PIX-L');

	const sessions = {};

	io.on('connection', socket => {
		socket.on('init', data => {
			authenticateSocket(socket).then(admin => {
				const session = sessions[data.url];
				if (session) {
					session.addSocket(socket, { admin });
				} else {
					Impl.getByLink(data.url).then(questions => {
						if (questions.length) {
							const newSession = new Session(io, data.url, questions);
							newSession.addSocket(socket, { admin });
							sessions[data.url] = newSession;
						}
					});
				}
			});
		});

		socket.on('disconnect', () => console.log('Client disconnected!'));
	});
}

