# Five Whys

This is a hypothesis about new-market launches in general, written to explain why the concept is built the way it is. It is **not** an observation about Ramp's team, hiring or tooling.

**Problem statement (hypothetical):** in the first weeks of a new-market launch, a small outbound pod books fewer first meetings than its capacity would allow.

1. **Why?** Some of the week's touches go to accounts that were never going to take a meeting now.
2. **Why?** The list was built mostly on fit, such as size and sector, without checking whether a buying window is open, whether the account is eligible for the local product, and whether it can lawfully be contacted on the planned channel.
3. **Why?** Those facts sit in different places. Signals sit in enrichment and web analytics, eligibility in the product's regional rules, contact status in suppression lists and CTPS screening, and capacity in the manager's head.
4. **Why?** Early in a launch there is no shared, explicit rulebook that combines them into one weekly decision, so each rep combines them differently.
5. **Why?** Without launch-market history, nobody yet knows the right weights. That makes teams reluctant to write rules down, even though written rules are what make them measurable and correctable.

**Root cause:** the weekly "who, why now, how and whether we can handle it" decision isn't explicit, so it can't be measured or improved.

**What the concept does about it:**
| Why | Response in the engine |
|---|---|
| 1–2 | Timing score with decay, UK gates and contact rules, all applied before a play is chosen |
| 3 | One deterministic function combines signals, eligibility, contact rules and capacity |
| 4 | A written rulebook ([RULEBOOK.md](RULEBOOK.md)) and acceptance cases ([ACCEPTANCE_CASES.md](ACCEPTANCE_CASES.md)) |
| 5 | Every weight is labelled as a synthetic assumption, with an event taxonomy ([EVENT_TAXONOMY.md](EVENT_TAXONOMY.md)) that would replace it with measured rates |
