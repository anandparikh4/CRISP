package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (s *Smart_Contract) Assemble_Committee(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string              `json:"Committee_Name"`
		Members        map[string][]string `json:"Members"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Assemble_Committee> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> unmarshal input failed: %v", err)
	}
	// no access control
	// the submitter must be a part of the committee
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> get submitter details failed: %v", err)
	}
	if !find_List(input.Members[sourceOrgMSP], sourceUsername) {
		return fmt.Errorf("<Assemble_Committee> submitter not part of committee")
	}
	// create committee object if not exists
	key := string_Hash(input.Committee_Name)
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> get state committee failed: %v", err)
	}
	if committeeJSON != nil {
		return fmt.Errorf("<Assemble_Committee> committee already exists")
	}
	var committee Committee
	committee.ID = key + "_committee"
	committee.Committee_Name = input.Committee_Name
	committee.Orgs = make([]string, 0)
	committee.Members = make(map[string][]Member)
	committee.Readers = make(map[string][]string)
	committee.Writers = make(map[string][]string)
	committee.Hashes = make(map[int][]byte)
	committee.Hashes[0] = nil
	committee.Approvals = make(map[string]int)
	committee.Latest = 0
	committee.Stable = 0
	committee.RTBF = false
	committee.History = byte_Hash([]byte("v0"))
	var member_list map[string][]string = make(map[string][]string)
	for targetOrgMSP, members := range input.Members {
		for _, targetUsername := range members {
			member_list[targetOrgMSP] = insert_List(member_list[targetOrgMSP], string_Hash(targetUsername))
		}
	}
	// assuming there will not be any Readers and Writers while initializing the committee, only members
	for targetOrgMSP, members := range input.Members {
		committee.Orgs = insert_List(committee.Orgs, targetOrgMSP)
		committee.Approvals[targetOrgMSP] = 0
		for _, targetUsername := range members {
			var member Member
			member.H_Username = string_Hash(targetUsername)
			member.RTBF_vote = false
			member.Member_votes = make(map[string][]string)
			member.Reader_Votes = make(map[string][]string)
			member.Writer_Votes = make(map[string][]string)
			member.Member_votes = member_list
			member.Reader_Votes = committee.Readers
			member.Writer_Votes = committee.Writers
			committee.Members[targetOrgMSP] = insert_Member(committee.Members[targetOrgMSP], member)
		}
	}
	committeeJSON, err = json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> put state committee failed: %v", err)
	}
	// set state-based endorsement policy for committee object
	err = set_Ledger_Data_Endorsement_Policy(ctx, key+"_committee", committee.Orgs)
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> set ledger data endorsement policy committee failed: %v", err)
	}
	// write zero-valued protected info for version 0 to all orgs' protected databases and set endorsement policies for protected info
	var info Protected_Info
	info.ID = key + "_info"
	info.Versions = make(map[int]string)
	info.Versions[0] = "v0"
	infoJSON, err := json.Marshal(info)
	if err != nil {
		return fmt.Errorf("<Assemble_Committee> marshal info failed: %v", err)
	}
	for _, targetOrgMSP := range committee.Orgs {
		collection := "protected_" + targetOrgMSP
		err = ctx.GetStub().PutPrivateData(collection, key+"_info", infoJSON)
		if err != nil {
			return fmt.Errorf("<Assemble_Committee> put private data collection failed: %v", err)
		}
		err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", committee.Orgs)
		if err != nil {
			return fmt.Errorf("<Assemble_Committee> set collection data endorsement policy failed: %v", err)
		}
	}
	return nil
}

func (s *Smart_Contract) Disassemble_Committee(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Disassemble_Committee> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Disassemble_Committee> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Disassemble_Committee> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, _, _, err := verify_Protected_Access_Control(ctx, key, "m")
	if err != nil {
		return fmt.Errorf("<Disassemble_Committee> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Disassemble_Committee> disassemble committee access denied")
	}
	// check if marked for rtbf
	if !committee.RTBF {
		return fmt.Errorf("<Disassemble_Committee> committee not marked for rtbf")
	}
	// delete committee object and protected info
	err = ctx.GetStub().DelState(key + "_committee")
	if err != nil {
		return fmt.Errorf("<Disassemble_Committee> delete state committee failed: %v", err)
	}
	for _, targetOrgMSP := range committee.Orgs {
		collection := "protected_" + targetOrgMSP
		err = ctx.GetStub().DelPrivateData(collection, key+"_info")
		if err != nil {
			return fmt.Errorf("<Disassemble_Committee> delete private data protected info failed: %v", err)
		}
	}
	return nil
}

func (s *Smart_Contract) Approve_Version(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		Version        string `json:"Version"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Approve_Version> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Approve_Version> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Approve_Version> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, sourceOrgMSP, _, err := verify_Protected_Access_Control(ctx, key, "m")
	if err != nil {
		return fmt.Errorf("<Approve_Version> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Approve_Version> approve version access denied")
	}
	// check last version + 1 = requested version
	last_approved := committee.Approvals[sourceOrgMSP]
	v, _ := strconv.Atoi(input.Version)
	if last_approved < v-1 {
		return fmt.Errorf("<Approve_Version> versions %d -> %d not approved", last_approved+1, v-1)
	}
	// approve version and check if its stable
	committee.Approvals[sourceOrgMSP] = v
	committee.Stable = check_Stable(committee.Approvals)
	committeeJSON, err := json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Approve_Version> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Approve_Version> put state committee failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Verify_Version(ctx contractapi.TransactionContextInterface) (string, error) {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		Version        string `json:"Version"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return "", fmt.Errorf("<Verify_Version> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return "", fmt.Errorf("<Verify_Version> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return "", fmt.Errorf("<Verify_Version> unmarshal input failed: %v", err)
	}
	// no access control
	key := string_Hash(input.Committee_Name)
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return "", fmt.Errorf("<Verify_Version> get state committee failed: %v", err)
	}
	if committeeJSON == nil {
		return "", fmt.Errorf("<Verify_Version> committee object does not exist")
	}
	var committee Committee
	err = json.Unmarshal(committeeJSON, &committee)
	if err != nil {
		return "", fmt.Errorf("<Verify_Version> unmarshal committee failed: %v", err)
	}
	v, _ := strconv.Atoi(input.Version)
	if len(committee.Hashes) < v+1 {
		return "", fmt.Errorf("<Verify_Version> version not found")
	}
	hash := string(committee.Hashes[v][:])
	return hash, nil
}
