import { useState } from "react"

const Check_File = (props) => {
  const makeRequest = props.makeRequest
  const [CommitteeName, setCommitteeName] = useState('')
  let [Version, setVersion] = useState('')
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    let v = +Version
    if (isNaN(v) || v <= 0) {
      alert("Please enter a positive integer version")
      return
    }
    setPending(true)
    const request = {
      method: "Check_File",
      CommitteeName: CommitteeName,
      Version: Version
    }
    makeRequest(request)
      .then(response => {
        console.log(response)
        if (response["error"] != "") alert(response["error"])
        setPending(false)
      })
  }

  // return (
  //     <div className = "Check_File">
  //         <p>Check File</p>

  //         <form onSubmit={handleSubmit}>

  //             <label>Committee Name</label>
  //             <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

  //             <label>Version</label>
  //             <input type="text" value={Version} onChange={(e)=>setVersion(e.target.value)} required /><br/><br/>

  //             {!pending && <button>Check File</button>}
  //             {pending && <button disabled>Please Wait...</button>}

  //         </form>

  //     </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Check File</p>
          </div>
          <br />
          <form onSubmit={handleSubmit}>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Committee Name</label>
              <div className="col-sm-9">
                <input type="text" className="form-control" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required />
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Version</label>
              <div className="col-sm-9">
                <input className="form-control" value={Version} onChange={(e)=>setVersion(e.target.value)} required />
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Check File</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Check_File;
