import React from 'react'
import { useState } from 'react';
function app() {
  const [file,setFile]=useState();
  const [us,setUs]=useState("initial");
  const handleSubmit=async(e)=>{
    e.preventDefault();
    try{
      const data = new FormData()
      data.set('file', file);
      setUs("progress");

      const res = await fetch('/api/handleUpload', {
        method: 'POST',
        body: data
      })
      setUs("initial");
      // console.log(res);
      if (!res.ok) throw new Error();
    }
    catch(e){
      setUs("failed");
      // console.log(e);
      throw new Error();
    }
  }

  return (
    <div>
      <form onSubmit={(e)=>handleSubmit(e)}>
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0])}></input>
        <button type="submit">submit</button>
      </form>
      <div>{us}</div>
    </div>
  )
}

export default app