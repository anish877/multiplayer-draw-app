import AuthSection from '@/components/AuthSection'
import React from 'react'

const Login = () => {
  return (
    <div className='h-screen flex justify-center items-center'>
      <AuthSection isSignUp={false} />
    </div>
  )
}

export default Login
