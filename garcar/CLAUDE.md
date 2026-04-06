# GarKar — Claude Code Rules

## 1. Plan Before You Touch Code
- Before writing or editing anything, state the plan in plain English
- Identify the root cause first — never guess and patch
- If the plan changes mid-execution, stop and replan explicitly
- Complex tasks: write the approach, confirm it makes sense, then execute

## 2. Use Subagents for Hard Problems
- Don't solve everything in one thread — delegate research, exploration, and parallel work to subagents
- Use the Explore agent for codebase searches instead of burning context on manual grepping
- Keep the main context clean: subagents handle investigation, main thread handles decisions and edits

## 3. Self-Improving System — Save Every Mistake
- Every bug found and fixed → save what went wrong and why to memory
- Never repeat the same mistake twice
- Check memory at the start of relevant tasks — prior lessons apply

## 4. If You Didn't Test It, It Doesn't Exist
- After every change, verify it actually works — check logs, network responses, or UI behavior
- No "it should work" — prove it works
- For backend changes: confirm the API returns the right shape
- For frontend changes: trace the full user flow end to end

## 5. Bugs = Immediate Action
- Trace → find root cause → fix the root, not the symptom
- Never apply a workaround when the real fix is available
- Document what caused the bug, not just what changed

## 6. Always Push After Changes
- Every code change gets committed and pushed to `main` immediately
- Vercel autodeploys on push — don't leave fixes sitting locally
- Commit messages explain the *why*, not just the what

---

## Stack & UI Components

- **Framework:** Next.js App Router
- **UI library:** shadcn/ui + **shadcnblocks** (premium account)
- **Component priority:** shadcnblocks first → shadcn/ui second → custom last
- Always check shadcnblocks for a matching block before building a component from scratch
- Default to **Server Components** — only add `'use client'` when strictly necessary (event handlers, hooks, browser APIs)

---

## Project Context

### Monorepo Structure
```
garcar-monorepo/
├── garcar/                  # Next.js frontend (Vercel)
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # Shared UI
│       └── lib/             # api.ts, auth.ts
└── car-rental-backend/      # Express backend (Vercel serverless)
    ├── server.js            # Main entry — routes + auth + middleware
    ├── models/              # Mongoose models
    └── routes/              # admin.js, car.js, booking.js, etc.
```

### Critical: Next.js Middleware
- The middleware file is **`src/proxy.ts`** — NOT `middleware.ts`
- Next.js 16 uses `proxy.ts` directly. Never create a `middleware.ts` — it causes a build error.

### Auth Flow
- Login returns a JWT → stored in **both** `localStorage` AND a `garkar_token` cookie
- `proxy.ts` reads the cookie server-side to protect routes
- `saveAuth()` in `lib/auth.ts` sets both — never skip the cookie
- JWT payload: `{ userId, isVerified, role }`
- `isVerified && approved` in DB = full access; `isVerified: false` = restricted to browse/dashboard

### User Approval Flow
- New users register with `approved: false`, `isVerified: false`
- User uploads residency document → stored in `verificationData`
- Admin reviews at `/admin/settings` → approves → sets `approved: true, isVerified: true`
- Until approved, user sees dashboard with pending banner and locked car listings
- Login is NOT blocked for unapproved users — they just have limited JWT access

### Key Gotchas Learned
- `router.push()` in Next.js 16 App Router can fail silently — use `window.location.href` for post-auth redirects
- Controlled React inputs (`value={}`) fight browser autofill — use `FormData(e.currentTarget)` to read form values reliably
- Rate limiter is in-memory — resets on redeploy; don't retry the same credentials in a loop during testing
- `/browse` and `/dashboard` are AUTH routes (login required, unverified OK); `/my-trips`, `/host`, `/messages` etc. are VERIFIED routes (full approval required)
