# Demo script (6 minutes)

Audience: a UK GTM leader in their first quarter after launch.

## 1. The question (30s)
Open the **Queue**. The header asks: which UK accounts to work this week, with which play, and whether the team can handle it. The four KPIs answer at a glance: accounts worked in week 1 (15 of 30), expected meetings against target (3.6 of 5), weighted pipeline, and the bottleneck. Say early on that the rates and capacities are synthetic assumptions. The Method tab has the register.

## 2. Why the top account is on top (60s)
Click **Orbital Ledger** (#1).
- **Priority 73** = 45% fit + 55% timing. Both bars are visible.
- **Why now:** the VP Finance ran Ramp at a previous US employer, and the Spendesk renewal is in 95 days.
- **Fit:** 320 staff, NetSuite (supported ERP), about £240k a month in spend, three entities.
- **Play:** Welcome back, AE-led, with the Fyxer quote linked to the launch post. Renewal switch is the fallback.
- **Draft:** this is the *person* variant ("You ran Ramp at your last company"). Northbank Analytics (#2) gets the *entity* variant because its US subsidiary already runs on Ramp.

## 3. Gates stop wasted effort (30s)
Filter to **Blocked**. Vantage Freight EU fits well (84) but has no UK entity and only 20% of its spend in GBP. Ivybridge Capital Partners has only 40% in GBP. Neither gets a play or an owner.

## 4. Contact rules come before plays (45s)
- Filter to **Suppressed**. **Kestrel Mobility** opted out on 21 Sep, so it gets no play, draft or owner. **Bramble Pet Co** is a partnership with no email consent on a self-serve motion. It has no permitted channel, so it is suppressed.
- Open **Parallax Fintech** (#6). Its number is on the CTPS, so the call step has gone but it stays P2 on email.
- Open **Marlow Kitchens**. It's a sole trader, but email consent is recorded, so it keeps its self-serve play.
- Open **Saltmarsh Outdoor** (#7, week 1) and click **Record opt-out**. It is suppressed immediately, leaves week 1, and expected meetings fall.

## 5. One account, one owner (30s)
- Open **Sparrowhawk Labs** (#5). AE 2 already owns it in CRM, so the engine keeps it with AE 2 rather than round-robining it. First touch is due Wed 30 Sep.
- Click **+ Score a new account** and add "Orbital Ledger Ltd". It's flagged as a **Duplicate** of A12, stays with AE 1, and gets no second owner, week or draft.

## 6. A signal changes the plan (45s)
Filter to **Nurture** and open **Greyline Architects** (#28, timing 0). Log a **New finance leader** from today. It jumps to about #11, moves to P2 and picks up the *First 90 days* play with a new draft. This is what should happen when enrichment finds a new CFO.

## 7. Capacity is the real constraint (90s)
Open **Capacity**.
- By default, AE and partner lanes are full in week 1 (red), and work spills into week 2.
- The bottleneck says pipeline volume: 3.6 expected meetings against a target of 5.
- Drop **AEs** to 1: three AE-led accounts overflow, and the bottleneck switches to *Prospecting capacity*.
- Reset, then cut **first meetings per AE** to 1: AEs can't take the expected meetings, and it switches to *AE meeting capacity*.
- Shorten the **half-life** to 15 days: stale signals lose weight, and Parallax Fintech (renewal-driven) moves into the top five.

## 8. Play strategy (30s)
Open **Plays** and turn off **Welcome back**. Orbital Ledger falls back to *Renewal window switch*, while Northbank and Sparrowhawk move to *AI spend control*. The plan rebuilds. This makes it easy to test "what if we don't lead with X in the UK?"

## 9. Close (15s)
**Method** shows the full scoring method, the assumption register, a live event log of what you just did, and the API. The same engine runs behind `POST /api/plan`, so it could sit behind CRM enrichment and not just this UI.
