import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DustParticle {
  id: number;
  size: number;
  top: number;
  left: number;
  opacity: number;
  delay: number;
}

interface AnimatedChalkDustProps {
  color?: 'white' | 'yellow' | 'blue' | 'pink';
  intensity?: 'low' | 'medium' | 'high';
}

const AnimatedChalkDust = ({ 
  color = 'white',
  intensity = 'medium'
}: AnimatedChalkDustProps) => {
  const [particles, setParticles] = useState<DustParticle[]>([]);
  
  const colorClasses = {
    white: 'bg-chalk-white',
    yellow: 'bg-chalk-yellow',
    blue: 'bg-chalk-blue',
    pink: 'bg-chalk-pink',
  };
  
  const particleCount = {
    low: 10,
    medium: 20,
    high: 30,
  };
  
  useEffect(() => {
    const newParticles: DustParticle[] = [];
    const count = particleCount[intensity];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        size: Math.random() * 4 + 1, // 1-5px
        top: Math.random() * 60 - 30, // -30 to 30px from center
        left: Math.random() * 100 - 50, // -50 to 50px from center
        opacity: Math.random() * 0.7 + 0.3, // 0.3-1.0 opacity
        delay: Math.random() * 0.3, // 0-0.3s delay
      });
    }
    
    setParticles(newParticles);
  }, [intensity, particleCount]);
  
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            'absolute rounded-full animate-chalk-dust',
            colorClasses[color]
          )}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            top: `calc(50% + ${particle.top}px)`,
            left: `calc(50% + ${particle.left}px)`,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedChalkDust;
