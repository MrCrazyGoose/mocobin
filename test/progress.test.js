import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, dayStreak, earnedBadges, levelFor } from '../shared/progress.js';

const scan = (iso, meta = {}) => ({ type: 'scan', createdAt: iso, points: 2, meta });

test('levels and progress to the next one', () => {
  assert.equal(levelFor(0).name, 'Rookie Sorter');
  assert.equal(levelFor(0).next.pointsToGo, 50);
  assert.equal(levelFor(100).name, 'Bin Buddy');
  assert.equal(levelFor(100).progress, 0.5);
  const top = levelFor(5000);
  assert.equal(top.name, 'Bin Boss');
  assert.equal(top.next, null);
  assert.equal(top.progress, 1);
});

test('daily streak counts Eastern days in a row', () => {
  const now = new Date('2026-10-26T15:00:00Z'); // Mon 11 a.m. ET
  // Sat late night ET (Sun 02:00 UTC), Sun, and Mon.
  const events = [scan('2026-10-25T02:00:00Z'), scan('2026-10-25T20:00:00Z'), scan('2026-10-26T13:00:00Z')];
  assert.equal(dayStreak(events, now), 3);
  // No scan yet today: the streak through yesterday still counts.
  assert.equal(dayStreak(events.slice(0, 2), now), 2);
  // A gap breaks it.
  assert.equal(dayStreak([scan('2026-10-23T15:00:00Z')], now), 0);
  // Non-scan events do not count.
  assert.equal(dayStreak([{ type: 'quiz', createdAt: '2026-10-26T13:00:00Z', meta: {} }], now), 0);
});

test('badges are earned from activity', () => {
  const events = [
    scan('2026-10-26T13:00:00Z', { itemId: 'plastic-bag', contaminationFound: true }),
    scan('2026-10-26T13:01:00Z', { itemId: 'pizza-box', contaminationFound: true }),
    scan('2026-10-26T13:02:00Z', { itemId: 'household-battery' }),
    { type: 'quiz', createdAt: '2026-10-26T13:03:00Z', meta: { correct: 5, total: 5 } },
    { type: 'bincheck', createdAt: '2026-10-26T13:04:00Z', meta: { verdict: 'ready', streak: 3 } },
  ];
  const got = Object.fromEntries(earnedBadges(events, { dayStreak: 1 }).map((b) => [b.id, b.earned]));
  assert.equal(got['first-scan'], true);
  assert.equal(got['sort-squad'], false);
  assert.equal(got['bag-buster'], true);
  assert.equal(got['grease-detective'], true);
  assert.equal(got['hazard-hero'], true);
  assert.equal(got['quiz-ace'], true);
  assert.equal(got['bin-night'], true);
  assert.equal(got['three-peat'], true);
  assert.equal(got['week-streak'], false);
  assert.equal(earnedBadges([], {}).length, BADGES.length);
  assert.ok(earnedBadges([], {}).every((b) => !b.earned));
});
