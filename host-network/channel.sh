#!/bin/bash
# bring up and bring down the channel

source ./var.sh

OPTION=$1
PEER_PORTS=(0 7051 7151 7251 7351 7451)
ADMIN_PORTS=(0 9443 9543 9643 9743 9843)    # first element is 0 for 1-based indexing
export CHANNEL_ID=mychannel
export FABRIC_CFG_PATH="."
ARTIFACTS_DIR="./channel-artifacts"

anchor(){
    i=$1
    set_var $i
    MSP="Org${i}MSP"

    OUTPUT="${ARTIFACTS_DIR}/${CORE_PEER_LOCALMSPID}config.json"
    peer channel fetch config "${ARTIFACTS_DIR}/config_block.pb" -o "${ORDERER_GENERAL_LISTENADDRESS}" --ordererTLSHostnameOverride "${ORDERER}" -c "${CHANNEL_ID}" --tls --cafile "${CA_FILE}"
    configtxlator proto_decode --input "${ARTIFACTS_DIR}/config_block.pb" --type common.Block --output "${ARTIFACTS_DIR}/config_block.json"
    jq .data.data[0].payload.data.config "${ARTIFACTS_DIR}/config_block.json" >"${OUTPUT}"

    HOST="peer0.org${i}.example.com"
    PORT=${ADMIN_PORTS[$i]}
    jq '.channel_group.groups.Application.groups.'${CORE_PEER_LOCALMSPID}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' "${ARTIFACTS_DIR}/${CORE_PEER_LOCALMSPID}config.json" > "${ARTIFACTS_DIR}/${CORE_PEER_LOCALMSPID}modified_config.json"

    ORIGINAL="${ARTIFACTS_DIR}/${CORE_PEER_LOCALMSPID}config.json"
    MODIFIED="${ARTIFACTS_DIR}/${CORE_PEER_LOCALMSPID}modified_config.json"
    OUTPUT="./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx"
    configtxlator proto_encode --input "${ORIGINAL}" --type common.Config --output "${ARTIFACTS_DIR}/original_config.pb"
    configtxlator proto_encode --input "${MODIFIED}" --type common.Config --output "${ARTIFACTS_DIR}/modified_config.pb"
    configtxlator compute_update --channel_id "${CHANNEL_ID}" --original "${ARTIFACTS_DIR}/original_config.pb" --updated "${ARTIFACTS_DIR}/modified_config.pb" --output "${ARTIFACTS_DIR}/config_update.pb"
    configtxlator proto_decode --input "${ARTIFACTS_DIR}/config_update.pb" --type common.ConfigUpdate --output "${ARTIFACTS_DIR}/config_update.json"
    echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_ID'", "type":2}},"data":{"config_update":'$(cat "${ARTIFACTS_DIR}/config_update.json")'}}}' | jq . >"${ARTIFACTS_DIR}/config_update_in_envelope.json"
    configtxlator proto_encode --input "${ARTIFACTS_DIR}/config_update_in_envelope.json" --type common.Envelope --output "${OUTPUT}"

    peer channel update -o "${ORDERER_GENERAL_LISTENADDRESS}" --ordererTLSHostnameOverride "${ORDERER}" -c "${CHANNEL_ID}" -f "${ARTIFACTS_DIR}/${CORE_PEER_LOCALMSPID}anchors.tx" --tls --cafile "${CA_FILE}"
}

if [ "$OPTION" == "up" ]
then
    # create channel artifacts
    "$PWD"/../../bin/configtxgen -profile SampleAppChannelEtcdRaft -outputBlock ./channel-artifacts/genesis_block.pb -channelID "${CHANNEL_ID}"
    # "$PWD"/../../bin/configtxgen -profile SampleAppChannelEtcdRaft -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID "$CHANNEL_ID"
    # for i in {1..5}
    # do
    #     MSP="Org${i}MSP"
    #     "$PWD"/../../bin/configtxgen -profile SampleAppChannelEtcdRaft -outputAnchorPeersUpdate "./channel-artifacts/${MSP}anchors.tx" -channelID "$CHANNEL_ID" -asOrg "${MSP}"        
    # done

    for i in {1..5}     # for all organizations
    do
        set_var $i      # export environment variables
        osnadmin channel join --channelID "$CHANNEL_ID" -o "localhost:${ADMIN_PORTS[$i]}" --config-block ./channel-artifacts/genesis_block.pb --ca-file "${CA_FILE}" --client-cert "$CLIENT_CERT" --client-key "$CLIENT_KEY"  # join orderer
        peer channel join -b ./channel-artifacts/genesis_block.pb   # join peer
        # for j in {1..5} # sign all config transactions
        # do
        #     MSP="Org${j}MSP"
        #     peer channel signconfigtx -f "./channel-artifacts/${MSP}anchors.tx"
        # done
    done

    # sleep 15

    # # update channel configuration
    # for i in {2..5}
    # do
    #     anchor $i
    # done

elif [ "$OPTION" == "down" ]
then
    rm -rf ./channel-artifacts/*    # erase channel artifacts
    for i in {1..5}     # for all organizations
    do
        set_var $i      # export environment variables
        osnadmin channel remove --channelID "$CHANNEL_ID" -o "localhost:${ADMIN_PORTS[$i]}" --ca-file "$CA_FILE" --client-cert "$CLIENT_CERT" --client-key "$CLIENT_KEY"    # remove orderer
        peer node unjoin --channelID "$CHANNEL_ID"    # unjoin peer
    done
fi
