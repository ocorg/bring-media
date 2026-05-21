'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { User, Mail, Globe, Save } from 'lucide-react';

interface Props {
  user: { id: string; name: string; email: string };
}

export default function ProfileEditor({ user }: Props) {
  const t = useTranslations('settings.profile');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [name, setName] = useState(user.name ?? '');
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      toast(t('saved'), 'success');
      if (selectedLocale !== locale) {
        router.replace(pathname, { locale: selectedLocale });
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div style={{ maxWidth: '480px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)', marginBottom: '1.5rem' }}>
        {t('title')}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}><User size={12} />{t('name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}><Mail size={12} />{t('email')}</label>
          <input type="email" value={user.email} readOnly style={{ opacity: 0.5, cursor: 'not-allowed' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}><Globe size={12} />{t('language')}</label>
          <select value={selectedLocale} onChange={(e) => setSelectedLocale(e.target.value)}>
            <option value="en">{t('languages.en')}</option>
            <option value="fr">{t('languages.fr')}</option>
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '9px 20px', background: loading ? 'var(--surface-2)' : 'var(--brand)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, alignSelf: 'flex-start',
            transition: 'opacity 150ms ease',
          }}
        >
          <Save size={14} />
          {loading ? t('loading') : t('save')}
        </button>
      </div>
    </div>
  );
}