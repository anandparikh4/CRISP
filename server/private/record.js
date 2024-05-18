import { all_orgs , setEndorsingOrganizations } from '../utils.js'

export async function Write_Private_Data(contract , params){
    let t1 = Date.now()
    const args = {
        Recordname: params["Recordname"],
        TargetOrgMSP: params["TargetOrgMSP"],
        TargetUsername: params["TargetUsername"],
        Data: params["Data"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    let t2 = Date.now()
    try{
        var tx = contract.createTransaction("Write_Private_Data")
        setEndorsingOrganizations(tx , [params["TargetOrgMSP"]])
        tx.setTransient(transientData)
        var result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t3 = Date.now()
    console.log("Off-chain / On-chain write private times: ", t2-t1, " ", t3-t2)
    return response
}

export async function Read_Private_Data(contract , params){
    let t1 = Date.now()
    const args = {
        Recordname: params["Recordname"],
        TargetOrgMSP: params["TargetOrgMSP"],
        TargetUsername: params["TargetUsername"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    let t2 = Date.now()
    try{
        var tx = contract.createTransaction("Verify_Private_Data")
        tx.setTransient(transientData)
        setEndorsingOrganizations(tx , all_orgs)
        let result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    try{
        var tx = contract.createTransaction("Read_Private_Data")
        tx.setTransient(transientData)
        let result = await tx.evaluate()
        result = JSON.parse(result.toString())
        response["Data"] = result["Data"]
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t3 = Date.now()
    console.log("Off-chain / On-chain read private times: ", t2-t1, " ", t3-t2)
    return response
}

export async function Private_RTBF(contract , params){
    let response = {
        error: ""
    }
    try{
        await Mark_Private_RTBF(contract , params)
        console.log("Marked")
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    try{
        await Exercise_Private_RTBF(contract , params)
        console.log("Exercised")
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

async function Mark_Private_RTBF(contract , params){
    const args = {
        Recordname: params["Recordname"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    var tx = contract.createTransaction("Mark_Private_RTBF")
    setEndorsingOrganizations(tx , [params["sourceOrgMSP"]])
    tx.setTransient(transientData)
    var result = await tx.submit()
}

async function Exercise_Private_RTBF(contract , params){
    const args = {
        Recordname: params["Recordname"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    var tx = contract.createTransaction("Exercise_Private_RTBF")
    setEndorsingOrganizations(tx , all_orgs)
    tx.setTransient(transientData)
    var result = await tx.submit()
}
