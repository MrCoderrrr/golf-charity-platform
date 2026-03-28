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
`index.js` exits early if `MONGO_URI` is missing.

## Request surface (mounted in `backend/src/app.js`)
- `/api/auth` -> `backend/src/routes/auth.routes.js` (signup, login)
- `/api/user` -> `backend/src/routes/user.routes.js` (profile + admin user ops)
- `/api/scores` -> `backend/src/routes/score.routes.js` (submit & list scores; drives eligibility)
- `/api/charities` -> `backend/src/routes/charity.routes.js` (list + admin create)
- `/api/draws` -> `backend/src/routes/draw.routes.js` (list + legacy admin run)
- `/api/subscriptions` -> `backend/src/routes/subscription.routes.js` (manual create + Stripe checkout/cancel)
- `/api/winners` -> `backend/src/routes/winner.routes.js` (winnings + proof workflow)
- `/api/admin` -> `backend/src/routes/admin.routes.js` (analytics + run draw)

## Models
- Canonical schema spec: `backend/MODELS.md`
- Migrations/backfills: `npm run backfill` (see `backend/scripts/backfill.js`)

## Folder map & responsibilities
- `backend/index.js` - Entry point; loads env, connects Mongo, starts server.
- `backend/src/app.js` - Express app wiring; all route mounts live here.
- `backend/src/config/` - `db.js` (Mongoose connector), `cloudinary.js` (Cloudinary v2 setup).
- `backend/src/controllers/` - Request handlers per domain (auth/charity/score/draw/subscription/user/winner/admin).
- `backend/src/models/` - Mongoose schemas.
- `backend/src/routes/` - Express routers mapping HTTP verbs to controllers; attach `auth.middleware` where needed.
- `backend/src/middleware/` - `auth.middleware.js` (JWT verify), `upload.middleware.js` (multer for media uploads).
- `backend/src/services/` - `billing.js` (Stripe checkout/cancel helpers).
- `backend/src/utils/` - small utilities.

## Data flow highlights
- Auth: JWT issued in `backend/src/controllers/auth.controller.js` with `JWT_SECRET`; token expected as `Authorization: Bearer <token>`.
- Scores/eligibility: `/api/scores` returns the last 5 scores within the last 30 days (no destructive deletes). Use `/api/scores?meta=1` to also return eligibility meta.
- Banned users: login and all protected endpoints block `User.banned`.
- Charity selection + donation share:
  - `PUT /api/user/select-charity`
  - `PUT /api/user/charity-percentage`
  - `GET /api/user/contributions` for canonical contribution totals (from Donation records)
- Draw settlement (admin): `POST /api/admin/draws/run`
  - Finds eligible users (active subscription + 5 scores within 30 days)
  - Creates `DrawEntry` snapshots (audit)
  - Calculates prize pools (40/35/25) and jackpot rollover
  - Creates `Winner`, `Donation`, and ledger `Transaction` records
  - Writes `AuditLog` entry for traceability

## Running checks
- No automated tests configured (`npm test` is a placeholder). Add tests as needed.
