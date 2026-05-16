import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            borderColor: error ? 'var(--danger)' : undefined,
            ...style,
          }}
          {...props}
        />
        {error && (
          <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</p>
        )}
        {hint && !error && (
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;