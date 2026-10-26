import { SHADY_GROVE, getStream } from '../../shared/rules.js';
import { streamStyle } from '../lib/streamStyles.js';

export function WarningCard({ title = 'Not in the blue bin!', children }) {
  return (
    <div role="alert" className="overflow-hidden rounded-3xl border-2 border-ink bg-white">
      <div className="stripe h-3" />
      <div className="p-4">
        <p className="font-heading text-xl font-semibold">{title}</p>
        <p className="mt-1">{children}</p>
      </div>
    </div>
  );
}

function BinBlock({ stream, eyebrow }) {
  return (
    <div className={`flex-1 p-5 ${streamStyle(stream).solid}`}>
      <p className="text-sm font-bold uppercase tracking-wide opacity-80">{eyebrow}</p>
      <p className="font-heading text-4xl font-bold leading-none">{stream.label}</p>
    </div>
  );
}

export default function VerdictCard({ verdict }) {
  if (!verdict) return null;
  const { item, stream, alternateStream, alert, steps, reminder, split } = verdict;
  const toShadyGrove = stream.id.startsWith('SHADY_GROVE');

  return (
    <div className="space-y-4">
      {alert && <WarningCard>{alert}</WarningCard>}

      <div className="card overflow-hidden">
        <p className="px-5 pt-4 font-heading text-lg font-semibold">{item.name}</p>
        <div className="mt-3 flex flex-col sm:flex-row">
          {split ? (
            <>
              <BinBlock stream={stream} eyebrow="Clean part" />
              <BinBlock stream={getStream('TRASH')} eyebrow="Greasy part" />
            </>
          ) : (
            <BinBlock stream={stream} eyebrow="Goes in" />
          )}
        </div>
        <ol className="space-y-2 p-5">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading font-semibold text-brand-800">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        {(reminder || alternateStream) && (
          <div className="space-y-1 border-t-2 border-brand-50 px-5 py-3 text-sm">
            {reminder && <p className="font-semibold text-bin">{reminder}</p>}
            {alternateStream && <p>Can't do that? {alternateStream.label} works too.</p>}
          </div>
        )}
      </div>

      {toShadyGrove && (
        <div className="card p-5">
          <p className="font-heading text-lg font-semibold">Where: {SHADY_GROVE.name}</p>
          <p className="text-sm">{SHADY_GROVE.address}</p>
          <a className="btn-secondary mt-3 !py-1.5 !text-base" href={SHADY_GROVE.mapsUrl} target="_blank" rel="noreferrer">
            Get directions
          </a>
        </div>
      )}
    </div>
  );
}
