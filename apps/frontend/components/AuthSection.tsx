"use client";
import React, { useState } from 'react'
import axios from 'axios'
import { BACKEND_URL } from '@/app/config'
import { useAuth } from '@/app/auth/verify/index';
import { useRouter } from 'next/navigation';


const AuthSection = ({isSignUp}:{isSignUp:boolean}) => {
    const [name,setName] = useState("")
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const {token,setToken,setUserId,username,setUsername} = useAuth()
    const router = useRouter()
    const handleSignUp = async ()=>{
        const response = await axios.post(BACKEND_URL+"/signup",{name,email,password})
        console.log(response)
    }
    const handleLogin = async ()=>{
        const response = await axios.post(BACKEND_URL+"/login",{name,email,password})
        setToken(response.data.token)
        setUserId(response.data.userId)
        setUsername(response.data.name)
        console.log(token)
        console.log(username)
        router.push("/canvas/1")
    }
  return (
    <div className='flex flex-col gap-5 p-5 text-black'>
      <input type="text" placeholder='enter name' value={name} onChange={(e)=>setName(e.target.value)}/>
      <input type="text" placeholder='enter email' value={email} onChange={(e)=>setEmail(e.target.value)}/>
      <input type="text" placeholder='enter password' value={password} onChange={(e)=>setPassword(e.target.value)}/>
      {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
      <button className='text-white' onClick={()=>{isSignUp?handleSignUp():handleLogin()}}>{isSignUp?"SingUp":"Login"}</button>
    </div>
  )
}

export default AuthSection
