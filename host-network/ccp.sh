#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

export PEER_PORTS=(0 7051 7151 7251 7351 7451)
export ORDERER_PORTS=(0 7050 7150 7250 7350 7450)
export CA_PORTS=(0 7054 7154 7254 7354 7454)
export PEER_PEMS=(0 , 0 , 0 , 0 , 0 , 0)
export ORDERER_PEMS=(0 , 0 , 0 , 0 , 0 , 0)
export CA_PEMS=(0 , 0 , 0 , 0 , 0 , 0)

function json_ccp {
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${PEERPORT_1}/${PEER_PORTS[1]}/" \
        -e "s/\${ORDERERPORT_1}/${ORDERER_PORTS[1]}/" \
        -e "s/\${CAPORT_1}/${CA_PORTS[1]}/" \
        -e "s#\${PEERPEM_1}#${PEER_PEMS[1]}#"\
        -e "s#\${ORDERERPEM_1}#${ORDERER_PEMS[1]}#"\
        -e "s#\${CAPEM_1}#${CA_PEMS[1]}#"\
        -e "s/\${PEERPORT_2}/${PEER_PORTS[2]}/" \
        -e "s/\${ORDERERPORT_2}/${ORDERER_PORTS[2]}/" \
        -e "s/\${CAPORT_2}/${CA_PORTS[2]}/" \
        -e "s#\${PEERPEM_2}#${PEER_PEMS[2]}#"\
        -e "s#\${ORDERERPEM_2}#${ORDERER_PEMS[2]}#"\
        -e "s#\${CAPEM_2}#${CA_PEMS[2]}#"\
        -e "s/\${PEERPORT_3}/${PEER_PORTS[3]}/" \
        -e "s/\${ORDERERPORT_3}/${ORDERER_PORTS[3]}/" \
        -e "s/\${CAPORT_3}/${CA_PORTS[3]}/" \
        -e "s#\${PEERPEM_3}#${PEER_PEMS[3]}#"\
        -e "s#\${ORDERERPEM_3}#${ORDERER_PEMS[3]}#"\
        -e "s#\${CAPEM_3}#${CA_PEMS[3]}#"\
        -e "s/\${PEERPORT_4}/${PEER_PORTS[4]}/" \
        -e "s/\${ORDERERPORT_4}/${ORDERER_PORTS[4]}/" \
        -e "s/\${CAPORT_4}/${CA_PORTS[4]}/" \
        -e "s#\${PEERPEM_4}#${PEER_PEMS[4]}#"\
        -e "s#\${ORDERERPEM_4}#${ORDERER_PEMS[4]}#"\
        -e "s#\${CAPEM_4}#${CA_PEMS[4]}#"\
        -e "s/\${PEERPORT_5}/${PEER_PORTS[5]}/" \
        -e "s/\${ORDERERPORT_5}/${ORDERER_PORTS[5]}/" \
        -e "s/\${CAPORT_5}/${CA_PORTS[5]}/" \
        -e "s#\${PEERPEM_5}#${PEER_PEMS[5]}#"\
        -e "s#\${ORDERERPEM_5}#${ORDERER_PEMS[5]}#"\
        -e "s#\${CAPEM_5}#${CA_PEMS[5]}#"\
        ./organizations/ccp-template.json
}

OPTION=$1

if [ "$OPTION" == "create" ]
then
    for i in {1..5}
    do
        PEER_PEMS[$i]=./organizations/peerOrganizations/org$i.example.com/tlsca/tlsca.org$i.example.com-cert.pem
        ORDERER_PEMS[$i]=./organizations/peerOrganizations/org$i.example.com/tlsca/tlsca.org$i.example.com-cert.pem
        CA_PEMS[$i]=./organizations/peerOrganizations/org$i.example.com/ca/ca.org$i.example.com-cert.pem
        PEER_PEMS[$i]=$(one_line_pem ${PEER_PEMS[$i]})
        ORDERER_PEMS[$i]=$(one_line_pem ${ORDERER_PEMS[$i]})
        CA_PEMS[$i]=$(one_line_pem ${CA_PEMS[$i]})
    done
    for i in {1..5}
    do
        echo "$(json_ccp $i)" > ./organizations/connections/connection-org$i.json
    done
elif [ "$OPTION" == "delete" ]
then
    rm ./organizations/connections/*
fi
