const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/tasks/TasksClient.tsx', 'utf8');

if (!content.includes('import BulkEditModal')) {
  content = content.replace(/(import TaskAddEditModal from '@\/components\/TaskAddEditModal';)/, "$1\nimport BulkEditModal from '@/components/BulkEditModal';");
  
  content = content.replace(/(const \[isModalOpen, setIsModalOpen\] = useState\(false\);)/, "$1\n  const [bulkEditField, setBulkEditField] = useState<'status' | 'kategori' | 'pic' | 'deskripsi' | null>(null);");
  
  // Now find the buttons
  const oldButtons = `<button 
                  className="btn" 
                  onClick={handleBulkDone}
                  style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                >
                  <CheckCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Tandai Selesai
                </button>`;
  
  const newButtons = `
                <button className="btn btn-secondary" onClick={() => setBulkEditField('status')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Status</button>
                <button className="btn btn-secondary" onClick={() => setBulkEditField('kategori')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Kategori</button>
                <button className="btn btn-secondary" onClick={() => setBulkEditField('pic')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah PIC</button>
                <button className="btn btn-secondary" onClick={() => setBulkEditField('deskripsi')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Deskripsi</button>
  `;
  
  content = content.replace(oldButtons, newButtons);
  
  // Then append the BulkEditModal component at the end of the file, just inside the main return wrapper
  content = content.replace(/(<TaskAddEditModal)/, `
        <BulkEditModal
          isOpen={!!bulkEditField}
          onClose={() => setBulkEditField(null)}
          selectedTaskIds={Array.from(selectedTasks)}
          field={bulkEditField}
          masterStatuses={masterStatuses}
          masterCats={masterCats}
          masterPics={masterPics}
          masterStatusProgress={masterStatusProgress}
          onSuccess={() => {
            setSelectedTasks(new Set());
            fetch('/api/tasks').then(r => r.json()).then(setTasks);
            refreshData();
          }}
        />
        $1`);
        
  fs.writeFileSync('src/app/(dashboard)/tasks/TasksClient.tsx', content);
  console.log('Successfully updated TasksClient.tsx');
}
