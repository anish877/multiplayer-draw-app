'use client';
import { useState } from 'react';
import Link from 'next/link';
import ChalkHeading from '@/components/ChalkHeading';
import ChalkText from '@/components/ChalkText';
import ChalkButton from '@/components/ChalkButton';
import AnimatedChalkDust from '@/components/AnimatedChalkDust';
import { User, Key, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BACKEND_URL } from '@/app/config';
import { useAuth } from '../verify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDust, setShowDust] = useState(false);
  const router = useRouter()
  const {token,setToken,userId,setUserId,username,setUsername} = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDust(true);
    setTimeout(() => setShowDust(false), 1000);

    // This is where you would handle actual authentication
    if (email && password) {
      const response = await axios.post(BACKEND_URL+"/login",{name,email,password})
        setToken(response.data.token)
        setUserId(response.data.userId)
        setUsername(response.data.name)
        console.log(token)
        console.log(username)
        router.push("/canvas/1")
    } else {
      toast.error("Login failed", {
        description: "Please check your credentials and try again.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen chalkboard overflow-hidden">
      {/* Header */}
      <header className="container mx-auto pt-8 px-4 sm:pt-12">
        <div className="text-center relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <AnimatedChalkDust intensity="medium" />
          </div>
          <Link href="/">
            <ChalkHeading 
              className="text-3xl sm:text-4xl mb-2" 
              delay="delay-200"
            >
              Sketch & Chat
            </ChalkHeading>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <div className="container mx-auto mt-8 px-4 flex justify-center">
        <div className="w-full max-w-md relative">
          {showDust && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <AnimatedChalkDust color="yellow" intensity="medium" />
            </div>
          )}
          
          <div className="p-8 border-2 border-dashed border-white/30 rounded-lg backdrop-blur-sm bg-white/5">
            <ChalkHeading 
              level={2} 
              className="text-2xl mb-6 text-center" 
              color="yellow"
              delay="delay-300"
            >
              Welcome Back
            </ChalkHeading>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-chalk-white opacity-80" />
                  <ChalkText animated={false} className="opacity-80">Email</ChalkText>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-2 border-dashed border-white/30 rounded-md px-4 py-2 text-chalk-white font-hand focus:outline-none focus:border-chalk-yellow/50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-chalk-white opacity-80" />
                  <ChalkText animated={false} className="opacity-80">Password</ChalkText>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-2 border-dashed border-white/30 rounded-md px-4 py-2 text-chalk-white font-hand focus:outline-none focus:border-chalk-yellow/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <ChalkButton 
                  type="submit" 
                  color="yellow" 
                  className="w-full"
                  animated={false}
                >
                  Sign In
                </ChalkButton>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <ChalkText animated={false} className="opacity-70">
                Don't have an account yet?{' '}
                <Link href="/signup" className="text-chalk-blue hover:underline">
                  Sign Up
                </Link>
              </ChalkText>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer className="mt-16" />
    </div>
  );
};

export default Login;
