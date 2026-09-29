# Assumptions and open questions

## Sourced from Ramp's public pages (checked 29 Sep 2026)
| Claim used | Source |
|---|---|
| Ramp went live in the UK on 15 Sep 2026. Fyxer came back and closed its books four days faster (about 40%) in its first month back | https://ramp.com/blog/uk-launch |
| Transactions sync to supported accounting systems with VAT and memos included. Receipts can be sent over WhatsApp | https://ramp.com/blog/uk-launch |
| For UK-headquartered businesses running mainly in GBP. Xero and QuickBooks Online are the strongest integrations. NetSuite, Sage Intacct and Business Central are supported | https://ramp.com/en-gb |
| Up to 85% of transaction reviews automated. Books closed up to 3x faster. Attio and Multiverse quotes | https://ramp.com/en-gb |
| ElevenLabs runs bill pay, corporate cards and AI token spend management on Ramp | https://www.prnewswire.com/news-releases/ramp-launches-in-the-uk-302878539.html |

## Assumptions (starting points to test, not benchmarks)
- **GBP threshold of 50%.** The public wording is "primarily in GBP". The exact cutoff is a policy decision.
- **Signal weights and half-life (45 days).** These are set by judgement. With real data, fit them to meeting outcomes, for example with logistic regression on signal age.
- **Play meeting rates (12–40%)** and the **55% meeting-to-opportunity** rate are placeholders to replace with real UK launch data after about 4–6 weeks.
- **Capacity defaults** (2 SDRs × 5 new accounts a week, 2 AEs × 2 self-sourced accounts, 3 first meetings per AE a week, 2 accountant intros) represent a small, deliberately constrained launch pod so the trade-offs are visible.
- **Motion thresholds.** 200+ staff or £200k+ a month goes to an AE. Fewer than 30 staff and under £15k a month goes to self-serve.
- **Pipeline** uses annualised card and bill spend as the basis, not Ramp revenue. Revenue would need take-rate and SaaS pricing assumptions.

## Open questions for a real rollout
1. Is AI token spend management generally available in the UK, or only to design partners?
2. Which UK accountancy partners exist today, and what is their capacity for joint setups?
3. How are US Ramp customers with UK entities flagged in CRM, and who owns them: the US account team or UK AEs?
4. Sage 50 has a large UK SMB base. Is there a supported export route, and how should reps position it?
5. Where do signals come from in production (CRM, enrichment vendor, web intent, Companies House filings, job boards), and how fresh are they?

## Out of scope for this slice
CRM sync, real enrichment, user accounts, saved plans and multi-region routing.
