// Calendar file with a reminder the evening before each pickup. Each pickup
// is its own event so holiday slides land on the right night.

import { addDays, upcomingPickups, WEEKDAYS, weekday } from '../shared/pickup.js';

const pad = (n) => String(n).padStart(2, '0');
const stamp = (d) => `${d.y}${pad(d.m)}${pad(d.d)}`;

export function pickupCalendar(pickupDay, { now = new Date(), weeks = 26, appName = 'MoCoBin', url = '' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${appName}//Bin night//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${appName} bin night`,
  ];
  const created = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  for (const p of upcomingPickups(pickupDay, weeks, now)) {
    const eve = addDays(p.date, -1);
    const slid = p.holiday ? ` Moved a day later for ${p.holiday}.` : '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:bin-night-${stamp(p.date)}-${pickupDay}@mocobin`,
      `DTSTAMP:${created}`,
      `DTSTART;TZID=America/New_York:${stamp(eve)}T190000`,
      `DTEND;TZID=America/New_York:${stamp(eve)}T191500`,
      `SUMMARY:Bin night: check your bin`,
      `DESCRIPTION:Pickup is ${WEEKDAYS[weekday(p.date)]}. Take a photo of your open bin before it goes to the curb.${slid}${url ? ` ${url}` : ''}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Bin night: check your bin',
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
