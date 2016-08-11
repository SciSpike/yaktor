#!/usr/bin/env bash -ex

STACK=${PWD##*/}
STACK=${STACK//-}
NETWORK=${STACK}_default
YAKTOR_DOCKER_MACHINE=${YAKTOR_DOCKER_MACHINE-default}
SUBNET=$(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${NETWORK} | sed 's,/16,,')
SUBSUBNET=$(echo $SUBNET | sed 's/\.0\.0//')
NET=$(echo $SUBSUBNET | sed 's/\.//')
VPN_SERVICE=${STACK}_vpn_1
DNS_SERVICE=${STACK}_dns_1
SUB_DOMAIN=${STACK}.yaktor
set +e
ROUTE=$(route get $SUBNET 2> /dev/null | grep 'destination:')
set -e
if [ -z "$ROUTE" ] || [ -n "$(echo "$ROUTE" | grep 'destination: default')" ]; then
  DNS_CONTAINER_IP=$(docker inspect --format "{{ .NetworkSettings.Networks.${NETWORK}.IPAddress }}" $DNS_SERVICE)
  sudo -v
  sudo mkdir -p /etc/resolver && sudo rm -f /etc/resolver/$SUB_DOMAIN && sudo sh -c "echo 'nameserver ${DNS_CONTAINER_IP}' >/etc/resolver/$SUB_DOMAIN"
  echo "creating vpn connection to ${STACK}"
  SOCTUN_VERSION="1.0.0"
  if [ ! -f bin/soctun-$SOCTUN_VERSION ]; then
    LWD=$PWD
    if [ ! -f /tmp/soctun-${SOCTUN_VERSION}.tar.gz ]; then
      curl -L https://github.com/SciSpike/soctun/releases/download/${SOCTUN_VERSION}/soctun.tar.gz > /tmp/soctun-${SOCTUN_VERSION}.tar.gz
    fi
    mkdir -p bin
    echo 'soctun' >> bin/.gitignore 
    cd /tmp
    tar xf /tmp/soctun-${SOCTUN_VERSION}.tar.gz
    mv /tmp/soctun/soctun $LWD/bin/soctun-$SOCTUN_VERSION
    test -e $LWD/bin/soctun &&  rm $LWD/bin/soctun
    ln -s $LWD/bin/soctun-$SOCTUN_VERSION $LWD/bin/soctun
    rm -rf /tmp/soctun/
    cd $LWD
  fi
  DOCKER_MACHINE=$(docker info 2> /dev/null | grep Name: | awk '{print $2}') 
  if [ -n "$(which docker-machine)" ] && [ "$YAKTOR_DOCKER_MACHINE" = "$DOCKER_MACHINE" ]; then
    VPN_HOST_IP=$(docker-machine ip $YAKTOR_DOCKER_MACHINE)
  elif [ -n "$(which dlite)" ] && [ -n "$(dlite ip 2> /dev/null)" ]; then
    VPN_HOST_IP=$(dlite ip)
  elif [ -n "$(docker info 2> /dev/null)" ]; then
    VPN_HOST_IP=$(docker inspect --format '{{ range index .NetworkSettings.Ports "4444/tcp" }}{{ .HostIp}}{{end}}' $VPN_SERVICE)
  else
    (>&2 echo Error: cannot determine how you expect this to work without docker setup -- exiting)
    exit 1
  fi
  SSH_CONTAINER_IP=$(docker inspect --format "{{ .NetworkSettings.Networks.${NETWORK}.IPAddress }}" $VPN_SERVICE)
  SOCTUN_PORT=$(docker inspect --format '{{ range index .NetworkSettings.Ports "4444/tcp" }}{{ .HostPort}}{{end}}' $VPN_SERVICE)
  MTU=1500
  sudo bin/soctun -t $NET -h localhost -p $SOCTUN_PORT -m $MTU & sleep 1
  sudo ifconfig utun$NET inet ${SUBSUBNET}.1.1 $SSH_CONTAINER_IP mtu $MTU up
  docker exec -i $VPN_SERVICE sh -c "ip link set tun0 up && ip link set mtu $MTU tun0 && ip addr add $SSH_CONTAINER_IP/16 peer ${SUBSUBNET}.1.1 dev tun0 && arp -sD  ${SUBSUBNET}.1.1 eth0 pub"
  sudo route -n add $SUBNET -interface utun$NET #$SSH_CONTAINER_IP
else
 echo route exists
fi