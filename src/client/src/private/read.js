import { useState } from "react"

const Read_Private_Data = (props) => {
  const orgs = props.orgs
  const makeRequest = props.makeRequest
  const [Recordname, setRecordname] = useState('')
  const [TargetOrg, setTargetOrg] = useState('Select')
  const [TargetUsername, setTargetUsername] = useState('')
  const [pending, setPending] = useState('')
  const [Data, setData] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (TargetOrg == "Select") {
      alert("Please select an organization")
      return
    }
    setPending(true)
    const request = {
      method: "Read_Private_Data",
      Recordname: Recordname,
      TargetOrgMSP: TargetOrg + "MSP",
      TargetUsername: TargetUsername,
    }
    makeRequest(request)
      .then(response => {
        console.log(response)
        if (response["error"] !== "") alert(response["error"])
        else setData(response["Data"])
        setPending(false)
      })
  }

  // return (
  //   <div className="Read_Private_Data">
  //     <p>Read Private Data</p>

  //     <form onSubmit={handleSubmit}>

  //       <label>Recordname</label>
  //       <input type="text" value={Recordname} onChange={(e) => setRecordname(e.target.value)} required /><br /><br />

  //       <label>Username</label>
  //       <input type="text" value={TargetUsername} onChange={(e) => setTargetUsername(e.target.value)} required /><br /><br />

  //       <label>Organization</label>
  //       <select value={TargetOrg} onChange={(e) => setTargetOrg(e.target.value)} required>
  // <option value="Select" key="Select">Select</option>
  // {orgs.map((o) => (
  //   <option value={o.org} key={o.org}>{o.org}</option>
  // ))}
  //       </select><br /><br />

  //       {!pending && <button>Read Private Data</button>}
  //       {pending && <button disabled>Please Wait...</button>}

  //     </form>

  //     {Data && <div>{JSON.stringify(Data)}</div>}

  //   </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Read Private Data</p>
          </div>
          <br />
          <form onSubmit={handleSubmit}>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Recordname</label>
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

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Read Private Data</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>

          {Data && <div>{JSON.stringify(Data)}</div>}

        </div>
      </div>
    </div>
  )


}

export default Read_Private_Data
