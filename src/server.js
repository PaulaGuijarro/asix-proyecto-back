var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var Admin = require('./models/admin');
var User = require('./models/user');

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
            const payload = {
              admin: admin.name,
            };
            var token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
            res.json({ success: true, message: 'Acceso correcto', token });
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
    jwt.verify(token, process.env.JWT_SECRET, function(error) {
      if (error) {
        res.status(401).json({ success: false, message: 'Token incorrecto' });
      } else {
        next();
      }
    });
  }
});

secureRouter.route('/users').get(function(req, res) {
  User.find({}, function(error, users) {
    if (error) {
      res.status(500).json({ success: false, message: 'Error' });
    } else {
      res.json({ success: true, users });
    }
  });
});

secureRouter.route('/users').post(function(req, res) {
  var user = new User({
    name: req.body.name,
    lastname: req.body.lastname,
    dni: req.body.dni,
    email: req.body.email,
    department: req.body.department,
  });
  user.save(function(error) {
    if (error) {
      res.status(500).json({ success: false, message: 'Error al crear usuario' });
    } else {
      res.json({ success: true, message: 'Usuario creado' });
    }
  });
});

secureRouter.route('/users/:id').delete(function(req, res) {
  User.remove({ _id: req.params.id }, function(error) {
    if (error) {
      res.status(500).json({ success: false, message: 'Error al borrar usuario' });
    } else {
      res.json({ success: true, message: 'Usuario borrado' });
    }
  });
});

secureRouter.route('/users/:id').put(function(req, res) {
  User.findById(req.params.id, function(error, user) {
    if (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    } else {
      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      } else {
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
        user.save(function(error) {
          if (error) {
            res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
          } else {
            res.json({ success: true, message: 'Usuario actualizado' });
          }
        });
      }
    }
  });
});

app.use('/secure', secureRouter);

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
