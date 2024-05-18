import { useHistory } from 'react-router-dom'
import axios from 'axios'

const Navbar = (props) => {
    const history = useHistory()
    const handleLogout = props.handleLogout
    const username = props.username

    return ( 

        <div className = "Navbar">

            <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">CRISP</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav mr-auto">
                        <button type="button" className="btn btn-outline-success" key="Profile" onClick={() => {history.push('/profile')}}>{username}'s Home</button>
                    </div>
                    <div className="navbar-nav ms-auto">
                        <button type="button" className="btn btn-outline-danger" key="Logout" onClick={(e) => handleLogout(e)}>Logout</button>
                    </div>
                </div>
            </div>
            </nav>

            <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                {/* <a className="navbar-brand" href="#">CRISP</a> */}
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav mr-auto">
                        <a className="navbar-brand" href="#">Private Data Operations</a>
                    </div>

                    <div className="navbar-nav ms-auto">
                        <a className="navbar-brand" href="#">Protected Data Operations</a>
                    </div>
                </div>
            </div>
            </nav>

            <br/>

            {/* <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        
                    </div>
                    <div className="col-md-6">
                        <p className="text-end">Protected Data Operations</p>
                    </div>
                </div>
            </div> */}

            <div className="btn-group-vertical" role="group" aria-label="Vertical button group">
                <button type="button" className="btn btn-outline-dark" key="Construct_Access_Control_List" onClick={() => {history.push('/profile/construct_access_control_list')}}>Construct_Access_Control_List</button>
                <button type="button" className="btn btn-outline-dark" key="Destruct_Access_Control_List" onClick={() => {history.push('/profile/destruct_access_control_list')}}>Destruct_Access_Control_List</button>
                <button type="button" className="btn btn-outline-dark" key="Grant_Access_Control" onClick={() => {history.push('/profile/grant_access_control')}}>Grant_Access_Control</button>
                <button type="button" className="btn btn-outline-dark" key="Revoke_Access_Control" onClick={() => {history.push('/profile/revoke_access_control')}}>Revoke_Access_Control</button>
                <button type="button" className="btn btn-outline-dark" key="Write_Private_Data" onClick={() => {history.push('/profile/write_private_data')}}>Write_Private_Record</button>
                <button type="button" className="btn btn-outline-dark" key="Read_Private_Data" onClick={() => {history.push('/profile/read_private_data')}}>Read_Private_Record</button>
                <button type="button" className="btn btn-outline-dark" key="Private_RTBF" onClick={() => {history.push('/profile/private_rtbf')}}>Exercise_Private_RTBF</button>
            </div>

            <div className="btn-group-vertical float-end" role="group" aria-label="Vertical button group">
                <button type="button" className="btn btn-outline-dark float-end"key="Assemble_Committee" onClick={() => {history.push('/profile/assemble_committee')}}>Assemble_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Disassemble_Committee" onClick={() => {history.push('/profile/disassemble_committee')}}>Disassemble_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Grant_Vote_Access" onClick={() => {history.push('/profile/grant_vote_access')}}>Grant_Vote</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Revoke_Vote_Access" onClick={() => {history.push('/profile/revoke_vote_access')}}>Revoke_Vote</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Join_Committee" onClick={() => {history.push('/profile/join_committee')}}>Join_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Leave_Committee" onClick={() => {history.push('/profile/leave_committee')}}>Leave_Committee</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Write_File" onClick={() => {history.push('/profile/write_file')}}>Write_File</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Read_File" onClick={() => {history.push('/profile/read_file')}}>Read_File</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Check_File" onClick={() => {history.push('/profile/check_file')}}>Check_File</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Share_File" onClick={() => {history.push('/profile/share_file')}}>Share_File</button>
                <button type="button" className="btn btn-outline-dark float-end"key="Protected_RTBF" onClick={() => {history.push('/profile/protected_rtbf')}}>Vote/Test Protected_RTBF</button>
            </div>

        </div>

    );
}

export default Navbar;
