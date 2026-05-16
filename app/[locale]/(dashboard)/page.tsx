import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  return (
    <div>
      <h1 style={{
        fontSize: '22px',
        fontWeight: '500',
        color: 'var(--text)',
        marginBottom: '8px',
      }}>
        {t('title')}
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
        Phase 6 will build the full dashboard here.
      </p>
    </div>
  );
}