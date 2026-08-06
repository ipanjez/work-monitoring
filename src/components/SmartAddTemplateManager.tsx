import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Copy, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Template {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  lastUpdatedByName?: string;
}

interface SmartAddTemplateManagerProps {
  onCopy: (content: string) => void;
}

export default function SmartAddTemplateManager({ onCopy }: SmartAddTemplateManagerProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || (session?.user as any)?.npk || 'Unknown';
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/smart-add-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };
  
  const saveTemplates = async (newTemplates: Template[]) => {
    try {
      await fetch('/api/smart-add-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: newTemplates })
      });
      setTemplates(newTemplates);
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleAddSave = async () => {
    if (!editingTemplate || !editingTemplate.name.trim() || !editingTemplate.content.trim()) return;
    
    const now = new Date().toISOString();
    let newTemplates = [...templates];
    
    if (isAdding) {
      const newTpl: Template = {
        ...editingTemplate,
        id: 'tpl-' + Date.now(),
        isDefault: false,
        orderIndex: templates.length,
        createdAt: now,
        updatedAt: now,
        createdByName: userName,
        lastUpdatedByName: userName
      };
      newTemplates.push(newTpl);
    } else {
      newTemplates = newTemplates.map(t => {
        if (t.id === editingTemplate.id) {
          return {
            ...t,
            name: editingTemplate.name,
            content: editingTemplate.content,
            updatedAt: now,
            lastUpdatedByName: userName
          };
        }
        return t;
      });
    }
    
    await saveTemplates(newTemplates);
    setEditingTemplate(null);
    setIsAdding(false);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;
    const newTemplates = templates.filter(t => t.id !== id);
    await saveTemplates(newTemplates);
  };
  
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === templates.length - 1) return;
    
    const newTemplates = [...templates];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newTemplates[index];
    newTemplates[index] = newTemplates[swapIndex];
    newTemplates[swapIndex] = temp;
    
    // Update orderIndex
    newTemplates.forEach((t, i) => {
      t.orderIndex = i;
    });
    
    await saveTemplates(newTemplates);
  };
  
  const formatDate = (isoString: string) => {
    try {
      return format(new Date(isoString), 'dd MMM yyyy HH:mm', { locale: id });
    } catch {
      return isoString;
    }
  };
  
  if (editingTemplate) {
    return (
      <div style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          {isAdding ? 'Tambah Template Baru' : 'Edit Template'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama Template</label>
            <input 
              className="input" 
              value={editingTemplate.name} 
              onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} 
              placeholder="Contoh: Format Rapat Bulanan"
              style={{ width: '100%', padding: '6px 10px', marginTop: '4px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Isi Template</label>
            <textarea 
              className="input" 
              value={editingTemplate.content} 
              onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})} 
              placeholder="Masukkan format teks..."
              style={{ width: '100%', padding: '6px 10px', marginTop: '4px', minHeight: '150px', fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setEditingTemplate(null); setIsAdding(false); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleAddSave} disabled={!editingTemplate.name.trim() || !editingTemplate.content.trim()}>
              <Save size={16} /> Simpan Template
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Template Cepat</h3>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            setIsAdding(true);
            setEditingTemplate({ id: '', name: '', content: '', isDefault: false, orderIndex: 0, createdAt: '', updatedAt: '' });
          }}
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          <Plus size={14} /> Tambah Template
        </button>
      </div>
      
      {isLoading ? (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Memuat template...</div>
      ) : templates.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tidak ada template tersedia.</div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {templates.map((tpl, idx) => (
            <div key={tpl.id} style={{ 
              minWidth: '280px', 
              background: 'var(--surface-color)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tpl.name}
                    {tpl.isDefault && <span style={{ fontSize: '10px', background: 'var(--accent-primary)', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>Default</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Oleh: {tpl.createdByName || 'Unknown'} • {formatDate(tpl.createdAt)}
                  </div>
                  {!tpl.isDefault && tpl.updatedAt !== tpl.createdAt && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Diperbarui: {tpl.lastUpdatedByName || 'Unknown'} • {formatDate(tpl.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'var(--bg-color)', padding: '8px', borderRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {tpl.content}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleReorder(idx, 'up')} 
                    disabled={idx === 0}
                    style={{ padding: '4px', height: '24px', width: '24px' }}
                    title="Geser ke Kiri"
                  >
                    <ArrowUp size={12} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleReorder(idx, 'down')} 
                    disabled={idx === templates.length - 1}
                    style={{ padding: '4px', height: '24px', width: '24px' }}
                    title="Geser ke Kanan"
                  >
                    <ArrowDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                  {!tpl.isDefault && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => { setIsAdding(false); setEditingTemplate(tpl); }}
                        style={{ padding: '4px', height: '24px', width: '24px' }}
                        title="Edit"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleDelete(tpl.id)}
                        style={{ padding: '4px', height: '24px', width: '24px', color: 'var(--danger)' }}
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => onCopy(tpl.content)}
                  style={{ padding: '4px 10px', fontSize: '11px', height: '24px' }}
                >
                  <Copy size={12} /> Salin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
