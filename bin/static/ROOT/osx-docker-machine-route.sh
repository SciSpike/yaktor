#!/usr/bin/env bash

YAKTOR_DOCKER_MACHINE=${YAKTOR_DOCKER_MACHINE-default}
eval $(docker-machine env $YAKTOR_DOCKER_MACHINE)
DOCKER_IP=$(docker-machine ip $YAKTOR_DOCKER_MACHINE)
SUBNET=$(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${PWD##*/}_default)
if [ -n "$(route get $SUBNET | grep 'destination: default')" ]; then
  sudo route -n add $SUBNET $DOCKER_IP
fi