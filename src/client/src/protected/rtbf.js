import { useState } from "react"

const Protected_RTBF = (props) => {
    const makeRequest= props.makeRequest
    const [CommitteeName,setCommitteeName] = useState('')
    const [status,setStatus] = useState('')
    const [pending,setPending] = useState('')

    const handleVote = (e) => {
        e.preventDefault()
        setPending(true)
        const request = {
            method: "Vote_Protected_RTBF",
            CommitteeName: CommitteeName
        }
        makeRequest(request)
        .then(response => {
            console.log(response)
            if(response["error"] != "") alert(response["error"])
            setPending(false)
        })
    }

    const handleCheck = (e) => {
        e.preventDefault()
        setPending(true)
        const request = {
            method: "Check_Protected_RTBF",
            CommitteeName: CommitteeName
        }
        makeRequest(request)
        .then(response => {
            console.log(response)
            if(response["error"] != "") alert(response["error"])
            else{
                setStatus(response["rtbf"].toString())
                console.log(response["rtbf"])
            }
            setPending(false)
        })
    }

    // return (
    //     <div className = "Protected_RTBF">
    //         <p>Protected RTBF</p>

    //         <label>CommitteeName</label>
    //         <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

    //         <form onSubmit={handleVote}>

    //             {!pending && <button>Vote Protected RTBF</button>}
    //             {pending && <button disabled>Please Wait...</button>}

    //         </form>
    //         <br/>
    //         <form onSubmit={handleCheck}>

    //             {!pending && <button>Check Protected RTBF</button>}
    //             {pending && <button disabled>Please Wait...</button>}

    //         </form>

    //         <p>RTBF status: {status}</p>

    //     </div> 
    // )

    return(
        <div className="container">
        <div className="row justify-content-center mt-5">
            <div className="col-md-6">
            <div className="bg-secondary p-3 text-center">
                <p className="m-0 text-white">Protected RTBF</p>
            </div>
            <br />
            <form>
                <div className="row mb-3">
                <label className="col-sm-3 col-form-label">Committee Name</label>
                <div className="col-sm-9">
                    <input type="text" className="form-control" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required />
                </div>
                </div>
            </form>

            <form onSubmit={handleVote}>
                {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Vote Protected RTBF</button>}
                {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
            </form>
            <br/>

            <form onSubmit={handleCheck}>
                {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Check Protected RTBF</button>}
                {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
            </form>

            <p>RTBF status: {status}</p>

            </div>
        </div>
        </div>
    )
}

export default Protected_RTBF;
