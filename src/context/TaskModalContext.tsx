'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Task, FileItem, SubTask, getTaskFiles, getAdditionalPics, safeParseSubTasks, safeFormatDate } from '@/utils/taskUtils';
import TaskDetailModal from '@/components/TaskDetailModal';
import TaskAddEditModal, { EditingTaskType } from '@/components/TaskAddEditModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/permissions';
import { useMaster } from '@/context/MasterContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';

interface TaskModalContextType {
  openDetail: (task: Task) => void;
  closeDetail: () => void;
  openEdit: (task: Task) => void;
  openDuplicate: (task: Task) => void;
  openCreate: (defaultValues?: Partial<Task>) => void;
  deleteTask: (taskOrId: Task | string | number) => Promise<boolean>;
  openPreviewFile: (file: { name: string; url: string }) => void;
  closePreviewFile: () => void;
  selectedDetailTask: Task | null;
}

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export function TaskModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { masterPics, masterCats, masterStatuses, masterPriorities, roleConfig } = useMaster();
  const { theme } = useTheme();
  const { addActivityLog } = useNotifications();

  const userRole = (session?.user as any)?.role || '';

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<EditingTaskType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

  const openDetail = (task: Task) => {
    if (!task) return;
    setIsEditModalOpen(false);
    setEditingTask(null);
    setDetailTask(task);
  };

  const closeDetail = () => {
    setDetailTask(null);
  };

  const openEdit = (task: Task) => {
    if (!hasPermission(roleConfig, 'manage_task', userRole)) {
      toast.error('Akses ditolak: Anda tidak memiliki izin untuk mengedit data pekerjaan.');
      return;
    }
    setDetailTask(null);
    let repetisiValue = task.repetisi || 'Tidak Berulang';
    let parsedSubTasks: SubTask[] = safeParseSubTasks(task.subTasksJson);

    const startStr = task.startDate 
      ? (typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0]) 
      : new Date().toISOString().split('T')[0];
    const endStr = task.endDate 
      ? (typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0]) 
      : new Date().toISOString().split('T')[0];

    let customRecurrenceSettings = undefined;
    if (repetisiValue.startsWith('CUSTOM_RECURRENCE:')) {
      try {
        let parsed = JSON.parse(repetisiValue.replace('CUSTOM_RECURRENCE:', ''));
        while (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        customRecurrenceSettings = parsed;
        repetisiValue = 'Custom';
      } catch (e) {}
    }

    setEditingTask({
      ...task,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      subTasksList: parsedSubTasks,
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: startStr,
      endDate: endStr,
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
  };

  const openDuplicate = (task: Task) => {
    if (!hasPermission(roleConfig, 'manage_task', userRole)) {
      toast.error('Akses ditolak: Anda tidak memiliki izin untuk menduplikasi pekerjaan.');
      return;
    }
    setDetailTask(null);
    let repetisiValue = task.repetisi || 'Tidak Berulang';
    const parsedSubTasks: SubTask[] = safeParseSubTasks(task.subTasksJson).map((st: any) => ({
      ...st,
      id: Math.random().toString(36).substring(2, 9),
    }));

    const startStr = task.startDate 
      ? (typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0]) 
      : new Date().toISOString().split('T')[0];
    const endStr = task.endDate 
      ? (typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0]) 
      : new Date().toISOString().split('T')[0];

    let customRecurrenceSettings = undefined;
    if (repetisiValue.startsWith('CUSTOM_RECURRENCE:')) {
      try {
        let parsed = JSON.parse(repetisiValue.replace('CUSTOM_RECURRENCE:', ''));
        while (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        customRecurrenceSettings = parsed;
        repetisiValue = 'Custom';
      } catch (e) {}
    }

    setEditingTask({
      nama: task.nama,
      pic: task.pic,
      status: task.status || 'To Do',
      prioritas: task.prioritas || 'Medium',
      kategori: task.kategori || 'Umum',
      progress: task.progress || 0,
      deskripsi: task.deskripsi || '',
      catatan: task.catatan || '',
      lokasi: task.lokasi,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      subTasksList: parsedSubTasks,
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: startStr,
      endDate: endStr,
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
    toast.success('Pekerjaan berhasil diduplikasi. Silakan edit dan klik Simpan.');
  };

  const openCreate = (defaultValues?: Partial<Task>) => {
    if (!hasPermission(roleConfig, 'manage_task', userRole)) {
      toast.error('Akses ditolak: Anda tidak memiliki izin untuk menambah data pekerjaan.');
      return;
    }
    setDetailTask(null);
    const todayStr = new Date().toISOString().split('T')[0];
    setEditingTask({
      nama: '',
      pic: masterPics.length > 0 ? masterPics[0] : '',
      status: 'To Do',
      prioritas: 'Medium',
      kategori: masterCats.length > 0 ? masterCats[0] : 'Umum',
      progress: 0,
      deskripsi: '',
      catatan: '',
      filesList: [],
      additionalPicsList: [],
      subTasksList: [],
      isAllDay: false,
      startTime: '',
      endTime: '',
      repetisi: 'Tidak Berulang',
      startDate: todayStr,
      endDate: todayStr,
      isCustomCategory: false,
      isCustomPic: false,
      ...defaultValues
    });
    setIsEditModalOpen(true);
  };

  const deleteTask = async (taskOrId: Task | string | number): Promise<boolean> => {
    if (!hasPermission(roleConfig, 'delete_task', userRole)) {
      toast.error('Akses ditolak: Anda tidak memiliki izin untuk menghapus pekerjaan.');
      return false;
    }
    const id = typeof taskOrId === 'object' ? taskOrId.id : taskOrId;
    const taskName = typeof taskOrId === 'object' ? taskOrId.nama : 'Pekerjaan';

    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini? Tindakan ini tidak dapat dibatalkan.')) {
      return false;
    }

    const toastId = toast.loading('Menghapus pekerjaan...');
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus pekerjaan');

      if (detailTask && String(detailTask.id) === String(id)) {
        setDetailTask(null);
      }

      toast.success('Pekerjaan berhasil dihapus', { id: toastId });
      if (addActivityLog) {
        addActivityLog('DELETE_TASK', 'Pekerjaan Dihapus', `Pekerjaan "${taskName}" telah dihapus`, 'warning');
      }

      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus pekerjaan', { id: toastId });
      return false;
    }
  };

  const handleSaveModal = async (payloadData: any) => {
    const isNew = !payloadData.id;
    const toastId = toast.loading(isNew ? 'Menyimpan pekerjaan baru...' : 'Memperbarui pekerjaan...');

    try {
      const url = isNew ? '/api/tasks' : `/api/tasks/${payloadData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const filteredExtraPics = payloadData.additionalPicsList 
        ? payloadData.additionalPicsList.filter(Boolean) 
        : [];

      const filesListToSave = payloadData.filesList && payloadData.filesList.length > 0
        ? payloadData.filesList
        : (payloadData.fileUrl ? [{ url: payloadData.fileUrl, name: payloadData.fileName || 'File Lampiran' }] : []);

      let processedSubTasks = payloadData.subTasksList ? [...payloadData.subTasksList] : [];
      if (!isNew) {
        processedSubTasks = processedSubTasks.map((st: any) => {
          const { pendingLogDesc, ...cleanSt } = st;
          return cleanSt;
        });
      } else {
        processedSubTasks = processedSubTasks.map((st: any) => {
          const { pendingLogDesc, ...cleanSt } = st;
          return { ...cleanSt, logs: [{ status: `${st.text} (${st.status})`, timestamp: new Date().toISOString() }] };
        });
      }

      const finalRepetisi = payloadData.repetisi === 'Custom' && payloadData.customRecurrenceSettings
        ? `CUSTOM_RECURRENCE:${JSON.stringify(payloadData.customRecurrenceSettings)}`
        : (payloadData.repetisi || 'Tidak Berulang');

      const payload = {
        ...payloadData,
        repetisi: finalRepetisi,
        filesJson: JSON.stringify(filesListToSave),
        additionalPics: JSON.stringify(filteredExtraPics),
        subTasksJson: JSON.stringify(processedSubTasks),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan data pekerjaan');
      }

      toast.success(isNew ? 'Pekerjaan baru berhasil ditambahkan!' : 'Pekerjaan berhasil diperbarui!', { id: toastId });
      if (addActivityLog) {
        addActivityLog(
          isNew ? 'ADD_TASK' : 'EDIT_TASK',
          isNew ? 'Pekerjaan Ditambahkan' : 'Pekerjaan Diubah',
          `Pekerjaan "${payloadData.nama}" berhasil ${isNew ? 'ditambahkan' : 'diperbarui'}`,
          'success'
        );
      }

      setIsEditModalOpen(false);
      setEditingTask(null);

      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan', { id: toastId });
    }
  };

  const openPreviewFile = (file: { name: string; url: string }) => {
    setPreviewFile(file);
  };

  const closePreviewFile = () => {
    setPreviewFile(null);
  };

  return (
    <TaskModalContext.Provider
      value={{
        openDetail,
        closeDetail,
        openEdit,
        openDuplicate,
        openCreate,
        deleteTask,
        openPreviewFile,
        closePreviewFile,
        selectedDetailTask: detailTask
      }}
    >
      {children}

      {/* Centralized Task Detail Modal */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={closeDetail}
          setPreviewFile={(file: any) => setPreviewFile(file)}
          onEdit={() => openEdit(detailTask)}
          onDuplicate={() => openDuplicate(detailTask)}
          onDelete={() => deleteTask(detailTask)}
        />
      )}

      {/* Centralized Task Add / Edit Modal */}
      <TaskAddEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
        onSave={handleSaveModal}
        formPicOptions={masterPics}
        formCategoryOptions={masterCats.length > 0 ? masterCats : ['Umum']}
        formStatusOptions={masterStatuses}
        formPriorityOptions={masterPriorities}
        setPreviewFile={(file: any) => setPreviewFile(file)}
      />

      {/* Centralized File Preview Modal */}
      <FilePreviewModal
        previewFile={previewFile}
        setPreviewFile={setPreviewFile}
        theme={theme}
      />
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
}
