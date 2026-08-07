'use client';

/**
 * Chart.js plugin that renders circular avatar images or initials
 * in place of text labels on the X axis for PIC-related bar charts.
 */

// Cache for loaded avatar images
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(img); // fallback gracefully
    img.src = src;
  });
}

function getStableColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export interface PicAvatarXAxisPluginOptions {
  avatars: Record<string, string>;  // name -> base64 or URL
  masterColors?: Record<string, string>;
  size?: number; // diameter in pixels, default 28
}

export const picAvatarXAxisPlugin = {
  id: 'picAvatarXAxis',

  afterDraw(chart: any, _args: any, options: PicAvatarXAxisPluginOptions) {
    if (!options || !options.avatars) return;

    const { avatars, masterColors = {}, size: avatarSize = 28 } = options;
    const xScale = chart.scales.x;
    if (!xScale) return;

    const ctx = chart.ctx;
    const labels: string[] = chart.data.labels || [];
    const radius = avatarSize / 2;

    // Y position: place circles inside the padded area below the chart
    const yCenter = chart.chartArea.bottom + radius + 10;

    labels.forEach((label: string, index: number) => {
      const xCenter = xScale.getPixelForValue(index);
      const avatarSrc = avatars[label];

      ctx.save();

      // Clip to a circle
      ctx.beginPath();
      ctx.arc(xCenter, yCenter, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (avatarSrc && imageCache.has(avatarSrc)) {
        // Draw the cached image
        const img = imageCache.get(avatarSrc)!;
        ctx.drawImage(img, xCenter - radius, yCenter - radius, avatarSize, avatarSize);
      } else {
        // Draw initials circle
        let bgColor = masterColors[`pic_${label}`] || null;
        if (!bgColor || bgColor === '#ffffff') {
          bgColor = getStableColor(label);
        } else if (bgColor.length > 7) {
          bgColor = bgColor.substring(0, 7);
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(xCenter - radius, yCenter - radius, avatarSize, avatarSize);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(9, avatarSize / 2.8)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getInitials(label), xCenter, yCenter);
      }

      ctx.restore();

      // If the avatar image exists but hasn't loaded yet, start loading
      if (avatarSrc && !imageCache.has(avatarSrc)) {
        loadImage(avatarSrc).then(() => {
          // Re-render chart once the image is loaded
          chart.draw();
        });
      }
    });
  }
};

/**
 * Returns the Chart.js scale config that hides the default text ticks
 * and adds enough padding for the avatar circles.
 */
export function getPicAvatarXAxisConfig(avatarSize: number = 28) {
  return {
    ticks: {
      display: false, // hide the default text labels
    },
    afterFit(axis: any) {
      axis.paddingBottom = Math.max(44, avatarSize + 16); // space for the avatar circles
    },
  };
}
