# Assumptions and open questions

**Rule of thumb: if a number isn't in [SOURCE_LEDGER.md](SOURCE_LEDGER.md), it's a synthetic assumption or a policy choice, not a measured benchmark.** The same register is in the app (Method tab), in the code (`ASSUMPTIONS` in `public/engine.js`), and served at `GET /api/meta`.

## Synthetic assumptions (illustrative, and to be replaced with measured values)
| Assumption | Value in the demo | Replace with |
|---|---|---|
| Base meeting rate per play | Welcome back 40%, Accountant-led 32%, Renewal switch 24%, First 90 days 22%, AI spend 20%, Post-raise 16%, Displacement 13%, Faster close 12%, Self-serve 0% | Observed first-meeting rate per play × lane ([metric](EVENT_TAXONOMY.md#metrics)) |
| Timing multiplier on P(meeting) | × (0.55 + 0.9·timing/100), capped at 60% | Calibration gap by play |
| Meeting → opportunity | 55% | Observed rate by play |
| Team capacity | 2 SDRs × 5 new accounts/wk, 2 AEs × 2 self-sourced accounts/wk, 3 first meetings per AE/wk, 2 accountant intros/wk, target 5 meetings/wk | The real team's capacity. The defaults describe a hypothetical pod, not any real team |
| Rep capacity per person | Round-robin balances accounts across reps, but existing-owner accounts are not counted against a named rep's personal limit | Per-rep capacity from the CRM |
| Signal weights | 14–45 points ([RULEBOOK.md](RULEBOOK.md#4-timing-0100-weights-and-half-life-are-synthetic)) | Signal lift |
| Half-life | 45 days, with web intent at ÷6 | Time to first touch and signal lift by age |
| Fit weights | Size, accounting and spend 25% each, current tool 15%, entities 10% | Win-rate analysis once deals close |
| Motion cut-offs | AE at 200+ staff or £200k+/mo; self-serve under 30 staff and £15k/mo | Segment definitions from sales leadership |
| Tier cut-offs | P1 ≥ 60, P2 ≥ 50, Nurture if timing < 15 | Rep capacity and meeting-rate distribution |
| Account book | 30 fictional companies with invented signals, legal forms and contact flags | CRM and enrichment |

## Policy choices (explicit decisions, not facts)
| Choice | Value |
|---|---|
| GBP threshold | 50% of spend. Ramp's public wording is "primarily in GBP" |
| Pipeline basis | Annualised card and bill spend, not revenue |
| Social DMs follow the email rule | LinkedIn steps are dropped when email isn't permitted |
| No permitted channel means suppressed | The account doesn't take a rep's slot |
| One owner per company | Duplicates are matched on Companies House number, then domain, then normalised name. An existing owner wins, and the earliest claim settles a conflict |
| First-touch SLA | P1 1, P2 2 and P3 3 business days from the start of the assigned week. Bank holidays are not modelled |
| Accountant-led steps are the accountant's own contact | Needs partner-agreement and privacy review |

## Open questions for a real rollout
1. Is AI token spend management generally available in the UK?
2. Which UK accountancy partners exist today, and what joint-setup capacity do they have? How does consent work for accountant-led intros?
3. How are US Ramp customers with UK entities identified, and who owns them?
4. Sage 50 has a large UK SMB base. Is there a supported export route?
5. What is the CRM's ownership source of truth, and how long does a claim last before it lapses?
6. Where do signals, legal form and CTPS status come from in production (CRM, Companies House, enrichment, the TPS/CTPS screening service), and how fresh are they?
7. Privacy review: lawful basis and legitimate-interests assessment for B2B processing of named contacts under UK GDPR, plus retention of suppression records.

## Out of scope for this slice
CRM sync, real enrichment, sending messages, user accounts, saved plans, multi-region routing and legal advice.
