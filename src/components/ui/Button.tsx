import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';
import { forwardRef } from 'react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-display font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arcane-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-arcane-primary text-white hover:bg-arcane-glow hover:shadow-arcane active:scale-95',
      secondary: 'bg-forge-surface border border-forge-border text-parchment-light hover:bg-forge-hover hover:border-arcane-primary/30 active:scale-95',
      gold: 'bg-gold-primary text-forge-bg font-semibold hover:bg-gold-light hover:shadow-gold active:scale-95',
      danger: 'bg-blood-primary text-white hover:bg-blood-dark active:scale-95',
      ghost: 'bg-transparent text-parchment-light hover:bg-forge-hover active:scale-95',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    };
    
    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            加载中...
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

