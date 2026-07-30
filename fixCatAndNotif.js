const fs = require('fs');

// 1. Fix CalendarClient.tsx - remove defaultCategoryList
let calContent = fs.readFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', 'utf8');
calContent = calContent.replace(
  "const defaultCategoryList = ['Umum', 'IT', 'HR', 'Finance', 'Logistik', 'Operasional', 'Marketing', 'Produksi'];\n  const allCategoryOptions = Array.from(new Set([...defaultCategoryList, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c)), ...masterCats]));",
  "const allCategoryOptions = Array.from(new Set([...masterCats, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c))]));"
);
// Also check \r\n variant
calContent = calContent.replace(
  "const defaultCategoryList = ['Umum', 'IT', 'HR', 'Finance', 'Logistik', 'Operasional', 'Marketing', 'Produksi'];\r\n  const allCategoryOptions = Array.from(new Set([...defaultCategoryList, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c)), ...masterCats]));",
  "const allCategoryOptions = Array.from(new Set([...masterCats, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c))]));"
);
fs.writeFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', calContent);
console.log('CalendarClient fixed.');

// 2. Fix TaskDetailModal.tsx - add addActivityLog call after comment is saved
let tdmContent = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');
// Find the spot after 'if (!res.ok) throw...' in handleAddComment and add addActivityLog
tdmContent = tdmContent.replace(
  "if (!res.ok) throw new Error('Gagal menyimpan komentar');\n      router.refresh();",
  "if (!res.ok) throw new Error('Gagal menyimpan komentar');\n      toast.success('Komentar berhasil ditambahkan');\n      if (addActivityLog) addActivityLog('NEW_COMMENT', 'Komentar Baru', `Komentar ditambahkan oleh ${commentAuthor.trim()} pada pekerjaan \"${task!.nama}\"`, 'info');\n      router.refresh();"
);
// Also try \r\n variant
tdmContent = tdmContent.replace(
  "if (!res.ok) throw new Error('Gagal menyimpan komentar');\r\n      router.refresh();",
  "if (!res.ok) throw new Error('Gagal menyimpan komentar');\r\n      toast.success('Komentar berhasil ditambahkan');\r\n      if (addActivityLog) addActivityLog('NEW_COMMENT', 'Komentar Baru', `Komentar ditambahkan oleh ${commentAuthor.trim()} pada pekerjaan \"${task!.nama}\"`, 'info');\r\n      router.refresh();"
);
fs.writeFileSync('src/components/TaskDetailModal.tsx', tdmContent);
console.log('TaskDetailModal fixed.');

// 3. Verify both files
const calVerify = fs.readFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', 'utf8');
console.log('CalendarClient has defaultCategoryList:', calVerify.includes('defaultCategoryList'));

const tdmVerify = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');
console.log('TaskDetailModal has addActivityLog NEW_COMMENT:', tdmVerify.includes("'NEW_COMMENT'"));
