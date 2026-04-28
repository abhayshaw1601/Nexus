import React from 'react';
import { cn } from './Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-6">
        {label && (
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground transition-colors">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-[56px] w-full rounded-[0px] border-2 border-border bg-background px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 font-medium',
            error && 'border-destructive focus:ring-destructive/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
