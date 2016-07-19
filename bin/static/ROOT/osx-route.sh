#!/usr/bin/env bash -ex

STACK=${PWD##*/}
STACK=${STACK//-}
NETWORK=${STACK}_default

SUBNET=$(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${NETWORK} | sed 's,/16,,')
SUBSUBNET=$(echo $SUBNET | sed 's/\.0\.0//')
NET=$(echo $SUBSUBNET | sed 's/\.//')
if [ -n "$(route get $SUBNET | grep 'destination: default')" ]; then
  echo "creating vpn connection to ${STACK}"
  sudo -v
  if [ ! -f bin/soctun ]; then
    VERSION="0.0.0"
    LWD=$PWD
    if [ ! -f /tmp/soctun-${VERSION}.tar.gz ]; then
      curl -L https://github.com/jkamke/soctun/releases/download/${VERSION}/soctun.tar.gz > /tmp/soctun-${VERSION}.tar.gz
    fi
    mkdir -p bin
    echo 'soctun' >> bin/.gitignore 
    cd /tmp
    tar xf /tmp/soctun-${VERSION}.tar.gz
    mv /tmp/soctun/soctun $LWD/bin
    rm -rf /tmp/soctun/
    cd $LWD
  fi
  if [ -n "$(which docker-machine)" ] && docker-machine ip $YAKTOR_DOCKER_MACHINE &> /dev/null; then
    VPN_HOST_IP=$(docker-machine ip $YAKTOR_DOCKER_MACHINE)
  elif [ -n "$(which dlite)" ] && [ -n "$(dlite ip 2> /dev/null)" ]; then
    VPN_HOST_IP=$(dlite ip)
  elif [ -n "$(docker info 2> /dev/null)" ]; then
    VPN_HOST_IP=$(docker inspect --format '{{ range index .NetworkSettings.Ports "4444/tcp" }}{{ .HostIp}}{{end}}' ${STACK}_vpn_1)
  else
    (>&2 echo Error: cannot determine how you expect this to work without docker setup -- exiting)
    exit 1
  fi
  SSH_CONTAINER_IP=$(docker inspect --format "{{ .NetworkSettings.Networks.${NETWORK}.IPAddress }}" ${STACK}_vpn_1)
  SOCTUN_PORT=$(docker inspect --format '{{ range index .NetworkSettings.Ports "4444/tcp" }}{{ .HostPort}}{{end}}' ${STACK}_vpn_1)
  sudo bin/soctun -t $NET -h $VPN_HOST_IP -p $SOCTUN_PORT -m 1504 -n & sleep 1
  sudo ifconfig utun$NET inet ${SUBSUBNET}.1.1 $SSH_CONTAINER_IP mtu 1500 up
  docker exec -i ${STACK}_vpn_1 sh -c "ip link set tun0 up && ip link set mtu 1500 tun0 && ip addr add $SSH_CONTAINER_IP/16 peer ${SUBSUBNET}.1.1 dev tun0 && arp -sD  ${SUBSUBNET}.1.1 eth0 pub"
  sudo route -n add $SUBNET -interface utun$NET #$SSH_CONTAINER_IP
fi