package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// smart contract
type Smart_Contract struct {
	contractapi.Contract
}

// {File_Id} = Hash(Committee_Name)
// initial version = 0

// Committee Object
// key : ID , value : Committee_Name, Orgs, Members, Readers, Writers, Hashes, Approvals, Latest, Stable
type Committee struct {
	ID             string              `json:"ID"`             // {File_Id}_committee
	Committee_Name string              `json:"Committee_Name"` // name of committee
	Orgs           []string            `json:"Orgs"`           // associated orgs
	Members        map[string][]Member `json:"Members"`        // orgmsp , members
	Readers        map[string][]string `json:"Readers"`        // orgmsp , readers
	Writers        map[string][]string `json:"Writers"`        // orgmsp , writers
	Hashes         map[int][]byte      `json:"Hashes"`         // version, file hash
	Approvals      map[string]int      `json:"Approvals"`      // orgmsp , latest approved version
	Latest         int                 `json:"Latest"`         // latest version
	Stable         int                 `json:"Stable"`         // last stable version
	History        []byte              `json:"History"`        // hash of complete protected info version history
	RTBF           bool                `json:"RTBF"`           // marked for RTBF
}
type Member struct {
	H_Username   string              `json:"H_Username"`   // hash of username
	RTBF_vote    bool                `json:"RTBF_vote"`    // true / false
	Member_votes map[string][]string `json:"Member_votes"` // orgmsp , hash of username
	Reader_Votes map[string][]string `json:"Reader_Votes"` // orgmsp , hash of username
	Writer_Votes map[string][]string `json:"Writer_Votes"` // orgmsp , hash of username
}

// all versions of IPFS CID and Encryption Key
// key : ID , value : Versions
type Protected_Info struct {
	ID       string         `json:"ID"`       // {File_Id}_info
	Versions map[int]string `json:"Versions"` // version , 512-bit concatenation of CID (256-bit MSB) and Key (256-bit LSB)
}

// {Record_Id} = Hash(Recordname + Username + OrgMSP)

// Access Control List
// key : ID , value : H_Username , H_MSP , Read_Access_List , Write_Access_List
type Access_Control_List struct {
	ID                string              `json:"ID"`                // {Record_Id}_acl
	H_Username        string              `json:"H_Username"`        // hash of owner username
	H_MSP             []byte              `json:"H_MSP"`             // hash of owner organization msp
	Read_Access_List  map[string][]string `json:"Read_Access_List"`  // orgmsp , hash of usernames
	Write_Access_List map[string][]string `json:"Write_Access_List"` // orgmsp , usernames
}

// Personal Data Record
// key : ID , value : Recordname , Username , MSP , Data
type Private_Data struct {
	ID         string            `json:"ID"`         // {Record_Id}_record
	Recordname string            `json:"Recordname"` // record name
	Username   string            `json:"Username"`   // owner username
	MSP        string            `json:"MSP"`        // owner organization msp
	Data       map[string]string `json:"Data"`       // key-value pairs
	RTBF       bool              `json:"RTBF"`       // marked for RTBF
}

// List of all organizations in the system
// key : "Organizations" , value : OrgList
type Organizations struct {
	OrgList []string `json:"OrgList"`
}

// main
func main() {
	chaincode, err := contractapi.NewChaincode(new(Smart_Contract))
	if err != nil {
		fmt.Printf("error creating chaincode: %v", err)
		return
	}
	err = chaincode.Start()
	if err != nil {
		fmt.Printf("error starting chaincode: %v", err)
		return
	}
}

func (s *Smart_Contract) Initialize(cxt contractapi.TransactionContextInterface) error {
	orgList := []string{"Org1MSP", "Org2MSP", "Org3MSP", "Org4MSP", "Org5MSP"}
	orgsJSON, err := cxt.GetStub().GetState("Organizations")
	if err != nil {
		return fmt.Errorf("<Initialize> get state organizations failed: %v", err)
	}
	if orgsJSON != nil {
		return fmt.Errorf("<Initialize> already initialized")
	}
	var orgs Organizations
	orgs.OrgList = orgList
	orgsJSON, err = json.Marshal(orgs)
	if err != nil {
		return fmt.Errorf("<Initialize> marshal organizations failed: %v", err)
	}
	err = cxt.GetStub().PutState("Organizations", orgsJSON)
	if err != nil {
		return fmt.Errorf("<Initialize> put state organizations failed: %v", err)
	}
	return nil
}

func (s *Smart_Contract) Query(cxt contractapi.TransactionContextInterface) ([]string, error) {
	orgsJSON, err := cxt.GetStub().GetState("Organizations")
	if err != nil {
		return []string{}, fmt.Errorf("<Query> get state organizations failed: %v", err)
	}
	if orgsJSON == nil {
		return []string{}, fmt.Errorf("<Query> not initialized")
	}
	var orgs Organizations
	err = json.Unmarshal(orgsJSON, &orgs)
	if err != nil {
		return []string{}, fmt.Errorf("<Query> unmarshal organizations failed: %v", err)
	}
	return orgs.OrgList, nil
}
