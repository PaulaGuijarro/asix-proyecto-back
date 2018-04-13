// Librería para operar con modelos de base de datos e interactuar con una base de datos MongoDB
var mongoose = require('mongoose');
// Plugin que actúa como middleware para comprobar si la restricción de unicidad se cumple en la tabla de base de datos
var uniqueValidador = require('mongoose-unique-validator');
// Librería mediante la cual ciframos texto plano
var bcrypt = require('bcrypt-nodejs');

// Obtenemos el objeto de mongoose que sirve para generar esquemas
var Schema = mongoose.Schema;

// Definición del esquema de la tabla 'admins' de MongoDB.
// Incluye: 
// * nombre(name). Campo único. String
// * contraseña(password). String
// La tabla administradores representan los usuarios que pueden acceder a la aplicación y administrar usuarios.
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

// Añadimos al esquema de Admin el plugin que nos ayuda a comprobar si cuando hagamos modificaciones en la base de datos,
// se cumple la unicidad de aquellos campos que en el esquema han sido identificados como únicos.
AdminSchema.plugin(uniqueValidador);

// Añadimos una función middleware (función que se ejecuta entre medias) que se ejecutará automáticamente antes de guardar cualquier administrador. En concreto, esta función lo que hará
// será obtener la contraseña en texto plano del administrador y la cifrará utilizando la librería 'bcrypt-nodejs'
// Esta función recibe como parámetro la función next, que indica la continuación del proceso de guardado cuando termine nuestro proceso de cifrado.
AdminSchema.pre('save', function(next) {
  // Creamos una variable para que el código sea más legible. Ya que es una instancia del modelo Admin la que se está guardando,
  // es esa instancia (this) la que está ejecutando esta función. La renombramos a 'admin'
  var admin = this;

  // Usando la librería 'bcrypt-nodejs' ciframos generamos un salt con una función que recibe como parámetros:
  // * El número de ciclos de generación de salt
  // * Una función que se ejecutará cuando termine de generarse el salt, y que recibe como parámetros: 
  //    - Un error (si se produjo alguno, si no será null)
  //    - El salt generado
  bcrypt.genSalt(10, function(error, salt) {
    if (error) {
      // Si se ha producido algún error, lo lanzamos como excepción para evitar que se almacene el usuario en base de datos      
      throw error;
    }
    // Si el salt se ha generado correctamente, lo utilizamos para cifrar la contraseña en plano del administrador.
    // Este cifrado se hace nuevamente con la librería 'bcrypt-nodejs' mediante una función que acepta:
    // * El texto a cifrar
    // * Un salt para cifrar
    // * Una función para indicar el proceso del cifrado(por si es muy complejo)
    // * Una función que se ejecutará cuando termine el proceso, y que recibe como parámetros:
    //    - Un error (si se produjo alguno, si no será null)
    //    - El texto cifrado
    bcrypt.hash(admin.password, salt, null, function(error, hash) {
      if (error) {
        // Si se ha producido algún error, lo lanzamos como excepción para evitar que se almacene el usuario en base de datos
        throw error;
      }
      // Si todo ha ido bien, reemplazamos el password del administrador que queremos guardar por el texto cifrado
      admin.password = hash;
      // Por último, como esta función es un middleware que se está ejecutando entre medias del proceso de guardado, llamamos a la función
      // next para que el proceso continúe
      next();
    });
  });
});

// 
/**
 * Añadimos un método o función personalizado a la lista de métodos del modelo creado. Este método se encargará, cuando se inicie un proceso de login
 * de comprobar que la contraseña en plano coincide con la contraseña cifrada almacenada en base de datos
 * 
 * @param {String} password La contraseña en plano a comparar
 * @param {function} next la función que se ejecutará cuando termine el proceso de comprobación, ya sea con o sin éxito
 */
AdminSchema.methods.checkPassword = function(password, next) {
  // Creamos una variable para que el código sea más legible. Ya que es una instancia del modelo Admin la que se está guardando,
  // es esa instancia (this) la que está ejecutando esta función. La renombramos a 'admin'
  var admin = this;

  // Utilizando la librería 'bcrypt-nodejs' comparamos la contraseña en plano con la almacenada en base de datos.
  // Esta función de bcrypt admite como parámetros:
  // * El texto en plano a comparar
  // * El texto cifrado con el que se va a comparar
  // * La función que se ejecutará una vez termine el proceso, que a su vez admite 2 parámetros:
  //    - Un error (si se produjo alguno, si no será null)
  //    - El resultado booleano de la comparación
  bcrypt.compare(password, admin.password, function(error, result) {
    if (error) {
        // Si se ha producido algún error, lo lanzamos como excepción para parar el proceso
        throw error;
    }
    if (result) {
      // Si la comparación es exitosa, ejecutamos la función de retorno o callback para que continue el proceso de ejecución
      next();
    } else {
      // Si la comparación es errónea, ejecutamos la función de retorno o callback para que continue el proceso de ejecución
      // pero enviando un mensaje de error
      next('Error');
    }
  });
};

// Por último, exportamos el modelo creado a partir del esquema que hemos configurado en los pasos anteriores
module.exports = mongoose.model('Admin', AdminSchema);
