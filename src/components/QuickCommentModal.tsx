'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { Task, CommentItem, getTaskComments } from '@/utils/taskUtils';
import { useSession } from 'next-auth/react';

interface QuickCommentModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function QuickCommentModal({ task, onClose }: QuickCommentModalProps) {
  const router = useRouter();
  const { addActivityLog } = useNotifications();
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (task) {
      setLocalComments(getTaskComments(task));
      const savedAuthor = localStorage.getItem('commentAuthor');
      if (savedAuthor) setCommentAuthor(savedAuthor);
    }
  }, [task]);

  const handleAddComment = async () => {
    const finalAuthor = session?.user?.name || commentAuthor;
    if (!newComment.trim() || !finalAuthor.trim()) {
      toast.error('Nama dan komentar tidak boleh kosong');
      return;
    }
    
    localStorage.setItem('commentAuthor', finalAuthor.trim());

    const comment: CommentItem = {
      id: Date.now().toString(),
      author: finalAuthor.trim(),
      text: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...localComments, comment];
    setLocalComments(updatedComments);
    setNewComment('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${task!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentsJson: JSON.stringify(updatedComments) })
      });
      if (!res.ok) throw new Error('Gagal menyimpan komentar');
      toast.success('Komentar berhasil dikirim');
      if (addActivityLog) addActivityLog('NEW_COMMENT', 'Komentar Baru', `Komentar ditambahkan oleh ${finalAuthor.trim()} pada pekerjaan "${task!.nama}"`, 'info');
      router.refresh();
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
    } catch(e) {
      toast.error('Gagal menyimpan komentar');
      setLocalComments(localComments); // revert
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 1100 }}>
        <motion.div 
          className="modal-content"
          style={{ maxWidth: '500px', width: '100%' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--accent-primary)" />
              Komentar: {task.nama}
            </h3>
            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose} title="Tutup">
              <X size={16} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {localComments.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Belum ada komentar untuk pekerjaan ini.</div>
            ) : (
              localComments.map(comment => (
                <div key={comment.id} style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{comment.author}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{comment.text}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Nama Anda..." 
              value={session?.user?.name || commentAuthor}
              readOnly
              style={{ fontSize: '13px', padding: '10px 12px', background: 'var(--surface-color)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea 
                className="input" 
                placeholder="Tulis komentar..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                style={{ flex: 1, resize: 'none', fontSize: '13px', padding: '10px 12px' }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim() || !(session?.user?.name || commentAuthor).trim()}
                style={{ padding: '0 16px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
