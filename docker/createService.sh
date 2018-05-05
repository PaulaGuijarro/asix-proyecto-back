#!/bin/sh

# situamos el entorno del managerA1, que es el lider del swarm A
# https://docs.docker.com/machine/reference/env/
eval `docker-machine env managerA1`
# creamos 4 servicios dentro del swarm seleccionado en el entorno, llamados "service-proyecto-asix"
# le pasamos por parámetros 3 hosts de red para el replica set de mongoDB
# le pasamos el puerto de escucha y el mapeo al contenedor docker del servicio
# le indicamos la imagen a partir de la cual creará el servicio
# https://docs.docker.com/engine/reference/commandline/service_create/
docker service create --replicas 4 --name service-proyecto-asix --host mongo-repl-1:192.168.99.80 --host mongo-repl-2:192.168.99.81 --host mongo-repl-3:192.168.99.82 -p 3000:3000 paulaguijarro/proyecto-asix:latest

# situamos el entorno del managerB1, que es el lider del swarm B
# https://docs.docker.com/machine/reference/env/
eval `docker-machine env managerB1`
# creamos 4 servicios dentro del swarm seleccionado en el entorno, llamados "service-proyecto-asix"
# le pasamos por parámetros 3 hosts de red para el replica set de mongoDB
# le pasamos el puerto de escucha y el mapeo al contenedor docker del servicio
# le indicamos la imagen a partir de la cual creará el servicio
# https://docs.docker.com/engine/reference/commandline/service_create/
docker service create --replicas 4 --name service-proyecto-asix --host mongo-repl-1:192.168.99.80 --host mongo-repl-2:192.168.99.81 --host mongo-repl-3:192.168.99.82 -p 3000:3000 paulaguijarro/proyecto-asix:latest