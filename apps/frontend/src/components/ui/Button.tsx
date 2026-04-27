"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const BLACK = 'var(--border-color)';
const WHITE = 'var(--shadow-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const BG    = 'var(--bg)';
const FG    = 'var(--fg)';


export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, style, ...props }, ref) => {
    const bgMap: Record<string, string> = {
      primary: PUR,
      secondary: YLW,
      outline: 'transparent',
      ghost: 'transparent',
      mint: '#6ee7b7',
    };
    const colorMap: Record<string, string> = {
      primary: '#000000',
      secondary: '#000000',
      outline: FG,
      ghost: FG,
      mint: '#000000',
    };
    const sizeMap: Record<string, React.CSSProperties> = {
      sm: { padding: '8px 16px', fontSize: '0.65rem' },
      md: { padding: '12px 24px', fontSize: '0.75rem' },
      lg: { padding: '16px 32px', fontSize: '0.85rem' },
    };

    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      backgroundColor: bgMap[variant ?? 'primary'],
      color: colorMap[variant ?? 'primary'],
      border: `2.5px solid ${BLACK}`,
      boxShadow: `4px 4px 0px ${WHITE}`,
      cursor: 'pointer',
      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      ...sizeMap[size ?? 'md'],
      ...style,
    };

    return (
      <button
        ref={ref}
        style={base}
        disabled={isLoading || props.disabled}
        onMouseDown={e => { const el = e.currentTarget; el.style.transform = 'translate(4px,4px)'; el.style.boxShadow = `0px 0px 0px ${WHITE}`; }}
        onMouseUp={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = `4px 4px 0px ${WHITE}`; }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = `4px 4px 0px ${WHITE}`; }}
        {...props}
      >
        {isLoading ? (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
