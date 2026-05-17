'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { addComment, editComment, deleteComment } from '@/lib/actions/tasks';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Pencil, Trash2, Check, X } from 'lucide-react';

interface CommentItem {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; avatarUrl: string | null };
}

interface Props {
  taskId: string;
  comments: CommentItem[];
  currentUserId: string;
  currentUserRole: string;
  onCommentsChange: (comments: CommentItem[]) => void;
}

function isEdited(comment: CommentItem) {
  return (
    new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 5000
  );
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CommentThread({
  taskId,
  comments,
  currentUserId,
  currentUserRole,
  onCommentsChange,
}: Props) {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const isManager = currentUserRole === 'manager' || currentUserRole === 'super_admin';

  async function handlePost() {
    if (!content.trim()) return;
    setPosting(true);
    const res = await addComment(taskId, content);
    setPosting(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    // Optimistic: append a placeholder — real data on next drawer open
    const newComment: CommentItem = {
      id: res.data!.commentId,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: currentUserId, name: 'You', avatarUrl: null },
    };
    onCommentsChange([...comments, newComment]);
    setContent('');
  }

  async function handleEditSave(id: string) {
    if (!editContent.trim()) return;
    const res = await editComment(id, editContent);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    onCommentsChange(
      comments.map((c) =>
        c.id === id ? { ...c, content: editContent.trim(), updatedAt: new Date() } : c
      )
    );
    setEditingId(null);
    toast('Comment updated', 'success');
  }

  async function handleDelete(id: string) {
    const res = await deleteComment(id);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    onCommentsChange(comments.filter((c) => c.id !== id));
    toast('Comment deleted', 'success');
  }

  return (
    <div>
      {/* Thread */}
      {comments.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
          No comments yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
          {comments.map((comment) => {
            const isOwn = comment.author.id === currentUserId;
            const canEdit = isOwn;
            const canDelete = isManager;

            return (
              <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                  <Avatar name={comment.author.name} size={26} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>
                      {comment.author.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                      {timeAgo(comment.createdAt)}
                    </span>
                    {isEdited(comment) && (
                      <span style={{ fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic' }}>
                        edited
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    {canEdit && editingId !== comment.id && (
                      <button
                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', display: 'flex' }}
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px', display: 'flex', opacity: 0.6 }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.6')}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        autoFocus
                        style={{ width: '100%', fontSize: '12px', resize: 'vertical', marginBottom: '6px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEditSave(comment.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '2px', display: 'flex' }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', display: 'flex' }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New comment input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          style={{ flex: 1, fontSize: '12px', resize: 'vertical' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
          }}
        />
        <Button variant="primary" size="sm" loading={posting} onClick={handlePost}>
          Post
        </Button>
      </div>
      <p style={{ fontSize: '10px', color: 'var(--border)', marginTop: '4px' }}>
        ⌘ + Enter to post
      </p>
    </div>
  );
}