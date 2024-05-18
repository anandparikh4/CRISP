import { useState } from "react"
import axios from "axios"
import fileDownload from "js-file-download"

const Read_File = (props) => {
  const port = props.port
  const sourceOrg = props.sourceOrg
  const username = props.username
  const [CommitteeName, setCommitteeName] = useState('')
  const [filename, setFilename] = useState('')
  let [Version, setVersion] = useState('')
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    Version = +Version
    if (isNaN(Version) || Version <= 0) {
      alert("Please enter a positive integer version")
      return
    }
    setPending(true)
    axios.get("http://127.0.0.1:" + port + "/download", {
      responseType: "blob",
      params: {
        method: "Read_File",
        CommitteeName: CommitteeName,
        Version: Version,
        sourceOrgMSP: sourceOrg + "MSP",
        username: username
      }
    })
      .then(response => {
        console.log(response)
        fileDownload(response.data, filename)
        // logic to display downloaded file
        setPending(false)
      })
  }

  // return (
  //     <div className = "Read_File">
  //         <p>Read File</p>

  //         <form onSubmit={handleSubmit}>

  //             <label>Committee Name</label>
  //             <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

  //             <label>Version</label>
  //             <input value={Version} onChange={(e)=>setVersion(e.target.value)} required /><br/><br/>

  //             <label>Destination File Name</label>
  //             <input type="text" value={filename} onChange={(e)=>setFilename(e.target.value)} required /><br/><br/>

  //             {!pending && <button>Read File</button>}
  //             {pending && <button disabled>Please Wait...</button>}

  //         </form>

  //     </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Read File</p>
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
              <label className="col-sm-3 col-form-label">Version</label>
              <div className="col-sm-9">
                <input className="form-control" value={Version} onChange={(e) => setVersion(e.target.value)} required />
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label">Destination File Name</label>
              <div className="col-sm-9">
                <input type="text" className="form-control" value={filename} onChange={(e) => setFilename(e.target.value)} required />
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Read File</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Read_File;
