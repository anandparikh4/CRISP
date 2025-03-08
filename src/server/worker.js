// worker identity
export let worker = {
    port : process.argv[2],
    org : process.argv[3],
    adminpw : process.argv[4],
    username : process.argv[5],
    password : process.argv[6]
}

// import requirements
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import * as fs from "fs"
import multer from "multer"

// import local dependencies
import { initGateway } from "./setup.js"
import { Construct_Access_Control_List , Destruct_Access_Control_List , Grant_Access_Control , Revoke_Access_Control } from "./private/access.js"
import { Write_Private_Data , Read_Private_Data , Private_RTBF } from "./private/record.js"
import { Assemble_Committee , Disassemble_Committee , Vote_Protected_RTBF , Check_Protected_RTBF } from "./protected/committee.js"
import { Grant_Vote_Access , Revoke_Vote_Access , Join_Committee , Leave_Committee } from "./protected/action.js"
import { Write_File , Read_File , Check_File , Share_File } from "./protected/file.js"

// setup basics
const app = express()
app.use(cors());
app.use(bodyParser.json())

// work at port indicated in command line
app.listen(worker.port, console.log(`Worker started on port ${worker.port}`))

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
async function Login(){
    // get HFL stuff
    console.log(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    gateway = await initGateway(worker.org.toLowerCase() , worker.org+"MSP" , worker.username)
    console.log("initGateway")
    network = await gateway.getNetwork(channel)
    console.log("getNetwork")
    contract = await network.getContract(chaincode)
    console.log("getContract")

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

    return
}
await Login()

// file upload
app.post("/upload" , upload.single("file") , async function (req,res) {
    let response = {    // default response
        message: "",
        error: ""
    }
    let params = req.body
    console.log(params)
    console.log(req.file)   // req.file contains the file

    if(params["method"] == "Write_File"){
        response = await Write_File(contract , params , req.file.path)
    }
    // else ignore request

    console.log("Response: " , response)
    res.send(JSON.stringify(response))
})

// file download
app.get("/download" , async function (req,res) {
    let response = {    // default response
        message: "",
        error: ""
    }
    let params = req.query
    console.log(params)

    if(params["method"] == "Read_File"){
        response = await Read_File(contract , params)
    }
    // else ignore request

    if(response["error"] != ""){
        console.log("Response: " , response)
        res.send(JSON.stringify(response))
    }
    else res.download(response["path"])  // res.path contains the file path
})

// operations
app.post("/", async function (req,res) {
    let response = {    // default response
        message: "",
        error: ""
    }
    let params = req.body
    console.log(params)

    switch(params["method"]){
        case "Construct_Access_Control_List":
            response = await Construct_Access_Control_List(contract , params)
            break
        case "Destruct_Access_Control_List":
            response = await Destruct_Access_Control_List(contract , params)
            break
        case "Grant_Access_Control":
            response = await Grant_Access_Control(contract , params)
            break
        case "Revoke_Access_Control":
            response = await Revoke_Access_Control(contract , params)
            break
        case "Read_Private_Data":
            response = await Read_Private_Data(contract , params)
            break
        case "Write_Private_Data":
            response = await Write_Private_Data(contract , params)
            break
        case "Private_RTBF":
            response = await Private_RTBF(contract , params)
            break
        case "Assemble_Committee":
            response = await Assemble_Committee(contract , params)
            break
        case "Disassemble_Committee":
            response = await Disassemble_Committee(contract , params)
            break
        case "Vote_Protected_RTBF":
            response = await Vote_Protected_RTBF(contract , params)
            break
        case "Check_Protected_RTBF":
            response = await Check_Protected_RTBF(contract , params)
            break
        case "Grant_Vote_Access":
            response = await Grant_Vote_Access(contract , params)
            break
        case "Revoke_Vote_Access":
            response = await Revoke_Vote_Access(contract , params)
            break
        case "Join_Committee":
            response = await Join_Committee(contract , params)
            break
        case "Leave_Committee":
            response = await Leave_Committee(contract , params)
            break
        case "Check_File":
            response = await Check_File(contract , params)
            break
        case "Share_File":
            response = await Share_File(contract , params)
            break
        default:
            // do nothing
    }

    console.log("Response: " , response)
    res.send(JSON.stringify(response))
})

// logout
app.post("/logout", async function (req,res){
    let response = {
        message: "logged out",
        error: ""
    }
    console.log("Response: " , response)
    res.send(JSON.stringify(response))
    process.exit(0) // exit worker
})
