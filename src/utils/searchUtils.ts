export function checkSearchMatch(task: any, query: string, exactMatch: boolean = false): boolean {
  if (!query) return true;
  
  const q = query.toLowerCase().trim();
  if (!q) return true;

  // Gabungkan semua field yang relevan untuk dicari
  const searchSpace = [
    task.nama,
    task.pic,
    task.additionalPics,
    task.kategori,
    task.deskripsi,
    task.catatan
  ].filter(Boolean).join(' ');

  if (exactMatch) {
    // Pencarian kata persis (Exact word match)
    // Escaping regex
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Menggunakan regex boundaries untuk memastikan kata utuh
    // Karena kata bahasa Indonesia bisa mengandung karakter khusus, kita gunakan boundary word standar
    const regex = new RegExp(`\\b${escapedQuery}\\b`, 'i');
    return regex.test(searchSpace);
  } else {
    // Pencarian substring biasa (default)
    return searchSpace.toLowerCase().includes(q);
  }
}
