#!/bin/bash
# create and delete crypto material for all orgs and enroll required entities

function create_crypto(){
    ORG=$1
    PORT=$2
    PASS=$3

    # infoln "Enrolling the CA admin"
    mkdir -p "organizations/peerOrganizations/${ORG}.example.com/"

    export FABRIC_CA_CLIENT_HOME="${PWD}/organizations/peerOrganizations/${ORG}.example.com/"

    set -x
    fabric-ca-client enroll -u "https://admin:${PASS}@localhost:${PORT}" --caname "ca-${ORG}" --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    echo "NodeOUs:
    Enable: true
    ClientOUIdentifier:
        Certificate: cacerts/localhost-${PORT}-ca-${ORG}.pem
        OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
        Certificate: cacerts/localhost-${PORT}-ca-${ORG}.pem
        OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
        Certificate: cacerts/localhost-${PORT}-ca-${ORG}.pem
        OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
        Certificate: cacerts/localhost-${PORT}-ca-${ORG}.pem
        OrganizationalUnitIdentifier: orderer" > "${PWD}/organizations/peerOrganizations/${ORG}.example.com/msp/config.yaml"

    # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

    # Copy org's CA cert to org's /msp/tlscacerts directory (for use in the channel MSP definition)
    mkdir -p "${PWD}/organizations/peerOrganizations/${ORG}.example.com/msp/tlscacerts"
    cp "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem" "${PWD}/organizations/peerOrganizations/${ORG}.example.com/msp/tlscacerts/ca.crt"

    # Copy org's CA cert to org's /tlsca directory (for use by clients)
    mkdir -p "${PWD}/organizations/peerOrganizations/${ORG}.example.com/tlsca"
    cp "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem" "${PWD}/organizations/peerOrganizations/${ORG}.example.com/tlsca/tlsca.${ORG}.example.com-cert.pem"

    # Copy org's CA cert to org's /ca directory (for use by clients)
    mkdir -p "${PWD}/organizations/peerOrganizations/${ORG}.example.com/ca"
    cp "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem" "${PWD}/organizations/peerOrganizations/${ORG}.example.com/ca/ca.${ORG}.example.com-cert.pem"

    # infoln "Registering peer0"
    set -x
    fabric-ca-client register --caname "ca-${ORG}" --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    # infoln "Registering orderer0"
    set -x
    fabric-ca-client register --caname "ca-${ORG}" --id.name orderer0 --id.secret orderer0pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    # infoln "Registering the org admin"
    set -x
    fabric-ca-client register --caname "ca-${ORG}" --id.name "${ORG}admin" --id.secret "${ORG}adminpw" --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    # infoln "Generating the peer0 msp"
    set -x
    fabric-ca-client enroll -u "https://peer0:peer0pw@localhost:${PORT}" --caname "ca-${ORG}" -M "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/msp" --csr.hosts "peer0.${ORG}.example.com" --csr.hosts "0.0.0.0" --csr.hosts "127.0.0.1" --csr.hosts "localhost" --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/msp/config.yaml"

    # infoln "Generating the peer0-tls certificates"
    set -x
    fabric-ca-client enroll -u "https://peer0:peer0pw@localhost:${PORT}" --caname "ca-${ORG}" -M "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls" --enrollment.profile tls --csr.hosts "peer0.${ORG}.example.com" --csr.hosts "0.0.0.0" --csr.hosts "127.0.0.1" --csr.hosts "localhost" --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/ca.crt"
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/server.crt"
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/server.key"

    # Copy org's CA cert to peer's /msp/tlscacerts directory (for use in the peer MSP definition)
    mkdir -p "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/msp/tlscacerts"
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/msp/tlscacerts/tlsca.${ORG}.example.com-cert.pem"

    # infoln "Generating the orderer0 msp"
    set -x
    fabric-ca-client enroll -u "https://orderer0:orderer0pw@localhost:${PORT}" --caname "ca-${ORG}" -M "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/msp" --csr.hosts "orderer0.${ORG}.example.com" --csr.hosts "0.0.0.0" --csr.hosts "127.0.0.1" --csr.hosts "localhost" --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/msp/config.yaml"

    # infoln "Generating the orderer0-tls certificates"
    set -x
    fabric-ca-client enroll -u "https://orderer0:orderer0pw@localhost:${PORT}" --caname "ca-${ORG}" -M "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls" --enrollment.profile tls --csr.hosts "orderer0.${ORG}.example.com" --csr.hosts "0.0.0.0" --csr.hosts "127.0.0.1" --csr.hosts "localhost" --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    # Copy the tls CA cert, server cert, server keystore to well known file names in the orderer's tls directory that are referenced by orderer startup config
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/ca.crt"
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/server.crt"
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/server.key"

    # Copy org's CA cert to orderer's /msp/tlscacerts directory (for use in the orderer MSP definition)
    mkdir -p "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/msp/tlscacerts"
    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/${ORG}.example.com/orderers/orderer0.${ORG}.example.com/msp/tlscacerts/tlsca.${ORG}.example.com-cert.pem"

    # infoln "Generating the org admin msp"
    set -x
    fabric-ca-client enroll -u "https://${ORG}admin:${ORG}adminpw@localhost:${PORT}" --caname "ca-${ORG}" -M "${PWD}/organizations/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/${ORG}/ca-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/organizations/peerOrganizations/${ORG}.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp/config.yaml"
}

OPTION=$1

if [ "$OPTION" == "create" ]
then
    create_crypto org1 7054 admin1
    create_crypto org2 7154 admin2
    create_crypto org3 7254 admin3
    create_crypto org4 7354 admin4
    create_crypto org5 7454 admin5
elif [ "$OPTION" == "delete" ]
then
    sudo rm -rf ./organizations/peerOrganizations
fi
