#!/bin/sh

# parámetros por defecto

# versión de boot2docker elegida para instalar en las docker-machines. Última verisón estable en el momento que se hace el proyecto
DOCKER_VERSION="https://github.com/boot2docker/boot2docker/releases/download/v18.03.0-ce/boot2docker.iso"
# parámetros adiccionales aplicados a todas las docker-machines
# disco duro de 3000 MB
# memoria ram de 1024 MB
# url de descarga de versión de boot2docker, la que indique el parámetro DOCKER_VERSION
ADDITIONAL_PARAMS="--virtualbox-disk-size 3000 --virtualbox-memory 1024 --virtualbox-boot2docker-url=${DOCKER_VERSION}"

echo "-> Creando Swarm B con 2 managers y 2 workers con driver de virtualbox"

# función que dado un nombre de docker-machine, obtiene la IP de esa docker-machine
function getIP {
  # Obetenemos la IP de una docker-machine y la mostramos
  # https://docs.docker.com/machine/reference/ip/
  echo $(docker-machine ip $1)
}

# función que recibe 2 parámetros para asignar una IP a una docker-machine
function changeIp {
  echo "-------------------------------------------------"
  echo "Reasignando IP $2 a docker-machine $1"
  # nos conectamos a una docker machine por ssh y ejecutamos un comando que escribirá en el archivo bootsync.sh otro comando que permitirá
  # capturar el PID del proceso de DHCP de la docker-machine y terminará este proceso
  # el archivo /var/lib/boot2docker/bootsync.sh es un archivo de boot2docker predeterminado que será ejecutado una vez la docker-machine se haya
  # iniciado. Esto incluye el arranque del proceso dhcp para todas las interfaces de red.
  # para eliminar el proceso de dhcp de la interfaz eth1 es necesario ver el contenido del archivo /var/run/udhcpc.eth1.pid que almacena el pid de dicho proceso, y que es necesario terminar
  # porque de lo contrario, cuando asignemos una ip fija a esta docker-machine el proceso podría volver a cambiar la IP, causando problemas de funcionamiento.
  # Para insertar el comando una vez escapados los caracteres necesarios debidamente, usamos la función de unix tee.
  docker-machine ssh $1 "echo \"kill \\\`cat /var/run/udhcpc.eth1.pid\\\`\" | sudo tee /var/lib/boot2docker/bootsync.sh > /dev/null"
  # añadimos ahora un segundo comando al archivo bootsync.sh, utilizando el flag -a de tee, que cambiará la IP de la interfaz eth1, la cual hemos eliminado su proceso dhcp
  docker-machine ssh $1 "echo \"ifconfig eth1 $2 netmask 255.255.255.0 broadcast 192.168.99.255 up\" | sudo tee -a /var/lib/boot2docker/bootsync.sh > /dev/null"
  
  # ahora reiniciamos la docker-machine, para que se inicie con su nueva IP
  docker-machine restart $1
  # como la IP ha cambiado, los certificados generados en el momento de la creación no coinciden con la nueva IP, por lo que hay que regenerarlos
  docker-machine regenerate-certs $1 -f

  # https://github.com/boot2docker/boot2docker/blob/master/doc/FAQ.md#local-customisation-with-persistent-partition
  # https://es.wikipedia.org/wiki/Tee_(Unix)
  # https://docs.docker.com/machine/reference/ssh/
  # https://docs.docker.com/machine/reference/restart/
  # https://docs.docker.com/machine/reference/regenerate-certs/
}

# función que obtiene el token de un swarm para permitir que un nodo se una como manager
function getManagerToken {
  # obtiene el token del manager de swarm para dárselo a un manager. Para ello nos conectamos a la docker-machine que es el lider del swarm por ssh
  # y ejecutamos la orden docker swarm con la opción join-token worker, para obtener el token de ese swarm que permite unir un nodo manager
  echo $(docker-machine ssh managerB1 docker swarm join-token manager -q)

  # https://docs.docker.com/machine/reference/ssh/  
  # https://docs.docker.com/engine/reference/commandline/swarm_join-token/
}

# función que obtiene el token de un swarm para permitir que un nodo se una como worker
function getWorkerToken {
  # obtiene el token del manager de swarm para dárselo a un worker. Para ello nos conectamos a la docker-machine que es el lider del swarm por ssh
  # y ejecutamos la orden docker swarm con la opción join-token worker, para obtener el token de ese swarm que permite unir un nodo worker
  echo $(docker-machine ssh managerB1 docker swarm join-token worker -q)
  
  # https://docs.docker.com/machine/reference/ssh/  
  # https://docs.docker.com/engine/reference/commandline/swarm_join-token/
}

# función que crea los nodos manager
function createManagerNode {
  echo "== Creando manager B1 ...";
  # Creamos el primer manager del swarm B, con driver virtualbox y con los parámetros por defecto
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS managerB1
  # utilizamos la función changeIp para cambiar la IP del managerB1  
  changeIp "managerB1" "192.168.99.131"
  
  echo "== Creando manager B2 ...";
  # Creamos el segundo manager del swarm B, con driver virtualbox y con los parámetros por defecto
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS managerB2
  # utilizamos la función changeIp para cambiar la IP del managerB2
  changeIp "managerB2" "192.168.99.132"

  # https://docs.docker.com/machine/reference/create/  
}

# función que crea los nodos worker
function createWorkerNode {
  echo "== Creando worker B1 ...";
  # Creamos el primer worker del swarm B, con driver virtualbox y con los parámetros por defecto
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS workerB1
  # utilizamos la función changeIp para cambiar la IP del workerB1  
  changeIp "workerB1" "192.168.99.133"    
  
  echo "== Creando worker B2 ...";
  # Creamos el segundo worker del swarm B, con driver virtualbox y con los parámetros por defecto
  docker-machine create -d virtualbox $ADDITIONAL_PARAMS workerB2
  # utilizamos la función changeIp para cambiar la IP del workerB2
  changeIp "workerB2" "192.168.99.134"

  # https://docs.docker.com/machine/reference/create/  
}

# función que inicializa el swarm
function initSwarmManager {
  echo '============================================'
  echo "======> Inicializando el primer manager del swarm..."
  # Tras conectarnos por ssh al manager que queremos que sea lider del swarm inicialmente,
  # ejecutamos la orden de docker que permite inicializar un swarm, dando como parámetros las urls de escucha para la comunicación entre los distintos nodos que formarán el swarm
  docker-machine ssh managerB1 docker swarm init --listen-addr $(getIP managerB1):2377 --advertise-addr $(getIP managerB1):2377
  
  # https://docs.docker.com/machine/reference/ssh/
  # https://docs.docker.com/engine/reference/commandline/swarm_init/
}

# función que une un manager al swarm
function joinManagerSwarm {
  echo "======> manager B2 uniéndose al swarm..."
  # tras conectarnos al manager que queremos que se una al swarm, ejecutamos la orden docker swarm join que permite unirse a dicho swarm
  # a partir del token generado por la función getManagerToken. Además configuramos los parámetros necesarios para que la comunicación entre nodos funcione, prestando atención al puerto de escucha
  docker-machine ssh managerB2 docker swarm join --token $(getManagerToken) --listen-addr $(getIP managerB2):2377 --advertise-addr $(getIP managerB2):2377 $(getIP managerB1):2377
  
  # https://docs.docker.com/machine/reference/ssh/
  # https://docs.docker.com/engine/reference/commandline/swarm_join/
}

# función que une dos workers al swarm
function joinWorkerSwarm {
  echo "======> worker B1 uniéndose al swarm..."
  # tras conectarnos al worker que queremos que se una al swarm, ejecutamos la orden docker swarm join que permite unirse a dicho swarm
  # a partir del token generado por la función getWorkerToken. Además configuramos los parámetros necesarios para que la comunicación entre nodos funcione, prestando atención al puerto de escucha
  docker-machine ssh workerB1 docker swarm join --token $(getWorkerToken) --listen-addr $(getIP workerB1):2377 --advertise-addr $(getIP workerB1):2377 $(getIP managerB1):2377
  
  echo "======> worker B2 uniéndose al swarm..."
  # tras conectarnos al worker que queremos que se una al swarm, ejecutamos la orden docker swarm join que permite unirse a dicho swarm
  # a partir del token generado por la función getWorkerToken. Además configuramos los parámetros necesarios para que la comunicación entre nodos funcione, prestando atención al puerto de escucha
  docker-machine ssh workerB2 docker swarm join --token $(getWorkerToken) --listen-addr $(getIP workerB2):2377 --advertise-addr $(getIP workerB2):2377 $(getIP managerB1):2377
  
  # https://docs.docker.com/machine/reference/ssh/
  # https://docs.docker.com/engine/reference/commandline/swarm_join/
}

# función que muestra el estado de las docker-machines y de los swarms
function status {
  echo "-> listando nodos del swarm B"
  # tras conectarnos al manager lider del swarm, mostramos el estado del swarm
  docker-machine ssh managerB1 docker node ls
  
  echo "-> listando docker-machines"
  # mostramos las docker-machines creadas
  docker-machine ls

  # https://docs.docker.com/engine/reference/commandline/node_ls/
  # https://docs.docker.com/machine/reference/ls/
}

# función principal. Ejecuta todas las funciones en el orden necesario para crear un swarm
function main () {
  createManagerNode
  createWorkerNode
  initSwarmManager
  joinManagerSwarm
  joinWorkerSwarm
  status
}

# llamada a la función principal
main