import { cn } from '@/lib/utils';
import ChalkHeading from './ChalkHeading';
import ChalkText from './ChalkText';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: 'white' | 'yellow' | 'blue' | 'pink';
  className?: string;
  animated?: boolean;
  delay?: string;
}

const FeatureCard = ({ 
  title, 
  description, 
  icon,
  color = 'white',
  className,
  animated = true,
  delay = ''
}: FeatureCardProps) => {
  const cardAnimationClass = animated ? 'opacity-0 animate-chalk-write' : '';
  
  return (
    <div 
      className={cn(
        'p-6 rounded-lg border-2 border-dashed border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-all duration-300 hover:shadow-chalk group',
        cardAnimationClass,
        delay,
        className
      )}
    >
      <div className="p-3 mb-4 inline-block">
        {icon}
      </div>
      
      <ChalkHeading 
        as="h3" 
        color={color} 
        className="text-xl mb-2"
        animated={false}
      >
        {title}
      </ChalkHeading>
      
      <ChalkText 
        color={color} 
        className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        animated={false}
      >
        {description}
      </ChalkText>
    </div>
  );
};

export default FeatureCard;