import { useMemo, useState } from 'react';
import { getStream, searchItems } from '../../shared/rules.js';
import StreamBadge from './StreamBadge.jsx';

export default function ItemSearch({ onSelect, placeholder = 'Search: pizza box, battery, chip bag...' }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => (q.trim() ? searchItems(q, 6) : []), [q]);

  return (
    <div className="relative">
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search items" />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border-2 border-brand-100 bg-white">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-50"
                onClick={() => {
                  onSelect(item);
                  setQ('');
                }}
              >
                <span className="font-semibold">{item.name}</span>
                <StreamBadge stream={getStream(item.stream)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
