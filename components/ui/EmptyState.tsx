interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '1px',
        height: '40px',
        background: 'var(--border)',
        marginBottom: '8px',
      }} />
      <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '300px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}