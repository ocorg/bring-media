interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-md)',
  style,
}: SkeletonProps) {
  return (
    <>
      <div
        style={{
          width,
          height,
          borderRadius,
          background: 'var(--surface)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
          ...style,
        }}
      />
      <style>{`
        @keyframes skeleton-pulse {
          0% { background-color: var(--surface); }
          50% { background-color: var(--surface-2); }
          100% { background-color: var(--surface); }
        }
      `}</style>
    </>
  );
}