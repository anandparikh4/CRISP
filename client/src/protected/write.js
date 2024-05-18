import { useState } from "react"
import axios from 'axios'

const Write_File = (props) => {
  const port = props.port
  const sourceOrg = props.sourceOrg
  const username = props.username
  const [CommitteeName, setCommitteeName] = useState('')
  const [file, setFile] = useState(null)
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("method", "Write_File")
    formData.append("CommitteeName", CommitteeName)
    formData.append("sourceOrgMSP", sourceOrg + "MSP")
    formData.append("username", username)
    formData.append("file", file)
    setPending(true)
    axios.post("http://127.0.0.1:" + port + "/upload", formData)
      .then(response => {
        console.log(response)
        if (response["error"] != '') alert(response["error"])
        setPending(false)
      })
  }

  // return (
  //     <div className = "Write_File">
  //         <p>Write File</p>

  //         <form onSubmit={handleSubmit}>

  //             <label>Committee Name</label>
  //             <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

  //             <label>File</label>
  //             <input type="file" name="file" onChange={(e)=>setFile(e.target.files[0])} required /><br/><br/>

  //             {!pending && <button>Write File</button>}
  //             {pending && <button disabled>Please Wait...</button>}

  //         </form>

  //     </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Write File</p>
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
              <label className="col-sm-3 col-form-label">File</label>
              <div className="col-sm-9">
                <input type="file" name="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} required />
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Write File</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}<br/>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Write_File;
