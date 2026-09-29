# Ramp UK GTM Engine

An independent concept by Ayo Ahmed. **Not affiliated with, endorsed by or built with data from Ramp.** Every account, signal and number in the demo is synthetic. Product facts and customer quotes come from Ramp's public UK pages and are linked in the app wherever they are used.

**Live demo:** https://ramp-uk-gtm-engine.ayomideahmedcp.workers.dev

Ramp went live in the UK on 15 September 2026. A new UK go-to-market team has three problems in its first quarter:

1. **Who to work this week?** Firmographics alone produce a static list. What matters is *timing*: a new finance leader, a renewal window, a funding round, or an existing US Ramp relationship.
2. **What to say?** A US playbook doesn't fit a UK buyer. The sync story depends on their ledger (Xero, QuickBooks, NetSuite, Sage Intacct or Business Central), and what you're displacing depends on the tool they use today (Pleo, Soldo, Spendesk, Payhawk, Moss, spreadsheets or Amex).
3. **Can we contact them, and on which channel?** UK PECR rules differ for companies and for sole traders or partnerships, and an opt-out has to stop every lane.
4. **Can the team handle it?** A launch team is small. The plan has to fit the SDR, AE and partner capacity actually available, and show where the bottleneck is.

The engine answers all four in one screen and updates straight away when you change a lever.

## What it does

| View | What you can do |
|---|---|
| **Queue** | See 30 UK accounts ranked by priority. Each has fit and timing broken down, UK eligibility gates, contact rules (legal form, email, LinkedIn and calls allowed or not, and suppression), a chosen play with a cited proof point, alternate plays, a sequence, and a first-touch draft built from the account's own signals. **Log a new signal** on any account and watch it re-rank (for example, Greyline Architects goes from #28 to #11 when a new finance leader is logged). **Record an opt-out** and it is suppressed from every lane at once. Each assigned account shows **one owner and a first-touch SLA**. Duplicates and existing CRM owners are resolved before round-robin. **Score a new account** from a form. |
| **Capacity** | Adjust fit vs timing weight, signal half-life, SDR/AE headcount, accounts per SDR, AE self-sourcing, AE meeting capacity, accountant intros, meeting target and planning horizon. You get week-by-week lane usage, expected meetings against target, AE meeting load, overflow, and the bottleneck with a recommended fix. |
| **Plays** | Nine plays, checked in order. Turn one off and its accounts move to their next-best play, and the plan rebuilds. |
| **Method** | The full scoring method, the signal weights and decay, the assumption register, a live event log, what the tool is and isn't, and the API. |

## How scoring works

- **UK gates.** An account is held if it has no UK entity or less than 50% of its spend in GBP. Ramp's UK site describes the product as for UK-headquartered businesses running mainly in GBP.
- **Contact rules (PECR, simplified; not legal advice).** Checked before any play. An opt-out means the account is suppressed. Sole traders and non-Scottish partnerships need specific consent for marketing email and LinkedIn messages. Companies, LLPs and Scottish partnerships can be emailed. Numbers on the CTPS/TPS aren't called. If no permitted channel is left, the account is suppressed. Every email draft carries an opt-out line.
- **Ownership (before lane assignment).** Records are de-duplicated on Companies House number, then domain, then normalised name. An existing CRM owner always keeps the account. A duplicate never gets a second owner. It is marked `Duplicate` and points to the primary. Conflicting owners go to the earliest claim and are flagged. An opt-out applies to every record of the company. Every assigned account gets one owner and a first-touch SLA (P1 1, P2 2 or P3 3 business days, a policy choice).
- **Fit (0–100).** Size 25%, accounting system 25%, monthly card and bill spend 25% (log scale), current tool 15%, entity count 10%. Xero and QuickBooks score highest because Ramp names them as its strongest UK integrations. NetSuite, Sage Intacct and Business Central are supported. Sage 50 and other ledgers are flagged for checking, and the draft won't promise a sync for them.
- **Timing (0–100).** Each signal has a weight and decays exponentially with a configurable half-life. Web intent decays six times faster. Renewals peak 30–150 days out. Signals combine as `1 − ∏(1 − wᵢ·strengthᵢ)`, so they stack without going over 100.
- **Priority** = `fitWeight × fit + (1 − fitWeight) × timing`. Tiers: P1, P2, P3, Nurture (timing under 15), Suppressed (contact rules), Duplicate (merged into another record) and Blocked (UK gates).
- **Play and motion.** The first strong match wins. Small, simple accounts go to self-serve unless an accountant referred them. Each play maps to an SDR, AE, partner or self-serve lane.
- **Capacity.** Each lane fills in priority order, week by week. Anything left over is shown as overflow. P(meeting) = play base rate × a timing multiplier, capped at 60%. Weighted pipeline = P(meeting) × 55% meeting-to-opportunity × annualised card and bill spend. This is a spend basis, not revenue.

**Synthetic, not benchmarks.** Meeting rates, the timing multiplier, the 55% meeting-to-opportunity rate, the default team capacities, the signal and fit weights, and every account are synthetic assumptions. The GBP cut-off and pipeline basis are policy choices. The full register is in [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md), in the app, and at `/api/meta`.

Everything is deterministic: the same inputs always give the same plan. The browser and the Worker API run the same module (`public/engine.js`).

## API

```
GET  /api/health          -> { ok, engine, accounts, asOf }
GET  /api/meta            -> accounts, signal types, plays, default levers, legal forms, ownership rules, SLA days, assumption register, sources
GET  /api/events          -> event taxonomy, example payloads, metric definitions
POST /api/plan            { levers?, extraAccounts? (≤50) } -> full ranked, capacity-planned book
POST /api/score           { account, levers? } -> one account scored against the book: play, sequence, draft, ownership (duplicate/existing owner) and SLA
```

```bash
curl -s https://ramp-uk-gtm-engine.ayomideahmedcp.workers.dev/api/score \
  -H 'content-type: application/json' \
  -d '{"account":{"name":"Harbourline","employees":120,"monthlySpendGBP":60000,"gbpShare":0.9,
       "accounting":"Xero","incumbent":"Pleo","signals":[{"type":"incumbent_renewal","inDays":60}]}}'
```

Inputs are validated, with bodies up to 64 KB and at most 50 extra accounts and 12 signals per account. Invalid input gets a `400` with a specific message.

## Run locally

```bash
npm ci
npm run dev        # wrangler dev on http://localhost:8787
npm run typecheck
npm test           # engine, acceptance (AC-01…AC-25), event and API tests (Vitest)
```

## Deploy

This is a Cloudflare Worker with static assets (`wrangler.jsonc`, `public/`, `src/worker.ts`). It deploys from git through Cloudflare Workers Builds: branch `main`, no build command, deploy command `npx wrangler deploy`.

## Layout

```
public/data.js     synthetic UK account universe + signal catalogue
public/engine.js   gates, contact rules, fit, timing, plays, drafts, sequences, capacity plan, validation, assumption register
public/events.js   event taxonomy, example payloads, metric definitions, validator
public/app.js      interactive UI (vanilla JS, no framework)
src/worker.ts      Worker API + static asset serving
test/              engine, acceptance, event and API tests
docs/              PRD, five whys, rulebook, event taxonomy, acceptance cases, source ledger, assumptions, demo script, brand sheet
```

## Docs

- [PRD](docs/PRD.md): problem, users, requirements, pilot metrics and rollout
- [Five Whys](docs/FIVE_WHYS.md): why the weekly decision needs to be explicit (a general hypothesis, not a claim about Ramp)
- [Rulebook and scoring rationale](docs/RULEBOOK.md): every gate, contact rule, weight and threshold, and why
- [Event taxonomy](docs/EVENT_TAXONOMY.md): events, example payloads, and metrics with their numerators and denominators
- [Acceptance cases](docs/ACCEPTANCE_CASES.md): AC-01 to AC-25, each an automated test
- [Source ledger](docs/SOURCE_LEDGER.md): every external fact, where it's used, and what is explicitly not claimed
- [Assumptions and open questions](docs/ASSUMPTIONS.md): the synthetic-assumption register and policy choices
- [Demo script](docs/DEMO_SCRIPT.md): a six-minute walkthrough for a UK GTM leader
- [Brand sheet and design template](docs/BRAND_SHEET.md): tokens observed on Ramp's public UK pages, kept separate from the adapted tokens this UI uses. No Ramp logo, wordmark or font files are used

## Notices

"Ramp" and customer names are the property of their owners and are used only to describe the market this concept targets. Customer quotes are reproduced from Ramp's public pages and linked at the point of use. All companies in the account universe are fictional. The contact rules are a simplified reading of ICO guidance for demonstration, not legal advice.
