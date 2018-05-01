#!/bin/sh

eval `docker-machine env managerA1`
docker service create --replicas 4 --name service-proyecto-asix --host mongo-repl-1:192.168.1.90 --host mongo-repl-2:192.168.1.46 --host mongo-repl-3:192.168.1.39 -p 3000:3000 paulaguijarro/proyecto-asix:latest

eval `docker-machine env managerB1`
docker service create --replicas 4 --name service-proyecto-asix --host mongo-repl-1:192.168.1.90 --host mongo-repl-2:192.168.1.46 --host mongo-repl-3:192.168.1.39 -p 3000:3000 paulaguijarro/proyecto-asix:latest