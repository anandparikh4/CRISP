function set_var(){
    # first element is 0 for 1-based indexing
    export PEER_PORTS=(0 7051 7151 7251 7351 7451)
    export ORDERER_PORTS=(0 7050 7150 7250 7350 7450)
    export ADMIN_PORTS=(0 9443 9543 9643 9743 9843)
    export CA_PORTS=(0 7054 7154 7254 7354 7454)
    export CHANNEL_ID=mychannel
    
    i=$1
    export FABRIC_CFG_PATH="${PWD}/organizations/config/org${i}.example.com"
    
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org${i}MSP"
    export CORE_PEER_MSPCONFIGPATH="${PWD}/organizations/peerOrganizations/org${i}.example.com/users/Admin@org${i}.example.com/msp"
    export CORE_PEER_ADDRESS="localhost:${PEER_PORTS[$i]}"
    export CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/organizations/peerOrganizations/org${i}.example.com/peers/peer0.org${i}.example.com/tls/ca.crt"
    
    export ORDERER_GENERAL_LISTENADDRESS="localhost:${ORDERER_PORTS[$i]}"
    export ORDERER="orderer0.org${i}.example.com"

    export CA_FILE="${PWD}/organizations/peerOrganizations/org${i}.example.com/tlsca/tlsca.org${i}.example.com-cert.pem"
    export CLIENT_CERT="${PWD}/organizations/peerOrganizations/org${i}.example.com/orderers/orderer0.org${i}.example.com/tls/server.crt"
    export CLIENT_KEY="${PWD}/organizations/peerOrganizations/org${i}.example.com/orderers/orderer0.org${i}.example.com/tls/server.key"
}
