'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users, Plus, Paperclip, File, Eye, ArrowUp, ArrowDown, Info, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Task, FileItem, SubTask, handleMarkdownShortcut, formatDescription } from '@/utils/taskUtils';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useMaster } from '@/context/MasterContext';
import { defaultRolePermissions, RolePermissionsConfig, hasPermission } from '@/lib/permissions';
import TaskFormFields from './TaskFormFields';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const SubTaskLogViewer = ({ logs, title = "Log Status:" }: { logs: any[], title?: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!logs || logs.length === 0) return null;
  const visibleLogs = expanded ? logs : logs.slice(Math.max(logs.length - 1, 0));

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
      {visibleLogs.map((log: any, lidx: number) => (
        <div key={lidx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px' }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</span>
          <span
            style={{ color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'normal' }}
            dangerouslySetInnerHTML={{ __html: `- ${formatDescription(log.status)}` }}
          />
        </div>
      ))}
      {logs.length > 1 && (
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '10px', cursor: 'pointer', padding: 0, marginTop: '2px', textDecoration: 'underline' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Sembunyikan' : `Tampilkan ${logs.length - 1} log lainnya...`}
        </button>
      )}
    </div>
  );
};

export type EditingTaskType = Partial<Task> & {
  filesList?: FileItem[];
  additionalPicsList?: string[];
  isCustomCategory?: boolean;
  isCustomPic?: boolean;
  customRecurrenceSettings?: any;
  subTasksList?: SubTask[];
  lokasiData?: { tipe: string, linkZoom?: string, lokasiFisik?: string, jam?: string };
};

interface TaskAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: EditingTaskType | null;
  onSave: (payload: any) => Promise<void>;
  formPicOptions: string[];
  formCategoryOptions: string[];
  formStatusOptions?: string[];
  formPriorityOptions?: string[];
  setPreviewFile?: (file: FileItem) => void;
}

export default function TaskAddEditModal({
  isOpen,
  onClose,
  taskToEdit,
  onSave,
  formPicOptions = [],
  formCategoryOptions = [],
  formStatusOptions = ['To Do', 'In Progress', 'Done'],
  formPriorityOptions = ['Low', 'Medium', 'High', 'Critical'],
  setPreviewFile
}: TaskAddEditModalProps) {
  const router = useRouter();
  const { maxFileSizeMb } = useMaster();
  const [editingTask, setEditingTask] = useState<EditingTaskType | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [masterProgressMap, setMasterProgressMap] = useState<Record<string, number>>({});

  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(defaultRolePermissions);
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/permissions')
        .then(res => res.json())
        .then(setRoleConfig)
        .catch(() => { });
    }
  }, [isOpen]);
  const canUploadAttachment = hasPermission(roleConfig, 'manage_task', userRole);

  const [activeTab, setActiveTab] = useState<'info' | 'subtasks' | 'attachments'>('info');
  const [masterLocations, setMasterLocations] = useState<string[]>([]);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverFileIndex, setDragOverFileIndex] = useState<number | null>(null);

  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Robust options ensuring legacy data doesn't get unselected
  const safePicOptions = useMemo(() => {
    const opts = Array.from(new Set([...formPicOptions]));
    if (editingTask?.pic && !opts.includes(editingTask.pic)) opts.push(editingTask.pic);
    editingTask?.additionalPicsList?.forEach((p: string) => {
      if (p && !opts.includes(p)) opts.push(p);
    });
    return opts;
  }, [formPicOptions, editingTask]);

  const safeCategoryOptions = useMemo(() => {
    const opts = Array.from(new Set([...formCategoryOptions]));
    if (editingTask?.kategori && !opts.includes(editingTask.kategori)) opts.push(editingTask.kategori);
    return opts;
  }, [formCategoryOptions, editingTask]);

  useEffect(() => {
    if (isOpen) {
      try {
        const cached = localStorage.getItem('master_status_progress');
        if (cached) setMasterProgressMap(JSON.parse(cached));
        const cachedLoc = localStorage.getItem('master_locations');
        if (cachedLoc) setMasterLocations(JSON.parse(cachedLoc));
      } catch (e) { }
      fetch('/api/settings').then(r => r.json()).then(data => {
        if (data.master_status_progress) {
          setMasterProgressMap(data.master_status_progress);
          localStorage.setItem('master_status_progress', JSON.stringify(data.master_status_progress));
        }
        if (data.master_locations) {
          setMasterLocations(data.master_locations);
          localStorage.setItem('master_locations', JSON.stringify(data.master_locations));
        }
      }).catch(() => { });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && taskToEdit) {
      console.log('DEBUG taskToEdit:', taskToEdit);
      const cloned = JSON.parse(JSON.stringify(taskToEdit));

      if (cloned.repetisi && cloned.repetisi.startsWith('CUSTOM_RECURRENCE:')) {
        try {
          let jsonStr = cloned.repetisi.replace('CUSTOM_RECURRENCE:', '');
          let settings = JSON.parse(jsonStr);
          while (typeof settings === 'string') {
            settings = JSON.parse(settings);
          }
          cloned.customRecurrenceSettings = settings;
        } catch (e) {
          cloned.customRecurrenceSettings = { every: 1, unit: 'Minggu', days: [], endType: 'never', endDate: '', endOccurrences: 1 };
        }
        cloned.repetisi = 'Custom';
      } else if (!cloned.customRecurrenceSettings) {
        cloned.customRecurrenceSettings = { every: 1, unit: 'Minggu', days: [], endType: 'never', endDate: '', endOccurrences: 1 };
      }

      if (cloned.lokasi) {
        try {
          cloned.lokasiData = JSON.parse(cloned.lokasi);
          // If old data has lokasiData.jam but startTime is empty, sync it
          if (cloned.lokasiData?.jam && !cloned.startTime) {
            cloned.startTime = cloned.lokasiData.jam;
            cloned.isAllDay = false;
          }
        } catch (e) {
          const locStr = (cloned.lokasi || '').trim();
          const isOnline = /online|zoom|meet|teams|webex|http/i.test(locStr);
          cloned.lokasiData = {
            tipe: isOnline ? 'online' : 'offline',
            linkZoom: isOnline ? locStr : '',
            lokasiFisik: !isOnline ? locStr : '',
            jam: ''
          };
        }
      } else {
        cloned.lokasiData = { tipe: 'offline', linkZoom: '', lokasiFisik: '', jam: '' };
      }

      if (cloned.lokasiData) {
        const textToCheck = `${cloned.lokasiData.linkZoom || ''} ${cloned.lokasiData.lokasiFisik || ''}`.trim();
        if (/online|zoom|meet|teams|webex|http/i.test(textToCheck) && !/offline/i.test(textToCheck)) {
          cloned.lokasiData.tipe = 'online';
          if (!cloned.lokasiData.linkZoom && cloned.lokasiData.lokasiFisik) {
            cloned.lokasiData.linkZoom = cloned.lokasiData.lokasiFisik;
          }
        } else if (/offline/i.test(textToCheck)) {
          cloned.lokasiData.tipe = 'offline';
          if (!cloned.lokasiData.lokasiFisik && cloned.lokasiData.linkZoom) {
            cloned.lokasiData.lokasiFisik = cloned.lokasiData.linkZoom;
          }
        }
      }

      // Force parsing from subTasksJson to prevent any missing list issues
      if (cloned.subTasksJson) {
        try {
          const parsed = typeof cloned.subTasksJson === 'string' ? JSON.parse(cloned.subTasksJson) : cloned.subTasksJson;
          if (Array.isArray(parsed) && parsed.length > 0) {
            cloned.subTasksList = parsed;
          }
        } catch (e) {
          console.error("Failed to parse subTasksJson in modal", e);
        }
      }

      if (!cloned.subTasksList) {
        console.warn('DEBUG: subTasksList was missing in cloned taskToEdit!');
        cloned.subTasksList = [];
      } else if (!Array.isArray(cloned.subTasksList)) {
        console.warn('DEBUG: subTasksList was not an array in cloned taskToEdit!', cloned.subTasksList);
        cloned.subTasksList = [];
      }

      // Force parsing from filesJson to ensure filesList is properly populated and order preserved
      if (cloned.filesJson && (!cloned.filesList || cloned.filesList.length === 0)) {
        try {
          const parsed = typeof cloned.filesJson === 'string' ? JSON.parse(cloned.filesJson) : cloned.filesJson;
          if (Array.isArray(parsed) && parsed.length > 0) {
            cloned.filesList = parsed;
          }
        } catch (e) {
          console.error("Failed to parse filesJson in modal", e);
        }
      }
      if (!cloned.filesList && cloned.fileUrl) {
        cloned.filesList = [{ url: cloned.fileUrl, name: cloned.fileName || 'File Lampiran' }];
      }
      if (!cloned.filesList) {
        cloned.filesList = [];
      }

      // Fix date formats for <input type="date"> (expects YYYY-MM-DD)
      if (cloned.startDate) {
        cloned.startDate = format(new Date(cloned.startDate), 'yyyy-MM-dd');
      }
      if (cloned.endDate) {
        cloned.endDate = format(new Date(cloned.endDate), 'yyyy-MM-dd');
      }

      console.log('DEBUG FINAL CLONED TASK:', cloned);
      setEditingTask(cloned);
    } else {
      setEditingTask(null);
    }
  }, [isOpen, taskToEdit]);

  const handleAddAnotherPic = () => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      additionalPicsList: [...(editingTask.additionalPicsList || []), '']
    });
  };

  const handleSelectAllPics = () => {
    if (!editingTask) return;
    const validPics = safePicOptions.filter(p => p && p.trim() !== '' && p !== 'Unassigned');
    if (validPics.length === 0) return toast.error('Belum ada data Master PIC yang tersedia');

    const primaryPic = editingTask.pic && validPics.includes(editingTask.pic) ? editingTask.pic : validPics[0];
    const otherPics = validPics.filter(p => p !== primaryPic);

    setEditingTask({
      ...editingTask,
      pic: primaryPic,
      additionalPicsList: otherPics
    });
    toast.success(`Berhasil memilih seluruh ${validPics.length} PIC!`);
  };

  const handleUpdateAdditionalPic = (idx: number, value: string) => {
    if (!editingTask) return;
    const updated = [...(editingTask.additionalPicsList || [])];
    updated[idx] = value;
    setEditingTask({ ...editingTask, additionalPicsList: updated });
  };

  const handleRemoveAdditionalPic = (idx: number) => {
    if (!editingTask) return;
    const updated = editingTask.additionalPicsList?.filter((_, i) => i !== idx);
    setEditingTask({ ...editingTask, additionalPicsList: updated });
  };

  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0 || !editingTask) return;
    setUploadingFile(true);
    toast.loading('Mengunggah file...', { id: 'upload' });

    try {
      const filesArr = Array.from(files);
      const newFiles: FileItem[] = [];
      const limitMb = maxFileSizeMb || 25;

      for (const file of filesArr) {
        if (file.size > limitMb * 1024 * 1024) {
          toast.error(`File ${file.name} melebihi batas maksimum (${limitMb}MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', 'temp');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Gagal mengunggah ${file.name}`);

        const data = await res.json();
        newFiles.push({
          url: data.fileUrl,
          name: data.fileName,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      }

      if (newFiles.length > 0) {
        setEditingTask((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            filesList: [...(prev.filesList || []), ...newFiles]
          };
        });
        toast.success(`${newFiles.length} File berhasil diunggah!`, { id: 'upload' });
      } else {
        toast.dismiss('upload');
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error('Gagal mengunggah file', { id: 'upload' });
    } finally {
      setUploadingFile(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFileFromEdit = (idx: number) => {
    if (!editingTask) return;
    const updatedList = [...(editingTask.filesList || [])];
    if (updatedList[idx].uploadedAt) {
      updatedList[idx].isDeleted = true;
      updatedList[idx].deletedAt = new Date().toISOString();
    } else {
      updatedList.splice(idx, 1);
    }
    setEditingTask({ ...editingTask, filesList: updatedList });
  };

  const handleMoveFileUp = (idx: number) => {
    if (!editingTask?.filesList || idx <= 0) return;
    const list = [...editingTask.filesList];
    const temp = list[idx - 1];
    list[idx - 1] = list[idx];
    list[idx] = temp;
    setEditingTask({ ...editingTask, filesList: list });
  };

  const handleMoveFileDown = (idx: number) => {
    if (!editingTask?.filesList || idx >= editingTask.filesList.length - 1) return;
    const list = [...editingTask.filesList];
    const temp = list[idx + 1];
    list[idx + 1] = list[idx];
    list[idx] = temp;
    setEditingTask({ ...editingTask, filesList: list });
  };

  const handleDropFileReorder = (targetIdx: number) => {
    if (draggedFileIndex === null || draggedFileIndex === targetIdx || !editingTask?.filesList) {
      setDraggedFileIndex(null);
      setDragOverFileIndex(null);
      return;
    }
    const list = [...editingTask.filesList];
    const [movedItem] = list.splice(draggedFileIndex, 1);
    list.splice(targetIdx, 0, movedItem);
    setEditingTask({ ...editingTask, filesList: list });
    setDraggedFileIndex(null);
    setDragOverFileIndex(null);
  };

  const handleSave = async () => {
    if (!editingTask) return;
    if (!editingTask.nama || !editingTask.pic) {
      toast.error('Nama Pekerjaan dan PIC Utama wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      // Serialize filesList back into JSON for the backend
      const filesJson = JSON.stringify(editingTask.filesList || []);
      const additionalPicsJson = JSON.stringify((editingTask.additionalPicsList || []).filter(p => p.trim() !== ''));
      const subTasksJson = JSON.stringify(editingTask.subTasksList || []);
      const updatedLokasiData = editingTask.lokasiData?.tipe
        ? { ...editingTask.lokasiData, jam: editingTask.isAllDay ? '' : (editingTask.startTime || '') }
        : null;
      const lokasiJson = updatedLokasiData ? JSON.stringify(updatedLokasiData) : null;

      const { historyLogsJson, commentsJson, ...restEditingTask } = editingTask;
      const finalRepetisi = editingTask.repetisi === 'Custom' && editingTask.customRecurrenceSettings
        ? `CUSTOM_RECURRENCE:${JSON.stringify(editingTask.customRecurrenceSettings)}`
        : (editingTask.repetisi || 'Tidak Berulang');

      const payload = {
        ...restEditingTask,
        repetisi: finalRepetisi,
        filesJson,
        additionalPics: additionalPicsJson,
        subTasksJson,
        customRecurrenceSettings: editingTask.customRecurrenceSettings,
        lokasi: lokasiJson
      };

      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && editingTask && (
        <div className="modal-overlay" style={{ zIndex: 10100 }}>
          <motion.div
            className="modal-content"
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: '-24px',
              background: 'var(--modal-bg, var(--surface-color))',
              zIndex: 10,
              padding: '24px 24px 16px 24px',
              margin: '-24px -24px 20px -24px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {editingTask.id ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
              </h2>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <TaskFormFields
              task={editingTask}
              onChange={setEditingTask}
              formPicOptions={formPicOptions}
              formCategoryOptions={formCategoryOptions}
              formStatusOptions={formStatusOptions}
              formPriorityOptions={formPriorityOptions}
              masterLocations={masterLocations}
              masterProgressMap={masterProgressMap}
              canUploadAttachment={canUploadAttachment}
              maxFileSizeMb={maxFileSizeMb}
              setPreviewFile={setPreviewFile}
            />

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', bottom: '-24px',
                background: 'var(--modal-bg, var(--surface-color))',
                zIndex: 10,
                padding: '16px 24px 24px 24px',
                margin: '16px -24px -24px -24px',
                borderBottomLeftRadius: '24px',
                borderBottomRightRadius: '24px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div>
                  {editingTask && editingTask.id !== undefined && (
                    <button
                      className="btn"
                      style={{ background: 'var(--primary-color)', color: 'var(--surface-color)', opacity: 0.85 }}
                      onClick={() => {
                        onClose();
                        const targetName = editingTask?.nama || '';
                        router.push(`/calendar?search=${encodeURIComponent(targetName)}`);
                      }}
                    >
                      <Eye size={15} style={{ marginRight: '6px' }} /> Pergi ke Kalender
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading || uploadingFile}>
                    {loading ? 'Menyimpan...' : 'Simpan Pekerjaan'}
                  </button>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

