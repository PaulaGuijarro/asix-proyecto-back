var mongoose = require('mongoose');
var uniqueValidador = require('mongoose-unique-validator');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var AdminSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});
AdminSchema.plugin(uniqueValidador);

AdminSchema.pre('save', function(next) {
  var admin = this;
  bcrypt.genSalt(10, function(error, salt) {
    if (error) {
      throw error;
    }
    bcrypt.hash(admin.password, salt, null, function(error, hash) {
      if (error) {
        throw error;
      }
      admin.password = hash;
      next();
    });
  });
});

AdminSchema.methods.checkPassword = function(password, next) {
  var admin = this;
  bcrypt.compare(password, admin.password, function(error, result) {
    if (error) {
      throw error;
    }
    if (result) {
      next();
    } else {
      next('Error');
    }
  });
};

module.exports = mongoose.model('Admin', AdminSchema);
