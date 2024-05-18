import { useState } from "react"

const Share_File = (props) => {
  const makeRequest = props.makeRequest
  const orgs = props.orgs
  const [CommitteeName, setCommitteeName] = useState('')
  const [TargetOrg, setTargetOrg] = useState("Select")
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (TargetOrg == "Select") {
      alert("Please select an organization")
      return
    }
    setPending(true)
    const request = {
      method: "Share_File",
      CommitteeName: CommitteeName,
      TargetOrgMSP: TargetOrg + "MSP"
    }
    makeRequest(request)
      .then(response => {
        console.log(response)
        if (response["error"] != "") alert(response["error"])
        setPending(false)
      })
  }

  // return (
  //     <div className = "Share_File">
  //         <p>Share File</p>

  //         <form onSubmit={handleSubmit}>

  //             <label>Committee Name</label>
  //             <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

  //             <label>Organization</label>
  //             <select value={TargetOrg} onChange={(e)=>setTargetOrg(e.target.value)} required>
  //                 <option value="Select" key="Select">Select</option>
  //                 {orgs.map((o) => (
  //                     <option value={o.org} key={o.org}>{o.org}</option>
  //                 ))}
  //             </select><br/><br/>

  //             {!pending && <button>Share File</button>}
  //             {pending && <button disabled>Please Wait...</button>}

  //         </form>

  //     </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Share File</p>
          </div>
          <br />
          <form onSubmit={handleSubmit}>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Committee Name</label>
              <div className="col-sm-9">
                <input type="text" className="form-control" value={CommitteeName} onChange={(e) => setCommitteeName(e.target.value)} required />
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Organization</label>
              <div className="col-sm-9">
                <select className="form-select" value={TargetOrg} onChange={(e) => setTargetOrg(e.target.value)} required>
                  <option value="Select" key="Select">Select</option>
                  {orgs.map((o) => (
                    <option value={o.org} key={o.org}>{o.org}</option>
                  ))}
                </select>
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Share File</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Share_File;
