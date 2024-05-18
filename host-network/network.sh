#!/bin/bash

OPTION=$1

if [ "$OPTION" == "up" ]
then
    # up
    ./fabric-ca.sh launch
    sleep 5
    ./crypto.sh create
    ./ccp.sh create
    ./containers.sh launch
    sleep 10
    ./channel.sh up
    ./chaincode.sh
elif [ "$OPTION" == "down" ]
then
    # down
    ./channel.sh down
    ./containers.sh kill
    ./ccp.sh delete
    ./crypto.sh delete
    ./fabric-ca.sh kill
    rm -rf ../database/wallets/*
    rm -rf ../database/org*/tmp/*
    rm -rf ../database/org*/ipfs/*
    rm -rf ../database/node/*
    fuser -k 7054/tcp 7154/tcp 7254/tcp 7354/tcp 7454/tcp || true
    fuser -k 17054/tcp 17154/tcp 17254/tcp 17354/tcp 17454/tcp || true
    fuser -k 7050/tcp 7150/tcp 7250/tcp 7350/tcp 7450/tcp || true
    fuser -k 7051/tcp 7151/tcp 7251/tcp 7351/tcp 7451/tcp || true
    fuser -k 9443/tcp 9543/tcp 9643/tcp 9743/tcp 9843/tcp || true
fi
