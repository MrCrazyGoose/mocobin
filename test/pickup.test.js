import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySlide, countyHolidays, dateKey, inCheckWindow, nextPickup, upcomingPickups } from '../shared/pickup.js';
import { pickupCalendar } from '../server/ics.js';

// 2026-10-13 is a Tuesday. Times below are UTC; Eastern is UTC-4 in October.
const TUESDAY_NOON_ET = new Date('2026-10-13T16:00:00Z');

test('county holidays for 2026 fall on the right dates', () => {
  const h = Object.fromEntries(countyHolidays(2026).map((x) => [x.name, dateKey(x.date)]));
  assert.equal(h['Martin Luther King Jr. Day'], '2026-01-19');
  assert.equal(h["Presidents' Day"], '2026-02-16');
  assert.equal(h['Memorial Day'], '2026-05-25');
  assert.equal(h['Labor Day'], '2026-09-07');
  assert.equal(h.Thanksgiving, '2026-11-26');
});

test('a weekday holiday slides that day and later days by one', () => {
  // Thanksgiving week 2026: Thursday holiday.
  assert.equal(dateKey(applySlide({ y: 2026, m: 11, d: 25 }).date), '2026-11-25'); // Wed, before: no slide
  assert.equal(dateKey(applySlide({ y: 2026, m: 11, d: 26 }).date), '2026-11-27'); // Thu -> Fri
  const fri = applySlide({ y: 2026, m: 11, d: 27 });
  assert.equal(dateKey(fri.date), '2026-11-28'); // Fri -> Sat
  assert.equal(fri.holiday, 'Thanksgiving');
  // Labor Day (Monday) slides the whole week.
  assert.equal(dateKey(applySlide({ y: 2026, m: 9, d: 7 }).date), '2026-09-08');
  assert.equal(dateKey(applySlide({ y: 2026, m: 9, d: 11 }).date), '2026-09-12');
  // Independence Day 2026 is a Saturday: no slide.
  assert.equal(applySlide({ y: 2026, m: 7, d: 2 }).holiday, null);
  // New Year's Day 2027 is a Friday; the week starts in 2026.
  assert.equal(dateKey(applySlide({ y: 2027, m: 1, d: 1 }).date), '2027-01-02');
});

test('next pickup and the check window', () => {
  const thu = nextPickup(4, TUESDAY_NOON_ET);
  assert.equal(thu.key, '2026-10-15');
  // Tuesday pickup at noon Tuesday: window closed at 10 a.m., so next week.
  assert.equal(nextPickup(2, TUESDAY_NOON_ET).key, '2026-10-20');
  // Tuesday pickup at 9 a.m. Tuesday: still today.
  assert.equal(nextPickup(2, new Date('2026-10-13T13:00:00Z')).key, '2026-10-13');
  assert.equal(nextPickup(6, TUESDAY_NOON_ET), null);

  const date = thu.date;
  assert.equal(inCheckWindow(date, new Date('2026-10-14T15:59:00Z')), false); // Wed 11:59 a.m.
  assert.equal(inCheckWindow(date, new Date('2026-10-14T16:00:00Z')), true); // Wed noon
  assert.equal(inCheckWindow(date, new Date('2026-10-15T03:00:00Z')), true); // Wed 11 p.m.
  assert.equal(inCheckWindow(date, new Date('2026-10-15T13:59:00Z')), true); // Thu 9:59 a.m.
  assert.equal(inCheckWindow(date, new Date('2026-10-15T14:00:00Z')), false); // Thu 10 a.m.
});

test('upcoming pickups apply slides', () => {
  const keys = upcomingPickups(4, 8, TUESDAY_NOON_ET).map((p) => p.key);
  assert.ok(keys.includes('2026-11-13')); // Veterans Day (Wed) week: Thu -> Fri
  assert.ok(keys.includes('2026-11-27')); // Thanksgiving: Thu -> Fri
  assert.ok(!keys.includes('2026-11-26'));
});

test('calendar file has a reminder the evening before each pickup', () => {
  const ics = pickupCalendar(4, { now: TUESDAY_NOON_ET, weeks: 8, appName: 'TestApp' });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;TZID=America\/New_York:20261014T190000/);
  assert.match(ics, /DTSTART;TZID=America\/New_York:20261126T190000/); // eve of the slid Friday pickup
  assert.match(ics, /Moved a day later for Thanksgiving/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 8);
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 8);
  assert.ok(!ics.includes('—'));
});
