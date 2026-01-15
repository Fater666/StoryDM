import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-display text-parchment-light/80 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-forge-surface border border-forge-border rounded-lg',
            'text-parchment-light placeholder-parchment-light/40',
            'focus:outline-none focus:border-arcane-primary/50 focus:ring-2 focus:ring-arcane-primary/20',
            'transition-all duration-200',
            error && 'border-blood-primary focus:border-blood-primary focus:ring-blood-primary/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-blood-primary">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-display text-parchment-light/80 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-forge-surface border border-forge-border rounded-lg',
            'text-parchment-light placeholder-parchment-light/40',
            'focus:outline-none focus:border-arcane-primary/50 focus:ring-2 focus:ring-arcane-primary/20',
            'transition-all duration-200 resize-none',
            error && 'border-blood-primary focus:border-blood-primary focus:ring-blood-primary/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-blood-primary">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

