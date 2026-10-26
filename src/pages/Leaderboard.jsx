import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

function daysLeft(end) {
  return Math.max(0, Math.ceil((new Date(end) - Date.now()) / 86400000));
}

export default function Leaderboard() {
  const { user, stats } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/leaderboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-stop">{error}</p>;
  if (!data) return <p className="text-ash">Loading...</p>;

  const { competition, players } = data;
  const meListed = user && players.some((p) => p.id === user.id);
  const podium = ['bg-brand-400', 'bg-brand-300', 'bg-brand-200'];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-4xl">Leaderboard</h1>
        <p className="mt-1 text-lg">
          {competition.name}: <strong>{daysLeft(competition.end)} days left</strong>
        </p>
      </div>

      {players.length === 0 ? (
        <div className="card p-8 text-center text-ash">No one is on the board yet. Scan something to be first!</div>
      ) : (
        <ol className="space-y-2">
          {players.map((p) => {
            const mine = p.id === user?.id;
            return (
              <li
                key={p.id}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 ${podium[p.rank - 1] || 'bg-white'} ${mine ? 'ring-4 ring-brand-700' : ''}`}
              >
                <span className="w-8 font-heading text-2xl font-bold">{p.rank}</span>
                <span className="flex-1 font-semibold">
                  {p.displayName}
                  {mine && <span className="ml-2 text-sm text-brand-800">(you)</span>}
                </span>
                <span className="font-heading text-lg font-semibold">{p.points.toLocaleString()} pts</span>
              </li>
            );
          })}
        </ol>
      )}

      {user && !meListed && stats?.rank && (
        <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3 ring-4 ring-brand-700">
          <span className="w-8 font-heading text-2xl font-bold">{stats.rank}</span>
          <span className="flex-1 font-semibold">{user.displayName} (you)</span>
          <span className="font-heading text-lg font-semibold">{stats.competitionPoints} pts</span>
        </div>
      )}

      {!user && (
        <Link to="/register" className="btn-primary w-full">Join to get on the board</Link>
      )}

      <p className="text-center text-sm text-ash">Scans have a daily limit, so showing up every day beats one long session.</p>
    </div>
  );
}
