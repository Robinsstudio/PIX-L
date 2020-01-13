const mongoose = require('mongoose');
const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const randomBytesAsync = util.promisify(crypto.randomBytes);
const pbkdf2Async = util.promisify(crypto.pbkdf2);
const signAsync = util.promisify(jwt.sign);
const verifyAsync = util.promisify(jwt.verify);

const secretKey = fs.readFileSync(__dirname + '/secret_key', 'utf8');

const NUM_ITERATIONS = 100000;
const HASH_SIZE = 512;
const DIGEST = 'sha512';

function clone(object, options = {}) {
	const newObject = {};
	Object.entries(object).forEach(function([key, value]) {
		if (!options.except || options.except !== key && !options.except.includes(key)) {
			newObject[key] = value;
		}
	});
	return newObject;
}

function delaySince(epoch) {
	return Date.now() / 1000 - epoch;
}

const UserSchema = new mongoose.Schema({
	username: String,
	password: Buffer,
	salt: Buffer,
	registrationDate: Date
});

UserSchema.statics.register = function(username, password) {
	return User.find({ username }).then(function(users) {
		if (users.length) {
			throw new Error('Username unavailable');
		}

		return randomBytesAsync(256).then(function(buffer) {
			return buffer;
		}).then(function(salt) {
			return pbkdf2Async(password, salt, NUM_ITERATIONS, HASH_SIZE, DIGEST).then(function(hash) {
				return new User({ username, password: hash, salt, registrationDate: Date.now() }).save();
			});
		});
	});
}

UserSchema.statics.authenticateUser = function(user, password) {
	return pbkdf2Async(password, user.salt, NUM_ITERATIONS, HASH_SIZE, DIGEST).then(function(hash) {
		if (Buffer.compare(hash, user.password)) {
			throw new Error('Incorrect password');
		}
		return signAsync({ userId: user._id }, secretKey);
	});
}

UserSchema.statics.authenticate = function(username, password) {
	return User.find({ username }).then(function(users) {
		if (!users.length) {
			throw new Error(`Username ${username} does not exist`);
		}
		return User.authenticateUser(users[0], password);
	});
}

UserSchema.statics.checkAuthentication = function(jwt, res) {
	return verifyAsync(jwt, secretKey).then(function(token) {
		if (delaySince(token.iat) > 60 * 60 * 24 * 7) {
			throw new Error('Token expired');
		}

		if (delaySince(token.iat) > 60 * 60 * 24 * 3.5) {
			return signAsync(clone(token, { except: 'iat' }), secretKey).then(function(tk) {
				res.cookie('jwt', tk, { httpOnly: true, /*, secure: true */ });
				return tk;
			});
		}

		return token;
	});
}

UserSchema.statics.isAuthenticated = function(req, res, next) {
	User.checkAuthentication(req.cookies.jwt, res).then(function(token) {
		req.jwt = token;
		next();
	}).catch(function() {
		res.sendStatus(401);
	});
}

UserSchema.statics.checkUsername = function(username) {
	return User.find({ username }).then(users => {
		if (users.length) {
			return Promise.reject('Username not available');
		}
	});
}

UserSchema.statics.checkPassword = function(user, password, confirm) {
	if (password !== confirm) {
		return Promise.reject('Passwords don\'t match');
	}
	return pbkdf2Async(password, user.salt, NUM_ITERATIONS, HASH_SIZE, DIGEST);
}

UserSchema.statics.updateAccount = function(userId, password, fields) {
	return User.findById(userId).then(user => {
		return User.authenticateUser(user, password).catch(() => Promise.reject(['password']))
		.then(() => {
			if (fields.newUsername) {
				return User.checkUsername(fields.newUsername)
				.catch(() => Promise.reject(['newUsername']));
			}
		}).then(() => {
			if (fields.newPassword || fields.passwordConfirm) {
				return User.checkPassword(user, fields.newPassword, fields.passwordConfirm)
				.catch(() => Promise.reject(['newPassword', 'passwordConfirm']));
			}
		}).then(hashedPassword => {
			user.username = fields.newUsername || user.username;
			user.password = hashedPassword || user.password;
			return user.save();
		});
	});
}

const User = mongoose.model('User', UserSchema);

module.exports = User;

