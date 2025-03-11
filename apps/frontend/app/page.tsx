'use client';
import { useEffect } from 'react';
import ChalkHeading from '@/components/ChalkHeading';
import ChalkText from '@/components/ChalkText';
import ChalkButton from '@/components/ChalkButton';
import ChalkDrawing from '@/components/ChalkDrawing';
import FeatureCard from '@/components/FeatureCard';
import Footer from '@/components/Footer';
import AnimatedChalkDust from '@/components/AnimatedChalkDust';
import { 
  Pencil, 
  MessageCircle, 
  Bot, 
  Maximize, 
  Lock, 
  Users,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const Index = () => {
  useEffect(() => {
    // Simulate chalk dust on page load
    setTimeout(() => {
      toast("Welcome to Sketch & Chat!", {
        description: "Where your ideas come to life!",
        duration: 3000,
      });
    }, 1000);
  }, []);

  const handleStartSketchingClick = () => {
    toast("Coming Soon!", {
      description: "We're still drawing up this feature. Stay tuned!",
      duration: 3000,
    });
  };

  // Feature data
  const features = [
    {
      title: "Real-time Multiplayer Drawing",
      description: "Sketch together from anywhere in the world with real-time collaborative drawing tools.",
      icon: <Pencil className="w-8 h-8 text-chalk-white" />,
      color: 'white',
      delay: 'delay-300'
    },
    {
      title: "Live Chat While You Draw",
      description: "Communicate seamlessly with friends & teams as you create together.",
      icon: <MessageCircle className="w-8 h-8 text-chalk-yellow" />,
      color: 'yellow',
      delay: 'delay-400'
    },
    {
      title: "AI-Powered Figure Generation",
      description: "Just type a prompt, and AI creates sketches for you in seconds.",
      icon: <Bot className="w-8 h-8 text-chalk-blue" />,
      color: 'blue',
      delay: 'delay-500'
    },
    {
      title: "Infinite Canvas",
      description: "Explore endless creativity with a never-ending board that grows with your ideas.",
      icon: <Maximize className="w-8 h-8 text-chalk-pink" />,
      color: 'pink',
      delay: 'delay-600'
    },
    {
      title: "Secure & Private",
      description: "Your sketches, your rules. We prioritize the privacy and security of your creations.",
      icon: <Lock className="w-8 h-8 text-chalk-white" />,
      color: 'white',
      delay: 'delay-700'
    },
    {
      title: "Multiplayer Collaboration",
      description: "Invite friends, family or colleagues to join your creative sessions.",
      icon: <Users className="w-8 h-8 text-chalk-yellow" />,
      color: 'yellow',
      delay: 'delay-800'
    }
  ];

  return (
    <div className="min-h-screen chalkboard overflow-hidden">
      {/* Header Section */}
      <header className="container mx-auto pt-8 px-4 sm:pt-12 md:pt-16">
        <div className="text-center relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <AnimatedChalkDust intensity="medium" />
          </div>
          <ChalkHeading 
            className="text-4xl sm:text-5xl md:text-6xl mb-3" 
            delay="delay-200"
          >
            Sketch & Chat
          </ChalkHeading>
          <ChalkHeading 
            level={2} 
            className="text-xl sm:text-2xl md:text-3xl mb-2" 
            color="yellow"
            delay="delay-400"
          >
            Where Ideas Come to Life
          </ChalkHeading>
          <ChalkText 
            className="max-w-xl mx-auto text-lg opacity-80" 
            delay="delay-600"
          >
            Collaborate, Draw, Chat & Let AI Bring Your Imagination to Reality
          </ChalkText>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto mt-8 md:mt-12 px-4 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="md:w-1/2 text-center md:text-left">
          <ChalkText 
            className="text-lg sm:text-xl mb-8" 
            color="blue"
            delay="delay-800"
          >
            Unleash your creativity in a collaborative space where drawing, 
            communication, and AI converge. Perfect for teams, classrooms, 
            and creative minds everywhere.
          </ChalkText>
          <Link href={"/auth/login"}>
            <ChalkButton 
              color="yellow" 
              className="text-xl px-10 py-4 transform hover:scale-105"
              onClick={handleStartSketchingClick}
              delay="delay-1000"
            >
              Start Sketching Now
            </ChalkButton>
          </Link>
          
        </div>
        
        <div className="md:w-1/2 relative">
          <div className="w-full max-w-md mx-auto md:mx-0">
            <ChalkDrawing className="w-full h-auto" />
          </div>
          
          {/* Floating elements to enhance the chalk effect */}
          <div className="absolute -right-8 top-10 opacity-20 animate-float">
            <RefreshCw className="w-12 h-12 text-chalk-white" />
          </div>
          <div className="absolute -left-8 bottom-10 opacity-20 animate-float delay-1000">
            <Pencil className="w-10 h-10 text-chalk-yellow" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto mt-16 md:mt-24 px-4 py-8">
        <ChalkHeading 
          level={2} 
          className="text-3xl md:text-4xl text-center mb-12"
          delay="delay-200"
        >
          Drawn With <span className="text-chalk-pink">Passion</span>, Powered By <span className="text-chalk-blue">Innovation</span>
        </ChalkHeading>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color as 'white' | 'yellow' | 'blue' | 'pink'}
              delay={feature.delay}
            />
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto mt-16 md:mt-24 px-4 text-center py-10 relative">
        <div className="max-w-2xl mx-auto relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <AnimatedChalkDust intensity="low" />
          </div>
          
          <ChalkHeading 
            level={2} 
            className="text-2xl md:text-3xl mb-6"
            color="blue"
            delay="delay-200"
          >
            Ready to Transform Your Ideas Into Visual Reality?
          </ChalkHeading>
          
          <ChalkText 
            className="mb-8 opacity-80"
            delay="delay-400"
          >
            Join thousands of creative minds already sketching, chatting, and creating together.
          </ChalkText>
          
          <ChalkButton 
            onClick={handleStartSketchingClick}
            delay="delay-600"
          >
            Join the Creative Community
          </ChalkButton>
        </div>
      </section>

      {/* Footer */}
      <Footer className="mt-16" />
    </div>
  );
};

export default Index;


