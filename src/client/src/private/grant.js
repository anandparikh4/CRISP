import { useState } from "react"

const Grant_Access_Control = (props) => {
  const orgs = props.orgs
  const makeRequest = props.makeRequest
  const [Recordname, setRecordname] = useState('')
  const [Manner, setManner] = useState('Select')
  const [TargetOrg, setTargetOrg] = useState('Select')
  const [TargetUsername, setTargetUsername] = useState('')
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (Manner == "Select") alert("Please select access control type")
    if (TargetOrg == "Select") alert("Please select an organization")
    if (Manner == "Select" || TargetOrg == "Select") return
    setPending(true)
    const request = {
      method: "Grant_Access_Control",
      Recordname: Recordname,
      Manner: Manner,
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
  //   <div className="Grant_Access_Control">
  //     <p>Grant Access Control</p>

  //     <form onSubmit={handleSubmit}>

  //       <label>Record</label>
  //       <input type="text" value={Recordname} onChange={(e) => setRecordname(e.target.value)} required /><br /><br />

  //       <label>Username</label>
  //       <input type="text" value={TargetUsername} onChange={(e) => setTargetUsername(e.target.value)} required /><br /><br />

  //       <label>Organization</label>
  //       <select value={TargetOrg} onChange={(e) => setTargetOrg(e.target.value)} required>
  //         <option value="Select" key="Select">Select</option>
  //         {orgs.map((o) => (
  //           <option value={o.org} key={o.org}>{o.org}</option>
  //         ))}
  //       </select><br /><br />

  //       <label>Access Type</label>
  //       <select value={Manner} onChange={(e) => setManner(e.target.value)} required>
  //         <option value="Select" key="Select">Select</option>
  //         <option value="r" key="Read">Read</option>
  //         <option value="w" key="Write">Write</option>
  //       </select><br /><br />

  //       {!pending && <button>Grant Access Control</button>}
  //       {pending && <button disabled>Please Wait...</button>}

  //     </form>

  //   </div>
  // );

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Grant Access Control</p>
          </div>
          <br />
          <form onSubmit={handleSubmit}>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Record</label>
              <div className="col-sm-9">
                <input type="text" className="form-control" value={Recordname} onChange={(e) => setRecordname(e.target.value)} required />
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
                <select className="form-select" value={TargetOrg} onChange={(e) => setTargetOrg(e.target.value)} required>
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
                <select className="form-select" value={Manner} onChange={(e) => setManner(e.target.value)} required>
                  <option value="Select" key="Select">Select</option>
                  <option value="r" key="Read">Read</option>
                  <option value="w" key="Write">Write</option>
                </select>
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Grant Access Control</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
            <br/>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Grant_Access_Control;
