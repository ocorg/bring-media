import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export default function Spinner({ size = 20, color = 'var(--brand)' }: SpinnerProps) {
  return (
    <>
      <Loader2
        size={size}
        color={color}
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}