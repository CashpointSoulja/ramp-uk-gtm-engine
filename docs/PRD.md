# PRD: Ramp UK GTM Engine (independent concept)

Author: Ayo Ahmed. Status: working concept, synthetic data. Not affiliated with Ramp.

## 1. Context
Ramp announced its UK launch on 15 September 2026 ([launch post](https://ramp.com/blog/uk-launch)). This concept looks at a question every new-market launch team faces in its first weeks: **which accounts to work this week, with which play, through which channel, and whether the team has the capacity**. It says nothing about how Ramp's own team works or what tools it already has. It is one person's view of how that weekly decision could be made explicit and testable.

## 2. Problem
Getting a weekly target-account list wrong costs the most in a launch market:
- **Eligibility.** Ramp's UK site describes the product as for UK-headquartered businesses that run mainly in GBP ([ramp.com/en-gb](https://ramp.com/en-gb)). Ineligible accounts waste scarce first meetings.
- **Timing.** Fit alone produces a static list. Buying windows such as renewals, new finance leaders, funding rounds and existing US Ramp relationships decay.
- **Contactability.** UK PECR rules differ by recipient type, and opt-outs must be respected across every lane ([ICO](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/)).
- **Capacity.** A launch pod is small. A plan that ignores SDR, AE and partner capacity hides where the bottleneck is.

## 3. Users and jobs
| User | Job to be done |
|---|---|
| UK GTM lead | Decide the week's focus and see the bottleneck and the headcount trade-off |
| SDR / AE | Know who to work, why now, which play, which channels are allowed, and what to say |
| Partner manager | See which accounts go via the client's accountant |
| RevOps / GTM engineering | Own the rules and weights, and replace synthetic assumptions with measured rates |

## 4. Goals and non-goals
Goals (this slice):
1. Rank a UK book by explainable fit and timing, with every point traceable.
2. Enforce UK eligibility gates and PECR-style contact rules before any play is chosen.
3. Choose a play, a motion lane and a permitted-channel sequence, and draft a first touch.
4. Fit the plan to weekly capacity and name the bottleneck.
5. Make every non-sourced number visible as a synthetic assumption, and define the events and metrics that would replace it.

Non-goals: CRM sync, real enrichment, sending messages, user accounts, saved plans, legal advice, and revenue forecasting.

## 5. Functional requirements
| ID | Requirement | Where |
|---|---|---|
| FR-1 | UK gates: hold accounts with no UK entity or with under 50% of spend in GBP (a policy choice) | `gates()` |
| FR-2 | Contact rules: an opt-out suppresses the account; individual subscribers (sole traders, non-Scottish partnerships) need email consent; CTPS/TPS numbers are not called; no permitted channel means the account is suppressed | `contactRules()`, `permittedSteps()` |
| FR-3 | Fit score of 0–100 from size, ledger, spend, current tool and entity count | `fit()` |
| FR-4 | Timing score of 0–100 from weighted, decaying signals | `timing()` |
| FR-5 | Priority, tiers (P1, P2, P3, Nurture, Suppressed, Blocked) | `scoreAccount()` |
| FR-6 | Nine ordered plays, with fallbacks when a play is turned off | `choosePlay()` |
| FR-7 | Motion lane: SDR, AE, partner or self-serve | `motion()` |
| FR-8 | Sequence filtered to permitted channels, and an email draft only where email is allowed, always with an opt-out line | `sequence()`, `draft()` |
| FR-9 | Weekly capacity fill, overflow, expected meetings, AE load, bottleneck | `plan()` |
| FR-10 | User-supplied accounts validated, with specific errors | `validateAccount()` |
| FR-11 | API: `/api/health`, `/api/meta`, `/api/events`, `POST /api/plan`, `POST /api/score` | `src/worker.ts` |
| FR-12 | UI events emitted in the documented taxonomy shape | `public/events.js` |

## 6. Success metrics (for a real pilot)
Defined with numerators and denominators in [EVENT_TAXONOMY.md](EVENT_TAXONOMY.md#metrics). The primary metric is **first-meeting rate per play**. Guardrails are **opt-out rate** and **suppression rate**. Diagnostics are **calibration gap**, **lane utilisation** and **time to first touch**. There are no targets yet: the current rates are synthetic ([ASSUMPTIONS.md](ASSUMPTIONS.md)).

## 7. Rollout (if piloted)
1. Shadow mode for 2 weeks: generate the plan and compare it with what reps actually worked. Send nothing.
2. Assisted mode: reps use the queue and drafts, and downstream events are captured.
3. Recalibrate: replace meeting rates and signal weights with observed values, and review suppression and opt-out guardrails.

Kill criteria: an opt-out rate above the agreed guardrail on any play, or no lift in first-meeting rate against the rep-chosen control after 6 weeks.

## 8. Risks
- Synthetic rates presented as benchmarks. Mitigated by labels in the UI, API and docs.
- Contact rules oversimplified. The engine is a guardrail, not legal advice. A privacy review is needed before any real use.
- Signal data quality. Every signal carries a note and an age so reps can check it.
