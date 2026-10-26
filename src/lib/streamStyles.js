// Solid signage colors per stream. Full class names are listed so Tailwind
// keeps them in the build.
const STYLES = {
  bin: { solid: 'bg-bin text-white', text: 'text-bin', border: 'border-bin' },
  kraft: { solid: 'bg-kraft text-ink', text: 'text-ink', border: 'border-kraft' },
  ink: { solid: 'bg-ink text-white', text: 'text-ink', border: 'border-ink' },
  hazard: { solid: 'bg-hazard text-ink', text: 'text-ink', border: 'border-hazard' },
  stop: { solid: 'bg-stop text-white', text: 'text-stop', border: 'border-stop' },
  plum: { solid: 'bg-plum text-white', text: 'text-plum', border: 'border-plum' },
  rust: { solid: 'bg-rust text-white', text: 'text-rust', border: 'border-rust' },
  leaf: { solid: 'bg-leaf text-white', text: 'text-leaf', border: 'border-leaf' },
  ash: { solid: 'bg-ash text-white', text: 'text-ash', border: 'border-ash' },
};

export function streamStyle(stream) {
  return STYLES[stream?.color] || STYLES.ink;
}
