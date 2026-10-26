import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { WarningCard } from '../components/VerdictCard.jsx';

const STEPS = [
  { title: 'Scan it', body: 'Point your phone at whatever you are about to throw out.' },
  { title: 'Get the right bin', body: 'Blue bin, paper, trash or Shady Grove, under Montgomery County rules.' },
  { title: 'Climb the ranks', body: 'Earn points and badges, keep your streak alive, and beat your friends.' },
];

export default function Home() {
  const { user, stats } = useAuth();
  const [board, setBoard] = useState(null);

  useEffect(() => {
    api('/leaderboard').then(setBoard).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="pt-4 text-center">
        <img src="/logo.png" alt="MocoBin" className="mx-auto w-full max-w-md" />
        <h1 className="mt-6 text-4xl sm:text-5xl">Scan your trash. Earn points for getting it right.</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink/80">
          Made for Montgomery County students. Find out which bin anything goes in and compete with friends for the top spot.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/scan" className="btn-primary btn-big">Start scanning</Link>
          {!user && <Link to="/register" className="btn-secondary btn-big">Join free</Link>}
        </div>
        {user && stats && (
          <p className="mt-4 font-heading text-lg font-semibold text-brand-800">
            {stats.dayStreak > 0 ? `${stats.dayStreak}-day streak. Scan today to keep it going!` : 'Scan something today to start a streak.'}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400 font-heading text-lg font-bold">{i + 1}</span>
            <h2 className="mt-3 text-xl">{s.title}</h2>
            <p className="mt-1 text-sm">{s.body}</p>
          </div>
        ))}
      </section>

      <WarningCard title="The #1 mistake">
        Plastic bags never go in Montgomery County recycling. They jam the sorting machines. Take them to a grocery store
        drop-off or put them in the trash.
      </WarningCard>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl">Top sorters</h2>
          <Link to="/leaderboard" className="font-semibold text-brand-700 underline">See all</Link>
        </div>
        {board?.players?.length ? (
          <ol className="mt-3 divide-y-2 divide-brand-50">
            {board.players.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-2.5">
                <span className="w-6 font-heading text-xl font-bold text-brand-700">{p.rank}</span>
                <span className="flex-1 font-semibold">{p.displayName}</span>
                <span className="font-heading font-semibold">{p.points} pts</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-ash">No one is on the board yet. Be the first!</p>
        )}
      </section>
    </div>
  );
}
