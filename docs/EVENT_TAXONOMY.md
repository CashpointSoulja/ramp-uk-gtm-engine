# Event taxonomy

Source of truth: `public/events.js`, also served at `GET /api/events`. The tests validate every example below.

Envelope: `{ "event": string, "v": 1, "ts": ISO-8601, "props": {…} }`. Props must match the listed types exactly, and unknown props are rejected.

## Engine events (emitted by the demo UI; see the Method tab's event log)
| Event | When | Props |
|---|---|---|
| `plan_generated` | Every re-plan | `trigger`, `accounts`, `actionable`, `suppressed`, `blocked`, `overflow`, `expectedMeetingsW1`, `targetMeetings`, `bottleneck` |
| `account_opened` | Detail view opened | `accountId`, `rank`, `tier`, `playId` (nullable) |
| `signal_logged` | Rep logs a signal | `accountId`, `signalType`, `ageDays`, `rankBefore`, `rankAfter`, `tierBefore`, `tierAfter`, `playAfter` (nullable) |
| `opt_out_recorded` | Rep records an objection | `accountId`, `tierBefore`, `hadWeek` |
| `duplicate_detected` | An added record matches an existing company | `accountId`, `duplicateOf`, `matchedOn`, `owner` (nullable) |
| `lever_changed` | Lever moved | `lever`, `from`, `to` |
| `play_toggled` | Play switched on or off | `playId`, `enabled`, `accountsOnPlay` |
| `draft_copied` | Draft copied | `accountId`, `playId` |
| `account_added` | A user account passes validation | `accountId`, `priority`, `tier`, `playId` (nullable) |

## Downstream events (would come from CRM or the sequencer; not emitted by the demo)
| Event | Props |
|---|---|
| `touch_sent` | `accountId`, `playId`, `lane`, `owner`, `channel`, `day`, `week`, `firstTouchBy` (nullable) |
| `meeting_booked` | `accountId`, `playId`, `lane`, `week`, `predictedPMeeting` |
| `opportunity_created` | `accountId`, `playId`, `annualSpendGBP` |

## Example payloads
```json
{"event":"plan_generated","v":1,"ts":"2026-09-29T09:00:00.000Z","props":{"trigger":"load","accounts":30,"actionable":18,"suppressed":2,"blocked":2,"overflow":0,"expectedMeetingsW1":3.6,"targetMeetings":5,"bottleneck":"Pipeline volume: the target needs more accounts or stronger signals"}}
{"event":"account_opened","v":1,"ts":"2026-09-29T09:00:05.000Z","props":{"accountId":"A12","rank":1,"tier":"P1","playId":"welcome_back"}}
{"event":"signal_logged","v":1,"ts":"2026-09-29T09:01:00.000Z","props":{"accountId":"A21","signalType":"finance_leader_hired","ageDays":0,"rankBefore":28,"rankAfter":11,"tierBefore":"Nurture","tierAfter":"P2","playAfter":"new_finance_leader"}}
{"event":"opt_out_recorded","v":1,"ts":"2026-09-29T09:02:00.000Z","props":{"accountId":"A10","tierBefore":"P2","hadWeek":true}}
{"event":"duplicate_detected","v":1,"ts":"2026-09-29T09:02:30.000Z","props":{"accountId":"U2","duplicateOf":"A12","matchedOn":"normalised name","owner":"AE 1"}}
{"event":"lever_changed","v":1,"ts":"2026-09-29T09:03:00.000Z","props":{"lever":"aes","from":2,"to":1}}
{"event":"play_toggled","v":1,"ts":"2026-09-29T09:04:00.000Z","props":{"playId":"welcome_back","enabled":false,"accountsOnPlay":0}}
{"event":"draft_copied","v":1,"ts":"2026-09-29T09:05:00.000Z","props":{"accountId":"A12","playId":"welcome_back"}}
{"event":"account_added","v":1,"ts":"2026-09-29T09:06:00.000Z","props":{"accountId":"U1","priority":58,"tier":"P2","playId":"renewal_displacement"}}
{"event":"touch_sent","v":1,"ts":"2026-09-30T08:30:00.000Z","props":{"accountId":"A01","playId":"renewal_displacement","lane":"sdr","owner":"SDR 1","channel":"Email","day":0,"week":1,"firstTouchBy":"2026-09-30"}}
{"event":"meeting_booked","v":1,"ts":"2026-10-03T14:10:00.000Z","props":{"accountId":"A01","playId":"renewal_displacement","lane":"sdr","week":1,"predictedPMeeting":0.246}}
{"event":"opportunity_created","v":1,"ts":"2026-10-10T11:00:00.000Z","props":{"accountId":"A01","playId":"renewal_displacement","annualSpendGBP":744000}}
```

## Metrics
No rate should be quoted without its denominator.
| Metric | Numerator | Denominator | Grain | Replaces or guards |
|---|---|---|---|---|
| First-meeting rate | accounts with ≥1 `meeting_booked` within 21 days of first touch | accounts with ≥1 `touch_sent` in the cohort week | play × lane × cohort week | Synthetic base meeting rate |
| Calibration gap | Σ meetings − Σ `predictedPMeeting` | Σ `predictedPMeeting` of touched accounts | play × week | Timing multiplier |
| Meeting → opportunity | accounts with `opportunity_created` ≤30 days after a meeting | accounts with ≥1 `meeting_booked` | play × month | Synthetic 55% |
| Lane utilisation | accounts assigned to the lane | lane capacity that week | lane × week | Capacity defaults |
| Overflow rate | actionable accounts with no week | actionable accounts (P1–P3, passed gates, not suppressed) | plan | Headcount |
| Suppression rate | Suppressed accounts | accounts that pass the UK gates | plan | Guardrail |
| Opt-out rate | `opt_out_recorded` | accounts with ≥1 Email or LinkedIn `touch_sent` | play × month | Guardrail: pause the play |
| First-touch SLA attainment | assigned accounts whose first `touch_sent` is on or before `firstTouchBy` | accounts assigned a week and owner (excludes duplicates, suppressed, blocked and nurture) | owner × tier × week | SLA policy and capacity levers |
| Duplicate rate | records marked duplicate | all records in the plan | plan | Data-quality guardrail |
| Second-owner incidents | companies with `touch_sent` from more than one owner in 30 days | companies with ≥1 `touch_sent` in 30 days | month | Must be 0 |
| Signal lift | first-meeting rate of touched accounts with signal X | first-meeting rate of touched accounts without X | signal × quarter | Signal weights |
| Time to first touch | median days from entering P1/P2 to first `touch_sent` | n = accounts entering P1/P2 | lane × week | Half-life |
