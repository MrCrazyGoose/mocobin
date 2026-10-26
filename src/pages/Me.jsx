import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

const TYPE_LABEL = { scan: 'Scan', quiz: 'Quiz', batch: 'Batch', bincheck: 'Bin night' };

function describe(e) {
  if (e.type === 'scan') return `${e.meta.itemName}${e.meta.contaminationFound ? ', problem caught' : ''}`;
  if (e.type === 'quiz') return `Weekly quiz, ${e.meta.correct} of ${e.meta.total} right`;
  if (e.type === 'batch') return `Household batch, ${e.meta.totalItems} items`;
  if (e.type === 'bincheck') return e.meta.verdict === 'ready' ? `Bin passed, ${e.meta.streak}-week streak` : 'Bin needed fixing';
  return e.type;
}

function Stat({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <p className="font-heading text-4xl font-bold text-brand-700">{value}</p>
      <p className="text-sm font-semibold text-ash">{label}</p>
    </div>
  );
}

export default function Me() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    refresh().then(setData);
  }, [refresh]);

  if (!data) return <p className="text-ash">Loading...</p>;
  const { stats, level, badges, recent } = data;
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card bg-brand-50 p-6">
        <p className="font-heading text-lg font-semibold text-brand-800">Level {level.number}</p>
        <h1 className="text-4xl">{level.name}</h1>
        <p className="mt-1">{user.displayName}</p>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.round(level.progress * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold">
          {level.next ? `${level.next.pointsToGo} points to ${level.next.name}` : 'Top level reached!'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Season points" value={stats.competitionPoints} />
        <Stat label="Rank" value={stats.rank ? `#${stats.rank}` : '-'} />
        <Stat label="Day streak" value={stats.dayStreak} />
        <Stat label="Bin streak" value={stats.binStreak} />
      </div>

      <section className="card p-5">
        <h2 className="text-2xl">Badges <span className="text-ash">{earned}/{badges.length}</span></h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((b) => (
            <li key={b.id} className={`rounded-2xl p-3 ${b.earned ? 'bg-brand-400' : 'border-2 border-dashed border-brand-100 text-ash'}`}>
              <p className="font-heading font-semibold">{b.name}</p>
              <p className="text-xs">{b.how}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-2xl">Recent</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-ash">
            Nothing yet. <Link to="/scan" className="font-semibold text-brand-700 underline">Scan your first item</Link>.
          </p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-brand-50">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="pill w-20 bg-brand-100 text-center text-brand-800">{TYPE_LABEL[e.type]}</span>
                <span className="flex-1">{describe(e)}</span>
                <span className="font-heading font-semibold">+{e.points}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className="btn-secondary w-full"
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        Log out
      </button>
    </div>
  );
}
