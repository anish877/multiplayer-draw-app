
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import ChalkButton from './ChalkButton';
import { Users } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  users: number;
}

interface ChalkRoomProps {
  room: Room;
  onJoin: () => void;
  className?: string;
  index?: number;
}

const ChalkRoom: React.FC<ChalkRoomProps> = ({
  room,
  onJoin,
  className,
  index = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dusts, setDusts] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const roomElement = roomRef.current;
    
    if (!roomElement) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, index * 150);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(roomElement);

    return () => {
      if (roomElement) observer.unobserve(roomElement);
    };
  }, [index]);

  const generateDust = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newDusts: { id: number; x: number; y: number; delay: number; }[] = [];
    for (let i = 0; i < 3; i++) {
      newDusts.push({
        id: Date.now() + i,
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        delay: i * 0.1
      });
    }
    
    setDusts(prev => [...prev, ...newDusts]);
    
    // Remove dusts after animation
    setTimeout(() => {
      setDusts(prev => prev.filter(dust => !newDusts.some(newDust => newDust.id === dust.id)));
    }, 2000);
  };

  return (
    <div
      ref={roomRef}
      className={cn(
        'chalk-container p-6 relative overflow-hidden',
        'border border-white/10 rounded-lg',
        'transition-all duration-300',
        isVisible ? 'animate-chalk-fade-in' : 'opacity-0',
        className
      )}
      style={{ 
        animationDelay: `${index * 0.15}s`,
        animationFillMode: 'forwards'
      }}
      onMouseEnter={generateDust}
      onClick={generateDust}
    >
      {dusts.map((dust) => (
        <span
          key={dust.id}
          className="chalk-dust animate-chalk-dust absolute"
          style={{
            left: `${dust.x}px`,
            top: `${dust.y}px`,
            animationDelay: `${dust.delay}s`
          }}
        />
      ))}
      
      <h3 className="font-chalk text-xl mb-3 line-clamp-2">{room.name}</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-chalk-blue">
          <Users className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
          <span className="font-handwriting">{room.users} Online</span>
        </div>
        
        <ChalkButton onClick={onJoin} className="px-4 py-1.5 text-sm">
          Join
        </ChalkButton>
      </div>
    </div>
  );
};

export default ChalkRoom;