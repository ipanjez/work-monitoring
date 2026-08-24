import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Task, SubTask, FileItem, LogItem, CommentItem, getAdditionalPics, getTaskFiles, getHistoryLogs, getTaskComments, formatRecurrenceText, formatLogDetails } from './taskUtils';

const ACCENT = [16, 185, 129] as [number, number, number]; // #10b981
const DARK = [30, 41, 59] as [number, number, number];     // #1e293b
const GRAY = [100, 116, 139] as [number, number, number];  // #64748b
const LIGHT_GRAY = [241, 245, 249] as [number, number, number]; // #f1f5f9
const WHITE = [255, 255, 255] as [number, number, number];
const BLUE = [37, 99, 235] as [number, number, number]; // #2563eb

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}

export function exportTaskPdf(task: Task, appName: string, siteUrl: string, autoDownload: boolean = true): { blob: Blob; url: string; fileName: string } {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  const footerHeight = 16;

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageH - footerHeight + 4;
    doc.setDrawColor(...GRAY);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(`${appName} — Dashboard Monitoring Pekerjaan`, margin, footerY);
    doc.text(`${siteUrl}`, margin, footerY + 3.5);
    doc.text(`Dicetak: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageW - margin, footerY, { align: 'right' });
    doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageW - margin, footerY + 3.5, { align: 'right' });
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageH - footerHeight - 4) {
      doc.addPage();
      y = 16;
    }
  };

  // ======= HEADER BAR =======
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setFillColor(...ACCENT);
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
  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(task.nama, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Priority + Status badges
  doc.setFontSize(9);
  const prioritas = task.prioritas || 'Medium';
  const prioColors: Record<string, [number, number, number]> = {
    'Urgent': [220, 38, 38], 'High': [249, 115, 22], 'Medium': [59, 130, 246], 'Low': [34, 197, 94]
  };
  const prioColor = prioColors[prioritas] || [59, 130, 246];
  doc.setFillColor(...prioColor);
  doc.roundedRect(margin, y - 4, 24, 7, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(prioritas, margin + 12, y + 0.5, { align: 'center' });

  const statusX = margin + 28;
  doc.setFillColor(...ACCENT);
  const statusText = `${task.status} (${task.progress || 0}%)`;
  const statusW = Math.max(doc.getTextWidth(statusText) + 6, 24);
  doc.roundedRect(statusX, y - 4, statusW, 7, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.text(statusText, statusX + statusW / 2, y + 0.5, { align: 'center' });
  y += 12;

  // ======= RINGKASAN STATUS (Summary) =======
  let subTasks: SubTask[] = [];
  if (task.subTasksJson) {
    try { subTasks = JSON.parse(task.subTasksJson); } catch {}
  }

  if (subTasks.length > 0) {
    const statusCounts = subTasks.reduce((acc, st) => {
      acc[st.status] = (acc[st.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    doc.setFillColor(240, 253, 244); // very light green
    doc.roundedRect(margin, y - 2, contentW, 16, 3, 3, 'F');
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y - 2, contentW, 16, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Ringkasan Status Sub Pekerjaan:', margin + 4, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let summaryX = margin + 4;
    const summaryY = y + 10;
    const entries = Object.entries(statusCounts);
    entries.forEach(([status, count], idx) => {
      const label = `${status}: ${count}`;
      const labelW = doc.getTextWidth(label) + 8;
      
      const statusColors: Record<string, [number, number, number]> = {
        'Done': [16, 185, 129], 'In Progress': [245, 158, 11], 'To Do': [239, 68, 68], 'Pending': [239, 68, 68]
      };
      const sColor = statusColors[status] || [59, 130, 246];
      doc.setFillColor(...sColor);
      doc.roundedRect(summaryX, summaryY - 3.5, labelW, 6, 1.5, 1.5, 'F');
      doc.setTextColor(...WHITE);
      doc.text(label, summaryX + labelW / 2, summaryY + 0.5, { align: 'center' });
      summaryX += labelW + 4;
    });

    const totalLabel = `Total: ${subTasks.length}`;
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'bold');
    doc.text(totalLabel, pageW - margin - 4, summaryY + 0.5, { align: 'right' });

    y += 20;
  }

  // ======= FILE LAMPIRAN (moved to top) =======
  const files = getTaskFiles(task);
  if (files.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('File Lampiran', margin, y);
    y += 2;

    const activeFiles = files.filter(f => !f.isDeleted);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Nama File', 'Tanggal Unggah', 'Diunggah Oleh']],
      body: activeFiles.map((f, idx) => [
        `${idx + 1}`,
        f.name,
        f.uploadedAt ? format(new Date(f.uploadedAt), 'dd MMM yyyy') : '-',
        f.uploadedBy || task.pic || '-'
      ]),
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: ACCENT, fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto', textColor: BLUE, fontStyle: 'bold' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 32, halign: 'center' }
      },
      didDrawCell: (data) => {
        // Add hyperlink + underline to file name
        if (data.section === 'body' && data.column.index === 1) {
          const file = activeFiles[data.row.index];
          if (file && file.url) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: file.url });
            // Draw underline
            const textW = doc.getTextWidth(file.name);
            doc.setDrawColor(...BLUE);
            doc.setLineWidth(0.2);
            const textY = data.cell.y + data.cell.height - 2;
            doc.line(data.cell.x + 2, textY, data.cell.x + 2 + Math.min(textW, data.cell.width - 4), textY);
          }
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

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

  checkPage(30);
  autoTable(doc, {
    startY: y,
    head: [['Informasi', 'Detail']],
    body: infoData,
    theme: 'striped',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: DARK, fontSize: 9, fontStyle: 'bold', cellPadding: 3 },
    bodyStyles: { fontSize: 9, cellPadding: 3, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: GRAY },
      1: { cellWidth: 'auto' }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ======= DESKRIPSI =======
  if (task.deskripsi) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
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
  if (subTasks.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Alur Timeline Pekerjaan (Sub Pekerjaan)', margin, y);
    y += 2;

    const subData = subTasks.map((st, idx) => {
      const pics = [st.pic, ...(st.additionalPics || [])].filter(Boolean).join(', ');
      return [
        `${idx + 1}`,
        stripHtml(st.text),
        st.status,
        pics || '-',
        st.tenggatWaktu ? format(new Date(st.tenggatWaktu), 'dd MMM yyyy') : '-',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Sub Pekerjaan', 'Status', 'PIC', 'Tenggat']],
      body: subData,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: ACCENT, fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 30 },
        4: { cellWidth: 24, halign: 'center' }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ======= RIWAYAT PERUBAHAN (3 LOG TERAKHIR) =======
  const allLogs = getHistoryLogs(task);
  const last3Logs = allLogs.slice(-3);
  if (last3Logs.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
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
        log.user || (log as any).author || '-',
        details || '-'
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Waktu', 'Aksi', 'Oleh', 'Detail']],
      body: logData,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: DARK, fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 'auto' }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ======= KOMENTAR =======
  const comments = getTaskComments(task);
  if (comments.length > 0) {
    checkPage(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Komentar', margin, y);
    y += 2;

    const commentData = comments.map(c => [
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
      headStyles: { fillColor: DARK, fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ======= CARA MENGAKSES (Improved) =======
  checkPage(35);

  doc.setFillColor(240, 249, 255); // light blue bg
  doc.roundedRect(margin, y, contentW, 30, 3, 3, 'F');
  doc.setDrawColor(59, 130, 246); // blue border
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, 30, 3, 3, 'S');

  // Left accent bar
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, y, 3, 30, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Panduan Akses & Pembaruan Pekerjaan', margin + 7, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);

  const guideLines = [
    `Langkah 1   Buka halaman ${siteUrl} melalui browser, kemudian masuk (login) dengan akun Anda.`,
    `Langkah 2   Pilih menu "Daftar Pekerjaan", lalu cari judul pekerjaan terkait.`,
    `Langkah 3   Klik pekerjaan untuk membuka detail, kemudian klik tombol "Edit" untuk memperbarui status, progress, dan data lainnya.`,
  ];

  guideLines.forEach((line, idx) => {
    const lineY = y + 12 + idx * 6;
    // "Langkah X" in bold
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(`Langkah ${idx + 1}`, margin + 7, lineY);
    // Rest of text in normal
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    const restText = line.replace(`Langkah ${idx + 1}   `, '');
    doc.text(restText, margin + 24, lineY);
  });

  y += 36;

  // ======= Add footer to all pages =======
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save or return
  const safeFileName = task.nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
  const fileName = `${appName}_Monitoring_${safeFileName}.pdf`;
  const blob = doc.output('blob');
  const url = typeof window !== 'undefined' ? URL.createObjectURL(blob) : '';

  if (autoDownload) {
    doc.save(fileName);
  }

  return { blob, url, fileName };
}
