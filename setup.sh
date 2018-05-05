#! /bin/sh

function create_swarm {
  echo "*****************************"
  echo "****Creando el Swarm A...****"
  echo "*****************************"
  ./docker/swarmA.sh
  echo "******************************"
  echo "*****Creando el Swarm B...****"
  echo "******************************"
  ./docker/swarmB.sh
  
}

function upload_image {
  echo "Creando image..."
  ./docker/uploadImage.sh
}

function create_service {
  echo "Creando servicios..."
  ./docker/createService.sh
}

function add_visualizer {
  echo "Añadiendo el servicio de visualización de swarm..."
  eval $(docker-machine env managerA1)
  docker service create --name visualizer --replicas 2 -p 8888:8080 --constraint=node.role==manager --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock dockersamples/visualizer
  eval $(docker-machine env managerB1)
  docker service create --name visualizer --replicas 2 -p 8888:8080 --constraint=node.role==manager --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock dockersamples/visualizer
}

function main {
  create_swarm
  upload_image
  create_service
  add_visualizer
}

main

