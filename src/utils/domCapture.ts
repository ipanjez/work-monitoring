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

  const bg = options?.backgroundColor || (isDark ? '#0f172a' : '#f1f5f9');
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const scrollW = options?.targetWidth || Math.max(element.scrollWidth, element.offsetWidth, 1280);
  const scrollH = Math.max(element.scrollHeight, element.offsetHeight, 800);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: bg,
    windowWidth: scrollW,
    windowHeight: scrollH,
    width: scrollW,
    height: scrollH,
    scrollX: 0,
    scrollY: -window.scrollY,
    x: 0,
    y: 0,
    onclone: (clonedDoc) => {
      // 1. Synchronize theme attributes & root styles
      clonedDoc.documentElement.setAttribute('data-theme', currentTheme);
      clonedDoc.documentElement.style.backgroundColor = bg;
      clonedDoc.documentElement.style.color = textColor;
      clonedDoc.body.style.backgroundColor = bg;
      clonedDoc.body.style.color = textColor;
      clonedDoc.body.style.margin = '0';
      clonedDoc.body.style.padding = '0';
      clonedDoc.body.style.overflow = 'visible';
      clonedDoc.body.style.height = 'auto';

      const clonedEl = clonedDoc.getElementById(element.id) || (clonedDoc.querySelector(`[data-capture-root]`) as HTMLElement) || clonedDoc.body;
      if (clonedEl) {
        // 2. Set generous padding & full visibility
        clonedEl.style.setProperty('box-sizing', 'border-box', 'important');
        clonedEl.style.setProperty('padding', '24px', 'important');
        clonedEl.style.setProperty('padding-bottom', '48px', 'important');
        clonedEl.style.setProperty('background', bg, 'important');
        clonedEl.style.setProperty('color', textColor, 'important');
        clonedEl.style.setProperty('overflow', 'visible', 'important');
        clonedEl.style.setProperty('height', 'auto', 'important');
        clonedEl.style.setProperty('min-height', `${scrollH}px`, 'important');
        clonedEl.style.setProperty('max-height', 'none', 'important');
        clonedEl.style.setProperty('width', '100%', 'important');
        clonedEl.style.setProperty('position', 'relative', 'important');

        // 3. Fix all color-mix or gradient crashes in html2canvas
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

        // 4. Ensure ALL nested containers don't clip contents
        const allScrollable = clonedDoc.querySelectorAll('*');
        allScrollable.forEach((el: any) => {
          const cs = clonedDoc.defaultView?.getComputedStyle(el);
          if (cs && (cs.overflow === 'hidden' || cs.overflow === 'auto' || cs.overflow === 'scroll' ||
                     cs.overflowY === 'hidden' || cs.overflowY === 'auto' || cs.overflowY === 'scroll')) {
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('overflow-y', 'visible', 'important');
            el.style.setProperty('max-height', 'none', 'important');
          }
        });

        if (options?.extraStyles) {
          options.extraStyles(clonedDoc, clonedEl as HTMLElement);
        }
      }
    }
  });

  return canvas;
}

export async function copyCanvasToClipboardOrDownload(
  canvas: HTMLCanvasElement,
  fallbackFilename: string = 'Screenshot'
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
  if (!blob) {
    throw new Error('Gagal menghasilkan gambar');
  }

  let copied = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      copied = true;
      toast.success('Halaman berhasil disalin ke clipboard! 📋');
    }
  } catch (err) {
    console.warn('Clipboard write API failed or was blocked by browser permissions, downloading instead:', err);
  }

  if (!copied) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fallbackFilename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Gambar berhasil diunduh (browser membatasi izin clipboard) 📥');
  }
}

export async function exportCanvasToPdf(
  canvas: HTMLCanvasElement,
  fileNamePrefix: string = 'Dokumen'
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Use A4 dimensions in mm: 210 x 297
  const a4WidthMm = 297; // landscape width
  const a4HeightMm = 210; // landscape height
  const margin = 8; // mm margin

  const printW = a4WidthMm - margin * 2;
  const printH = a4HeightMm - margin * 2;

  // Calculate how tall the image is relative to the print width
  const imgAspect = canvas.height / canvas.width;
  const scaledImgHeightMm = printW * imgAspect;

  // If it fits on one landscape page, single page
  if (scaledImgHeightMm <= printH) {
    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', margin, margin, printW, scaledImgHeightMm, undefined, 'FAST');
    pdf.save(`${fileNamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Dokumen PDF berhasil diunduh 📄');
    return;
  }

  // Multi-page: slice the canvas into pages
  const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
  const totalPages = Math.ceil(scaledImgHeightMm / printH);

  // How many source pixels per page
  const srcPixelsPerPage = canvas.width * (printH / printW) ; // height in source pixels that fits one page

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage('a4', 'l');

    const srcY = Math.round(page * srcPixelsPerPage);
    const srcH = Math.min(Math.round(srcPixelsPerPage), canvas.height - srcY);
    if (srcH <= 0) break;

    // Create a temporary canvas for this page slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = srcH;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) break;
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
    const pageImgH = printW * (srcH / canvas.width);
    pdf.addImage(pageImgData, 'PNG', margin, margin, printW, pageImgH, undefined, 'FAST');

    // Footer
    pdf.setFontSize(7);
    pdf.setTextColor(150);
    pdf.text(
      `Halaman ${page + 1} dari ${totalPages}  •  Dicetak: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`,
      a4WidthMm / 2, a4HeightMm - 3,
      { align: 'center' }
    );
  }

  pdf.save(`${fileNamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  toast.success('Dokumen PDF berhasil diunduh 📄');
}
