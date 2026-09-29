# Ramp UK GTM Engine

An independent concept by Ayo Ahmed. **Not affiliated with, endorsed by or built with data from Ramp.** Every account, signal and number in the demo is synthetic. Product facts and customer quotes come from Ramp's public UK pages and are linked in the app wherever they are used.

**Live demo:** https://ramp-uk-gtm-engine.ayomideahmedcp.workers.dev

Ramp went live in the UK on 15 September 2026. A new UK go-to-market team has three problems in its first quarter:

1. **Who to work this week?** Firmographics alone produce a static list. What matters is *timing*: a new finance leader, a renewal window, a funding round, or an existing US Ramp relationship.
2. **What to say?** A US playbook doesn't fit a UK buyer. The sync story depends on their ledger (Xero, QuickBooks, NetSuite, Sage Intacct or Business Central), and what you're displacing depends on the tool they use today (Pleo, Soldo, Spendesk, Payhawk, Moss, spreadsheets or Amex).
3. **Can the team handle it?** A launch team is small. The plan has to fit the SDR, AE and partner capacity actually available, and show where the bottleneck is.

The engine answers all three in one screen and updates straight away when you change a lever.

## What it does

| View | What you can do |
|---|---|
| **Queue** | See 30 UK accounts ranked by priority. Each has fit and timing broken down, UK eligibility gates, a chosen play with a cited proof point, alternate plays, a sequence, and a first-touch draft built from the account's own signals. **Log a new signal** on any account and watch it re-rank (for example, Greyline Architects goes from #28 to #11 when a new finance leader is logged). **Score a new account** from a form. |
| **Capacity** | Adjust fit vs timing weight, signal half-life, SDR/AE headcount, accounts per SDR, AE self-sourcing, AE meeting capacity, accountant intros, meeting target and planning horizon. You get week-by-week lane usage, expected meetings against target, AE meeting load, overflow, and the bottleneck with a recommended fix. |
| **Plays** | Nine plays, checked in order. Turn one off and its accounts move to their next-best play, and the plan rebuilds. |
| **Method** | The full scoring method, the signal weights and decay, what the tool is and isn't, and the API. |

## How scoring works

- **UK gates.** An account is held if it has no UK entity or less than 50% of its spend in GBP. Ramp's UK site describes the product as for UK-headquartered businesses running mainly in GBP.
- **Fit (0–100).** Size 25%, accounting system 25%, monthly card and bill spend 25% (log scale), current tool 15%, entity count 10%. Xero and QuickBooks score highest because Ramp names them as its strongest UK integrations. NetSuite, Sage Intacct and Business Central are supported. Sage 50 and other ledgers are flagged for checking, and the draft won't promise a sync for them.
- **Timing (0–100).** Each signal has a weight and decays exponentially with a configurable half-life. Web intent decays six times faster. Renewals peak 30–150 days out. Signals combine as `1 − ∏(1 − wᵢ·strengthᵢ)`, so they stack without going over 100.
- **Priority** = `fitWeight × fit + (1 − fitWeight) × timing`. Accounts with timing under 15 go to nurture.
- **Play and motion.** The first strong match wins. Small, simple accounts go to self-serve unless an accountant referred them. Each play maps to an SDR, AE, partner or self-serve lane.
- **Capacity.** Each lane fills in priority order, week by week. Anything left over is shown as overflow. P(meeting) = play base rate × a timing multiplier, capped at 60%. Weighted pipeline = P(meeting) × 55% meeting-to-opportunity × annualised card and bill spend. This is a spend basis, not revenue.

Everything is deterministic: the same inputs always give the same plan. The browser and the Worker API run the same module (`public/engine.js`).

## API

```
GET  /api/health          -> { ok, engine, accounts, asOf }
GET  /api/meta            -> accounts, signal types, plays, default levers
POST /api/plan            { levers?, extraAccounts? (≤50) } -> full ranked, capacity-planned book
POST /api/score           { account, levers? } -> one scored account with play, sequence and draft
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
npm test           # 35 unit + API tests (Vitest)
```

## Deploy

This is a Cloudflare Worker with static assets (`wrangler.jsonc`, `public/`, `src/worker.ts`). It deploys from git through Cloudflare Workers Builds: branch `main`, no build command, deploy command `npx wrangler deploy`.

## Layout

```
public/data.js     synthetic UK account universe + signal catalogue
public/engine.js   gates, fit, timing, plays, drafts, sequences, capacity plan, validation
public/app.js      interactive UI (vanilla JS, no framework)
src/worker.ts      Worker API + static asset serving
test/              engine and API tests
docs/              demo script, assumptions and open questions
```

## Docs

- [Demo script](docs/DEMO_SCRIPT.md): a five-minute walkthrough for a UK GTM leader
- [Assumptions and open questions](docs/ASSUMPTIONS.md): what's sourced, what's assumed, and what would need validating with real data

## Notices

"Ramp" and customer names are the property of their owners and are used only to describe the market this concept targets. Customer quotes are reproduced from Ramp's public pages and linked at the point of use. All companies in the account universe are fictional.
