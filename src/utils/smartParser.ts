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
  kategori?: string;
  prioritas?: string;
  additionalPics?: string;
}

function parseDateIndonesianRange(text: string): { startDate: Date, endDate: Date } | null {
  const m = "(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)";
  const sep = "(?:s\\.?\\s*d\\.?|-|sampai|s/d)";
  
  const r1 = new RegExp(`(\\d{1,2})\\s+${m}\\s+(\\d{4})\\s*${sep}\\s*(\\d{1,2})\\s+${m}\\s+(\\d{4})`, 'i');
  const r2 = new RegExp(`(\\d{1,2})\\s+${m}\\s*${sep}\\s*(\\d{1,2})\\s+${m}\\s+(\\d{4})`, 'i');
  const r3 = new RegExp(`(\\d{1,2})\\s*${sep}\\s*(\\d{1,2})\\s+${m}\\s+(\\d{4})`, 'i');
  const r4 = new RegExp(`(\\d{1,2})\\s+${m}\\s+(\\d{4})`, 'i');

  let match = text.match(r1);
  if (match) {
    const d1 = new Date(`${match[1]} ${INDONESIAN_MONTHS[match[2].toLowerCase()]} ${match[3]}`);
    const d2 = new Date(`${match[4]} ${INDONESIAN_MONTHS[match[5].toLowerCase()]} ${match[6]}`);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) return { startDate: d1, endDate: d2 };
  }

  match = text.match(r2);
  if (match) {
    const year = match[5];
    const d1 = new Date(`${match[1]} ${INDONESIAN_MONTHS[match[2].toLowerCase()]} ${year}`);
    const d2 = new Date(`${match[3]} ${INDONESIAN_MONTHS[match[4].toLowerCase()]} ${year}`);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) return { startDate: d1, endDate: d2 };
  }

  match = text.match(r3);
  if (match) {
    const month = INDONESIAN_MONTHS[match[3].toLowerCase()];
    const year = match[4];
    const d1 = new Date(`${match[1]} ${month} ${year}`);
    const d2 = new Date(`${match[2]} ${month} ${year}`);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) return { startDate: d1, endDate: d2 };
  }

  match = text.match(r4);
  if (match) {
    const d1 = new Date(`${match[1]} ${INDONESIAN_MONTHS[match[2].toLowerCase()]} ${match[3]}`);
    if (!isNaN(d1.getTime())) return { startDate: d1, endDate: d1 };
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

export function parseAgendaText(rawText: string, picOptions: string[] = [], categoryOptions: string[] = [], priorityOptions: string[] = [], locationOptions: string[] = []): ParsedTask[] {
  // Pre-process rawText to handle single-line PDF pastes by inserting newlines before key fields
  const processedText = rawText.replace(/(Hari\/Tanggal|Waktu|Tempat|Agenda)\s*:/gi, '\n$1 :');
  const lines = processedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let globalStartDate = new Date(); // Fallback to today
  let globalEndDate = new Date(); // Fallback to today
  
  // Try to find a global date in the first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const parsed = parseDateIndonesianRange(lines[i]);
    if (parsed) {
      globalStartDate = parsed.startDate;
      globalEndDate = parsed.endDate;
      break;
    }
  }

  const tasks: ParsedTask[] = [];
  let currentTask: Partial<ParsedTask> = {
    nama: 'Pekerjaan Baru',
    pic: '',
    startDate: globalStartDate,
    endDate: globalEndDate,
    startTime: '08:00',
    endTime: '17:00',
    deskripsi: '',
    lokasi: ''
  };
  let currentDescription: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if new numbered item starts (e.g. "1. ", "2. ", "1) ")
    const itemMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
    if (itemMatch) {
      // Save previous task if exists
      if (currentTask.nama && currentTask.nama !== 'Pekerjaan Baru') {
        currentTask.deskripsi = currentDescription.join('\n').trim();
        tasks.push(currentTask as ParsedTask);
      }

      currentTask = {
        nama: itemMatch[2].trim(),
        pic: '',
        kategori: categoryOptions.length > 0 ? categoryOptions[0] : 'Umum',
        prioritas: priorityOptions.length > 0 ? (priorityOptions[1] || priorityOptions[0]) : 'Medium',
        startDate: globalStartDate,
        endDate: globalEndDate,
        startTime: '08:00',
        endTime: '17:00',
        deskripsi: '',
        lokasi: ''
      };
      currentDescription = [];
      continue;
    }

    // Check if line starts with specific keyword like "Agenda:", "Kegiatan:", "Judul:"
    const keywordMatch = line.match(/^(agenda|kegiatan|judul|nama pekerjaan)\s*:\s*(.*)/i);
    if (keywordMatch) {
      if (currentTask.nama && currentTask.nama !== 'Pekerjaan Baru' && !currentTask.nama.includes(keywordMatch[2].trim())) {
        // If currentTask already has details, this might be a new task without numbers
        currentTask.deskripsi = currentDescription.join('\n').trim();
        tasks.push(currentTask as ParsedTask);

        currentTask = {
          nama: keywordMatch[2].trim(),
          pic: '',
          kategori: categoryOptions.length > 0 ? categoryOptions[0] : 'Umum',
          prioritas: priorityOptions.length > 0 ? (priorityOptions[1] || priorityOptions[0]) : 'Medium',
          startDate: globalStartDate,
          endDate: globalEndDate,
          startTime: '08:00',
          endTime: '17:00',
          deskripsi: '',
          lokasi: ''
        };
        currentDescription = [];
      } else {
        currentTask.nama = keywordMatch[2].trim();
      }
      continue;
    }

    // Check if line indicates an agenda header like "1. Rapat..." without standard numbering
    if (/^(rapat|meeting|agenda|pembahasan|sosialisasi|pelatihan|workshop|focus group discussion|fgd|review|evaluasi)\b/i.test(line) && line.length < 100) {
      if (!currentTask.nama || currentTask.nama === 'Pekerjaan Baru') {
        currentTask.nama = line;
      } else if (currentTask.nama && currentTask.pic) {
        // We already have a full task, so this begins a new one
        currentTask.deskripsi = currentDescription.join('\n').trim();
        tasks.push(currentTask as ParsedTask);

        currentTask = {
          nama: line,
          pic: '',
          kategori: categoryOptions.length > 0 ? categoryOptions[0] : 'Umum',
          prioritas: priorityOptions.length > 0 ? (priorityOptions[1] || priorityOptions[0]) : 'Medium',
          startDate: globalStartDate,
          endDate: globalEndDate,
          startTime: '08:00',
          endTime: '17:00',
          deskripsi: '',
          lokasi: ''
        };
        currentDescription = [];
      }
      currentDescription.push(line);
      continue;
    }

    // Date range parsing
    const parsedDate = parseDateIndonesianRange(line);
    if (parsedDate) {
      currentTask.startDate = parsedDate.startDate;
      currentTask.endDate = parsedDate.endDate;
      globalStartDate = parsedDate.startDate;
      globalEndDate = parsedDate.endDate;
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
    else if (lowerLine.includes('🏩') || lowerLine.includes('📍') || lowerLine.includes('🏢') || /tempat\s*:/i.test(line) || /lokasi\s*:/i.test(line) || /ruang\s*:/i.test(line) || /link\s*:/i.test(line) || locationOptions.some(l => lowerLine.includes(l.toLowerCase().replace(/^(online|offline):\s*/i, '').trim()))) {
      const matchedMaster = locationOptions.find(l => {
        const clean = l.toLowerCase().replace(/^(online|offline):\s*/i, '').trim();
        return clean.length > 2 && lowerLine.includes(clean);
      });

      let rawLoc = matchedMaster || line.replace(/^[🏩📍🏢\s]+[:\-]?\s*/, '').replace(/^(tempat|lokasi|ruang|link)\s*[:\-]?\s*/i, '').trim();
      const cleanLoc = rawLoc.trim();
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
      let matchedPics: string[] = [];
      if (picOptions.length > 0) {
        // Sort by length descending to match longest names first
        const sortedPics = [...picOptions].sort((a, b) => b.length - a.length);
        let remainingLine = lowerLine;
        for (const p of sortedPics) {
           const pLower = p.toLowerCase();
           if (remainingLine.includes(pLower)) {
               matchedPics.push(p);
               remainingLine = remainingLine.replace(pLower, '');
           }
        }
      }
      
      if (matchedPics.length > 0) {
        if (!currentTask.pic) {
          currentTask.pic = matchedPics[0];
          if (matchedPics.length > 1) {
            currentTask.additionalPics = JSON.stringify(matchedPics.slice(1));
          }
        } else {
           let existing: string[] = [];
           try {
             if (currentTask.additionalPics) existing = JSON.parse(currentTask.additionalPics);
           } catch(e){}
           
           const newAdditional = Array.from(new Set([...existing, ...matchedPics])).filter(p => p !== currentTask.pic);
           if (newAdditional.length > 0) {
             currentTask.additionalPics = JSON.stringify(newAdditional);
           }
        }
      }
      
      if (lowerLine.includes('prioritas') && priorityOptions.length > 0) {
         const matchedPrio = priorityOptions.find(p => lowerLine.includes(p.toLowerCase()));
         if (matchedPrio) currentTask.prioritas = matchedPrio;
      }

      if (lowerLine.includes('kategori') && categoryOptions.length > 0) {
         const matchedCat = categoryOptions.find(c => lowerLine.includes(c.toLowerCase()));
         if (matchedCat) currentTask.kategori = matchedCat;
      }

      currentDescription.push(line);
    }
  }

  // Save the last one
  if (currentTask.nama) {
    currentTask.deskripsi = currentDescription.join('\n').trim();
    tasks.push(currentTask as ParsedTask);
  }
  
  return tasks;
}
