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
          <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <div className="relative">
          {hasIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border px-4 py-2.5 transition-all duration-200 focus:border-transparent focus:ring-2 dark:bg-gray-800 dark:text-white placeholder:text-gray-400',
              'border-gray-300 dark:border-gray-700 focus:ring-primary-500',
              hasIcon && 'pl-10',
              hasError && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>

        {hasError && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';