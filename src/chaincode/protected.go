package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (s *Smart_Contract) Write_Protected_Info(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string            `json:"Committee_Name"`
		Versions       map[string]string `json:"Versions"`
		CID            string            `json:"CID"`
		Key            string            `json:"Key"`
		File_Hash      string            `json:"File_Hash"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Write_Protected_Info> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Write_Protected_Info> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Write_Protected_Info> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, _, _, err := verify_Protected_Access_Control(ctx, key, "w")
	if err != nil {
		return fmt.Errorf("<Write_Protected_Info> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Write_Protected_Info> write access denied")
	}
	// verify hash of versions and length of history
	var history []byte = make([]byte, 0)
	for _, secret := range input.Versions {
		history = append(history, []byte(secret)...)
	}
	// hash := byte_Hash(history)
	// if !bytes.Equal(hash, committee.History) || len(input.Versions) != committee.Latest+1 {
	// 	return fmt.Errorf("<Write_Protected_Info> stale or incorrect history provided, try again after refreshing")
	// }
	if len(input.Versions) != committee.Latest+1 {
		return fmt.Errorf("<Write_Protected_Info> stale history provided, try again after refreshing")
	}
	// append new version
	committee.Latest = committee.Latest + 1
	var info Protected_Info
	info.ID = key + "_info"
	info.Versions = make(map[int]string)
	for version, secret := range input.Versions {
		v, _ := strconv.Atoi(version)
		info.Versions[v] = secret
	}
	info.Versions[committee.Latest] = input.CID + input.Key
	history = append(history, []byte(info.Versions[committee.Latest])...)
	committee.History = byte_Hash(history)
	committee.Hashes[committee.Latest] = []byte(input.File_Hash)
	committeeJSON, err := json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Write_Protected_Info> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Write_Protected_Info> put state committee failed: %v", err)
	}
	// write protected info to all member orgs' protected databases
	infoJSON, err := json.Marshal(info)
	if err != nil {
		return fmt.Errorf("<Write_Protected_Info> marshal info failed: %v", err)
	}
	for _, targetOrgMSP := range committee.Orgs {
		collection := "protected_" + targetOrgMSP
		err = ctx.GetStub().PutPrivateData(collection, key+"_info", infoJSON)
		if err != nil {
			return fmt.Errorf("<Write_Protected_Info> put private data info failed: %v", err)
		}
	}
	return nil
}

// a type defined just to make Read_Protected_Info work
type Output struct {
	Versions map[string]string `json:"Versions"`
}

func (s *Smart_Contract) Read_Protected_Info(ctx contractapi.TransactionContextInterface) (Output, error) {
	var empty_output Output
	empty_output.Versions = make(map[string]string)
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		Version        string `json:"Version"`
		Server         bool   `json:"Server"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return empty_output, fmt.Errorf("<Read_Protected_Info> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	manner := "r"
	if input.Server { // server evaluating read for transaction purposes
		manner = "s"
	}
	access, committee, sourceOrgMSP, _, err := verify_Protected_Access_Control(ctx, key, manner)
	if err != nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> verify protected access control failed: %v", err)
	}
	if !access {
		return empty_output, fmt.Errorf("<Read_Protected_Info> read access denied")
	}
	// check approval
	v, _ := strconv.Atoi(input.Version)
	if committee.Approvals[sourceOrgMSP] < v {
		return empty_output, fmt.Errorf("<Read_Protected_Info> unapproved version requested")
	}
	// read protected info from target org's protected database
	collection := "protected_" + input.TargetOrgMSP
	infoJSON, err := ctx.GetStub().GetPrivateData(collection, key+"_info")
	if err != nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> get private data info failed: %v", err)
	}
	if infoJSON == nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> protected info does not exist")
	}
	// match hashes
	private_hash := byte_Hash(infoJSON)
	public_hash, err := ctx.GetStub().GetPrivateDataHash(collection, key+"_info")
	if err != nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> get private data hash protected info failed: %v", err)
	}
	if !bytes.Equal(private_hash, public_hash) {
		return empty_output, fmt.Errorf("<Read_Protected_Info> private and public hashes do not match")
	}
	var info Protected_Info
	err = json.Unmarshal(infoJSON, &info)
	if err != nil {
		return empty_output, fmt.Errorf("<Read_Protected_Info> unmarshal info failed: %v", err)
	}
	// mid := len(info.Versions[input.Version]) / 2
	// CID := info.Versions[input.Version][:mid]
	// Key := append([]byte{}, info.Versions[input.Version][mid:]...)
	// return CID, Key, nil
	var output Output
	output.Versions = make(map[string]string)
	for version, secret := range info.Versions {
		output.Versions[strconv.Itoa(version)] = secret
	}
	return output, nil
}

func (s *Smart_Contract) Distribute_Protected_Info(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string            `json:"Committee_Name"`
		TargetOrgMSP   string            `json:"TargetOrgMSP"`
		Versions       map[string]string `json:"Versions"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Distribute_Protected_Info> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Distribute_Protected_Info> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Distribute_Protected_Info> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, _, _, err := verify_Protected_Access_Control(ctx, key, "m")
	if err != nil {
		return fmt.Errorf("<Distribute_Protected_Info> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Distribute_Protected_Info> distribute protected info failed")
	}
	// check if targetOrgMSP has atleast 1 user in committee
	member_count := len(committee.Members[input.TargetOrgMSP])
	reader_count := len(committee.Readers[input.TargetOrgMSP])
	writer_count := len(committee.Writers[input.TargetOrgMSP])
	if member_count+reader_count+writer_count == 0 {
		return fmt.Errorf("<Distribute_Protected_Info> target organization has no users in committee")
	}
	// check that all protected info hashes are equal and also equal to the hash of provided info
	var hash []byte = nil
	for _, targetOrgMSP := range committee.Orgs {
		if targetOrgMSP == input.TargetOrgMSP { // do not check for the organization to which we wish to distribute, since that does NOT yet contain the information
			continue
		}
		collection := "protected_" + targetOrgMSP
		compare, err := ctx.GetStub().GetPrivateDataHash(collection, key+"_info")
		if err != nil {
			return fmt.Errorf("<Distribute_Protected_Info> get private data hash info failed: %v", err)
		}
		if hash == nil {
			hash = compare
		} else if !bytes.Equal(hash, compare) {
			return fmt.Errorf("<Distribute_Protected_Info> protected info hashes do not match")
		}
	}
	var info Protected_Info
	info.ID = key + "_info"
	info.Versions = make(map[int]string)
	for version, secret := range input.Versions {
		v, _ := strconv.Atoi(version)
		info.Versions[v] = secret
	}
	infoJSON, err := json.Marshal(info)
	if err != nil {
		return fmt.Errorf("<Distribute_Protected_Info> marshal info failed: %v", err)
	}
	// if !bytes.Equal(hash, committee.History) || len(input.Versions) != committee.Latest+1 {
	// 	return fmt.Errorf("<Write_Protected_Info> stale or incorrect history provided, try again after refreshing")
	// }
	if len(input.Versions) != committee.Latest+1 {
		return fmt.Errorf("<Write_Protected_Info> stale history provided, try again after refreshing")
	}
	collection := "protected_" + input.TargetOrgMSP
	err = ctx.GetStub().PutPrivateData(collection, key+"_info", infoJSON)
	if err != nil {
		return fmt.Errorf("<Distribute_Protected_Info> put private data info failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Allow_Protected_Info(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Allow_Protected_Info> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> unmarshal input failed: %v", err)
	}
	// submitter must be part of committee - either member/reader/writer and the ONLY user from this org: meaning that must be first joinee
	key := string_Hash(input.Committee_Name)
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> get submitter details failed: %v", err)
	}
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> get state committee failed: %v", err)
	}
	if committeeJSON == nil {
		return fmt.Errorf("<Allow_Protected_Info> committee does not exist")
	}
	var committee Committee
	err = json.Unmarshal(committeeJSON, &committee)
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> unmarshal committee failed: %v", err)
	}
	member_found := find_Member(committee.Members[sourceOrgMSP], string_Hash(sourceUsername))
	reader_found := find_List(committee.Readers[sourceOrgMSP], string_Hash(sourceUsername))
	writer_found := find_List(committee.Writers[sourceOrgMSP], string_Hash(sourceUsername))
	if member_found == -1 && !writer_found && !reader_found {
		return fmt.Errorf("<Allow_Protected_Info> access denied")
	}
	member_count := len(committee.Members[sourceOrgMSP])
	reader_count := len(committee.Readers[sourceOrgMSP])
	writer_count := len(committee.Writers[sourceOrgMSP])
	if member_count+reader_count+writer_count > 1 {
		// return fmt.Errorf("<Allow_Protected_Info> not first joinee")
		return nil
	}
	// first joinee, put empty data and set endorsement policy
	var info Protected_Info
	info.ID = key + "_info"
	info.Versions = make(map[int]string)
	info.Versions[0] = "v0"
	infoJSON, err := json.Marshal(info)
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> marshal info failed: %v", err)
	}
	collection := "protected_" + sourceOrgMSP
	// fmt.Printf("Reached Here!\n")
	// fmt.Printf("Collection: %v\n", collection)
	// fmt.Printf("Committee Orgs: %v\n", committee.Orgs)
	err = ctx.GetStub().PutPrivateData(collection, key+"_info", infoJSON)
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> put private data info failed: %v", err)
	}
	err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", committee.Orgs)
	if err != nil {
		return fmt.Errorf("<Allow_Protected_Info> set collection data endorsement policy failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Verify_Protected_Info(ctx contractapi.TransactionContextInterface, Committee_Name string) (string, error) {
	// no access control
	// read hash of protected info for all member org collections from ledger
	key := string_Hash(Committee_Name)
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return "", fmt.Errorf("<Verify_Protected_Info> get state committee failed: %v", err)
	}
	if committeeJSON == nil {
		return "", fmt.Errorf("<Verify_Protected_Info> committee does not exist")
	}
	var committee Committee
	err = json.Unmarshal(committeeJSON, &committee)
	if err != nil {
		return "", fmt.Errorf("<Verify_Protected_Info> unmarshal committee failed: %v", err)
	}
	var hash []byte = nil
	for _, targetOrgMSP := range committee.Orgs {
		collection := "protected_" + targetOrgMSP
		compare, err := ctx.GetStub().GetPrivateDataHash(collection, key+"_info")
		if err != nil {
			return "", fmt.Errorf("<Verify_Protected_Info> get private data hash info failed: %v", err)
		}
		if hash == nil {
			hash = compare
		} else if !bytes.Equal(hash, compare) {
			return "", fmt.Errorf("<Verify_Protected_Info> protected info hashes do not match")
		}
	}
	return string(hash[:]), nil
}
