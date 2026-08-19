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

  const bg = options?.backgroundColor || (document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc');

  const scrollW = options?.targetWidth || Math.max(element.scrollWidth, element.offsetWidth, 1200);
  const scrollH = Math.max(element.scrollHeight, element.offsetHeight, 600);

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
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(element.id) || clonedDoc.body;
      if (clonedEl) {
        // Expand scroll containers
        clonedEl.style.setProperty('overflow', 'visible', 'important');
        clonedEl.style.setProperty('height', 'auto', 'important');
        clonedEl.style.setProperty('max-height', 'none', 'important');

        // Fix all color-mix or gradient crashes in html2canvas
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
