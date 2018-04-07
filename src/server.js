var env = require('dotenv').load();
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

var options = {
  user: env.parsed.DB_USER,
  pass: env.parsed.DB_PASSWORD,
};

mongoose.connect(`mongodb://192.168.1.37:27017/proyecto`, options, function(error) {
  if (error) {
    console.log('Error de conexión a MongoDB', error);
  } else {
    console.log('Conectado a MongoDB');
  }
});

app.post('/login', function(req, res) {
  res.send('Intento de login' + req.body.usuario);
});

app.get('/setup', function(req, res) {
  res.send('Creando administrador');
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
