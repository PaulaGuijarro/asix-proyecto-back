# Versión de la máquina node de docker
FROM node:9.11.1-alpine
# se crea un grupo y un usuario que será con el que se ejecute la aplicación
RUN addgroup -S nodeadmin && adduser -S -g nodeadmin nodeadmin
# se crea una variable de entorno que indica la ruta en la que irá instalada la aplicación
ENV HOME=/home/nodeadmin
# se copian los archivos fuentes de la aplicación a un directorio dentro de la variable de entorno definida anteriormente
COPY package.json package-lock.json $HOME/app/
COPY src/ $HOME/app/src
COPY .env $HOME/app
# Añadimos la librería dumb-init, la cual inicializa una serie de servicios de linux mínimos para que el SO funcione
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
# nos deplazamos a la ruta donde está la aplicación
WORKDIR $HOME/app
# hacemos al usuario que creamos anteriormente propietario de la carpeta de la aplicación
RUN chown -R nodeadmin:nodeadmin $HOME/* /usr/local/
# damos permisos de ejecución de los servicios mínimos de linux al usuario que hemos creado
RUN chmod +x /usr/local/bin/dumb-init
# verificamos que la cache de Node Package Manager es correcta, un simple checkeo de seguridad que es recomendable, pero no obligatorio
RUN npm cache verify
# instalamos la aplicación a partir del packaje.json y npm, sin que aparezca el progreso, para evitar logs
RUN npm install --silent --progress=false
# instalamos nodemon, un ejecutor de programas node.js con más funcionalidades, como autorecarga
RUN npm install nodemon -g
# cambiamos el usuario al que creamos anteriormente
USER nodeadmin
# abrirmos el puerto 3000 para conexiones entrantes y salientes, que es el puerto que utiliza la aplicación
EXPOSE 3000
# especificamos el comando que se ejecuta cuando iniciamos el contenedor
CMD ["dumb-init","npm", "start"]