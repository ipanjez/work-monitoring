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
  pic?: string;
  additionalPics?: string[];
  tenggatWaktu?: string;
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

export const getTaskDatesForExport = (task: any) => {
  const start = new Date(task.startDate);
  const end = new Date(task.endDate);

  let startH = 9, startM = 0;
  let endH = 17, endM = 0;

  if (task.startTime) {
    const [h, m] = task.startTime.split(':').map(Number);
    if (!isNaN(h)) startH = h;
    if (!isNaN(m)) startM = m;
  }
  
  if (task.endTime) {
    const [h, m] = task.endTime.split(':').map(Number);
    if (!isNaN(h)) endH = h;
    if (!isNaN(m)) endM = m;
  } else if (task.startTime) {
    endH = Math.min(23, startH + 1);
    endM = startM;
  }

  // Create local dates
  const localStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), startH, startM);
  const localEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), endH, endM);
  
  return { localStart, localEnd, startH, startM, endH, endM, startY: start.getFullYear(), startMo: start.getMonth(), startD: start.getDate(), endY: end.getFullYear(), endMo: end.getMonth(), endD: end.getDate() };
};

export const getTaskLocationString = (task: any) => {
  if (!task.lokasi) return '';
  try {
    const parsed = JSON.parse(task.lokasi);
    if (parsed.tipe === 'online' && parsed.linkZoom) return parsed.linkZoom;
    if (parsed.tipe === 'offline' && parsed.lokasiFisik) return parsed.lokasiFisik;
    return parsed.lokasiFisik || parsed.linkZoom || task.lokasi;
  } catch (e) {
    return task.lokasi;
  }
};

export const getTaskExportRow = (task: any) => {
  let subPekerjaanStr = '';
  if (task.subTasksJson) {
    try {
      const parsed = JSON.parse(task.subTasksJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subPekerjaanStr = parsed.map((st: any) => {
          let str = `[${st.status}] ${st.text}`;
          const allPics = [st.pic, ...(st.additionalPics || [])].filter(Boolean);
          if (allPics.length > 0) {
            str += ` | PIC: ${allPics.join(', ')}`;
          }
          if (st.tenggatWaktu) str += ` | Tenggat: ${st.tenggatWaktu}`;
          return str;
        }).join('\n');
      }
    } catch (e) { }
  }

  const extraPics = getAdditionalPics(task);

  return {
    'Nama Pekerjaan': task.nama,
    'PIC Utama': task.pic,
    'PIC Tambahan': extraPics.join(', '),
    'Kategori': task.kategori || 'Umum',
    'Prioritas': task.prioritas || 'Medium',
    'Status': task.status,
    'Sepanjang Hari': task.isAllDay ? 'Ya' : 'Tidak',
    'Jam Mulai': task.startTime || '',
    'Jam Selesai': task.endTime || '',
    'Tanggal Mulai': task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
    'Tenggat Waktu': task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '',
    'Repetisi': task.repetisi || 'Tidak Berulang',
    'Deskripsi': task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '',
    'Catatan': task.catatan || '',
    'Lokasi Pekerjaan': getTaskLocationString(task),
    'Sub Pekerjaan': subPekerjaanStr,
  };
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

  const { localStart, localEnd } = getTaskDatesForExport(task);
  const dates = `${localStart.toISOString().replace(/-|:|\.\d+/g, '')}/${localEnd.toISOString().replace(/-|:|\.\d+/g, '')}`;
  const locStr = getTaskLocationString(task);
  const locationQuery = locStr ? `&location=${encodeURIComponent(locStr)}` : '';
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}${locationQuery}`;
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

  const { startY, startMo, startD, startH, startM, endY, endMo, endD, endH, endM } = getTaskDatesForExport(task);
  const locStr = getTaskLocationString(task);

  const event: EventAttributes = {
    title: `[${task.kategori || 'Pekerjaan'}] ${task.nama}`,
    description: `PIC: ${allPicsStr}\nStatus: ${task.status}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${formatRecurrenceText(task.repetisi)}\nDeskripsi: ${task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '-'}${subTasksStr}${notesStr}${fileStr}`,
    start: [startY, startMo + 1, startD, startH, startM],
    end: [endY, endMo + 1, endD, endH, endM],
    location: locStr || undefined,
    alarms: [
      {
        action: 'display',
        description: `Reminder: ${task.nama}`,
        trigger: { minutes: 30, before: true }
      }
    ]
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

  // Basic Markdown Parsing
  content = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/__(.+?)__/g, '<u>$1</u>');

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
      console.error('Safe HTML parsing failed', e);
      return content;
    }
  }
  
  return content;
};

export const handleMarkdownShortcut = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (newValue: string) => void
) => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrl = isMac ? e.metaKey : e.ctrlKey;
  if (!ctrl) return;
  
  let prefix = '';
  let suffix = '';
  
  if (e.key === 'b') {
    prefix = '**'; suffix = '**';
  } else if (e.key === 'i') {
    prefix = '*'; suffix = '*';
  } else if (e.key === 'u') {
    prefix = '__'; suffix = '__';
  } else if (e.key.toLowerCase() === 'x' && e.shiftKey) {
    prefix = '~~'; suffix = '~~';
  } else {
    return;
  }
  
  e.preventDefault();
  const target = e.target as HTMLTextAreaElement;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const selectedText = value.substring(start, end);
  
  const newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
  onChange(newValue);
  
  // Set cursor position back after state update
  setTimeout(() => {
    target.focus();
    target.setSelectionRange(start + prefix.length, end + prefix.length);
  }, 0);
};

export const formatLogDetails = (text: string): string => {
  if (!text) return '';
  let formatted = text;

  // 1. Parse CUSTOM_RECURRENCE JSON
  formatted = formatted.replace(/CUSTOM_RECURRENCE:\s*("?\\?{.*?\\?}?"?)/g, (match, jsonStringWithQuotes) => {
    try {
      let cleanStr = jsonStringWithQuotes;
      if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
        cleanStr = cleanStr.slice(1, -1);
      }
      cleanStr = cleanStr.replace(/\\"/g, '"').replace(/\\{/g, '{').replace(/\\}/g, '}');
      
      const data = JSON.parse(cleanStr);
      let res = `Pengulangan Kustom: Tiap ${data.every} ${data.unit}`;
      if (data.endType === 'date' && data.endDate) res += ` hingga ${data.endDate}`;
      if (data.endType === 'occurrences') res += ` (${data.endOccurrences} kali)`;
      return res;
    } catch (e) {
      return 'Pengulangan Kustom';
    }
  });

  // 2. Add line breaks for readability before major fields
  const fields = [
    'Nama Pekerjaan', 'Sub Pekerjaan', 'Progress', 'Pengulangan', 
    'PIC Tambahan', 'Lampiran', 'PIC', 'Status', 'Prioritas', 
    'Kategori', 'Tenggat Waktu', 'Deskripsi', 'Lokasi', 'Tanggal Mulai'
  ];
  
  fields.forEach(field => {
    // Match ", Field" and replace with "\n- Field"
    const regex = new RegExp(`,\\s*(${field}\\b)`, 'g');
    formatted = formatted.replace(regex, '\n- $1');
  });

  // 3. Format starting prefixes
  formatted = formatted.replace(/^Diubah:\s*/, 'Diubah:\n- ');
  formatted = formatted.replace(/^Ditambahkan:\s*/, 'Ditambahkan:\n- ');
  formatted = formatted.replace(/^Dihapus:\s*/, 'Dihapus:\n- ');

  // 4. Format Notification wrapper
  formatted = formatted.replace(/\(Perubahan:\s*/g, '\nPerubahan:\n- ');
  if (formatted.includes('\nPerubahan:\n- ') && formatted.endsWith(')')) {
    formatted = formatted.slice(0, -1); // Remove trailing parenthesis
  }

  return formatted.trim();
};
