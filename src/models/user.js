var mongoose = require('mongoose');
var uniqueValidador = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  dni: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Email incorrecto'],
  },
  department: {
    type: String,
    enum: ['RRHH', 'FINANCIERO', 'IT', 'DIRECTIVO'],
    required: true,
  },
});
UserSchema.plugin(uniqueValidador);
module.exports = mongoose.model('User', UserSchema);
