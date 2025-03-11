import { cn } from '@/lib/utils';

interface ChalkTextProps {
  children: React.ReactNode;
  color?: 'white' | 'yellow' | 'blue' | 'pink';
  className?: string;
  animated?: boolean;
  delay?: string;
}

const ChalkText = ({ 
  children, 
  color = 'white', 
  className, 
  animated = true,
  delay = ''
}: ChalkTextProps) => {
  const colorClasses = {
    white: 'chalk-text',
    yellow: 'chalk-text-yellow',
    blue: 'chalk-text-blue',
    pink: 'chalk-text-pink',
  };
  
  const animationClass = animated ? 'opacity-0 animate-chalk-write' : '';
  
  return (
    <p 
      className={cn(
        'font-hand tracking-wide',
        colorClasses[color],
        animationClass,
        delay,
        className
      )}
    >
      {children}
    </p>
  );
};

export default ChalkText;
