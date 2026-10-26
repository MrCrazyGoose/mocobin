import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { WEEKDAYS, PICKUP_DAYS } from '../../shared/pickup.js';
import { BIN_CHECKLIST, POINTS } from '../../shared/points.js';

const COUNTY_LOOKUP = 'https://www2.montgomerycountymd.gov/DEPcollectionday/collectionday.aspx';

export default function BinNight() {
  const { user, refresh } = useAuth();
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) refresh().then(setMe);
  }, [user?.id, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const day = me?.user?.pickupDay ?? null;
  const pickup = me?.pickup;
  const stats = me?.stats;

  const setDay = async (d) => {
    setSaving(true);
    try {
      await api('/me/pickup', { method: 'PUT', body: { day: d } });
      setMe(await refresh());
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const allDone = checked.length === BIN_CHECKLIST.length;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const out = await api('/bin-checks', { method: 'POST', body: { checklist: checked } });
      setResult(out);
      setMe(await refresh());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h1 className="text-4xl">Bin night</h1>
        <p className="text-lg">
          The night before trash day, run a quick check on your recycling bin. A clean bin earns {POINTS.BIN_CHECK} points, and
          more for every week in a row.
        </p>
        <Link to="/register" className="btn-primary btn-big">Join to start</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-4xl">Bin night</h1>
        <p className="mt-1">
          The night before pickup, open your recycling bin and check these five things. A clean bin earns {POINTS.BIN_CHECK}{' '}
          points, and more for every week in a row.
        </p>
      </div>

      {me && (
        <div className="card p-5">
          <p className="font-heading text-xl font-semibold">When is your trash day?</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {PICKUP_DAYS.map((d) => (
              <button
                key={d}
                disabled={saving}
                onClick={() => setDay(d)}
                className={`rounded-full py-2 font-heading font-semibold ${day === d ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-800'}`}
              >
                {WEEKDAYS[d].slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm">
            Not sure? Ask a parent or{' '}
            <a className="font-semibold text-brand-700 underline" href={COUNTY_LOOKUP} target="_blank" rel="noreferrer">
              look it up on the county site
            </a>
            .
          </p>
        </div>
      )}

      {pickup && (
        <div className="card overflow-hidden">
          <div className="bg-brand-400 p-5">
            <p className="text-sm font-bold">Next pickup</p>
            <p className="font-heading text-3xl font-bold">{pickup.label}</p>
            {pickup.holiday && <p className="mt-1 text-sm font-semibold">Moved a day later for {pickup.holiday}.</p>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-heading text-2xl font-bold">{stats?.binStreak || 0}-week streak</p>
              <p className="text-sm text-ash">Check between noon the day before and 10 a.m. pickup day.</p>
            </div>
            <a className="btn-secondary !px-4 !py-1.5 !text-base" href={`/api/pickup/calendar.ics?day=${day}`}>Remind me</a>
          </div>
        </div>
      )}

      {result?.counted ? (
        <div className="rounded-3xl bg-brand-400 p-6 text-center">
          <p className="font-heading text-4xl font-bold">+{result.points} points</p>
          <p className="font-heading text-xl font-semibold">{result.streak}-week streak. Your bin is ready to roll!</p>
        </div>
      ) : (
        <div className="card p-5">
          <p className="font-heading text-xl font-semibold">Bin check</p>
          <ul className="mt-3 space-y-2">
            {BIN_CHECKLIST.map((c) => {
              const on = checked.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left ${on ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 font-bold ${
                        on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200'
                      }`}
                    >
                      {on ? '\u2713' : ''}
                    </span>
                    <span>
                      <span className="block font-heading font-semibold">{c.label}</span>
                      <span className="block text-sm text-ash">{c.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="btn-primary btn-big mt-4 w-full" onClick={submit} disabled={!allDone || busy}>
            {busy ? 'Saving...' : allDone ? 'My bin is ready!' : `${checked.length} of ${BIN_CHECKLIST.length} checked`}
          </button>
          {error && <p className="mt-2 font-semibold text-stop">{error}</p>}
          {result?.note && <p className="mt-3 text-center font-semibold">{result.note}</p>}
        </div>
      )}
    </div>
  );
}
