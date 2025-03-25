import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChalkHeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: 'white' | 'yellow' | 'blue' | 'pink';
  className?: string;
  animated?: boolean;
  delay?: number;
}

const ChalkHeading: React.FC<ChalkHeadingProps> = ({
  children,
  as = 'h2',
  color = 'white',
  className,
  animated = true,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    
    if (!heading || !animated) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay * 1000);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(heading);

    return () => {
      if (heading) observer.unobserve(heading);
    };
  }, [animated, delay]);

  const colorClasses = {
    white: 'chalk-text',
    yellow: 'chalk-text-yellow',
    blue: 'chalk-text-blue',
    pink: 'chalk-text-pink',
  };

  const Component = as;

  return (
    <Component
      ref={headingRef}
      className={cn(
        'chalk-heading',
        colorClasses[color],
        isVisible ? 'opacity-100' : 'opacity-0',
        animated && 'transition-opacity duration-1000',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default ChalkHeading;
