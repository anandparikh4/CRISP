import { useState } from "react"

const Assemble_Committee = (props) => {
  const makeRequest = props.makeRequest
  const sourceOrg = props.sourceOrg
  const username = props.username
  const [CommitteeName, setCommitteeName] = useState('')
  let [Members, setMembers] = useState('')
  const [pending, setPending] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    Members = JSON.parse(Members)
    if (!Members[sourceOrg].includes(username)) alert("You must be a part of any committee you create")
    for (let org in Members) {
      if (Members.hasOwnProperty(org)) {
        Members[org + "MSP"] = Members[org]
        delete Members[org]
      }
    }
    console.log(Members)
    setPending(true)
    const request = {
      method: "Assemble_Committee",
      CommitteeName: CommitteeName,
      Members: Members
    }
    makeRequest(request)
      .then(response => {
        console.log(response)
        if (response["error"] != "") alert(response["error"])
        setPending(false)
      })
  }

  // return (
  //     <div className = "Assemble_Committee">
  //         <p>Assemble Committee</p>

  //         <form onSubmit={handleSubmit}>

  //             <label>Committee Name</label>
  //             <input type="text" value={CommitteeName} onChange={(e)=>setCommitteeName(e.target.value)} required /><br/><br/>

  //             <label>Members</label>
  //             <textarea value={Members} onChange={(e)=>setMembers(e.target.value)} required /><br/><br/>

  //             {!pending && <button>Assemble Committee</button>}
  //             {pending && <button disabled>Please Wait...</button>}

  //         </form>

  //     </div>
  // )

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6">
          <div className="bg-secondary p-3 text-center">
            <p className="m-0 text-white">Assemble Committee</p>
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
              <label className="col-sm-3 col-form-label">Members</label>
              <div className="col-sm-9">
                <textarea
                  className="form-control"
                  value={Members}
                  onChange={(e)=>setMembers(e.target.value)}
                  style={{
                    width: "120%", // Set width greater than the container
                    height: "200px", // Set a fixed height
                    resize: "both" // Allow both horizontal and vertical resizing
                  }}
                  required
                />
              </div>
            </div>

            {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Assemble Committee</button>}
            {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Assemble_Committee;
