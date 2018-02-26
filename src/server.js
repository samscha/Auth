/* eslint-disable */

const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

const User = require('./user');

const STATUS_USER_ERROR = 422;
const BCRYPT_COST = 11;

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());
server.use(
  session({
    secret: 'e5SPiqsEtjexkTj3Xqovsjzq8ovjfgVDFMfUzSmJO21dtXs4re',
    saveUninitialized: true,
    resave: true,
  }),
);

server.use((req, res, next) => {
  if (req.originalUrl.includes('/restricted')) {
    checkIfLoggedIn(req, res, next);

    if (!req.username) return;
  }

  next();
});

/* Sends the given err, a string or an object, to the client. Sets the status
 * code appropriately. */
const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  if (err && err.message) {
    res.json({ message: err.message, stack: err.stack });
  } else {
    res.json({ error: err });
  }
};

const checkIfLoggedIn = (req, res, next) => {
  if (!session.username) {
    sendUserError('Not logged in.', res);
    return;
  }

  User.findById(session.username).then(foundUser => {
    if (foundUser === null) {
      sendUserError('Logged in user not found in db.', res);
      return;
    }

    req.user = foundUser;
    next();
  });
};

server.post('/users', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    sendUserError('Please provide a username and/or password.', res);
    return;
  }

  bcrypt.hash(password, BCRYPT_COST, (err, hash) => {
    err
      ? sendUserError(err, res)
      : User({ username, passwordHash: hash })
          .save()
          .then(savedUser => res.json(savedUser))
          .catch(err => sendUserError(err, res));
  });
});

server.post('/log-in', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    sendUserError('Please provide a username and/or password.', res);
    return;
  }

  User.find({ username }).then(foundUser => {
    if (foundUser.length == 0) {
      sendUserError('User not found in db.', res);
      return;
    }

    if (foundUser.length > 1) {
      sendUserError('More than one user found in db.', res);
      return;
    }

    bcrypt.compare(password, foundUser[0].passwordHash, (err, isValid) => {
      if (err) {
        sendUserError(err, res);
        return;
      }

      if (isValid) {
        session.username = foundUser[0]._id;
        res.json({ success: true });
        return;
      }

      sendUserError('Invalid password.', res);
    });
  });
});

server.get('/me', checkIfLoggedIn, (req, res) => {
  // Do NOT modify this route handler in any way.
  res.json(req.user);
});

server.get('/restricted/something', (req, res) => {
  res.json({
    message: `something restricted accessed by ${req.user.username}`,
  });
});

server.get('/restricted/other', (req, res) => {
  res.json({ message: `other restricted accessed by ${req.user.username}` });
});
server.get('/restricted/a', (req, res) => {
  res.json({ message: `a restricted accessed by ${req.user.username}` });
});

module.exports = { server };
