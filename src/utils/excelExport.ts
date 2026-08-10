import { format } from 'date-fns';
import { getTaskExportRow } from './taskUtils';

export const exportToRichExcel = async (
  tasks: any[],
  config: {
    pics: string[];
    categories: string[];
    locations: string[];
    priorities: string[];
    statuses: string[];
  },
  filename: string = 'Export_Pekerjaan.xlsx',
  isTemplate: boolean = false
) => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();

    // Buat sheet konfigurasi tersembunyi untuk referensi dropdown panjang
    const configSheet = workbook.addWorksheet('Config', { state: 'hidden' });
    const uniquePics = config.pics.length > 0 ? config.pics : ['Unassigned'];
    configSheet.getColumn('A').values = uniquePics;
    const uniqueCats = config.categories.length > 0 ? config.categories : ['Umum'];
    configSheet.getColumn('B').values = uniqueCats;
    const uniqueLocations = config.locations.length > 0 ? config.locations : ['Online: Zoom Meeting', 'Offline: Ruang Rapat'];
    configSheet.getColumn('C').values = uniqueLocations;
    
    const worksheet = workbook.addWorksheet(isTemplate ? 'Template Pekerjaan' : 'Daftar Pekerjaan');

    // Tentukan Header
    worksheet.columns = [
      { header: 'Nama Pekerjaan', key: 'nama', width: 35 },
      { header: 'PIC Utama', key: 'pic', width: 25 },
      { header: 'PIC Tambahan', key: 'picTambahan', width: 30 },
      { header: 'Kategori', key: 'kategori', width: 20 },
      { header: 'Prioritas', key: 'prioritas', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Sepanjang Hari', key: 'isAllDay', width: 16 },
      { header: 'Jam Mulai', key: 'startTime', width: 12 },
      { header: 'Jam Selesai', key: 'endTime', width: 12 },
      { header: 'Tanggal Mulai', key: 'startDate', width: 15 },
      { header: 'Tenggat Waktu', key: 'endDate', width: 15 },
      { header: 'Repetisi', key: 'repetisi', width: 18 },
      { header: 'Deskripsi', key: 'deskripsi', width: 40 },
      { header: 'Catatan', key: 'catatan', width: 40 },
      { header: 'Lokasi Pekerjaan', key: 'lokasi', width: 30 },
      { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 50 },
    ];

    // Beri warna pada header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };

    // Auto wrap untuk kolom Lokasi Pekerjaan & Sub Pekerjaan
    worksheet.getColumn('O').alignment = { wrapText: true, vertical: 'top' };
    worksheet.getColumn('P').alignment = { wrapText: true, vertical: 'top' };

    let currentRow = 2;

    if (isTemplate || tasks.length === 0) {
      // Tambahkan Contoh Isian di baris ke-2
      const exampleRow = worksheet.addRow({
        nama: 'Contoh Pekerjaan A (Jangan dihapus)',
        pic: uniquePics[0] || 'Unassigned',
        picTambahan: 'PIC Lain 1, PIC Lain 2',
        kategori: uniqueCats[0] || 'Umum',
        prioritas: 'High',
        status: 'In Progress',
        isAllDay: 'Tidak',
        startTime: '08:00',
        endTime: '17:00',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        repetisi: 'Tidak Berulang',
        deskripsi: 'Gunakan Alt+Enter untuk baris baru di dalam sel.',
        catatan: 'Contoh catatan',
        lokasi: 'Online: https://zoom.us/j/12345678',
        subPekerjaan: '[Done] Mengumpulkan data | PIC: Putri, Budi | Tenggat: 2026-08-15\n[In Progress] Menganalisis data | PIC: Ahmad | Tenggat: 2026-08-20\n[To Do] Membuat laporan akhir',
      });
      
      // Beri warna latar abu-abu muda untuk baris contoh
      exampleRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
        cell.font = { italic: true, color: { argb: 'FF4B5563' } };
      });
      currentRow++;
    }

    if (tasks.length > 0 && !isTemplate) {
      tasks.forEach((task) => {
        const rowData = getTaskExportRow(task);
        worksheet.addRow({
          nama: rowData['Nama Pekerjaan'],
          pic: rowData['PIC Utama'],
          picTambahan: rowData['PIC Tambahan'],
          kategori: rowData['Kategori'],
          prioritas: rowData['Prioritas'],
          status: rowData['Status'],
          isAllDay: rowData['Sepanjang Hari'],
          startTime: rowData['Jam Mulai'],
          endTime: rowData['Jam Selesai'],
          startDate: rowData['Tanggal Mulai'],
          endDate: rowData['Tenggat Waktu'],
          repetisi: rowData['Repetisi'],
          deskripsi: rowData['Deskripsi'],
          catatan: rowData['Catatan'],
          lokasi: rowData['Lokasi Pekerjaan'],
          subPekerjaan: rowData['Sub Pekerjaan'],
        });
        currentRow++;
      });
    }

    // Set kolom Jam Mulai & Jam Selesai sebagai text agar Excel tidak auto-convert
    const maxRows = Math.max(1000, currentRow + 100);
    for (let i = 2; i <= maxRows; i++) {
      worksheet.getCell(`H${i}`).numFmt = '@';
      worksheet.getCell(`I${i}`).numFmt = '@';
    }

    // Tambahkan Data Validation
    for (let i = 2; i <= maxRows; i++) {
      worksheet.getCell(`B${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`Config!$A$1:$A$${uniquePics.length}`]
      };
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`Config!$B$1:$B$${uniqueCats.length}`]
      };
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${(config.priorities.length > 0 ? config.priorities : ['Low', 'Medium', 'High', 'Urgent']).join(',')}"`]
      };
      worksheet.getCell(`F${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${(config.statuses.length > 0 ? config.statuses : ['To Do', 'In Progress', 'Done']).join(',')}"`]
      };
      worksheet.getCell(`G${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: ['"Ya,Tidak"']
      };
      worksheet.getCell(`L${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: ['"Tidak Berulang,Harian,Mingguan,Bulanan"']
      };
      worksheet.getCell(`O${i}`).dataValidation = {
        type: 'list', allowBlank: true, formulae: [`Config!$C$1:$C$${uniqueLocations.length}`]
      };
    }

    // === Sheet Panduan ===
    const guideSheet = workbook.addWorksheet('Panduan');
    guideSheet.columns = [
      { header: '', key: 'kolom', width: 25 },
      { header: '', key: 'penjelasan', width: 60 },
      { header: '', key: 'contoh', width: 35 },
      { header: '', key: 'wajib', width: 12 },
    ];

    guideSheet.mergeCells('A1:D1');
    const titleCell = guideSheet.getCell('A1');
    titleCell.value = 'PANDUAN PENGISIAN TEMPLATE IMPORT PEKERJAAN';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    guideSheet.getRow(1).height = 30;

    const headerRow = guideSheet.getRow(3);
    headerRow.values = ['Nama Kolom', 'Penjelasan', 'Contoh Isian', 'Wajib?'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };

    const guideData = [
      ['Nama Pekerjaan', 'Nama atau judul pekerjaan yang akan dilakukan', 'Membuat Laporan Bulanan', 'Ya'],
      ['PIC Utama', 'Penanggung jawab utama pekerjaan (pilih dari dropdown)', 'Ahmad Fajar', 'Ya'],
      ['PIC Tambahan', 'Penanggung jawab tambahan, pisahkan dengan koma', 'Budi, Sari', 'Tidak'],
      ['Kategori', 'Kategori/jenis pekerjaan sesuai master pengaturan', 'Umum', 'Tidak'],
      ['Prioritas', 'Tingkat prioritas pekerjaan (pilih dari dropdown)', 'High', 'Tidak'],
      ['Status', 'Status progres pekerjaan saat ini (pilih dari dropdown)', 'In Progress', 'Tidak'],
      ['Sepanjang Hari', 'Apakah pekerjaan berlangsung seharian? Ya = tanpa jam, Tidak = pakai jam', 'Tidak', 'Tidak'],
      ['Jam Mulai', 'Jam mulai pekerjaan dalam format 24 jam (HH:mm). Diisi jika Sepanjang Hari = Tidak', '08:00', 'Tidak'],
      ['Jam Selesai', 'Jam selesai pekerjaan dalam format 24 jam (HH:mm). Diisi jika Sepanjang Hari = Tidak', '17:00', 'Tidak'],
      ['Tanggal Mulai', 'Tanggal dimulainya pekerjaan dalam format YYYY-MM-DD', '2026-08-01', 'Tidak'],
      ['Tenggat Waktu', 'Batas waktu penyelesaian pekerjaan dalam format YYYY-MM-DD', '2026-08-15', 'Tidak'],
      ['Repetisi', 'Pengulangan pekerjaan (pilih dari dropdown)', 'Tidak Berulang', 'Tidak'],
      ['Deskripsi', 'Penjelasan detail mengenai pekerjaan. Gunakan Alt+Enter untuk baris baru', 'Membuat laporan keuangan Q3', 'Tidak'],
      ['Lokasi Pekerjaan', 'Lokasi/Tempat pekerjaan. Gunakan awalan "Online:" untuk URL zoom/meet, atau tulis langsung untuk alamat fisik', 'Online: https://zoom.us/j/12345678\nOffline: Ruang Rapat Lt. 2', 'Tidak'],
      ['Catatan', 'Catatan tambahan terkait pekerjaan', 'Perlu koordinasi dengan tim finance', 'Tidak'],
      ['Sub Pekerjaan', 'Daftar sub-tugas dengan format [Status] Nama. Pisahkan dengan Enter (Alt+Enter di Excel)', '[Done] Kumpulkan data\n[To Do] Analisis', 'Tidak'],
    ];
    guideData.forEach((row, idx) => {
      const r = guideSheet.getRow(4 + idx);
      r.values = row;
      r.getCell(1).font = { bold: true };
      if (idx % 2 === 0) {
        r.eachCell(c => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
    });

    const tipsStartRow = 4 + guideData.length + 2;
    guideSheet.mergeCells(`A${tipsStartRow}:D${tipsStartRow}`);
    const tipsTitle = guideSheet.getCell(`A${tipsStartRow}`);
    tipsTitle.value = 'TIPS PENTING';
    tipsTitle.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    tipsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };

    const tips = [
      '1. Baris contoh (baris ke-2 di sheet Template) wajib dibiarkan jika mengimport file template, mulai isi data asli dari baris ke-3 dan seterusnya.',
      '2. Kolom dengan dropdown (PIC, Prioritas, Status, dll) sudah disediakan pilihan otomatis.',
      '3. Format tanggal wajib menggunakan YYYY-MM-DD (contoh: 2026-08-01).',
      '4. Format jam menggunakan HH:mm 24 jam (contoh: 08:00, 13:30, 17:00).',
      '5. Jika Sepanjang Hari = "Ya", kolom Jam Mulai dan Jam Selesai akan diabaikan.',
      '6. Untuk Sub Pekerjaan, gunakan format: [Status] Nama Sub Pekerjaan.',
      '7. Status yang valid untuk Sub Pekerjaan sesuai dengan Master Status yang sudah diatur.',
      '8. PIC Tambahan dipisahkan dengan tanda koma (,).',
      '9. Gunakan Alt+Enter untuk membuat baris baru di dalam satu sel Excel.',
    ];
    tips.forEach((tip, idx) => {
      const r = guideSheet.getRow(tipsStartRow + 1 + idx);
      guideSheet.mergeCells(`A${tipsStartRow + 1 + idx}:D${tipsStartRow + 1 + idx}`);
      r.getCell(1).value = tip;
      r.getCell(1).font = { size: 11 };
    });

    guideSheet.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
    guideSheet.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting rich excel:', error);
    return false;
  }
};
