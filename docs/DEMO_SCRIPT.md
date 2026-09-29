# Demo script (5 minutes)

Audience: a UK GTM leader in their first quarter after launch.

## 1. The question (30s)
Open the **Queue**. The header asks: which UK accounts to work this week, with which play, and whether the team can handle it. The four KPIs answer at a glance: accounts worked in week 1, expected meetings against target, weighted pipeline, and the bottleneck.

## 2. Why the top account is on top (60s)
Click **Orbital Ledger** (#1).
- **Priority 73** = 45% fit + 55% timing. Both bars are visible.
- **Why now:** the VP Finance ran Ramp at a previous US employer, and the Spendesk renewal is in 95 days.
- **Fit:** 320 staff, NetSuite (supported ERP), about £240k a month in spend, three entities.
- **Play:** Welcome back, AE-led, with the Fyxer quote linked to the launch post. Renewal switch is the fallback.
- **Draft:** this is the *person* variant ("You ran Ramp at your last company"). Northbank Analytics (#2) gets the *entity* variant because its US subsidiary already runs on Ramp.

## 3. Gates stop wasted effort (30s)
Filter to **Blocked**. Vantage Freight EU fits well (84) but has no UK entity and only 20% of its spend in GBP. Ivybridge Capital Partners has only 40% in GBP. Neither gets a play or an owner.

## 4. A signal changes the plan (45s)
Filter to **Nurture** and open **Greyline Architects** (#28, timing 0). Log a **New finance leader** from today. It jumps to about #11, moves to P2 and picks up the *First 90 days* play with a new draft. This is what should happen when enrichment finds a new CFO.

## 5. Capacity is the real constraint (90s)
Open **Capacity**.
- By default, AE and partner lanes are full in week 1 (red), and work spills into week 2.
- The bottleneck says pipeline volume: 3.7 expected meetings against a target of 5.
- Drop **AEs** to 1: three AE-led accounts overflow and the bottleneck switches to *AE meeting capacity*.
- Reset, then cut **first meetings per AE** to 1: AEs can't take the expected meetings, which gives the same bottleneck for a different reason.
- Shorten the **half-life** to 15 days: stale signals lose weight, and Parallax Fintech (renewal-driven) moves into the top five.

## 6. Play strategy (30s)
Open **Plays** and turn off **Welcome back**. Orbital Ledger falls back to *Renewal window switch*, while Northbank and Sparrowhawk move to *AI spend control*. The plan rebuilds. This makes it easy to test "what if we don't lead with X in the UK?"

## 7. Close (15s)
**Method** shows the full scoring method and the API. The same engine runs behind `POST /api/plan`, so it could sit behind CRM enrichment and not just this UI.
