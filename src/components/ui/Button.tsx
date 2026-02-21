import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

  const variants = {
    primary:
      'bg-rs-terracotta text-white hover:bg-rs-terracotta-dark focus:ring-rs-terracotta/40 shadow-sm hover:shadow-md',
    secondary:
      'bg-rs-neon-teal text-white hover:bg-rs-neon-teal/90 focus:ring-rs-neon-teal/40 shadow-sm hover:shadow-md',
    outline:
      'border border-rs-sand-dark/40 text-rs-deep-brown hover:bg-rs-sand/50 focus:ring-rs-terracotta/30',
    ghost:
      'text-rs-desert-brown hover:bg-rs-sand/50 focus:ring-rs-desert-brown/20',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/40 shadow-sm',
    neon:
      'bg-rs-deep-brown text-rs-neon-teal border border-rs-neon-teal/40 hover:bg-rs-neon-teal/10 focus:ring-rs-neon-teal/30',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
};