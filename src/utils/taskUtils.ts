import { createEvent, EventAttributes } from 'ics';
import { format } from 'date-fns';

export type FileItem = {
  url: string;
  name: string;
  uploadedAt?: string;
  deletedAt?: string;
  isDeleted?: boolean;
};

export type LogItem = {
  action: string;
  timestamp: string;
  status?: string;
};

export type SubTaskLog = {
  status: string;
  timestamp: string;
  description?: string;
};

export type SubTask = {
  id: string;
  text: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  logs: SubTaskLog[];
};

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: number;
  nama: string;
  pic: string;
  status: string;
  prioritas?: string | null;
  kategori?: string | null;
  progress?: number | null;
  orderIndex?: number;
  deskripsi?: string | null;
  catatan?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  filesJson?: string | null;
  commentsJson?: string | null;
  subTasksJson?: string | null;
  isAllDay?: boolean | null;
  startTime?: string | null;
  endTime?: string | null;
  repetisi?: string | null;
  additionalPics?: string | null;
  editCount?: number | null;
  lastEditedAt?: string | Date | null;
  historyLogsJson?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  startDate: string | Date;
  endDate: string | Date;
};

export const getTaskFiles = (task: Task | Partial<Task>): FileItem[] => {
  if (task.filesJson) {
    try {
      return JSON.parse(task.filesJson);
    } catch (e) {}
  }
  if (task.fileUrl) {
    return [{ url: task.fileUrl, name: task.fileName || 'File Lampiran' }];
  }
  return [];
};

export const getAdditionalPics = (task: Task | Partial<Task>): string[] => {
  if (task.additionalPics) {
    try {
      const parsed = JSON.parse(task.additionalPics);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

export const getTaskComments = (task: Task | Partial<Task>): CommentItem[] => {
  if (task.commentsJson) {
    try {
      return JSON.parse(task.commentsJson);
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const getHistoryLogs = (task: Task | Partial<Task>): LogItem[] => {
  if (task.historyLogsJson) {
    try {
      const parsed = JSON.parse(task.historyLogsJson);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

export const getPriorityBadgeClass = (p?: string | null) => {
  switch (p) {
    case 'Urgent': return 'badge-urgent';
    case 'High': return 'badge-high';
    case 'Low': return 'badge-low';
    default: return 'badge-medium';
  }
};

export const getGoogleCalendarUrl = (task: Task) => {
  const extraPics = getAdditionalPics(task);
  const allPicsStr = [task.pic, ...extraPics].join(', ');
  const title = encodeURIComponent(`[${task.kategori || 'Pekerjaan'}] ${task.nama}`);

  let subTasksStr = '';
  if (task.subTasksJson) {
    try {
      const subTasks: SubTask[] = JSON.parse(task.subTasksJson);
      if (Array.isArray(subTasks) && subTasks.length > 0) {
        subTasksStr = `\n\nSub-Pekerjaan:\n${subTasks.map(st => `- [${st.status}] ${st.text}`).join('\n')}`;
      }
    } catch (e) {}
  }

  const notesStr = task.catatan ? `\n\nCatatan:\n${task.catatan}` : '';
  const fileStr = task.fileUrl ? `\n\nLampiran:\n${task.fileUrl}` : '';

  const details = encodeURIComponent(
    `PIC: ${allPicsStr}\nKategori: ${task.kategori || 'Umum'}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nStatus: ${task.status}\n\nDeskripsi:\n${task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '-'}${subTasksStr}${notesStr}${fileStr}`
  );
  
  const dates = `${new Date(task.startDate).toISOString().replace(/-|:|\.\d+/g, '')}/${new Date(task.endDate).toISOString().replace(/-|:|\.\d+/g, '')}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
};

export const handleExportICS = (task: Task) => {
  const start = new Date(task.startDate);
  const end = new Date(task.endDate);
  const extraPics = getAdditionalPics(task);
  const allPicsStr = [task.pic, ...extraPics].join(', ');

  let subTasksStr = '';
  if (task.subTasksJson) {
    try {
      const subTasks: SubTask[] = JSON.parse(task.subTasksJson);
      if (Array.isArray(subTasks) && subTasks.length > 0) {
        subTasksStr = `\n\nSub-Pekerjaan:\n${subTasks.map(st => `- [${st.status}] ${st.text}`).join('\n')}`;
      }
    } catch (e) {}
  }

  const notesStr = task.catatan ? `\n\nCatatan:\n${task.catatan}` : '';
  const fileStr = task.fileUrl ? `\n\nLampiran:\n${task.fileUrl}` : '';

  const event: EventAttributes = {
    title: `[${task.kategori || 'Pekerjaan'}] ${task.nama}`,
    description: `PIC: ${allPicsStr}\nStatus: ${task.status}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nDeskripsi: ${task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '-'}${subTasksStr}${notesStr}${fileStr}`,
    start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), 9, 0],
    end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), 17, 0],
  };

  createEvent(event, (error, value) => {
    if (error) {
      console.error(error);
      return;
    }
    const blob = new Blob([value], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.nama.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    a.click();
  });
};
