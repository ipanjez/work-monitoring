import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Task, SubTask, FileItem, LogItem, CommentItem, getAdditionalPics, getTaskFiles, getHistoryLogs, getTaskComments, formatRecurrenceText, formatLogDetails } from './taskUtils';

const ACCENT = [16, 185, 129]; // #10b981
const DARK = [30, 41, 59];     // #1e293b
const GRAY = [100, 116, 139];  // #64748b
const LIGHT_GRAY = [241, 245, 249]; // #f1f5f9
const WHITE: [number, number, number] = [255, 255, 255];
const RED = [220, 38, 38];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}

export function exportTaskPdf(task: Task, appName: string, siteUrl: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  const addFooter = () => {
    const footerY = pageH - 12;
    doc.setDrawColor(...LIGHT_GRAY as [number, number, number]);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageW - margin, footerY - 2);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY as [number, number, number]);
    doc.text(`${appName} — Dashboard Monitoring Pekerjaan | ${siteUrl}`, margin, footerY + 1);
    doc.text(`Dicetak: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageW - margin, footerY + 1, { align: 'right' });
    doc.text(`Halaman ${(doc as any).getNumberOfPages()}`, pageW / 2, footerY + 1, { align: 'center' });
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 20) {
      addFooter();
      doc.addPage();
      y = 16;
    }
  };

  // ======= HEADER BAR =======
  doc.setFillColor(...DARK as [number, number, number]);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setFillColor(...ACCENT as [number, number, number]);
  doc.rect(0, 22, pageW, 2, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(appName, margin, 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Dashboard Monitoring Pekerjaan', pageW - margin, 10, { align: 'right' });
  doc.text(siteUrl, pageW - margin, 15, { align: 'right' });
  y = 30;

  // ======= TASK TITLE =======
  doc.setTextColor(...DARK as [number, number, number]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(task.nama, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Priority + Status badges
  doc.setFontSize(9);
  const prioritas = task.prioritas || 'Medium';
  const prioColors: Record<string, number[]> = {
    'Urgent': [220, 38, 38], 'High': [249, 115, 22], 'Medium': [59, 130, 246], 'Low': [34, 197, 94]
  };
  const prioColor = prioColors[prioritas] || [59, 130, 246];
  doc.setFillColor(...prioColor as [number, number, number]);
  doc.roundedRect(margin, y - 4, 24, 7, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(prioritas, margin + 12, y + 0.5, { align: 'center' });

  const statusX = margin + 28;
  doc.setFillColor(...ACCENT as [number, number, number]);
  const statusText = `${task.status} (${task.progress || 0}%)`;
  const statusW = Math.max(doc.getTextWidth(statusText) + 6, 24);
  doc.roundedRect(statusX, y - 4, statusW, 7, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.text(statusText, statusX + statusW / 2, y + 0.5, { align: 'center' });
  y += 12;

  // ======= INFO TABLE =======
  const extraPics = getAdditionalPics(task);
  const allPics = [task.pic, ...extraPics].join(', ');

  let locationStr = '-';
  if (task.lokasi) {
    try {
      const loc = JSON.parse(task.lokasi);
      if (loc.tipe === 'online') locationStr = `Online: ${loc.linkZoom || '-'}`;
      else if (loc.tipe === 'offline') locationStr = `Offline: ${loc.lokasiFisik || '-'}`;
    } catch { locationStr = task.lokasi; }
  }

  const infoData = [
    ['PIC', allPics],
    ['Kategori', task.kategori || 'Umum'],
    ['Status', `${task.status} (${task.progress || 0}%)`],
    ['Repetisi', formatRecurrenceText(task.repetisi)],
    ['Tanggal Mulai', `${format(new Date(task.startDate), 'dd MMM yyyy')}${!task.isAllDay && task.startTime ? ` ${task.startTime}` : ''}`],
    ['Tenggat Waktu', `${format(new Date(task.endDate), 'dd MMM yyyy')}${!task.isAllDay && task.endTime ? ` ${task.endTime}` : ''}`],
    ['Lokasi', locationStr],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Informasi', 'Detail']],
    body: infoData,
    theme: 'striped',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: DARK as [number, number, number], fontSize: 9, fontStyle: 'bold', cellPadding: 3 },
    bodyStyles: { fontSize: 9, cellPadding: 3, textColor: DARK as [number, number, number] },
    alternateRowStyles: { fillColor: LIGHT_GRAY as [number, number, number] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: GRAY as [number, number, number] },
      1: { cellWidth: 'auto' }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ======= DESKRIPSI =======
  if (task.deskripsi) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK as [number, number, number]);
    doc.text('Deskripsi', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(stripHtml(task.deskripsi), contentW);
    checkPage(descLines.length * 4 + 4);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 6;
  }

  // ======= TIMELINE / SUB-TASKS =======
  if (task.subTasksJson) {
    try {
      const subTasks: SubTask[] = JSON.parse(task.subTasksJson);
      if (subTasks.length > 0) {
        checkPage(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK as [number, number, number]);
        doc.text('Alur Timeline Pekerjaan (Sub Pekerjaan)', margin, y);
        y += 2;

        const subData = subTasks.map((st, idx) => [
          `${idx + 1}`,
          stripHtml(st.text),
          st.status,
          st.pic || '-',
          st.tenggatWaktu ? format(new Date(st.tenggatWaktu), 'dd MMM yyyy') : '-',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['#', 'Sub Pekerjaan', 'Status', 'PIC', 'Tenggat']],
          body: subData,
          theme: 'grid',
          margin: { left: margin, right: margin },
          headStyles: { fillColor: ACCENT as [number, number, number], fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
          bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK as [number, number, number] },
          alternateRowStyles: { fillColor: LIGHT_GRAY as [number, number, number] },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 28 },
            4: { cellWidth: 24, halign: 'center' }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }
    } catch (e) { }
  }

  // ======= RIWAYAT PERUBAHAN (3 LOG TERAKHIR) =======
  const allLogs = getHistoryLogs(task);
  const last3Logs = allLogs.slice(-3);
  if (last3Logs.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK as [number, number, number]);
    doc.text('Informasi & Riwayat Perubahan (3 Log Terakhir)', margin, y);
    y += 2;

    const logData = last3Logs.map(log => {
      let details = (log as any).details || '';
      if (details) {
        details = formatLogDetails(details.startsWith('Diubah:') ? details : `Diubah: ${details}`);
      }
      return [
        format(new Date(log.timestamp), 'dd MMM yyyy HH:mm'),
        log.action,
        details || '-'
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Waktu', 'Aksi', 'Detail']],
      body: logData,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: DARK as [number, number, number], fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK as [number, number, number] },
      alternateRowStyles: { fillColor: LIGHT_GRAY as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 'auto' }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ======= FILE LAMPIRAN =======
  const files = getTaskFiles(task);
  if (files.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK as [number, number, number]);
    doc.text('File Lampiran', margin, y);
    y += 2;

    const fileData = files.filter(f => !f.isDeleted).map((f, idx) => [
      `${idx + 1}`,
      f.name,
      f.size ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : '-',
      f.uploadedAt ? format(new Date(f.uploadedAt), 'dd MMM yyyy') : '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Nama File', 'Ukuran', 'Tanggal Unggah']],
      body: fileData,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: ACCENT as [number, number, number], fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK as [number, number, number] },
      alternateRowStyles: { fillColor: LIGHT_GRAY as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' }
      },
      didDrawCell: (data) => {
        // Add hyperlink to file name cell
        if (data.section === 'body' && data.column.index === 1) {
          const file = files.filter(f => !f.isDeleted)[data.row.index];
          if (file && file.url) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: file.url });
          }
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ======= KOMENTAR =======
  const comments = getTaskComments(task);
  if (comments.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK as [number, number, number]);
    doc.text('Komentar', margin, y);
    y += 2;

    const commentData = comments.map((c, idx) => [
      c.author,
      c.text,
      format(new Date(c.createdAt), 'dd MMM yyyy HH:mm')
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Penulis', 'Komentar', 'Waktu']],
      body: commentData,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: DARK as [number, number, number], fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK as [number, number, number] },
      alternateRowStyles: { fillColor: LIGHT_GRAY as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ======= FOOTER INFORMATION BOX =======
  checkPage(30);
  doc.setFillColor(...LIGHT_GRAY as [number, number, number]);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');
  doc.setDrawColor(...ACCENT as [number, number, number]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK as [number, number, number]);
  doc.text('Cara Mengakses & Memperbarui Pekerjaan Ini:', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY as [number, number, number]);
  doc.setFontSize(7.5);
  doc.text(`1. Buka ${siteUrl} → Login dengan akun Anda`, margin + 4, y + 10);
  doc.text(`2. Pilih menu "Daftar Pekerjaan" → Cari pekerjaan "${task.nama.length > 40 ? task.nama.substring(0, 40) + '...' : task.nama}"`, margin + 4, y + 14);
  doc.text(`3. Klik pekerjaan untuk melihat detail, lalu klik "Edit" untuk memperbarui status, progress, atau informasi lainnya.`, margin + 4, y + 18);

  // Add footer to all pages
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  // Save
  const safeFileName = task.nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
  doc.save(`${appName}_Monitoring_${safeFileName}.pdf`);
}
