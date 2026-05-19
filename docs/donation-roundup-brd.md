# Business Requirements Document
## Donation Round-Up App ("Sadaqah Round-Up" / Working Title)

**Version:** 0.1 — Draft  
**Date:** 2026-05-19  
**Status:** In Review

---

## 1. Executive Summary

A mobile application that automatically rounds up users' everyday purchases and accumulates the spare change into verified humanitarian donations. Inspired by Acorns' micro-investing model, this app is purpose-built for Muslims who want to give Sadaqah effortlessly — with payouts batched and released every Friday (Jumu'ah), reflecting the Islamic significance of giving on the day of congregational prayer.

The app takes **zero cut from donations**. 100% of every round-up goes to the selected cause.

---

## 2. Problem Statement

- Donating to crisis causes (Syria, Palestine, Sudan, etc.) requires intentional effort and repeated manual action.
- Transaction fees eat into small, frequent donations making micro-giving inefficient.
- Most donation platforms are not designed around Islamic giving rhythms or values.
- Users lack visibility into the real-world impact of their contributions.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Grow user base | Registered users | 5,000 (Phase 1) |
| Maximize donation delivery | % of round-ups reaching cause | 100% |
| Minimize transaction costs | Batched weekly payouts | ≤ 1 transaction/user/week |
| Build trust | Verified partner campaigns | ≥ 5 at launch |
| Retain users | Monthly active user rate | > 60% |

---

## 4. Target Users

**Primary:** Muslim individuals (18–45) in Western countries (US, UK, Canada, Australia) who:
- Make regular digital purchases (debit/credit card, digital wallets)
- Want to give Sadaqah consistently without the friction of manual donations
- Care deeply about transparency and ethics in charitable giving

**Secondary:** Anyone (non-Muslim) who wants to passively donate to verified humanitarian campaigns.

---

## 5. Core Features

### 5.1 Account & Onboarding
- Sign up with email or social login
- During onboarding: select cause(s) and set percentage allocation
- Link bank account or debit/credit card (via Plaid or equivalent)
- Set monthly donation cap (minimum $1, default $10, user-configurable)
- Optional: enable push notifications for weekly donation summaries

### 5.2 Round-Up Engine
- Monitor linked card/bank transactions in near-real-time
- For each purchase, calculate the round-up to the next dollar
  - Example: $5.50 coffee → $0.50 round-up
  - Example: $12.00 exact → $0.00 round-up (no charge on exact amounts)
- Accumulate round-ups in a user's donation wallet throughout the week
- Enforce monthly cap: once the cap is reached, pause round-ups for the remainder of the calendar month
- Carry-forward logic: if weekly total is below a minimum threshold (e.g., $0.50), carry it forward to next week rather than processing a near-zero transaction

### 5.3 Cause Selection & Allocation
- Browse a curated list of verified humanitarian campaigns (see Section 7)
- Select one or multiple causes and assign percentage splits (must sum to 100%)
  - Example: 60% Palestine Relief, 40% Sudan Flood Response
- Change allocations at any time; takes effect the following Friday
- Each cause displays: organization name, verification status, brief description, and a live impact counter

### 5.4 Friday Payout (Jumu'ah Batch)
- Every Friday, accumulated donations are batched and disbursed to partner organizations
- Single weekly transaction per user (minimizes payment processor fees)
- User receives a push notification + in-app summary: "Your Sadaqah this Jumu'ah: $X.XX sent to [Cause(s)]"
- Donation confirmation with a reference ID for each payout
- Annual summary generated in January for tax records

### 5.5 Impact Dashboard
- Total donated (all-time, this month, this week)
- Cause-by-cause breakdown
- Real-world impact translation (supplied by partner orgs):
  - "$4.20 → 3 meals provided"
  - "$12.00 → 1 emergency hygiene kit"
- Streak tracker: consecutive Fridays with a donation

### 5.6 Monthly Cap Management
- Users set a hard monthly cap (e.g., $10/month)
- In-app meter showing how much of the cap has been used
- Notification when 80% of cap is reached
- Notification when cap is hit and round-ups are paused
- Cap resets on the 1st of every month

### 5.7 One-Time Emergency Donations *(Phase 2)*
- "Boost" feature: make a one-time manual donation outside the round-up cycle
- Targeted at acute crisis moments (new conflict, natural disaster)
- Still processed on the next Friday to maintain the Jumu'ah payout rhythm, unless the emergency is time-critical

---

## 6. Revenue Model

### Phase 1 — Free (0 → 5,000 users)
- App is completely free
- No percentage taken from donations (ever)
- Funded by founder(s) / early-stage grants / impact investor seed

### Phase 2 — Evaluate at 5,000 Users
- Audit true cost-per-user (infrastructure, payment processing, compliance, support)
- If sustainable: introduce optional **$1/month subscription** for premium features
  - Premium: impact reports, custom cause requests, referral tracking, receipt exports
  - Free tier: core round-up functionality remains free

### What We Will Never Do
- Take a cut of donations
- Sell user data
- Show ads

---

## 7. Cause Partner Requirements

### Inclusion Criteria
- Registered non-profit (501(c)3 in the US or equivalent internationally)
- Active, ongoing humanitarian campaign
- Willing to provide real-world impact data for the dashboard
- Passes sanctions/OFAC screening (see Section 9.3)
- Publicly audited financials

### Launch Cause Categories (Examples)
| Region | Campaign Type | Example Orgs |
|--------|--------------|--------------|
| Palestine | Emergency relief, medical | UNRWA, Islamic Relief |
| Syria | Refugee support, rebuilding | Syria Relief, Hand in Hand |
| Sudan | Flood/conflict response | UNHCR, Mercy Corps |
| General Refugees | UNHCR global | UNHCR USA |

### Cause Management
- Causes can be marked "closed" when a campaign ends (existing allocations redistributed or user prompted to reselect)
- Emergency campaigns can be added outside the normal review cycle with expedited vetting

---

## 8. Technical Requirements

### 8.1 Platform
- iOS and Android (React Native or Flutter — TBD)
- Web dashboard (optional Phase 2)

### 8.2 Bank/Card Connectivity
- Plaid (US) or equivalent for bank account linking and transaction monitoring
- Support for major debit and credit cards
- Digital wallet detection (Apple Pay, Google Pay transactions)

### 8.3 Payment Processing
- Stripe or similar for batching and disbursement
- ACH for US bank-to-bank transfers (low fee)
- Weekly batch job runs Friday mornings (e.g., 6:00 AM UTC)

### 8.4 Data & Privacy
- SOC 2 compliance target
- No storage of full card/bank credentials (handled by Plaid/Stripe)
- GDPR-compliant for EU users
- CCPA-compliant for California users

### 8.5 Notifications
- Push notifications (Firebase FCM / APNs)
- Email digest (weekly donation summary)

---

## 9. Compliance & Risk

### 9.1 Money Transmission
- Depending on jurisdiction, the app may require a **Money Transmitter License (MTL)** or must partner with a licensed money services business (MSB)
- Explore partnership with a licensed intermediary to avoid direct licensing burden at launch

### 9.2 KYC / AML
- Basic identity verification at sign-up (name, email, linked bank — partially handled by Plaid)
- Full KYC (ID verification) may be required above certain transaction thresholds

### 9.3 OFAC / Sanctions Compliance *(Critical)*
- Given the causes involve regions under various international restrictions, this is a high-risk area that banks and payment processors will scrutinize
- All partner organizations must be pre-screened against OFAC SDN list
- Ongoing monitoring of partner status
- Legal counsel required before launch — do not skip this step
- Work with payment processor's compliance team early to get written approval for cause categories

### 9.4 Tax Receipts
- Partner orgs must issue annual tax receipts directly to donors
- App generates a downloadable annual donation summary for users
- If acting as a fiscal sponsor intermediary, separate legal structure may be needed

---

## 10. User Stories

| As a... | I want to... | So that... |
|---------|-------------|------------|
| New user | Link my debit card in under 2 minutes | I can start giving without effort |
| User | Split my round-ups across Syria and Sudan | Both causes get support |
| User | Set a $10/month cap | I never overspend without realizing it |
| User | See a Friday notification | I feel connected to the Jumu'ah giving ritual |
| User | See that my $4.20 funded 3 meals | My giving feels real and impactful |
| User | Pause donations for a month | I have flexibility during tight months |
| Admin | Add or retire a cause | The campaign list stays current and verified |
| Admin | Run weekly batch payouts | Fees stay minimal and timing is consistent |

---

## 11. Out of Scope (Phase 1)

- Zakat calculator or Zakat-specific campaigns (complex Nisab calculation — Phase 2)
- Corporate/employer matching
- Cryptocurrency donations
- International users outside US/UK/CA/AU
- Social sharing / public donation feed
- Recurring fixed-amount donations (round-up only in Phase 1)

---

## 12. Open Questions

- [ ] What legal entity structure protects us best as an intermediary? (Fiscal sponsor model vs. passthrough)
- [ ] Which payment processor will approve our cause list? (Stripe, PayPal Giving Fund, Benevity?)
- [ ] Do we need an MTL or can we use a licensed partner?
- [ ] What is the minimum weekly round-up threshold before we batch a transaction?
- [ ] How do we handle users in multiple time zones for the Friday cutoff?
- [ ] Do partner orgs want to co-market / feature us on their sites?
- [ ] Referral program — should early adopters get any benefit (e.g., app donates $1 to their cause on signup referral)?

---

## 13. Milestones

| Phase | Goal | Target |
|-------|------|--------|
| 0 | BRD finalized, legal consultation | Month 1 |
| 1 | MVP: round-up + 3 causes + Friday batch | Month 4 |
| 2 | Public launch, cause expansion, iOS + Android | Month 6 |
| 3 | 5k users, revenue model evaluation | Month 12 |
| 4 | Premium tier, Zakat features, Phase 2 causes | Month 18 |

---

*This document is a living draft. Update version number and date with each revision.*
