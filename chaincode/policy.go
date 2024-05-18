package main

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/pkg/statebased"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// verify access control for private data
func verify_Private_Access_Control(ctx contractapi.TransactionContextInterface, key string, manner string) (bool, Access_Control_List, string, string, error) {
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return false, Access_Control_List{}, "", "", fmt.Errorf("<verify_Private_Access_Control> get submitter details failed: %v", err)
	}
	var h_msp = byte_Hash([]byte(sourceOrgMSP))
	var h_username = string_Hash(sourceUsername)
	// fetch access control list
	aclJSON, err := ctx.GetStub().GetState(key + "_acl")
	if err != nil {
		return false, Access_Control_List{}, "", "", fmt.Errorf("<verify_Private_Access_Control> get state acl failed: %v", err)
	}
	if aclJSON == nil {
		return false, Access_Control_List{}, "", "", fmt.Errorf("<verify_Private_Access_Control> access control list does not exist")
	}
	var acl Access_Control_List
	err = json.Unmarshal(aclJSON, &acl)
	if err != nil {
		return false, Access_Control_List{}, "", "", fmt.Errorf("<verify_Private_Access_Control> unmarshal access control list failed: %v", err)
	}
	// owner
	if h_username == acl.H_Username && bytes.Equal(h_msp, acl.H_MSP) {
		return true, acl, sourceOrgMSP, sourceUsername, nil
	}
	// shared
	found := false
	if manner == "r" {
		found = find_List(acl.Read_Access_List[sourceOrgMSP], h_username)
	}
	if manner == "w" {
		found = find_List(acl.Write_Access_List[sourceOrgMSP], h_username)
	}
	return found, acl, "", "", nil
}

// verify access control for protected info
func verify_Protected_Access_Control(ctx contractapi.TransactionContextInterface, key string, manner string) (bool, Committee, string, string, error) {
	// get submitter details
	sourceOrgMSP, sourceUsername, err := get_Submitter_Details(ctx)
	if err != nil {
		return false, Committee{}, "", "", fmt.Errorf("<verify_Private_Access_Control> get submitter details failed: %v", err)
	}
	h_username := string_Hash(sourceUsername)
	// fetch committee object
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return false, Committee{}, "", "", fmt.Errorf("<verify_Protected_Access_Control> get state committee failed: %v", err)
	}
	if committeeJSON == nil {
		return false, Committee{}, "", "", fmt.Errorf("<verify_Protected_Access_Control> committee object does not exist")
	}
	var committee Committee
	err = json.Unmarshal(committeeJSON, &committee)
	if err != nil {
		return false, Committee{}, "", "", fmt.Errorf("<verify_Protected_Access_Control> unmarshal committee failed: %v", err)
	}
	found := false
	if manner == "m" { // member
		idx := find_Member(committee.Members[sourceOrgMSP], h_username)
		if idx != -1 {
			found = true
		}
	}
	if manner == "r" { // reader
		found = find_List(committee.Readers[sourceOrgMSP], h_username)
	}
	if manner == "w" { // writer
		found = find_List(committee.Writers[sourceOrgMSP], h_username)
	}
	if manner == "s" { // can only be true when a server invokes this for transaction purposes
		found = true
	}
	return found, committee, sourceOrgMSP, sourceUsername, nil
}

// set state-based endorsement policy for ledger state data
func set_Ledger_Data_Endorsement_Policy(ctx contractapi.TransactionContextInterface, id string, endorsers []string) error {
	endorsement_policy, err := statebased.NewStateEP(nil)
	if err != nil {
		return fmt.Errorf("<set_State_Data_Endorsement_Policy> create new state endorsement policy failed: %v", err)
	}
	err = endorsement_policy.AddOrgs(statebased.RoleTypePeer, endorsers...)
	if err != nil {
		return fmt.Errorf("<set_State_Data_Endorsement_Policy> add orgs to endorsement policy failed: %v", err)
	}
	policy, err := endorsement_policy.Policy()
	if err != nil {
		return fmt.Errorf("<set_State_Data_Endorsement_Policy> create policy from endorsement policy failed: %v", err)
	}
	err = ctx.GetStub().SetStateValidationParameter(id, policy)
	if err != nil {
		return fmt.Errorf("<set_State_Data_Endorsement_Policy> set state validation parameter failed: %v", err)
	}
	return nil
}

// set state-based endorsement policy for private data collection
func set_Collection_Data_Endorsement_Policy(ctx contractapi.TransactionContextInterface, collection string, id string, endorsers []string) error {
	endorsement_policy, err := statebased.NewStateEP(nil)
	if err != nil {
		return fmt.Errorf("<set_Collection_Data_Endorsement_Policy> create new state endorsement policy failed: %v", err)
	}
	err = endorsement_policy.AddOrgs(statebased.RoleTypePeer, endorsers...)
	if err != nil {
		return fmt.Errorf("<set_Collection_Data_Endorsement_Policy> add orgs to endorsement policy failed: %v", err)
	}
	policy, err := endorsement_policy.Policy()
	if err != nil {
		return fmt.Errorf("<set_Collection_Data_Endorsement_Policy> create policy from endorsement policy failed: %v", err)
	}
	err = ctx.GetStub().SetPrivateDataValidationParameter(collection, id, policy)
	if err != nil {
		return fmt.Errorf("<set_Collection_Data_Endorsement_Policy> set private data validation parameter failed: %v", err)
	}
	return nil
}

// check if MAJORITY on RTBF votes is achieved
func check_RTBF_Majority(Members map[string][]Member) bool {
	votes := 0
	total := 0
	for _, members := range Members {
		total += len(members)
		for _, member := range members {
			if member.RTBF_vote {
				votes += 1
			}
		}
	}
	return 2*votes > total
}

// check the last stable version, the minimum approved version, a version is called stable only when all organizations have approved it
func check_Stable(Approvals map[string]int) int {
	// stable = infinity
	stable := int((^uint(0)) >> 1)
	for _, version := range Approvals {
		if version < stable {
			stable = version
		}
	}
	return stable
}

// evict users with insufficient votes
func evict_users(committee Committee) (Committee, []string) {
	// list of orgs evicted completely (no members/readers/writers in committee after eviction)
	var evicted_orgs []string
	for _, OrgMSP := range committee.Orgs {
		evicted_orgs = insert_List(evicted_orgs, OrgMSP)
	}
	// first evict members
	evicted := true
	for evicted {
		evicted = false
		for OrgMSP, members := range committee.Members {
			for _, member := range members {
				votes, total := count_votes(committee, OrgMSP, member.H_Username, "m")
				if 2*votes < total {
					committee.Members[OrgMSP] = delete_Member(committee.Members[OrgMSP], member.H_Username)
					evicted = true
				}
			}
		}
		if !evicted {
			for OrgMSP, members := range committee.Members {
				if len(members) == 0 {
					committee.Orgs = delete_List(committee.Orgs, OrgMSP)
				} else {
					evicted_orgs = delete_List(evicted_orgs, OrgMSP)
				}
			}
		}
	}
	// then evict readers and writers
	for OrgMSP, readers := range committee.Readers {
		for _, reader := range readers {
			votes, total := count_votes(committee, OrgMSP, reader, "r")
			if 2*votes < total {
				committee.Readers[OrgMSP] = delete_List(committee.Readers[OrgMSP], reader)
			}
		}
		if len(readers) == 0 {
			committee.Orgs = delete_List(committee.Orgs, OrgMSP)
		} else {
			evicted_orgs = delete_List(evicted_orgs, OrgMSP)
		}
	}
	for OrgMSP, writers := range committee.Writers {
		for _, writer := range writers {
			votes, total := count_votes(committee, OrgMSP, writer, "w")
			if 2*votes < total {
				committee.Writers[OrgMSP] = delete_List(committee.Writers[OrgMSP], writer)
			}
		}
		if len(writers) == 0 {
			committee.Orgs = delete_List(committee.Orgs, OrgMSP)
		} else {
			evicted_orgs = delete_List(evicted_orgs, OrgMSP)
		}
	}
	return committee, evicted_orgs
}

// count votes for a particular manner of access for a given user
func count_votes(committee Committee, org string, h_username string, manner string) (int, int) {
	votes := 0
	total := 0
	if manner == "m" {
		for _, members := range committee.Members {
			for _, member := range members {
				total += 1
				if find_List(member.Member_votes[org], h_username) {
					votes += 1
				}
			}
		}
	}
	if manner == "r" {
		for _, members := range committee.Members {
			for _, member := range members {
				total += 1
				if find_List(member.Reader_Votes[org], h_username) {
					votes += 1
				}
			}
		}
	}
	if manner == "w" {
		fmt.Printf("%s\n", h_username)
		fmt.Printf("%d , %d\n", votes, total)
		for _, members := range committee.Members {
			for _, member := range members {
				total += 1
				if find_List(member.Writer_Votes[org], h_username) {
					votes += 1
				}
			}
		}
	}
	fmt.Printf("%s\n", manner)
	return votes, total
}

func rtbf_Mark(ctx contractapi.TransactionContextInterface, key string, org string) (bool, bool, error) {
	collection := "private_" + org
	recordJSON, err := ctx.GetStub().GetPrivateData(collection, key+"_record")
	if err != nil {
		return false, false, fmt.Errorf("<rtbf_Mark> get private data record failed: %v", err)
	}
	if recordJSON == nil {
		return false, false, nil
	}
	var record Private_Data
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return false, false, fmt.Errorf("<rtbf_Mark> unmarshal record failed: %v", err)
	}
	return record.RTBF, true, nil
}
