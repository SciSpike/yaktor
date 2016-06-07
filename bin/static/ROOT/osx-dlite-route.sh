#!/usr/bin/env bash

DOCKER_IP=$(docker network inspect --format '{{ index .Options "com.docker.network.bridge.host_binding_ipv4" }}' bridge)
sudo route -n add $(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${PWD##*/}_default) $DOCKER_IP
INTERFACE=$(route get $DOCKER_IP | grep interface: | cut -f 2 -d:); sudo ifconfig ${INTERFACE} -hostfilter $(ifconfig ${INTERFACE} | grep member: | cut -f 2 -d: | cut -f 2 -d\ )
