import { Settings } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '440px', width: '100%' }}>

        {/* Spinning icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(143,0,255,0.08)',
            border: '1px solid rgba(143,0,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
            animation: 'maintenance-spin 4s linear infinite',
          }}
        >
          <Settings size={30} color="var(--brand)" />
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--brand)',
            background: 'rgba(143,0,255,0.1)',
            border: '1px solid rgba(143,0,255,0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '1.25rem',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--brand)',
              display: 'inline-block',
              animation: 'maintenance-pulse 1.5s ease-in-out infinite',
            }}
          />
          Scheduled maintenance
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: '0.75rem',
            lineHeight: '1.25',
            letterSpacing: '-0.02em',
          }}
        >
          We'll be right back.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: '1.65',
            marginBottom: '2rem',
          }}
        >
          The platform is undergoing scheduled maintenance.
          <br />
          Everything will be back up shortly.
        </p>

        {/* Divider */}
        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'var(--border)',
            margin: '0 auto 1.5rem',
          }}
        />

        {/* Contact note */}
        <p style={{ fontSize: '12px', color: 'var(--muted)', opacity: 0.65 }}>
          Need urgent access? Contact your manager.
        </p>

      </div>

      <style>{`
        @keyframes maintenance-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes maintenance-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}