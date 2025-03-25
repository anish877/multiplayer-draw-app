'use client';
import { JSX, useEffect, useState } from "react";
import Link from "next/link";
import ChalkHeading from "@/components/ChalkHeading";
import ChalkButton from "@/components/ChalkButton";
import ChalkFeature from "@/components/ChalkFeature";
import ChalkDrawing from "@/components/ChalkDrawing";
import { 
  Pencil, 
  MessageSquare, 
  Bot,
  Image, 
  Lock, 
  Github, 
  Twitter, 
  Instagram, 
  Youtube 
} from "lucide-react";

const Index = () => {
  const [dustElements, setDustElements] = useState<JSX.Element[]>([]);

  // Generate chalk dust particles on scroll
  useEffect(() => {
    const handleScroll = () => {
      
      if (Math.random() > 0.7) {
        const newDust = (
          <div
            key={Date.now()}
            className="chalk-dust animate-chalk-dust"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${1 + Math.random() * 2}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }}
          />
        );
        
        setDustElements(prev => [...prev, newDust]);
        
        // Remove dust after animation completes
        setTimeout(() => {
          setDustElements(prev => prev.slice(1));
        }, 3000);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Chalk dust container */}
      <div className="chalk-dust-container">
        {dustElements}
      </div>

      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex justify-between items-center mb-12 sm:mb-16">
          <div className="font-chalk text-2xl sm:text-3xl font-bold tracking-wider">Sketch Board</div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/auth/login">
              <ChalkButton variant="outline" className="px-4 sm:px-6 py-2">Log In</ChalkButton>
            </Link>
            <Link href="/auth/signup">
              <ChalkButton variant="blue" className="px-4 sm:px-6 py-2">Sign Up</ChalkButton>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 flex flex-col md:flex-row items-center gap-8 sm:gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block px-3 py-1 mb-4 sm:mb-6 border border-chalk-gray/30 rounded-full">
              <span className="font-handwriting text-chalk-blue">Collaborative Drawing Platform</span>
            </div>
            <ChalkHeading as="h1" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6">
              Sketch & Chat – Where Ideas Come to Life
            </ChalkHeading>
            <p className="font-handwriting text-lg sm:text-xl text-chalk-gray mb-6 sm:mb-8 max-w-xl mx-auto md:mx-0">
              Collaborate, Draw, Chat & Let AI Bring Your Imagination to Reality
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link href="/auth/signup">
                <ChalkButton className="px-6 py-3">Start Sketching Now</ChalkButton>
              </Link>
              <ChalkButton variant="outline" className="px-6 py-3">Learn More</ChalkButton>
            </div>
          </div>
          <div className="flex-1 relative">
            <ChalkDrawing />
          </div>
        </section>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24" id="features">
        <ChalkHeading className="text-3xl sm:text-4xl md:text-5xl text-center mb-12 sm:mb-16">
          The Digital Chalkboard, Reimagined
        </ChalkHeading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <ChalkFeature
            icon={Pencil}
            title="Real-time Multiplayer Drawing"
            description="Sketch together in real-time with friends, colleagues, or clients - no matter where they are."
            index={0}
          />
          <ChalkFeature
            icon={MessageSquare}
            title="Live Chat While You Draw"
            description="Communicate ideas instantly with integrated chat functionality while collaborating on the canvas."
            index={1}
          />
          <ChalkFeature
            icon={Bot}
            title="AI-Powered Figure Generation"
            description="Type a prompt, and watch as AI sketches it instantly on your canvas - perfect for quick visualizations."
            iconColor="text-chalk-blue"
            index={2}
          />
          <ChalkFeature
            icon={Image}
            title="Infinite Canvas"
            description="No boundaries to your creativity with a limitless drawing space that grows with your ideas."
            index={3}
          />
          <ChalkFeature
            icon={Lock}
            title="Secure & Private"
            description="Your sketches, your control. Strong privacy features ensure your work stays with those you choose to share it with."
            index={4}
          />
          <ChalkFeature
            title="Cross-Platform Compatibility"
            description="Draw from any device with a browser - desktop, tablet, or mobile. Your canvas syncs seamlessly across all devices."
            index={5}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <ChalkHeading className="text-3xl sm:text-4xl md:text-5xl mb-6 sm:mb-8">Ready to Start Sketching?</ChalkHeading>
        <p className="font-handwriting text-lg sm:text-xl text-chalk-gray mb-8 max-w-xl mx-auto">
          Join thousands of creative minds already bringing their ideas to life
        </p>
        <ChalkButton variant="blue" className="text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4">
          Try It For Free
        </ChalkButton>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="font-chalk text-xl sm:text-2xl font-bold tracking-wider mb-2">Sketch Board</div>
            <p className="font-handwriting text-chalk-gray">Built with ❤️ by creative minds for creative minds</p>
          </div>
          <div className="flex gap-4 sm:gap-6">
            <Github className="w-5 h-5 sm:w-6 sm:h-6 text-chalk-gray hover:text-chalk-white transition-colors" />
            <Twitter className="w-5 h-5 sm:w-6 sm:h-6 text-chalk-gray hover:text-chalk-white transition-colors" />
            <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-chalk-gray hover:text-chalk-white transition-colors" />
            <Youtube className="w-5 h-5 sm:w-6 sm:h-6 text-chalk-gray hover:text-chalk-white transition-colors" />
          </div>
        </div>
        <div className="text-center mt-8 sm:mt-12">
          <p className="font-handwriting text-chalk-gray text-sm">© {new Date().getFullYear()} Sketch Board. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
