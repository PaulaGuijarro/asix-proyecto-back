#! /bin/sh

function createSwarm {
  echo "******************************"
  echo "**** Creando el Swarm A... ***"
  echo "******************************"
  ./docker/swarmA.sh
  
  echo "******************************"
  echo "**** Creando el Swarm B... ***"
  echo "******************************"
  ./docker/swarmB.sh
}

function uploadImage {
  echo "*****************************"
  echo "****  Creando imagen...  ****"
  echo "*****************************"
  ./docker/uploadImage.sh
}

function createService {
  echo "*****************************"
  echo "***  Creando servicios...  **"
  echo "*****************************"
  ./docker/createService.sh
}

function addVisualizer {
  echo "**********************************"
  echo "***  Añadiendo visualizador...  **"
  echo "**********************************"

  # situamos el entorno del managerA1, que es el lider del swarm A
  # https://docs.docker.com/machine/reference/env/
  eval $(docker-machine env managerA1)
  # creamos 2 servicios dentro del swarm seleccionado en el entorno, llamados "visualizer"
  # le pasamos el puerto de escucha y el mapeo al contenedor docker del servicio
  # añadimos el requerimiento de que estos servicios estén únicamente en los nodos manager, de modo que si se cae un manager, seguiremos teniendo el visualizador
  # añadimos más parámetros requeridos por el visualizador
  # le indicamos la imagen a partir de la cual creará el servicio
  # https://github.com/dockersamples/docker-swarm-visualizer
  # https://docs.docker.com/engine/reference/commandline/service_create/
  docker service create --name visualizer --replicas 2 -p 8888:8080 --constraint=node.role==manager --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock dockersamples/visualizer
  
  # situamos el entorno del managerA1, que es el lider del swarm B
  # https://docs.docker.com/machine/reference/env/
  eval $(docker-machine env managerB1)
  # creamos 2 servicios dentro del swarm seleccionado en el entorno, llamados "visualizer"
  # le pasamos el puerto de escucha y el mapeo al contenedor docker del servicio
  # añadimos el requerimiento de que estos servicios estén únicamente en los nodos manager, de modo que si se cae un manager, seguiremos teniendo el visualizador
  # añadimos más parámetros requeridos por el visualizador
  # le indicamos la imagen a partir de la cual creará el servicio
  # https://github.com/dockersamples/docker-swarm-visualizer
  # https://docs.docker.com/engine/reference/commandline/service_create/
  docker service create --name visualizer --replicas 2 -p 8888:8080 --constraint=node.role==manager --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock dockersamples/visualizer
}

# función principal. Ejecuta todas las funciones en el orden necesario para crear un swarm
function main {
  createSwarm
  uploadImage
  createService
  addVisualizer
}

# llamada a la función principal
main

