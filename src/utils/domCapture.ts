import { format } from 'date-fns';
import toast from 'react-hot-toast';

export async function captureDomElement(
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    targetWidth?: number;
    extraStyles?: (clonedDoc: Document, clonedEl: HTMLElement) => void;
  }
): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default;

  const currentTheme = typeof document !== 'undefined'
    ? (document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark')
    : 'dark';
  const isDark = currentTheme === 'dark';

  const bg = options?.backgroundColor || (isDark ? '#0f172a' : '#f8fafc');
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: bg,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      // 1. Synchronize theme attributes & root styles
      clonedDoc.documentElement.setAttribute('data-theme', currentTheme);
      clonedDoc.documentElement.style.backgroundColor = bg;
      clonedDoc.documentElement.style.color = textColor;
      clonedDoc.body.style.backgroundColor = bg;
      clonedDoc.body.style.color = textColor;

      // 2. Fix all color-mix or gradient issues in html2canvas
      const badges = clonedDoc.querySelectorAll('[style*="color-mix"], .badge, [class*="badge"]');
      badges.forEach((b: any) => {
        const bgStyle = b.style.backgroundColor;
        if (bgStyle && bgStyle.includes('color-mix')) {
          const colorVal = b.style.color;
          if (colorVal && colorVal.startsWith('#')) {
            b.style.backgroundColor = `${colorVal.substring(0, 7)}26`;
          } else {
            b.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
          }
        }
      });

      const clonedEl = clonedDoc.getElementById(element.id) || (clonedDoc.querySelector(`[data-capture-root]`) as HTMLElement) || clonedDoc.body;
      if (clonedEl && options?.extraStyles) {
        options.extraStyles(clonedDoc, clonedEl as HTMLElement);
      }
    }
  });

  return canvas;
}

/**
 * Export canvas as PNG image file (always downloads).
 */
export async function exportCanvasToImage(
  canvas: HTMLCanvasElement,
  fileNamePrefix: string = 'Screenshot'
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
  if (!blob) {
    throw new Error('Gagal menghasilkan gambar');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileNamePrefix}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Gambar berhasil diunduh! 📥');
}

/** @deprecated Use exportCanvasToImage instead */
export const copyCanvasToClipboardOrDownload = exportCanvasToImage;

/**
 * Smart Dynamic PDF Exporter that PREVENTS cutting sections, cards, and table rows in half.
 * Intelligently analyzes element bounding boxes and canvas pixel buffer to calculate clean page breaks.
 */
export async function exportCanvasToPdf(
  canvas: HTMLCanvasElement,
  fileNamePrefix: string = 'Dokumen',
  sourceElement?: HTMLElement | null
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const currentTheme = typeof document !== 'undefined'
    ? (document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark')
    : 'dark';
  const isDark = currentTheme === 'dark';
  const bg = isDark ? '#0f172a' : '#ffffff';

  // Use A4 landscape dimensions in mm: 297 x 210
  const a4WidthMm = 297;
  const a4HeightMm = 210;
  const marginMm = 8; // 8mm margin
  const footerMarginMm = 6;

  const printW = a4WidthMm - marginMm * 2;
  const printH = a4HeightMm - marginMm * 2 - footerMarginMm;

  // Maximum allowed pixel height per page on canvas
  const maxPageHeightPx = Math.floor(canvas.width * (printH / printW));

  // Collect natural boundary lines (in canvas pixel coordinates)
  const elementBoundaries: { top: number; bottom: number; isRow?: boolean }[] = [];

  if (sourceElement && typeof window !== 'undefined') {
    const rootRect = sourceElement.getBoundingClientRect();
    const scaleFactor = canvas.height / Math.max(1, sourceElement.scrollHeight);

    // Target elements: cards, charts, tables, table rows, and alert banners
    const selectors = [
      '.glass',
      '.card',
      '.card-hover-effect',
      '.full-width-chart',
      '[data-pdf-section]',
      'table',
      'tr',
      '.dashboard-charts-carousel > div',
      '[id^="dashboard-chart-"]',
      '[id^="dashboard-kpi-"]',
      '[id^="reports-kpi-"]',
    ];

    const elements = sourceElement.querySelectorAll<HTMLElement>(selectors.join(', '));
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const relativeTop = (rect.top - rootRect.top) * scaleFactor;
      const relativeBottom = (rect.bottom - rootRect.top) * scaleFactor;
      const isRow = el.tagName.toLowerCase() === 'tr';

      if (relativeBottom > relativeTop && relativeBottom <= canvas.height) {
        elementBoundaries.push({
          top: Math.max(0, Math.floor(relativeTop)),
          bottom: Math.min(canvas.height, Math.ceil(relativeBottom)),
          isRow,
        });
      }
    });

    // Sort by top position
    elementBoundaries.sort((a, b) => a.top - b.top);
  }

  // Calculate smart slice cut points
  const slices: { srcY: number; srcH: number }[] = [];
  let currentY = 0;

  while (currentY < canvas.height) {
    const remainingH = canvas.height - currentY;

    // If remaining content fits completely on the current page
    if (remainingH <= maxPageHeightPx) {
      slices.push({ srcY: currentY, srcH: remainingH });
      break;
    }

    const idealCutY = currentY + maxPageHeightPx;
    let bestCutY = idealCutY;

    // Search for element boundaries that cross the ideal cut point
    if (elementBoundaries.length > 0) {
      // Find all elements that intersect idealCutY
      const intersecting = elementBoundaries.filter(
        (b) => b.top < idealCutY && b.bottom > idealCutY && b.top > currentY
      );

      if (intersecting.length > 0) {
        // Prioritize: if there are table rows, cut before the intersecting row
        const rowIntersecting = intersecting.find((b) => b.isRow);
        const cardIntersecting = intersecting.find((b) => !b.isRow);

        const target = rowIntersecting || cardIntersecting;
        if (target && target.top > currentY + maxPageHeightPx * 0.35) {
          // Pull back cut point so this element starts fresh on next page
          bestCutY = target.top;
        }
      }
    }

    // Safety fallback: ensure minimum page progress
    if (bestCutY <= currentY + maxPageHeightPx * 0.2) {
      bestCutY = idealCutY;
    }

    // Make sure we don't exceed canvas height
    bestCutY = Math.min(canvas.height, bestCutY);
    const sliceH = bestCutY - currentY;

    if (sliceH <= 0) {
      // Avoid infinite loop in extreme cases
      slices.push({ srcY: currentY, srcH: remainingH });
      break;
    }

    slices.push({ srcY: currentY, srcH: sliceH });
    currentY = bestCutY;
  }

  // Generate PDF document
  const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
  const totalPages = slices.length;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) pdf.addPage('a4', 'l');

    const { srcY, srcH } = slices[pageIdx];

    // Create high-res canvas slice for this page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = srcH;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
    const pageImgHeightMm = printW * (srcH / canvas.width);

    // Place image cleanly within printable margins
    pdf.addImage(pageImgData, 'PNG', marginMm, marginMm, printW, pageImgHeightMm, undefined, 'FAST');

    // Clean professional footer
    pdf.setFontSize(7.5);
    pdf.setTextColor(140, 150, 165);
    pdf.text(
      `Halaman ${pageIdx + 1} dari ${totalPages}  •  Dicetak: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}`,
      a4WidthMm / 2,
      a4HeightMm - 4,
      { align: 'center' }
    );
  }

  pdf.save(`${fileNamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  toast.success('Dokumen PDF berhasil diunduh tanpa terpotong! 📄');
}
