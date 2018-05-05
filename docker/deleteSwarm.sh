#!/bin/sh

docker-machine env -u

machines=( "managerA1" "managerA2" "workerA1" "workerA2" "managerB1" "managerB2" "workerB1" "workerB2" )

for machine in "${machines[@]}"
do
  docker-machine rm $machine -f 
done

