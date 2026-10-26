// Pixel-level contamination analysis. Pure functions that run on RGBA image
// data (ImageData from a <canvas>, or any { data, width, height }), so they
// work in the browser and in Node tests.
//
// The analysis splits the image into a grid. For each cell it measures how
// much of it looks like the target material and how much of that material is
// stained. The output lets the UI highlight the exact sections to tear off.

export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function percentile(values, q) {
  if (values.length === 0) return 0;
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

// Cardboard / kraft paper: warm orange-brown hue, moderate saturation.
function isCardboardHue(h, s, v) {
  return h >= 15 && h <= 50 && s >= 0.15 && s <= 0.8 && v >= 0.12;
}

// Bright red/orange food: tomato sauce, pepperoni, ketchup.
function isSaucePixel(h, s, v) {
  return (h <= 14 || h >= 340) && s >= 0.5 && v >= 0.3;
}

function sample(img, step) {
  // Downsample to keep analysis fast on large camera frames.
  const { data, width, height } = img;
  const pixels = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      pixels.push({ x, y, h, s, v });
    }
  }
  return pixels;
}

function pickStep(img, target = 160) {
  return Math.max(1, Math.floor(Math.max(img.width, img.height) / target));
}

// Grease detection for cardboard and paper.
//
// Oil makes paper fibers translucent: a grease stain is DARKER and MORE
// SATURATED than the surrounding clean cardboard. A shadow is darker but not
// more saturated, so requiring both keeps lighting from triggering it.
//
// "Clean cardboard" is estimated from the brightest cardboard pixels, so the
// reference holds even when most of the box is stained. Very dark, very
// saturated brown is also treated as a stain on its own, which catches boxes
// that are soaked almost everywhere.
export function analyzeGrease(img, { gridSize = 6 } = {}) {
  const step = pickStep(img);
  const pixels = sample(img, step);
  const card = pixels.filter((p) => isCardboardHue(p.h, p.s, p.v));
  const coverage = card.length / Math.max(1, pixels.length);

  const cells = Array.from({ length: gridSize * gridSize }, () => ({
    material: 0,
    stained: 0,
    sauce: 0,
    total: 0,
  }));
  const cellW = img.width / gridSize;
  const cellH = img.height / gridSize;
  const cellOf = (p) =>
    Math.min(gridSize - 1, Math.floor(p.y / cellH)) * gridSize +
    Math.min(gridSize - 1, Math.floor(p.x / cellW));

  if (card.length === 0) {
    return { kind: 'grease', level: 'unknown', coverage, stainRatio: 0, sauceRatio: 0, gridSize, cells, flaggedCells: 0, materialCells: 0 };
  }

  const refV = percentile(card.map((p) => p.v), 0.9);
  const bright = card.filter((p) => p.v >= refV * 0.9);
  const refS = percentile(bright.map((p) => p.s), 0.5);

  let stained = 0;
  let sauce = 0;
  for (const p of pixels) {
    const cell = cells[cellOf(p)];
    cell.total++;
    if (isSaucePixel(p.h, p.s, p.v)) {
      cell.sauce++;
      sauce++;
      continue;
    }
    // Grease stains are within the brown family but can drift slightly redder.
    const brownish = p.h >= 8 && p.h <= 55 && p.s >= 0.15;
    if (!brownish) continue;
    cell.material++;
    const relative = p.v < refV * 0.78 && p.s > refS * 1.12;
    const absolute = p.s >= 0.6 && p.v <= 0.55;
    if (relative || absolute) {
      cell.stained++;
      stained++;
    }
  }

  const materialPixels = cells.reduce((a, c) => a + c.material, 0) || 1;
  const stainRatio = stained / materialPixels;
  const sauceRatio = sauce / Math.max(1, pixels.length);

  let flaggedCells = 0;
  let materialCells = 0;
  for (const c of cells) {
    c.isMaterial = c.material / Math.max(1, c.total) >= 0.3;
    c.flagged =
      c.isMaterial &&
      (c.stained / Math.max(1, c.material) >= 0.25 || c.sauce / Math.max(1, c.total) >= 0.15);
    if (c.isMaterial) materialCells++;
    if (c.flagged) flaggedCells++;
  }

  const flaggedShare = materialCells ? flaggedCells / materialCells : 0;
  let level;
  if (coverage < 0.1) level = 'unknown';
  else if (flaggedShare >= 0.6 || stainRatio >= 0.45) level = 'heavy';
  else if (flaggedCells > 0 || stainRatio >= 0.08 || sauceRatio >= 0.03) level = 'light';
  else level = 'clean';

  return {
    kind: 'grease',
    level,
    coverage,
    stainRatio,
    sauceRatio,
    gridSize,
    cells,
    flaggedCells,
    materialCells,
  };
}

// Residue detection for containers (plastic, glass, metal, cartons).
//
// Clean containers are mostly neutral (clear, white, grey, metallic) or a
// single printed label color. Food residue shows up as small, saturated,
// warm-colored patches (sauce, peanut butter, yogurt fruit, coffee) inside
// the central region of the frame where the user holds the item.
export function analyzeResidue(img, { gridSize = 6 } = {}) {
  const step = pickStep(img);
  const pixels = sample(img, step);
  const cells = Array.from({ length: gridSize * gridSize }, () => ({ residue: 0, total: 0 }));
  const cellW = img.width / gridSize;
  const cellH = img.height / gridSize;

  // Focus on the central 70% of the frame.
  const x0 = img.width * 0.15;
  const x1 = img.width * 0.85;
  const y0 = img.height * 0.15;
  const y1 = img.height * 0.85;

  let central = 0;
  let residue = 0;
  for (const p of pixels) {
    const ci =
      Math.min(gridSize - 1, Math.floor(p.y / cellH)) * gridSize +
      Math.min(gridSize - 1, Math.floor(p.x / cellW));
    const cell = cells[ci];
    cell.total++;
    if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
    central++;
    const warmFood = (p.h <= 45 || p.h >= 335) && p.s >= 0.45 && p.v >= 0.2 && p.v <= 0.95;
    if (warmFood) {
      residue++;
      cell.residue++;
    }
  }

  const residueRatio = residue / Math.max(1, central);
  let flaggedCells = 0;
  for (const c of cells) {
    c.flagged = c.residue / Math.max(1, c.total) >= 0.2;
    if (c.flagged) flaggedCells++;
  }

  // Containers with large warm-colored labels would read as residue; we
  // treat very high ratios as "probably a label" and only nudge the user.
  let level;
  if (residueRatio >= 0.04 && residueRatio < 0.45) level = 'light';
  else level = 'clean';

  return { kind: 'residue', level, residueRatio, gridSize, cells, flaggedCells };
}

export function analyzeImage(img, check) {
  if (check === 'grease') return analyzeGrease(img);
  if (check === 'residue') return analyzeResidue(img);
  return null;
}
