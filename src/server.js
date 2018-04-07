var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var Admin = require('./models/admin');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

var options = {
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
};

mongoose.connect(`mongodb://${process.env.DB_IP}:${process.env.DB_PORT}/proyecto`, options, function(error) {
  if (error) {
    console.log('Error de conexión a MongoDB', error);
  } else {
    console.log('Conectado a MongoDB');
  }
});

app.post('/login', function(req, res) {
  Admin.findOne({ name: req.body.usuario }, function(error, admin) {
    if (error) {
      res.status(500).json({ success: false, message: 'Error' });
    } else {
      if (!admin) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      } else {
        admin.checkPassword(req.body.password, function(error) {
          if (error) {
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
          } else {
            res.json({ success: true, message: 'Acceso correcto' });
          }
        });
      }
    }
  });
});

app.get('/setup', function(req, res) {
  console.log('Creando administrador');
  var admin = new Admin({
    name: 'Admin',
    password: '1234',
  });
  admin.save(function(error) {
    if (error) {
      res.status(500).json({ success: false, message: 'Error al crear administrador' });
    } else {
      res.json({ success: true, message: 'Administrador creado' });
    }
  });
});

var secureRouter = express.Router();

secureRouter.use(function(req, res, next) {
  var token = req.headers['token-seguro'];
  if (!token) {
    res.status(401).send({
      success: false,
      message: 'No hay token.',
    });
  } else {
    console.log('token check passed');
    next();
  }
});

secureRouter.route('/users').get(function(req, res) {
  res.send('Lista de usuarios');
});

secureRouter.route('/users').post(function(req, res) {
  res.send('Creando usuario');
});

secureRouter.route('/users/:id').delete(function(req, res) {
  res.send('Borrando usuario');
});

secureRouter.route('/users/:id').put(function(req, res) {
  res.send('Actualizando usuario');
});

app.use('/secure', secureRouter);

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
