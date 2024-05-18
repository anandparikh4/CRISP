// node results.js 25000 "Org1" "admin1" "Ellie" "Ellie1"

// worker identity
export let worker = {
    port : Number(process.argv[2]),
    org : process.argv[3],
    adminpw : process.argv[4],
    username : process.argv[5],
    password : process.argv[6]
}

// import requirements
import * as fs from "fs"
import multer from "multer"
import * as crypto from "crypto"

// import local dependencies
import { initGateway } from "./setup.js"
import { Construct_Access_Control_List , Destruct_Access_Control_List , Grant_Access_Control , Revoke_Access_Control } from "./private/access.js"
import { Write_Private_Data , Read_Private_Data , Private_RTBF } from "./private/record.js"
import { Assemble_Committee , Disassemble_Committee , Vote_Protected_RTBF , Check_Protected_RTBF } from "./protected/committee.js"
import { Grant_Vote_Access , Revoke_Vote_Access , Join_Committee , Leave_Committee } from "./protected/action.js"
import { Write_File , Read_File , Check_File , Share_File } from "./protected/file.js"
import { sourceMapsEnabled } from "process"
import { join } from "path"

// globals
export let gateway = null
export let network = null
export let contract = null
export let tmpfiledir = null
export let storage = null
export let upload = null
const channel = "mychannel"
const chaincode = "chaincode"

// login as user
async function Login(org,OrgMSP,Username,needFiles = false){
    // get HLF stuff
    // console.log(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    gateway = await initGateway(org , OrgMSP , Username)
    // console.log("initGateway")
    network = await gateway.getNetwork(channel)
    // console.log("getNetwork")
    contract = await network.getContract(chaincode)
    // console.log("getContract")

    if(needFiles){
        // create a tmp directory for this user
        tmpfiledir = `../database/${worker.org.toLowerCase()}/tmp/${worker.username}`
        if (!fs.existsSync(tmpfiledir)) fs.mkdirSync(tmpfiledir)
        storage = multer.diskStorage({
            destination: function(req,file,cb){
                return cb(null, tmpfiledir)
            },
            filename: function (req,file,cb){
                return cb(null, `${Date.now()}_${file.originalname}`)
            }
        })
        upload = multer({storage})
    }

    return
}

await test_private_data()

/*
    None
*/
async function test_private_data(){
    await Login(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    let sizes = ["1KB","4KB","16KB","64KB","256KB","1MB"]
    let response

    let params = {
        Recordname: "record",
        TargetOrgMSP: "Org1MSP",
        TargetUsername: "Ellie",
        Data: {},
        sourceUsername: "Ellie",
        sourceOrgMSP: "Org1MSP"
    }
    for(let i in sizes){
        let path = "./experiments/" + "private_" + sizes[i] + ".json"
        let data = JSON.parse(fs.readFileSync(path))
        params["Data"] = data
        params["Recordname"] += sizes[i]
        console.log(sizes[i])
        response = await Write_Private_Data(contract , params)
        response = await Read_Private_Data(contract , params)
        await new Promise(resolve => setTimeout(resolve, 1000))     // sleep(1)
    }
    console.log("test_private_data done")
}

await test_protected_data()

/*
    Assemble a committee with a single user
    Add the member as reader and writer
*/
async function test_protected_data(){
    await Login(worker.org.toLowerCase() , worker.org+"MSP" , worker.username, true)
    // let sizes = ["1KB","4KB","16KB","64KB","256KB","1MB","4MB","16MB","64MB","256MB","1GB"]
    let sizes = ["1GB"]
    let response

    let params = {
        CommitteeName: "com",
        Version: "11",
        sourceOrgMSP: "Org1MSP",
        sourceUsername: "Ellie"
    }
    for(let i in sizes){
        console.log(sizes[i])
        let path = "./experiments/" + "protected_" + sizes[i] + ".txt"
        let v = Number(params["Version"])+1
        response = await Write_File(contract , params , path)
        await new Promise(resolve => setTimeout(resolve, 1000))     // sleep(1)

        // params["Version"] = v.toString()
        // response = await Check_File(contract , params)
        // await new Promise(resolve => setTimeout(resolve, 1000))     // sleep(1)

        // params["Version"] = v.toString()
        // response = await Read_File(contract , params)
        // await new Promise(resolve => setTimeout(resolve, 1000))     // sleep(1)   
    }
    console.log("test_protected_data done")
}

function mean(arr){
    let sum = 0
    for(let val of arr){
        sum += val
    }
    return sum / arr.length
}

function std(arr){
    let sum_sq = 0
    for(let val of arr){   
        sum_sq += val * val
    }
    let m = mean(arr)
    return Math.sqrt(Math.max(sum_sq / arr.length - m*m , 0))
}

await test_private_vote()

/*
    Create an access control list for a user
*/
async function test_private_vote(){
    await Login(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    let response

    let params = {
        method: "Grant_Access_Control",
        Recordname: "record",
        Manner: "",
        TargetOrgMSP: "",
        TargetUsername: "",
        sourceUsername: "Ellie",
        sourceOrgMSP: "Org1MSP"
    }

    let g_r_times = [], g_r_time = 0
    let r_r_times = [], r_r_time = 0
    let g_w_times = [], g_w_time = 0
    let r_w_times = [], r_w_time = 0
    for(let i=0;i<10;i++){
        params["TargetOrgMSP"] = "Org1MSP"
        params["TargetUsername"] = crypto.randomBytes(13).toString()

        params["Manner"] = "r"
        g_r_time = await Grant_Access_Control(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
        r_r_time = await Revoke_Access_Control(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
    
        params["Manner"] = "w"
        g_w_time = await Grant_Access_Control(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
        r_w_time = await Revoke_Access_Control(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)

        if(i>0){
            g_r_times.push(g_r_time)
            g_w_times.push(g_w_time)
            r_r_times.push(r_r_time)
            r_w_times.push(r_w_time)
        }
    }
    console.log("mean_grant_r: " , mean(g_r_times))
    console.log("std_grant_r: " , std(g_r_times))
    console.log("mean_grant_w: " , mean(g_w_times))
    console.log("std_grant_w: " , std(g_w_times))
    console.log("mean_revoke_r: " , mean(r_r_times))
    console.log("std_revoke_r: ", std(r_r_times))
    console.log("mean_revoke_w: ", mean(r_w_times))
    console.log("std_revoke_w: ", std(r_w_times))

    // for(let i=0;i<6;i++){
    //     console.log(i*20, " users")
    //     params["TargetOrgMSP"] = "Org1MSP"
    //     params["TargetUsername"] = crypto.randomBytes(13).toString()
        
    //     params["Manner"] = "r"
    //     response = await Grant_Access_Control(contract , params, true)
    //     await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
    //     response = await Revoke_Access_Control(contract , params, true)
    //     await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)

    //     params["Manner"] = "w"
    //     response = await Grant_Access_Control(contract , params, true)
    //     await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
    //     response = await Revoke_Access_Control(contract , params, true)
    //     await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)

    //     if(i<5) await add_private_users(1,20,"r",params)
    //     if(i<5) await add_private_users(1,20,"w",params)
    // }
    console.log("test_private_vote done")
}
// async function add_private_users(start, count, manner, params){
//     let response
//     params["Manner"] = manner
//     for(let i=0;i<count;i++){
//         start = (start+1)%5
//         if(start == 0) start = 5
//         params["TargetOrgMSP"] = "Org" + start.toString() + "MSP"
//         params["TargetUsername"] = crypto.randomBytes(13).toString("hex")
//         response = await Grant_Access_Control(contract , params)
//         await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
//         // console.log("----" , i)
//     }
// }

await test_protected_vote()

/*
    Assemble a committee with a single user
*/
async function test_protected_vote(){
    await Login(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    let response

    let params = {
        method: "Grant_Vote_Access",
        CommitteeName: "com",
        Type: "",
        TargetOrgMSP: "",
        TargetUsername: "",
        sourceUsername: "Ellie",
        sourceOrgMSP: "Org1MSP"
    }

    let g_r_times = [], g_r_time = 0
    let g_w_times = [], g_w_time = 0
    let g_m_times = [], g_m_time = 0
    let r_r_times = [], r_r_time = 0
    let r_w_times = [], r_w_time = 0
    let r_m_times = [], r_m_time = 0
    for(let i=0;i<10;i++){
        params["TargetOrgMSP"] = "Org1MSP"
        params["TargetUsername"] = crypto.randomBytes(13).toString("hex")

        params["Type"] = "r"
        g_r_time = await Grant_Vote_Access(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
        r_r_time = await Revoke_Vote_Access(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
    
        params["Type"] = "w"
        g_w_time = await Grant_Vote_Access(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
        r_w_time = await Revoke_Vote_Access(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
    
        params["Type"] = "m"
        g_m_time = await Grant_Vote_Access(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)
        r_m_time = await Revoke_Vote_Access(contract , params, true)
        await new Promise(resolve => setTimeout(resolve, 750))     // sleep(0.75)

        if(i > 0){
            g_r_times.push(g_r_time)
            g_w_times.push(g_w_time)
            g_m_times.push(g_m_time)
            r_r_times.push(r_r_time)
            r_w_times.push(r_w_time)
            r_m_times.push(r_m_time)
        }
    }
    console.log("mean_grant_r: ", mean(g_r_times))
    console.log("std_grant_r: ", std(g_r_times))
    console.log("mean_grant_w: ", mean(g_w_times))
    console.log("std_grant_w: ", std(g_w_times))
    console.log("mean_grant_m: ", mean(g_m_times))
    console.log("std_grant_m: ", std(g_m_times))
    console.log("mean_revoke_r: ", mean(r_r_times))
    console.log("std_revoke_r: ", std(r_r_times))
    console.log("mean_revoke_w: ", mean(r_w_times))
    console.log("std_revoke_w: ", std(r_w_times))
    console.log("mean_revoke_m: ", mean(r_m_times))
    console.log("std_revoke_m: ", std(r_m_times))
    
    console.log("test_protected_vote done")
}

// test_sizes()

/*
    Construct access control list for a single user
    Assemble a committee for a single user, vote for self as reader, writer and join as reader, writer
*/

async function test_sizes(){

    // // enrolling admins through dummy users
    // for(let i=1;i<=5;i++){
    //     let org = "org" + i.toString()
    //     let OrgMSP = "Org" + i.toString() + "MSP"
    //     let Username = "dummy" + i.toString()
    //     await Login(org , OrgMSP , Username)
    // }

    await Login(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    let response, params
    
    params = {
        method: "Grant_Access_Control",
        Recordname: "record",
        Manner: "",
        TargetOrgMSP: "",
        TargetUsername: "",
        sourceUsername: "Ellie",
        sourceOrgMSP: "Org1MSP"
    }
    // await add_private_users(params, 300, 30)

    await add_protected_users(100, 10)

    console.log("test_sizes done")
}

async function add_private_users(params, count, f){
    for(let i=0;i<count;i++){
        if(i%2) params["Manner"] = "w"
        else params["Manner"] = "r"
        let idx = 1 + i%5
        params["TargetOrgMSP"] = "Org" + idx.toString() + "MSP"
        params["TargetUsername"] = crypto.randomBytes(13).toString("hex")
        await Grant_Access_Control(contract , params, (i%f == f-1))
    }
}

async function add_protected_users(count, f){
    let list = ["Ellie"]
    for(let i=0;i<count-1;i++) list.push(crypto.randomBytes(13).toString("hex"))
    let curr = 1
    for(let i=0;i<count/f;i++){
        let x = f
        if(curr == 1) x = f-1
        await expand(curr,curr+f,list)
        console.log("Expansion " , i , " done")
        curr += f
    }
}

async function expand(m,n,list){
    // m guys vote for all roles for all of n-m
    // log the committee size when you join the nth guy
    // the kth of the n-m guys joins for all roles and votes for all roles of the other n-m-k
    let grant_params = {
        method: "Grant_Vote_Access",
        CommitteeName: "com",
        Type: "",
        TargetOrgMSP: "",
        TargetUsername: "",
        sourceUsername: "",
        sourceOrgMSP: ""
    }
    for(let i=0;i<m;i++){
        let idx = 1 + i%5
        let org = "org" + idx.toString()
        let OrgMSP = "Org" + idx.toString() + "MSP"
        let Username = list[i]
        await Login(org , OrgMSP , Username)
        grant_params["sourceOrgMSP"] = OrgMSP
        grant_params["sourceUsername"] = Username
        for(let j=m;j<n;j++){
            grant_params["TargetOrgMSP"] = "Org" + (1 + j%5).toString() + "MSP"
            grant_params["TargetUsername"] = list[j]

            grant_params["Type"] = "r"
            await Grant_Vote_Access(contract , grant_params)
            grant_params["Type"] = "w"
            await Grant_Vote_Access(contract , grant_params)
            grant_params["Type"] = "m"
            await Grant_Vote_Access(contract , grant_params)
        }
    }

    let join_params = {
        method: "Join_Committee",
        CommitteeName: "com",
        Type: "",
        sourceUsername: "",
        sourceOrgMSP: ""
    }
    for(let i=m;i<n;i++){
        let idx = 1 + i%5
        let org = "org" + idx.toString()
        let OrgMSP = "Org" + idx.toString() + "MSP"
        let Username = list[i]
        await Login(org , OrgMSP , Username)
        join_params["sourceOrgMSP"] = OrgMSP
        join_params["sourceUsername"] = Username
        
        join_params["Type"] = "r"
        await Join_Committee(contract , join_params)
        join_params["Type"] = "w"
        await Join_Committee(contract , join_params)
        join_params["Type"] = "m"
        await Join_Committee(contract , join_params , (i == n-1))

        grant_params["sourceOrgMSP"] = OrgMSP
        grant_params["sourceUsername"] = Username
        for(let j=i+1;j<n;j++){
            grant_params["TargetOrgMSP"] = "Org" + (1 + j%5).toString() + "MSP"
            grant_params["TargetUsername"] = list[j]

            grant_params["Type"] = "r"
            await Grant_Vote_Access(contract , grant_params)
            grant_params["Type"] = "w"
            await Grant_Vote_Access(contract , grant_params)
            grant_params["Type"] = "m"
            await Grant_Vote_Access(contract , grant_params)
        }
    }
}
