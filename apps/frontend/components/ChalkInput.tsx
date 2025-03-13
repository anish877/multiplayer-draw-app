
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ChalkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const ChalkInput = forwardRef<HTMLInputElement, ChalkInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          className={cn(
            "w-full bg-transparent border-2 border-chalk-white/50 rounded-md px-4 py-2",
            "font-handwriting text-chalk-white placeholder:text-chalk-gray/70",
            "focus:outline-none focus:border-chalk-white focus:ring-1 focus:ring-chalk-white/30",
            "transition-all duration-300",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-0 bg-white/5 rounded-md pointer-events-none" />
      </div>
    );
  }
);

ChalkInput.displayName = 'ChalkInput';

export default ChalkInput;