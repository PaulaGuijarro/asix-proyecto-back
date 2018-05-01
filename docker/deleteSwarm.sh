#!/bin/sh

docker-machine env -u
docker-machine rm managerA1 -f
docker-machine rm managerA2 -f
docker-machine rm workerA1 -f
docker-machine rm workerA2 -f

docker-machine rm managerB1 -f
docker-machine rm managerB2 -f
docker-machine rm workerB1 -f
docker-machine rm workerB2 -f
