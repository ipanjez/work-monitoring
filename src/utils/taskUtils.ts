import { createEvent, EventAttributes } from 'ics';
import { format } from 'date-fns';

export type FileItem = {
  url: string;
  name: string;
  uploadedAt?: string;
  deletedAt?: string;
  isDeleted?: boolean;
  size?: number;
};

export type LogItem = {
  action: string;
  timestamp: string;
  status?: string;
  details?: string;
};

export type SubTaskLog = {
  status: string;
  timestamp: string;
  description?: string;
};

export type SubTask = {
  id: string;
  text: string;
  status: string;
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
  lokasi?: string | null;
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
      const allFiles: FileItem[] = JSON.parse(task.filesJson);
      return allFiles.filter(f => !f.isDeleted);
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
    } catch (e) { }
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
    } catch (e) { }
  }
  return [];
};

export const getLocalTimezone = (): string => {
  if (typeof window === 'undefined') return 'WITA';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Makassar') || tz.includes('Singapore') || tz.includes('Ulaanbaatar') || tz.includes('Manila')) return 'WITA';
    if (tz.includes('Jakarta') || tz.includes('Bangkok') || tz.includes('Saigon') || tz.includes('Hanoi')) return 'WIB';
    if (tz.includes('Jayapura') || tz.includes('Tokyo') || tz.includes('Seoul') || tz.includes('Dili')) return 'WIT';
    
    const formatted = new Date().toLocaleDateString('id-ID', { timeZoneName: 'short' });
    const parts = formatted.split(' ');
    const lastPart = parts[parts.length - 1];
    if (['WIB', 'WITA', 'WIT'].includes(lastPart)) return lastPart;
  } catch (e) {}
  return 'WITA';
};

export const getDynamicColor = (type: string, value: string): string => {
  if (typeof window !== 'undefined') {
    try {
      const colors = JSON.parse(localStorage.getItem('master_colors') || '{}');
      const customColor = colors[`${type}_${value}`];
      if (customColor) return customColor;
    } catch { }
  }
  
  // Fallbacks
  const lowerType = type.toLowerCase();
  if (lowerType === 'status') {
    switch (value) {
      case 'Done': return '#10b981';
      case 'Review': return '#3b82f6';
      case 'In Progress': return '#f59e0b';
      case 'To Do': return '#94a3b8';
      default: return '#64748b';
    }
  }
  if (lowerType === 'priority' || lowerType === 'prioritas') {
    switch (value) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#10b981';
      default: return '#3b82f6';
    }
  }
  return '';
};

export const getDynamicIconName = (type: string, value: string): string => {
  if (typeof window !== 'undefined') {
    try {
      const icons = JSON.parse(localStorage.getItem('master_icons') || '{}');
      return icons[`${type}_${value}`] || '';
    } catch { }
  }
  return '';
};

export const getDynamicBadgeStyle = (type: string, value: string, defaultClass: string = '', passedMasterColors?: Record<string, string>) => {
  let color = passedMasterColors ? passedMasterColors[`${type}_${value}`] : getDynamicColor(type, value);
  
  if (color && color !== '#ffffff' && color !== '#ffffff00' && color !== '#fff') {
    // Ensure we only use the base 7-character hex if a 9-character hex was previously saved
    const baseColor = color.length === 9 ? color.substring(0, 7) : color;
    return { 
      style: { 
        backgroundColor: `color-mix(in srgb, ${baseColor} 15%, transparent)`,
        color: baseColor,
        border: `1px solid ${baseColor}`
      }, 
      className: 'badge' 
    };
  }
  
  return { 
    style: { 
      backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
      color: 'var(--accent-primary)',
      border: '1px solid var(--accent-primary)'
    }, 
    className: 'badge' 
  };
};

export const getPriorityBadgeClass = (p?: string | null) => {
  if (!p) return 'badge-medium';
  const color = getDynamicColor('priority', p);
  if (color) return 'badge-dynamic'; // We'll handle this in UI where we apply inline style
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
    } catch (e) { }
  }

  const notesStr = task.catatan ? `\n\nCatatan:\n${task.catatan}` : '';
  const fileStr = task.fileUrl ? `\n\nLampiran:\n${task.fileUrl}` : '';

  const details = encodeURIComponent(
    `PIC: ${allPicsStr}\nKategori: ${task.kategori || 'Umum'}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${formatRecurrenceText(task.repetisi)}\nStatus: ${task.status}\n\nDeskripsi:\n${task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '-'}${subTasksStr}${notesStr}${fileStr}`
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
    } catch (e) { }
  }

  const notesStr = task.catatan ? `\n\nCatatan:\n${task.catatan}` : '';
  const fileStr = task.fileUrl ? `\n\nLampiran:\n${task.fileUrl}` : '';

  const event: EventAttributes = {
    title: `[${task.kategori || 'Pekerjaan'}] ${task.nama}`,
    description: `PIC: ${allPicsStr}\nStatus: ${task.status}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${formatRecurrenceText(task.repetisi)}\nDeskripsi: ${task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '-'}${subTasksStr}${notesStr}${fileStr}`,
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

export const formatRecurrenceText = (repetisi: string | null | undefined): string => {
  if (!repetisi) return 'Tidak Berulang';
  if (!repetisi.startsWith('CUSTOM_RECURRENCE:')) return repetisi;

  try {
    let jsonStr = repetisi.replace('CUSTOM_RECURRENCE:', '');
    let settings = JSON.parse(jsonStr);
    while (typeof settings === 'string') {
      settings = JSON.parse(settings);
    }
    
    let base = `Setiap ${settings.every} ${settings.unit}`;
    
    if (settings.unit === 'Minggu' && settings.days && settings.days.length > 0) {
      base += ` pada hari ${settings.days.join(', ')}`;
    }
    
    if (settings.endType === 'date' && settings.endDate) {
      try {
        base += ` (Berakhir pada ${format(new Date(settings.endDate), 'dd MMM yyyy')})`;
      } catch (e) {
        base += ` (Berakhir pada ${settings.endDate})`;
      }
    } else if (settings.endType === 'occurrences' && settings.endOccurrences) {
      base += ` (Berakhir setelah ${settings.endOccurrences} kali)`;
    }
    
    return base;
  } catch (e) {
    return 'Custom (Format Tidak Dikenali)';
  }
};

export const formatDescription = (htmlOrText: string): string => {
  if (!htmlOrText) return '';
  
  let content = htmlOrText;
  if (!/<[a-z][\s\S]*>/i.test(content)) {
    content = content.replace(/\n/g, '<br />');
  }

  // Safe HTML parsing to replace URLs in text nodes only
  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
      
      const nodesToReplace: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentNode && node.parentNode.nodeName === 'A') continue;
        nodesToReplace.push(node as Text);
      }
      
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      for (const n of nodesToReplace) {
        if (n.nodeValue && urlRegex.test(n.nodeValue)) {
          const span = document.createElement('span');
          span.innerHTML = n.nodeValue.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">$1</a>');
          n.parentNode?.replaceChild(span, n);
        }
      }
      return doc.body.innerHTML;
    } catch (e) {
      console.error("Error parsing description HTML", e);
    }
  }

  // Fallback for SSR or if DOMParser fails (basic regex that might double-linkify but prevents crashing)
  return content.replace(/(^|[^="'])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">$2</a>');
};
