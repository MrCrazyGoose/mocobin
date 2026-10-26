import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { BRAND_DISCLAIMER } from '../../shared/brand.js';

function AuthCard({ title, children }) {
  return (
    <div className="mx-auto max-w-sm">
      <img src="/favicon.png" alt="" className="mx-auto h-20 w-20" />
      <h1 className="mt-3 text-center text-4xl">{title}</h1>
      <div className="card mt-5 p-6">{children}</div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.username, form.password);
      navigate('/scan');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome back">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <p className="text-stop">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        <p className="text-center text-sm">
          New here? <Link to="/register" className="font-semibold text-brand-700 underline">Join free</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate('/scan');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Join MocoBin">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="displayName">Leaderboard name</label>
          <input id="displayName" className="input" maxLength={30} value={form.displayName} onChange={set('displayName')} placeholder="Jordan K." required />
          <p className="mt-1 text-sm text-ash">First name and last initial, or a nickname. Not your full name.</p>
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input" autoComplete="username" maxLength={20} value={form.username} onChange={set('username')} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" autoComplete="new-password" minLength={8} value={form.password} onChange={set('password')} required />
          <p className="mt-1 text-sm text-ash">At least 8 characters.</p>
        </div>
        {error && <p className="text-stop">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        <p className="text-center text-sm text-ash">No email or phone number needed.</p>
        <p className="text-center text-xs text-ash">{BRAND_DISCLAIMER}</p>
        <p className="text-center text-sm">
          Have an account? <Link to="/login" className="font-semibold text-brand-700 underline">Log in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
