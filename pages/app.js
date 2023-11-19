import React from 'react'
import { useState } from 'react';
import axios from 'axios';
function app() {
  const [file,setFile]=useState();
  const [us,setUs]=useState("initial");
  const [progress, setProgress] = useState(0);

  const handleSubmit=async(e)=>{
    e.preventDefault();
    try{
      const data = new FormData()
       data.append('file', file);
       setUs("progress");
     
      const res = await fetch('/api/mupload', {method:"POST",body:data,  onUploadProgress: (progressEvent) => {
        const percentage = (progressEvent.loaded / progressEvent.total) * 100;
        console.log(percentage);
        setProgress(percentage);
      }})
      
      setUs("initial");

      if (!res.ok) throw new Error();
    }
    catch(e){
      setUs("failed");
      console.log(e);
      throw new Error();
    }
  }

  return (<>{us==="progress"?<div>{progress}</div>:
    <div>
      <form onSubmit={(e)=>handleSubmit(e)}>
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0])}></input>
        <button type="submit">submit</button>
      </form>
      <div>{us}</div>
    </div>
}
    </>
  )
}

export default app