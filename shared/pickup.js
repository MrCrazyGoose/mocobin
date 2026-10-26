// Pickup days, the county holiday "slide" rule, and the bin-night check
// window. Everything is computed in Eastern time.
//
// Slide rule (Montgomery County DEP): when a county holiday falls on a
// weekday, collection that day and every later day of that week moves one
// day later (Friday moves to Saturday). Weather slides are announced
// separately and are not predictable.

export const TIME_ZONE = 'America/New_York';
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const PICKUP_DAYS = [1, 2, 3, 4, 5]; // county collection runs Monday to Friday

// A check counts from noon the day before pickup until 10 a.m. pickup day.
export const WINDOW_START_HOUR = 12;
export const WINDOW_END_HOUR = 10;

// ---------- calendar dates as plain { y, m, d } (no time zone) ----------

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = ({ y, m, d }) => `${y}-${pad(m)}-${pad(d)}`;

function fromUTC(t) {
  const x = new Date(t);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}
const toUTC = ({ y, m, d }) => Date.UTC(y, m - 1, d);
export const addDays = (date, n) => fromUTC(toUTC(date) + n * 86400000);
export const weekday = (date) => new Date(toUTC(date)).getUTCDay();
export const compareDates = (a, b) => toUTC(a) - toUTC(b);

function nthWeekday(y, m, dow, n) {
  const first = { y, m, d: 1 };
  const offset = (dow - weekday(first) + 7) % 7;
  return addDays(first, offset + (n - 1) * 7);
}

function lastWeekday(y, m, dow) {
  const last = m === 12 ? { y, m: 12, d: 31 } : addDays({ y, m: m + 1, d: 1 }, -1);
  return addDays(last, -((weekday(last) - dow + 7) % 7));
}

// The ten county holidays that trigger a slide.
export function countyHolidays(y) {
  return [
    { name: "New Year's Day", date: { y, m: 1, d: 1 } },
    { name: 'Martin Luther King Jr. Day', date: nthWeekday(y, 1, 1, 3) },
    { name: "Presidents' Day", date: nthWeekday(y, 2, 1, 3) },
    { name: 'Memorial Day', date: lastWeekday(y, 5, 1) },
    { name: 'Juneteenth', date: { y, m: 6, d: 19 } },
    { name: 'Independence Day', date: { y, m: 7, d: 4 } },
    { name: 'Labor Day', date: nthWeekday(y, 9, 1, 1) },
    { name: 'Veterans Day', date: { y, m: 11, d: 11 } },
    { name: 'Thanksgiving', date: nthWeekday(y, 11, 4, 4) },
    { name: 'Christmas Day', date: { y, m: 12, d: 25 } },
  ];
}

// Given the scheduled pickup date for a week, return the actual date after
// any holiday slide, plus the holiday that caused it.
export function applySlide(scheduled) {
  const dow = weekday(scheduled);
  const monday = addDays(scheduled, 1 - dow);
  for (const h of countyHolidays(scheduled.y).concat(countyHolidays(monday.y))) {
    const hDow = weekday(h.date);
    if (hDow < 1 || hDow > 5) continue; // weekend holidays do not slide
    const inWeek = compareDates(h.date, monday) >= 0 && compareDates(h.date, addDays(monday, 4)) <= 0;
    if (inWeek && hDow <= dow) return { date: addDays(scheduled, 1), holiday: h.name };
  }
  return { date: scheduled, holiday: null };
}

// ---------- Eastern wall-clock time ----------

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  hourCycle: 'h23',
});

export function eastern(instant) {
  const parts = Object.fromEntries(fmt.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day), hour: Number(parts.hour) };
}

// The next pickup (after slides) whose check window has not closed yet.
export function nextPickup(pickupDay, now = new Date()) {
  if (!PICKUP_DAYS.includes(pickupDay)) return null;
  const e = eastern(now);
  const today = { y: e.y, m: e.m, d: e.d };
  // Scheduled day in the current week (Sunday-start), then walk forward.
  let scheduled = addDays(today, pickupDay - weekday(today));
  for (let i = 0; i < 3; i++) {
    const { date, holiday } = applySlide(scheduled);
    const cmp = compareDates(date, today);
    if (cmp > 0 || (cmp === 0 && e.hour < WINDOW_END_HOUR)) {
      return { date, scheduled, holiday, key: dateKey(date) };
    }
    scheduled = addDays(scheduled, 7);
  }
  return null;
}

// Is `instant` inside the check window for the pickup on `date`?
export function inCheckWindow(date, instant) {
  const e = eastern(instant);
  const day = { y: e.y, m: e.m, d: e.d };
  const eve = addDays(date, -1);
  if (compareDates(day, eve) === 0) return e.hour >= WINDOW_START_HOUR;
  if (compareDates(day, date) === 0) return e.hour < WINDOW_END_HOUR;
  return false;
}

// Upcoming pickups for a calendar file, slides applied.
export function upcomingPickups(pickupDay, count, now = new Date()) {
  const first = nextPickup(pickupDay, now);
  if (!first) return [];
  const out = [first];
  let scheduled = first.scheduled;
  while (out.length < count) {
    scheduled = addDays(scheduled, 7);
    const { date, holiday } = applySlide(scheduled);
    out.push({ date, scheduled, holiday, key: dateKey(date) });
  }
  return out;
}

export function formatDate(date) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${WEEKDAYS[weekday(date)]}, ${names[date.m - 1]} ${date.d}`;
}
