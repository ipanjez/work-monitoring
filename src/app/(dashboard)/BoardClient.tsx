'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import TaskDetailModal from '@/components/TaskDetailModal';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import QuickCommentModal from '@/components/QuickCommentModal';
import { Paperclip, MessageSquare, ArrowUpDown, Search, Filter, History, CheckSquare, Minimize2, Maximize2 } from 'lucide-react';
import { useFilter } from '@/context/FilterContext';
import { getTaskComments, getTaskFiles, getHistoryLogs, getDynamicBadgeStyle } from '@/utils/taskUtils';

export default function BoardClient({ tasks: initialTasks }: { tasks: any[] }) {
  const router = useRouter();
  const { globalTargetFilter, globalPicFilter, globalCustomStartDate, globalCustomEndDate } = useFilter();
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [commentTask, setCommentTask] = useState<any | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);

  const [formPicOptions, setFormPicOptions] = useState<string[]>([]);
  const [formCategoryOptions, setFormCategoryOptions] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'Manual' | 'Deadline' | 'Prioritas' | 'Abjad'>('Manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);

  const toggleCollapse = (column: string) => {
    setCollapsedColumns(prev => prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_pics) setFormPicOptions(data.master_pics);
        if (data.master_categories) setFormCategoryOptions(data.master_categories);
        if (data.master_statuses) setMasterStatuses(data.master_statuses);
        if (data.master_priorities) setMasterPriorities(data.master_priorities);
      })
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverColumn = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverCard = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    setDragOverCardId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverColumn(null);
    setDragOverCardId(null);
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Pekerjaan berhasil dihapus');
      setIsDetailOpen(false);
      setSelectedTask(null);
      setTasks(prev => prev.filter(t => t.id !== id));
      router.refresh();
    } catch (e) {
      toast.error('Gagal menghapus pekerjaan');
    }
  };

  const saveReorder = async (updatedColumnTasks: any[]) => {
    // Generate order indexes: 0, 1, 2...
    const updates = updatedColumnTasks.map((t, idx) => ({ id: t.id, orderIndex: idx }));
    try {
      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      router.refresh();
    } catch (e) {
      console.error('Failed to save reorder', e);
    }
  };

  const handleDropColumn = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverCardId(null);
    
    if (sortBy !== 'Manual') {
      setSortBy('Manual');
      toast('Berubah ke mode urutan manual', { icon: 'ℹ️' });
    }

    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);

    if (!taskId || isNaN(taskId)) return;

    const taskToUpdate = tasks.find((t: any) => t.id === taskId);
    if (!taskToUpdate) return;

    const previousTasks = [...tasks];
    let updatedTasks = [...tasks];
    
    updatedTasks = updatedTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    try {
      if (taskToUpdate.status !== newStatus) {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        toast.success(`Tugas dipindah ke ${newStatus}`);
      }
      
      const colTasks = updatedTasks.filter(t => t.status === newStatus).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      const taskInCol = colTasks.find(t => t.id === taskId);
      const otherTasksInCol = colTasks.filter(t => t.id !== taskId);
      const finalColTasks = [...otherTasksInCol, taskInCol]; // Appended to end
      
      setTasks(prev => prev.map(t => {
        const idx = finalColTasks.findIndex(ft => ft.id === t.id);
        return idx !== -1 ? { ...t, orderIndex: idx, status: t.id === taskId ? newStatus : t.status } : t;
      }));
      
      saveReorder(finalColTasks);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status');
      setTasks(previousTasks); 
    }
    setDraggedTaskId(null);
  };

  const handleDropCard = async (e: React.DragEvent, newStatus: string, targetCardId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setDragOverCardId(null);
    
    if (sortBy !== 'Manual') {
      setSortBy('Manual');
      toast('Berubah ke mode urutan manual', { icon: 'ℹ️' });
    }

    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);

    if (!taskId || isNaN(taskId) || taskId === targetCardId) return;

    const taskToUpdate = tasks.find((t: any) => t.id === taskId);
    if (!taskToUpdate) return;

    const previousTasks = [...tasks];
    let updatedTasks = [...tasks].map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    
    let colTasks = updatedTasks.filter(t => t.status === newStatus).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    const draggedTask = colTasks.find(t => t.id === taskId);
    colTasks = colTasks.filter(t => t.id !== taskId);
    
    const targetIndex = colTasks.findIndex(t => t.id === targetCardId);
    if (targetIndex !== -1) {
      colTasks.splice(targetIndex, 0, draggedTask);
    } else {
      colTasks.push(draggedTask);
    }

    setTasks(prev => prev.map(t => {
      const idx = colTasks.findIndex(ft => ft.id === t.id);
      return idx !== -1 ? { ...t, orderIndex: idx, status: t.id === taskId ? newStatus : t.status } : t;
    }));

    try {
      if (taskToUpdate.status !== newStatus) {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        toast.success(`Tugas dipindah ke ${newStatus}`);
      }
      saveReorder(colTasks);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui urutan');
      setTasks(previousTasks); 
    }
    setDraggedTaskId(null);
  };

  const openTaskDetail = (task: any) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const openTaskEdit = (task: any) => {
    let repetisiValue = task.repetisi || 'Tidak Berulang';
    let customRecurrenceSettings = { every: 1, unit: 'Minggu', days: [] as string[], endType: 'never', endDate: new Date().toISOString().split('T')[0], endOccurrences: 1 };
    
    if (repetisiValue.startsWith('CUSTOM_RECURRENCE:')) {
      try {
        customRecurrenceSettings = JSON.parse(repetisiValue.replace('CUSTOM_RECURRENCE:', ''));
        repetisiValue = 'Custom';
      } catch (e) {}
    }

    let parsedSubTasks: any[] = [];
    if (task.subTasksJson) {
      try { parsedSubTasks = JSON.parse(task.subTasksJson); } catch (e) {}
    }

    let parsedFiles: any[] = [];
    if (task.filesJson) {
        try { parsedFiles = JSON.parse(task.filesJson); } catch (e) {}
    } else if (task.fileUrl) {
        parsedFiles = [{ url: task.fileUrl, name: task.fileName || 'Attachment' }];
    }

    let parsedPics: string[] = [];
    if (task.additionalPics) {
        try { parsedPics = JSON.parse(task.additionalPics); } catch (e) {}
    }

    setSelectedTask({
      ...task,
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
      filesList: parsedFiles,
      additionalPicsList: parsedPics,
      subTasksList: parsedSubTasks
    });

    setIsDetailOpen(false);
    setIsEditOpen(true);
  };

  const getSubtaskStats = (subTasksJson: string | null) => {
    if (!subTasksJson) return null;
    try {
      const subtasks = JSON.parse(subTasksJson);
      if (!Array.isArray(subtasks) || subtasks.length === 0) return null;
      const doneCount = subtasks.filter((s: any) => s.status === 'Done').length;
      return { total: subtasks.length, done: doneCount };
    } catch {
      return null;
    }
  };

  const getPriorityWeight = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 4;
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Cari Tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', width: '120px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Filter size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Kategori:</span>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: 'var(--background)' }}>Semua Kategori</option>
            {['Umum', 'IT', 'HR', 'Finance', 'Logistik', 'Operasional', 'Marketing', 'Produksi', ...formCategoryOptions]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map(c => <option key={c} value={c} style={{ background: 'var(--background)' }}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <ArrowUpDown size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Urutkan:</span>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Manual" style={{ background: 'var(--background)' }}>Urutan Manual</option>
            <option value="Deadline" style={{ background: 'var(--background)' }}>Tenggat Waktu</option>
            <option value="Prioritas" style={{ background: 'var(--background)' }}>Prioritas</option>
            <option value="Abjad" style={{ background: 'var(--background)' }}>Abjad (Nama)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', flex: 1, height: 'calc(100vh - 230px)', alignItems: 'stretch' }}>
        {(masterStatuses.length > 0 ? masterStatuses : ['To Do', 'In Progress', 'Review', 'Done']).map((col) => {
          let columnTasks = tasks.filter((t: any) => {
            if (t.status !== col) return false;
            
            const matchSearch = t.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                t.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchCategory = filterCategory === 'All' || (t.kategori || 'Umum') === filterCategory;

            const matchPic = globalPicFilter === 'Semua PIC' || t.pic === globalPicFilter || (
              t.additionalPics ? (() => {
                try {
                  const arr = JSON.parse(t.additionalPics);
                  return Array.isArray(arr) && arr.includes(globalPicFilter);
                } catch(e) { return false; }
              })() : false
            );

            const taskEnd = new Date(t.endDate).getTime();
            const taskStart = new Date(t.startDate).getTime();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            let startBoundary = today.getTime();
            let endBoundary = today.getTime() + 86400000 - 1;

            if (globalTargetFilter === 'Minggu Ini') {
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1);
              const monday = new Date(new Date(today).setDate(diff));
              startBoundary = monday.getTime();
              endBoundary = startBoundary + (7 * 86400000) - 1;
            } else if (globalTargetFilter === 'Bulan Ini') {
              startBoundary = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
              endBoundary = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
            } else if (globalTargetFilter === 'Custom' && globalCustomStartDate && globalCustomEndDate) {
              startBoundary = new Date(globalCustomStartDate).getTime();
              endBoundary = new Date(globalCustomEndDate).setHours(23, 59, 59, 999);
            }

            let matchDate = false;
            if (globalTargetFilter === 'Semua Waktu' || (globalTargetFilter === 'Custom' && (!globalCustomStartDate || !globalCustomEndDate))) {
              matchDate = true;
            } else {
              if (taskStart <= endBoundary && taskEnd >= startBoundary) {
                  matchDate = true;
              }
            }
            
            return matchSearch && matchCategory && matchPic && matchDate;
          });

          // Sort tasks
          columnTasks = columnTasks.sort((a, b) => {
            if (sortBy === 'Manual') {
              return (a.orderIndex || 0) - (b.orderIndex || 0);
            } else if (sortBy === 'Deadline') {
              return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            } else if (sortBy === 'Prioritas') {
              return getPriorityWeight(b.prioritas || '') - getPriorityWeight(a.prioritas || '');
            } else if (sortBy === 'Abjad') {
              return a.nama.localeCompare(b.nama);
            }
            return 0;
          });

          const isDragOverCol = dragOverColumn === col;
          const isCollapsed = collapsedColumns.includes(col);

          return (
            <div
              key={col}
              className="kanban-col glass"
              onDragOver={(e) => !isCollapsed ? handleDragOverColumn(e, col) : undefined}
              onDragLeave={!isCollapsed ? handleDragLeave : undefined}
              onDrop={(e) => !isCollapsed ? handleDropColumn(e, col) : undefined}
              style={{
                backgroundColor: isDragOverCol ? 'var(--background)' : 'var(--surface-color)',
                border: isDragOverCol ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                width: isCollapsed ? '60px' : '320px',
                minWidth: isCollapsed ? '60px' : '320px',
                transition: 'width 0.2s, min-width 0.2s',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: isCollapsed ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '8px',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isCollapsed ? 'column' : 'row' }}>
                  <h3 style={{ 
                    fontSize: '15px', 
                    fontWeight: 'bold', 
                    color: 'var(--text-primary)',
                    writingMode: isCollapsed ? 'vertical-rl' : 'horizontal-tb',
                    transform: isCollapsed ? 'rotate(180deg)' : 'none',
                    margin: isCollapsed ? '8px 0' : '0'
                  }}>
                    {col}
                  </h3>
                  <span style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {columnTasks.length}
                  </span>
                </div>
                <button 
                  onClick={() => toggleCollapse(col)}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                    padding: '4px', borderRadius: '4px'
                  }}
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
              </div>

              {!isCollapsed && columnTasks.map((task: any) => {
                const subStats = getSubtaskStats(task.subTasksJson);
                const isDragged = draggedTaskId === task.id;
                const isDragOverThisCard = dragOverCardId === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragOver={(e) => handleDragOverCard(e, task.id)}
                    onDrop={(e) => handleDropCard(e, col, task.id)}
                    onClick={() => openTaskDetail(task)}
                    style={{
                      backgroundColor: 'var(--background)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: isDragOverThisCard ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                      cursor: 'grab',
                      opacity: isDragged ? 0.5 : 1,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'transform 0.1s',
                      marginTop: isDragOverThisCard ? '20px' : '0px'
                    }}
                    onDragEnd={() => setDraggedTaskId(null)}
                  >
                      {/* Card Content Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span {...getDynamicBadgeStyle('priority', task.prioritas || 'Medium', 'badge badge-medium')}>
                          {task.prioritas || 'Medium'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {new Date(task.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                        {task.nama}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                          
                          {/* Subtasks Count */}
                          {subStats && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: subStats.done === subStats.total ? 'var(--success)' : 'inherit' }} title="Sub-Tugas">
                              <CheckSquare size={14} /> {subStats.done}/{subStats.total}
                            </div>
                          )}

                          {/* Files Count */}
                          {getTaskFiles(task).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} title={`${getTaskFiles(task).length} File Lampiran`}>
                              <Paperclip size={14} /> {getTaskFiles(task).length}
                            </div>
                          )}

                          {/* Comments Count */}
                          <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommentTask(task);
                            }}
                            className="hover-bg-surface"
                            title={`${getTaskComments(task).length} Komentar`}
                          >
                            <MessageSquare size={14} />
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{getTaskComments(task).length || ''}</span>
                          </div>

                          {/* Activity Timeline Count */}
                          {getHistoryLogs(task).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} title={`${getHistoryLogs(task).length} Riwayat Aktivitas`}>
                              <History size={14} /> {getHistoryLogs(task).length}
                            </div>
                          )}

                        </div>
                      <div 
                        title={task.pic}
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--accent-primary)', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '10px', 
                          fontWeight: 'bold' 
                        }}
                      >
                        {task.pic.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}

              {columnTasks.length === 0 && !isCollapsed && (
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Tarik tugas ke sini
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isDetailOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setIsDetailOpen(false)}
          onEdit={() => openTaskEdit(selectedTask)}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          setPreviewFile={(file: any) => window.open(file.url, '_blank')}
        />
      )}

      {isEditOpen && selectedTask && (
        <TaskAddEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          taskToEdit={selectedTask}
          onSave={async (payload: any) => {
            const res = await fetch(`/api/tasks/${selectedTask.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to update task');
            setIsEditOpen(false);
            router.refresh();
          }}
          formPicOptions={formPicOptions}
          formCategoryOptions={formCategoryOptions}
          formStatusOptions={masterStatuses}
          formPriorityOptions={masterPriorities}
          setPreviewFile={(file: any) => window.open(file.url, '_blank')}
        />
      )}

      {commentTask && (
        <QuickCommentModal 
          task={commentTask}
          onClose={() => setCommentTask(null)}
        />
      )}
    </div>
  );
}

function ListTodoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14h6" />
      <path d="M14 19h6" />
      <path d="M14 9h6" />
      <path d="M4 14h.01" />
      <path d="M4 19h.01" />
      <path d="M4 9h.01" />
      <path d="M8 14h.01" />
      <path d="M8 19h.01" />
      <path d="M8 9h.01" />
    </svg>
  );
}
