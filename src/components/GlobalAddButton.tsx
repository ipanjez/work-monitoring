'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Upload, Download } from 'lucide-react';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import SmartAddModal from '@/components/SmartAddModal';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';


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
        });

        const formattedData = data.map((row: any) => {
          let p = Number(row['progress (%)'] || row['progress'] || 0);
          if (isNaN(p)) p = 0;
          
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
            progress: p,
            isAllDay,
            startTime: row['jam mulai'] || row['starttime'] || null,
            endTime: row['jam selesai'] || row['endtime'] || null,
            repetisi: row['repetisi'] || 'Tidak Berulang',
            deskripsi: row['deskripsi'] || '',
            catatan: row['catatan'] || '',
            startDate: row['tanggal mulai'] || row['startdate'] || new Date().toISOString(),
            endDate: row['tenggat waktu'] || row['enddate'] || new Date().toISOString(),
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
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template Pekerjaan');

      worksheet.columns = [
        { header: 'Nama Pekerjaan', key: 'nama', width: 30 },
        { header: 'PIC Utama', key: 'pic', width: 20 },
        { header: 'PIC Tambahan', key: 'picTambahan', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Prioritas', key: 'prioritas', width: 15 },
        { header: 'Kategori', key: 'kategori', width: 20 },
        { header: 'Progress (%)', key: 'progress', width: 15 },
        { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 40 },
        { header: 'Sepanjang Hari', key: 'isAllDay', width: 15 },
        { header: 'Tanggal Mulai', key: 'startDate', width: 20 },
        { header: 'Tenggat Waktu', key: 'endDate', width: 20 },
        { header: 'Jam Mulai', key: 'startTime', width: 15 },
        { header: 'Jam Selesai', key: 'endTime', width: 15 },
        { header: 'Repetisi', key: 'repetisi', width: 20 },
        { header: 'Deskripsi', key: 'deskripsi', width: 40 },
        { header: 'Catatan', key: 'catatan', width: 40 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Template_Import_Pekerjaan.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      setIsOpen(false);
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
                isAllDay: true,
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
