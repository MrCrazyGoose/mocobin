// Student progress: levels from season points, a daily scan streak, and
// badges earned from logged activity. Computed from point events, so it
// works the same on the server and in tests.

import { eastern } from './pickup.js';

export const LEVELS = [
  { name: 'Rookie Sorter', min: 0 },
  { name: 'Bin Buddy', min: 50 },
  { name: 'Sort Scout', min: 150 },
  { name: 'Recycling Ranger', min: 350 },
  { name: 'Contamination Cop', min: 700 },
  { name: 'Bin Boss', min: 1200 },
];

export function levelFor(points) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1] || null;
  const span = next ? next.min - LEVELS[i].min : 1;
  return {
    number: i + 1,
    name: LEVELS[i].name,
    next: next ? { name: next.name, pointsToGo: next.min - points } : null,
    progress: next ? Math.min(1, (points - LEVELS[i].min) / span) : 1,
  };
}

const dayKey = (instant) => {
  const e = eastern(instant);
  return Date.UTC(e.y, e.m - 1, e.d);
};

// Days in a row (Eastern time) with at least one scan, counting today, or
// ending yesterday if there has been no scan yet today.
export function dayStreak(events, now = new Date()) {
  const days = new Set(events.filter((e) => e.type === 'scan').map((e) => dayKey(e.createdAt)));
  const DAY = 86400000;
  let day = dayKey(now);
  if (!days.has(day)) day -= DAY;
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day -= DAY;
  }
  return streak;
}

const HAZARD_ITEMS = new Set([
  'car-battery', 'household-battery', 'paint', 'motor-oil', 'propane-tank', 'cfl-bulb',
  'phone', 'computer', 'tv', 'small-electronics',
]);

export const BADGES = [
  { id: 'first-scan', name: 'First Scan', how: 'Scan your first item.' },
  { id: 'sort-squad', name: 'Sort Squad', how: 'Scan 10 items.' },
  { id: 'half-century', name: 'Half Century', how: 'Scan 50 items.' },
  { id: 'bag-buster', name: 'Bag Buster', how: 'Catch a plastic bag before it hits the blue bin.' },
  { id: 'grease-detective', name: 'Grease Detective', how: 'Find grease on a pizza box or cardboard.' },
  { id: 'hazard-hero', name: 'Hazard Hero', how: 'Send a battery or electronic to Shady Grove.' },
  { id: 'quiz-ace', name: 'Quiz Ace', how: 'Get every question right on a weekly quiz.' },
  { id: 'bin-night', name: 'Bin Night', how: 'Pass your first bin night check.' },
  { id: 'three-peat', name: 'Three-Peat', how: 'Pass bin night three weeks in a row.' },
  { id: 'week-streak', name: 'Week Streak', how: 'Scan something seven days in a row.' },
];

export function earnedBadges(events, { dayStreak: streak = 0 } = {}) {
  const scans = events.filter((e) => e.type === 'scan');
  const has = (fn) => events.some(fn);
  const earned = new Set();
  if (scans.length >= 1) earned.add('first-scan');
  if (scans.length >= 10) earned.add('sort-squad');
  if (scans.length >= 50) earned.add('half-century');
  if (scans.some((e) => ['plastic-bag', 'plastic-film'].includes(e.meta?.itemId))) earned.add('bag-buster');
  if (scans.some((e) => ['pizza-box', 'cardboard-box', 'paperboard'].includes(e.meta?.itemId) && e.meta?.contaminationFound)) {
    earned.add('grease-detective');
  }
  if (scans.some((e) => HAZARD_ITEMS.has(e.meta?.itemId))) earned.add('hazard-hero');
  if (has((e) => e.type === 'quiz' && e.meta?.correct === e.meta?.total && e.meta?.total > 0)) earned.add('quiz-ace');
  if (has((e) => e.type === 'bincheck' && e.meta?.verdict === 'ready')) earned.add('bin-night');
  if (has((e) => e.type === 'bincheck' && e.meta?.streak >= 3)) earned.add('three-peat');
  if (streak >= 7) earned.add('week-streak');
  return BADGES.map((b) => ({ ...b, earned: earned.has(b.id) }));
}
