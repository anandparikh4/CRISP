source ./var.sh

function package(){
    set_var $1
    peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_PATH} --lang ${CC_LANG} --label ${CC_NAME}_${CC_VERSION}
    export PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
}

function install(){
    set_var $1
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
}

function approve(){
    set_var $1
    export PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
    peer lifecycle chaincode approveformyorg -o "${ORDERER_GENERAL_LISTENADDRESS}" --ordererTLSHostnameOverride "${ORDERER}" --tls --cafile "${CA_FILE}" \
	--channelID "${CHANNEL_ID}" --name "${CC_NAME}" --version "${CC_VERSION}" --package-id "${PACKAGE_ID}" --sequence "${CC_SEQUENCE}" ${INIT_REQUIRED} ${CC_END_POLICY} ${CC_COLL_CONFIG}
}

function commit(){
	set_var $1
	peer lifecycle chaincode commit -o "${ORDERER_GENERAL_LISTENADDRESS}" --ordererTLSHostnameOverride "${ORDERER}" --tls --cafile "${CA_FILE}" \
	--peerAddresses "localhost:7051" --tlsRootCertFiles "./organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem" \
	--peerAddresses "localhost:7151" --tlsRootCertFiles "./organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem" \
	--peerAddresses "localhost:7251" --tlsRootCertFiles "./organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem" \
	--peerAddresses "localhost:7351" --tlsRootCertFiles "./organizations/peerOrganizations/org4.example.com/tlsca/tlsca.org4.example.com-cert.pem" \
	--peerAddresses "localhost:7451" --tlsRootCertFiles "./organizations/peerOrganizations/org5.example.com/tlsca/tlsca.org5.example.com-cert.pem" \
	--channelID "${CHANNEL_ID}" --name "${CC_NAME}" --version "${CC_VERSION}" --sequence "${CC_SEQUENCE}" ${INIT_REQUIRED} ${CC_END_POLICY} ${CC_COLL_CONFIG}
}

function invoke(){
	set_var $1
	export PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
	fcn_call='{"function":"'${CC_INIT_FCN}'","Args":[]}'
	echo "Hello World! Invoking chaincode."
	peer chaincode invoke -o "${ORDERER_GENERAL_LISTENADDRESS}" --ordererTLSHostnameOverride "${ORDERER}" --tls --cafile "${CA_FILE}" \
	--peerAddresses "localhost:7051" --tlsRootCertFiles "./organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem" \
	--peerAddresses "localhost:7151" --tlsRootCertFiles "./organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem" \
	--peerAddresses "localhost:7251" --tlsRootCertFiles "./organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem" \
	--peerAddresses "localhost:7351" --tlsRootCertFiles "./organizations/peerOrganizations/org4.example.com/tlsca/tlsca.org4.example.com-cert.pem" \
	--peerAddresses "localhost:7451" --tlsRootCertFiles "./organizations/peerOrganizations/org5.example.com/tlsca/tlsca.org5.example.com-cert.pem" \
	-C "${CHANNEL_ID}" -n "${CC_NAME}" --isInit -c ${fcn_call}
}

function query(){
  set_var $1
  export PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
  fcn_call='{"function":"'Query'","Args":[]}'
  peer chaincode invoke -o "${ORDERER_GENERAL_LISTENADDRESS}" --ordererTLSHostnameOverride "${ORDERER}" --tls --cafile "${CA_FILE}" \
	--peerAddresses "localhost:7051" --tlsRootCertFiles "./organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem" \
  --peerAddresses "localhost:7151" --tlsRootCertFiles "./organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem" \
  --peerAddresses "localhost:7251" --tlsRootCertFiles "./organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem" \
  --peerAddresses "localhost:7351" --tlsRootCertFiles "./organizations/peerOrganizations/org4.example.com/tlsca/tlsca.org4.example.com-cert.pem" \
  --peerAddresses "localhost:7451" --tlsRootCertFiles "./organizations/peerOrganizations/org5.example.com/tlsca/tlsca.org5.example.com-cert.pem" \
  -C "${CHANNEL_ID}" -n "${CC_NAME}" -c ${fcn_call}
}

# set/parse arguments
CC_NAME="chaincode"
CC_PATH="../chaincode"
CC_SEQUENCE=1
CC_VERSION=1.0
CC_LANG=golang
CC_END_POLICY="AND('Org1MSP.member','Org2MSP.member','Org3MSP.member','Org4MSP.member','Org5MSP.member')"
CC_COLL_CONFIG="../database/collections.json"
CC_INIT_FCN="Initialize"
INIT_REQUIRED="--init-required"
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -ccn )
    CC_NAME="$2"
    shift
    ;;
  -ccp )
    CC_PATH="$2"
    shift
    ;;
  -ccep )
    CC_END_POLICY="$2"
    shift
    ;;
  -cccg )
    CC_COLL_CONFIG="$2"
    shift
    ;;
  * )
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done
if [ "$CC_END_POLICY" != "" ]; then
    CC_END_POLICY="--signature-policy $CC_END_POLICY"
fi
if [ "$CC_COLL_CONFIG" != "" ]; then
  CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
fi

package 1
for i in {1..5}
do
    install $i
    approve $i
done
commit 1

invoke 1
sleep 5
query 1
query 2
query 3
query 4
query 5
