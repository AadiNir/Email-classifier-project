"use client"
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'

import axios from 'axios'
export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apikey,setapikey]=useState(""); 
  const [error,seterror]= useState(false);
  const [googleautho,setgoogleauth]=useState(false);

  useEffect(()=>{

    if(isLoggedIn){
      router.push('/emailclass')
    }else{
      console.log("please enter openai api key")
    }
  },[isLoggedIn])

  // const handleLoginSuccess = (credentialResponse:any) => {
  //   setIsLoggedIn(true);
  //   console.log(credentialResponse)
  // };

  const googleauth= async()=>{
    const response = await axios.get('http://localhost:3000/api/v1/emailclassifier/getemails');
    window.location.assign(response.data);
  }
useEffect(()=>{
  localStorage.removeItem('auth');
  let code = window.location.href;
  let url = new URL(code);
  let queryParams = url.searchParams.get('code'); 
  if(queryParams){
    localStorage.setItem('aut',queryParams);
    setgoogleauth(true);
  }
})
  const onFormSubmit=async ()=>{ 
      if (localStorage.getItem('aut')) {
        try{
          const resp = await axios.get(`http://localhost:3000/api/v1/emailclassifier/newoauthcallbacknew?code=${localStorage.getItem('aut')}`,
            { withCredentials: true });
          localStorage.setItem('username',resp.data.name)
          localStorage.setItem('userpic',resp.data.picture)
         

        }catch(err){
          console.log(err)
        }
      } else {
        seterror(true);
      }
      
      try{localStorage.setItem("openaikey", apikey); 
      }catch{
        seterror(true);
      }
      if(!error){
        setIsLoggedIn(true)
      }
      setapikey("") ;
    };
  

  return (
    <div className="flex flex-col justify-center items-center min-h-screen font-mono">
      {!googleautho ? (
        <button className=" p-5 border-4 border-gray-50 rounded-lg mb-4 hover:bg-white hover:text-slate-950 " onClick={googleauth}>Login with your Google account</button>
      ) : <button className=" p-5 border-4 border-gray-50 rounded-lg mb-4 hover:bg-white hover:text-slate-950 ">Logged In successfully</button>
    }
  
      <input 
        className=" text-gray-50 w-96 p-3 border-4 border-gray-50 bg-black mb-4 rounded m-3 " 
        placeholder="enter openAi Api key" 
        onChange={(e)=>{setapikey(e.target.value)}} 
        required 
      />
      <button 
        className=" bg-black text-white p-2 rounded w-36 hover:bg-white hover:text-slate-950 border-4 border-gray-50 m-3"
        onClick={onFormSubmit}
      >
        Log In
      </button>
    </div>
  );
  
}

