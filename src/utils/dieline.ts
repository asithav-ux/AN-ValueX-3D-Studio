import type { BoxDimensions, BoxPanelId } from '../types/packaging';

export interface DielinePanelRect {
  panelId: BoxPanelId;
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
  width: number; // 0 to 1 normalized
  height: number; // 0 to 1 normalized
  label: string;
}

/**
 * Calculates standard flat carton layout UV bounds for folding carton
 * Typical layout:
 * Columns: Left Side (D), Front (W), Right Side (D), Back (W)
 * Top row: Top Flap / Lid (over Front or Back)
 * Bottom row: Bottom Flap (over Front or Back)
 */
export function getDefaultBoxDielineRects(dims: BoxDimensions): DielinePanelRect[] {
  const { width: W, height: H, depth: D } = dims;
  const totalW = D + W + D + W;
  const totalH = D + H + D;

  // Normalized widths
  const nD_w = D / totalW;
  const nW_w = W / totalW;

  // Normalized heights
  const nTop_h = D / totalH;
  const nBody_h = H / totalH;
  const nBot_h = D / totalH;

  const yTop = 0;
  const yBody = nTop_h;
  const yBottom = nTop_h + nBody_h;

  const xLeft = 0;
  const xFront = nD_w;
  const xRight = nD_w + nW_w;
  const xBack = nD_w + nW_w + nD_w;

  return [
    {
      panelId: 'left',
      label: 'Left Flank',
      x: xLeft,
      y: yBody,
      width: nD_w,
      height: nBody_h,
    },
    {
      panelId: 'front',
      label: 'Front Face',
      x: xFront,
      y: yBody,
      width: nW_w,
      height: nBody_h,
    },
    {
      panelId: 'right',
      label: 'Right Flank',
      x: xRight,
      y: yBody,
      width: nD_w,
      height: nBody_h,
    },
    {
      panelId: 'back',
      label: 'Back Face',
      x: xBack,
      y: yBody,
      width: nW_w,
      height: nBody_h,
    },
    {
      panelId: 'top',
      label: 'Top Lid',
      x: xFront,
      y: yTop,
      width: nW_w,
      height: nTop_h,
    },
    {
      panelId: 'bottom',
      label: 'Bottom Base',
      x: xFront,
      y: yBottom,
      width: nW_w,
      height: nBot_h,
    },
  ];
}

/**
 * Crop a panel out of an uploaded flat dieline image using normalized coordinates
 */
export async function cropDielinePanel(
  dielineDataUrl: string,
  rect: DielinePanelRect
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sx = Math.max(0, rect.x * img.naturalWidth);
      const sy = Math.max(0, rect.y * img.naturalHeight);
      const sw = Math.min(img.naturalWidth - sx, rect.width * img.naturalWidth);
      const sh = Math.min(img.naturalHeight - sy, rect.height * img.naturalHeight);

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(64, Math.round(sw));
      canvas.height = Math.max(64, Math.round(sh));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dielineDataUrl);
        return;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dielineDataUrl;
  });
}
