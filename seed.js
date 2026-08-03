const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
  // =============================================
  // Master Data (PIC dan Kategori Asli)
  // =============================================
  const pics = ['Putri', 'Jane', 'Sasmita', 'Brian', 'Oky', 'Farhan', 'Rano', 'Ria', 'Alvi', 'Firda'];
  const categories = ['Program Kerja', 'Kajian Risiko', 'Materi Rapat', 'Proyek', 'Rutin'];
  const statuses = ['To Do', 'In Progress', 'Review', 'Done'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  await prisma.appSetting.upsert({ where: { key: 'master_pics' }, update: { value: JSON.stringify(pics) }, create: { key: 'master_pics', value: JSON.stringify(pics) } });
  await prisma.appSetting.upsert({ where: { key: 'master_categories' }, update: { value: JSON.stringify(categories) }, create: { key: 'master_categories', value: JSON.stringify(categories) } });
  await prisma.appSetting.upsert({ where: { key: 'master_statuses' }, update: { value: JSON.stringify(statuses) }, create: { key: 'master_statuses', value: JSON.stringify(statuses) } });
  await prisma.appSetting.upsert({ where: { key: 'master_priorities' }, update: { value: JSON.stringify(priorities) }, create: { key: 'master_priorities', value: JSON.stringify(priorities) } });
  await prisma.appSetting.upsert({ where: { key: 'dept_name' }, update: { value: 'Departemen Manajemen Risiko Korporasi' }, create: { key: 'dept_name', value: 'Departemen Manajemen Risiko Korporasi' } });
  console.log('✅ Master data AppSetting berhasil disimpan.');

  // =============================================
  // Data Tugas Asli Lengkap
  // =============================================
  await prisma.task.deleteMany({});

  const d = (dateStr) => new Date(dateStr);
  const ap = (arr) => JSON.stringify(arr);
  const start = d('2026-07-25');

  const descPK = '<p>Program kerja tahunan Departemen Manajemen Risiko Korporasi Tahun 2026.</p>';
  const descMR = '<p>Penyusunan materi rapat/forum terkait manajemen risiko.</p>';
  const descRutin = '<p>Pekerjaan rutin Departemen Manajemen Risiko Korporasi.</p>';
  const descProyek = '<p>Proyek yang dikawal Departemen Manajemen Risiko Korporasi Tahun 2026.</p>';

  const tasks = [
    // --- PROGRAM KERJA ---
    { nama: 'Anggaran Unit Kerja', pic: 'Putri', ap: ap(['Ria','Alvi']), kat: 'Program Kerja', pri: 'High', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Risk Maturity Index (RMI)', pic: 'Jane', ap: ap(['Farhan']), kat: 'Program Kerja', pri: 'High', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Inventarisasi Aset Manset', pic: 'Jane', ap: ap(['Brian']), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Penyusunan RKAP Bab MR', pic: 'Jane', ap: ap(['Rano']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Penyusunan RJP Bab MR', pic: 'Jane', ap: ap(['Rano']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Vice Catalyst', pic: 'Brian', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'SIAP GCG', pic: 'Sasmita', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Annual Report (AR) 2026', pic: 'Putri', ap: ap(['Brian','Alvi']), kat: 'Program Kerja', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Penyusunan Annual Report PT Pupuk Kalimantan Timur tahun 2026.</p>', end: d('2026-05-31') },
    { nama: 'Tim Green & Smart Port Pupuk Kaltim (2025)', pic: 'Sasmita', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Sustainability Report (SR) 2026', pic: 'Sasmita', ap: ap(['Jane','Ria']), kat: 'Program Kerja', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Penyusunan Sustainability Report PT Pupuk Kalimantan Timur tahun 2026.</p>', end: d('2026-05-31') },
    { nama: 'Learning Partners 2026', pic: 'Sasmita', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Profil Risiko 2026', pic: 'Jane', ap: ap(['Rano']), kat: 'Program Kerja', pri: 'High', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Penyusunan Risiko Awal Tahun', pic: 'Sasmita', ap: ap([]), kat: 'Program Kerja', pri: 'Medium', stat: 'Done', prog: 100, desk: '<p>Penyusunan risiko awal tahun sebagai dasar Profil Risiko dan RKAP tahun berjalan.</p>', end: d('2026-02-28') },
    { nama: 'Internal Control Over Financial Reporting (ICOFR)', pic: 'Oky', ap: ap(['Sasmita','Ria']), kat: 'Program Kerja', pri: 'High', stat: 'Done', prog: 83, desk: '<p>Penyusunan dan pengesahan dokumen ICOFR (RCM, BPM, kertas kerja CSA/TOD/TOE) bersama unit kerja terkait.</p>', end: d('2026-07-31') },
    { nama: 'Sistem Aplikasi - Kajian Risiko', pic: 'Sasmita', ap: ap(['Alvi']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'SIOKI (2025)', pic: 'Alvi', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Tax Rep', pic: 'Putri', ap: ap(['Rano']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Mental Health Advocate (MHA)', pic: 'Jane', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Business Continuity Management System (BCMS)', pic: 'Oky', ap: ap(['Sasmita','Ria']), kat: 'Program Kerja', pri: 'High', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Innovator Rep', pic: 'Brian', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'KPI Partners', pic: 'Putri', ap: ap(['Ria']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'NEXTGEN', pic: 'Alvi', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Financial Contingency Plan (FCP)', pic: 'Putri', ap: ap(['Alvi']), kat: 'Program Kerja', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Penyusunan Dokumen Financial Contingency Plan (FCP) sebagai bagian RKAP 2026 PT Pupuk Kalimantan Timur.</p>', end: d('2026-06-25') },
    { nama: 'Sistem Aplikasi - RISKMAN', pic: 'Sasmita', ap: ap(['Farhan']), kat: 'Program Kerja', pri: 'Medium', stat: 'Done', prog: 100, desk: descPK, end: d('2026-07-31') },
    { nama: 'Safety Rep', pic: 'Ria', ap: ap([]), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'GUPENKAR', pic: 'Farhan', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Ecomove Agent', pic: 'Farhan', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'ESG', pic: 'Putri', ap: ap([]), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Inventarisasi Aset TI', pic: 'Firda', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'PIC program strategis 2027', pic: 'Sasmita', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Heppy Buddy', pic: 'Jane', ap: ap([]), kat: 'Program Kerja', pri: 'Low', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Komposit Risiko', pic: 'Jane', ap: ap(['Rano']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Organ Pengelola Risiko (OPR)', pic: 'Ria', ap: ap([]), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Risk That Matter (RTM)', pic: 'Brian', ap: ap(['Rano']), kat: 'Program Kerja', pri: 'High', stat: 'In Progress', prog: 50, desk: descPK, end: d('2026-07-31') },
    { nama: 'Implementasi Budaya MR', pic: 'Brian', ap: ap(['Ria']), kat: 'Program Kerja', pri: 'Medium', stat: 'In Progress', prog: 50, desk: '<p>Program internalisasi budaya sadar risiko kepada seluruh karyawan PT Pupuk Kalimantan Timur.</p>', end: d('2026-07-31') },

    // --- KAJIAN RISIKO ---
    { nama: 'Kajian Risiko Dismantling K1', pic: 'Unassigned', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko.</p>', end: d('2026-12-31') },
    { nama: 'Kajian Risiko Restrukturisasi Anper PT Kaltim Jasa Sekurity', pic: 'Jane', ap: ap(['Farhan']), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari KJS.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko tentang Likuidasi/Pembubaran PT PAN', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Portofolio Bisnis.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko Atas Addendum Perjanjian Kredit Bank BRI', pic: 'Putri', ap: ap(['Alvi']), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Dep Keuangan.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Pengadaan New G-3001', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Dep OP 6.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Atas Usulan Hapus Buku Piutang Macet PKT dan JPP TA 2026', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Dep Keuangan.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko atas Pelaksanaan Performance Test Proyek Revamping Ammonia P-2', pic: 'Oky', ap: ap(['Brian']), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari SPM Revamping Ammonia P-2.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Lanjutan Lokasi Alternatif Proyek Ammonia Urea FakFak', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Ketua Tim B Proyek Pabrik Ammonia Urea Fakfak.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko Offtake Agreement Mitsui Negosiasi Awal dan Pasca Negosiasi', pic: 'Sasmita', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Administrasi Penjualan.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko Pengadaan Batubara Tahun 2026 dari PT Kaltim Prima Coal (KPC)', pic: 'Brian', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Pengadaan Barang.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Pro-Cons atas Rencana Penyelesaian Proyek Dredging Pendalaman Alur Tursina III & IV', pic: 'Oky', ap: ap(['Putri']), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Hukum.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko Penerapan Backdate Dokumen Korporat pada Digital Office (DOF)', pic: 'Putri', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Administrasi Korporat.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko terkait Rencana Divestasi PT Kaltim Industrial Estate di PT Kaltim Jasa Sekuriti', pic: 'Jane', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Portofolio Bisnis.</p>', end: d('2026-06-30') },
    { nama: 'Penyampaian Hasil Reviu Kajian Risiko Penghapusan Persediaan Material Obsolete Tahun 2026', pic: 'Sasmita', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Akuntansi.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko atas Penjaminan Aset KIE untuk Pembiayaan Proyek Soda Ash PKT', pic: 'Putri', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Portofolio Bisnis.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko Atas Kajian Hukum Penyelesaian Proyek Dredging Tursina III & IV', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Tim Proyek PLI.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Pengapalan LCO2 Tank PT KPI', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Dep Pelayanan Pelabuhan dan Pengapalan.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko untuk Mengagunkan Aktiva Tetap atas Penarikan Kredit Jangka Panjang Proyek Investasi Pembangunan Gudang dan Infrastruktur Pabrik Soda Ash KIE', pic: 'Putri', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Dep Portofolio Bisnis.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko High Inventory Amonia', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Komp Operasi 1.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Atas Addendum Perjanjian Kredit Perbankan', pic: 'Unassigned', ap: ap(['Alvi']), kat: 'Kajian Risiko', pri: 'High', stat: 'Done', prog: 100, desk: '<p>Permintaan kajian risiko dari Dep Keuangan.</p>', end: d('2026-06-30') },
    { nama: 'Kajian Risiko Divestasi Saham PT Kalimantan Agro Nusantara', pic: 'Jane', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Dep Portofolio Bisnis.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Pemilihan Licensor Ammonia-Urea Fakfak', pic: 'Jane', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Panitia Pemilihan Licensor.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Proyek Amoniak Urea KIPF Tomage', pic: 'Jane', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari Komp Teknik & Pengembangan.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Restrukturisasi Anper PT KMU', pic: 'Sasmita', ap: ap(['Alvi']), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari KMU.</p>', end: d('2026-07-31') },
    { nama: 'Kajian Risiko Restrukturisasi Anper BSH', pic: 'Putri', ap: ap(['Ria']), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari BSH.</p>', end: d('2026-07-31') },
    { nama: 'Permohonan Kajian Risiko CO2 Booster 1106-J', pic: 'Oky', ap: ap([]), kat: 'Kajian Risiko', pri: 'High', stat: 'In Progress', prog: 50, desk: '<p>Permintaan kajian risiko dari SPM Revamping Ammonia P-2.</p>', end: d('2026-07-31') },

    // --- MATERI RAPAT ---
    { nama: 'Penyusunan Materi Rapat Direktorat Januari', pic: 'Putri', ap: ap(['Alvi']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-01-31') },
    { nama: 'Penyusunan Materi Rapat Direktorat Februari', pic: 'Oky', ap: ap(['Rano']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-02-28') },
    { nama: 'Penyusunan Materi Rapat Direktorat Maret', pic: 'Jane', ap: ap(['Ria']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-03-31') },
    { nama: 'Penyusunan Materi Rapat Direktorat April', pic: 'Jane', ap: ap(['Rano']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-04-30') },
    { nama: 'Penyusunan Materi Rapat Direktorat Mei', pic: 'Sasmita', ap: ap(['Farhan']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-05-31') },
    { nama: 'Penyusunan Materi Rapat Direktorat Juni', pic: 'Sasmita', ap: ap(['Alvi']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-06-30') },
    { nama: 'Penyusunan Materi Rapat Direktorat Juli', pic: 'Brian', ap: ap(['Ria']), kat: 'Materi Rapat', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descMR, end: d('2026-07-31') },
    { nama: 'Penyusunan Materi Rapat Direktorat Agustus', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'To Do', prog: 0, desk: descMR, end: d('2026-08-31') },
    { nama: 'Penyusunan Materi Rapat Direktorat September', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'To Do', prog: 0, desk: descMR, end: d('2026-09-30') },
    { nama: 'Penyusunan Materi Rapat Direktorat Oktober', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'To Do', prog: 0, desk: descMR, end: d('2026-10-31') },
    { nama: 'Penyusunan Materi Rapat Direktorat November', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'To Do', prog: 0, desk: descMR, end: d('2026-11-30') },
    { nama: 'Penyusunan Materi Rapat Direktorat Desember', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'To Do', prog: 0, desk: descMR, end: d('2026-12-31') },
    { nama: 'Rapat KPR TW I', pic: 'Jane', ap: ap(['Alvi']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-03-31') },
    { nama: 'Rapat KPR TW II', pic: 'Brian', ap: ap(['Farhan']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-06-30') },
    { nama: 'Rapat KPR TW III', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'In Progress', prog: 50, desk: descMR, end: d('2026-09-30') },
    { nama: 'Rapat KPR TW IV', pic: 'Unassigned', ap: ap([]), kat: 'Materi Rapat', pri: 'Low', stat: 'To Do', prog: 0, desk: descMR, end: d('2026-12-31') },
    { nama: 'Rapat Dekom Direksi Bulan Juni', pic: 'Jane', ap: ap(['Rano']), kat: 'Materi Rapat', pri: 'Medium', stat: 'Done', prog: 100, desk: descMR, end: d('2026-06-30') },
    { nama: 'Rapat kinerja korporat triwulanan', pic: 'Jane', ap: ap(['Rano']), kat: 'Materi Rapat', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descMR, end: d('2026-12-31') },
    { nama: 'Kebijakan MR', pic: 'Sasmita', ap: ap(['Ria']), kat: 'Materi Rapat', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descMR, end: d('2026-12-31') },

    // --- PROYEK ---
    { nama: 'Proyek Revamping P2', pic: 'Brian', ap: ap([]), kat: 'Proyek', pri: 'High', stat: 'In Progress', prog: 50, desk: descProyek, end: d('2026-07-31') },
    { nama: 'Proyek KIPF', pic: 'Jane', ap: ap(['Brian','Rano']), kat: 'Proyek', pri: 'High', stat: 'In Progress', prog: 50, desk: descProyek, end: d('2026-07-31') },
    { nama: 'Proyek Soda Ash', pic: 'Putri', ap: ap(['Farhan']), kat: 'Proyek', pri: 'High', stat: 'In Progress', prog: 50, desk: descProyek, end: d('2026-07-31') },
    { nama: 'Proyek NPK 3', pic: 'Sasmita', ap: ap(['Alvi']), kat: 'Proyek', pri: 'High', stat: 'In Progress', prog: 50, desk: descProyek, end: d('2026-07-31') },
    { nama: 'Proyek Pengembangan Infrastruktur', pic: 'Oky', ap: ap(['Ria']), kat: 'Proyek', pri: 'High', stat: 'In Progress', prog: 50, desk: descProyek, end: d('2026-07-31') },
    { nama: 'Proyek Pioneer', pic: 'Oky', ap: ap(['Ria']), kat: 'Proyek', pri: 'High', stat: 'In Progress', prog: 50, desk: descProyek, end: d('2026-07-31') },

    // --- RUTIN ---
    { nama: 'Non CID Rutin TJSL', pic: 'Ria', ap: ap(['Firda']), kat: 'Rutin', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descRutin, end: d('2026-12-31') },
    { nama: 'Laporan - Laporan Kinerja Unit Kerja', pic: 'Brian', ap: ap(['Farhan']), kat: 'Rutin', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descRutin, end: d('2026-12-31') },
    { nama: 'Asistensi Profil Risiko Unit Kerja & Proyek TW', pic: 'Oky', ap: ap(['Sasmita','Jane','Putri','Brian','Rano','Ria','Alvi','Farhan']), kat: 'Rutin', pri: 'Medium', stat: 'In Progress', prog: 50, desk: descRutin, end: d('2026-12-31') },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    await prisma.task.create({
      data: {
        nama: t.nama,
        pic: t.pic,
        additionalPics: t.ap,
        kategori: t.kat,
        prioritas: t.pri,
        status: t.stat,
        progress: t.prog,
        deskripsi: t.desk,
        isAllDay: true,
        startDate: start,
        endDate: t.end,
        orderIndex: i,
      }
    });
  }

  // Seed Users
  await prisma.user.deleteMany({});
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.create({
    data: {
      name: 'Ryan Hamvy',
      email: 'admin@pkt.co.id',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  await prisma.user.create({
    data: {
      name: 'Brian',
      email: 'brian@pkt.co.id',
      password: hashedPassword,
      role: 'USER',
    }
  });

  await prisma.user.create({
    data: {
      name: 'Oky',
      email: 'oky@pkt.co.id',
      password: hashedPassword,
      role: 'USER',
    }
  });

  console.log('✅ User accounts (Ryan Hamvy, Brian, Oky) successfully seeded with password: password123');
  console.log(`✅ Seeding selesai. ${tasks.length} data pekerjaan asli berhasil dimasukkan!`);
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
