# MocoBin

MocoBin is a web app that cuts recycling contamination in **Montgomery County by engaging students**.
Young people scan an item with their phone camera or a photo, and MocoBin:

1. **identifies the item** with TensorFlow.js (MobileNet) running entirely in the browser
2. **tells them where it goes** under Montgomery County DEP rules: blue bin, mixed-paper cart, trash, store drop-off,
   or the **Shady Grove Processing Facility and Transfer Station**.

**Bin night** is the weekly habit: the night before pickup, players run a five-point checklist on their recycling bin
(no plastic bags, rinsed containers, no greasy paper, no batteries or electronics, lid closes). A finished checklist
earns points, and checking every week builds a streak.

Players earn points on a seasonal individual leaderboard.

## Features

| Feature | Where |
| --- | --- |
| Item scanning with MobileNet in the browser (photos never leave the device) | `src/pages/Scan.jsx`, `src/lib/vision.js` |
| Grease and residue check with a per-section overlay | `shared/vision/contamination.js` |
| Bin night: pickup day, holiday slides, calendar reminders, checklist, streaks | `shared/pickup.js`, `server/ics.js`, `src/pages/BinNight.jsx` |
| Plastic-bag alert: *“Montgomery County does not accept plastic bags in curbside recycling!…”* | `shared/rules.js` |
| Montgomery County rules engine (~45 items, 11 disposal streams, Shady Grove routing) | `shared/rules.js` |
| Searchable sorting guide | `src/pages/Guide.jsx` |
| Accounts with a display name only (no email, school or age) | `src/pages/Auth.jsx` |
| Points for scans, contamination catches, weekly quizzes and bin night, plus levels, badges and streaks | `shared/points.js`, `server/app.js` |
| Individual leaderboard with prizes and a competition window | `src/pages/Leaderboard.jsx`, `server/competition.js` |

## Tech stack

- **Frontend:** React 18, React Router, Tailwind CSS 3, Vite
- **Vision:** TensorFlow.js and `@tensorflow-models/mobilenet` (lazy-loaded) in the browser, plus a pixel-based
  grease and residue check. No photo is ever uploaded.
- **Backend:** Node.js and Express. Passwords are hashed with scrypt and logins use HMAC-signed tokens (no extra crypto dependencies).
- **Database:** PostgreSQL when `DATABASE_URL` is set. Otherwise a JSON file store is used, so there is zero setup for local development.

MocoBin is an independent youth project and is not run by Montgomery County Government.

## Design

Built for middle and high school students: one column, big buttons, and a bottom tab bar on phones
(Scan, Quiz, Bin night, Ranks, Me).

- **Brand:** `public/logo.png` (wide logo, header and home page) and `public/favicon.png` (tab and home-screen icon).
  Greens come from the logo; the darker `brand-700` green is used for text and buttons so it stays readable.
  Headings use Fredoka and body text uses Nunito. Colors live in `tailwind.config.js`, shared styles in `src/index.css`.
- **Bin colors** (blue bin, kraft paper, black trash, red Shady Grove) are kept only where they tell you which bin.
- **Progress** (`shared/progress.js`): six levels from Rookie Sorter to Bin Boss, a daily scan streak, and ten badges
  such as Bag Buster and Grease Detective, all computed from logged points.

The app name lives in `shared/brand.js`.

## Getting started

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
SESSION_SECRET=$(openssl rand -hex 32) DATABASE_URL=postgres://… npm start   # serves the API and the built site on :3001
```

The database schema is created automatically on startup. See `.env.example` for all settings, including the competition window.

The webcam needs a secure context, which means `https://` or `localhost`. The MobileNet weights (about 14 MB) download
once from TensorFlow Hub and are cached by the browser. If they cannot load, people can still pick the item by name,
and the contamination check still runs on their photo.

## Tests

```bash
npm test                                             # rules engine, vision heuristics, full API (JSON store)
TEST_DATABASE_URL=postgres://… npm test              # also runs the API suite against PostgreSQL
```

## Anti-farming and youth safety

- Daily caps: 60 scan points per rolling 24 hours. One quiz attempt per week. Requests are serialized
  per user so parallel requests cannot get around the caps.
- Quiz answers stay on the server and are scored there.
- No email, phone number or full name is collected. Players choose a display name, and the app suggests a first name
  and last initial.

## Disclaimer

Sorting guidance follows Montgomery County DEP's published recycling rules, but rules change. Always confirm edge cases
at [montgomerycountymd.gov/sws](https://www.montgomerycountymd.gov/sws/).
