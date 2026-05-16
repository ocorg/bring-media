interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColor(name: string): string {
  const colors = ['#8f00ff', '#4e2f75', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function Avatar({ name, imageUrl, size = 32 }: AvatarProps) {
  const initials = getInitials(name);
  const bg = getColor(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: imageUrl ? 'transparent' : bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={name}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          width={size}
          height={size}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      ) : (
        <span style={{
          fontSize: `${Math.round(size * 0.38)}px`,
          fontWeight: '500',
          color: 'white',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {initials}
        </span>
      )}
    </div>
  );
}