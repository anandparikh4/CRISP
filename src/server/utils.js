import * as crypto from "crypto"
import * as fs from "fs"
import * as zlib from "zlib"
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import * as stream from  'stream/promises'
import { CID } from 'multiformats/cid'
import { FsBlockstore } from 'blockstore-fs'

export let all_orgs = ["Org1MSP" , "Org2MSP" , "Org3MSP" , "Org4MSP" , "Org5MSP"]

function isEqual(a , b){
    const aSorted = a.slice().sort()
    const bSorted = b.slice().sort()
    let equal = 
        ((aSorted.length === bSorted.length) && aSorted.every(function(value, index) {
            return value === bSorted[index];
        }))
    // console.log("isEqual: " , equal)
    return equal
}

// stupidest code I've ever written, because I was too lazy to find a neat way to do this
export function setEndorsingOrganizations(tx , orgs){
    if(isEqual(orgs,["Org1MSP"])) tx.setEndorsingOrganizations("Org1MSP")
    
    if(isEqual(orgs,["Org2MSP"])) tx.setEndorsingOrganizations("Org2MSP")
    if(isEqual(orgs,["Org3MSP"])) tx.setEndorsingOrganizations("Org3MSP")
    if(isEqual(orgs,["Org4MSP"])) tx.setEndorsingOrganizations("Org4MSP")
    if(isEqual(orgs,["Org5MSP"])) tx.setEndorsingOrganizations("Org5MSP")

    if(isEqual(orgs,["Org1MSP","Org2MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP")
    if(isEqual(orgs,["Org1MSP","Org3MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org3MSP")
    if(isEqual(orgs,["Org1MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org4MSP")
    if(isEqual(orgs,["Org1MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org5MSP")
    if(isEqual(orgs,["Org2MSP","Org3MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org3MSP")
    if(isEqual(orgs,["Org2MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org4MSP")
    if(isEqual(orgs,["Org2MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org5MSP")
    if(isEqual(orgs,["Org3MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org3MSP","Org4MSP")
    if(isEqual(orgs,["Org3MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org3MSP","Org5MSP")
    if(isEqual(orgs,["Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org4MSP","Org5MSP")

    if(isEqual(orgs,["Org1MSP","Org2MSP","Org3MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org3MSP")
    if(isEqual(orgs,["Org1MSP","Org2MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org4MSP")
    if(isEqual(orgs,["Org1MSP","Org2MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org5MSP")
    if(isEqual(orgs,["Org1MSP","Org3MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org3MSP","Org4MSP")
    if(isEqual(orgs,["Org1MSP","Org3MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org3MSP","Org5MSP")
    if(isEqual(orgs,["Org1MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org4MSP","Org5MSP")
    if(isEqual(orgs,["Org2MSP","Org3MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org3MSP","Org4MSP")
    if(isEqual(orgs,["Org2MSP","Org3MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org3MSP","Org5MSP")
    if(isEqual(orgs,["Org2MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org4MSP","Org5MSP")
    if(isEqual(orgs,["Org3MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org3MSP","Org4MSP","Org5MSP")

    if(isEqual(orgs,["Org1MSP","Org2MSP","Org3MSP","Org4MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org3MSP","Org4MSP")
    if(isEqual(orgs,["Org1MSP","Org2MSP","Org3MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org3MSP","Org5MSP")
    if(isEqual(orgs,["Org1MSP","Org2MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org4MSP","Org5MSP")
    if(isEqual(orgs,["Org1MSP","Org3MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org3MSP","Org4MSP","Org5MSP")
    if(isEqual(orgs,["Org2MSP","Org3MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org2MSP","Org3MSP","Org4MSP","Org5MSP")

    if(isEqual(orgs,["Org1MSP","Org2MSP","Org3MSP","Org4MSP","Org5MSP"])) tx.setEndorsingOrganizations("Org1MSP","Org2MSP","Org3MSP","Org4MSP","Org5MSP")
}

export async function getEndorsingOrganizations(contract , id){
    let result = await contract.evaluateTransaction("Get_Endorsers" , id)
    result = result.toString()                          // string: ["Org1MSP","Org2MSP","Org3MSP"]
    result = result.substring(1, result.length-1)       // string: "Org1MSP","Org2MSP","Org3MSP"
    result = result.split(',')                          // array: ["Org1MSP","Org2MSP","Org3MSP"]
    for(let i = 0;i<result.length;i++){
        result[i] = result[i].substring(1,result[i].length-1)
    }
    return result
}

async function getCommitteePolicy(contract , CommitteeName){
    let result = await contract.evaluateTransaction("Get_Committee_Policy" , CommitteeName)
    result = result.toString()                          // string: ["Org1MSP","Org2MSP","Org3MSP"]
    result = result.substring(1, result.length-1)       // string: "Org1MSP","Org2MSP","Org3MSP"
    result = result.split(',')                          // array: ["Org1MSP","Org2MSP","Org3MSP"]
    for(let i = 0;i<result.length;i++){
        result[i] = result[i].substring(1,result[i].length-1)
    }
    return result
}

async function getInfoPolicy(contract , CommitteeName , TargetOrgMSP){
    let result = await contract.evaluateTransaction("Get_Info_Policy" , CommitteeName , TargetOrgMSP)
    result = result.toString()                          // string: ["Org1MSP","Org2MSP","Org3MSP"]
    result = result.substring(1, result.length-1)       // string: "Org1MSP","Org2MSP","Org3MSP"
    result = result.split(',')                          // array: ["Org1MSP","Org2MSP","Org3MSP"]
    for(let i = 0;i<result.length;i++){
        result[i] = result[i].substring(1,result[i].length-1)
    }
    return result
}

export async function getPolicies(contract , CommitteeName){
    console.log("Policies Start----------------------------")
    var endorsers = await getEndorsingOrganizations(contract , CommitteeName)
    console.log("Endorsers: " , endorsers)
    endorsers = await getCommitteePolicy(contract , CommitteeName)
    console.log("Committee Endorsers: " , endorsers)
    for(let org of all_orgs){
        endorsers = await getInfoPolicy(contract , CommitteeName , org)
        console.log(org , " Endorsers: " , endorsers)
    }
    console.log("Policies End------------------------------")
}

export async function encrypt(src , dst){
    const key = crypto.randomBytes(32)
    const iv = Buffer.alloc(16)
    const readStream = fs.createReadStream(src)
    const gzip = zlib.createGzip()
    const cipher = crypto.createCipheriv('aes256' , key , iv)
    const writeStream = fs.createWriteStream(dst)
    let stream = readStream
            .pipe(gzip)
            .pipe(cipher)
            .pipe(writeStream)
    await new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve()
        })})
    return key
}

export async function decrypt(src , dst , key){
    const iv = Buffer.alloc(16)
    const readStream = fs.createReadStream(src)
    const decipher = crypto.createDecipheriv('aes256' , key , iv)
    const unzip = zlib.createUnzip()
    const writeStream = fs.createWriteStream(dst)
    let stream = readStream
            .pipe(decipher)
            .pipe(unzip)
            .pipe(writeStream)
    await new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve()
        })})
}

export async function hasher(path){
    const readStream = fs.createReadStream(path)
    const hash = crypto.createHash('sha256')
    await stream.pipeline(readStream , hash)
    return hash.digest()
}

async function createNode(){
    const fsblockstore = new FsBlockstore("../database/node/")
    const helia = await createHelia({
        blockstore:fsblockstore
    })
    const node = unixfs(helia)
    return node
}

export async function upload(path){
    const node = await createNode()
    const readStream = fs.createReadStream(path)
    const cid = await node.addByteStream(readStream)
    return cid.toString()
}

export async function download(cid , path){
    const node = await createNode()
    const writeStream = fs.createWriteStream(path)
    for await (const chunk of node.cat(CID.parse(cid))){
        console.log(chunk)
        writeStream.write(chunk)
    }
}

// Testing
// let sizes = ["1KB" , "4KB" , "16KB" , "64KB" , "256KB" , "1MB" , "4MB" , "16MB" , "64MB" , "256MB" , "1GB"]
// const path = "./experiments/protected_"
// for(let size of sizes){
//     let file = path + size + ".txt"
//     const key = await encrypt(file , file + ".enc")
//     console.log(key)
// }
// const key = await encrypt(path , path+".enc")
// console.log(key)
// let cid = await upload(path)
// // const hash = await hasher(path)
// console.log("Sleep Started")
// await new Promise(resolve => setTimeout(resolve, 120000))
// console.log("Sleep Ended")
// let cid = CID.parse("bafkreidbn7hrkvococnzxcjmr4r33rsdbcgj7sam55cfeo3dm57q3g24ui")
// console.log("CID: ", cid)
// console.log(typeof(cid))
// await download(cid , path+".ipfs")
// // await decrypt(path+".ipfs" , path+".dec" , key)
// // console.log("Key: ", key.toString("hex"))
// // console.log(key.length)
// console.log("CID: ", cid)
// console.log(typeof(cid))
// console.log("Hash: ", hash.toString("hex"))
// let cid = await upload(path)
// let cid = "bafkreicdvn4xigqzvrkyaqaz6hbvk7b4u5lod7l2rj3q33vbykrt6uekcm"
// console.log(cid)
// await download(cid , path+".ipfs")
