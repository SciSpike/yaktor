#!/usr/bin/env bash

eval $(docker-machine env default)
DOCKER_IP=$(docker-machine ip default)

sudo route -n add $(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${PWD##*/}_default) $DOCKER_IP
