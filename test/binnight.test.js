import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { FileStore } from '../server/store/fileStore.js';
import { PgStore } from '../server/store/pgStore.js';
import { BIN_CHECKLIST, POINTS } from '../shared/points.js';

const ENV = { COMPETITION_START: '2000-01-01', COMPETITION_END: '2999-12-31', AUTH_RATE_LIMIT: '1000' };
const ALL = BIN_CHECKLIST.map((c) => c.id);

let clock = new Date('2026-10-14T23:00:00Z'); // Wed 7 p.m. ET, eve of a Thursday pickup
let server, base, dir, store;

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mocobin-bn-'));
  // Runs against PostgreSQL when TEST_DATABASE_URL is set.
  store = process.env.TEST_DATABASE_URL ? new PgStore(process.env.TEST_DATABASE_URL) : new FileStore(path.join(dir, 'db.json'));
  await store.init();
  const app = createApp({ store, secret: 's', env: ENV, now: () => clock });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  server.close();
  await store.close();
  await rm(dir, { recursive: true, force: true });
});

async function call(p, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + p, { method, headers, body: body && JSON.stringify(body) });
  const type = res.headers.get('content-type') || '';
  return { status: res.status, body: type.includes('json') ? await res.json() : await res.text(), type };
}

const suffix = Math.random().toString(36).slice(2, 7);
async function signup(name) {
  const r = await call('/auth/register', { method: 'POST', body: { username: `${name}_${suffix}`, password: 'recycle-123', displayName: name } });
  return r.body.token;
}

test('photo check routes are gone', async () => {
  assert.equal((await call('/vision/item', { method: 'POST', body: {} })).status, 404);
  assert.equal((await call('/config')).status, 404);
});

test('pickup day setup, calendar file and validation', async () => {
  const token = await signup('pat');
  assert.equal((await call('/me/pickup', { method: 'PUT', token, body: { day: 6 } })).status, 400);
  const r = await call('/me/pickup', { method: 'PUT', token, body: { day: 4 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.pickupDay, 4);
  assert.equal(r.body.pickup.key, '2026-10-15');
  const ics = await call('/pickup/calendar.ics?day=4');
  assert.match(ics.type, /text\/calendar/);
  assert.match(ics.body, /BEGIN:VEVENT/);
  assert.equal((await call('/pickup/calendar.ics?day=9')).status, 400);
});

test('bin night: the whole checklist is required, plus a pickup day and the check window', async () => {
  const token = await signup('noday');
  assert.equal((await call('/bin-checks', { method: 'POST', body: { checklist: ALL } })).status, 401);

  let r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL.slice(1) } });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /no plastic bags/);

  r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.equal(r.body.points, 0);
  assert.match(r.body.note, /Set your trash day/);

  await call('/me/pickup', { method: 'PUT', token, body: { day: 2 } }); // Tuesday: next is Oct 20
  r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.equal(r.body.points, 0);
  assert.match(r.body.note, /noon the day before/);
});

test('bin night: points once per pickup, streak next week, reset after a skipped week', async () => {
  clock = new Date('2026-10-14T23:00:00Z');
  const token = await signup('sam');
  await call('/me/pickup', { method: 'PUT', token, body: { day: 4 } });

  let r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.equal(r.body.counted, true);
  assert.equal(r.body.streak, 1);
  assert.equal(r.body.points, POINTS.BIN_CHECK);

  r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.equal(r.body.points, 0);
  assert.match(r.body.note, /already done/);

  let me = await call('/me', { token });
  assert.equal(me.body.stats.binStreak, 1);
  assert.equal(me.body.stats.binCheckedThisPickup, true);
  assert.ok(me.body.badges.find((b) => b.id === 'bin-night').earned);

  clock = new Date('2026-10-21T23:00:00Z');
  r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.equal(r.body.streak, 2);
  assert.equal(r.body.points, POINTS.BIN_CHECK + POINTS.STREAK_BONUS);

  clock = new Date('2026-11-04T23:00:00Z');
  me = await call('/me', { token });
  assert.equal(me.body.stats.binStreak, 0);
  r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.equal(r.body.streak, 1);

  // Veterans Day week: Thursday pickup slides to Friday, so Wednesday evening is not bin night.
  clock = new Date('2026-11-11T23:00:00Z');
  r = await call('/bin-checks', { method: 'POST', token, body: { checklist: ALL } });
  assert.match(r.body.note, /Friday, Nov 13/);
});
