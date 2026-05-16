'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    border: '1px solid transparent',
    flexShrink: 0,
  } as React.CSSProperties,
  sizes: {
    sm: { fontSize: '12px', padding: '6px 12px', height: '32px' },
    md: { fontSize: '13px', padding: '8px 16px', height: '36px' },
    lg: { fontSize: '14px', padding: '10px 20px', height: '40px' },
  } as Record<string, React.CSSProperties>,
  variants: {
    primary: {
      background: 'var(--brand)',
      color: 'white',
      borderColor: 'var(--brand)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--text)',
      borderColor: 'var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--muted)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'rgba(239,68,68,0.1)',
      color: 'var(--danger)',
      borderColor: 'rgba(239,68,68,0.2)',
    },
  } as Record<string, React.CSSProperties>,
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, disabled, children, style, onMouseEnter, onMouseLeave, onMouseDown, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          ...styles.base,
          ...styles.sizes[size],
          ...styles.variants[variant],
          opacity: isDisabled ? 0.6 : 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
          onMouseLeave?.(e);
        }}
        onMouseDown={(e) => {
          if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
          onMouseDown?.(e);
        }}
        {...props}
      >
        {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
        {children}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;