import { setEndorsingOrganizations , getEndorsingOrganizations , getPolicies} from '../utils.js'
import { Allow_Protected_Info } from './file.js'

export async function Grant_Vote_Access(contract , params, log){
    let t1 = Date.now()
    const args = {
        Committee_Name: params["CommitteeName"],
        TargetOrgMSP: params["TargetOrgMSP"],
        TargetUsername: params["TargetUsername"],
        Type: params["Type"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Grant_Vote_Access")
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        var result = await tx.submit()
        // console.log("Granted")
        // await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    if(log){
        console.log("Grant Vote time: " , t2-t1)
        return t2-t1
    }
    return response
}

export async function Revoke_Vote_Access(contract , params, log){
    let t1 = Date.now()
    const args = {
        Committee_Name: params["CommitteeName"],
        TargetOrgMSP: params["TargetOrgMSP"],
        TargetUsername: params["TargetUsername"],
        Type: params["Type"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Revoke_Vote_Access")
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        var result = await tx.submit()
        // console.log("Revoked")
        // await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    if(log){
        console.log("Revoke Vote time: " , t2-t1)
        return t2-t1
    }
    return response
}

export async function Join_Committee(contract , params, log = false){
    let t1 = Date.now()
    const args = {
        Committee_Name: params["CommitteeName"],
        Type: params["Type"],
        Log: log
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Join_Committee")
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        // setEndorsingOrganizations(tx , all_orgs)
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        var result = await tx.submit()
        // console.log("Joined")
        // await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    try{
        await Allow_Protected_Info(contract , params)
        // console.log("Allowed")
        // await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        // console.log(error)
        return response
    }
    let t2 = Date.now()
    if(log){
        console.log("Join Committee time: " , t2-t1)
        return t2-t1
    }
    return response    
}

export async function Leave_Committee(contract , params, log = false){
    let t1 = Date.now()
    const args = {
        Committee_Name: params["CommitteeName"],
        Type: params["Type"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Leave_Committee")
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        // setEndorsingOrganizations(tx , all_orgs)
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        var result = await tx.submit()
        console.log("Left")
        await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    if(log){
        console.log("Leave committee time: " , t2-t1)
        return t2-t1
    }
    return response
}
