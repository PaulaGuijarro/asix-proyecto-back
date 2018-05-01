// Librería para operar con modelos de base de datos e interactuar con una base de datos MongoDB
var mongoose = require('mongoose');
// Plugin que actúa como middleware para comprobar si la restricción de unicidad se cumple en la tabla de base de datos
var uniqueValidador = require('mongoose-unique-validator');

// Obtenemos el objeto de mongoose que sirve para generar esquemas
var Schema = mongoose.Schema;

// Definición del esquema de la tabla 'users' de MongoDB.
// Incluye: 
// * nombre(name). String
// * apellido(lastname). String
// * dni(dni). Campo único. String
// * email(email). Campo único. String. Con cada inserción se convertirá a minúsculas y se eliminarán los espacios del comienzo y del final.
//    Además se validará que sea un email correcto mediante una expresión regular situada en el subcampo 'match'
// * departmamento(department). Campo enumerado.
// La tabla usuarios representan los usuarios que van a ser administrados en la aplicación.
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

// Añadimos al esquema de User el plugin que nos ayuda a comprobar si cuando hagamos modificaciones en la base de datos,
// se cumple la unicidad de aquellos campos que en el esquema han sido identificados como únicos.
UserSchema.plugin(uniqueValidador);

// Por último, exportamos el modelo creado a partir del esquema que hemos configurado en los pasos anteriores
module.exports = mongoose.model('User', UserSchema);
