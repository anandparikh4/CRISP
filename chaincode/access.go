package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (s *Smart_Contract) Construct_Access_Control_List(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname string `json:"Recordname"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Construct_Access_Control_List> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Construct_Access_Control_List> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Construct_Access_Control_List> unmarshal input failed: %v", err)
	}
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Construct_Access_Control_List> get submitter details failed: %v", err)
	}
	// write access control list if not exists
	key := string_Hash(input.Recordname + sourceUsername + sourceOrgMSP)
	aclJSON, err := ctx.GetStub().GetState(key + "_acl")
	if err != nil {
		return fmt.Errorf("<Construct_Access_Control_List> get state access control list failed: %v", err)
	}
	if aclJSON != nil {
		return fmt.Errorf("<Construct_Access_Control_List> access control list already exists")
	}
	var acl Access_Control_List
	acl.ID = key + "_acl"
	acl.H_Username = string_Hash(sourceUsername)
	acl.H_MSP = byte_Hash([]byte(sourceOrgMSP))
	acl.Read_Access_List = make(map[string][]string)
	acl.Write_Access_List = make(map[string][]string)
	aclJSON, err = json.Marshal(acl)
	if err != nil {
		return fmt.Errorf("<Construct_Access_Control_List> marshal access control list failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_acl", aclJSON)
	if err != nil {
		return fmt.Errorf("<Construct_Access_Control_List> put state access control list failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Destruct_Access_Control_List(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname string `json:"Recordname"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Destruct_Access_Control_List> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Destruct_Access_Control_List> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Destruct_Access_Control_List> unmarshal input failed: %v", err)
	}
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Destruct_Access_Control_List> get submitter details failed: %v", err)
	}
	// delete access control list if exists
	key := string_Hash(input.Recordname + sourceUsername + sourceOrgMSP)
	aclJSON, err := ctx.GetStub().GetState(key + "_acl")
	if err != nil {
		return fmt.Errorf("<Destruct_Access_Control_List> get state access control list failed: %v", err)
	}
	if aclJSON == nil {
		return fmt.Errorf("<Destruct_Access_Control_List> access control list does not exist")
	}
	err = ctx.GetStub().DelState(key + "_acl")
	if err != nil {
		return fmt.Errorf("<Destruct_Access_Control_List> delete state access control list failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Grant_Access_Control(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname     string `json:"Recordname"`
		Manner         string `json:"Manner"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		TargetUsername string `json:"TargetUsername"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Grant_Access_Control> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Grant_Access_Control> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Grant_Access_Control> unmarshal input failed: %v", err)
	}
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Grant_Access_Control> get submitter details failed: %v", err)
	}
	// check access control
	key := string_Hash(input.Recordname + sourceUsername + sourceOrgMSP)
	access, acl, _, _, err := verify_Private_Access_Control(ctx, key, "o")
	if err != nil {
		return fmt.Errorf("<Grant_Access_Control> verify private access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Grant_Access_Control> grant access denied: %v", err)
	}
	// grant access control
	if input.Manner == "r" {
		acl.Read_Access_List[input.TargetOrgMSP] = insert_List(acl.Read_Access_List[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	if input.Manner == "w" {
		acl.Write_Access_List[input.TargetOrgMSP] = insert_List(acl.Write_Access_List[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	aclJSON, err := json.Marshal(acl)
	if err != nil {
		return fmt.Errorf("<Grant_Access_Control> marshal access control list failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_acl", aclJSON)
	if err != nil {
		return fmt.Errorf("<Grant_Access_Control> put state access control list failed: %v", err)
	}
	return err
}

func (s *Smart_Contract) Revoke_Access_Control(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Recordname     string `json:"Recordname"`
		Manner         string `json:"Manner"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		TargetUsername string `json:"TargetUsername"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Revoke_Access_Control> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Revoke_Access_Control> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Revoke_Access_Control> unmarshal input failed: %v", err)
	}
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Revoke_Access_Control> get submitter details failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Recordname + sourceUsername + sourceOrgMSP)
	access, acl, _, _, err := verify_Private_Access_Control(ctx, key, "o")
	if err != nil {
		return fmt.Errorf("<Revoke_Access_Control> verify private access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Revoke_Access_Control> revoke access denied")
	}
	// revoke access control
	if input.Manner == "r" {
		acl.Read_Access_List[input.TargetOrgMSP] = delete_List(acl.Read_Access_List[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	if input.Manner == "w" {
		acl.Write_Access_List[input.TargetOrgMSP] = delete_List(acl.Write_Access_List[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	aclJSON, err := json.Marshal(acl)
	if err != nil {
		return fmt.Errorf("<Revoke_Access_Control> marshal access control list failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_acl", aclJSON)
	if err != nil {
		return fmt.Errorf("<Revoke_Access_Control> put state access control list failed: %v", err)
	}
	return nil
}
