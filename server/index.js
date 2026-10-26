import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createStore } from './store/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set in production.');
  }
  // Development: persist a random secret so logins survive restarts.
  const file = path.join(root, 'data', '.session-secret');
  try {
    return (await fs.readFile(file, 'utf8')).trim();
  } catch {
    const secret = randomBytes(32).toString('hex');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, secret, { mode: 0o600 });
    return secret;
  }
}

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set, so data goes to a JSON file. On hosts with temporary disks (like Render) all accounts and points are lost on every restart.');
}

const store = await createStore({ ...process.env, DATA_FILE: process.env.DATA_FILE || path.join(root, 'data', 'ecosort.json') });
const app = createApp({ store, secret: await loadSecret(), staticDir: path.join(root, 'dist') });
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`MoCoBin API listening on http://localhost:${port} (${process.env.DATABASE_URL ? 'PostgreSQL' : 'JSON file'} storage)`);
});
