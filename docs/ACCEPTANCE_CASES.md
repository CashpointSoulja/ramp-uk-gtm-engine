# Acceptance cases

Cases AC-01 to AC-25. Each case is an automated test in `test/acceptance.test.ts`, and each test name starts with its ID. Run them with `npm test`.

| ID | Given | Then |
|---|---|---|
| AC-01 | The synthetic book with default levers | The plan is identical on every run. The top 5 are Orbital Ledger, Northbank Analytics, Larkspur Health, Quillstone AI and Sparrowhawk Labs |
| AC-02 | Vantage Freight EU (no UK entity, 20% GBP) and Ivybridge Capital Partners (40% GBP) | Both are `Blocked`, with no play and no owner, and each gives a specific reason |
| AC-03 | Kestrel Mobility opted out on 2026-09-21 | `Suppressed`: no play, draft, sequence or owner |
| AC-04 | An opt-out is recorded for Saltmarsh Outdoor (week 1, SDR) | Suppressed, removed from week 1, and week-1 expected meetings fall |
| AC-05 | Bramble Pet Co (a partnership with no email consent, self-serve motion) and Marlow Kitchens (a sole trader with consent) | Bramble is suppressed because it has no permitted channel. Marlow keeps its play, and its draft has the opt-out line |
| AC-06 | A sole trader with no consent on an SDR motion | The sequence is call-only, with no email draft and an explanation |
| AC-07 | A Scottish partnership (Harrow & Finch) and an LLP | Treated as corporate subscribers, so email is allowed |
| AC-08 | Parallax Fintech, whose number is on the CTPS | Stays P2, with no call steps and email kept |
| AC-09 | Every generated email draft | Contains the opt-out line |
| AC-10 | A new finance leader is logged today for Greyline Architects | #28 Nurture becomes #11 P2 on *First 90 days* |
| AC-11 | First meetings per AE cut to 1 | The bottleneck becomes *AE meeting capacity* (the default is *Pipeline volume*) |
| AC-12 | AEs cut to 1 | 3 accounts overflow with owner "Overflow", and the bottleneck is *Prospecting capacity* |
| AC-13 | *Welcome back* turned off | No account is on it. Orbital Ledger moves to *Renewal window switch* and Northbank to *AI spend control* |
| AC-14 | Harrow & Finch on Sage 50 | The fit is flagged, and the draft doesn't promise a sync |
| AC-15 | A malformed user account | Rejected, with a specific message for each field |
| AC-17 | "Orbital Ledger Ltd" is added while Orbital Ledger (A12) is owned by AE 1 | `Duplicate` of A12, owned by AE 1: no second owner, week, SLA, sequence or draft. Week 1 is unchanged |
| AC-18 | Records with the same Companies House number, domain or normalised name | Matched in that order of precedence |
| AC-19 | Sparrowhawk Labs is owned by AE 2 in CRM | Keeps AE 2 under every lever setting and is never round-robined |
| AC-20 | A lower-priority duplicate carries an existing owner | That record becomes primary, and the higher-priority copy is the duplicate |
| AC-21 | Two duplicates name different owners | The earliest claim keeps it, and `conflicts[]` flags it for RevOps |
| AC-22 | Duplicates plus owners across several capacity settings | Every company has at most one assigned record and one owner |
| AC-23 | An opt-out is on a duplicate record | Every record of the company is suppressed |
| AC-24 | Default plan | Every assigned account has one owner and an SLA (a P1 in week 1 is due 30 Sep, a P2 1 Oct). Unassigned accounts have no SLA |
| AC-25 | Malformed `companyNumber`, `domain` or `existingOwner` | Rejected with specific messages |
| AC-16 | The assumption register | Meeting rates, opportunity rate, capacity, signal weights, half-life and the timing multiplier are each labelled synthetic or a policy choice |

API and event behaviour is covered in `test/worker.test.ts` (validation, 400s, 404s, `/api/events`, contact rules over the API) and `test/events.test.ts` (every example payload validates, and bad payloads are rejected).
