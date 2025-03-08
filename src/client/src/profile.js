import axios from 'axios'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Navbar from './navbar.js'
import { useHistory } from 'react-router-dom'
import Construct_Access_Control_List from './private/construct.js'
import Destruct_Access_Control_List from './private/destruct.js'
import Grant_Access_Control from './private/grant.js'
import Revoke_Access_Control from './private/revoke.js'
import Write_Private_Data from './private/write.js'
import Read_Private_Data from './private/read.js'
import Private_RTBF from './private/rtbf.js'
import Assemble_Committee from './protected/assemble.js'
import Disassemble_Committee from './protected/disassemble.js'
import Grant_Vote_Access from './protected/grant.js'
import Revoke_Vote_Access from './protected/revoke.js'
import Join_Committee from './protected/join.js'
import Leave_Committee from './protected/leave.js'
import Protected_RTBF from './protected/rtbf.js'
import Write_File from './protected/write.js'
import Check_File from './protected/check.js'
import Share_File from './protected/share.js'
import Read_File from './protected/read.js'

const Profile = (props) => {

  const history = useHistory()

  const makeRequest = props.makeRequest
  const orgs = props.orgs
  const username = props.username
  const sourceOrg = props.sourceOrg
  const port = props.port

  async function logout(params) {
    params["method"] = "Logout"
    const promise = axios.post("http://localhost:" + port, params)
    const dataPromise = promise.then((response) => response.data)
    return dataPromise
  }

  const handleLogout = (e) => {
    e.preventDefault()
    let request = {}
    logout(request)
      .then(response => {
        console.log(response)
        history.push('/')
      })
  }

  return (
    <div className="Profile">
      <Router>

        <Navbar handleLogout={handleLogout} username={username} />

        <div className="Pages">
          <Switch>

            <Route exact path = "/profile">
              <br/><h4>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Logged in as:</h4><br/><h4>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{username} from {sourceOrg}</h4>                    
            </Route>

            <Route exact path = "/profile/construct_access_control_list">
              <Construct_Access_Control_List makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/destruct_access_control_list">
              <Destruct_Access_Control_List makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/grant_access_control">
              <Grant_Access_Control orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/revoke_access_control">
              <Revoke_Access_Control orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/write_private_data">
              <Write_Private_Data orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/read_private_data">
              <Read_Private_Data orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/private_rtbf">
              <Private_RTBF makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/assemble_committee">
              <Assemble_Committee makeRequest={makeRequest} sourceOrg={sourceOrg} username={username} />
            </Route>

            <Route exact path = "/profile/disassemble_committee">
              <Disassemble_Committee makeRequest={makeRequest} />
            </Route>

            <Route exact path = "/profile/grant_vote_access">
              <Grant_Vote_Access orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/revoke_vote_access">
              <Revoke_Vote_Access orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/join_committee">
              <Join_Committee orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/leave_committee">
              <Leave_Committee orgs={orgs} makeRequest={makeRequest}/>
            </Route>

            <Route exact path = "/profile/protected_rtbf">
              <Protected_RTBF makeRequest={makeRequest} />
            </Route>

            <Route exact path = "/profile/write_file">
              <Write_File port={port} username={username} sourceOrg={sourceOrg} />
            </Route>

            <Route exact path = "/profile/check_file">
              <Check_File makeRequest={makeRequest} />
            </Route>

            <Route exact path = "/profile/share_file">
              <Share_File orgs={orgs} makeRequest={makeRequest} />
            </Route>

            <Route exact path = "/profile/read_file">
              <Read_File port={port} username={username} sourceOrg={sourceOrg} />
            </Route>

          </Switch>
        </div>

        {/* <div class="container-fluid">
          <div class="row">
            <div class="col-4">
              <div className="btn-group-vertical" role="group" aria-label="Vertical button group">
                <button type="button" className="btn btn-outline-dark" key="Construct_Access_Control_List" onClick={() => { history.push('/profile/construct_access_control_list') }}>Construct_Access_Control_List</button>
                <button type="button" className="btn btn-outline-dark" key="Destruct_Access_Control_List" onClick={() => { history.push('/profile/destruct_access_control_list') }}>Destruct_Access_Control_List</button>
                <button type="button" className="btn btn-outline-dark" key="Grant_Access_Control" onClick={() => { history.push('/profile/grant_access_control') }}>Grant_Access_Control</button>
                <button type="button" className="btn btn-outline-dark" key="Revoke_Access_Control" onClick={() => { history.push('/profile/revoke_access_control') }}>Revoke_Access_Control</button>
                <button type="button" className="btn btn-outline-dark" key="Write_Private_Data" onClick={() => { history.push('/profile/write_private_data') }}>Write_Private_Record</button>
                <button type="button" className="btn btn-outline-dark" key="Read_Private_Data" onClick={() => { history.push('/profile/read_private_data') }}>Read_Private_Record</button>
                <button type="button" className="btn btn-outline-dark" key="Private_RTBF" onClick={() => { history.push('/profile/private_rtbf') }}>Exercise_Private_RTBF</button>
              </div>
            </div>
            <div class="col-4">
              <div className="Pages">
                <Switch>

                  <Route exact path="/profile">
                    <h2>Logged in as: {username} from {sourceOrg}</h2>
                  </Route>

                  <Route exact path="/profile/construct_access_control_list">
                    <Construct_Access_Control_List makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/destruct_access_control_list">
                    <Destruct_Access_Control_List makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/grant_access_control">
                    <Grant_Access_Control orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/revoke_access_control">
                    <Revoke_Access_Control orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/write_private_data">
                    <Write_Private_Data orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/read_private_data">
                    <Read_Private_Data orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/private_rtbf">
                    <Private_RTBF makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/assemble_committee">
                    <Assemble_Committee makeRequest={makeRequest} sourceOrg={sourceOrg} username={username} />
                  </Route>

                  <Route exact path="/profile/disassemble_committee">
                    <Disassemble_Committee makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/grant_vote_access">
                    <Grant_Vote_Access orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/revoke_vote_access">
                    <Revoke_Vote_Access orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/join_committee">
                    <Join_Committee orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/leave_committee">
                    <Leave_Committee orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/protected_rtbf">
                    <Protected_RTBF makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/write_file">
                    <Write_File port={port} username={username} sourceOrg={sourceOrg} />
                  </Route>

                  <Route exact path="/profile/check_file">
                    <Check_File makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/share_file">
                    <Share_File orgs={orgs} makeRequest={makeRequest} />
                  </Route>

                  <Route exact path="/profile/read_file">
                    <Read_File port={port} username={username} sourceOrg={sourceOrg} />
                  </Route>

                </Switch>
              </div>
            </div>
            <div class="col-4">
              <div className="btn-group-vertical float-end" role="group" aria-label="Vertical button group">
                <button type="button" className="btn btn-outline-dark float-end" key="Assemble_Committee" onClick={() => { history.push('/profile/assemble_committee') }}>Assemble_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Disassemble_Committee" onClick={() => { history.push('/profile/disassemble_committee') }}>Disassemble_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Grant_Vote_Access" onClick={() => { history.push('/profile/grant_vote_access') }}>Grant_Vote</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Revoke_Vote_Access" onClick={() => { history.push('/profile/revoke_vote_access') }}>Revoke_Vote</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Join_Committee" onClick={() => { history.push('/profile/join_committee') }}>Join_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Leave_Committee" onClick={() => { history.push('/profile/leave_committee') }}>Leave_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Write_File" onClick={() => { history.push('/profile/write_file') }}>Write_File</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Read_File" onClick={() => { history.push('/profile/read_file') }}>Read_File</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Check_File" onClick={() => { history.push('/profile/check_file') }}>Check_File</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Share_File" onClick={() => { history.push('/profile/share_file') }}>Share_File</button>
                <button type="button" className="btn btn-outline-dark float-end" key="Protected_RTBF" onClick={() => { history.push('/profile/protected_rtbf') }}>Vote/Test Protected_RTBF</button>
              </div>
            </div>
          </div>
        </div> */}





      </Router>
    </div>
  )
}

export default Profile;
