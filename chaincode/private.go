package main

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// write private data
func (s *Smart_Contract) Write_Private_Data(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname     string            `json:"Recordname"`
		TargetOrgMSP   string            `json:"TargetOrgMSP"`
		TargetUsername string            `json:"TargetUsername"`
		Data           map[string]string `json:"Data"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Write_Private_Data> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Write_Private_Data> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Write_Private_Data> unmarshal input failed: %v", err)
	}
	// check RTBF mark
	key := string_Hash(input.Recordname + input.TargetUsername + input.TargetOrgMSP)
	marked, exists, err := rtbf_Mark(ctx, key, input.TargetOrgMSP)
	if err != nil {
		return fmt.Errorf("<Write_Private_Data> rtbf_Mark failed: %v", err)
	}
	if marked {
		return fmt.Errorf("<Write_Private_Data> record marked for RTBF, cannot write anymore")
	}
	// check if access control list exists
	aclJSON, err := ctx.GetStub().GetState(key + "_acl")
	if err != nil {
		return fmt.Errorf("<Write_Private_Data> get state access control list failed: %v", err)
	}
	if aclJSON != nil {
		// verify access control
		access, _, _, _, err := verify_Private_Access_Control(ctx, key, "w")
		if err != nil {
			return fmt.Errorf("<Write_Private_Data> verify private access control failed: %v", err)
		}
		if !access {
			return fmt.Errorf("<Write_Private_Data> write access denied")
		}
	} else { // writing without access control list, so can only write self data
		// get submitter details
		sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
		if err != nil {
			return fmt.Errorf("<Write_Private_Data> get submitter details failed: %v", err)
		}
		if input.TargetOrgMSP != sourceOrgMSP || input.TargetUsername != sourceUsername {
			return fmt.Errorf("<Write_Private_Data> write access denied")
		}
	}
	// write private data
	var record Private_Data
	record.ID = key + "_record"
	record.Recordname = input.Recordname
	record.Username = input.TargetUsername
	record.MSP = input.TargetOrgMSP
	record.Data = make(map[string]string)
	record.Data = input.Data
	if !exists { // first write
		record.RTBF = false
	}
	recordJSON, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("<Write_Private_Data> marshal record failed: %v", err)
	}
	collection := "private_" + input.TargetOrgMSP
	err = ctx.GetStub().PutPrivateData(collection, key+"_record", recordJSON)
	if err != nil {
		return fmt.Errorf("<Write_Private_Data> put private data record failed: %v", err)
	}
	return nil
}

// read private data
func (s *Smart_Contract) Read_Private_Data(ctx contractapi.TransactionContextInterface) (Private_Data, error) {
	var empty_private_data Private_Data
	empty_private_data.Data = make(map[string]string)
	type Input struct {
		Recordname     string `json:"Recordname"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		TargetUsername string `json:"TargetUsername"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> unmarshal input failed: %v", err)
	}
	// check RTBF mark
	key := string_Hash(input.Recordname + input.TargetUsername + input.TargetOrgMSP)
	marked, _, err := rtbf_Mark(ctx, key, input.TargetOrgMSP)
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> rtbf_Mark failed: %v", err)
	}
	if marked {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> record marked for rtbf, cannot read anymore")
	}
	// check if access control list exists
	aclJSON, err := ctx.GetStub().GetState(key + "_acl")
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> get state access control list failed: %v", err)
	}
	if aclJSON != nil {
		// verify access control
		access, _, _, _, err := verify_Private_Access_Control(ctx, key, "r")
		if err != nil {
			return empty_private_data, fmt.Errorf("<Read_Private_Data> verify private access control failed: %v", err)
		}
		if !access {
			return empty_private_data, fmt.Errorf("<Read_Private_Data> read access denied")
		}
	} else { // reading without access control list, so can only read self data
		// get submitter details
		sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
		if err != nil {
			return empty_private_data, fmt.Errorf("<Read_Private_Data> get submitter details failed: %v", err)
		}
		if input.TargetOrgMSP != sourceOrgMSP || input.TargetUsername != sourceUsername {
			return empty_private_data, fmt.Errorf("<Read_Private_Data> read access denied")
		}
	}
	// read data
	collection := "private_" + input.TargetOrgMSP
	recordJSON, err := ctx.GetStub().GetPrivateData(collection, key+"_record")
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> get private data record failed: %v", err)
	}
	if recordJSON == nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> record not found")
	}
	// match hashes
	private_hash := byte_Hash(recordJSON)
	public_hash, err := ctx.GetStub().GetPrivateDataHash(collection, key+"_record")
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> get private data hash record failed: %v", err)
	}
	if !bytes.Equal(private_hash, public_hash) {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> private and public record hashes do not match")
	}
	var record Private_Data
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return empty_private_data, fmt.Errorf("<Read_Private_Data> unmarshal record failed: %v", err)
	}
	return record, nil
}

func (s *Smart_Contract) Verify_Private_Data(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	type Input struct {
		Recordname     string `json:"Recordname"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		TargetUsername string `json:"TargetUsername"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return []byte{}, fmt.Errorf("<Verify_Private_Data> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return []byte{}, fmt.Errorf("<Verify_Private_Data> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return []byte{}, fmt.Errorf("<Verify_Private_Data> unmarshal input failed: %v", err)
	}
	key := string_Hash(input.Recordname + input.TargetUsername + input.TargetOrgMSP)
	collection := "private_" + input.TargetOrgMSP
	hash, err := ctx.GetStub().GetPrivateDataHash(collection, key)
	if err != nil {
		return []byte{}, fmt.Errorf("<Verify_Private_Data> get private data hash record failed: %v", err)
	}
	return hash, nil
}
