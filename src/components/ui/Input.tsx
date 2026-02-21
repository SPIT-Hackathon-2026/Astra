import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    const hasIcon = Boolean(icon);
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-rs-deep-brown/80 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {hasIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-rs-desert-brown/40">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 border border-rs-sand-dark/40 rounded-xl bg-white focus:ring-2 focus:ring-rs-terracotta/20 focus:border-rs-terracotta transition-colors text-rs-deep-brown placeholder:text-rs-desert-brown/40 text-sm',
              hasIcon && 'pl-10',
              hasError && 'border-red-300 focus:ring-red-500/20 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>

        {hasError && (
          <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
