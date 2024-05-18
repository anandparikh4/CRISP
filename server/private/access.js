import { all_orgs , setEndorsingOrganizations } from '../utils.js'

export async function Construct_Access_Control_List(contract , params){
    const args = {
        Recordname: params["Recordname"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Construct_Access_Control_List")
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        var result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

export async function Destruct_Access_Control_List(contract , params){
    const args = {
        Recordname: params["Recordname"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Destruct_Access_Control_List")
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        var result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

export async function Grant_Access_Control(contract , params, log = false){
    let t1 = Date.now()
    const args = {
        Recordname: params["Recordname"],
        Manner: params["Manner"],
        TargetOrgMSP: params["TargetOrgMSP"],
        TargetUsername: params["TargetUsername"],
        Log: log
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Grant_Access_Control")
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        var result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    if(log){
        console.log("Grant access time: " , t2-t1)
        return t2-t1
    }
    return response
}

export async function Revoke_Access_Control(contract , params, log = false){
    let t1 = Date.now()
    const args = {
        Recordname: params["Recordname"],
        Manner: params["Manner"],
        TargetOrgMSP: params["TargetOrgMSP"],
        TargetUsername: params["TargetUsername"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Revoke_Access_Control")
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        var result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    if(log){
        console.log("Revoke access time: " , t2-t1)
        return t2-t1
    }
    return response
}
