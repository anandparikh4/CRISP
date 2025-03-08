import { useState } from "react"

const Private_RTBF = (props) => {
	const makeRequest = props.makeRequest
	const [Recordname,setRecordname] = useState('')
	const [pending,setPending] = useState(false)
	
	const handleSubmit = (e) => {
		e.preventDefault()
		setPending(true)
		const request = {
			method: "Private_RTBF",
			Recordname: Recordname
		}
		makeRequest(request)
		.then(response => {
			console.log(response)
			if(response["error"] !== "") alert(response["error"])
			setPending(false)
		})
	}

//   return (
//     <div className = "Private_RTBF">
//       <p>Exercise Private RTBF</p>

//       <form onSubmit={handleSubmit}>

//         <label>Recordname</label>
//         <input type="text" value={Recordname} onChange={(e)=>setRecordname(e.target.value)} required /><br/><br/>

//         {!pending && <button>Exercise Private RTBF</button>}
//         {pending && <button disabled>Please Wait...</button>}

//       </form>

//     </div>
//   );

	return (
		<div className="container">
		<div className="row justify-content-center mt-5">
			<div className="col-md-6">
			<div className="bg-secondary p-3 text-center">
				<p className="m-0 text-white">Exercise Private RTBF</p>
			</div>
			<br />
			<form onSubmit={handleSubmit}>

				<div className="row mb-3">
				<label className="col-sm-3 col-form-label">Recordname</label>
				<div className="col-sm-9">
					<input type="text" className="form-control" value={Recordname} onChange={(e)=>setRecordname(e.target.value)} required />
				</div>
				</div>

				{!pending && <button type="submit" className="btn btn-primary d-block mx-auto">Exercise Private RTBF</button>}
				{pending && <button type="submit" className="btn btn-primary d-block mx-auto" disabled>Please Wait...</button>}
			</form>
			</div>
		</div>
		</div>
	)
}

export default Private_RTBF;
