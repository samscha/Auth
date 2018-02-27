/* eslint-disable */

const mongoose = require('mongoose');
const { user, pass, authSource } = require('../config.js');

const bcrypt = require('bcrypt');
const BCRYPT_COST = 11;

const { sendUserError } = require('./server');

// Clear out mongoose's model cache to allow --watch to work for tests:
// https://github.com/Automattic/mongoose/issues/1251
mongoose.models = {};
mongoose.modelSchemas = {};

mongoose.Promise = Promise;

mongoose.connect('mongodb://localhost/users', {
  useMongoClient: true,
  user,
  pass,
  authSource,
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
});

UserSchema.pre('save', function(next) {
  bcrypt.hash(this.passwordHash, BCRYPT_COST, (err, hash) => {
    if (err) {
      sendUserError(err, res);
      return;
    }

    this.passwordHash = hash;
    next();
  });
});

module.exports = mongoose.model('User', UserSchema);
