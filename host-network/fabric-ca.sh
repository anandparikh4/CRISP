#!/bin/bash
# launch and kill the fabric-ca containers

OPTION=$1
DIR="./organizations/fabric-ca"
COMPOSE="./docker/docker-compose-ca.yaml"

if [ "$OPTION" == "launch" ]
then
    docker-compose -f "$COMPOSE" up -d
elif [ "$OPTION" == "kill" ]
then
    docker-compose -f "$COMPOSE" down --remove-orphans
    for i in {1..5}
    do
        mv "${DIR}/org${i}/fabric-ca-server-config.yaml" "${DIR}/"
        sudo rm -rf "${DIR}/org${i}"
        mkdir -p "${DIR}/org${i}"
        mv "${DIR}/fabric-ca-server-config.yaml" "${DIR}/org${i}"
    done
fi
