"use client";
import React, { useState } from 'react'
import axios from 'axios'
import { BACKEND_URL } from '@/app/config'

const AuthSection = ({isSignUp}:{isSignUp:boolean}) => {
    const [name,setName] = useState("")
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const handleSignUp = async ()=>{
        const response = await axios.post(BACKEND_URL+"/signup",{name,email,password})
        console.log(response)
    }
    const handleLogin = async ()=>{
        const response = await axios.post(BACKEND_URL+"/login",{name,email,password})
        console.log(response)
    }
  return (
    <div className='flex flex-col gap-5 p-5 text-black'>
      <input type="text" placeholder='enter name' value={name} onChange={(e)=>setName(e.target.value)}/>
      <input type="text" placeholder='enter email' value={email} onChange={(e)=>setEmail(e.target.value)}/>
      <input type="text" placeholder='enter password' value={password} onChange={(e)=>setPassword(e.target.value)}/>
      <button className='text-white' onClick={()=>{isSignUp?handleSignUp():handleLogin()}}>{isSignUp?"SingUp":"Login"}</button>
    </div>
  )
}

export default AuthSection
