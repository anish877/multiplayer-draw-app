'use client';
import React, { useState } from "react";
import Link2 from "next/link";
import ChalkHeading from "@/components/ChalkHeading";
import ChalkButton from "@/components/ChalkButton";
import { Mail, Lock, User, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await axios.post(BACKEND_URL+"/signup",{name,email,password})
      router.push("/auth/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Could not create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link2 href="/" className="inline-block">
            <span className="font-chalk text-3xl font-bold tracking-wider">Sketch Board</span>
          </Link2>
        </div>
        
        <div className="chalk-container p-6 sm:p-8 mb-8 rounded-lg">
          <ChalkHeading className="text-3xl sm:text-4xl mb-8 text-center">Join Sketch Board</ChalkHeading>
          
          {error && (
            <div className="mb-6 p-3 border border-chalk-gray/30 rounded-md bg-chalkboard-light">
              <p className="font-handwriting text-chalk-gray">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="font-chalk text-chalk-white flex items-center gap-2">
                <User size={18} className="opacity-80" />
                <span>Name</span>
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-transparent border-2 border-chalk-gray/30 rounded-md font-handwriting text-chalk-white focus:border-chalk-blue focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="font-chalk text-chalk-white flex items-center gap-2">
                <Mail size={18} className="opacity-80" />
                <span>Email</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
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
                  placeholder="Choose a password"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <ChalkButton 
                type="submit" 
                variant="blue"
                className="w-full flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">Creating account...</span>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Create Account</span>
                  </>
                )}
              </ChalkButton>
            </div>
          </form>
        </div>
        
        <div className="text-center">
          <p className="font-handwriting text-chalk-gray mb-4">
            Already have an account?
          </p>
          <Link2 href="/auth/login">
            <ChalkButton variant="outline" className="px-8">Sign In</ChalkButton>
          </Link2>
        </div>
      </div>
    </div>
  );
};

export default Signup;
