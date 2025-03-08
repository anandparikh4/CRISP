import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import Login from './login.js'
import Signup from './signup.js'
import Profile from './profile.js'

const databaseEndpoint = "http://localhost:8000/Organizations"

const Base = () => {
  const [orgs, setOrgs] = useState(null)
  const [username, setUsername] = useState('')
  const [sourceOrg, setSourceOrg] = useState('Select')
  const [port, setPort] = useState(null)

  async function makeRequest(params){
    params["sourceUsername"] = username
    params["sourceOrgMSP"] = sourceOrg+"MSP"
    const promise = axios.post("http://localhost:" + port , params)
    const dataPromise = promise.then((response) => response.data)
    return dataPromise
  }

  useEffect(() => {
    fetch(databaseEndpoint)
      .then(res => {
        return res.json()
      })
      .then((data) => {
        setOrgs(data)
      })
  }, [])

  return (
    <Router>
      <div className="Base">
        <Switch>

          <Route path="/profile">
            {port && <Profile makeRequest={makeRequest} orgs={orgs} username={username} sourceOrg={sourceOrg} port={port}/>}
          </Route>

          <Route exact path="/signup">
            {orgs && <Signup orgs={orgs} />}
          </Route>

          <Route exact path="/">
            {orgs && <Login orgs={orgs} username={username} setUsername={setUsername} sourceOrg={sourceOrg} setSourceOrg={setSourceOrg} setPort={setPort} />}
          </Route>

        </Switch>
      </div>
    </Router>
  )
}

export default Base;
