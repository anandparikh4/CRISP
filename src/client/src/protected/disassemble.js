import { useState } from "react"

const Disassemble_Committee = (props) => {
    const makeRequest = props.makeRequest
    const [CommitteeName,setCommitteeName] = useState('')
    const [pending,setPending] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        setPending(true)
        const request = {
            method: "Disassemble_Committee",
            CommitteeName: CommitteeName
        }
        makeRequest(request)
        .then(response => {
            console.log(response)
            if(response["error"] != "") alert(response["error"])
            setPending(false)
        })
    }

    // return (
    //     <div className = "Disassemble_Committee">
    //         <p>Disassemble Committee</p>

    //         <form onSubmit={handleSubmit}>

    //             <label>CommitteeName</label>
    //             <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

    //             {!pending && <button>Disassemble Committee</button>}
    //             {pending && <button disabled>Please Wait...</button>}

    //         </form>

    //     </div>
    // )

    return(
<div className="container">
  <div className="row justify-content-center mt-5">
    <div className="col-md-6">
      <div className="bg-secondary p-3 text-center">
        <p className="m-0 text-white">Disassemble Committee</p>
      </div>
      <br />
      <form onSubmit={handleSubmit}>

        <div className="row mb-3">
          <label className="col-sm-3 col-form-label">Committee Name</label>
          <div className="col-sm-9">
            <input type="text" className="form-control" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required />
          </div>
        </div>

        {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Disassemble Committee</button>}
        {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
      </form>
    </div>
  </div>
</div>
    )
}

export default Disassemble_Committee;
