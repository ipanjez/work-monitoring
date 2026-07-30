'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import TaskDetailModal from '@/components/TaskDetailModal';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import { Paperclip, MessageSquare } from 'lucide-react';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];

export default function BoardClient({ tasks: initialTasks }: { tasks: any[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const [formPicOptions, setFormPicOptions] = useState<string[]>([]);
  const [formCategoryOptions, setFormCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_pics) setFormPicOptions(data.master_pics);
        if (data.master_categories) setFormCategoryOptions(data.master_categories);
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

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);

    if (!taskId || isNaN(taskId)) return;

    const taskToUpdate = tasks.find((t: any) => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t: any) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Tugas dipindah ke ${newStatus}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status');
      setTasks(previousTasks); // Revert on failure
    }
    setDraggedTaskId(null);
  };

  const openTaskDetail = (task: any) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const openTaskEdit = (task: any) => {
    setSelectedTask(task);
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

  return (
    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', flex: 1, height: 'calc(100vh - 180px)', alignItems: 'stretch' }}>
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t: any) => t.status === col);
        const isDragOver = dragOverColumn === col;

        return (
          <div
            key={col}
            className="kanban-col"
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col)}
            style={{
              backgroundColor: isDragOver ? 'var(--background)' : 'var(--surface-color)',
              border: isDragOver ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {col}
              </h3>
              <span style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {colTasks.length}
              </span>
            </div>

            {colTasks.map((task: any) => {
              const subStats = getSubtaskStats(task.subTasksJson);
              const isDragged = draggedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => openTaskDetail(task)}
                  style={{
                    backgroundColor: 'var(--background)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    cursor: 'grab',
                    opacity: isDragged ? 0.5 : 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'transform 0.1s',
                  }}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontWeight: 'bold',
                      backgroundColor: task.prioritas === 'Urgent' ? 'rgba(239, 68, 68, 0.1)' : task.prioritas === 'High' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 137, 0.1)',
                      color: task.prioritas === 'Urgent' ? 'var(--danger)' : task.prioritas === 'High' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {task.prioritas || 'Medium'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(task.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                    {task.nama}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      {task.fileUrl && <Paperclip size={14} />}
                      {subStats && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: subStats.done === subStats.total ? 'var(--success)' : 'inherit' }}>
                          <ListTodoIcon /> {subStats.done}/{subStats.total}
                        </div>
                      )}
                      {task.catatan && <MessageSquare size={14} />}
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

            {colTasks.length === 0 && (
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                Tarik tugas ke sini
              </div>
            )}
          </div>
        );
      })}

      {isDetailOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setIsDetailOpen(false)}
          onEdit={() => openTaskEdit(selectedTask)}
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
          setPreviewFile={(file: any) => window.open(file.url, '_blank')}
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
