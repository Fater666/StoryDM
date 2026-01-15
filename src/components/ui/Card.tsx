import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'hover' | 'glow';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-forge-card/80 backdrop-blur-sm border border-forge-border shadow-inner-glow',
    hover: 'bg-forge-card/80 backdrop-blur-sm border border-forge-border shadow-inner-glow hover:border-arcane-primary/50 hover:shadow-arcane cursor-pointer',
    glow: 'bg-forge-card/80 backdrop-blur-sm border border-arcane-primary/50 shadow-arcane',
  };
  
  return (
    <motion.div
      className={cn('rounded-xl', variants[variant], className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-6 py-4 border-b border-forge-border', className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-6 py-4 border-t border-forge-border', className)}>
      {children}
    </div>
  );
}

