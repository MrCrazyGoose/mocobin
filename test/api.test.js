import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { FileStore } from '../server/store/fileStore.js';
import { PgStore } from '../server/store/pgStore.js';
import { questionsForWeek, weekKey } from '../server/quizBank.js';
import { LIMITS, POINTS } from '../shared/points.js';

// Competition window that always includes "now".
const ENV = { COMPETITION_START: '2000-01-01', COMPETITION_END: '2999-12-31', AUTH_RATE_LIMIT: '1000' };

function apiSuite(name, makeStore) {
  describe(name, () => {
    let server;
    let base;
    let store;
    let cleanup;

    before(async () => {
      ({ store, cleanup } = await makeStore());
      const app = createApp({ store, secret: 'test-secret', env: ENV });
      server = app.listen(0);
      await new Promise((r) => server.once('listening', r));
      base = `http://127.0.0.1:${server.address().port}/api`;
    });

    after(async () => {
      server.close();
      await store.close();
      await cleanup();
    });

    async function call(p, { method = 'GET', body, token } = {}) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(base + p, { method, headers, body: body && JSON.stringify(body) });
      return { status: res.status, body: await res.json() };
    }

    const suffix = Math.random().toString(36).slice(2, 7);
    const register = (username, extra = {}) =>
      call('/auth/register', {
        method: 'POST',
        body: { username: `${username}_${suffix}`, password: 'recycle-123', displayName: username, ...extra },
      });

    test('registration validates input', async () => {
      assert.equal((await call('/auth/register', { method: 'POST', body: { username: 'a!', password: 'recycle-123', displayName: 'Al' } })).status, 400);
      assert.equal((await register('valid2', { password: 'short' })).status, 400);
      assert.equal((await register('valid3', { displayName: 'x' })).status, 400);
    });

    test('register, duplicate username, login and /me', async () => {
      const r = await register('alex');
      assert.equal(r.status, 201);
      assert.equal(r.body.user.displayName, 'alex');
      assert.equal(r.body.user.school, undefined);
      assert.equal(r.body.user.passwordHash, undefined);
      assert.equal((await register('alex')).status, 409);

      const bad = await call('/auth/login', { method: 'POST', body: { username: `alex_${suffix}`, password: 'nope-nope' } });
      assert.equal(bad.status, 401);
      const ok = await call('/auth/login', { method: 'POST', body: { username: `ALEX_${suffix}`, password: 'recycle-123' } });
      assert.equal(ok.status, 200);

      const me = await call('/me', { token: ok.body.token });
      assert.equal(me.status, 200);
      assert.equal(me.body.stats.competitionPoints, 0);
      assert.equal(me.body.level.name, 'Rookie Sorter');
      assert.equal(me.body.stats.dayStreak, 0);
      assert.ok(me.body.badges.every((b) => !b.earned));
      assert.equal((await call('/me')).status, 401);
      assert.equal((await call('/me', { token: ok.body.token + 'x' })).status, 401);
    });

    test('scans award points, contamination bonus only when eligible, daily cap', async () => {
      const { body } = await register('sam');
      const token = body.token;

      let r = await call('/scans', { method: 'POST', token, body: { itemId: 'pizza-box', contaminationFound: true, level: 'light', source: 'camera' } });
      assert.equal(r.status, 201);
      assert.equal(r.body.points, POINTS.SCAN + POINTS.CONTAMINATION_BONUS);

      // Newspaper has no contamination check or alert, so no bonus.
      r = await call('/scans', { method: 'POST', token, body: { itemId: 'newspaper', contaminationFound: true } });
      assert.equal(r.body.points, POINTS.SCAN);

      assert.equal((await call('/scans', { method: 'POST', token, body: { itemId: 'nope' } })).status, 400);

      // Hit the cap with parallel requests; the total must not exceed it.
      await Promise.all(
        Array.from({ length: 12 }, () =>
          call('/scans', { method: 'POST', token, body: { itemId: 'plastic-bag', contaminationFound: true } }),
        ),
      );
      const me = await call('/me', { token });
      assert.equal(me.body.stats.breakdown.scan, LIMITS.SCAN_POINTS_PER_DAY);
      assert.equal(me.body.stats.scanPointsRemainingToday, 0);
      assert.equal(me.body.stats.contaminationCaught, 13);
    });

    test('weekly quiz: answers hidden, scored on server, one attempt per week', async () => {
      const { body } = await register('quinn');
      const token = body.token;
      const q = await call('/quiz/current', { token });
      assert.equal(q.status, 200);
      assert.equal(q.body.questions.length, LIMITS.QUIZ_QUESTIONS);
      assert.equal(q.body.questions[0].answer, undefined);
      assert.equal(q.body.attempt, null);

      const real = questionsForWeek(weekKey(), LIMITS.QUIZ_QUESTIONS);
      const answers = Object.fromEntries(real.map((x, i) => [x.id, i === 0 ? (x.answer + 1) % x.choices.length : x.answer]));
      const [first, second] = await Promise.all([
        call('/quiz/submit', { method: 'POST', token, body: { answers } }),
        call('/quiz/submit', { method: 'POST', token, body: { answers } }),
      ]);
      const statuses = [first.status, second.status].sort();
      assert.deepEqual(statuses, [201, 409]);
      const result = first.status === 201 ? first.body : second.body;
      assert.equal(result.correct, LIMITS.QUIZ_QUESTIONS - 1);
      assert.equal(result.points, (LIMITS.QUIZ_QUESTIONS - 1) * POINTS.QUIZ_PER_CORRECT);

      const again = await call('/quiz/current', { token });
      assert.equal(again.body.attempt.correct, LIMITS.QUIZ_QUESTIONS - 1);
    });

    test('batches require loose recyclables, award bonus and are limited per day', async () => {
      const { body } = await register('bea');
      const token = body.token;
      const counts = { blueBin: 4, paper: 3, dropoff: 0, trash: 1 };

      let r = await call('/batches', { method: 'POST', token, body: { counts, checklist: ['rinsed'] } });
      assert.equal(r.status, 400);
      r = await call('/batches', { method: 'POST', token, body: { counts: { blueBin: 1 }, checklist: ['no-bags'] } });
      assert.equal(r.status, 400);
      r = await call('/batches', { method: 'POST', token, body: { counts: { blueBin: -1, paper: 9 }, checklist: ['no-bags'] } });
      assert.equal(r.status, 400);

      r = await call('/batches', { method: 'POST', token, body: { counts, checklist: ['no-bags'] } });
      assert.equal(r.status, 201);
      assert.equal(r.body.points, POINTS.BATCH);
      r = await call('/batches', {
        method: 'POST',
        token,
        body: { counts, checklist: ['no-bags', 'rinsed', 'cardboard-flat', 'paper-separate', 'hazards-out'] },
      });
      assert.equal(r.body.points, POINTS.BATCH + POINTS.BATCH_CHECKLIST_BONUS);
      r = await call('/batches', { method: 'POST', token, body: { counts, checklist: ['no-bags'] } });
      assert.equal(r.status, 429);
    });

    test('leaderboard ranks individuals by points', async () => {
      const lb = await call('/leaderboard');
      assert.equal(lb.status, 200);
      const names = lb.body.players.map((s) => s.displayName);
      assert.ok(names.includes('sam') && names.includes('quinn') && names.includes('bea'));
      lb.body.players.forEach((p, i) => {
        assert.equal(p.rank, i + 1);
        if (i > 0) assert.ok(lb.body.players[i - 1].points >= p.points);
        assert.equal(p.school, undefined);
      });
      assert.equal(lb.body.schools, undefined);
      // Players with zero points (alex) are not listed.
      assert.ok(!names.includes('alex'));
    });

    test('rules endpoints', async () => {
      const r = await call('/rules?q=pizza');
      assert.equal(r.body.items[0].id, 'pizza-box');
      const v = await call('/rules/plastic-bag');
      assert.match(v.body.alert, /does not accept plastic bags/);
      assert.equal((await call('/rules/unknown-thing')).status, 404);
      assert.equal((await call('/nope')).status, 404);
    });
  });
}

apiSuite('API with JSON file store', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'ecosort-'));
  const store = new FileStore(path.join(dir, 'db.json'));
  await store.init();
  return { store, cleanup: () => rm(dir, { recursive: true, force: true }) };
});

if (process.env.TEST_DATABASE_URL) {
  apiSuite('API with PostgreSQL store', async () => {
    const store = new PgStore(process.env.TEST_DATABASE_URL);
    await store.init();
    return { store, cleanup: async () => {} };
  });
}
