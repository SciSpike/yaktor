DOCKER_HOST=$(docker network inspect --format '{{ index .Options "com.docker.network.bridge.host_binding_ipv4" }}' bridge)
sudo route -n add $(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' bridge) $DOCKER_HOST
sudo route -n add $(docker network inspect --format '{{ range .IPAM.Config }}{{ .Subnet}}{{end}}' yaktor_default) $DOCKER_HOST
INTERFACE=$(route get $DOCKER_HOST | grep interface: | cut -f 2 -d:); sudo ifconfig ${INTERFACE} -hostfilter $(ifconfig ${INTERFACE} | grep member: | cut -f 2 -d: | cut -f 2 -d\ )
