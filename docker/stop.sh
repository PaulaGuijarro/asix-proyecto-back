#!/bin/sh

eval `docker-machine env managerA1`
docker-machine stop managerA1 managerA2 workerA1 workerA2

eval `docker-machine env managerB1`
docker-machine stop managerB1 managerB2 workerB1 workerB2