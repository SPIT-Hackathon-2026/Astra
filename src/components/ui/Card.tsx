import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'desert' | 'neon' | 'vintage';
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, variant = 'default' }) => {
  const variants = {
    default: 'bg-white/90 backdrop-blur-sm border border-rs-sand-dark/50 shadow-md',
    desert: 'bg-gradient-to-br from-rs-sand to-rs-sand-light border border-rs-desert-brown/20 shadow-md',
    neon: 'bg-rs-deep-brown/95 backdrop-blur-sm border border-rs-neon-teal/30 shadow-[0_0_15px_rgba(64,201,176,0.1)]',
    vintage: 'bg-rs-sand-light border-2 border-rs-desert-brown/30 shadow-md paper-texture',
  };

  return (
    <div
      className={cn(
        'rounded-2xl',
        variants[variant],
        hover && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-rs-terracotta/30',
        className
      )}
    >
      {children}
    </div>
  );
};