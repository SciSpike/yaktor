sudo sysctl -w net.inet.ip.forwarding=1
STACK=${PWD##*/}
STACK=${STACK//-}
NETWORK=${STACK}_default
YAKTOR_DOCKER_MACHINE=${YAKTOR_DOCKER_MACHINE-default}
SUBNET=$(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' ${NETWORK} | sed 's,/16,,')
SUBSUBNET=$(echo $SUBNET | sed 's/\.0\.0//')
docker-compose exec app route delete default
docker-compose exec app route add default gw vpn
docker-compose exec dns route delete default
docker-compose exec dns route add default gw vpn
docker-compose exec vpn route delete default
docker-compose exec vpn route add default gw ${SUBSUBNET}.1.1