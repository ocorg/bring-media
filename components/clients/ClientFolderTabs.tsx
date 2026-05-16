'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Plus, ExternalLink, Clock } from 'lucide-react';

type Tab = 'overview' | 'projects' | 'activity';

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)',
  paused: 'var(--warning)',
  completed: 'var(--muted)',
  archived: 'var(--muted)',
};

interface ClientFolderTabsProps {
  client: any;
  canEdit: boolean;
  locale: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '4px' }}>
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', width: '140px', flexShrink: 0, paddingTop: '2px' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}

function AssetLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text)', textDecoration: 'none' }}>
      <ExternalLink size={12} />
      {label}
    </a>
  );
}

export default function ClientFolderTabs({ client, canEdit }: ClientFolderTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'projects', label: 'Projects', count: client.projects?.length },
    { key: 'activity', label: 'Activity', count: client.activityLogs?.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? '500' : '400',
              color: activeTab === tab.key ? 'var(--text)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--brand)' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'color 150ms ease',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '10px', background: 'var(--surface-2)', color: 'var(--muted)' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ maxWidth: '600px' }}>
          {(client.contactName || client.contactEmail || client.contactPhone) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <SectionTitle>Contact information</SectionTitle>
              <InfoRow label="Name" value={client.contactName} />
              <InfoRow label="Email" value={client.contactEmail} />
              <InfoRow label="Phone" value={client.contactPhone} />
              <InfoRow label="Retainer" value={client.retainerType} />
            </div>
          )}

          {(client.contractStart || client.contractEnd) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <SectionTitle>Contract details</SectionTitle>
              <InfoRow label="Start date" value={client.contractStart ? new Date(client.contractStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <InfoRow label="End date" value={client.contractEnd ? new Date(client.contractEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            </div>
          )}

          {(client.driveFolderUrl || client.brandKitUrl || client.websiteUrl) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <SectionTitle>Linked assets</SectionTitle>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                <AssetLink label="Drive folder" url={client.driveFolderUrl} />
                <AssetLink label="Brand kit" url={client.brandKitUrl} />
                <AssetLink label="Website" url={client.websiteUrl} />
              </div>
            </div>
          )}

          {client.internalNotes && (
            <div>
              <SectionTitle>Internal notes</SectionTitle>
              <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginTop: '8px' }}>
                {client.internalNotes}
              </p>
            </div>
          )}

          {!client.contactName && !client.contactEmail && !client.driveFolderUrl && !client.internalNotes && (
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No details added yet.</p>
          )}
        </div>
      )}

      {/* Projects */}
      {activeTab === 'projects' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: '1.25rem' }}>
              <Button variant="primary"><Plus size={14} />New project</Button>
            </div>
          )}
          {client.projects?.length === 0 ? (
            <EmptyState title="No projects yet" description="Projects for this client will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {client.projects?.map((project: any) => (
                <div key={project.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${project.serviceType?.color || 'var(--border)'}`, borderRadius: 'var(--radius-md)', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '3px' }}>{project.name}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{project.serviceType?.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <Badge label={project.status} color={PROJECT_STATUS_COLORS[project.status] || 'var(--muted)'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {activeTab === 'activity' && (
        <div style={{ maxWidth: '560px' }}>
          {client.activityLogs?.length === 0 ? (
            <EmptyState title="No activity yet" description="Actions on this client will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {client.activityLogs?.map((log: any, i: number) => (
                <div key={log.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Avatar name={log.actor?.name || '?'} size={28} />
                    {i < client.activityLogs.length - 1 && (
                      <div style={{ width: '1px', flex: 1, background: 'var(--border)', minHeight: '12px' }} />
                    )}
                  </div>
                  <div style={{ paddingTop: '4px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>
                      <strong>{log.actor?.name}</strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>{log.action.replace('client.', '').replace(/_/g, ' ')}</span>
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}