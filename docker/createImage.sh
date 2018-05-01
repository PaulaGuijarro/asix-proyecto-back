#!/bin/sh

docker rmi -f proyecto-asix
docker image prune
docker volume prune

docker build -t proyecto-asix ./asix-usuarios/


