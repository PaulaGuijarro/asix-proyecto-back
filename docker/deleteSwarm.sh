#!/bin/sh

# array de nombres de docker-machines
machines=( "managerA1" "managerA2" "workerA1" "workerA2" "managerB1" "managerB2" "workerB1" "workerB2" )

# salimos de cualquier entorno de docker-machine
# https://docs.docker.com/machine/reference/env/
docker-machine env -u

# para cada docker-machine
for machine in "${machines[@]}"
do
  # eliminamos esa docker machine
  # https://docs.docker.com/machine/reference/rm/
  docker-machine rm $machine -f 
done

