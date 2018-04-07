var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.post('/login', function(req, res) {
  res.send('Intento de login' + req.body.usuario);
});

app.get('/setup', function(req, res) {
  res.send('Creando administrador');
});

app.get('/secure/usuarios', function(req, res) {
  res.send('Lista de usuarios');
});

app.post('/secure/usuarios', function(req, res) {
  res.send('Creando usuario');
});

app.delete('/secure/usuarios/:id', function(req, res) {
  res.send('Borrando usuario');
});

app.put('/secure/usuarios/:id', function(req, res) {
  res.send('Actualizando usuario');
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
