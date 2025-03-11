import { cn } from '@/lib/utils';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Github, 
  Heart 
} from 'lucide-react';
import ChalkText from './ChalkText';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  // Chalk icon style
  const iconClass = "w-6 h-6 text-chalk-white opacity-70 hover:opacity-100 transition-opacity duration-300 hover:scale-110 transform";
  
  return (
    <footer className={cn('py-8 px-4', className)}>
      <div className="container mx-auto">
        <div className="flex flex-col items-center">
          {/* Social Icons */}
          <div className="flex space-x-6 mb-6">
            <a href="#" className="transition-transform duration-300 hover:animate-chalk-erase">
              <Facebook className={iconClass} />
            </a>
            <a href="#" className="transition-transform duration-300 hover:animate-chalk-erase">
              <Twitter className={iconClass} />
            </a>
            <a href="#" className="transition-transform duration-300 hover:animate-chalk-erase">
              <Instagram className={iconClass} />
            </a>
            <a href="#" className="transition-transform duration-300 hover:animate-chalk-erase">
              <Github className={iconClass} />
            </a>
          </div>
          
          {/* Footer Text */}
          <ChalkText className="flex items-center text-sm opacity-70" animated={false}>
            Built with <Heart className="w-4 h-4 mx-1 text-chalk-pink" /> by creative minds for creative minds
          </ChalkText>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
