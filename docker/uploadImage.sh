#!/bin/sh

# situamos el entorno del managerA1, que es el lider del swarm A
# https://docs.docker.com/machine/reference/env/
eval `docker-machine env managerA1`
# borramos la imagen local que está subida al repositorio de docker-hub
# https://docs.docker.com/engine/reference/commandline/rmi/
docker rmi -f paulaguijarro/proyecto-asix

# ejecutamos el script que crea una imagen local 
./docker/createImage.sh
# obtenemos el id de la imagen recién creada
# https://docs.docker.com/engine/reference/commandline/images/
IMAGEID=$(docker images -q proyecto-asix)
# etiquetamos la imagen con el id obtenido
# https://docs.docker.com/engine/reference/commandline/tag/
docker tag $IMAGEID paulaguijarro/proyecto-asix:latest
# subimos al repositorio de docker la imagen recién etiquetada
# para poder hacer push, tenemos que haber hecho login previamente. Una vez hecho login, no será
# necesario hacerlo más veces
# https://docs.docker.com/engine/reference/commandline/login/
# https://docs.docker.com/engine/reference/commandline/push/
docker push paulaguijarro/proyecto-asix
# borramos la imagen local a partir de la cual creamos la imagen que hemos subido al repositorio
# https://docs.docker.com/engine/reference/commandline/rmi/
docker rmi proyecto-asix

# situamos el entorno del managerA1, que es el lider del swarm B
# https://docs.docker.com/machine/reference/env/
eval `docker-machine env managerB1`
# borramos la imagen local que está subida al repositorio de docker-hub
# https://docs.docker.com/engine/reference/commandline/rmi/
docker rmi -f paulaguijarro/proyecto-asix

# ejecutamos el script que crea una imagen local 
./docker/createImage.sh
# obtenemos el id de la imagen recién creada
# https://docs.docker.com/engine/reference/commandline/images/
IMAGEID=$(docker images -q proyecto-asix)
# etiquetamos la imagen con el id obtenido
# https://docs.docker.com/engine/reference/commandline/tag/
docker tag $IMAGEID paulaguijarro/proyecto-asix:latest
# subimos al repositorio de docker la imagen recién etiquetada
# para poder hacer push, tenemos que haber hecho login previamente. Una vez hecho login, no será
# necesario hacerlo más veces
# https://docs.docker.com/engine/reference/commandline/login/
# https://docs.docker.com/engine/reference/commandline/push/
docker push paulaguijarro/proyecto-asix
# borramos la imagen local a partir de la cual creamos la imagen que hemos subido al repositorio
# https://docs.docker.com/engine/reference/commandline/rmi/
docker rmi proyecto-asix
