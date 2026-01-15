import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-display text-parchment-light/80 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 bg-forge-surface border border-forge-border rounded-lg',
              'text-parchment-light appearance-none cursor-pointer',
              'focus:outline-none focus:border-arcane-primary/50 focus:ring-2 focus:ring-arcane-primary/20',
              'transition-all duration-200',
              error && 'border-blood-primary focus:border-blood-primary focus:ring-blood-primary/20',
              className
            )}
            {...props}
          >
            {options.map(option => (
              <option key={option.value} value={option.value} className="bg-forge-surface">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-parchment-light/40 pointer-events-none"
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-blood-primary">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

