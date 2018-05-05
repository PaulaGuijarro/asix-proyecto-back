#!/bin/sh

# array de nombres de docker-machines
machines=( "managerA1" "managerA2" "workerA1" "workerA2" "managerB1" "managerB2" "workerB1" "workerB2" )

# para cada docker-machine
for machine in "${machines[@]}"
do
  # arrancamos esa docker-machine
  # https://docs.docker.com/machine/reference/start/
  docker-machine start $machine 
done