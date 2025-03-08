package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/pkg/statebased"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// fetch the list of endorsers for a committee object for the server to set endorsers
func (s *Smart_Contract) Get_Endorsers(ctx contractapi.TransactionContextInterface, Committee_Name string) ([]string, error) {
	key := string_Hash(Committee_Name)
	committeeJSON, err := ctx.GetStub().GetState(key + "_committee")
	if err != nil {
		return []string{}, fmt.Errorf("<get_Endorsers> get state committee failed: %v", err)
	}
	if committeeJSON == nil {
		return []string{}, fmt.Errorf("<get_Endorsers> committee does not exit")
	}
	var committee Committee
	err = json.Unmarshal(committeeJSON, &committee)
	if err != nil {
		return []string{}, fmt.Errorf("<get_Endorsers> unmarshal committee failed: %v", err)
	}
	return committee.Orgs, nil
}

func (s *Smart_Contract) Get_Committee_Policy(ctx contractapi.TransactionContextInterface, Committee_Name string) ([]string, error) {
	key := string_Hash(Committee_Name)
	policy, err := ctx.GetStub().GetStateValidationParameter(key + "_committee")
	if err != nil {
		return []string{}, fmt.Errorf("Get_Committee_Policy get state validation parameter failed: %v", err)
	}
	endorsement_policy, err := statebased.NewStateEP(policy)
	if err != nil {
		return []string{}, fmt.Errorf("<Get_Committee_Policy> create new state endorsement policy failed: %v", err)
	}
	return endorsement_policy.ListOrgs(), nil
}

func (s *Smart_Contract) Get_Info_Policy(ctx contractapi.TransactionContextInterface, Committee_Name string, TargetOrgMSP string) ([]string, error) {
	key := string_Hash(Committee_Name)
	collection := "protected_" + TargetOrgMSP
	policy, err := ctx.GetStub().GetPrivateDataValidationParameter(collection, key+"_info")
	if err != nil {
		return []string{}, fmt.Errorf("<Get_Committee_Policy> get private data validation parameter failed: %v", err)
	}
	endorsement_policy, err := statebased.NewStateEP(policy)
	if err != nil {
		return []string{}, fmt.Errorf("<Get_Committee_Policy> create new state endorsement policy failed: %v", err)
	}
	return endorsement_policy.ListOrgs(), nil
}

// sha-256 hash
func string_Hash(s string) string {
	hasher := sha256.New()
	hasher.Write([]byte(s))
	return hex.EncodeToString(hasher.Sum(nil))
}
func byte_Hash(b []byte) []byte {
	hasher := sha256.New()
	hasher.Write(b)
	return hasher.Sum(nil)
}

// get OrgMSP and username of source
func get_Submitter_Details(ctx contractapi.TransactionContextInterface) (string, string, error) {
	sourceOrgMSP, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return "", "", fmt.Errorf("<get_Submitter_Details> get client mspid failed: %v", err)
	}
	sourceUsername, exists, err := ctx.GetClientIdentity().GetAttributeValue("username")
	if err != nil {
		return "", "", fmt.Errorf("<get_Submitter_Details> get attribute username failed: %v", err)
	}
	if !exists {
		return "", "", fmt.Errorf("<get_Submitter_Details> username not defined")
	}
	return sourceOrgMSP, sourceUsername, nil
}

// insert to list
func insert_List(list []string, element string) []string {
	found := false
	for _, val := range list {
		if val == element {
			found = true
			break
		}
	}
	if !found {
		list = append(list, element)
	}
	return list
}
func insert_Member(list []Member, member Member) []Member {
	found := false
	for _, val := range list {
		if val.H_Username == member.H_Username {
			found = true
			break
		}
	}
	if !found {
		list = append(list, member)
	}
	return list
}

// delete from list
func delete_List(list []string, element string) []string {
	found := -1
	for idx, val := range list {
		if val == element {
			found = idx
			break
		}
	}
	if found != -1 {
		list = append(list[:found], list[found+1:]...)
	}
	return list
}
func delete_Member(list []Member, h_username string) []Member {
	found := -1
	for idx, val := range list {
		if val.H_Username == h_username {
			found = idx
			break
		}
	}
	if found != -1 {
		list = append(list[:found], list[found+1:]...)
	}
	return list
}

// find in list
func find_List(list []string, element string) bool {
	found := false
	for _, val := range list {
		if val == element {
			found = true
			break
		}
	}
	return found
}
func find_Member(list []Member, h_username string) int {
	for idx, val := range list {
		if val.H_Username == h_username {
			return idx
		}
	}
	return -1
}

// erase protected info from all target peers' protected databases
// func erase_Protected_Info(ctx contractapi.TransactionContextInterface, key string, peers []string) error {
// 	for _, targetOrgMSP := range peers {
// 		collection := "protected_" + targetOrgMSP
// 		err := ctx.GetStub().DelPrivateData(collection, key+"_info")
// 		if err != nil {
// 			return fmt.Errorf("<erase_Protected_Info> delete private data protected info failed: %v", err)
// 		}
// 	}
// 	return nil
// }

/*
// Hashed Server Secrets
// key : "secrets" , value : Secrets
type Secrets struct {
	Hashes map[string][]byte `json:"Hashes"` // organization msp , hash of server secret
}

// save hash of server secret
func (s *Smart_Contract) Save_Secret_Hash(ctx contractapi.TransactionContextInterface, hash []byte) error {
	OrgMSP, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("<Save_Secret_Hash> get client mspid failed: %v", err)
	}
	_, exists, err := cid.GetAttributeValue(ctx.GetStub(), "ClientID")
	if err != nil {
		return fmt.Errorf("<Save_Secret_Hash> get attribute clientid failed: %v", err)
	}
	if exists {
		return fmt.Errorf("<Save_Secret_Hash> permission denied: only admins allowed to set secret hash")
	}
	var secrets Secrets
	secretsJSON, err := ctx.GetStub().GetState("secrets")
	if err != nil {
		return fmt.Errorf("<Save_Secret_Hash> get state secrets failed: %v", err)
	}
	if secretsJSON != nil {
		err := json.Unmarshal(secretsJSON, &secrets)
		if err != nil {
			return fmt.Errorf("<Save_Secret_Hash> unmarshal secrets failed: %v", err)
		}
	}
	secrets.Hashes[OrgMSP] = hash
	secretsJSON, err = json.Marshal(secrets)
	if err != nil {
		return fmt.Errorf("<Save_Secret_Hash> marshal secrets failed: %v", err)
	}
	err = ctx.GetStub().PutState("secrets", secretsJSON)
	if err != nil {
		return fmt.Errorf("<Save_Secret_Hash> put state secrets failed: %v", err)
	}
	return nil
}
*/
