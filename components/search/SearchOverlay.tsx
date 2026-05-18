'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '@/lib/i18n/navigation';
import { Search, Building2, FolderKanban, CheckSquare, X } from 'lucide-react';

interface SearchClient {
  id: string;
  name: string;
  industry: string | null;
  healthStatus: string;
}

interface SearchProject {
  id: string;
  name: string;
  status: string;
  serviceType: { name: string; color: string };
  client: { name: string };
}

interface SearchTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  project: { id: string; name: string };
}

interface Results {
  clients: SearchClient[];
  projects: SearchProject[];
  tasks: SearchTask[];
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--muted)',
  low: 'var(--border)',
};

export default function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results>({ clients: [], projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Flatten all results for keyboard nav
  const allItems: Array<{ type: 'client' | 'project' | 'task'; id: string; projectId?: string }> = [
    ...results.clients.map((c) => ({ type: 'client' as const, id: c.id })),
    ...results.projects.map((p) => ({ type: 'project' as const, id: p.id })),
    ...results.tasks.map((t) => ({ type: 'task' as const, id: t.id, projectId: t.project.id })),
  ];

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ clients: [], projects: [], tasks: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setFocusedIndex(0);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Custom event from Topbar button
  useEffect(() => {
    function onOpen() { setOpen(true); }
    document.addEventListener('bring:search:open', onOpen);
    return () => document.removeEventListener('bring:search:open', onOpen);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults({ clients: [], projects: [], tasks: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function navigate(item: typeof allItems[number]) {
    setOpen(false);
    if (item.type === 'client') router.push(`/clients/${item.id}` as `/${string}`);
    if (item.type === 'project') router.push(`/projects/${item.id}` as `/${string}`);
    if (item.type === 'task') router.push(`/projects/${item.projectId}` as `/${string}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, allItems.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && allItems[focusedIndex]) {
      navigate(allItems[focusedIndex]);
    }
  }

  const totalResults = allItems.length;
  const hasResults = totalResults > 0;

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            padding: '12vh 1rem 0',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Input row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                borderBottom: hasResults || loading ? '1px solid var(--border)' : 'none',
              }}
            >
              <Search size={16} color="var(--muted)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search clients, projects, tasks..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: 'var(--text)',
                }}
              />
              {loading && (
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Searching...</span>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            {hasResults && (
              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>

                {/* Clients */}
                {results.clients.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 16px 4px' }}>
                      Clients
                    </p>
                    {results.clients.map((c) => {
                      const idx = globalIndex++;
                      return (
                        <button
                          key={c.id}
                          onClick={() => navigate({ type: 'client', id: c.id })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '10px 16px',
                            background: focusedIndex === idx ? 'rgba(143,0,255,0.08)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 100ms ease',
                          }}
                          onMouseEnter={() => setFocusedIndex(idx)}
                        >
                          <Building2 size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{c.name}</p>
                            {c.industry && <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{c.industry}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 16px 4px' }}>
                      Projects
                    </p>
                    {results.projects.map((p) => {
                      const idx = globalIndex++;
                      return (
                        <button
                          key={p.id}
                          onClick={() => navigate({ type: 'project', id: p.id })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '10px 16px',
                            background: focusedIndex === idx ? 'rgba(143,0,255,0.08)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 100ms ease',
                          }}
                          onMouseEnter={() => setFocusedIndex(idx)}
                        >
                          <FolderKanban size={14} color={p.serviceType.color} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.client.name} · {p.serviceType.name}</p>
                          </div>
                          <span style={{ fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', flexShrink: 0 }}>{p.status}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 16px 4px' }}>
                      Tasks
                    </p>
                    {results.tasks.map((t) => {
                      const idx = globalIndex++;
                      return (
                        <button
                          key={t.id}
                          onClick={() => navigate({ type: 'task', id: t.id, projectId: t.project.id })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '10px 16px',
                            background: focusedIndex === idx ? 'rgba(143,0,255,0.08)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 100ms ease',
                          }}
                          onMouseEnter={() => setFocusedIndex(idx)}
                        >
                          <div
                            style={{
                              width: '3px',
                              height: '28px',
                              borderRadius: '2px',
                              background: PRIORITY_COLORS[t.priority] ?? 'var(--muted)',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{t.project.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ height: '8px' }} />
              </div>
            )}

            {/* Empty state */}
            {query.length >= 2 && !loading && !hasResults && (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem' }}>
                No results for &ldquo;{query}&rdquo;
              </p>
            )}

            {/* Footer hint */}
            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '16px',
                background: 'var(--bg)',
              }}
            >
              {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([key, label]) => (
                <span key={key} style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{ fontSize: '10px', padding: '1px 5px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px' }}>{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}