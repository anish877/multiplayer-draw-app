import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ChalkFeatureProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  className?: string;
  index?: number;
}

const ChalkFeature: React.FC<ChalkFeatureProps> = ({
  icon: Icon,
  title,
  description,
  iconColor = 'text-chalk-white',
  className,
  index = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const featureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feature = featureRef.current;
    
    if (!feature) {
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

    observer.observe(feature);

    return () => {
      if (feature) observer.unobserve(feature);
    };
  }, [index]);

  return (
    <div
      ref={featureRef}
      className={cn(
        'chalk-container p-6 relative',
        isVisible ? 'animate-chalk-fade-in' : 'opacity-0',
        className
      )}
      style={{ 
        animationDelay: `${index * 0.15}s`,
        animationFillMode: 'forwards'
      }}
    >
      {Icon && (
        <div className="mb-4">
          <Icon className={cn("w-10 h-10", iconColor)} strokeWidth={1.25} />
        </div>
      )}
      <h3 className="font-chalk text-xl mb-2">{title}</h3>
      <p className="font-handwriting text-chalk-gray">{description}</p>
    </div>
  );
};

export default ChalkFeature;
