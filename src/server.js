// librería utilizada para cargar variables de entorno a partir del archivo .env
var dotenv = require('dotenv');
// Se obtienen las variables de entorno nada más comenzar el proceso.
dotenv.load();

// Librería que permite el Cross-Origin para facilitar el desarrollo en local.
var cors = require('cors');
// Librería encargada de facilitar la creación de endpoints para peticiones HTTP.
var express = require('express');
// Librería que se añadirá a 'express' para parsear los campos incluidos en las peticiones HTTP.
var bodyParser = require('body-parser');
// Librería utilizada para logar con más detalle eventos que transcurren en el servidor.
var morgan = require('morgan');
// Librería utilizada para interactuar con la base de datos MongoDB.
var mongoose = require('mongoose');
// Librería utilizada para validar un token de autenticación, que vendrá en las cabeceras de todas las peticiones HTTP que requieran de
// un control de seguridad.
var jwt = require('jsonwebtoken');

// Modelos de base de datos creados con mongoose
var Admin = require('./models/admin');
var User = require('./models/user');

// Una vez finalizada la importación de las librerías necesarias, creamos una instancia de un proceso express para escuchar peticiones
// HTTP
var app = express();
// Añadimos a nuestra instancia la capacidad de parsear el cuerpo de una petición mediante la librería bodyparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Añadimos a nuestra instancia que logue en el servidor las peticiones que reciba, con nivel de desarrollo(Detalle mínimo)
app.use(morgan('dev'));
// Por último, añadimos las cabeceras que permiten Cross-Origin al servidor, para facilitar en desarrollo en local.
app.use(cors());

// Definimos un objeto que va a contener las credenciales para conectar al replica set de MongoDB. Estas credenciales se obtienen de un fichero
// de configuración .env que no está añadido al control de versiones para evitar problemas de seguridad.
var options = {
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
};

/**
 * Utilizando la librería mongoose, nos conectamos al replica set de MongoDB formado por 3 instancias. Para ello necesitamos
 * pasar como parámetro a la función connect:
 * + La url de conexión con formato MongoDB
 * + Opciones extra
 * + una función que será llamada una vez finalice la conexión, y que recibirá por parámetro un error si algo ha ido mal
 */
mongoose.connect(
  `mongodb://mongo-repl-1:27017,mongo-repl-2:27017,mongo-repl-3:27017/proyecto?replicaSet=rs0&readPreference=primary`,
  options,
  function(error) {
    // mongoose.connect(`mongodb://${process.env.DB_IP}:${process.env.DB_PORT}/proyecto`, options, function(error) {
    if (error) {
      // Si algo ha ido mal, lo mostramos por el servidor
      console.log('Error de conexión a MongoDB', error);
    } else {
      // Si todo funciona correctamente, así lo indicamos
      console.log('Conectado a MongoDB');
    }
  }
);

/*************************************************************************
 *                    PETICIONES SIN SEGURIDAD
 *************************************************************************/
// Estas son las peticiones HTTP que no requieren seguridad, es decir, no llevan una cabecera con un token

/**
 * Petición HTTP de tipo POST utilizada para hacer un login en la aplicación. Recibe como parámetros:
 * + La url a la que escucha (en este caso /login
 * + la función que se ha de ejecutar cuando una petición coincide con un POST /login y que recibe como parámetros:
 *    - La petición (req) realizada
 *    - La respuesta (res) que se va a devolver
 */
app.post('/login', function(req, res) {
  /**
   * Buscamos utilizando el modelo de mongoose referido a la tabla 'admins' de MongoDB un administrador
   * que tenga el mismo nombre que el que viene en el cuerpo de la petición. 
   * Para ello usamos la función findOne, que tiene su función análoga en MongoDB y que devuelve EXACTAMENTE un resultado, y en caso
   * de que varias filas coincidan con la búsqueda, que se pone en el primer parámetro de la función, devolverá el primero de ellos.
   * El cuerpo de la petición viene en req.body. De manera que si una petición es del estilo:
   * + POST /login {name: "administrador", password: "1212" }
   * la instancia de 'express', gracias a la librería de 'bodyparser' podrá convertirlo al parámetro 'body', dentro de la petición 'req'
   * Una vez terminada la búsqueda, se necesita una función que se ejecutará después y que recibe como parámetros:
   * + Si se ha producido algún error
   * + El dato recuperado de base de datos, si existe alguno
   */
  Admin.findOne({ name: req.body.usuario }, function(error, admin) {
    if (error) {
      // En caso de que se haya producido algún error, la petición termina con un código HTTP 500 (SERVER ERROR) y enviando como respuesta 
      // un objeto indicando que la petición ha sido errónea
      res.status(500).json({ success: false, message: 'Error' });
    } else {
      // Si la consulta a base de datos se ha ejecutado con normalidad
      if (!admin) {
        // En caso de no existir ninguna fila que satisfaga la consulta de MongoDB, 'admin' valdrá 'null' y por tanto enviaremos
        // una respuesta con código HTTP 404 (NOT FOUND) y enviando como respuesta un objeto indicando que el usuario no ha sido encontrado
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      } else {
        /**
         * Si por el contrario el dato ha sido encontrado, procedemos a comprobar si la contraseña que viene en el cuerpo de la petición 'body'
         * coincide con el almacenado en base de datos. Para ello nos valemos de utilizar la función 'checkPassword' que hemos definido manualmente
         * en los métodos del esquema de Admin en 'Admin.js', y que recibe como parámetros:
         * + La contraseña a comparar que viene en el cuerpo de la petición
         * + La función que se ejecutará una vez se compruebe si la contraseña coincide o no
         */
        admin.checkPassword(req.body.password, function(error) {
          if (error) {
            // En caso de que haya algún error comprobando la contraseña, devolvemos un respuesta HTTP con código 401 (UNAUTHORIZED)
            // y un objeto indicando que la contraseña es incorrecta
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
          } else {
            // En caso contrario, vamos a generar gracias a la librería 'jsonwebtoken' un token único. Ese token contendrá por tanto algo
            // que permita diferenciarlo del resto y en este caso incluiremos para generarlo el nombre del administrador que está intentanto acceder
            // y que es único Esto es lo que incluiremos en la variable payload
            const payload = {
              admin: admin.name,
            };
            /**
             * Generamos el token con la librería 'jsonwebtoken'. Para ello usamos la función 'sign' que recibe como parámetros:
             * + El contenido que se quiere cifrar
             * + Una palabra secreta con la que se va a firmar el token y que se da por variable de entorno situada en el fichero .env
             * + Un tiempo de expiración del token
             */
            var token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
            // Una vez generado el token, enviamos la petición de respuesta con código HTTP 200 (OK) y un objeto indicando que todo ha funcionado
            // correctamente y el token generado, que es el que el cliente utilizará en sus próximas peticiones incluyéndolo en la petición HTTP correspondiente
            res.json({ success: true, message: 'Acceso correcto', token });
          }
        });
      }
    }
  });
});

/**
 * Petición HTTP de tipo GET utilizada para crear un administrador en la aplicación. Recibe como parámetros
 * + La url a la que escucha (en este caso /setup
 * + la función que se ha de ejecutar cuando una petición coincide con un GET /setup y que recibe como parámetros:
 *    - La petición (req) realizada
 *    - La respuesta (res) que se va a devolver
 */
app.get('/setup', function(req, res) {
  console.log('Creando administrador');
  // Creamos un nuevo administrador utilizando el modelo que hemos creado con mongoose en 'admin.js'
  var admin = new Admin({
    name: 'Admin',
    password: '1234',
  });
  // Utilizando el mismo modelo, ejecutamos una consulta de creación en MongoDB, con el método 'save' que recibe como parámetros:
  // * error, en caso de que algo haya ido mal
  admin.save(function(error) {
    if (error) {
      // En caso de que se haya producido algún error, la petición termina con un código HTTP 500 (SERVER ERROR) y enviando como respuesta 
      // un objeto indicando que la petición ha sido errónea
      res.status(500).json({ success: false, message: 'Error al crear administrador' });
    } else {
      // En caso contrario, envíamos un código HTTP 200 (OK) que es enviado por defecto indicando que el usuario se ha creado correctamente
      res.json({ success: true, message: 'Administrador creado' });
    }
  });
});

/**
 * Petición HTTP de tipo GET utilizada para comprobar si un token es válido. Recibe como parámetros:
 * + La url a la que escucha (en este caso /check)
 * + la función que se ha de ejecutar cuando una petición coincide con un GET /check y que recibe como parámetros:
 *    - La petición (req) realizada
 *    - La respuesta (res) que se va a devolver
 */
app.get('/check', function(req, res) {
  // Obtenemos de la llamada HTTP el parámetro 'token'. Esto es, si la llamada es GET /check?token=1a2b3c4d, obtendremos 'token'
  // y lo almacenamos en una variable con el mismo nombre
  var token = req.query.token;
  if (!token) {
    // En caso de que token no exista, o sea vacío, enviamos una respuesta HTTP 401 (UNAUTHORIZED) indicando el error 
    res.status(401).send({
      success: false,
      message: 'No hay token',
    });
  } else {
    /**
     * En caso contrario, comprobamos la variable token utilizando la librería 'jsonwebtoken' y el método 'verify' que admite como parámetros:
     * + El token a comprobar
     * + El secreto usado para cifrar los tokens y que en este caso está en una variable de entorno
     * + La función que se ejecutará cuando se termine de validar el token, que recibe como parámetros:
     *    - Un error en caso de que la validación no sea correcta(ya sea porque ha expirado, o porque se ha modificado)
     */
    jwt.verify(token, process.env.JWT_SECRET, function(error) {
      if (error) {
        // En caso de que error exista, se envía un mensaje indicando el problema con una respuesta HTTP 401 (UNAUTHORIZED)
        res.status(401).json({ success: false, message: 'Token incorrecto' });
      } else {
        // En caso contrario, se manda una petición HTTP con código 200 (OK) indicando que el token es válido
        res.send({
          success: true,
          message: 'Token correcto',
        });
      }
    });
  }
});

/*************************************************************************
 *                    PETICIONES CON SEGURIDAD
 *************************************************************************/
// Ahora vamos a definir aquellas peticiones que requieren seguridad. La seguridad se implemente mediante un token que deberá ir en todas
// las cabeceras HTTP bajo el nombre 'token-seguro'

// Creamos un conjunto de peticiones gracias a la utilidad 'Router' de 'express'. Gracias a esto, podremos aplicar una serie de propiedades y
// middlewares o funciones entre medias a este conjunto de peticiones, que vamos a llamar 'secureRouter'
var secureRouter = express.Router();

/**
 * Indicamos al recién creado conjunto o router que TODAS sus peticiones tienen que tener una validación de token. Hacemos esto con la funció
 * use, que recibe como parámetro la función que se va a ejecutar antes que se ejecute la petición en si misma. El orden en que añadimos esto
 * middlewares importa, por esto se pone nada más crear el router, para asegurarnos de que todas las peticiones definidas después harán uso d
 * la función. Esta función recibe
 * + La petición (req) realizada
 * + La respuesta (res) que se va a devolver
 * + La función next para que continúe el proceso de la petición, pudiendo elegir nosotros cortar dicha petición en caso de que la validación sea errónea
 */
secureRouter.use(function(req, res, next) {
  // Intentamos obtener el token de las cabeceras de la petición accediendo al campo 'headers' del parámetro de entrada 'req'
  var token = req.headers['token-seguro'];
  if (!token) {
    // En caso de que no exista, la petición no puede ser validada, por tanto devolvemos una respuesta HTTP con código 401 (UNAUTHORIZED) 
    // con un objeto indicando el problema
    res.status(401).send({
      success: false,
      message: 'No hay token.',
    });
  } else {
    /**
     * En caso contrario, comprobamos la variable token utilizando la librería 'jsonwebtoken' y el método 'verify' que admite como parámetros:
     * + El token a comprobar
     * + El secreto usado para cifrar los tokens y que en este caso está en una variable de entorno
     * + La función que se ejecutará cuando se termine de validar el token, que recibe como parámetros:
     *    - Un error en caso de que la validación no sea correcta(ya sea porque ha expirado, o porque se ha modificado)
     */
    jwt.verify(token, process.env.JWT_SECRET, function(error) {
      if (error) {
        // En caso de que error exista, se envía un mensaje indicando el problema con una respuesta HTTP 401 (UNAUTHORIZED)
        res.status(401).json({ success: false, message: 'Token incorrecto' });
      } else {
        // Si por el contrario la validación es correcta, llamamos a la función 'next' que continuará con el proceso de la petición
        next();
      }
    });
  }
});

/**
 * Añadimos a nuestro conjunto de peticiones una petición de tipo GET a la ruta /users. Esta petición sirve para listar todos los usuario
 * que hay en la tabla 'users' de MongoDB. Cuando esta petición ocurra, entonces se ejecutará
 * la función que se envía como parámetro, y que a su vez tiene 2 parámetros:
 * + La petición (req) realizada
 * + La respuesta (res) que se va a devolver
 */
secureRouter.route('/users').get(function(req, res) {
  /**
   * Utilizando el modelo generado por 'mongoose' para la tabla 'users' en el archivo 'user.js' hacemos una consulta a MongoDB usando 
   * la función find, que recibe como parámetros:
   * + El filtro que se va a ejecutar, en este caso no hay ningún filtro, por lo que se pone un objeto vacío {}
   * + La función que se ejecutará cuando la consulta finalice, que a su vez recibe dos parámetros:
   *    - Un error si es que se produjo alguno, en caso contrario 'null'
   *    - El listado de usuarios en un array de objetos MongoDB, o un array vacío [] si no encontró ninguno
   */
  User.find({}, function(error, users) {
    if (error) {
      // Si se ha producido algún tipo de error se envía una petición de respuesta HTTP 500 (INTERNAL SERVER ERROR) indicando el problema
      res.status(500).json({ success: false, message: 'Error' });
    } else {
      // En caso contrario se envía el resultado de la consulta con un código HTTP 200 (OK)
      res.json({ success: true, users });
    }
  });
});

/**
 * Añadimos a nuestro conjunto de peticiones una petición de tipo POST a la ruta /users. Esta petición sirve para crear un nuevo usuario
 * en la tabla 'users' de MongoDB. Cuando esta petición ocurra, entonces se ejecutará la función que se envía como parámetro,
 * y que a su vez recibe 2 parámetros:
 * + La petición (req) realizada
 * + La respuesta (res) que se va a devolver
 */
secureRouter.route('/users').post(function(req, res) {
  // Creamos un nuevo usuario utilizando el modelo que hemos creado con mongoose en 'user.js' y dándole como parámetros de creación
  // los que obtenemos del cuerpo de la petición POST y que gracias a la librería 'bodyparser' podemos leer del parámetro 'body' de la petición 'req'
  var user = new User({
    name: req.body.name,
    lastname: req.body.lastname,
    dni: req.body.dni,
    email: req.body.email,
    department: req.body.department,
  });
  // Utilizando el mismo modelo, ejecutamos una consulta de creación en MongoDB, con el método 'save' que recibe como parámetros:
  // * Un error, en caso de que algo haya ido mal
  user.save(function(error) {
    if (error) {
      // Si algo ha ido mal, devolvemos una petición HTTP 500 (INTERNAL SERVER ERROR) indicando el problema. Esto puede ser debido por ejemplo
      // a cualquiera de los validadores del esquema de User, por unicidad, email, campo enumerado o vacío...
      res.status(500).json({ success: false, message: 'Error al crear usuario' });
    } else {
      // En caso contrario, devolvemos una respuesta HTTP 200 (OK) indicando que todo ha funcionado correctamente.
      res.json({ success: true, message: 'Usuario creado' });
    }
  });
});

/**
 * Añadimos a nuestro conjunto de peticiones una petición de tipo DELETE a la ruta /users/:id. Esta petición sirve para eliminar un usuario
 * en la tabla 'users' de MongoDB. Cuando esta petición ocurra, entonces se ejecutará la función que se envía como parámetro,
 * y que a su vez recibe 2 parámetros:
 * + La petición (req) realizada
 * + La respuesta (res) que se va a devolver
 */
secureRouter.route('/users/:id').delete(function(req, res) {
  /**
   * Utilizando el modelo generado por 'mongoose' para la tabla 'users' en el archivo 'user.js' hacemos una consulta a MongoDB usando 
   * la función remove, que recibe como parámetros:
   * + El filtro que se va a ejecutar, buscamos eliminar un usuario dado su _id de MongoDB, que lo enviamos en la petición.
   *    La librería 'express' parseará la petición /users/:id y detectará que :id es un parámetro, así que si por ejemplo ejecutamos la
   *    petición DELETE /users/1234566, cuando 'express' parsee la petición, incluirá en el objeto 'params' una nueva entrada de nombre 'id'
   *    con valor '1234566' así: params: { id: '1234566' }. Entonces, en el filtro de la consulta de borrado, incluiremos este parámetro
   * + La función que se ejecutará cuando la consulta finalice, que a su vez recibe un parámetros:
   *    - Un error si es que se produjo alguno, en caso contrario 'null'
   */
  User.remove({ _id: req.params.id }, function(error) {
    if (error) {
      // Si se ha producido algún tipo de error se envía una petición de respuesta HTTP 500 (INTERNAL SERVER ERROR) indicando el problema      
      res.status(500).json({ success: false, message: 'Error al borrar usuario' });
    } else {
      // En caso contrario, enviamos una respuesta HTTP 200 (OK) indicando que el usuario ha sido borrado
      res.json({ success: true, message: 'Usuario borrado' });
    }
  });
});

/**
 * Añadimos a nuestro conjunto de peticiones una petición de tipo PUT a la ruta /users/:id. Esta petición sirve para actualizar un usuario existente
 * en la tabla 'users' de MongoDB. Cuando esta petición ocurra, entonces se ejecutará la función que se envía como parámetro,
 * y que a su vez recibe 2 parámetros:
 * + La petición (req) realizada
 * + La respuesta (res) que se va a devolver
 */
secureRouter.route('/users/:id').put(function(req, res) {
  /**
   * Utilizando el modelo generado por 'mongoose' para la tabla 'users' en el archivo 'user.js' hacemos una consulta a MongoDB usando
   * la función findById, que sirve para buscar un elemento por id y que recibe como parámetros:
   * + Un identificador de MongoDB, que lo enviamos en la petición.
   *    La librería 'express' parseará la petición /users/:id y detectará que :id es un parámetro, así que si por ejemplo ejecutamos la
   *    petición PUT /users/1234566 { ...props }, cuando 'express' parsee la petición, incluirá en el objeto 'params' una nueva entrada de nombre 'id'
   *    con valor '1234566' así: params: { id: '1234566' }. De ese modo incluiremos este parámetro para realizar la llamada
   * + La función que se ejecutará cuando la consulta finalice, que a su vez recibe dos parámetros:
   *    - Un error si es que se produjo alguno, en caso contrario 'null'
   *    - El usuario encontrado, o null en caso de que ese identificador no existe en la tabla
   */
  User.findById(req.params.id, function(error, user) {
    if (error) {
      // Si se ha producido algún tipo de error se envía una petición de respuesta HTTP 500 (INTERNAL SERVER ERROR) indicando el problema            
      res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    } else {
      // En caso contrario, comprobamos si existe el usuario comprobando la variable 'user'
      if (!user) {
        // Si el usuario no existe, enviamos una respuesta HTTP 404 (NOT FOUND) indicando el problema
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      } else {
        // Si existe, obtenemos del cuerpo de la petición PUT los atributos que van a ser modificados que hemos podido extraer y parsear gracias a la librería 'bodyparser', 
        // comprobando uno a uno si existen. En caso de que un atributo a modificar exista, se sustituirá el contenido en el 'user' encontrado por el que venga en la petición.
        if (req.body.name) {
          user.name = req.body.name;
        }
        if (req.body.lastname) {
          user.lastname = req.body.lastname;
        }
        if (req.body.dni) {
          user.dni = req.body.dni;
        }
        if (req.body.email) {
          user.email = req.body.email;
        }
        if (req.body.department) {
          user.department = req.body.department;
        }
          // Por último utilizando el modelo generado por 'mongoose' para la tabla 'users' en el archivo 'user.js' hacemos una consulta a MongoDB usando 
          // la función save, que recibe como parámetros:
          // * La función que se ejecutará cuando la consulta finalice, que a su vez recibe parámetros:
          //    - Un error si es que se produjo alguno, en caso contrario 'null'
        user.save(function(error) {
          if (error) {
            // Si se ha producido algún tipo de error se envía una petición de respuesta HTTP 500 (INTERNAL SERVER ERROR) indicando el problema            
            res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
          } else {
            // En caso contrario, se envía una petición HTTP 200 (OK) indicando que todo ha funcionado correctamente
            res.json({ success: true, message: 'Usuario actualizado' });
          }
        });
      }
    }
  });
});

/**
 * Ahora que hemos añadido todas las peticiones a nuestro contenedor con seguridad, indicamos que todas esas peticiones van precedidas por la palabra 'secure'
 * Es decir, hasta ahora teníamos un contenedor con 4 peticiones HTTP que solo estaban contenidas en el contenedor, pero no en el contenedor origina
 * que es la variable 'app'.
 * Por tanto, solo queda incluir nuestro contenedor securizado bajo una subruta dentro del contenedor original.
 * Con esta instrucción, pasamos de:
 * app: { ...rutas_de_app }
 * secureRouter: { ...rutas_de_secureRouter }
 */
app.use('/secure', secureRouter);
/**
 * a
 * app: {
 *    ...rutas_de_app,
 *    '/secure' : {
 *        ...rutas_de_secureRouter
 *    }
 * }
 * y entonces, en nuestra aplicación principal 'express' tendremos las siguientes rutas operativas
 * 
 * Tipo     Ruta                Segura    Params  Url_Params    Body_Params 
 * ------------------------------------------------------------------------------------------------
 * GET      /setup              -         -       -             -
 * GET      /check              -         token   -             -
 * POST     /login              -         -       -             {usuario, password: String}
 * GET      /secure/users       *         -       -             -
 * POST     /secure/users       *         -       -             {name, lastname, dni, email, department: String}
 * PUT      /secure/users/:id   *         -       id            {name, lastname, dni, email, department: String}
 * DELETE   /secure/users/:id   *         -       id            -
 */

// Para terminar de configurar el servicio, le indicamos un puerto al que debe escuchar para recibir las peticiones, 
// en este caso el 3000, y que cuando arranca correctamente, ejecuta una función con un mensaje que lo indica.
app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
