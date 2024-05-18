package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (s *Smart_Contract) Grant_Vote_Access(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		TargetUsername string `json:"TargetUsername"`
		Type           string `json:"Type"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Grant_Vote_Access> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Grant_Vote_Access> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Grant_Vote_Access> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, sourceOrgMSP, sourceUsername, err := verify_Protected_Access_Control(ctx, key, "m")
	if err != nil {
		return fmt.Errorf("<Grant_Vote_Access> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Grant_Vote_Access> grant vote access denied")
	}
	// grant vote
	fmt.Printf("%s\n", input.TargetUsername)
	fmt.Printf("%s\n", string_Hash(input.TargetUsername))
	fmt.Printf("%s\n", input.Type)
	idx := find_Member(committee.Members[sourceOrgMSP], string_Hash(sourceUsername))
	if input.Type == "m" {
		committee.Members[sourceOrgMSP][idx].Member_votes[input.TargetOrgMSP] = insert_List(committee.Members[sourceOrgMSP][idx].Member_votes[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	if input.Type == "r" {
		committee.Members[sourceOrgMSP][idx].Reader_Votes[input.TargetOrgMSP] = insert_List(committee.Members[sourceOrgMSP][idx].Reader_Votes[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	if input.Type == "w" {
		committee.Members[sourceOrgMSP][idx].Writer_Votes[input.TargetOrgMSP] = insert_List(committee.Members[sourceOrgMSP][idx].Writer_Votes[input.TargetOrgMSP], string_Hash(input.TargetUsername))
		votes, total := count_votes(committee, input.TargetOrgMSP, string_Hash(input.TargetUsername), "w")
		fmt.Printf("%d, %d\n", votes, total)
	}
	committeeJSON, err := json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Grant_Vote_Access> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Grant_Vote_Access> put state committee failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Revoke_Vote_Access(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		TargetOrgMSP   string `json:"TargetOrgMSP"`
		TargetUsername string `json:"TargetUsername"`
		Type           string `json:"Type"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Revoke_Vote_Access> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, sourceOrgMSP, sourceUsername, err := verify_Protected_Access_Control(ctx, key, "m")
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Revoke_Vote_Access> grant vote access denied")
	}
	// cannot revoke your own member vote
	if input.Type == "m" && input.TargetOrgMSP == sourceOrgMSP && input.TargetUsername == sourceUsername {
		return fmt.Errorf("<Revoke_Vote_Access> cannot revoke your own member vote")
	}
	// revoke vote
	idx := find_Member(committee.Members[sourceOrgMSP], string_Hash(sourceUsername))
	if input.Type == "m" {
		committee.Members[sourceOrgMSP][idx].Member_votes[input.TargetOrgMSP] = delete_List(committee.Members[sourceOrgMSP][idx].Member_votes[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	if input.Type == "r" {
		committee.Members[sourceOrgMSP][idx].Reader_Votes[input.TargetOrgMSP] = delete_List(committee.Members[sourceOrgMSP][idx].Reader_Votes[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	if input.Type == "w" {
		committee.Members[sourceOrgMSP][idx].Writer_Votes[input.TargetOrgMSP] = delete_List(committee.Members[sourceOrgMSP][idx].Writer_Votes[input.TargetOrgMSP], string_Hash(input.TargetUsername))
	}
	// evict users with insufficient votes
	committee, evicted_orgs := evict_users(committee)
	// delete protected info from all evicted orgs' protected databases and set protected info endorsement policy to all orgs
	orgsJSON, err := ctx.GetStub().GetState("Organizations")
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> get state organizations failed: %v", err)
	}
	if orgsJSON == nil {
		return fmt.Errorf("<Revoke_Vote_Access> organizations object does not exist")
	}
	var orgs Organizations
	err = json.Unmarshal(orgsJSON, &orgs)
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> unmarshal organizations failed: %v", err)
	}
	for _, targetOrgMSP := range evicted_orgs {
		collection := "protected_" + targetOrgMSP
		err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", orgs.OrgList)
		if err != nil {
			return fmt.Errorf("<Revoke_Vote_Access> set collection data endorsement policy failed: %v", err)
		}
		err = ctx.GetStub().DelPrivateData(collection, key+"_info")
		if err != nil {
			return fmt.Errorf("<Revoke_Vote_Access> delete private data protected info failed: %v", err)
		}
	}
	// set state-based endorsement policy of protected info and committee object to remaining organizations
	for _, targetOrgMSP := range committee.Orgs {
		collection := "protected_" + targetOrgMSP
		err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", committee.Orgs)
		if err != nil {
			return fmt.Errorf("<Revoke_Vote_Access> set collection data endorsement policy protected info failed: %v", err)
		}
	}
	err = set_Ledger_Data_Endorsement_Policy(ctx, key+"_committee", committee.Orgs)
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> set ledger data endorsement policy committee failed: %v", err)
	}
	committeeJSON, err := json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Revoke_Vote_Access> put state committee failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Join_Committee(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		Type           string `json:"Type"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Join_Committee> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Join_Committee> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Join_Committee> unmarshal input failed: %v", err)
	}
	// no access control
	// get submitter details
	key := string_Hash(input.Committee_Name)
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return fmt.Errorf("<Join_Committee> get submitter details failed: %v", err)
	}
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return fmt.Errorf("<Join_Committee> get state committee failed: %v", err)
	}
	if committeeJSON == nil {
		return fmt.Errorf("<Join_Committee> committee does not exist")
	}
	var committee Committee
	err = json.Unmarshal(committeeJSON, &committee)
	if err != nil {
		return fmt.Errorf("<Join_Committee> unmarshal committee failed: %v", err)
	}
	// check majority
	fmt.Printf("%s\n", sourceUsername)
	votes, total := count_votes(committee, sourceOrgMSP, string_Hash(sourceUsername), input.Type)
	if 2*votes <= total {
		return fmt.Errorf("<Join_Committee> insufficient votes to join committee")
	}
	// join committee
	if input.Type == "m" {
		var member Member
		member.H_Username = string_Hash(sourceUsername)
		member.RTBF_vote = false
		member.Member_votes = make(map[string][]string)
		member.Reader_Votes = make(map[string][]string)
		member.Writer_Votes = make(map[string][]string)
		member.Reader_Votes = committee.Readers
		member.Writer_Votes = committee.Writers
		// default votes - current members and self
		for targetOrgMSP, current_members := range committee.Members {
			for _, current_member := range current_members {
				member.Member_votes[targetOrgMSP] = insert_List(member.Member_votes[targetOrgMSP], current_member.H_Username)
			}
		}
		member.Member_votes[sourceOrgMSP] = insert_List(member.Member_votes[sourceOrgMSP], string_Hash(sourceUsername))
		committee.Members[sourceOrgMSP] = insert_Member(committee.Members[sourceOrgMSP], member)
	}
	if input.Type == "r" {
		committee.Readers[sourceOrgMSP] = insert_List(committee.Readers[sourceOrgMSP], string_Hash(sourceUsername))
	}
	if input.Type == "w" {
		committee.Writers[sourceOrgMSP] = insert_List(committee.Writers[sourceOrgMSP], string_Hash(sourceUsername))
	}
	if !find_List(committee.Orgs, sourceOrgMSP) {
		// first joinee from a new organization, so set state-based endorsement policies for protected info and committee
		committee.Orgs = insert_List(committee.Orgs, sourceOrgMSP)
		for _, targetOrgMSP := range committee.Orgs {
			if targetOrgMSP == sourceOrgMSP {
				continue // cannot set endorsement policy for private data of new joinee, because the default EP is ALL ORGS, but this transaction is only run on committee member peers
			}
			collection := "protected_" + targetOrgMSP
			err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", committee.Orgs)
			if err != nil {
				return fmt.Errorf("<Join_Committee> set collection data endorsement policy protected info failed: %v", err)
			}
		}
		err = set_Ledger_Data_Endorsement_Policy(ctx, key+"_committee", committee.Orgs)
		if err != nil {
			return fmt.Errorf("<Join_Committee> set ledger data endorsement policy committee failed: %v", err)
		}
	}
	committeeJSON, err = json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Join_Committee> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Join_Committee> put state committee failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Leave_Committee(ctx contractapi.TransactionContextInterface) error {
	type Input struct {
		Committee_Name string `json:"Committee_Name"`
		Type           string `json:"Type"`
	}
	// get transient input
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("<Leave_Committee> get transient failed: %v", err)
	}
	inputJSON, exists := transient["input"]
	if !exists {
		return fmt.Errorf("<Leave_Committee> input not passed")
	}
	var input Input
	err = json.Unmarshal(inputJSON, &input)
	if err != nil {
		return fmt.Errorf("<Leave_Committee> unmarshal input failed: %v", err)
	}
	// verify access control
	key := string_Hash(input.Committee_Name)
	access, committee, sourceOrgMSP, sourceUsername, err := verify_Protected_Access_Control(ctx, key, input.Type)
	if err != nil {
		return fmt.Errorf("<Leave_Committee> verify protected access control failed: %v", err)
	}
	if !access {
		return fmt.Errorf("<Leave_Committee> leave committee access denied")
	}
	// leave committee
	if input.Type == "m" {
		committee.Members[sourceOrgMSP] = delete_Member(committee.Members[sourceOrgMSP], string_Hash(sourceUsername))
	}
	if input.Type == "r" {
		committee.Readers[sourceOrgMSP] = delete_List(committee.Readers[sourceOrgMSP], string_Hash(sourceUsername))
	}
	if input.Type == "w" {
		committee.Writers[sourceOrgMSP] = delete_List(committee.Writers[sourceOrgMSP], string_Hash(sourceUsername))
	}
	// evict users with insufficient votes
	committee, evicted_orgs := evict_users(committee)
	// delete protected info from all evicted orgs' protected databases and set protected info endorsement policy to all orgs
	orgsJSON, err := ctx.GetStub().GetState("Organizations")
	if err != nil {
		return fmt.Errorf("<Leave_Committee> get state organizations failed: %v", err)
	}
	if orgsJSON == nil {
		return fmt.Errorf("<Leave_Committee> organizations object does not exist")
	}
	var orgs Organizations
	err = json.Unmarshal(orgsJSON, &orgs)
	if err != nil {
		return fmt.Errorf("<Leave_Committee> unmarshal organizations failed: %v", err)
	}
	for _, targetOrgMSP := range evicted_orgs {
		collection := "protected_" + targetOrgMSP
		err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", orgs.OrgList)
		if err != nil {
			return fmt.Errorf("<Leave_Committee> set collection data endorsement policy failed: %v", err)
		}
		err = ctx.GetStub().DelPrivateData(collection, key+"_info")
		if err != nil {
			return fmt.Errorf("<Leave_Committee> delete private data protected info failed: %v", err)
		}
	}
	// set state-based endorsement policy of protected info and committee object to remaining organizations
	for _, targetOrgMSP := range committee.Orgs {
		collection := "protected_" + targetOrgMSP
		err = set_Collection_Data_Endorsement_Policy(ctx, collection, key+"_info", committee.Orgs)
		if err != nil {
			return fmt.Errorf("<Leave_Committee> set collection data endorsement policy protected info failed: %v", err)
		}
	}
	err = set_Ledger_Data_Endorsement_Policy(ctx, key+"_committee", committee.Orgs)
	if err != nil {
		return fmt.Errorf("<Leave_Committee> set ledger data endorsement policy committee failed: %v", err)
	}
	committeeJSON, err := json.Marshal(committee)
	if err != nil {
		return fmt.Errorf("<Leave_Committee> marshal committee failed: %v", err)
	}
	err = ctx.GetStub().PutState(key+"_committee", committeeJSON)
	if err != nil {
		return fmt.Errorf("<Leave_Committee> put state committee failed: %v", err)
	}
	return nil
}
