export function checkSearchMatch(task: any, query: string, exactMatch: boolean = false): boolean {
  if (!query) return true;
  
  const q = query.toLowerCase().trim();
  if (!q) return true;

  // Kumpulkan nama file lampiran dan sub-item
  const fileNames: string[] = [];
  
  if (task.fileName) fileNames.push(task.fileName);
  if (task.fileUrl) {
    try {
      const decoded = decodeURIComponent(task.fileUrl);
      const cleanName = decoded.replace(/^.*[\\\/]/, '').replace(/^\d+_\d+_/, '');
      fileNames.push(decoded, cleanName);
    } catch {}
  }

  if (task.filesJson) {
    try {
      const files = typeof task.filesJson === 'string' ? JSON.parse(task.filesJson) : task.filesJson;
      if (Array.isArray(files)) {
        files.forEach((f: any) => {
          if (f.name) fileNames.push(f.name);
          if (f.url) {
            try {
              const decoded = decodeURIComponent(f.url);
              const cleanName = decoded.replace(/^.*[\\\/]/, '').replace(/^\d+_\d+_/, '');
              fileNames.push(decoded, cleanName);
            } catch {}
          }
        });
      }
    } catch {}
  }

  if (task.commentsJson) {
    try {
      const comments = typeof task.commentsJson === 'string' ? JSON.parse(task.commentsJson) : task.commentsJson;
      if (Array.isArray(comments)) {
        comments.forEach((c: any) => {
          if (c.text) fileNames.push(c.text);
          if (c.fileName) fileNames.push(c.fileName);
          if (c.fileUrl) {
            try {
              const decoded = decodeURIComponent(c.fileUrl);
              fileNames.push(decoded);
            } catch {}
          }
        });
      }
    } catch {}
  }

  if (task.subTasksJson) {
    try {
      const subtasks = typeof task.subTasksJson === 'string' ? JSON.parse(task.subTasksJson) : task.subTasksJson;
      if (Array.isArray(subtasks)) {
        subtasks.forEach((st: any) => {
          if (st.text) fileNames.push(st.text);
          if (st.title) fileNames.push(st.title);
          if (st.pic) fileNames.push(st.pic);
        });
      }
    } catch {}
  }

  // Gabungkan semua field yang relevan untuk dicari
  const searchSpace = [
    task.nama,
    task.pic,
    task.additionalPics,
    task.kategori,
    task.lokasi,
    task.prioritas,
    task.status,
    task.deskripsi,
    task.catatan,
    ...fileNames
  ].filter(Boolean).join(' ');

  if (exactMatch) {
    // Pencarian kata persis (Exact word match)
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escapedQuery}([^a-zA-Z0-9_]|$)`, 'i');
    return regex.test(searchSpace);
  } else {
    // Pencarian substring biasa (default)
    return searchSpace.toLowerCase().includes(q);
  }
}
