import { useMemo, useState } from 'react';
import { ITEMS, STREAMS, decide, searchItems, getStream } from '../../shared/rules.js';
import StreamBadge from '../components/StreamBadge.jsx';
import VerdictCard from '../components/VerdictCard.jsx';

const FILTERS = ['BLUE_BIN', 'PAPER', 'TRASH', 'STORE_DROPOFF', 'SHADY_GROVE_HHW', 'SHADY_GROVE_ELECTRONICS', 'FOOD_SCRAPS'];

export default function Guide() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  const items = useMemo(() => {
    const list = q.trim() ? searchItems(q, ITEMS.length) : [...ITEMS].sort((a, b) => a.name.localeCompare(b.name));
    return filter ? list.filter((i) => i.stream === filter) : list;
  }, [q, filter]);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-4xl">Every item</h1>
      <input className="input" placeholder="Search an item" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter(null)} className={`pill ${filter ? 'bg-brand-50 text-brand-800' : 'bg-brand-700 text-white'}`}>All</button>
        {FILTERS.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(filter === id ? null : id)}
            className={`pill ${filter === id ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-800'}`}
          >
            {STREAMS[id].short}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-2">
          <VerdictCard verdict={decide(selected)} />
          <button className="text-sm font-semibold text-brand-700 underline" onClick={() => setSelected(null)}>Back to the list</button>
        </div>
      )}

      <ul className="card divide-y-2 divide-brand-50">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => {
                setSelected(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-50"
            >
              <span className="font-semibold">{item.name}</span>
              <StreamBadge stream={getStream(item.stream)} />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="p-4 text-ash">Nothing matches. If you're not sure, it goes in the trash.</li>}
      </ul>
    </div>
  );
}
