#!/bin/sh

# situamos el entorno del managerA1, que es el lider del swarm A
# https://docs.docker.com/machine/reference/env/
eval `docker-machine env managerA1`
# paramos las docker-machines del entorno del lider del swarm A
# https://docs.docker.com/machine/reference/stop/
docker-machine stop managerA1 managerA2 workerA1 workerA2

# situamos el entorno del managerB1, que es el lider del swarm B
# https://docs.docker.com/machine/reference/env/
eval `docker-machine env managerB1`
# paramos las docker-machines del entorno del lider del swarm B
# https://docs.docker.com/machine/reference/stop/
docker-machine stop managerB1 managerB2 workerB1 workerB2