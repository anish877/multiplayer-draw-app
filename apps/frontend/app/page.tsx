import Link from 'next/link'
import React from 'react'

const LandingPage = () => {
  return (
    <div className='h-screen flex justify-center items-center'>
      <Link href={"/auth/login"}>
        <button>Login</button>
      </Link>
      <Link href={"/auth/signup"}>
        <button>Signup</button>
      </Link>
    </div>
  )
}

export default LandingPage

