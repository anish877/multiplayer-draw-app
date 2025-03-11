'use client';
import { useState } from 'react';
import Link from 'next/link';
import ChalkHeading from '@/components/ChalkHeading';
import ChalkText from '@/components/ChalkText';
import ChalkButton from '@/components/ChalkButton';
import AnimatedChalkDust from '@/components/AnimatedChalkDust';
import { User, Key, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

const Signup = () => {
  const router = useRouter()
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDust, setShowDust] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDust(true);
    setTimeout(() => setShowDust(false), 1000);

    // This is where you would handle actual signup
    if (name && email && password && password === confirmPassword) {
      toast.success("Account created successfully!", {
        description: "Welcome to Sketch & Chat!",
        duration: 3000,
      });
      setTimeout(() => router.push('/'), 1500);
    } else if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match.",
        duration: 3000,
      });
    } else {
      toast.error("Signup failed", {
        description: "Please fill in all fields and try again.",
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

      {/* Signup Form */}
      <div className="container mx-auto mt-8 px-4 flex justify-center">
        <div className="w-full max-w-md relative">
          {showDust && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <AnimatedChalkDust color="blue" intensity="medium" />
            </div>
          )}
          
          <div className="p-8 border-2 border-dashed border-white/30 rounded-lg backdrop-blur-sm bg-white/5">
            <ChalkHeading 
              level={2} 
              className="text-2xl mb-6 text-center" 
              color="blue"
              delay="delay-300"
            >
              Create Your Account
            </ChalkHeading>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-chalk-white opacity-80" />
                  <ChalkText animated={false} className="opacity-80">Name</ChalkText>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-2 border-dashed border-white/30 rounded-md px-4 py-2 text-chalk-white font-hand focus:outline-none focus:border-chalk-blue/50"
                    placeholder="Your name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-chalk-white opacity-80" />
                  <ChalkText animated={false} className="opacity-80">Email</ChalkText>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-2 border-dashed border-white/30 rounded-md px-4 py-2 text-chalk-white font-hand focus:outline-none focus:border-chalk-blue/50"
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
                    className="w-full bg-transparent border-2 border-dashed border-white/30 rounded-md px-4 py-2 text-chalk-white font-hand focus:outline-none focus:border-chalk-blue/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-chalk-white opacity-80" />
                  <ChalkText animated={false} className="opacity-80">Confirm Password</ChalkText>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent border-2 border-dashed border-white/30 rounded-md px-4 py-2 text-chalk-white font-hand focus:outline-none focus:border-chalk-blue/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <ChalkButton 
                  type="submit" 
                  color="blue" 
                  className="w-full"
                  animated={false}
                >
                  Create Account
                </ChalkButton>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <ChalkText animated={false} className="opacity-70">
                Already have an account?{' '}
                <Link href="/login" className="text-chalk-yellow hover:underline">
                  Sign In
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

export default Signup;
