package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (s *Smart_Contract) Vote_Protected_RTBF(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Vote_Protected_RTBF> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Vote_Protected_RTBF> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Vote_Protected_RTBF> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, sourceOrgMSP, sourceUsername, err := verify_Protected_Access_Control(ctx, key, "m")
	if err != nil {
		return fmt.Errorf("<Vote_Protected_RTBF> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Vote_Protected_RTBF> vote rtbf access denied")
	}
	// vote rtbf
	idx := find_Member(committee.Members[sourceOrgMSP], string_Hash(sourceUsername))
	committee.Members[sourceOrgMSP][idx].RTBF_vote = true
	// check rtbf majority
	if check_RTBF_Majority(committee.Members) {
		committee.RTBF = true
		// set state-based endorsement policy for protected databases and committee object
		orgsJSON, err := ctx.GetStub().GetState("Organizations")
		if err != nil {
			return fmt.Errorf("<Vote_Protected_RTBF> get state organizations failed: %v", err)
		}
		if orgsJSON == nil {
			return fmt.Errorf("<Vote_Protected_RTBF> organizations object does not exist")
		}
		var orgs Organizations
		err = json.Unmarshal(orgsJSON, &orgs)
		if err != nil {
			return fmt.Errorf("<Vote_Protected_RTBF> unmarshal organizations failed: %v", err)
		}
		err = set_Ledger_Data_Endorsement_Policy(ctx, key+"_committee", orgs.OrgList)
		if err != nil {
			return fmt.Errorf("<Vote_Protected_RTBF> set ledger data endorsement policy organizations failed: %v", err)
		}
		for _, targetOrgMSP := range committee.Orgs {
			collection := "protected_" + targetOrgMSP
			err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", orgs.OrgList)
			if err != nil {
				return fmt.Errorf("<Vote_Protected_RTBF> set collection data endorsement policy failed: %v", err)
			}
		}
	}
	committeeJSON, err := json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Vote_Protected_RTBF> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Vote_Protected_RTBF> put state committee failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Check_Protected_RTBF(ctx contractapi.TransactionContextInterface) (bool, error) {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return false, fmt.Errorf("<Check_Protected_RTBF> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return false, fmt.Errorf("<Check_Protected_RTBF> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return false, fmt.Errorf("<Check_Protected_RTBF> unmarshal input failed: %v", err)
	}
	// check if committee exists
	key := string_Hash(input.Committee_Name)
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return false, fmt.Errorf("<Check_Protected_RTBF> get state committee failed: %v", err)
	}
	if committeeJSON != nil {
		return false, nil
	}
	// check if protected info exists on target orgmsp
	collection := "protected_" + input.TargetOrgMSP
	infoJSON, err := ctx.GetStub().GetPrivateData(collection, key+"_info")
	if err != nil {
		return false, fmt.Errorf("<Check_Protected_RTBF> get private data protected info failed: %v", err)
	}
	if infoJSON != nil {
		return false, nil
	}
	return true, nil
}

func (s *Smart_Contract) Mark_Private_RTBF(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname string `json:"Recordname"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Mark_Private_RTBF> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> unmarshal input failed: %v", err)
	}
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> get submitter details failed: %v", err)
	}
	// no access control
	key := string_Hash(input.Recordname + sourceUsername + sourceOrgMSP)
	// mark if unmarked
	collection := "private_" + sourceOrgMSP
	recordJSON, err := ctx.GetStub().GetPrivateData(collection, key+"_record")
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> get private data record failed: %v", err)
	}
	if recordJSON == nil {
		return fmt.Errorf("<Mark_Private_RTBF> record does not exist")
	}
	var record Private_Data
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> unmarshal record failed: %v", err)
	}
	if record.RTBF {
		return fmt.Errorf("<Mark_Private_RTBF> already marked for RTBF")
	}
	record.RTBF = true
	recordJSON, err = json.Marshal(record)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> marshal record failed: %v", err)
	}
	err = ctx.GetStub().PutPrivateData(collection, key+"_record", recordJSON)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> put state record failed: %v", err)
	}
	// set state-based endorsement policies for private data
	orgsJSON, err := ctx.GetStub().GetState("Organizations")
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> get state organizations failed: %v", err)
	}
	if orgsJSON == nil {
		return fmt.Errorf("<Mark_Private_RTBF> organizations object does not exist")
	}
	var orgs Organizations
	err = json.Unmarshal(orgsJSON, &orgs)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> unmarshal organizations failed: %v", err)
	}
	err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_record", orgs.OrgList)
	if err != nil {
		return fmt.Errorf("<Mark_Private_RTBF> set collection data endorsement policy record failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Exercise_Private_RTBF(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname string `json:"Recordname"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Exercise_Private_RTBF> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Exercise_Private_RTBF> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Exercise_Private_RTBF> unmarshal input failed: %v", err)
	}
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Exercise_Private_RTBF> get submitter details failed: %v", err)
	}
	// no access control, but if access control list exists, delete it
	key := string_Hash(input.Recordname + sourceUsername + sourceOrgMSP)
	aclJSON, err := ctx.GetStub().GetState(key + "_acl")
	if err != nil {
		return fmt.Errorf("<Exercise_Private_RTBF> get state access control list failed: %v", err)
	}
	if aclJSON != nil {
		err = ctx.GetStub().DelState(key + "_acl")
		if err != nil {
			return fmt.Errorf("<Exercise_Private_RTBF> delete state access control list failed: %v", err)
		}
	}
	// delete private data record
	collection := "private_" + sourceOrgMSP
	err = ctx.GetStub().DelPrivateData(collection, key+"_record")
	if err != nil {
		return fmt.Errorf("<Exercise_Private_RTBF> delete private data record failed: %v", err)
	}
	return nil
}
