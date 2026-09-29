// Event taxonomy for the GTM engine. The demo emits the "engine" events in the browser; "downstream" events are what a
// production CRM or sequencer would send back so the synthetic rates can be replaced with measured ones.

export const EVENT_VERSION = 1;

/** @typedef {"string" | "number" | "boolean" | "string|null" | "object"} PropType */
/** @typedef {{source: "engine" | "downstream", description: string, props: Record<string, PropType>}} EventSpec */

/** @type {Record<string, EventSpec>} */
export const EVENTS = {
  plan_generated: {
    source: "engine",
    description: "The book was re-scored and capacity-planned (load, lever change, signal, opt-out or play toggle).",
    props: { trigger: "string", accounts: "number", actionable: "number", suppressed: "number", blocked: "number", overflow: "number", expectedMeetingsW1: "number", targetMeetings: "number", bottleneck: "string" },
  },
  account_opened: {
    source: "engine",
    description: "A rep opened an account's detail view.",
    props: { accountId: "string", rank: "number", tier: "string", playId: "string|null" },
  },
  signal_logged: {
    source: "engine",
    description: "A new signal was recorded against an account.",
    props: { accountId: "string", signalType: "string", ageDays: "number", rankBefore: "number", rankAfter: "number", tierBefore: "string", tierAfter: "string", playAfter: "string|null" },
  },
  opt_out_recorded: {
    source: "engine",
    description: "The account objected to marketing. It is suppressed from every lane.",
    props: { accountId: "string", tierBefore: "string", hadWeek: "boolean" },
  },
  lever_changed: {
    source: "engine",
    description: "A scoring or capacity lever moved.",
    props: { lever: "string", from: "number", to: "number" },
  },
  play_toggled: {
    source: "engine",
    description: "A play was switched on or off.",
    props: { playId: "string", enabled: "boolean", accountsOnPlay: "number" },
  },
  draft_copied: {
    source: "engine",
    description: "A rep copied the first-touch draft.",
    props: { accountId: "string", playId: "string" },
  },
  account_added: {
    source: "engine",
    description: "A user-supplied account passed validation and was scored.",
    props: { accountId: "string", priority: "number", tier: "string", playId: "string|null" },
  },
  touch_sent: {
    source: "downstream",
    description: "A sequence step was executed (from the sequencer or CRM).",
    props: { accountId: "string", playId: "string", lane: "string", channel: "string", day: "number", week: "number" },
  },
  meeting_booked: {
    source: "downstream",
    description: "A first meeting was booked.",
    props: { accountId: "string", playId: "string", lane: "string", week: "number", predictedPMeeting: "number" },
  },
  opportunity_created: {
    source: "downstream",
    description: "An opportunity was opened after a first meeting.",
    props: { accountId: "string", playId: "string", annualSpendGBP: "number" },
  },
};

/** Example payloads, one per event. Used in docs/EVENT_TAXONOMY.md and checked by the tests. */
export const EVENT_EXAMPLES = [
  { event: "plan_generated", v: 1, ts: "2026-09-29T09:00:00.000Z", props: { trigger: "load", accounts: 30, actionable: 18, suppressed: 2, blocked: 2, overflow: 0, expectedMeetingsW1: 3.6, targetMeetings: 5, bottleneck: "Pipeline volume: the target needs more accounts or stronger signals" } },
  { event: "account_opened", v: 1, ts: "2026-09-29T09:00:05.000Z", props: { accountId: "A12", rank: 1, tier: "P1", playId: "welcome_back" } },
  { event: "signal_logged", v: 1, ts: "2026-09-29T09:01:00.000Z", props: { accountId: "A21", signalType: "finance_leader_hired", ageDays: 0, rankBefore: 28, rankAfter: 11, tierBefore: "Nurture", tierAfter: "P2", playAfter: "new_finance_leader" } },
  { event: "opt_out_recorded", v: 1, ts: "2026-09-29T09:02:00.000Z", props: { accountId: "A10", tierBefore: "P2", hadWeek: true } },
  { event: "lever_changed", v: 1, ts: "2026-09-29T09:03:00.000Z", props: { lever: "aes", from: 2, to: 1 } },
  { event: "play_toggled", v: 1, ts: "2026-09-29T09:04:00.000Z", props: { playId: "welcome_back", enabled: false, accountsOnPlay: 0 } },
  { event: "draft_copied", v: 1, ts: "2026-09-29T09:05:00.000Z", props: { accountId: "A12", playId: "welcome_back" } },
  { event: "account_added", v: 1, ts: "2026-09-29T09:06:00.000Z", props: { accountId: "U1", priority: 58, tier: "P2", playId: "renewal_displacement" } },
  { event: "touch_sent", v: 1, ts: "2026-09-30T08:30:00.000Z", props: { accountId: "A01", playId: "renewal_displacement", lane: "sdr", channel: "Email", day: 0, week: 1 } },
  { event: "meeting_booked", v: 1, ts: "2026-10-03T14:10:00.000Z", props: { accountId: "A01", playId: "renewal_displacement", lane: "sdr", week: 1, predictedPMeeting: 0.246 } },
  { event: "opportunity_created", v: 1, ts: "2026-10-10T11:00:00.000Z", props: { accountId: "A01", playId: "renewal_displacement", annualSpendGBP: 744000 } },
];

/** Metric definitions. Each names its numerator, denominator and grain so no rate is quoted without its base. */
export const METRICS = [
  { id: "first_meeting_rate", numerator: "accounts with ≥1 meeting_booked within 21 days of first touch", denominator: "accounts with ≥1 touch_sent in the cohort week", grain: "play × lane × cohort week", use: "Replaces the synthetic base meeting rate per play." },
  { id: "calibration_gap", numerator: "Σ meeting_booked − Σ predictedPMeeting", denominator: "Σ predictedPMeeting for touched accounts", grain: "play × cohort week", use: "Shows whether P(meeting) is over- or under-confident." },
  { id: "meeting_to_opp_rate", numerator: "accounts with opportunity_created within 30 days of a meeting", denominator: "accounts with ≥1 meeting_booked", grain: "play × month", use: "Replaces the synthetic 55% meeting-to-opportunity rate." },
  { id: "lane_utilisation", numerator: "accounts assigned to the lane in the week", denominator: "lane capacity for that week", grain: "lane × week", use: "Confirms where the bottleneck really is." },
  { id: "overflow_rate", numerator: "actionable accounts with no week in the horizon", denominator: "actionable accounts (P1–P3, passed gates, not suppressed)", grain: "plan", use: "Headcount planning." },
  { id: "suppression_rate", numerator: "accounts in the Suppressed tier", denominator: "accounts that pass the UK gates", grain: "plan", use: "Compliance guardrail: rising suppression shrinks the workable book." },
  { id: "opt_out_rate", numerator: "opt_out_recorded", denominator: "accounts with ≥1 Email or LinkedIn touch_sent", grain: "play × month", use: "Guardrail: a play with a high opt-out rate is paused." },
  { id: "signal_lift", numerator: "first_meeting_rate of touched accounts with signal type X", denominator: "first_meeting_rate of touched accounts without X", grain: "signal type × quarter", use: "Refits the signal weights." },
  { id: "time_to_first_touch", numerator: "median days from account entering P1/P2 to first touch_sent", denominator: "(median, n = accounts entering P1/P2)", grain: "lane × week", use: "Tests whether timing signals are acted on before they decay." },
];

/** @param {unknown} e */
export function validateEvent(e) {
  /** @type {string[]} */
  const errs = [];
  if (typeof e !== "object" || e === null) return ["event must be an object"];
  const ev = /** @type {Record<string, unknown>} */ (e);
  const spec = typeof ev.event === "string" ? EVENTS[ev.event] : undefined;
  if (!spec) return [`unknown event ${String(ev.event)}`];
  if (ev.v !== EVENT_VERSION) errs.push(`v must be ${EVENT_VERSION}`);
  if (typeof ev.ts !== "string" || Number.isNaN(Date.parse(ev.ts))) errs.push("ts must be an ISO timestamp");
  const props = ev.props;
  if (typeof props !== "object" || props === null) return [...errs, "props must be an object"];
  const p = /** @type {Record<string, unknown>} */ (props);
  for (const [k, type] of Object.entries(spec.props)) {
    const v = p[k];
    const ok = type === "string|null" ? v === null || typeof v === "string" : type === "object" ? typeof v === "object" && v !== null : typeof v === type;
    if (!ok) errs.push(`${ev.event}.${k} must be ${type}`);
  }
  for (const k of Object.keys(p)) if (!(k in spec.props)) errs.push(`${ev.event}.${k} is not in the taxonomy`);
  return errs;
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} props
 * @param {Date} [now]
 */
export function makeEvent(name, props, now = new Date()) {
  const e = { event: name, v: EVENT_VERSION, ts: now.toISOString(), props };
  const errs = validateEvent(e);
  if (errs.length) throw new Error(errs.join("; "));
  return e;
}
