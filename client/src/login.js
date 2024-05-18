import axios from 'axios'
import { useState } from "react"
import { useHistory } from 'react-router-dom'

const Login = (props) => {

/*
  const orgs = props.orgs
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [org,setOrg] = useState('Select')
  const history = useHistory()
  const [pending,setPending] = useState(false)
*/

  const orgs = props.orgs
  const username = props.username
  const setUsername = props.setUsername
  const org = props.sourceOrg
  const setOrg = props.setSourceOrg
  const setPort = props.setPort
  const history = useHistory()
  const [password,setPassword] = useState('')
  const [pending,setPending] = useState(false)

  async function login(params){
    const server = 20000 + 1000*(Number(params["org"].substr(params["org"].length-1))-1)
    const promise = axios.post("http://localhost:" + server + "/login" , params)
    const dataPromise = promise.then((response) => response.data)
    return dataPromise
  }

  async function handleLogin(e){
    e.preventDefault()
    if(org == "Select"){
      alert("Please select an organization")
      return
    }
    setPending(true)
    const request = {
      method: "Login",
      username: username,
      password: password,
      org: org
    }
    login(request)
    .then(response => {
    console.log(response)
    if(response["error"] != "") alert(response["error"])
    else{
        history.push('/profile')
        setPort(response["port"])
    }
    setPending(false)
    })
  }

  return (
    <div className="Login">

      <div className="card text-center">

        <div className="card-header">
          Login
        </div>
        <div className="card-body">
          <h5 className="card-title">Welcome to CRISP</h5>
          <p className="card-text">A Blockchain-based Secure Data Sharing Framework for <br/> Organizations empowering Users with the Right to be Forgotten</p>
        <div className="container">
          <div className="row justify-content-center mt-5">
            <div className="col-md-6">
              <form onSubmit={async(e) => {await handleLogin(e)}}>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label">Username</label>
                  <div className="col-sm-9">
                    <input type="text" className="form-control" placeholder="Enter Username" value={username} onChange={(e)=>setUsername(e.target.value)} required/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label">Password</label>
                  <div className="col-sm-9">
                    <input type="password" className="form-control" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label">Organization</label>
                  <div className="col-sm-9">
                    <select className="form-select" value={org} onChange={(e)=>setOrg(e.target.value)} required>
                      <option value="Select">Select</option>
                      {orgs.map((o) => (
                        <option value={o.org} key={o.org}>{o.org}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Login</button>}
                {pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
              </form>
            </div>
          </div>
        </div>

        </div>

        <div className="card-footer">
          <a href="/signup">Don't have an account? Create an account</a>
        </div>

      </div>

      {/* <h3>{process.env.REACT_APP_BACKEND_PORT}</h3> */}
    </div>
  );
}

export default Login;
