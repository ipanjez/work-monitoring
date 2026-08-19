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

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: bg,
    windowWidth: scrollW,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      // 1. Synchronize theme attributes & root styles
      clonedDoc.documentElement.setAttribute('data-theme', currentTheme);
      clonedDoc.documentElement.style.backgroundColor = bg;
      clonedDoc.documentElement.style.color = textColor;
      clonedDoc.body.style.backgroundColor = bg;
      clonedDoc.body.style.color = textColor;
      clonedDoc.body.style.margin = '0';
      clonedDoc.body.style.padding = '0';

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
        clonedEl.style.setProperty('max-height', 'none', 'important');
        clonedEl.style.setProperty('width', '100%', 'important');

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

        // 4. Ensure tables, cards, and grid containers don't clip contents
        const containers = clonedEl.querySelectorAll('table, .glass, [class*="card"], [class*="container"], [class*="table"]');
        containers.forEach((c: any) => {
          c.style.setProperty('overflow', 'visible', 'important');
          c.style.setProperty('max-height', 'none', 'important');
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
    // Fallback: direct download
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

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgData = canvas.toDataURL('image/png', 1.0);

  const isLandscape = canvasWidth > canvasHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'px',
    format: [canvasWidth, canvasHeight]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight, undefined, 'FAST');
  const fileName = `${fileNamePrefix}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName);
  toast.success('Dokumen PDF berhasil diunduh 📄');
}
