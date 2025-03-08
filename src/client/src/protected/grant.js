import { useState } from "react"

const Grant_Vote_Access = (props) => {
  const orgs = props.orgs
  const makeRequest = props.makeRequest
  const [CommitteeName, setCommitteeName] = useState('')
  const [Type, setType] = useState('Select')
  const [TargetOrg, setTargetOrg] = useState('Select')
  const [TargetUsername, setTargetUsername] = useState('')
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (Type == "Select") alert("Please select access control type")
    if (TargetOrg == "Select") alert("Please select an organization")
    if (Type == "Select" || TargetOrg == "Select") return
    setPending(true)
    const request = {
      method: "Grant_Vote_Access",
      CommitteeName: CommitteeName,
      Type: Type,
      TargetOrgMSP: TargetOrg + "MSP",
      TargetUsername: TargetUsername
    }
    makeRequest(request)
      .then(response => {
        console.log(response)
        if (response["error"] != "") alert(response["error"])
        setPending(false)
      })
  }

  // return (  
  //     <div className="Grant Vote Access">
  //       <p>Grant Vote Access</p>

  //       <form onSubmit={handleSubmit}>

  // 	<label>Committee Name</label>
  //         <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

  //         <label>Username</label>
  //         <input type="text" value={TargetUsername} onChange={(e)=>setTargetUsername(e.target.value)} required /><br/><br/>

  //         <label>Organization</label>
  //         <select value={TargetOrg} onChange={(e)=>setTargetOrg(e.target.value)} required>
  //           <option value="Select" key="Select">Select</option>
  //           {orgs.map((o) => (
  //             <option value={o.org} key={o.org}>{o.org}</option>
  //           ))}
  //         </select><br/><br/>

  //         <label>Access Type</label>
  //         <select value={Type} onChange={(e)=>setType(e.target.value)} required>
  //           <option value="Select" key="Select">Select</option>
  //           <option value="r" key="Reader">Reader</option>
  //           <option value="w" key="Writer">Writer</option>
  //           <option value="m" key="Member">Member</option>
  //         </select><br/><br/>

  //         {!pending && <button>Grant Vote Access</button>}
  //         {pending && <button disabled>Please Wait...</button>}

  //       </form>

  //     </div>
  //   );

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Grant Vote Access</p>
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
              <label className="col-sm-3 col-form-label">Username</label>
              <div className="col-sm-9">
                <input type="text" className="form-control" value={TargetUsername} onChange={(e) => setTargetUsername(e.target.value)} required />
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Organization</label>
              <div className="col-sm-9">
                <select className="form-select" value={TargetOrg} onChange={(e)=>setTargetOrg(e.target.value)} required>
                  <option value="Select" key="Select">Select</option>
                  {orgs.map((o) => (
                    <option value={o.org} key={o.org}>{o.org}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Access Type</label>
              <div className="col-sm-9">
                <select className="form-select" value={Type} onChange={(e)=>setType(e.target.value)} required>
                  <option value="Select" key="Select">Select</option>
                  <option value="r" key="Reader">Reader</option>
                  <option value="w" key="Writer">Writer</option>
                  <option value="m" key="Member">Member</option>
                </select>
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Grant Vote Access</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>
        </div>
      </div>
    </div>
  )

}

export default Grant_Vote_Access;
