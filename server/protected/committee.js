import { all_orgs , setEndorsingOrganizations , getEndorsingOrganizations, getPolicies } from '../utils.js'

export async function Assemble_Committee(contract , params){
    const args = {
        Committee_Name: params["CommitteeName"],
        Members: params["Members"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Assemble_Committee")
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        var result = await tx.submit()
        console.log("Assembled")
        await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

export async function Disassemble_Committee(contract , params){
    const args = {
        Committee_Name: params["CommitteeName"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Disassemble_Committee")
        setEndorsingOrganizations(tx , all_orgs)
        tx.setTransient(transientData)
        var result = await tx.submit()
        console.log("Disassembled")
        // await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

export async function Vote_Protected_RTBF(contract , params){
    const args = {
        Committee_Name: params["CommitteeName"]
    }
    const transientData = {
        input: Buffer.from(JSON.stringify(args))
    }
    let response = {
        error: ""
    }
    try{
        var tx = contract.createTransaction("Vote_Protected_RTBF")
        var endorsers = await getEndorsingOrganizations(contract , params["CommitteeName"])
        setEndorsingOrganizations(tx , endorsers)
        tx.setTransient(transientData)
        var result = await tx.submit()
        console.log("Voted RTBF")
        await getPolicies(contract , params["CommitteeName"])
    }
    catch(error){
        response["error"] = error.message
        console.log(error)
        return response
    }
    return response
}

export async function Check_Protected_RTBF(contract , params){
    let response = {
        error: ""
    }
    var result = false
    for(let org of all_orgs){
        const args = {
            Committee_Name: params["CommitteeName"],
            TargetOrgMSP: org
        }
        const transientData = {
            input: Buffer.from(JSON.stringify(args))
        }
        try{
            var tx = contract.createTransaction("Check_Protected_RTBF")
            setEndorsingOrganizations(tx , [org])
            tx.setTransient(transientData)
            result = await tx.evaluate()
            result = (result.toString() === "true")
            // await getPolicies(contract , params["CommitteeName"])
        }
        catch(error){
            response["error"] = error.message
            console.log(error)
            return response
        }
        if(!result){
            response["rtbf"] = false
            return response
        }
    }
    response["rtbf"] = true
    return response
}
