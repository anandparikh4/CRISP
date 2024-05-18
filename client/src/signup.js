import axios from 'axios'
import { useState } from 'react'

const Signup = (props) => {
  const orgs = props.orgs
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [org,setOrg] = useState('Select')
  const [pending,setPending] = useState(false)

  async function signup(params){
    const server = 20000 + 1000*(Number(params["org"].substr(params["org"].length-1))-1)
    const promise = axios.post("http://127.0.0.1:" + server + "/signup" , params)
    const dataPromise = promise.then((response) => response.data)
    return dataPromise
  }

  async function handleSignup(e){
    e.preventDefault()
    setPending(true)
    const request = {
      method: "Signup",
      username: username,
      password: password,
      org: org
    }
    signup(request)
     .then(response => {
     console.log(response)
     if(response["error"] !== "") alert(response["error"])
     setPending(false)
    })
  }

  return (

  <div className="Signup">

    <div className="card text-center">

      <div className="card-header">
        Sign Up
      </div>
      <div className="card-body">
        <h5 className="card-title">Welcome to CRISP</h5>
        <p className="card-text">A blockchain-based secure data sharing platform for organizations empowering users with the Right To Be Forgotten</p>

      <div class="container">
        <div class="row justify-content-center mt-5">
          <div class="col-md-6">
            <form onSubmit={async(e) => {await handleSignup(e)}}>

              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Username</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" placeholder="Enter Username" value={username} onChange={(e)=>setUsername(e.target.value)} required/>
                </div>
              </div>

              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Password</label>
                <div class="col-sm-9">
                  <input type="password" class="form-control" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
                </div>
              </div>

              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Organization</label>
                <div class="col-sm-9">
                  <select class="form-select" value={org} onChange={(e)=>setOrg(e.target.value)} required>
                    <option value="Select">Select</option>
                    {orgs.map((o) => (
                      <option value={o.org} key={o.org}>{o.org}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!pending && <button type="submit" class="btn btn-primary d-block mx-auto">Sign Up</button>}
              {pending && <button type="submit" class="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
            </form>
          </div>
        </div>
      </div>

      </div>

      <div className="card-footer">
        <a href="/">Go back to Login Page</a>
      </div>

    </div>

    {/* <h3>{process.env.REACT_APP_BACKEND_PORT}</h3> */}
  </div>

  );
}

export default Signup;
