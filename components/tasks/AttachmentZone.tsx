'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { Paperclip, Download, Upload } from 'lucide-react';

interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

interface Props {
  taskId: string;
  attachments: AttachmentItem[];
  onUploaded: (attachment: AttachmentItem) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return '🖼';
  if (mime === 'application/pdf') return '📄';
  if (mime.includes('word')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime === 'application/zip') return '🗜';
  return '📎';
}

export default function AttachmentZone({ taskId, attachments, onUploaded }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('taskId', taskId);

      const res = await fetch('/api/upload/attachment', { method: 'POST', body: fd });
      const text = await res.text();
      let json: { attachment?: AttachmentItem; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Upload server error');
      }
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      onUploaded(json.attachment!);
      toast(`${file.name} uploaded`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragOver ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'border-color 150ms ease, background 150ms ease',
          background: dragOver ? 'rgba(143,0,255,0.05)' : 'transparent',
          marginBottom: '10px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
        />
        <Upload size={16} color={dragOver ? 'var(--brand)' : 'var(--muted)'} style={{ margin: '0 auto 6px' }} />
        <p style={{ fontSize: '12px', color: uploading ? 'var(--brand)' : 'var(--muted)' }}>
          {uploading ? 'Uploading...' : 'Drop a file here or click to select'}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--border)', marginTop: '3px' }}>
          Max 10 MB · Images, PDF, Word, Excel, ZIP
        </p>
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{fileIcon(att.mimeType)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.fileName}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {formatBytes(att.fileSize)}
                </p>
              </div>
              <a
                href={`/api/download/attachment/${att.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color 150ms ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)')
                }
              >
                <Download size={11} />
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}