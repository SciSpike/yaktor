#!/usr/bin/env bash -ex

SUBNET=$(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${PWD##*/}_default | sed 's,/16,,')
SUBSUBNET=$(echo $SUBNET | sed 's/\.0\.0//')
if [ -n "$(route get $SUBNET | grep 'destination: default')" ]; then
  echo "creating vpn connection to ${PWD##*/}"
  sudo -v
  if [ ! -d  /Library/Extensions/tap.kext ]; then
    LWD=$PWD
    curl -L http://downloads.sourceforge.net/project/tuntaposx/tuntap/20150118/tuntap_20150118.tar.gz > /tmp/tuntap_20150118.tar.gz
    cd /tmp
    tar xf /tmp/tuntap_20150118.tar.gz
    sudo installer -pkg /tmp/tuntap_20150118.pkg -target /
    cd $LWD
  fi
  if [ ! -f ~/.ssh/id_rsa_${PWD##*/}.pub ]; then
    ssh-keygen -t rsa -N '' -f ~/.ssh/id_rsa_${PWD##*/}
  fi
  cat ~/.ssh/id_rsa_${PWD##*/}.pub | docker exec -i ${PWD##*/}_vpn_1 sh -c 'cat >> /root/.ssh/authorized_keys'
  if [ -n "$(which docker-machine)" ] && docker-machine ip $YAKTOR_DOCKER_MACHINE &> /dev/null; then
    SSH_HOST_IP=$(docker-machine ip $YAKTOR_DOCKER_MACHINE)
  elif [ -n "$(which dlite)" ] && [ -n "$(dlite ip 2> /dev/null)" ]; then
    SSH_HOST_IP=$(dlite ip)
  elif [ -n "$(docker info 2> /dev/null)" ]; then
    SSH_HOST_IP=$(docker inspect --format '{{ range index .NetworkSettings.Ports "22/tcp" }}{{ .HostIp}}{{end}}' ${PWD##*/}_vpn_1)
  else
    echo Error: cannot determine how you expect this to work without docker setup -- exiting
    exit 1
  fi
  SSH_HOST_PORT=$(docker inspect --format '{{ range index .NetworkSettings.Ports "22/tcp" }}{{ .HostPort}}{{end}}' ${PWD##*/}_vpn_1)
  SSH_CONTAINER_IP=$(docker inspect --format "{{ .NetworkSettings.Networks.${PWD##*/}_default.IPAddress }}" ${PWD##*/}_vpn_1)
  NEXT_TUN=$(comm -23 <(ls /dev/tun* | sed 's,/dev/,,') <(ifconfig | grep tun | sed 's/\(tun[0-9]*\).*/\1/') | head -1)
  NET=${NEXT_TUN##tun}
  sudo ssh root@${SSH_HOST_IP} \
    -i ~/.ssh/id_rsa_${PWD##*/} \
    -Tf \
    -w $NET:$NET \
    -p $SSH_HOST_PORT \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "ip link set $NEXT_TUN up && ip addr add ${SSH_CONTAINER_IP}/16 peer ${SUBSUBNET}.1.1 dev $NEXT_TUN && arp -sD  ${SUBSUBNET}.1.1 eth0 pub"
  sudo ipconfig set $NEXT_TUN manual ${SUBSUBNET}.1.1 255.255.0.0
  #sudo route -n add $SUBNET -interface $NEXT_TUN
fi