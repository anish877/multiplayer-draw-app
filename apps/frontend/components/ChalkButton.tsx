import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChalkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'blue';
}

const ChalkButton: React.FC<ChalkButtonProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const [dusts, setDusts] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  const generateDust = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newDusts: { id: number; x: number; y: number; delay: number; }[] = [];
    for (let i = 0; i < 5; i++) {
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
    <button
      className={cn(
        'chalk-button group', // Added group class here directly
        variant === 'blue' && 'border-chalk-blue text-chalk-blue',
        variant === 'outline' && 'border-chalk-gray text-chalk-gray',
        className
      )}
      onMouseEnter={generateDust}
      onClick={generateDust}
      {...props}
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
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default ChalkButton;
