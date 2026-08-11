'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Upload, Download } from 'lucide-react';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import SmartAddModal from '@/components/SmartAddModal';
import * as XLSX from 'xlsx';
import { useNotifications } from '@/context/NotificationContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';


export default function GlobalAddButton() {
  const { data: session } = useSession();
  const { addActivityLog } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  
  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Low', 'Medium', 'High', 'Critical']);
  const [masterLocations, setMasterLocations] = useState<string[]>([]);
  
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
        if (data.master_locations) setMasterLocations(data.master_locations);
      })
      .catch(console.error);

    fetch('/api/users/pics')
      .then(res => res.json())
      .then(names => {
        if (Array.isArray(names)) {
          setMasterPics(prev => Array.from(new Set([...prev, ...names])));
        }
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
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const saved = await res.json();
        if (addActivityLog) {
          const currentUser = (session?.user as any)?.name || 'Sistem';
          addActivityLog('CREATE_TASK', 'Pekerjaan Baru', `Pekerjaan "${saved.nama}" telah ditambahkan oleh ${currentUser}.`, 'success');
        }
      }
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
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks),
      });
      if (res.ok) {
        const savedList = await res.json();
        if (addActivityLog && Array.isArray(savedList)) {
          const currentUser = (session?.user as any)?.name || 'Sistem';
          savedList.forEach(saved => {
            addActivityLog('CREATE_TASK', 'Pekerjaan Baru', `Pekerjaan "${saved.nama}" telah ditambahkan oleh ${currentUser}.`, 'success');
          });
        }
      }
      setIsSmartModalOpen(false);
      toast.success('Beberapa pekerjaan berhasil ditambahkan!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }
    } catch (err: any) {
      toast.error('Gagal menambahkan pekerjaan bulk.');
    }
  };

  // Helper: parse lokasi value from Excel to JSON string
  const parseLokasiFromExcel = (val: any): string | null => {
    if (!val) return null;
    const str = String(val).trim();
    if (!str) return null;

    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        JSON.parse(str);
        return str;
      } catch (e) {}
    }

    const lower = str.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.includes('zoom.us') || lower.includes('meet.google.com') || lower.includes('teams.live.com') || lower.includes('teams.microsoft') || lower.startsWith('online:')) {
      const cleanLink = str.replace(/^online:\s*/i, '').trim();
      return JSON.stringify({ tipe: 'online', linkZoom: cleanLink, lokasiFisik: '', jam: '' });
    } else {
      const cleanPhys = str.replace(/^offline:\s*/i, '').trim();
      return JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: cleanPhys, jam: '' });
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
      const toastId = toast.loading('Sedang memproses dan menyimpan data...');
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
                 let pic: string | undefined = undefined;
                 let additionalPics: string[] | undefined = undefined;
                 let tenggatWaktu: string | undefined = undefined;

                 // Parse extra fields like | PIC: Name1, Name2 | Tenggat: 2026-08-15
                 const picMatch = text.match(/\|\s*PIC:\s*([^|]+)/i);
                 const tenggatMatch = text.match(/\|\s*Tenggat:\s*([^|]+)/i);

                 if (picMatch) {
                   const picRaw = picMatch[1].trim();
                   const picParts = picRaw.split(',').map(s => s.trim()).filter(Boolean);
                   if (picParts.length > 0) {
                     pic = picParts[0];
                     if (picParts.length > 1) {
                       additionalPics = picParts.slice(1);
                     }
                   }
                   text = text.replace(picMatch[0], '').trim();
                 }
                 if (tenggatMatch) {
                   tenggatWaktu = tenggatMatch[1].trim();
                   text = text.replace(tenggatMatch[0], '').trim();
                 }

                 // Remove any trailing or leading pipe characters left over
                 text = text.replace(/^[|\s]+|[|\s]+$/g, '').trim();

                 return {
                    id: Math.random().toString(36).substring(2, 9),
                    text,
                    status,
                    ...(pic ? { pic } : {}),
                    ...(additionalPics ? { additionalPics } : {}),
                    ...(tenggatWaktu ? { tenggatWaktu } : {}),
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
            lokasi: parseLokasiFromExcel(row['lokasi pekerjaan'] || row['lokasi']),
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

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Terjadi kesalahan di server saat menyimpan data.');
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tasksUpdated'));
        }

        toast.dismiss(toastId);
        toast.success(`Berhasil mengimpor ${formattedData.length} data pekerjaan dari Excel!`);
        setIsOpen(false);
      } catch (err: any) {
        console.error(err);
        toast.dismiss(toastId);
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
      let latestLocations = masterLocations;
      try {
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData.master_pics && settingsData.master_pics.length > 0) latestPics = settingsData.master_pics;
        if (settingsData.master_categories && settingsData.master_categories.length > 0) latestCats = settingsData.master_categories;
        if (settingsData.master_statuses && settingsData.master_statuses.length > 0) latestStatuses = settingsData.master_statuses;
        if (settingsData.master_priorities && settingsData.master_priorities.length > 0) latestPriorities = settingsData.master_priorities;
        if (settingsData.master_locations && settingsData.master_locations.length > 0) latestLocations = settingsData.master_locations;
      } catch (e) { console.error('Failed to fetch settings for template', e); }

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Buat sheet konfigurasi tersembunyi untuk referensi dropdown panjang
      const configSheet = workbook.addWorksheet('Config', { state: 'hidden' });
      const uniquePics = latestPics.length > 0 ? latestPics : ['Unassigned'];
      configSheet.getColumn('A').values = uniquePics;
      const uniqueCats = latestCats.length > 0 ? latestCats : ['Umum'];
      configSheet.getColumn('B').values = uniqueCats;
      const uniqueLocations = latestLocations.length > 0 ? latestLocations : ['Online: Zoom Meeting', 'Offline: Ruang Rapat Lt. 1'];
      configSheet.getColumn('C').values = uniqueLocations;

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
        lokasi: 'Online: https://zoom.us/j/12345678',
        catatan: 'Contoh catatan',
        subPekerjaan: '[Done] Mengumpulkan data | PIC: Putri | Tenggat: 2026-08-15\n[In Progress] Menganalisis data | PIC: Budi | Tenggat: 2026-08-20\n[To Do] Membuat laporan akhir',
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

        // Lokasi Pekerjaan
        worksheet.getCell(`O${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Config!$C$1:$C$${uniqueLocations.length}`]
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

  if ((session?.user as any)?.role === 'VIEWER') return null;

  return (
    <div 
      style={{ position: 'relative', zIndex: 1000 }} 
      ref={panelRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary"
        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, borderRadius: '8px' }}
      >
        <Plus size={18} /> Tambah Pekerjaan
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100,
            background: 'var(--surface-color)', borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)',
            width: '260px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px'
          }}>
            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={16} color="var(--accent-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Tambah Manual</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Isi form lengkap secara manual</div>
              </div>
            </div>

            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
              onClick={() => { setIsOpen(false); setIsSmartModalOpen(true); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'color-mix(in srgb, #f59e0b 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Tambah Cepat (Smart)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tambah cepat berbasis teks / AI</div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
              onClick={() => { setIsOpen(false); handleDownloadTemplate(); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'color-mix(in srgb, #3b82f6 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={16} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Unduh Template Excel</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Download format excel untuk import</div>
              </div>
            </div>

            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
              onClick={() => { setIsOpen(false); fileInputRef.current?.click(); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'color-mix(in srgb, #10b981 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={16} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Import dari Excel</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Unggah data pekerjaan sekaligus</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Render file input outside so it doesn't get destroyed when dropdown closes */}
      <input type="file" accept=".xlsx, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportExcel} />

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
        categoryOptions={masterCats.length > 0 ? masterCats : ['Umum']}
        priorityOptions={masterPriorities}
        onSaveBulk={handleSaveSmartModal}
      />
    </div>
  );
}
