// PostgreSQL store. Enabled when DATABASE_URL is set.

import pg from 'pg';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON users (lower(username));

-- Early versions required a school. Keep old data but stop requiring it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'school_id') THEN
    ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS pickup_day INTEGER;

CREATE TABLE IF NOT EXISTS point_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS point_events_user_time ON point_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS point_events_time ON point_events (created_at);
`;

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    pickupDay: row.pickup_day ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

function toEvent(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    points: row.points,
    meta: row.meta,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgStore {
  constructor(connectionString) {
    this.pool = new pg.Pool({ connectionString });
  }

  async init() {
    await this.pool.query(SCHEMA);
  }

  async createUser({ username, displayName, passwordHash }) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO users (username, display_name, password_hash)
         VALUES ($1, $2, $3) RETURNING *`,
        [username, displayName, passwordHash],
      );
      return toUser(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        const e = new Error('Username already taken');
        e.code = 'USERNAME_TAKEN';
        throw e;
      }
      throw err;
    }
  }

  async getUserById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return toUser(rows[0]);
  }

  async getUserByUsername(username) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE lower(username) = lower($1)', [username]);
    return toUser(rows[0]);
  }

  async updateUser(id, patch) {
    if ('pickupDay' in patch) {
      await this.pool.query('UPDATE users SET pickup_day = $2 WHERE id = $1', [id, patch.pickupDay]);
    }
    return this.getUserById(id);
  }

  async addEvent({ userId, type, points, meta = {}, createdAt }) {
    const { rows } = await this.pool.query(
      `INSERT INTO point_events (user_id, type, points, meta, created_at)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now())) RETURNING *`,
      [userId, type, points, meta, createdAt || null],
    );
    return toEvent(rows[0]);
  }

  async listUserEvents(userId, { since, limit } = {}) {
    const { rows } = await this.pool.query(
      `SELECT * FROM point_events
       WHERE user_id = $1 AND ($2::timestamptz IS NULL OR created_at >= $2)
       ORDER BY created_at DESC
       LIMIT $3`,
      [userId, since || null, limit || null],
    );
    return rows.map(toEvent);
  }

  async leaderboard({ start, end, limit = 50 }) {
    const { rows } = await this.pool.query(
      `SELECT u.id, u.username, u.display_name, SUM(e.points)::int AS points
       FROM point_events e JOIN users u ON u.id = e.user_id
       WHERE e.created_at BETWEEN $1 AND $2
       GROUP BY u.id
       HAVING SUM(e.points) > 0
       ORDER BY points DESC, u.display_name ASC
       LIMIT $3`,
      [start, end, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      points: r.points,
    }));
  }

  async close() {
    await this.pool.end();
  }
}
