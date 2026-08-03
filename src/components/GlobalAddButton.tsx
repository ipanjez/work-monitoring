'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Upload, Download } from 'lucide-react';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import SmartAddModal from '@/components/SmartAddModal';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';


export default function GlobalAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  
  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Low', 'Medium', 'High', 'Critical']);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setMasterCats(data.master_categories);
        if (data.master_pics) setMasterPics(data.master_pics);
        if (data.master_statuses) setMasterStatuses(data.master_statuses);
        if (data.master_priorities) setMasterPriorities(data.master_priorities);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSaveModal = async (task: any) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      setIsAddModalOpen(false);
      toast.success('Pekerjaan berhasil ditambahkan!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }
    } catch (err: any) {
      toast.error('Gagal menambahkan pekerjaan.');
    }
  };

  const handleSaveSmartModal = async (tasks: any[]) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks),
      });
      setIsSmartModalOpen(false);
      toast.success('Beberapa pekerjaan berhasil ditambahkan!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }
    } catch (err: any) {
      toast.error('Gagal menambahkan pekerjaan bulk.');
    }
  };

  // Helper: normalize time values from Excel (decimal, dot, or colon format) to HH:mm
  const normalizeTime = (val: any): string | null => {
    if (val == null || val === '') return null;
    const str = String(val).trim();
    // Already HH:mm format
    if (/^\d{1,2}:\d{2}$/.test(str)) return str.padStart(5, '0');
    // Dot format like 12.25 meaning 12:25
    if (/^\d{1,2}\.\d{2}$/.test(str)) {
      const [h, m] = str.split('.');
      return `${h.padStart(2, '0')}:${m}`;
    }
    // Excel decimal time (0-1 range, e.g. 0.333 = 08:00)
    const num = Number(str);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalMinutes = Math.round(num * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    // Plain number like 8 or 13 (just hours)
    if (!isNaN(num) && num >= 0 && num <= 24 && Number.isInteger(num)) {
      return `${String(num).padStart(2, '0')}:00`;
    }
    return str;
  };

  // Helper: normalize date values from Excel (serial number or string) to ISO string
  const normalizeDate = (val: any, fieldName: string, idx: number): string => {
    if (val == null || val === '') return new Date().toISOString();
    
    let date: Date;
    if (typeof val === 'number') {
      // Excel serial date (days since Dec 30, 1899)
      date = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else {
      date = new Date(String(val).trim());
    }

    if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
      throw new Error(`Format ${fieldName} pada Data ke-${idx + 1} tidak valid: "${val}". Harap gunakan format YYYY-MM-DD.`);
    }
    return date.toISOString();
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        let wsname = wb.SheetNames.find((name: string) => name.toLowerCase().includes('pekerjaan') || name.toLowerCase().includes('task')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        const data = rawData.map((r: any) => {
          const normalized: any = {};
          for (const k in r) {
             normalized[k.trim().toLowerCase()] = r[k];
          }
          return normalized;
        }).filter((r: any) => {
          const nama = r['nama pekerjaan'] || r['nama'] || '';
          return !nama.includes('Contoh Pekerjaan A');
        });

        const formattedData = data.map((row: any, idx: number) => {
          let subTasksJson = null;
          const subPekerjaanRaw = row['sub pekerjaan'] || row['subpekerjaan'];
          if (subPekerjaanRaw && typeof subPekerjaanRaw === 'string') {
             const lines = subPekerjaanRaw.split('\n').filter(s => s.trim());
             const subTasks = lines.map(line => {
                const match = line.match(/^\[(.*?)\]\s+(.*)/);
                let status = 'To Do';
                let text = line.trim();
                const validStatuses = masterStatuses.length > 0 ? masterStatuses : ['To Do', 'In Progress', 'Done'];
                if (match && validStatuses.includes(match[1])) {
                   status = match[1];
                   text = match[2].trim();
                } else if (match) {
                   text = line.replace(/^\[.*?\]\s*/, '').trim() || line.trim();
                }
                return {
                   id: Math.random().toString(36).substring(2, 9),
                   text,
                   status,
                   logs: [{ status, timestamp: new Date().toISOString() }]
                };
             });
             if (subTasks.length > 0) subTasksJson = JSON.stringify(subTasks);
          }
          
          const additionalPicsStr = row['pic tambahan'] || row['pictambahan'] || '';
          let additionalPicsJson = null;
          if (additionalPicsStr) {
            const picsArr = additionalPicsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
            if (picsArr.length > 0) additionalPicsJson = JSON.stringify(picsArr);
          }
          
          const isAllDayStr = (row['sepanjang hari'] || row['isallday'] || 'Ya').toString().toLowerCase();
          const isAllDay = isAllDayStr === 'ya' || isAllDayStr === 'true' || isAllDayStr === '1' || isAllDayStr === 'yes';

          return {
            nama: row['nama pekerjaan'] || row['nama'] || 'Tanpa Nama',
            pic: row['pic utama'] || row['pic'] || 'Unassigned',
            status: row['status'] || 'To Do',
            prioritas: row['prioritas'] || 'Medium',
            kategori: row['kategori'] || 'Umum',
            isAllDay,
            startTime: normalizeTime(row['jam mulai'] || row['starttime']),
            endTime: normalizeTime(row['jam selesai'] || row['endtime']),
            repetisi: row['repetisi'] || 'Tidak Berulang',
            deskripsi: row['deskripsi'] || '',
            catatan: row['catatan'] || '',
            startDate: normalizeDate(row['tanggal mulai'] || row['startdate'], 'Tanggal Mulai', idx),
            endDate: normalizeDate(row['tenggat waktu'] || row['enddate'], 'Tenggat Waktu', idx),
            ...(subTasksJson ? { subTasksJson } : {}),
            ...(additionalPicsJson ? { additionalPics: additionalPicsJson } : {}),
          };
        }).filter((d: any) => d.nama !== 'Tanpa Nama' || d.pic !== 'Unassigned');

        if (formattedData.length === 0) {
          toast.error('Tidak ada data valid di Excel. Pastikan header sesuai template.');
          return;
        }

        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData),
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tasksUpdated'));
        }

        toast.success(`Berhasil mengimpor ${formattedData.length} data pekerjaan dari Excel!`);
        setIsOpen(false);
      } catch (err: any) {
        console.error(err);
        toast.error(`Gagal mengimpor file Excel: ${err?.message || err}`);
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      // Selalu fetch data master terbaru sebelum membuat template
      let latestPics = masterPics;
      let latestCats = masterCats;
      let latestStatuses = masterStatuses;
      let latestPriorities = masterPriorities;
      try {
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData.master_pics && settingsData.master_pics.length > 0) latestPics = settingsData.master_pics;
        if (settingsData.master_categories && settingsData.master_categories.length > 0) latestCats = settingsData.master_categories;
        if (settingsData.master_statuses && settingsData.master_statuses.length > 0) latestStatuses = settingsData.master_statuses;
        if (settingsData.master_priorities && settingsData.master_priorities.length > 0) latestPriorities = settingsData.master_priorities;
      } catch (e) { console.error('Failed to fetch settings for template', e); }

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Buat sheet konfigurasi tersembunyi untuk referensi dropdown panjang
      const configSheet = workbook.addWorksheet('Config', { state: 'hidden' });
      const uniquePics = latestPics.length > 0 ? latestPics : ['Unassigned'];
      configSheet.getColumn('A').values = uniquePics;
      const uniqueCats = latestCats.length > 0 ? latestCats : ['Umum'];
      configSheet.getColumn('B').values = uniqueCats;

      const worksheet = workbook.addWorksheet('Template Pekerjaan');

      // Tentukan Header — urutan sama persis dengan TasksClient
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
        { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 50 },
      ];

      // Beri warna pada header
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };

      // Auto wrap untuk kolom Sub Pekerjaan
      worksheet.getColumn('O').alignment = { wrapText: true, vertical: 'top' };

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
        subPekerjaan: '[Done] Mengumpulkan data\n[In Progress] Menganalisis data\n[To Do] Membuat laporan akhir',
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

      // Set kolom Jam Mulai & Jam Selesai sebagai text agar Excel tidak auto-convert
      for (let i = 2; i <= 1000; i++) {
        worksheet.getCell(`I${i}`).numFmt = '@';
        worksheet.getCell(`J${i}`).numFmt = '@';
      }

      // Tambahkan Data Validation untuk 1000 baris pertama
      for (let i = 2; i <= 1000; i++) {
        // PIC Utama
        worksheet.getCell(`B${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Config!$A$1:$A$${uniquePics.length}`]
        };

        // Kategori
        worksheet.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Config!$B$1:$B$${uniqueCats.length}`]
        };

        // Prioritas
        worksheet.getCell(`E${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${(latestPriorities.length > 0 ? latestPriorities : ['Low','Medium','High','Urgent']).join(',')}"`]
        };

        // Status
        worksheet.getCell(`F${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${(latestStatuses.length > 0 ? latestStatuses : ['To Do','In Progress','Done']).join(',')}"`]
        };

        // Sepanjang Hari (Ya/Tidak)
        worksheet.getCell(`G${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Ya,Tidak"']
        };

        // Repetisi
        worksheet.getCell(`L${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Tidak Berulang,Harian,Mingguan,Bulanan"']
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

      // Title
      guideSheet.mergeCells('A1:D1');
      const titleCell = guideSheet.getCell('A1');
      titleCell.value = 'PANDUAN PENGISIAN TEMPLATE IMPORT PEKERJAAN';
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      guideSheet.getRow(1).height = 30;

      // Table Header
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

      // Tips section
      const tipsStartRow = 4 + guideData.length + 2;
      guideSheet.mergeCells(`A${tipsStartRow}:D${tipsStartRow}`);
      const tipsTitle = guideSheet.getCell(`A${tipsStartRow}`);
      tipsTitle.value = 'TIPS PENTING';
      tipsTitle.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      tipsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };

      const tips = [
        '1. Baris contoh (baris ke-2 di sheet Template) wajib dibiarkan, mulai isi data asli dari baris ke-3 dan seterusnya.',
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

      // Set all columns alignment
      guideSheet.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
      guideSheet.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Template_Import_Pekerjaan.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      setIsOpen(false);
      toast.success('Template berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat template Excel.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: '20px', right: '75px', zIndex: 9999 }} ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        style={{
          width: '45px', height: '45px', borderRadius: '50%', background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Plus size={20} color="var(--text-primary)" />
      </button>

      {isOpen && (
        <div 
          onMouseLeave={() => setIsOpen(false)}
          style={{
          position: 'absolute', top: '55px', right: '0', width: '220px', background: 'var(--surface-color)',
          border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <button 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setTaskToEdit({
                nama: '',
                deskripsi: '',
                pic: 'Unassigned',
                kategori: 'Umum',
                prioritas: 'Medium',
                status: 'To Do',
                repetisi: 'Tidak Berulang',
                filesList: [],
                additionalPicsList: [],
                subTasksList: [],
                isAllDay: false,
                startTime: '',
                endTime: '',
                startDate: today,
                endDate: today,
                isCustomCategory: false,
                isCustomPic: false,
              });
              setIsOpen(false);
              setIsAddModalOpen(true);
            }}
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', width: '100%' }}
            onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={16} /> Tambah Pekerjaan Biasa
          </button>
          <button 
            onClick={() => { setIsOpen(false); setIsSmartModalOpen(true); }}
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', width: '100%' }}
            onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'transparent'}
          >
            <Zap size={16} /> Tambah Cepat
          </button>
          
          <input type="file" accept=".xlsx, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportExcel} />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', width: '100%' }}
            onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'transparent'}
          >
            <Upload size={16} /> Import Excel
          </button>
          <button 
            onClick={handleDownloadTemplate}
            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', width: '100%' }}
            onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'transparent'}
          >
            <Download size={16} /> Template Excel
          </button>
        </div>
      )}

      {/* Modals rendered outside of dropdown so they don't get unmounted/clipped */}
      <TaskAddEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        taskToEdit={taskToEdit}
        onSave={handleSaveModal}
        formCategoryOptions={masterCats.length > 0 ? masterCats : ['Umum']}
        formPicOptions={masterPics.length > 0 ? masterPics : ['Unassigned']}
        formStatusOptions={masterStatuses}
        formPriorityOptions={masterPriorities}
        setPreviewFile={() => {}}
      />
      <SmartAddModal 
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        picOptions={masterPics.length > 0 ? masterPics : ['Unassigned']}
        onSaveBulk={handleSaveSmartModal}
      />
    </div>
  );
}
