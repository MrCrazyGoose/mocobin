import { streamStyle } from '../lib/streamStyles.js';

export default function StreamBadge({ stream }) {
  if (!stream) return null;
  return <span className={`pill whitespace-nowrap ${streamStyle(stream).solid}`}>{stream.short}</span>;
}
