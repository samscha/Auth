const mongoose = require('mongoose');
const { user, pass, authSource } = require('../config.js');

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

module.exports = mongoose.model('User', UserSchema);
