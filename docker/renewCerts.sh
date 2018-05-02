#!/bin/sh

docker-machine regenerate-certs managerA1 -f
docker-machine regenerate-certs managerA2 -f
docker-machine regenerate-certs workerA1 -f
docker-machine regenerate-certs workerA2 -f

docker-machine regenerate-certs managerB1 -f
docker-machine regenerate-certs managerB2 -f
docker-machine regenerate-certs workerB1 -f
docker-machine regenerate-certs workerB2 -f