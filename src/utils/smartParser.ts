const INDONESIAN_MONTHS: Record<string, string> = {
  'januari': 'January', 'februari': 'February', 'maret': 'March', 'april': 'April',
  'mei': 'May', 'juni': 'June', 'juli': 'July', 'agustus': 'August',
  'september': 'September', 'oktober': 'October', 'november': 'November', 'desember': 'December'
};

export interface ParsedTask {
  nama: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  deskripsi: string;
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

function extractTime(line: string): string {
  // Matches HH:MM or HH.MM (e.g. 08.30, 08:30)
  const timeMatch = line.match(/(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    return `${hours}:${timeMatch[2]}`;
  }
  return '';
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
  let currentTask: Partial<ParsedTask> | null = null;
  let currentDescription: string[] = [];

  const saveCurrentTask = () => {
    if (currentTask && currentTask.nama) {
      currentTask.deskripsi = currentDescription.join('\n').trim();
      tasks.push(currentTask as ParsedTask);
    }
  };

  const isNewTaskLine = (line: string) => {
    return /^\d+[\.\)]\s/.test(line) || /^[•\-\*]\s/.test(line);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like the start of a new task (e.g., "1. Webinar..." or "- Rapat...")
    if (isNewTaskLine(line)) {
      saveCurrentTask();
      
      const name = line.replace(/^\d+[\.\)]\s/, '').replace(/^[•\-\*]\s/, '').trim();
      currentTask = {
        nama: name,
        startDate: globalDate,
        endDate: globalDate,
        startTime: '08:00', // Default
        endTime: '17:00',   // Default
        deskripsi: ''
      };
      currentDescription = [];
      continue;
    }

    // If we are currently parsing a task
    if (currentTask) {
      const lowerLine = line.toLowerCase();
      
      // Time parsing
      if (lowerLine.includes('⏰') || lowerLine.includes('waktu') || lowerLine.includes('jam') || lowerLine.includes('pukul')) {
        const extractedTime = extractTime(line);
        if (extractedTime) {
          currentTask.startTime = extractedTime;
          // We can guess end time is +2 hours or end of day, but leave it as default or user edits
          const [h, m] = extractedTime.split(':').map(Number);
          const endH = Math.min(23, h + 2).toString().padStart(2, '0');
          currentTask.endTime = `${endH}:${m.toString().padStart(2, '0')}`;
        }
        currentDescription.push(line); // Also keep in description for context
      } 
      // Location / Misc Description parsing
      else {
        currentDescription.push(line);
      }
    }
  }

  // Save the last one
  saveCurrentTask();
  
  return tasks;
}
