import type { ArtworkMapping, BoxDimensions, FoilColor, LabelDimensions, PouchDimensions } from '../types/packaging';

/**
 * Reads any supported file (PNG, JPG, WebP, SVG, PDF) and returns dataUrl + dimensions
 */
export async function processUploadedFile(file: File): Promise<{
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  fileName: string;
  fileSize: number;
}> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const pdfDataUrl = await renderPdfToImage(file);
      const dims = await getImageDimensions(pdfDataUrl);
      return {
        dataUrl: pdfDataUrl,
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        aspectRatio: dims.width / dims.height,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (err) {
      console.warn('PDF.js render failed, trying fallback renderer:', err);
    }
  }

  // Handle standard images (PNG, JPG, WebP, SVG)
  const dataUrl = await readFileAsDataURL(file);
  const dims = await getImageDimensions(dataUrl);

  return {
    dataUrl,
    naturalWidth: dims.width,
    naturalHeight: dims.height,
    aspectRatio: dims.width / dims.height,
    fileName: file.name,
    fileSize: file.size,
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Render first page of PDF using pdfjs-dist
 */
async function renderPdfToImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Dynamically import pdfjs-dist to optimize loading
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source to cdnjs or local
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  // Render at high resolution (scale 3.0 for crisp prepress preview)
  const viewport = page.getViewport({ scale: 3.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create 2D canvas context for PDF rendering');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // pdfjs types in recent versions
  const renderContext: any = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL('image/png');
}

/**
 * Computes the target physical aspect ratio of a given panel
 */
export function getPanelAspectRatio(
  category: string,
  panelId: string,
  boxDims: BoxDimensions,
  labelDims: LabelDimensions,
  pouchDims: PouchDimensions
): number {
  if (category === 'box') {
    switch (panelId) {
      case 'front':
      case 'back':
        return boxDims.width / boxDims.height;
      case 'left':
      case 'right':
        return boxDims.depth / boxDims.height;
      case 'top':
      case 'bottom':
        return boxDims.width / boxDims.depth;
      default:
        return 1.0;
    }
  }

  if (category === 'label') {
    if (panelId === 'wraparoundLabel') {
      const circumference = Math.PI * labelDims.diameter * labelDims.labelCoverage;
      return circumference / labelDims.labelHeight;
    }
    // Front/Back label
    const labelWidth = (Math.PI * labelDims.diameter * 0.45);
    return labelWidth / labelDims.labelHeight;
  }

  if (category === 'pouch') {
    if (panelId === 'bottomGusset') {
      return pouchDims.width / pouchDims.gussetDepth;
    }
    return pouchDims.width / pouchDims.height;
  }

  return 1.0;
}

/**
 * Composite artwork onto a texture canvas according to fit/fill/scale/offset/rotation settings
 */
export function renderProcessedTextureCanvas(
  artwork: ArtworkMapping,
  targetWidth = 2048,
  targetHeight = 2048,
  baseColor = '#ffffff'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Clear with transparent background (so transparent PNGs allow base material color/roughness to shine through)
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  if (!artwork.dataUrl) {
    // Fill with solid base color if no artwork
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    return canvas;
  }

  const img = new Image();
  img.src = artwork.dataUrl;

  // If already loaded or sync render
  if (img.complete && img.naturalWidth > 0) {
    drawArtworkOnContext(ctx, img, artwork, targetWidth, targetHeight);
  } else {
    // Sync draw attempt
    try {
      drawArtworkOnContext(ctx, img, artwork, targetWidth, targetHeight);
    } catch {
      // Will be rendered on next update
    }
  }

  return canvas;
}

/**
 * Draws the image on context with transformation, fit mode, and clipping
 */
export function drawArtworkOnContext(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  artwork: ArtworkMapping,
  canvasW: number,
  canvasH: number
) {
  ctx.save();

  const imgW = img.naturalWidth || img.width || 1;
  const imgH = img.naturalHeight || img.height || 1;
  const imgRatio = imgW / imgH;
  const targetRatio = canvasW / canvasH;

  let drawW = canvasW;
  let drawH = canvasH;

  if (artwork.fit === 'fit') {
    // Contain inside canvas
    if (imgRatio > targetRatio) {
      drawW = canvasW;
      drawH = canvasW / imgRatio;
    } else {
      drawH = canvasH;
      drawW = canvasH * imgRatio;
    }
  } else if (artwork.fit === 'fill') {
    // Cover canvas
    if (imgRatio > targetRatio) {
      drawH = canvasH;
      drawW = canvasH * imgRatio;
    } else {
      drawW = canvasW;
      drawH = canvasW / imgRatio;
    }
  } else if (artwork.fit === 'stretch') {
    drawW = canvasW;
    drawH = canvasH;
  }

  // Apply custom scale
  drawW *= (artwork.scale || 1.0);
  drawH *= (artwork.scale || 1.0);

  // Center coordinate + offsets
  const centerX = canvasW / 2 + (artwork.offsetX || 0) * canvasW * 0.5;
  const centerY = canvasH / 2 + (artwork.offsetY || 0) * canvasH * 0.5;

  ctx.translate(centerX, centerY);

  // Apply rotation
  if (artwork.rotation) {
    ctx.rotate((artwork.rotation * Math.PI) / 180);
  }

  // Draw centered
  ctx.globalAlpha = artwork.opacity ?? 1.0;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();
}

/**
 * Generates an embossing / debossing bump map canvas from the artwork
 */
export function generateBumpMapCanvas(
  artworkCanvas: HTMLCanvasElement,
  embossDepth: number
): HTMLCanvasElement {
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = artworkCanvas.width;
  bumpCanvas.height = artworkCanvas.height;
  const bCtx = bumpCanvas.getContext('2d');
  if (!bCtx) return bumpCanvas;

  bCtx.drawImage(artworkCanvas, 0, 0);
  const imgData = bCtx.getImageData(0, 0, bumpCanvas.width, bumpCanvas.height);
  const data = imgData.data;

  // Mid-grey 128 is neutral (flat surface)
  const neutral = 128;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    if (alpha < 0.05) {
      data[i] = neutral;
      data[i + 1] = neutral;
      data[i + 2] = neutral;
      data[i + 3] = 255;
      continue;
    }

    // Luminance of artwork
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Scale by embossDepth (-1 to +1)
    const factor = (lum - 128) * (embossDepth || 0.5);
    const bumpVal = Math.min(255, Math.max(0, neutral + factor * alpha));

    data[i] = bumpVal;
    data[i + 1] = bumpVal;
    data[i + 2] = bumpVal;
    data[i + 3] = 255;
  }

  bCtx.putImageData(imgData, 0, 0);
  return bumpCanvas;
}

/**
 * Creates high-res starter demo packaging artwork procedurally for the 3 major categories:
 * 1. Cosmetic Folding Box (LUMIÈRE BOTANIQUE - Restorative Night Serum)
 * 2. Glass Bottle Label (NORDIC ROAST - Cold Brew Coffee)
 * 3. Stand-Up Pouch (UJI MATCHA RESERVE - Ceremonial Grade Green Tea)
 */
export function createStarterDemoArtwork(
  theme: 'cosmetic-box' | 'coffee-bottle' | 'matcha-pouch',
  panel: string
): string {
  const canvas = document.createElement('canvas');
  const w = 1500;
  const h = 2000;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (theme === 'cosmetic-box') {
    renderCosmeticBoxPanel(ctx, w, h, panel);
  } else if (theme === 'coffee-bottle') {
    renderCoffeeBottlePanel(ctx, w, h, panel);
  } else if (theme === 'matcha-pouch') {
    renderMatchaPouchPanel(ctx, w, h, panel);
  }

  return canvas.toDataURL('image/png');
}

function renderCosmeticBoxPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  panel: string
) {
  // Rich off-white cream paper base
  ctx.fillStyle = '#181716';
  ctx.fillRect(0, 0, w, h);

  // Subtle luxury border
  ctx.strokeStyle = '#D4AF37'; // Gold foil line
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, w - 120, h - 120);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(74, 74, w - 148, h - 148);

  ctx.textAlign = 'center';

  if (panel === 'front') {
    // Brand Emblem
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(w / 2, 380, 48, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('EST. 1988', w / 2, 388);

    // Main Brand
    ctx.fillStyle = '#F5F5F0';
    ctx.font = '700 76px "Plus Jakarta Sans", serif';
    ctx.letterSpacing = '12px';
    ctx.fillText('LUMIÈRE', w / 2, 580);

    ctx.fillStyle = '#D4AF37';
    ctx.font = '400 32px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '18px';
    ctx.fillText('BOTANIQUE', w / 2, 650);

    // Thin divider
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, 720);
    ctx.lineTo(w / 2 + 120, 720);
    ctx.stroke();

    // Product Title
    ctx.fillStyle = '#E5E5E0';
    ctx.font = '600 40px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('RESTORATIVE NIGHT SERUM', w / 2, 820);

    // Subtitle
    ctx.fillStyle = '#A3A39E';
    ctx.font = '400 28px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('ACTIVE BOTANICAL COMPLEX & PEPTIDES', w / 2, 880);

    // Decorative botanical motif in center
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    for (let r = 40; r <= 160; r += 40) {
      ctx.beginPath();
      ctx.arc(w / 2, 1200, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Specifications
    ctx.fillStyle = '#D4AF37';
    ctx.font = '600 26px "JetBrains Mono", monospace';
    ctx.letterSpacing = '4px';
    ctx.fillText('1.7 FL. OZ. / 50 ML e', w / 2, 1680);

    ctx.fillStyle = '#73736E';
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('MADE IN FRANCE · DERMATOLOGICALLY TESTED', w / 2, 1740);
  } else if (panel === 'back') {
    // Back panel: Ingredients, directions, barcode
    ctx.fillStyle = '#D4AF37';
    ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('APPLICATION & RITUAL', w / 2, 260);

    ctx.fillStyle = '#B0B0AA';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Apply 3 to 4 drops onto cleansed face and neck.', w / 2, 340);
    ctx.fillText('Gently press into skin using upward sweeping motions.', w / 2, 390);
    ctx.fillText('Use nightly before moisturizer for optimum cellular renewal.', w / 2, 440);

    ctx.fillStyle = '#D4AF37';
    ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('KEY INGREDIENTS', w / 2, 580);

    ctx.fillStyle = '#8E8E88';
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    const lines = [
      'Aqua, Rosa Damascena Flower Water, Niacinamide, Glycerin,',
      'Hyaluronic Acid (Multi-Molecular), Bakuchiol (1.5%),',
      'Camellia Sinensis Leaf Extract, Squalane (Olive-Derived),',
      'Ceramide NP, Tocopherol, Phenoxyethanol, Ethylhexylglycerin.',
    ];
    lines.forEach((line, idx) => {
      ctx.fillText(line, w / 2, 650 + idx * 36);
    });

    // Barcode block
    renderBarcode(ctx, w / 2 - 200, 1400, 400, 180, '3 760128 490152');
  } else if (panel === 'left' || panel === 'right') {
    // Side panel: vertical brand logo & certifications
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#F5F5F0';
    ctx.font = '700 64px "Plus Jakarta Sans", serif';
    ctx.letterSpacing = '18px';
    ctx.fillText('LUMIÈRE BOTANIQUE', 0, 20);
    ctx.restore();

    ctx.fillStyle = '#D4AF37';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('CRUELTY FREE · VEGAN · FSC CERTIFIED', w / 2, h - 200);
  } else if (panel === 'top') {
    // Top lid: embossed brand monogram
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 100, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#F5F5F0';
    ctx.font = '700 84px "Plus Jakarta Sans", serif';
    ctx.fillText('LB', w / 2, h / 2 + 28);
  } else if (panel === 'bottom') {
    // Bottom: batch code & recycling symbols
    ctx.fillStyle = '#73736E';
    ctx.font = '500 24px "JetBrains Mono", monospace';
    ctx.fillText('BATCH: #LB-2026-X9', w / 2, h / 2 - 30);
    ctx.fillText('EXP: 10/2028', w / 2, h / 2 + 20);
    ctx.fillText('RECYCLABLE PAPERBOARD · PAP 21', w / 2, h / 2 + 70);
  }
}

function renderCoffeeBottlePanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  panel: string
) {
  // Deep matte black kraft background for cold brew bottle
  ctx.fillStyle = '#121314';
  ctx.fillRect(0, 0, w, h);

  // Geometric border
  ctx.strokeStyle = '#E2B872';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, w - 100, h - 100);

  ctx.textAlign = 'center';

  // Badge
  ctx.fillStyle = '#E2B872';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.letterSpacing = '8px';
  ctx.fillText('COLD BREW RESERVE', w / 2, 280);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 88px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('NORDIC', w / 2, 430);
  ctx.fillText('ROAST', w / 2, 530);

  ctx.fillStyle = '#E2B872';
  ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '10px';
  ctx.fillText('NITRO INFUSED', w / 2, 620);

  // Flavor profile badge
  ctx.strokeStyle = 'rgba(226, 184, 114, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(w / 2 - 300, 740, 600, 240);

  ctx.fillStyle = '#D0D0CA';
  ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('SINGLE ORIGIN: YIRGACHEFFE ETHIOPIA', w / 2, 810);
  ctx.fillText('PROCESS: NATURAL ANAEROBIC', w / 2, 860);

  ctx.fillStyle = '#E2B872';
  ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NOTES: DARK BERRIES · BERGAMOT · CACAO', w / 2, 920);

  // Decorative compass/wave art
  ctx.strokeStyle = '#E2B872';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 100; x < w - 100; x += 10) {
    const y = 1250 + Math.sin(x * 0.02) * 25;
    if (x === 100) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Bottom specs
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 38px "JetBrains Mono", monospace';
  ctx.letterSpacing = '4px';
  ctx.fillText('330 ML · 11.2 FL OZ', w / 2, 1550);

  ctx.fillStyle = '#8A8A84';
  ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('BREWED SLOWLY FOR 24 HOURS IN OSLO', w / 2, 1630);
}

function renderMatchaPouchPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  panel: string
) {
  // Deep Japanese forest matcha green
  ctx.fillStyle = '#17271E';
  ctx.fillRect(0, 0, w, h);

  // Texture specks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 200; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    ctx.fillRect(rx, ry, 2, 2);
  }

  ctx.textAlign = 'center';

  if (panel === 'front') {
    // Gold circle seal
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, 380, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Japanese kanji: 抹茶 (Matcha)
    ctx.fillStyle = '#C9A84C';
    ctx.font = '700 68px "Plus Jakarta Sans", serif';
    ctx.fillText('茶', w / 2, 404);

    // Brand Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 78px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '14px';
    ctx.fillText('UJI MATCHA', w / 2, 600);

    ctx.fillStyle = '#C9A84C';
    ctx.font = '600 34px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText('RESERVE GRADE', w / 2, 670);

    // Line
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 160, 730);
    ctx.lineTo(w / 2 + 160, 730);
    ctx.stroke();

    // Description
    ctx.fillStyle = '#E8EFEA';
    ctx.font = '500 32px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('CEREMONIAL FIRST HARVEST', w / 2, 820);

    ctx.fillStyle = '#A3B8AA';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('STONE-GROUND TENCHA · SHADED FOR 30 DAYS', w / 2, 880);

    // Decorative seal stamp
    ctx.strokeStyle = '#A83232';
    ctx.lineWidth = 3;
    ctx.strokeRect(w / 2 - 40, 1100, 80, 80);
    ctx.fillStyle = '#A83232';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('極上', w / 2, 1150);

    // Net weight
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 36px "JetBrains Mono", monospace';
    ctx.letterSpacing = '4px';
    ctx.fillText('NET WT. 100G / 3.5 OZ', w / 2, 1560);

    ctx.fillStyle = '#C9A84C';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('KYOTO PREFECTURE · JAPAN', w / 2, 1630);
  } else {
    // Back of pouch: Preparation instructions
    ctx.fillStyle = '#C9A84C';
    ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('THE PERFECT BOWL', w / 2, 280);

    ctx.fillStyle = '#D6E2D9';
    ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
    const instructions = [
      '1. Sift 2g (approx. 1 bamboo chashaku scoop) into chawan.',
      '2. Pour 70ml of filtered water heated to 80°C (175°F).',
      '3. Whisk briskly in a W-motion using a chasen until creamy foam forms.',
      '4. Savor immediately for vibrant umami and smooth sweetness.',
    ];
    instructions.forEach((txt, idx) => {
      ctx.fillText(txt, w / 2, 380 + idx * 60);
    });

    // Barcode block
    renderBarcode(ctx, w / 2 - 200, 1300, 400, 170, '4 901234 567890');

    ctx.fillStyle = '#8FA895';
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('RESEALABLE BARRIER POUCH · STORE REFRIGERATED', w / 2, 1600);
  }
}

function renderBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  codeText: string
) {
  // White barcode background box
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);

  // Black stripes
  ctx.fillStyle = '#000000';
  const barTop = y + 20;
  const barHeight = h - 65;
  const numBars = 50;
  const barWidth = (w - 40) / numBars;

  let curX = x + 20;
  for (let i = 0; i < numBars; i++) {
    const isThick = (i * 7 + 3) % 4 === 0;
    const isGap = (i * 3 + 1) % 5 === 0;
    if (!isGap) {
      ctx.fillRect(curX, barTop, isThick ? barWidth * 1.5 : barWidth * 0.75, barHeight);
    }
    curX += barWidth;
  }

  // Code digits
  ctx.fillStyle = '#000000';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText(codeText, x + w / 2, y + h - 14);
}
