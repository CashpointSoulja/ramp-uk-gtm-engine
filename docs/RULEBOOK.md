# Rulebook and scoring rationale

Rules run in this order for every account. The code is in `public/engine.js`, and the browser and the API share it.

## 1. UK eligibility gates (hard stop, tier `Blocked`)
| Rule | Rationale | Type |
|---|---|---|
| No UK entity → hold | Ramp's UK site describes the product as for UK-headquartered businesses ([ramp.com/en-gb](https://ramp.com/en-gb)) | Sourced |
| GBP share of spend < 50% → hold | The same page says "primarily in GBP". 50% is our cut-off | Policy choice |

## 2. Contact rules (tier `Suppressed`)
A simplified reading of ICO guidance on PECR, written for a demo. **Not legal advice.**
| Rule | Rationale | Source |
|---|---|---|
| Opted out → suppress across every lane, with no draft and no sequence | Objections must be honoured, and good practice is to keep a do-not-email list | [ICO email marketing](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/) |
| Ltd, PLC, LLP, Scottish partnership and public body → corporate subscriber, so email is allowed | ICO: "You can email or text any corporate body (a company, Scottish partnership, limited liability partnership or government body)" | ICO email marketing |
| Sole trader or other partnership → individual subscriber, so email and social DMs need specific consent | ICO: marketing email to individuals needs specific consent, and "direct messages via social media" count as electronic mail | ICO email marketing, [ICO telephone marketing](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/telephone-marketing/) |
| Number on the CTPS/TPS or our do-not-call list → no call steps | ICO: screen against the TPS and CTPS, and keep a do-not-call list | ICO telephone marketing, [CTPS](https://www.tpsonline.org.uk/ctps/) |
| No permitted touch left for the motion → suppress | Don't give a rep an account they can't lawfully work | Engine rule |
| Every email draft ends with an opt-out line | ICO: provide a valid way to opt out in every message | ICO email marketing |
| Accountant-led steps are sent by the client's own accountant | The accountant contacts its existing client. Whether this is compliant depends on the partner agreement and needs review | Assumption |

## 3. Ownership, applied before any lane is assigned (tier `Duplicate`)
Code: `ownershipKey()` and the pre-pass in `plan()`. The same rules are served at `GET /api/meta` as `ownershipRules` and shown in the Method tab.

| Rule | Reason |
|---|---|
| One company, one owner | Two reps on one company means double outreach and a doubled opt-out risk |
| Match key: Companies House number, then web domain (without scheme, `www.` or path), then normalised name (lower case, punctuation removed, `&` changed to "and", and Ltd/Limited/PLC/LLP/UK/Group/Holdings/The/Co removed) | Duplicates must be caught before round-robin, or each copy picks up an owner |
| The primary record is the one with an existing CRM owner (earliest `since` first, then ID). If no record has an owner, it's the highest-priority record | Existing ownership takes precedence, and the choice is deterministic |
| An existing owner is never replaced by round-robin. The account still uses lane capacity in its week, and if there is none it stays with its owner, unscheduled | Changing an owner needs a human decision |
| Duplicate records get tier `Duplicate`, with no owner, week, sequence, draft or P(meeting), and point to `duplicateOf` and its owner | The work happens once, on the primary |
| Different owners on duplicates → the earliest claim keeps it, and `conflicts[]` flags it for RevOps | Deterministic, and doesn't reward the last edit |
| An opt-out on any record suppresses every record with the same key | An objection applies to the company |

**First-touch SLA (policy choice, not a benchmark).** Every account with a week and owner gets `sla = { owner, tier, weekStart, businessDays, firstTouchBy }`, where `weekStart = as-of date + 7 × (week − 1)`. The business days are P1 1, P2 2 and P3 3, skipping weekends (bank holidays are not modelled). With an as-of date of Tue 29 Sep 2026, a P1 in week 1 is due Wed 30 Sep and a P2 Thu 1 Oct.

## 4. Fit (0–100). All weights are synthetic
| Component | Weight | Scoring |
|---|---|---|
| Employees | 25% | <20: 35 · <50: 60 · <200: 88 · <1000: 100 · 1000+: 72 |
| Accounting system | 25% | Xero or QuickBooks: 100 (named as the strongest UK integrations) · NetSuite, Sage Intacct or Business Central: 90 · Sage 50: 50 plus a flag · other: 35 plus a flag |
| Monthly card and bill spend | 25% | `20 + 32·log10(spend/£5k)`, clamped to 10–100 |
| Current tool | 15% | Spreadsheets, Amex or bank purchase cards: 90 · Revolut Business: 62 · other spend tools: 72 |
| Entities | 10% | `50 + 12·(entities − 1)`, clamped to 50–100 |

## 5. Timing (0–100). Weights and half-life are synthetic
Each signal contributes `weight × strength`. Strength decays as `0.5^(age / half-life)`, with a default half-life of 45 days. Web intent uses half-life ÷ 6, with a floor of 3 days. US-Ramp relationships don't decay. A renewal has strength 1 when it is 30–150 days out, 0.55 when it is under 30 days out, 0.3 when it is further out, and 0 once it has passed. Contributions combine as `100 × (1 − ∏(1 − pointsᵢ/100))`.

| Signal | Weight | Decay |
|---|---|---|
| Ramp in the US already | 45 | none |
| New finance leader | 38 | half-life |
| Incumbent renewal window | 34 | window |
| Accountant referral | 32 | half-life |
| Recent funding round | 30 | half-life |
| High-intent web visit | 26 | fast |
| AI spend growing | 22 | half-life |
| Close pain in job ad | 20 | half-life |
| New entity / acquisition | 18 | half-life |
| Hiring in finance | 16 | half-life |
| Headcount growth | 14 | half-life |

## 6. Priority and tiers
`priority = fitWeight·fit + (1 − fitWeight)·timing`, with a default fitWeight of 0.45. P1 ≥ 60 and P2 ≥ 50; everything else is P3. Timing under 15 means Nurture (except self-serve). The cut-offs are synthetic.

## 7. Plays (checked in order; the first match with strength ≥ 0.7 wins)
| # | Play | Trigger | Assumed base meeting rate |
|---|---|---|---|
| 1 | Welcome back | US Ramp relationship (entity or person) | 40% |
| 2 | Renewal window switch | Spend tool and renewal ≤150 days away | 24% |
| 3 | First 90 days | New finance leader ≤120 days ago, or hiring in finance ≤30 days ago (0.7) | 22% |
| 4 | Accountant-led intro | Accountant referral ≤60 days ago | 32% |
| 5 | AI spend control | AI-native and AI spend growth ≤90 days ago | 20% |
| 6 | Post-raise guardrails | Funding ≤120 days ago, or headcount growth ≤60 days ago (0.6) | 16% |
| 7 | Switch from their current tool | Has a spend tool (0.8) | 13% |
| 8 | Faster month-end close | Close-pain ad or new entity ≤90 days ago, or spreadsheets/Amex (0.6) | 12% |
| 9 | Self-serve sign-up | <30 staff and <£15k/mo | 0% |

Small accounts try partner-led first, then self-serve. **All meeting rates are synthetic placeholders.**

## 8. Motion and capacity
Self-serve → lifecycle email. Accountant-led → partner manager. Welcome back → AE. 200+ staff or £200k+/mo → AE. Otherwise SDR then AE. Lanes fill in priority order, week by week, after the ownership pass. Accounts without an owner are round-robined within their lane. Anything left unassigned is overflow.
`P(meeting) = base rate × (0.55 + 0.9·timing/100)`, capped at 60%. Weighted pipeline = `P(meeting) × 55% × 12 × monthly spend`. All of these numbers are synthetic, and pipeline is on a spend basis, not revenue.

Bottleneck, checked in order: AE meeting load > AE meeting capacity → *AE meeting capacity*; any overflow → *Prospecting capacity*; expected meetings < target → *Pipeline volume*; otherwise *None*.
