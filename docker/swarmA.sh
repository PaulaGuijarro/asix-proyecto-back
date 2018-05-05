#!/bin/sh

# default parameters
DOCKER_VERSION="https://github.com/boot2docker/boot2docker/releases/download/v18.03.0-ce/boot2docker.iso"

echo "-> Creando Swarm A con 2 managers y 2 workers con driver de virtualbox"
ADDITIONAL_PARAMS="--virtualbox-disk-size 3000 --virtualbox-memory 1024 --virtualbox-boot2docker-url=${DOCKER_VERSION}"

function getIP {
  echo $(docker-machine ip $1)
}

function changeIp {
  echo "--------------------------------------------------"
  echo "Reasignando IP $2 a docker-machine $1"
  docker-machine ssh $1 "echo \"kill \\\`cat /var/run/udhcpc.eth1.pid\\\`\" | sudo tee /var/lib/boot2docker/bootsync.sh > /dev/null"
  docker-machine ssh $1 "echo \"ifconfig eth1 $2 netmask 255.255.255.0 broadcast 192.168.99.255 up\" | sudo tee -a /var/lib/boot2docker/bootsync.sh > /dev/null"
  docker-machine restart $1
  docker-machine regenerate-certs $1 -f
}

function get_worker_token {
  # obtiene el token del manager de swarm para dárselo a un worker
  echo $(docker-machine ssh managerA1 docker swarm join-token worker -q)
}

function get_manager_token {
  # obtiene el token del manager de swarm para dárselo a un manager
  echo $(docker-machine ssh managerA1 docker swarm join-token manager -q)
}

function createManagerNode {
  # crea los nodos manager
  echo "== Creando manager A1 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS managerA1
  changeIp "managerA1" "192.168.99.127"
  echo "== Creando manager A2 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS managerA2
  changeIp "managerA2" "192.168.99.128"  
}

function createWorkerNode {
  # crea los nodos worker
  echo "== Creando worker A1 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS workerA1
  changeIp "workerA1" "192.168.99.129" 
  echo "== Creando worker A2 ...";
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS workerA2
  changeIp "workerA2" "192.168.99.130"
}

function initSwarmManager {
  # inicializa el modo swarm
  echo '============================================'
  echo "======> Inicializando el primer manager del swarm..."
  docker-machine ssh managerA1 docker swarm init --listen-addr $(getIP managerA1):2377 --advertise-addr $(getIP managerA1):2377
}

function join_manager_swarm {
  # Uniendo manager al swarm
  echo "======> manager A2 uniéndose al swarm..."
  docker-machine ssh managerA2 docker swarm join --token $(get_manager_token) --listen-addr $(getIP managerA2):2377 --advertise-addr $(getIP managerA2):2377 $(getIP managerA1):2377
}

function join_node_swarm {
  # Uniendo workers al swarm
  echo "======> worker A1 uniéndose al swarm..."
  docker-machine ssh workerA1 docker swarm join --token $(get_worker_token) --listen-addr $(getIP workerA1):2377 --advertise-addr $(getIP workerA1):2377 $(getIP managerA1):2377
  echo "======> worker A2 uniéndose al swarm..."
  docker-machine ssh workerA2 docker swarm join --token $(get_worker_token) --listen-addr $(getIP workerA2):2377 --advertise-addr $(getIP workerA2):2377 $(getIP managerA1):2377
}

# Mostrar status
function status {
  echo "-> listando nodos del swarm A"
  docker-machine ssh managerA1 docker node ls
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