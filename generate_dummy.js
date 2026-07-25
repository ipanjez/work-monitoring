const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateDummy() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Pekerjaan');

  worksheet.columns = [
    { header: 'Nama Pekerjaan', key: 'nama', width: 35 },
    { header: 'PIC Utama', key: 'pic', width: 25 },
    { header: 'PIC Tambahan', key: 'picTambahan', width: 30 },
    { header: 'Kategori', key: 'kategori', width: 20 },
    { header: 'Prioritas', key: 'prioritas', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Tanggal Mulai', key: 'startDate', width: 15 },
    { header: 'Tenggat Waktu', key: 'endDate', width: 15 },
    { header: 'Deskripsi', key: 'deskripsi', width: 40 },
    { header: 'Catatan', key: 'catatan', width: 40 },
    { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 50 },
  ];

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['To Do', 'In Progress', 'Done'];
  const categories = ['IT Support', 'Keuangan', 'Pemasaran', 'SDM', 'Operasional', 'Umum'];
  const pics = ['Farhan', 'Budi', 'Andi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita'];

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomProgress = (status) => {
    if (status === 'Done') return 100;
    if (status === 'To Do') return 0;
    return Math.floor(Math.random() * 80) + 10;
  };

  const getSubTasks = () => {
    const num = Math.floor(Math.random() * 3) + 1; // 1 to 3 subtasks
    let tasks = [];
    for(let i=1; i<=num; i++) {
        const status = getRandom(['[Done]', '[In Progress]', '[To Do]']);
        tasks.push(`${status} Langkah ${i} untuk pekerjaan ini`);
    }
    return tasks.join('\n');
  };

  const today = new Date();
  
  for (let i = 1; i <= 20; i++) {
    const status = getRandom(statuses);
    const start = new Date(today);
    start.setDate(today.getDate() - Math.floor(Math.random() * 10)); // up to 10 days ago
    const end = new Date(start);
    end.setDate(start.getDate() + Math.floor(Math.random() * 14) + 1); // 1 to 15 days later

    const formatDt = (d) => d.toISOString().split('T')[0];

    // Pick 1 to 2 extra pics
    const p1 = getRandom(pics);
    let extras = [];
    if (Math.random() > 0.5) extras.push(getRandom(pics.filter(p => p !== p1)));
    if (Math.random() > 0.8) extras.push(getRandom(pics.filter(p => p !== p1 && !extras.includes(p))));

    worksheet.addRow({
      nama: `Dummy Pekerjaan ${i}: Evaluasi ${getRandom(categories)}`,
      pic: p1,
      picTambahan: extras.join(', '),
      kategori: getRandom(categories),
      prioritas: getRandom(priorities),
      status: status,
      progress: getRandomProgress(status),
      startDate: formatDt(start),
      endDate: formatDt(end),
      deskripsi: `Ini adalah deskripsi panjang untuk pekerjaan ke-${i}.\nTolong diselesaikan dengan baik.\n\nTerima kasih.`,
      catatan: `Catatan tambahan ${i}`,
      subPekerjaan: getSubTasks(),
    });
  }

  // Formatting
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const outPath = 'C:\\Users\\Farhans-WINDOWS\\Desktop\\Dummy_Data_Import_20.xlsx';
  await workbook.xlsx.writeFile(outPath);
  console.log(`Berhasil membuat file dummy di: ${outPath}`);
}

generateDummy().catch(console.error);
