import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { BRAND_DISCLAIMER } from '../../shared/brand.js';
import { COUNTY_INFO_URL } from '../../shared/rules.js';

const TABS = [
  { to: '/scan', label: 'Scan' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/bin-night', label: 'Bin night' },
  { to: '/leaderboard', label: 'Ranks' },
  { to: '/me', label: 'Me' },
];

export default function Layout() {
  const { user, stats } = useAuth();

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b-2 border-brand-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2.5">
          <Link to="/" aria-label="MocoBin home" className="shrink-0">
            <img src="/logo.png" alt="MocoBin" className="h-9 w-auto sm:h-10" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-1.5 font-heading font-semibold ${isActive ? 'bg-brand-100 text-brand-800' : 'text-ink/70 hover:text-ink'}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            {user ? (
              <Link to="/me" className="pill bg-brand-400 text-ink">{stats ? `${stats.competitionPoints} pts` : user.displayName}</Link>
            ) : (
              <Link to="/register" className="btn-primary !px-4 !py-1.5 !text-base">Join</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-ash">
        <p className="font-semibold">{BRAND_DISCLAIMER}</p>
        <p className="mt-1">
          Rules from{' '}
          <a className="underline" href={COUNTY_INFO_URL} target="_blank" rel="noreferrer">montgomerycountymd.gov/sws</a>.{' '}
          Photos stay on your phone.
        </p>
      </footer>

      {/* Phone tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-brand-100 bg-white md:hidden">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `py-3 text-center font-heading text-sm font-semibold ${isActive ? 'bg-brand-100 text-brand-800' : 'text-ink/60'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
