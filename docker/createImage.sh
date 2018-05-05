#!/bin/sh

# borramos todas las imágenes previas de proyecto-asix
# https://docs.docker.com/engine/reference/commandline/rmi/
docker rmi -f proyecto-asix
# borramos las imágenes que no se estén usando para tener el directorio de imágenes limpio
# https://docs.docker.com/engine/reference/commandline/image_prune/
docker image prune -f
# borramos los volumenes que no estemos usando, en caso de tener alguno
# https://docs.docker.com/engine/reference/commandline/volume_prune/
docker volume prune -f

# una vez que tenemos el workspace de Docker limpio, creamos la imagen del servidor node.js con la aplicación de usuarios
# le añadimos la etiqueta proyecto-asix
# el comando buscará el archivo Dockerfile dentro del directorio dado como parámetro
# https://docs.docker.com/engine/reference/commandline/build/
docker build -t proyecto-asix ./asix-usuarios/


