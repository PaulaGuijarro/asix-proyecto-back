#!/bin/sh

docker rmi -f proyecto-asix
docker image prune -f
docker volume prune -f

docker build -t proyecto-asix ./asix-usuarios/


