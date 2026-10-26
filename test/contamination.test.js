import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeGrease, analyzeResidue, rgbToHsv } from '../shared/vision/contamination.js';

// Build a synthetic RGBA image filled by a color function.
function image(width, height, colorAt) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

const CARDBOARD = [196, 155, 104]; // kraft brown
const GREASE = [120, 78, 30]; // darker, more saturated oil stain
const SHADOW = [137, 108, 73]; // same hue/saturation as cardboard, just darker

test('rgbToHsv basics', () => {
  assert.deepEqual(rgbToHsv(255, 0, 0), [0, 1, 1]);
  const [h, s] = rgbToHsv(...CARDBOARD);
  assert.ok(h > 25 && h < 40);
  assert.ok(s > 0.4 && s < 0.5);
});

test('clean cardboard is clean', () => {
  const r = analyzeGrease(image(120, 120, () => CARDBOARD));
  assert.equal(r.level, 'clean');
  assert.equal(r.flaggedCells, 0);
  assert.equal(r.materialCells, 36);
});

test('a grease spot flags only the stained sections', () => {
  const img = image(120, 120, (x, y) => (x < 40 && y < 40 ? GREASE : CARDBOARD));
  const r = analyzeGrease(img);
  assert.equal(r.level, 'light');
  assert.ok(r.flaggedCells >= 4 && r.flaggedCells <= 6, `flagged ${r.flaggedCells}`);
  // Bottom-right cell stays clean.
  assert.equal(r.cells[35].flagged, false);
  assert.equal(r.cells[0].flagged, true);
});

test('shadows alone are not mistaken for grease', () => {
  const img = image(120, 120, (x) => (x < 60 ? SHADOW : CARDBOARD));
  const r = analyzeGrease(img);
  assert.equal(r.level, 'clean');
});

test('mostly soaked cardboard is heavy', () => {
  const img = image(120, 120, (x, y) => (x < 100 || y < 100 ? GREASE : CARDBOARD));
  assert.equal(analyzeGrease(img).level, 'heavy');
});

test('pizza sauce on cardboard counts as contamination', () => {
  const img = image(120, 120, (x, y) => (x > 50 && x < 70 && y > 50 && y < 70 ? [200, 30, 20] : CARDBOARD));
  assert.notEqual(analyzeGrease(img).level, 'clean');
});

test('non-cardboard image is unknown', () => {
  assert.equal(analyzeGrease(image(80, 80, () => [40, 80, 200])).level, 'unknown');
});

test('residue: clear container is clean, sauce smear is flagged', () => {
  const clean = image(100, 100, () => [230, 232, 235]);
  assert.equal(analyzeResidue(clean).level, 'clean');
  const dirty = image(100, 100, (x, y) => (x > 40 && x < 60 && y > 35 && y < 65 ? [190, 60, 25] : [230, 232, 235]));
  const r = analyzeResidue(dirty);
  assert.equal(r.level, 'light');
  assert.ok(r.flaggedCells > 0);
});
