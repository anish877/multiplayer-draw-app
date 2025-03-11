import { cn } from '@/lib/utils';

interface ChalkHeadingProps {
  children: React.ReactNode;
  color?: 'white' | 'yellow' | 'blue' | 'pink';
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  animated?: boolean;
  delay?: string;
}

const ChalkHeading = ({ 
  children, 
  color = 'white', 
  className, 
  level = 1,
  animated = true,
  delay = '' 
}: ChalkHeadingProps) => {
  const colorClasses = {
    white: 'chalk-text',
    yellow: 'chalk-text-yellow',
    blue: 'chalk-text-blue',
    pink: 'chalk-text-pink',
  };

  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  const baseClasses = 'font-hand font-bold tracking-wide';
  const animationClass = animated ? 'opacity-0 animate-chalk-write' : '';
  
  return (
    <Component 
      className={cn(
        baseClasses,
        colorClasses[color],
        animationClass,
        delay,
        className
      )}
    >
      {children}
    </Component>
  );
};

export default ChalkHeading;
