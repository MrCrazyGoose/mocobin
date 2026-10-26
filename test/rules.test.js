import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, STREAMS, decide, getItem, searchItems } from '../shared/rules.js';
import { mapLabelToItem, matchPredictions, suggestItems, QUICK_PICKS } from '../shared/vision/classMap.js';

test('every item has a valid stream and unique id', () => {
  const ids = new Set();
  for (const item of ITEMS) {
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.ok(STREAMS[item.stream], `${item.id} has unknown stream ${item.stream}`);
    if (item.alternateStream) assert.ok(STREAMS[item.alternateStream]);
    if (item.whenContaminated) assert.ok(STREAMS[item.whenContaminated]);
    if (item.contaminationCheck) assert.ok(item.whenContaminated, `${item.id} needs whenContaminated`);
    assert.ok(item.prep.length > 0);
  }
});

test('plastic bags trigger the Montgomery County alert and never go in the blue bin', () => {
  const v = decide('plastic-bag');
  assert.equal(v.stream.id, 'STORE_DROPOFF');
  assert.equal(v.alternateStream.id, 'TRASH');
  assert.match(v.alert, /Montgomery County does not accept plastic bags in curbside recycling/);
});

test('clean pizza box goes to paper; light grease splits; heavy grease goes to trash', () => {
  assert.equal(decide('pizza-box', { level: 'clean' }).stream.id, 'PAPER');
  const light = decide('pizza-box', { level: 'light' });
  assert.equal(light.split, true);
  assert.equal(light.stream.id, 'PAPER');
  assert.match(light.steps[0], /trash/);
  const heavy = decide('pizza-box', { level: 'heavy' });
  assert.equal(heavy.stream.id, 'TRASH');
  assert.equal(heavy.contaminated, true);
});

test('plastic containers always carry the empty/rinsed/clean reminder', () => {
  const v = decide('plastic-container');
  assert.equal(v.stream.id, 'BLUE_BIN');
  assert.match(v.reminder, /EMPTY, RINSED and CLEAN/);
  assert.equal(decide('plastic-container', { level: 'light' }).contaminated, true);
});

test('hazardous and electronic items route to Shady Grove', () => {
  assert.equal(getItem('car-battery').stream, 'SHADY_GROVE_HHW');
  assert.equal(getItem('phone').stream, 'SHADY_GROVE_ELECTRONICS');
  assert.equal(getItem('computer').stream, 'SHADY_GROVE_ELECTRONICS');
  assert.match(STREAMS.SHADY_GROVE_HHW.description, /16101 Frederick Road/);
});

test('search finds items by keyword', () => {
  assert.equal(searchItems('pizza')[0].id, 'pizza-box');
  assert.equal(searchItems('car battery')[0].id, 'car-battery');
  assert.equal(searchItems('grocery bag')[0].id, 'plastic-bag');
  assert.equal(searchItems('styrofoam')[0].id, 'foam');
  assert.deepEqual(searchItems('zzzzqqq'), []);
});

test('MobileNet labels map to rule items', () => {
  assert.equal(mapLabelToItem('pizza, pizza pie'), 'pizza-box');
  assert.equal(mapLabelToItem('plastic bag'), 'plastic-bag');
  assert.equal(mapLabelToItem('pop bottle, soda bottle'), 'plastic-bottle');
  assert.equal(mapLabelToItem('beer bottle'), 'glass-bottle');
  assert.equal(mapLabelToItem('carton'), 'cardboard-box');
  assert.equal(mapLabelToItem('cellular telephone, cellular phone, cellphone, cell, mobile phone'), 'phone');
  assert.equal(mapLabelToItem('laptop, laptop computer'), 'computer');
  assert.equal(mapLabelToItem('coffee mug'), 'drinking-glass');
  assert.equal(mapLabelToItem('banana'), 'food-scraps');
  for (const food of ['spaghetti squash', 'butternut squash', 'acorn squash', 'jackfruit', 'zucchini, courgette',
    'bell pepper', 'corn', 'cauliflower', 'mushroom', 'fig', 'pomegranate', 'ice lolly, lolly, lollipop, popsicle']) {
    assert.equal(mapLabelToItem(food), 'food-scraps', food);
  }
  assert.equal(mapLabelToItem('acorn'), 'yard-trim');
  assert.equal(mapLabelToItem('hay'), 'yard-trim');
  assert.equal(mapLabelToItem('tabby, tabby cat'), null);
});

test('matchPredictions skips unmapped and low-confidence labels', () => {
  const m = matchPredictions([
    { className: 'tabby, tabby cat', probability: 0.6 },
    { className: 'water bottle', probability: 0.3 },
  ]);
  assert.deepEqual(m, { itemId: 'plastic-bottle', label: 'water bottle', probability: 0.3 });
  assert.equal(matchPredictions([{ className: 'water bottle', probability: 0.01 }]), null);
});

test('a confident food prediction is auto-selected (spaghetti squash at 50%)', () => {
  const m = matchPredictions([
    { className: 'spaghetti squash', probability: 0.5 },
    { className: 'jackfruit, jak, jack', probability: 0.09 },
  ]);
  assert.equal(m.itemId, 'food-scraps');
});

test('a low-confidence guess is not auto-selected (soda can read as toilet tissue)', () => {
  const preds = [
    { className: 'toilet tissue, toilet paper, bathroom tissue', probability: 0.15 },
    { className: 'toilet seat', probability: 0.09 },
    { className: 'mixing bowl', probability: 0.06 },
  ];
  assert.equal(matchPredictions(preds), null);
  const picks = suggestItems(preds);
  assert.equal(picks[0], 'paper-towel');
  assert.ok(picks.includes('aluminum-can'));
  assert.ok(picks.length <= 8);
  for (const id of QUICK_PICKS) assert.ok(getItem(id), id);
});

test('every mapped label resolves to a real item', () => {
  const labels = ['envelope', 'packet', 'paper towel', 'water jug', 'hair spray', 'milk can', 'cup', 'tray',
    'television', 'remote control', 'syringe', 'frying pan', 'jersey', 'diaper', 'hose', "jack-o'-lantern", 'binder', 'comic book', 'crate'];
  for (const l of labels) {
    const id = mapLabelToItem(l);
    assert.ok(id && getItem(id), `${l} → ${id}`);
  }
});
