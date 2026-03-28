# Backend Guide (Express + MongoDB)

## Quick start
- `cd backend`
- `npm install`
- Dev server with reload: `npm run dev` (nodemon on `index.js`)
- Prod: `npm start`
- Requires a running MongoDB and the env vars below.

### Environment variables (example `.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/golf_charity
JWT_SECRET=replace-me
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_yyy
SUBSCRIPTION_AMOUNT_MONTHLY=10   # numeric amount used for prize pool math
SUBSCRIPTION_AMOUNT_YEARLY=100   # numeric amount used for prize pool math
FRONTEND_URL=http://localhost:5173
```
`index.js` will exit early if `MONGO_URI` is missing.

## Request surface (mounted in `src/app.js`)
- `/api/auth` → `routes/auth.routes.js` (signup, login, make-admin)
- `/api/user` → `routes/user.routes.js` (profile, admin actions)
- `/api/scores` → `routes/score.routes.js` (submit & list scores; drives eligibility)
- `/api/charities` → `routes/charity.routes.js` (list, select charity, donations)
- `/api/draws` → `routes/draw.routes.js` (raffle/draw endpoints)
- `/api/subscriptions` → `routes/subscription.routes.js` (Stripe checkout + cancel)
- `/api/winners` → `routes/winner.routes.js` (winner listings)
All routes use JSON body parsing and CORS is enabled globally.

## Folder map & responsibilities
- `index.js` — Entry point; loads env, connects Mongo, starts server.
- `src/app.js` — Express app wiring; all route mounts live here.
- `src/config/` — `db.js` (Mongoose connector), `cloudinary.js` (Cloudinary v2 setup).
- `src/controllers/` — Request handlers per domain (auth/charity/score/draw/subscription/user/winner).
- `src/models/` — Mongoose schemas: `user`, `score`, `charity`, `donation`, `draw`, `prizePool`, `subscription`, `transaction`, `winner`. `user` includes password hashing + `comparePassword` helper.
- `src/routes/` — Express routers mapping HTTP verbs to controllers; attach `auth.middleware` where needed.
- `src/middleware/` — `auth.middleware.js` (JWT verify, attaches `req.user`), `upload.middleware.js` (multer for media uploads).
- `src/services/` — `billing.js` (Stripe checkout/cancel helpers using price IDs), `api.js` (shared outbound API helper if needed).
- `src/utils/` — `ApiError`, `ApiResponse`, `cloudinary` helpers.
- `src/constants.js` — placeholder for shared constants (currently empty).
- `src/app/*` — Legacy Next.js-like pages that are not used by the Express server; safe to ignore or delete once frontend is fully Vite-based.

## Data flow highlights
- Auth: JWT issued in `controllers/auth.controller` with `JWT_SECRET`; token expected as `Authorization: Bearer <token>` (frontend interceptor handles this).
- Scores/eligibility: `score.controller` drives the "eligibility meter" used in the Vite frontend (`/api/scores`).
- Subscriptions: `services/billing.js` requires Stripe secret + price IDs and `FRONTEND_URL` for success/cancel redirect URLs.
- File uploads: `upload.middleware` wired where routes need media; Cloudinary config pulls from env.
- Jackpot math: prize pool now sums each active subscription's amount minus the user's chosen donation percentage (`charityPercentage`), using `SUBSCRIPTION_AMOUNT_MONTHLY/YEARLY` defaults if Stripe amounts aren't provided; rollover carries when the jackpot isn't won.

## Common maintenance tasks
- Add a route: create controller fn → add to router in `src/routes` → mount in `src/app.js`.
- Add a model field: update schema in `src/models/<model>.model.js`; review controllers that read/write it.
- Change CORS policy: adjust `app.use(cors())` in `src/app.js`.
- Update logging/error format: wrap handlers with a custom error middleware (not present yet) or extend `ApiError/ApiResponse` utilities.

## Running checks
- No automated tests configured (`npm test` is a placeholder). Add Jest or Vitest as needed.

## Integration points with frontend
- Frontend expects base URL `/api` (matching mounts above) and bearer auth.
- Eligibility and charity selection UIs call `/api/scores` and `/api/charities`; keep response shapes stable when modifying.
