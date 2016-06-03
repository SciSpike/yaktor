#!/usr/bin/env bash

eval $(docker-machine env default)
DOCKER_IP=$(docker-machine ip default)

sudo route -n add $(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' bridge) $DOCKER_IP
sudo route -n add $(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${PWD##*/}_default) $DOCKER_IP

#INTERFACE=$(route get $DOCKER_IP | grep interface: | cut -f 2 -d: | xargs); echo sudo ifconfig ${INTERFACE} -hostfilter $(ifconfig ${INTERFACE} | grep member: | cut -f 2 -d: | cut -f 2 -d\ )
