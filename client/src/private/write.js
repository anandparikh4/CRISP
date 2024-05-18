import { useState } from "react"

const Write_Private_Data = (props) => {
  const orgs = props.orgs
  const makeRequest = props.makeRequest
  const [Recordname, setRecordname] = useState('')
  const [TargetOrg, setTargetOrg] = useState('Select')
  const [TargetUsername, setTargetUsername] = useState('')
  const [pending, setPending] = useState('')
  let [Data, setData] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (TargetOrg == "Select") {
      alert("Please select an organization")
      return
    }
    Data = JSON.parse(Data)
    console.log(Data)
    setPending(true)
    const request = {
      method: "Write_Private_Data",
      Recordname: Recordname,
      TargetOrgMSP: TargetOrg + "MSP",
      TargetUsername: TargetUsername,
      Data: Data
    }
    makeRequest(request)
      .then(response => {
        console.log(response)
        if (response["error"] !== "") alert(response["error"])
        setPending(false)
      })
  }

  // const handleChange = (e) => {
  //   setData((curr) => ({
  //     ...curr,
  //     [e.target.name]: e.target.value,
  //   }));
  // };

  // return (
  //   <div className="Write_Private_Data">
  //     <p>Write Private Data</p>

  //     <form onSubmit={handleSubmit}>

  //       <label>Recordname</label>
  //       <input type="text" value={Recordname} onChange={(e) => setRecordname(e.target.value)} required /><br /><br />

  //       <label>Username</label>
  //       <input type="text" value={TargetUsername} onChange={(e) => setTargetUsername(e.target.value)} required /><br /><br />

  //       <label>Organization</label>
  //       <select value={TargetOrg} onChange={(e) => setTargetOrg(e.target.value)} required>
  //         <option value="Select" key="Select">Select</option>
  //         {
  //           orgs.map((o) => (
  //             <option value={o.org} key={o.org}>{o.org}</option>
  //           ))
  //         }
  //       </select><br /><br />

  //       <label>Data</label>
  //       <textarea value={Data} onChange={(e) => setData(e.target.value)} required /><br /><br />

  //       {!pending && <button>Write Private Data</button>}
  //       {pending && <button disabled>Please Wait...</button>}

  //     </form>

  //   </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Write Private Data</p>
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

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Datas</label>
              <div className="col-sm-9">
                <textarea
                  className="form-control"
                  value={Data}
                  onChange={(e) => setData(e.target.value)}
                  style={{
                    width: "120%", // Set width greater than the container
                    height: "200px", // Set a fixed height
                    resize: "both" // Allow both horizontal and vertical resizing
                  }}
                  required
                />
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Write Private Data</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>
          <br/>
        </div>
      </div>
    </div>
  )
}

export default Write_Private_Data
