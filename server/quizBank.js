// Weekly Zero-Waste Quiz. Answers stay on the server; the client only ever
// receives the question text and choices.

import { createHash } from 'node:crypto';

export const QUESTIONS = [
  {
    id: 'q-bags',
    question: 'Where should a plastic grocery bag go in Montgomery County?',
    choices: ['Blue bin', 'Mixed-paper cart', 'Grocery store drop-off or trash', 'Yard trim'],
    answer: 2,
    explanation: 'Plastic bags jam sorting machines. The county does not take them curbside. Use a store drop-off or the trash.',
  },
  {
    id: 'q-bagged-recyclables',
    question: 'Is it OK to put your recyclables into the blue bin inside a plastic bag?',
    choices: ['Yes, it keeps things tidy', 'No, recyclables must be loose', 'Only if the bag is clear', 'Only on windy days'],
    answer: 1,
    explanation: 'Bagged recyclables are often treated as trash at the sorting facility. Always empty them loose.',
  },
  {
    id: 'q-pizza',
    question: 'You have a pizza box with a greasy bottom and a clean lid. What do you do?',
    choices: ['Whole box in the trash', 'Whole box in the paper cart', 'Tear off the greasy part for trash; recycle the clean lid', 'Put it in the blue bin'],
    answer: 2,
    explanation: 'Grease ruins paper recycling, but the clean cardboard is still valuable. Split it!',
  },
  {
    id: 'q-rinse',
    question: 'What three things must a container be before it goes in the blue bin?',
    choices: ['Crushed, labeled, capped', 'Empty, rinsed, clean', 'Bagged, sorted, dry', 'Flattened, taped, stacked'],
    answer: 1,
    explanation: 'Empty, rinsed and clean. Food residue contaminates the load.',
  },
  {
    id: 'q-car-battery',
    question: 'Where does Montgomery County want you to take an old car battery?',
    choices: ['Blue bin', 'Trash', 'Shady Grove Processing Facility and Transfer Station', 'Leave it at the curb'],
    answer: 2,
    explanation: 'Car batteries are hazardous and are accepted at the Shady Grove facility in Derwood.',
  },
  {
    id: 'q-batteries-fire',
    question: 'Why should AA and lithium batteries never go in the blue bin?',
    choices: ['They are too small', 'They can spark fires in trucks and facilities', 'They are worth money', 'They are made of paper'],
    answer: 1,
    explanation: 'Crushed batteries can short-circuit and ignite. Recycling-truck fires are a growing problem.',
  },
  {
    id: 'q-glass',
    question: 'Which glass item belongs in the Montgomery County blue bin?',
    choices: ['A broken drinking glass', 'A rinsed pasta-sauce jar', 'A window pane', 'A ceramic mug'],
    answer: 1,
    explanation: 'Only glass bottles and jars. Drinking glasses, window glass and ceramics melt differently and contaminate the glass.',
  },
  {
    id: 'q-cartons',
    question: 'Where do milk and juice cartons go?',
    choices: ['Mixed-paper cart', 'Blue bin with containers', 'Trash', 'Yard trim'],
    answer: 1,
    explanation: 'Cartons are sorted with commingled containers in the blue bin.',
  },
  {
    id: 'q-wishcycling',
    question: 'What is "wish-recycling"?',
    choices: [
      'Recycling on your birthday',
      'Putting items in the recycling bin hoping they are recyclable',
      'Donating old toys',
      'Composting food scraps',
    ],
    answer: 1,
    explanation: 'Wish-recycling drives up contamination. If you are not sure, look it up first. If you still are not sure, it goes in the trash.',
  },
  {
    id: 'q-foam',
    question: 'Where does a foam (polystyrene) takeout cup go?',
    choices: ['Blue bin', 'Mixed-paper cart', 'Trash', 'Shady Grove hazardous waste'],
    answer: 2,
    explanation: 'Foam is not accepted in the blue bin.',
  },
  {
    id: 'q-electronics',
    question: 'Your old phone stopped working. What is the best option?',
    choices: ['Trash', 'Blue bin', 'Electronics recycling at Shady Grove', 'Bury it in the yard'],
    answer: 2,
    explanation: 'Phones contain lithium batteries and valuable metals. Recycle them as electronics.',
  },
  {
    id: 'q-yard-trim',
    question: 'How should you set out leaves for county yard trim collection?',
    choices: ['In plastic trash bags', 'In paper yard bags or open reusable containers', 'Loose in the street', 'In the blue bin'],
    answer: 1,
    explanation: 'Plastic bags contaminate yard trim compost. Use paper bags or reusable containers.',
  },
  {
    id: 'q-hose',
    question: 'Why are garden hoses and string lights called "tanglers"?',
    choices: [
      'They are hard to store',
      'They wrap around sorting equipment and shut it down',
      'They are made of tangle-free plastic',
      'They come from the Tangle company',
    ],
    answer: 1,
    explanation: 'Tanglers force workers to stop the line and cut material off the machines.',
  },
  {
    id: 'q-shredded',
    question: 'How should shredded paper be recycled?',
    choices: ['Loose in the paper cart', 'In a closed paper bag in the paper cart', 'In a plastic bag in the blue bin', 'It cannot be recycled'],
    answer: 1,
    explanation: 'A closed paper bag keeps shreds from blowing around while still being recyclable.',
  },
  {
    id: 'q-paper-towel',
    question: 'Used paper towels and napkins go in…',
    choices: ['Mixed-paper cart', 'Blue bin', 'Trash or food scraps / compost', 'Shady Grove'],
    answer: 2,
    explanation: 'Used paper towels are contaminated with food or germs and the fibers are too short to recycle.',
  },
  {
    id: 'q-aerosol',
    question: 'A completely empty aerosol can of whipped cream goes…',
    choices: ['In the blue bin, without puncturing it', 'In the trash only', 'Puncture it first, then blue bin', 'Hazardous waste only'],
    answer: 0,
    explanation: 'Fully empty aerosol cans are accepted with metal cans. Never puncture them.',
  },
  {
    id: 'q-chip-bag',
    question: 'Why can\'t chip bags be recycled curbside?',
    choices: ['They are too greasy', 'They are made of layered plastic and foil', 'They are too light', 'They are already recycled'],
    answer: 1,
    explanation: 'Multi-layer packaging cannot be separated at the recycling facility.',
  },
  {
    id: 'q-cfl',
    question: 'Compact fluorescent (CFL) bulbs contain…',
    choices: ['Lead', 'Mercury', 'Helium', 'Nothing hazardous'],
    answer: 1,
    explanation: 'CFLs contain a small amount of mercury, so they go to household hazardous waste.',
  },
  {
    id: 'q-contamination',
    question: 'What can happen when a recycling load is too contaminated?',
    choices: ['It gets recycled anyway', 'It may be rejected and sent to disposal', 'It is sent back to your house', 'Nothing'],
    answer: 1,
    explanation: 'Heavily contaminated loads can be rejected, wasting everyone\'s good recycling.',
  },
  {
    id: 'q-reduce',
    question: 'Which is the MOST effective zero-waste habit?',
    choices: ['Recycling more', 'Reducing and reusing first', 'Buying more bins', 'Throwing everything away'],
    answer: 1,
    explanation: 'Reduce → Reuse → Recycle. The greenest item is the one you never had to throw away.',
  },
];

// ISO-8601 week key, e.g. "2026-W41".
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Deterministic per-week selection so every student gets the same quiz.
export function questionsForWeek(week, count) {
  const ranked = QUESTIONS.map((q) => ({
    q,
    h: createHash('sha256').update(`${week}:${q.id}`).digest('hex'),
  }));
  ranked.sort((a, b) => (a.h < b.h ? -1 : 1));
  return ranked.slice(0, count).map((r) => r.q);
}

export function publicQuestion(q) {
  return { id: q.id, question: q.question, choices: q.choices };
}
