import { cn } from '@/lib/utils';
import { useState } from 'react';
import AnimatedChalkDust from './AnimatedChalkDust';

interface ChalkButtonProps {
  children: React.ReactNode;
  color?: 'white' | 'yellow' | 'blue' | 'pink';
  className?: string;
  onClick?: () => void;
  animated?: boolean;
  delay?: string;
  type?: 'button' | 'submit' | 'reset';
}

const ChalkButton = ({ 
  children, 
  color = 'white', 
  className, 
  onClick,
  animated = true,
  delay = '',
  type = 'button'
}: ChalkButtonProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showDust, setShowDust] = useState(false);
  
  const colorClasses = {
    white: 'text-chalk-white border-chalk-white hover:bg-white/5',
    yellow: 'text-chalk-yellow border-chalk-yellow hover:bg-yellow-50/5',
    blue: 'text-chalk-blue border-chalk-blue hover:bg-blue-50/5',
    pink: 'text-chalk-pink border-chalk-pink hover:bg-pink-50/5',
  };
  
  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowDust(true);
    setTimeout(() => setShowDust(false), 1000);
  };
  
  const handleClick = () => {
    setShowDust(true);
    setTimeout(() => setShowDust(false), 1000);
    if (onClick) onClick();
  };
  
  const animationClass = animated ? 'opacity-0 animate-chalk-write' : '';
  
  return (
    <div className="relative inline-block">
      <button
        type={type}
        className={cn(
          'relative font-hand tracking-wide py-3 px-8 rounded-lg border-2 border-dashed transform transition-all duration-300',
          colorClasses[color],
          'hover:animate-chalk-erase focus:outline-none focus:ring-2 focus:ring-white/20',
          animationClass,
          delay,
          className
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovering(false)}
      >
        {children}
      </button>
      
      {showDust && (
        <AnimatedChalkDust color={color} />
      )}
    </div>
  );
};

export default ChalkButton;
