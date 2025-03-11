import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import AnimatedChalkDust from './AnimatedChalkDust';

interface ChalkDrawingProps {
  className?: string;
  animated?: boolean;
}

const ChalkDrawing = ({ className, animated = true }: ChalkDrawingProps) => {
  const [isVisible, setIsVisible] = useState(!animated);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [animated]);
  
  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 500 400"
        className={cn(
          'w-full h-full transition-opacity duration-1000',
          isVisible ? 'opacity-90' : 'opacity-0'
        )}
      >
        {/* Chalk drawing of people collaborating */}
        <g stroke="#F5F5F5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          {/* Person 1 */}
          <circle cx="120" cy="150" r="30" strokeDasharray="188.5" strokeDashoffset={isVisible ? "0" : "188.5"} style={{ transition: 'stroke-dashoffset 2s ease' }} />
          <line x1="120" y1="180" x2="120" y2="250" strokeDasharray="70" strokeDashoffset={isVisible ? "0" : "70"} style={{ transition: 'stroke-dashoffset 2s ease 0.5s' }} />
          <line x1="120" y1="200" x2="90" y2="220" strokeDasharray="36.1" strokeDashoffset={isVisible ? "0" : "36.1"} style={{ transition: 'stroke-dashoffset 2s ease 0.7s' }} />
          <line x1="120" y1="200" x2="150" y2="220" strokeDasharray="36.1" strokeDashoffset={isVisible ? "0" : "36.1"} style={{ transition: 'stroke-dashoffset 2s ease 0.9s' }} />
          <line x1="120" y1="250" x2="100" y2="300" strokeDasharray="54.1" strokeDashoffset={isVisible ? "0" : "54.1"} style={{ transition: 'stroke-dashoffset 2s ease 1.1s' }} />
          <line x1="120" y1="250" x2="140" y2="300" strokeDasharray="54.1" strokeDashoffset={isVisible ? "0" : "54.1"} style={{ transition: 'stroke-dashoffset 2s ease 1.3s' }} />
          
          {/* Person 2 */}
          <circle cx="240" cy="150" r="30" strokeDasharray="188.5" strokeDashoffset={isVisible ? "0" : "188.5"} style={{ transition: 'stroke-dashoffset 2s ease 0.3s' }} />
          <line x1="240" y1="180" x2="240" y2="250" strokeDasharray="70" strokeDashoffset={isVisible ? "0" : "70"} style={{ transition: 'stroke-dashoffset 2s ease 0.8s' }} />
          <line x1="240" y1="200" x2="270" y2="190" strokeDasharray="31.6" strokeDashoffset={isVisible ? "0" : "31.6"} style={{ transition: 'stroke-dashoffset 2s ease 1s' }} />
          <line x1="240" y1="200" x2="210" y2="190" strokeDasharray="31.6" strokeDashoffset={isVisible ? "0" : "31.6"} style={{ transition: 'stroke-dashoffset 2s ease 1.2s' }} />
          <line x1="240" y1="250" x2="220" y2="300" strokeDasharray="54.1" strokeDashoffset={isVisible ? "0" : "54.1"} style={{ transition: 'stroke-dashoffset 2s ease 1.4s' }} />
          <line x1="240" y1="250" x2="260" y2="300" strokeDasharray="54.1" strokeDashoffset={isVisible ? "0" : "54.1"} style={{ transition: 'stroke-dashoffset 2s ease 1.6s' }} />
          
          {/* Person 3 */}
          <circle cx="360" cy="150" r="30" strokeDasharray="188.5" strokeDashoffset={isVisible ? "0" : "188.5"} style={{ transition: 'stroke-dashoffset 2s ease 0.6s' }} />
          <line x1="360" y1="180" x2="360" y2="250" strokeDasharray="70" strokeDashoffset={isVisible ? "0" : "70"} style={{ transition: 'stroke-dashoffset 2s ease 1.1s' }} />
          <line x1="360" y1="200" x2="330" y2="230" strokeDasharray="42.4" strokeDashoffset={isVisible ? "0" : "42.4"} style={{ transition: 'stroke-dashoffset 2s ease 1.3s' }} />
          <line x1="360" y1="200" x2="390" y2="230" strokeDasharray="42.4" strokeDashoffset={isVisible ? "0" : "42.4"} style={{ transition: 'stroke-dashoffset 2s ease 1.5s' }} />
          <line x1="360" y1="250" x2="340" y2="300" strokeDasharray="54.1" strokeDashoffset={isVisible ? "0" : "54.1"} style={{ transition: 'stroke-dashoffset 2s ease 1.7s' }} />
          <line x1="360" y1="250" x2="380" y2="300" strokeDasharray="54.1" strokeDashoffset={isVisible ? "0" : "54.1"} style={{ transition: 'stroke-dashoffset 2s ease 1.9s' }} />
          
          {/* Drawing board */}
          <rect x="140" y="80" width="220" height="160" rx="5" strokeDasharray="760" strokeDashoffset={isVisible ? "0" : "760"} style={{ transition: 'stroke-dashoffset 3s ease 2s' }} />
          
          {/* Chalk sketch on the board */}
          <path d="M170 120 C 200 100, 230 150, 250 110 C 270 70, 290 130, 320 110" stroke="#FFF9C4" strokeDasharray="230" strokeDashoffset={isVisible ? "0" : "230"} style={{ transition: 'stroke-dashoffset 2s ease 3s' }} />
          <path d="M190 180 C 210 150, 240 190, 270 160 C 300 130, 320 170, 290 180" stroke="#BBDEFB" strokeDasharray="230" strokeDashoffset={isVisible ? "0" : "230"} style={{ transition: 'stroke-dashoffset 2s ease 3.5s' }} />
          
          {/* Speech bubbles */}
          <path d="M150 90 C 140 80, 120 80, 110 95 C 100 110, 110 130, 125 135 L 120 150 L 135 135 C 150 140, 170 130, 170 110 C 170 90, 160 80, 150 90" stroke="#F8BBD0" strokeDasharray="190" strokeDashoffset={isVisible ? "0" : "190"} style={{ transition: 'stroke-dashoffset 2s ease 4s' }} />
          <path d="M350 90 C 360 80, 380 80, 390 95 C 400 110, 390 130, 375 135 L 380 150 L 365 135 C 350 140, 330 130, 330 110 C 330 90, 340 80, 350 90" stroke="#F8BBD0" strokeDasharray="190" strokeDashoffset={isVisible ? "0" : "190"} style={{ transition: 'stroke-dashoffset 2s ease 4.2s' }} />
        </g>
      </svg>
      
      {/* Optional Chalk Dust Animation */}
      {isVisible && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <AnimatedChalkDust intensity="low" />
        </div>
      )}
    </div>
  );
};

export default ChalkDrawing;
