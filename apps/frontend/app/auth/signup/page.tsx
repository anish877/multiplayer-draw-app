import AuthSection from '@/components/AuthSection'
import React from 'react'

const SingUp = () => {
  return (
    <div className='h-screen flex justify-center items-center'>
      <AuthSection isSignUp={true} />
    </div>
  )
}

export default SingUp
