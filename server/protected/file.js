import { all_orgs , setEndorsingOrganizations , getEndorsingOrganizations , hasher , encrypt , decrypt , upload , download } from '../utils.js'
import { worker } from '../worker.js'

export async function Write_File(contract , params , path){
    let t1 = Date.now()
    const key = await encrypt(path , path+".enc")               // encrypt
    // console.log("ckpt1")
    const cid = await upload(path+".enc")                       // upload
    // console.log("ckpt2")
    const hash = await hasher(path)                             // hash
    // console.log(cid , key.toString("hex"))
    let t2 = Date.now()
    let response = {
        error: ""
    }
    let result
    try{
        params["TargetOrgMSP"] = params["sourceOrgMSP"]
        params["Version"] = "0"
        params["Server"] = true
        result = await Read_Protected_Info(contract , params)   // read
        // console.log(result)
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    try{
        params["Versions"] = result
        params["CID"] = cid
        params["Key"] = key.toString("hex")
        params["File_Hash"] = hash.toString("hex")
        result = await Write_Protected_Info(contract , params)  // write
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t3 = Date.now()
    console.log("Off-chain / On-chain write protected times: " , t2-t1 , " " , t3-t2)
    return response
}

export async function Read_File(contract , params){
    let t1 = Date.now()
    let response = {
        error: ""
    }
    let result
    try{
        params["TargetOrgMSP"] = params["sourceOrgMSP"]
        params["Server"] = false
        result = await Read_Protected_Info(contract , params)   // read
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    const secret = result[params["Version"]]
    // const cid = secret.slice(0 , secret.length-64)
    const key = Buffer.from(secret.slice(-64) , "hex")
    const src = `../database/${worker.org.toLowerCase()}/ipfs/${params["Version"]}.enc`
    const dst = `../database/${worker.org.toLowerCase()}/tmp/${worker.username}/${params["Version"]}.dec`
    await decrypt(src , dst , key)                              // decrypt
    response["path"] = dst
    let t3 = Date.now()
    console.log("Off-chain / On-chain read protected times: " , t3-t2 , " " , t2-t1)
    return response
}

export async function Check_File(contract , params){
    let t1 = Date.now()
    let response = {
        error: ""
    }
    let result
    let temp = params["Version"]
    try{
        params["Version"] = "0"
        params["TargetOrgMSP"] = params["sourceOrgMSP"]
        params["Server"] = true
        result = await Read_Protected_Info(contract , params)   // read
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t2 = Date.now()
    params["Version"] = temp
    const secret = result[params["Version"]]
    // console.log(secret)
    const cid = secret.slice(0 , secret.length-64)
    const key = Buffer.from(secret.slice(-64) , "hex")
    const src = `../database/${worker.org.toLowerCase()}/ipfs/${params["Version"]}.enc`
    const dst = `../database/${worker.org.toLowerCase()}/tmp/${worker.username}/${params["Version"]}.dec`
    // console.log(cid , key.toString("hex"))
    await download(cid , src)                                   // download
    await decrypt(src , dst , key)                              // decrypt
    const args = {
        Committee_Name: params["CommitteeName"],
        Version: params["Version"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let t3 = Date.now()
    try{
        var tx = contract.createTransaction("Verify_Version")   // verify
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        result = await tx.submit()
        result = result.toString()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t4 = Date.now()
    let hash = await hasher(dst)                                // hash
    hash = hash.toString("hex")
    if(hash != result){
        response["error"] = "On-chain hash does not match with off-chain hash"
        console.log(response["error"])
        return response
    }
    let t5 = Date.now()
    try{
        var tx = contract.createTransaction("Approve_Version")  // approve
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    let t6 = Date.now()
    console.log("Off-chain / on-chain check protected times: " , (t3-t2)+(t5-t4) , (t2-t1)+(t4-t3)+(t6-t5))
    return response
}

export async function Share_File(contract , params){
    let response = {
        error: ""
    }
    let result
    const temp = params["TargetOrgMSP"]                         // save this value to use later since it will be overwritten
    try{
        params["TargetOrgMSP"] = params["sourceOrgMSP"]
        params["Server"] = true
        result = await Read_Protected_Info(contract , params)   // read
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    params["TargetOrgMSP"] = temp
    const args = {
        Committee_Name: params["CommitteeName"],
        TargetOrgMSP: params["TargetOrgMSP"],
        Versions: result
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    try{                                                        // distribute
        var tx = contract.createTransaction("Distribute_Protected_Info")
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        result = await tx.submit()
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

async function Read_Protected_Info(contract , params){
    var tx = contract.createTransaction("Verify_Protected_Info")
    setEndorsingOrganizations(tx , all_orgs)
    var result = await tx.submit(params["CommitteeName"])
    const args = {
        Committee_Name: params["CommitteeName"],
        TargetOrgMSP: params["TargetOrgMSP"],
        Version: params["Version"],
        Server: params["Server"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    var tx = contract.createTransaction("Read_Protected_Info")
    setEndorsingOrganizations(tx , [params["OrgMSP"]])
    tx.setTransient(transientData)
    result = await tx.evaluate()
    result = JSON.parse(result.toString())
    return result["Versions"]
}

async function Write_Protected_Info(contract , params){
    const args = {
        Committee_Name: params["CommitteeName"],
        Versions: params["Versions"],
        CID: params["CID"],
        Key: params["Key"],
        File_Hash: params["File_Hash"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    var tx = contract.createTransaction("Write_Protected_Info")
    var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
    setEndorsingOrganizations(tx , endorsers)
    tx.setTransient(transientData)
    var result = await tx.submit()
    return result
}

export async function Allow_Protected_Info(contract , params){
    const args = {
        Committee_Name: params["CommitteeName"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    var tx = contract.createTransaction("Allow_Protected_Info")
    setEndorsingOrganizations(tx , all_orgs)
    tx.setTransient(transientData)
    var result = await tx.submit()
    return result
}
