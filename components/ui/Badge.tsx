interface BadgeProps {
  label: string;
  color?: string;
  style?: React.CSSProperties;
}

export default function Badge({ label, color = 'var(--muted)', style }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 7px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '500',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: color,
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {label}
    </span>
  );
}