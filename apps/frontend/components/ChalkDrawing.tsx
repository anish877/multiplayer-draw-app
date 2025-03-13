import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChalkPathProps {
  path: string;
  delay?: number;
  className?: string;
}

const ChalkPath: React.FC<ChalkPathProps> = ({ path, delay = 0, className }) => {
  return (
    <path 
      d={path} 
      className={cn("chalk-stroke-path animate-chalk-draw", className)}
      style={{ 
        animationDelay: `${delay}s`,
        strokeDasharray: '100%',
        strokeDashoffset: '100%'
      }}
    />
  );
};

interface ChalkDrawingProps {
  className?: string;
}

const ChalkDrawing: React.FC<ChalkDrawingProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const drawingRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const drawing = drawingRef.current;
    
    if (!drawing) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(drawing);

    return () => {
      if (drawing) observer.unobserve(drawing);
    };
  }, []);

  return (
    <svg 
      ref={drawingRef}
      className={cn("w-full h-auto max-w-2xl mx-auto", className)} 
      viewBox="0 0 800 500" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {isVisible && (
        <>
          {/* Drawing board */}
          <ChalkPath 
            path="M100,100 L700,100 L700,400 L100,400 Z" 
            className="stroke-chalk-white opacity-70" 
            delay={0.2}
          />
          
          {/* Person 1 */}
          <ChalkPath 
            path="M200,300 C230,250 270,270 250,350" 
            className="stroke-chalk-white" 
            delay={0.8}
          />
          <ChalkPath 
            path="M230,180 C260,180 250,220 230,220 C210,220 200,180 230,180" 
            className="stroke-chalk-white" 
            delay={1.1}
          />
          <ChalkPath 
            path="M230,220 L230,300" 
            className="stroke-chalk-white" 
            delay={1.4}
          />
          <ChalkPath 
            path="M230,250 L270,280" 
            className="stroke-chalk-white" 
            delay={1.7}
          />
          <ChalkPath 
            path="M230,250 L190,280" 
            className="stroke-chalk-white" 
            delay={2.0}
          />
          
          {/* Person 2 */}
          <ChalkPath 
            path="M500,300 C530,250 570,270 550,350" 
            className="stroke-chalk-white" 
            delay={0.6}
          />
          <ChalkPath 
            path="M530,180 C560,180 550,220 530,220 C510,220 500,180 530,180" 
            className="stroke-chalk-white" 
            delay={0.9}
          />
          <ChalkPath 
            path="M530,220 L530,300" 
            className="stroke-chalk-white" 
            delay={1.2}
          />
          <ChalkPath 
            path="M530,250 L570,280" 
            className="stroke-chalk-white" 
            delay={1.5}
          />
          <ChalkPath 
            path="M530,250 L490,280" 
            className="stroke-chalk-white" 
            delay={1.8}
          />
          
          {/* Drawing on board */}
          <ChalkPath 
            path="M250,150 C350,120 450,180 550,150" 
            className="stroke-chalk-blue" 
            delay={2.3}
          />
          <ChalkPath 
            path="M300,200 C350,180 400,220 450,200" 
            className="stroke-chalk-blue" 
            delay={2.6}
          />
          <ChalkPath 
            path="M380,250 L380,320" 
            className="stroke-chalk-gray" 
            delay={2.9}
          />
          <ChalkPath 
            path="M350,280 L410,280" 
            className="stroke-chalk-gray" 
            delay={3.2}
          />
          
          {/* AI-generated drawing */}
          <ChalkPath 
            path="M480,220 C500,180 520,200 540,180" 
            className="stroke-chalk-white" 
            delay={3.5}
          />
          <ChalkPath 
            path="M500,220 C520,240 530,220 550,240" 
            className="stroke-chalk-white opacity-80" 
            delay={3.8}
          />
          <ChalkPath 
            path="M150,220 C170,180 190,200 210,180" 
            className="stroke-chalk-white opacity-80" 
            delay={4.1}
          />
          <ChalkPath 
            path="M170,220 C190,240 200,220 220,240" 
            className="stroke-chalk-white opacity-60" 
            delay={4.4}
          />
        </>
      )}
    </svg>
  );
};

export default ChalkDrawing;
