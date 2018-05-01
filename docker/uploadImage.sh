#!/bin/sh

eval `docker-machine env managerA1`
docker rmi -f paulaguijarro/proyecto-asix

./docker/createImage.sh
IMAGEID=$(docker images -q proyecto-asix)
docker tag $IMAGEID paulaguijarro/proyecto-asix:latest
docker push paulaguijarro/proyecto-asix
docker rmi proyecto-asix

eval `docker-machine env managerB1`
docker rmi -f paulaguijarro/proyecto-asix

./docker/createImage.sh
IMAGEID=$(docker images -q proyecto-asix)
docker tag $IMAGEID paulaguijarro/proyecto-asix:latest
docker push paulaguijarro/proyecto-asix
docker rmi proyecto-asix
