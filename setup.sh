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

function main {
  create_swarm
  upload_image
  create_service
}

main

