# Backend Models (Source of Truth)

This document is the schema/spec reference for the MongoDB models used by the backend.
It is written to be "decision-complete" (what lives where, which fields are canonical vs cached).

## Money + Eligibility Rules

- Currency: INR (stored as integer `Number` in rupees in the current codebase).
- Eligibility: active subscription at draw time AND at least 5 scores within the last 30 days.
- Automatic entry: eligible users are inserted into `DrawEntry` when a draw is run.
- Prize pool tiers: 5-match 40% (jackpot, rolls over if no winner), 4-match 35%, 3-match 25%.

## Model Inventory

### 1) User (`backend/src/models/user.model.js`)
Purpose: account + authorization + user preferences + cached aggregates.

Fields:
- `name: string` (required)
- `email: string` (required, unique, lowercase)
- `password: string` (required, bcrypt hash)
- `role: "user" | "admin"` (default: `"user"`)
- `banned: boolean` (default: `false`)
- `selectedCharity: ObjectId -> Charity` (nullable)
- `charityPercentage: number` (default: `10`, min: `10`, max: `100`)
- `isSubscribed: boolean` (default: `false`) (cache)
- `subscriptionId: ObjectId -> Subscription` (nullable) (cache pointer)
- `totalEarnings: number` (default: `0`) (cache; canonical is Winner/Transaction)
- `wins: { jackpot, fourPass, threePass }` (cache; canonical is Winner)
- timestamps

Indexes:
- `email` unique
- `{ role, banned, createdAt }`

Canonical vs cache:
- Canonical subscription state is `Subscription` documents. `User.isSubscribed/subscriptionId` is a convenience cache.
- Canonical winnings are `Winner` + payout `Transaction`. `User.totalEarnings/wins` are updated during draw settlement.

### 2) Score (`backend/src/models/score.model.js`)
Purpose: immutable score history (eligibility is computed; scores are not deleted).

Fields:
- `userId: ObjectId -> User` (required)
- `score: number` (required, 1..45)
- `date: Date` (required) (canonical stored field)
- `playedAt: Date` (alias of `date` for code readability)
- `source: "manual" | "import"` (default: `"manual"`)
- `status: "submitted" | "void" | "verified"` (default: `"submitted"`)
- timestamps

Indexes:
- `{ userId, date }`
- `{ userId, createdAt }`

### 3) Charity (`backend/src/models/charity.model.js`)
Purpose: charity directory + UI metadata + goal tracking.

Fields:
- `name: string` (required)
- `description: string`
- `icon: string` (glyph / short code; no images required by frontend)
- `goalAmount: number`
- `totalDonations: number` (cache; canonical is Donation)
- (legacy/back-compat) `image: string` (optional)
- timestamps

Indexes:
- text index on `name` and `description` for search

### 4) Subscription (`backend/src/models/subscription.model.js`)
Purpose: billing state + donation snapshot per period.

Fields:
- `userId: ObjectId -> User` (required)
- `planType: "monthly" | "yearly"` (required)
- `status: "active" | "cancelled" | "expired"` (default: `"active"`)
- `startDate: Date` (required)
- `endDate: Date` (required)
- `amount: number` (required) (plan amount at purchase time)
- `donationPercentage: number` (0..100) (snapshot)
- `provider: "stripe" | "manual"` (default: `"stripe"`)
- `stripeSubscriptionId: string` (optional)
- `paymentId: string` (legacy/optional)
- timestamps

Indexes:
- `{ userId, status }`
- `{ createdAt }`

### 5) Draw (`backend/src/models/draw.model.js`)
Purpose: monthly draw record.

Fields:
- `month: number` (1..12)
- `year: number`
- `drawDate: Date` (required)
- `drawNumbers: number[5]` (required when status is `"completed"`)
- `type: "random" | "algorithm"` (default: `"random"`)
- `status: "upcoming" | "completed" | "cancelled"` (default: `"upcoming"`)
- timestamps

Indexes:
- unique `{ year, month }`
- `{ status, drawDate }`

### 6) DrawEntry (`backend/src/models/drawEntry.model.js`) (NEW)
Purpose: participation + eligibility snapshot (audit-safe).

Fields:
- `drawId: ObjectId -> Draw` (required)
- `userId: ObjectId -> User` (required)
- `subscriptionId: ObjectId -> Subscription` (required)
- `selectedCharityId: ObjectId -> Charity` (nullable; snapshot)
- `donationPercentage: number` (required; snapshot)
- `scoresSnapshot: { score: number, playedAt: Date }[]` (size up to 5; snapshot)
- `eligibleAt: Date` (required)
- timestamps

Indexes:
- unique `{ drawId, userId }`
- `{ userId, createdAt }`

### 7) PrizePool (`backend/src/models/prizePool.model.js`)
Purpose: draw bookkeeping including rollover.

Fields:
- `drawId: ObjectId -> Draw` (required)
- `totalAmount: number` (required)
- `tierPercent: { five, four, three }` (defaults to 40/35/25)
- `fiveMatchPool: number`
- `fourMatchPool: number`
- `threeMatchPool: number`
- `rolloverFromDrawId: ObjectId -> Draw` (nullable)
- `rolloverAmount: number` (default: 0)
- timestamps

Indexes:
- unique `{ drawId }`

### 8) Winner (`backend/src/models/winner.model.js`)
Purpose: winner record + proof workflow.

Fields:
- `userId: ObjectId -> User` (required)
- `drawId: ObjectId -> Draw` (required)
- `matchCount: 3 | 4 | 5` (required)
- `tier: "grand_legacy" | "prestige" | "impact"` (derived)
- `prizeAmount: number` (required)
- `status: "pending" | "paid"` (default: `"pending"`)
- `proofImage: string` (optional)
- `verified: boolean` (default: false)
- `verifiedAt: Date` (optional)
- `paidAt: Date` (optional)
- timestamps

Indexes:
- unique `{ drawId, userId }`
- `{ drawId, matchCount }`
- `{ userId, createdAt }`
- `{ status, createdAt }`

### 9) Donation (`backend/src/models/donation.model.js`)
Purpose: per-user donation accounting (canonical "your contribution" data).

Fields:
- `userId: ObjectId -> User` (required)
- `charityId: ObjectId -> Charity` (required; if none selected, uses system fallback charity)
- `subscriptionId: ObjectId -> Subscription` (required)
- `drawId: ObjectId -> Draw` (nullable)
- `monthKey: string` (`YYYY-MM`, required)
- `amount: number` (required)
- `percentage: number` (required, 10..100)
- `status: "pending" | "sent"` (default: `"pending"`)
- timestamps

Indexes:
- `{ userId, monthKey }`
- `{ charityId, monthKey }`
- `{ drawId, createdAt }`

### 10) Transaction (`backend/src/models/transaction.model.js`)
Purpose: canonical money ledger entries (subscription, donation, payout).

Fields:
- `userId: ObjectId -> User` (required)
- `type: "subscription" | "donation" | "payout"` (required)
- `amount: number` (required)
- `currency: string` (default: `"INR"`)
- `status: "pending" | "completed" | "failed"` (default: `"pending"`)
- `provider: "stripe" | "manual"` (default: `"stripe"`)
- `providerId: string` (optional)
- `ref: { subscriptionId?, donationId?, winnerId?, drawId? }`
- timestamps

Indexes:
- `providerId`
- `{ userId, createdAt }`

### 11) AuditLog (`backend/src/models/auditLog.model.js`) (NEW)
Purpose: admin traceability for sensitive operations.

Fields:
- `actorUserId: ObjectId -> User`
- `action: string`
- `entityType: string`
- `entityId: ObjectId`
- `meta: mixed`
- `ip: string`
- `userAgent: string`
- timestamps

Indexes:
- `{ entityType, entityId, createdAt }`

## Feature-to-Model Mapping (Persistence)

- Auth: `User`
- Score submission + eligibility: `Score` (eligibility is computed from Score + Subscription)
- Charity directory/selection: `Charity`, `User.selectedCharity`
- Donation share preference: `User.charityPercentage` (snapshot to `Subscription.donationPercentage` and `DrawEntry.donationPercentage`)
- Draw participation + disputes: `Draw`, `DrawEntry`, `PrizePool`
- Winners + proof workflow: `Winner`, payout `Transaction`, `AuditLog`
- Money ledger: `Transaction` (canonical), `Donation` (canonical for contributions)

## Operational Scripts

- Backfill/migrations: `npm run backfill` (adds missing Winner.tier, Charity.icon defaults, and creates the fallback charity).

