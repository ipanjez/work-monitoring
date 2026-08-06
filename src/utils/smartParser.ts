const INDONESIAN_MONTHS: Record<string, string> = {
  'januari': 'January', 'februari': 'February', 'maret': 'March', 'april': 'April',
  'mei': 'May', 'juni': 'June', 'juli': 'July', 'agustus': 'August',
  'september': 'September', 'oktober': 'October', 'november': 'November', 'desember': 'December'
};

export interface ParsedTask {
  nama: string;
  pic: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  deskripsi: string;
  lokasi?: string;
}

function parseDateIndonesian(text: string): Date | null {
  const dateMatch = text.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
  if (dateMatch) {
    const [_, day, monthId, year] = dateMatch;
    const monthEn = INDONESIAN_MONTHS[monthId.toLowerCase()] || monthId;
    const dateObj = new Date(`${day} ${monthEn} ${year}`);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }
  return null;
}

function extractTimes(line: string): { start: string, end: string | null } {
  // Matches HH:MM or HH.MM
  const matches = [...line.matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (matches.length > 0) {
    const startH = matches[0][1].padStart(2, '0');
    const startM = matches[0][2];
    const start = `${startH}:${startM}`;
    
    let end = null;
    if (matches.length > 1) {
      const separator = line.substring(matches[0].index! + matches[0][0].length, matches[1].index!).trim();
      // If the separator is likely a range indicator
      if (/^(-|s\/d|sampai|s\.d|to|s\.d\.)$/i.test(separator)) {
        const endH = matches[1][1].padStart(2, '0');
        const endM = matches[1][2];
        end = `${endH}:${endM}`;
      }
    }
    return { start, end };
  }
  return { start: '', end: null };
}

export function parseAgendaText(rawText: string): ParsedTask[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let globalDate = new Date(); // Fallback to today
  
  // Try to find a global date in the first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const parsed = parseDateIndonesian(lines[i]);
    if (parsed) {
      globalDate = parsed;
      break;
    }
  }

  const tasks: ParsedTask[] = [];
  let currentTask: Partial<ParsedTask> = {
    nama: 'Pekerjaan Baru',
    pic: '',
    startDate: globalDate,
    endDate: globalDate,
    startTime: '08:00',
    endTime: '17:00',
    deskripsi: '',
    lokasi: ''
  };
  let currentDescription: string[] = [];
  let isFirstTaskNameFound = false;

  const saveCurrentTask = () => {
    if (currentTask && (isFirstTaskNameFound || currentDescription.length > 0)) {
      currentTask.deskripsi = currentDescription.join('\n').trim();
      tasks.push(currentTask as ParsedTask);
    }
  };

  const isNewTaskLine = (line: string) => {
    return /^\d+[\.\)]\s/.test(line) || /^[•\-\*]\s/.test(line) || line.startsWith('🗒️');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if line looks like the start of a new task
    if (isNewTaskLine(line)) {
      let name = line.replace(/^\d+[\.\)]\s/, '').replace(/^[•\-\*]\s/, '').trim();
      if (line.startsWith('🗒️')) {
        name = line.replace(/^🗒️\s*[:\-]?\s*/, '').trim();
      }
      
      if (!isFirstTaskNameFound) {
        currentTask.nama = name;
        isFirstTaskNameFound = true;
      } else {
        saveCurrentTask();
        currentTask = {
          nama: name,
          pic: '',
          startDate: globalDate,
          endDate: globalDate,
          startTime: '08:00',
          endTime: '17:00',
          deskripsi: '',
          lokasi: ''
        };
        currentDescription = [];
      }
      continue;
    }

    // Date parsing
    const parsedDate = parseDateIndonesian(line);
    if (parsedDate) {
      currentTask.startDate = parsedDate;
      currentTask.endDate = parsedDate;
      globalDate = parsedDate; // update fallback for subsequent tasks
      currentDescription.push(line);
      continue;
    }

    // Time parsing
    if (lowerLine.includes('⏰') || lowerLine.includes('waktu') || lowerLine.includes('jam') || lowerLine.includes('pukul')) {
      const { start, end } = extractTimes(line);
      if (start) {
        currentTask.startTime = start;
        if (end) {
          currentTask.endTime = end;
        } else {
          const [h, m] = start.split(':').map(Number);
          const endH = Math.min(23, h + 2).toString().padStart(2, '0');
          currentTask.endTime = `${endH}:${m.toString().padStart(2, '0')}`;
        }
      }
      currentDescription.push(line); // Also keep in description for context
    } 
    // Location parsing
    else if (lowerLine.includes('🏩') || lowerLine.includes('📍') || lowerLine.includes('🏢') || lowerLine.includes('tempat:') || lowerLine.includes('lokasi:') || lowerLine.includes('ruang:') || lowerLine.includes('link:')) {
      const cleanLoc = line.replace(/^[🏩📍🏢\s]+[:\-]?\s*/, '').replace(/^(tempat|lokasi|ruang|link)\s*[:\-]?\s*/i, '').trim();
      if (cleanLoc) {
        const locLower = cleanLoc.toLowerCase();
        if (locLower.startsWith('http://') || locLower.startsWith('https://') || locLower.includes('zoom.us') || locLower.includes('meet.google.com') || locLower.includes('teams.live.com') || locLower.includes('teams.microsoft') || locLower.startsWith('online:')) {
          const cleanLink = cleanLoc.replace(/^online:\s*/i, '').trim();
          currentTask.lokasi = JSON.stringify({ tipe: 'online', linkZoom: cleanLink, lokasiFisik: '', jam: '' });
        } else {
          const cleanPhys = cleanLoc.replace(/^offline:\s*/i, '').trim();
          currentTask.lokasi = JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: cleanPhys, jam: '' });
        }
      }
      currentDescription.push(line);
    }
    // Misc Description parsing
    else {
      currentDescription.push(line);
    }
  }

  // Save the last one
  saveCurrentTask();
  
  return tasks;
}
