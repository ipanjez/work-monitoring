import { Task } from './taskUtils';

export function expandTasksForCalendar(tasks: Task[], rangeStart: Date, rangeEnd: Date): Task[] {
  const expanded: Task[] = [];
  
  for (const task of tasks) {
    if (!task.repetisi || task.repetisi === 'Tidak Berulang') {
      expanded.push(task);
      continue;
    }

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const durationMs = taskEnd.getTime() - taskStart.getTime();

    // Determine settings
    let every = 1;
    let unit = 'Hari'; // Hari, Minggu, Bulan, Tahun
    let days: string[] = []; // for weekly
    let endType = 'never'; // never, date, occurrences
    let endDate: Date | null = null;
    let endOccurrences: number | null = null;

    if (task.repetisi === 'Harian') { unit = 'Hari'; }
    else if (task.repetisi === 'Mingguan') { unit = 'Minggu'; }
    else if (task.repetisi === 'Bulanan') { unit = 'Bulan'; }
    else if (task.repetisi === 'Tahunan') { unit = 'Tahun'; }
    else if (task.repetisi === 'Hari Kerja (Senin - Jumat)') {
      unit = 'Hari';
      days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    } else if (task.repetisi.startsWith('CUSTOM_RECURRENCE:')) {
      try {
        let jsonStr = task.repetisi.replace('CUSTOM_RECURRENCE:', '');
        let settings = JSON.parse(jsonStr);
        while (typeof settings === 'string') {
          settings = JSON.parse(settings);
        }
        every = settings.every || 1;
        unit = settings.unit || 'Hari';
        days = settings.days || [];
        endType = settings.endType || 'never';
        if (endType === 'date' && settings.endDate) {
          endDate = new Date(settings.endDate);
        }
        if (endType === 'occurrences') {
          endOccurrences = settings.endOccurrences || 1;
        }
      } catch (e) {
        // Fallback
        every = 1; unit = 'Minggu';
      }
    }

    let currentStart = new Date(taskStart);
    let occurrencesCount = 0;
    
    // Safety limit to prevent infinite loops (max 500 instances per task)
    let safetyCounter = 0;
    
    while (currentStart <= rangeEnd && safetyCounter < 500) {
      safetyCounter++;
      
      let isValidDay = true;
      if (days.length > 0) {
        // days map: 0 = Sunday, 1 = Monday...
        const mapDays: Record<string, number> = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
        const currentDayIndex = currentStart.getDay();
        const allowedIndices = days.map(d => mapDays[d]).filter(d => d !== undefined);
        if (allowedIndices.length > 0 && !allowedIndices.includes(currentDayIndex)) {
          isValidDay = false;
        }
      }

      // Ensure we don't generate past the end condition
      if (endType === 'date' && endDate && currentStart > endDate) {
        break;
      }
      if (endType === 'occurrences' && endOccurrences && occurrencesCount >= endOccurrences) {
        break;
      }

      if (isValidDay) {
        // Generate instance if it falls within the current view range or if it's before but might stretch into the range
        // Actually, we can just push it if it ends after rangeStart and starts before rangeEnd
        const currentEnd = new Date(currentStart.getTime() + durationMs);
        if (currentEnd >= rangeStart && currentStart <= rangeEnd) {
          expanded.push({
            ...task,
            id: Number(task.id + occurrencesCount * 0.0001), // give a pseudo-unique ID for rendering
            startDate: currentStart.toISOString(),
            endDate: currentEnd.toISOString(),
          });
        }
        occurrencesCount++;
      }

      // Advance currentStart based on unit
      if (unit === 'Hari') {
        currentStart.setDate(currentStart.getDate() + every);
      } else if (unit === 'Minggu') {
        // If we have specific days, we advance by 1 day until we hit the next allowed day.
        // If we finished a week, we jump `every - 1` weeks.
        if (days.length > 0) {
           const previousDay = currentStart.getDay();
           currentStart.setDate(currentStart.getDate() + 1);
           if (currentStart.getDay() < previousDay && every > 1) { // week rolled over
             currentStart.setDate(currentStart.getDate() + (every - 1) * 7);
           }
        } else {
           currentStart.setDate(currentStart.getDate() + every * 7);
        }
      } else if (unit === 'Bulan') {
        currentStart.setMonth(currentStart.getMonth() + every);
      } else if (unit === 'Tahun') {
        currentStart.setFullYear(currentStart.getFullYear() + every);
      }
    }
  }

  return expanded;
}
