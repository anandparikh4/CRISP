// server identity
let server = {
    port : Number(process.argv[2]),
    db : process.argv[3],
    org : process.argv[4],
    adminpw : process.argv[5],
    next : 0
}

// node server.js 24000 "db5" "Org5" "admin5" &

// import requirements
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import bcrypt from "bcrypt"
import { spawn } from "child_process"

// setup basics
const app = express()
app.use(cors());
app.use(bodyParser.json())

// connect to mongodb
await mongoose.connect("mongodb://127.0.0.1:27017/mydb")

// create user schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    h_password: {
        type: String,
        required: true
    }
})
// use db indicated in command line
const usermodel = mongoose.model(server.db , UserSchema)

// serve at port indicated in command line
app.listen(server.port, console.log(`Server started on port ${server.port}`))

// signup
app.post('/signup' , async function(req,res){
    let response = {"error":""}
    if(server.org != req.body["org"]){
        response["error"] = "incorrect server"
    }
    else{
        let user = await usermodel.findOne({username : req.body["username"]})   // find user
        if (user != null){  // if user exists, do not signup
            response["error"] = "username taken"
        }
        else{   // successful signup
            const salt = await bcrypt.genSalt(10)
            let h_password = await bcrypt.hash(req.body["password"] , salt)  // compute hash of password
            user = new usermodel({
                username: req.body["username"],
                h_password: h_password
            })
            await user.save()   // save user
            response["message"] = "success"
        }
    }
    console.log("Response: " , response)
    res.send(JSON.stringify(response))
})

// login
app.post('/login' , async function(req,res){
    let response = {"error": ""}
    if(server.org != req.body["org"]){
        response["error"] = "incorrect server"
    }
    else{
        let user = await usermodel.findOne({username : req.body["username"]})   // find user
        let match = false
        if(user != null){
            match = await bcrypt.compare(req.body["password"] , user.h_password)  // match password hashes
        }
        if(user == null || !match){      // invalid username or password
            response["error"] = "invalid credentials"
        }
        else{   // successful login
            server.next += 1
            let worker_port = server.port + server.next
            let worker = spawn('node' , ['worker.js' , worker_port, server.org , server.adminpw , req.body["username"] , req.body["password"]] , {
                detached: true,
                stdio: 'inherit'
            });
            worker.unref()
            response["message"] = "success"
            response["port"] = worker_port
        }
    }
    console.log("Response: " , response)
    res.send(JSON.stringify(response))
})
