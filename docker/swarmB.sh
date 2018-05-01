#!/bin/sh

# default parameters
DOCKER_VERSION="https://github.com/boot2docker/boot2docker/releases/download/v18.03.0-ce/boot2docker.iso"

echo "-> Creando Swarm B con 2 managers y 2 workers con driver de virtualbox"
ADDITIONAL_PARAMS="--virtualbox-disk-size 3000 --virtualbox-memory 1024 --virtualbox-boot2docker-url=${DOCKER_VERSION}"

function getIP {
  echo $(docker-machine ip $1)
}

function get_worker_token {
  # obtiene el token del manager de swarm para dárselo a un worker
  echo $(docker-machine ssh managerB1 docker swarm join-token worker -q)
}

function get_manager_token {
  # obtiene el token del manager de swarm para dárselo a un manager
  echo $(docker-machine ssh managerB1 docker swarm join-token manager -q)
}

function createManagerNode {
  # crea los nodos manager
  echo "== Creando manager B1 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS managerB1
  echo "== Creando manager B2 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS managerB2
}

function createWorkerNode {
  # crea los nodos worker
  echo "== Creando worker B1 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS workerB1
  echo "== Creando worker B2 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS workerB2
}

function initSwarmManager {
  # inicializa el modo swarm
  echo '============================================'
  echo "======> Inicializando el primer manager del swarm..."
  docker-machine ssh managerB1 docker swarm init --listen-addr $(getIP managerB1):2377 --advertise-addr $(getIP managerB1):2377
}

function join_node_swarm {
  # Uniendo workers al swarm
  echo "======> worker B1 uniéndose al swarm..."
  docker-machine ssh workerB1 docker swarm join --token $(get_worker_token) --listen-addr $(getIP workerB1):2377 --advertise-addr $(getIP workerB1):2377 $(getIP managerB1):2377
  echo "======> worker B2 uniéndose al swarm..."
  docker-machine ssh workerB2 docker swarm join --token $(get_worker_token) --listen-addr $(getIP workerB2):2377 --advertise-addr $(getIP workerB2):2377 $(getIP managerB1):2377
}

function join_manager_swarm {
  # Uniendo manager al swarm
  echo "======> manager B2 uniéndose al swarm..."
  docker-machine ssh managerB2 docker swarm join --token $(get_manager_token) --listen-addr $(getIP managerB2):2377 --advertise-addr $(getIP managerB2):2377 $(getIP managerB1):2377
}


# Mostrar status
function status {
  echo "-> listando nodos del swarm B"
  docker-machine ssh managerB1 docker node ls
  echo
  echo "-> listando docker-machines"
  docker-machine ls
}

function main () {
  createManagerNode
  createWorkerNode
  initSwarmManager
  join_manager_swarm
  join_node_swarm
  status
}

main