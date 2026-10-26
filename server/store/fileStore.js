// JSON-file store for local development and small deployments. Writes are
// serialized and atomic (write to a temp file, then rename).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export class FileStore {
  constructor(file) {
    this.file = file;
    this.data = { users: [], events: [] };
    this.writing = Promise.resolve();
  }

  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      this.data = JSON.parse(await fs.readFile(this.file, 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      await this.persist();
    }
  }

  persist() {
    const snapshot = JSON.stringify(this.data);
    this.writing = this.writing.then(async () => {
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot);
      await fs.rename(tmp, this.file);
    });
    return this.writing;
  }

  async createUser({ username, displayName, passwordHash }) {
    const key = username.toLowerCase();
    if (this.data.users.some((u) => u.username.toLowerCase() === key)) {
      const err = new Error('Username already taken');
      err.code = 'USERNAME_TAKEN';
      throw err;
    }
    const user = {
      id: randomUUID(),
      username,
      displayName,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    await this.persist();
    return user;
  }

  async getUserById(id) {
    return this.data.users.find((u) => u.id === id) || null;
  }

  async getUserByUsername(username) {
    const key = String(username).toLowerCase();
    return this.data.users.find((u) => u.username.toLowerCase() === key) || null;
  }

  async updateUser(id, patch) {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, patch);
    await this.persist();
    return user;
  }

  async addEvent({ userId, type, points, meta = {}, createdAt = new Date().toISOString() }) {
    const event = { id: randomUUID(), userId, type, points, meta, createdAt };
    this.data.events.push(event);
    await this.persist();
    return event;
  }

  async listUserEvents(userId, { since, limit } = {}) {
    let events = this.data.events.filter(
      (e) => e.userId === userId && (!since || e.createdAt >= since),
    );
    events = events.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return limit ? events.slice(0, limit) : events;
  }

  totals({ start, end }) {
    const totals = new Map();
    for (const e of this.data.events) {
      if (e.createdAt < start || e.createdAt > end) continue;
      totals.set(e.userId, (totals.get(e.userId) || 0) + e.points);
    }
    return totals;
  }

  async leaderboard({ start, end, limit = 50 }) {
    const totals = this.totals({ start, end });
    const rows = [];
    for (const [userId, points] of totals) {
      const u = await this.getUserById(userId);
      if (u && points > 0) {
        rows.push({ id: u.id, username: u.username, displayName: u.displayName, points });
      }
    }
    rows.sort((a, b) => b.points - a.points || a.displayName.localeCompare(b.displayName));
    return rows.slice(0, limit);
  }

  async close() {
    await this.writing;
  }
}
