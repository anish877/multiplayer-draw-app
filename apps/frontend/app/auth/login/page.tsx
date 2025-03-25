'use client';
import React, { useState } from "react";
import Link from "next/link";
import ChalkHeading from "@/components/ChalkHeading";
import ChalkButton from "@/components/ChalkButton";
import { Mail, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { useAuth } from "../verify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const {setToken,setUserId,setUsername} = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(BACKEND_URL+"/login",{email,password},{withCredentials:true})
        setToken(response.data.token)
        setUserId(response.data.userId)
        setUsername(response.data.name)
        router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-chalk text-3xl font-bold tracking-wider">Sketch Board</span>
          </Link>
        </div>
        
        <div className="chalk-container p-6 sm:p-8 mb-8 rounded-lg">
          <ChalkHeading className="text-3xl sm:text-4xl mb-8 text-center">Welcome Back</ChalkHeading>
          
          {error && (
            <div className="mb-6 p-3 border border-chalk-gray/30 rounded-md bg-chalkboard-light">
              <p className="font-handwriting text-chalk-gray">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="font-chalk text-chalk-white flex items-center gap-2">
                <Mail size={18} className="opacity-80" />
                <span>Email</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-transparent border-2 border-chalk-gray/30 rounded-md font-handwriting text-chalk-white focus:border-chalk-blue focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="font-chalk text-chalk-white flex items-center gap-2">
                <Lock size={18} className="opacity-80" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-transparent border-2 border-chalk-gray/30 rounded-md font-handwriting text-chalk-white focus:border-chalk-blue focus:outline-none transition-colors"
                  placeholder="Your password"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <ChalkButton 
                type="submit" 
                className="w-full flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">Logging in...</span>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </>
                )}
              </ChalkButton>
            </div>
          </form>
        </div>
        
        <div className="text-center">
          <p className="font-handwriting text-chalk-gray mb-4">
            Don&apos;t have an account yet?
          </p>
          <Link href="/auth/signup">
            <ChalkButton variant="outline" className="px-8">Create Account</ChalkButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
