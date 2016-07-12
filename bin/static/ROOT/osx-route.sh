#!/usr/bin/env bash -ex

SUBNET=$(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${PWD##*/}_default | sed 's,/16,,')
SUBSUBNET=$(echo $SUBNET | sed 's/\.0\.0//')
NET=$(( $(echo $SUBSUBNET | sed 's/[^.]*\.//') % 16 ))
if [ -n "$(route get $SUBNET | grep 'destination: default')" ]; then
  echo "creating vpn connetion to ${PWD##*/}"
  sudo -v
  if [ ! -d  /Library/Extensions/tap.kext ]; then
    LWD=$PWD
    curl http://downloads.sourceforge.net/tuntaposx/tuntap_20150118.tar.gz > /tmp/tuntap_20150118.tar.gz
    cd /tmp
    tar xf /tmp/tuntap_20150118.tar.gz
    sudo installer -pkg /tmp/tuntap_20150118.pkg -target /
    cd $LWD
  fi
  if [ ! -f ~/.ssh/id_rsa_${PWD##*/}.pub ]; then
    ssh-keygen -t rsa -N '' -f ~/.ssh/id_rsa_${PWD##*/}
  fi
  cat ~/.ssh/id_rsa_${PWD##*/}.pub | docker exec -i test_ppp_1 sh -c 'cat >> /root/.ssh/authorized_keys'
  SSH_HOST_IP=$(docker inspect --format '{{ range index .NetworkSettings.Ports "22/tcp" }}{{ .HostIp}}{{end}}' ${PWD##*/}_ppp_1)
  SSH_HOST_PORT=$(docker inspect --format '{{ range index .NetworkSettings.Ports "22/tcp" }}{{ .HostPort}}{{end}}' ${PWD##*/}_ppp_1)
  sudo ssh root@${SSH_HOST_IP} -i ~/.ssh/id_rsa_${PWD##*/} -NTf -w $NET:$NET -p $SSH_HOST_PORT -o StrictHostKeyChecking=no
  sudo ipconfig set tun$NET manual ${SUBSUBNET}.1.1 255.255.0.0
  sudo route -n add $SUBNET ${SUBSUBNET}.1.1
  SSH_CONTAINER_IP=$(docker inspect --format "{{ .NetworkSettings.Networks.${PWD##*/}_default.IPAddress }}" ${PWD##*/}_ppp_1)
  docker exec -it ${PWD##*/}_ppp_1 ip link set tun$NET up
  docker exec -it ${PWD##*/}_ppp_1 ip addr add ${SSH_CONTAINER_IP}/16 peer ${SUBSUBNET}.1.1 dev tun$NET
  docker exec -it ${PWD##*/}_ppp_1 arp -sD  ${SUBSUBNET}.1.1 eth0 pub
fi