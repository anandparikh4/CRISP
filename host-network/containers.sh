#!/bin/bash

OPTION=$1
DIR="./docker"

if [ "$OPTION" == "launch" ]
then
    docker-compose -f "${DIR}/docker-compose-org1.yaml" up -d
    docker-compose -f "${DIR}/docker-compose-org2.yaml" up -d
    docker-compose -f "${DIR}/docker-compose-org3.yaml" up -d
    docker-compose -f "${DIR}/docker-compose-org4.yaml" up -d
    docker-compose -f "${DIR}/docker-compose-org5.yaml" up -d
    # docker-compose -f "${DIR}/docker-compose-cli.yaml" up -d
elif [ "$OPTION" == "kill" ]
then
    docker-compose -f "${DIR}/docker-compose-org1.yaml" down
    docker-compose -f "${DIR}/docker-compose-org2.yaml" down
    docker-compose -f "${DIR}/docker-compose-org3.yaml" down
    docker-compose -f "${DIR}/docker-compose-org4.yaml" down
    docker-compose -f "${DIR}/docker-compose-org5.yaml" down
    # docker-compose -f "${DIR}/docker-compose-cli.yaml" down
fi
