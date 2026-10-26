// Point values and anti-farming limits. Shared so the UI can show the same
// numbers the server enforces.

export const POINTS = {
  SCAN: 2, // any item scanned and sorted
  CONTAMINATION_BONUS: 5, // scan where contamination / a banned item was caught
  QUIZ_PER_CORRECT: 10, // weekly Zero-Waste Quiz, per correct answer
  QUIZ_PERFECT_BONUS: 10,
  BATCH: 15, // logged household batch
  BATCH_CHECKLIST_BONUS: 5, // every prep checklist item confirmed
  BIN_CHECK: 20, // bin-night checklist finished, once per pickup
  STREAK_BONUS: 5, // per week of streak, on top of BIN_CHECK
  STREAK_BONUS_MAX: 25,
};

export const LIMITS = {
  SCAN_POINTS_PER_DAY: 60,
  BATCHES_PER_DAY: 2,
  QUIZ_QUESTIONS: 5,
};

export function streakBonus(streak) {
  return Math.min(POINTS.STREAK_BONUS_MAX, Math.max(0, streak - 1) * POINTS.STREAK_BONUS);
}

// Bin night: the night before pickup, check your recycling bin.
export const BIN_CHECKLIST = [
  { id: 'no-bags', label: 'No plastic bags', detail: 'Recyclables are loose, not bagged, and no bags or wrap are mixed in.' },
  { id: 'rinsed', label: 'Containers are empty and rinsed', detail: 'No food or drinks left in bottles, cans, jars or tubs.' },
  { id: 'no-grease', label: 'No greasy paper', detail: 'Greasy pizza box bottoms and used napkins went in the trash.' },
  { id: 'no-hazards', label: 'No batteries or electronics', detail: 'Those go to Shady Grove, never in a curbside bin.' },
  { id: 'lid-closes', label: 'The lid closes', detail: 'Cardboard is flattened and nothing sticks out.' },
];

export const BATCH_CHECKLIST = [
  { id: 'no-bags', label: 'Recyclables are loose in the bin, not in a plastic bag' },
  { id: 'rinsed', label: 'Containers are empty, rinsed and clean' },
  { id: 'cardboard-flat', label: 'Cardboard is flattened and grease-free' },
  { id: 'paper-separate', label: 'Paper is in the mixed-paper cart, containers in the blue bin' },
  { id: 'hazards-out', label: 'No batteries, electronics or hazardous items in any bin' },
];

export const BATCH_FIELDS = [
  { id: 'blueBin', label: 'Blue bin items' },
  { id: 'paper', label: 'Paper & cardboard items' },
  { id: 'dropoff', label: 'Drop-off / Shady Grove items' },
  { id: 'trash', label: 'Items correctly sent to trash' },
];
