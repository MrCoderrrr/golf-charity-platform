# Frontend Guide (Vite + React)

## Quick start
- `cd frontend`
- `npm install` (already approved prefix for installs)
- Run dev server: `npm run dev` (Vite at http://localhost:5173 by default)
- Build: `npm run build`; Preview: `npm run preview`
- Env: copy `.env.example` → `.env` and set `VITE_API_URL` (defaults to `http://localhost:5000/api`).

## Folder map & what lives where
- `src/main.jsx` — React root + `<AuthProvider>` wrapper and router mount.
- `src/App.jsx` — Route table with page transitions (Framer Motion). Home route renders `Hero` + `Dashboard` behind auth guard.
- `src/context/AuthContext.jsx` — Local auth state (user, token in localStorage), login/signup helpers, guard logic.
- `src/components/ProtectedRoute.jsx` — Redirects unauthenticated users to `/login`.
- `src/components/Layout.jsx` — Shared chrome: navbar, page padding, background.
- `src/components/Hero.jsx` — Hero headline, greeting, CTA buttons, and embedded `HeroCounters` overlay; uses golf background image `golf-cart-parked-bali-indonesia.jpg`.
- `src/components/HeroCounters.jsx` — Transparent counters over hero image; uses tabular Inter numbers; values are currently static placeholders with subtle animation.
- `src/api/client.js` — Axios instance with `VITE_API_URL` base and bearer token interceptor pulling from `localStorage.user`.
- `src/styles.css` — Global design system: serif/sans typography rules, glass navbar, hero counter styling, eligibility meter styles, buttons, grids.
- `src/pages/` — Route-level screens:
  - `Dashboard.jsx` — Eligibility meter (thick bar + larger labels), recent stats layout.
  - `Scores.jsx` — Score submission/list UI (consumes `/scores` API).
  - `Charities.jsx` — Selected-charity hero card (200px) + other-charities grid with Select buttons; includes top eligibility bar.
  - `Draws.jsx`, `Winnings.jsx`, `Admin.jsx`, `Profile.jsx`, `Pricing.jsx`, `Login.jsx`, `Signup.jsx` — respective flows; most fetch via `api/client`.

## Data/requests
- All HTTP goes through `api/client.js`; add endpoints there or call `api.get/post...` directly.
- Auth token is persisted in `localStorage.user` and attached as `Authorization: Bearer <token>` by the interceptor.

## Visual system (for quick alignment)
- Headings: Cormorant Garamond, tight tracking (-0.03/-0.04em) for luxury editorial tone.
- Functional numbers: Inter, tabular, 0.1em letter spacing (`.functional-number` class).
- Buttons: pill shapes with gold stroke/fill (`btn-ghost` / `btn-solid` in `styles.css`).
- Hero counters: transparent cards so the background image shows through; use class `.counter` family.
- Eligibility bars: `.eligibility-meter` styles control thickness, radius, and label sizing.

## Common tasks
- Add a new page: create component in `src/pages`, add `<Route>` in `App.jsx`, and optionally link from `Navbar` inside `Layout.jsx`.
- Tweak typography/colors: adjust CSS variables and font rules in `src/styles.css` (top of file).
- Change hero stats: edit constants in `src/components/HeroCounters.jsx` (or wire to real API).
- Update navbar links/theme: edit `Layout.jsx` (structure) and `styles.css` (nav styles).

## Testing & linting
- No lint/test scripts defined yet; add as needed (e.g., `npm install -D eslint`).

## Assets
- `src/golf-cart-parked-bali-indonesia.jpg` — hero background.
- `src/nav.png` — navbar logo asset (if used inside `Layout.jsx`).

## Gotchas
- Ensure `VITE_API_URL` ends with `/api` to match backend route prefixes.
- Protected routes require `AuthContext` to have a stored user; login/signup pages are open.
- Framer Motion uses `AnimatePresence` keyed by `location.pathname`; avoid wrapping routes in extra fragments that break keys.
