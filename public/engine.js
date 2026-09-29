// Ramp UK GTM Engine: deterministic scoring, play selection, drafting and capacity planning.
// Pure functions shared by the browser UI and the Worker API.

import { AS_OF, SIGNAL_TYPES } from "./data.js";

export const DEFAULT_LEVERS = {
  fitWeight: 0.45,
  halfLifeDays: 45,
  sdrs: 2,
  aes: 2,
  accountsPerSdr: 5,
  aeProspectSlots: 2,
  meetingsPerAe: 3,
  partnerSlots: 2,
  targetMeetings: 5,
  weeks: 2,
  disabledPlays: [],
};

export const LEVER_LIMITS = {
  fitWeight: [0, 1],
  halfLifeDays: [7, 180],
  sdrs: [0, 20],
  aes: [0, 20],
  accountsPerSdr: [1, 60],
  aeProspectSlots: [0, 20],
  meetingsPerAe: [1, 30],
  partnerSlots: [0, 40],
  targetMeetings: [1, 200],
  weeks: [1, 4],
};

const SUPPORTED_ACCOUNTING = ["Xero", "QuickBooks", "NetSuite", "Sage Intacct", "Business Central"];
const NATIVE_SYNC = ["Xero", "QuickBooks"];
const SPEND_TOOLS = ["Pleo", "Soldo", "Spendesk", "Payhawk", "Moss", "Expensify", "Revolut Business"];
const OPP_RATE = 0.55;
const P_MEETING_CAP = 0.6;
const CORPORATE_FORMS = ["Ltd", "PLC", "LLP", "Scottish partnership", "Public body"];
const INDIVIDUAL_FORMS = ["Sole trader", "Partnership"];
export const LEGAL_FORMS = [...CORPORATE_FORMS, ...INDIVIDUAL_FORMS];

const SOURCES = {
  launch: { label: "Ramp UK launch post, 15 Sep 2026", url: "https://ramp.com/blog/uk-launch" },
  ukHome: { label: "ramp.com/en-gb", url: "https://ramp.com/en-gb" },
  cards: { label: "Ramp UK corporate cards FAQ", url: "https://ramp.com/en-gb/corporate-cards" },
  press: { label: "Ramp UK launch press release", url: "https://www.prnewswire.com/news-releases/ramp-launches-in-the-uk-302878539.html" },
  icoEmail: { label: "ICO: electronic mail marketing (PECR)", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/" },
  icoCalls: { label: "ICO: telephone marketing (PECR)", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/telephone-marketing/" },
  ctps: { label: "Corporate Telephone Preference Service", url: "https://www.tpsonline.org.uk/ctps/" },
};
export { SOURCES };

// Every number the engine uses that is not taken from a public source. None of these are measured benchmarks.
export const ASSUMPTIONS = [
  { id: "meeting_rates", value: "12–40% by play (self-serve 0%)", kind: "synthetic", note: "Base P(meeting) per play. Illustrative placeholders; replace with observed first-meeting rates per play after 4–6 weeks of UK outreach." },
  { id: "timing_multiplier", value: "× (0.55 + 0.9 × timing/100), capped at 60%", kind: "synthetic", note: "How much timing lifts the base meeting rate. A modelling choice, not fitted to data." },
  { id: "opp_rate", value: `${Math.round(OPP_RATE * 100)}% meeting → opportunity`, kind: "synthetic", note: "Used only for the weighted pipeline figure. Not a Ramp or industry benchmark." },
  { id: "pipeline_basis", value: "annualised card + bill spend", kind: "policy", note: "Pipeline is shown on a spend basis, not revenue. Revenue would need take-rate and pricing assumptions." },
  { id: "capacity", value: "2 SDRs × 5 accounts, 2 AEs × 2 self-sourced, 3 first meetings per AE, 2 accountant intros per week", kind: "synthetic", note: "A deliberately small, hypothetical launch pod so the trade-offs are visible. Not a description of any real team." },
  { id: "signal_weights", value: "14–45 points per signal type", kind: "synthetic", note: "Judgement-based. Fit to meeting outcomes once real data exists." },
  { id: "half_life", value: "45 days (web intent ÷ 6)", kind: "synthetic", note: "Signal decay. Adjustable in the Capacity view." },
  { id: "fit_weights", value: "size 25%, accounting 25%, spend 25%, tool 15%, entities 10%", kind: "synthetic", note: "Judgement-based fit model." },
  { id: "motion_thresholds", value: "AE at 200+ staff or £200k+/mo; self-serve under 30 staff and £15k/mo", kind: "synthetic", note: "Segment cut-offs to test, not policy." },
  { id: "gbp_threshold", value: "50% of spend in GBP", kind: "policy", note: "Ramp's UK site says 'primarily in GBP'. The exact cut-off is a policy choice." },
  { id: "tiers", value: "P1 ≥ 60, P2 ≥ 50, nurture if timing < 15", kind: "synthetic", note: "Tier cut-offs." },
  { id: "first_touch_sla", value: "P1 1 business day, P2 2, P3 3, from the start of the assigned week", kind: "policy", note: "First-touch SLA per owner. A policy choice to test, not a measured response-time benchmark." },
  { id: "accounts", value: "30 fictional UK companies", kind: "synthetic", note: "Every company, signal, legal form and contact flag in the demo book is invented." },
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round = (n) => Math.round(n);
const signalsOf = (a, type) => a.signals.filter((s) => s.type === type);
const hasRecent = (a, type, days) => signalsOf(a, type).some((s) => (s.daysAgo ?? 0) <= days);
const renewal = (a) => signalsOf(a, "incumbent_renewal")[0];

export function normaliseLevers(input = {}) {
  const out = { ...DEFAULT_LEVERS };
  for (const [key, [lo, hi]] of Object.entries(LEVER_LIMITS)) {
    const v = Number(input[key]);
    if (input[key] !== undefined && Number.isFinite(v)) out[key] = clamp(key === "fitWeight" ? v : Math.round(v), lo, hi);
  }
  if (Array.isArray(input.disabledPlays)) out.disabledPlays = input.disabledPlays.filter((p) => typeof p === "string" && p in PLAYS);
  return out;
}

// ---------- Gates ----------

export function gates(a) {
  const blocks = [];
  if (!a.ukEntity) blocks.push("No UK entity. Ramp UK is for UK-headquartered businesses, so hold this or route it to another region.");
  if (a.gbpShare < 0.5)
    blocks.push(`Only ${round(a.gbpShare * 100)}% of spend is in GBP. Ramp UK is built for businesses that spend mainly in GBP.`);
  return blocks;
}

// ---------- Contact rules (PECR) ----------

/**
 * Which outreach channels are permitted for an account, before any play is chosen.
 * Corporate subscribers (companies, LLPs, Scottish partnerships, public bodies) can be emailed without prior consent,
 * with an opt-out in every message. Sole traders and other partnerships are individual subscribers: email and social
 * DMs need specific consent. Numbers on the TPS/CTPS or our do-not-call list are not called. An opt-out suppresses everything.
 * @param {import("./data.js").Account} a
 */
export function contactRules(a) {
  const c = a.contact ?? {};
  const form = a.legalForm ?? "Ltd";
  const subscriber = INDIVIDUAL_FORMS.includes(form) ? "individual" : "corporate";
  /** @type {string[]} */
  const reasons = [];
  if (c.optedOut) {
    reasons.push(`Opted out of marketing${c.optedOutOn ? ` on ${c.optedOutOn}` : ""}. Suppressed across every lane. Keep them on the suppression list.`);
    return { subscriber, legalForm: form, suppressed: true, email: false, social: false, phone: false, reasons };
  }
  const email = subscriber === "corporate" || c.emailConsent === true;
  if (!email) reasons.push(`${form}: an individual subscriber under PECR, so marketing email and social DMs need specific consent. None is recorded.`);
  else if (subscriber === "individual") reasons.push(`${form} with recorded email consent. Email is allowed.`);
  const phone = !c.ctps && !c.doNotCall;
  if (c.ctps) reasons.push("Number is registered on the CTPS/TPS. No unsolicited marketing calls.");
  if (c.doNotCall) reasons.push("On our do-not-call list. No marketing calls.");
  return { subscriber, legalForm: form, suppressed: false, email, social: email, phone, reasons };
}

const CHANNEL_RULE = { Email: "email", LinkedIn: "social", Call: "phone" };

/** @param {{channel: string}[]} steps @param {ReturnType<typeof contactRules>} rules */
export function permittedSteps(steps, rules) {
  return steps.filter((st) => {
    const key = CHANNEL_RULE[st.channel];
    return !key || rules[key];
  });
}

export const OPT_OUT_LINE = "Not relevant? Reply \"unsubscribe\" and we won't contact you again.";

// ---------- Ownership: duplicates, existing owners, first-touch SLA ----------

export const OWNERSHIP_RULES = [
  { id: "one_owner", rule: "One company, one owner.", reason: "Two reps on one company means double outreach, a worse first impression, and a doubled opt-out risk." },
  { id: "dedupe_first", rule: "Records are matched on Companies House number, then web domain, then normalised name, before any lane is assigned.", reason: "Duplicates must be caught before round-robin, or each copy picks up its own owner." },
  { id: "existing_owner_wins", rule: "An existing CRM owner always keeps the account. The engine never re-assigns it round-robin.", reason: "Ownership is a commitment to a rep and to the customer. Moving it needs a human decision." },
  { id: "earliest_claim", rule: "If duplicate records name different owners, the earliest claim keeps it and the conflict is flagged for RevOps.", reason: "It's deterministic and doesn't reward whoever edited the record last." },
  { id: "duplicate_no_owner", rule: "A duplicate record never gets its own owner, week, sequence or draft. It points to the primary record and its owner.", reason: "The work happens once, on the primary record." },
  { id: "opt_out_company_wide", rule: "An opt-out on any record suppresses every record of that company.", reason: "An objection applies to the company, not to one copy of it in the CRM." },
  { id: "first_touch_sla", rule: "The owner makes first touch within P1 1, P2 2 or P3 3 business days of the start of the assigned week.", reason: "Timing signals decay. The SLA makes 'why now' mean now. The day counts are a policy choice." },
];

export const SLA_BUSINESS_DAYS = { P1: 1, P2: 2, P3: 3 };

const NAME_NOISE = /\b(ltd|limited|plc|llp|lp|uk|group|holdings|the|co|company)\b/g;

/** @param {import("./data.js").Account} a */
export function ownershipKey(a) {
  if (a.companyNumber) return { key: `ch:${a.companyNumber.toUpperCase()}`, via: "Companies House number" };
  if (a.domain) return { key: `web:${a.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")}`, via: "web domain" };
  const n = a.name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").replace(NAME_NOISE, " ").replace(/\s+/g, " ").trim();
  return { key: `name:${n}`, via: "normalised name" };
}

/** @param {string} iso @param {number} days */
function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** @param {string} iso @param {number} n */
export function addBusinessDays(iso, n) {
  let d = iso;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

/** @param {number} week @param {string} tier @param {string} owner */
export function firstTouchSla(week, tier, owner, asOf = AS_OF) {
  const days = SLA_BUSINESS_DAYS[tier] ?? 3;
  const start = addDays(asOf, 7 * (week - 1));
  return { owner, tier, weekStart: start, businessDays: days, firstTouchBy: addBusinessDays(start, days) };
}

// ---------- Fit ----------

export function fit(a) {
  const e = a.employees;
  const size = e < 20 ? 35 : e < 50 ? 60 : e < 200 ? 88 : e < 1000 ? 100 : 72;
  const accounting = NATIVE_SYNC.includes(a.accounting) ? 100 : SUPPORTED_ACCOUNTING.includes(a.accounting) ? 90 : a.accounting === "Sage 50" ? 50 : 35;
  const spend = clamp(20 + 32 * Math.log10(Math.max(a.monthlySpendGBP, 1000) / 5000), 10, 100);
  const incumbent = /Spreadsheets|Amex|Purchase cards/.test(a.incumbent) ? 90 : a.incumbent === "Revolut Business" ? 62 : 72;
  const complexity = clamp(50 + (a.entities - 1) * 12, 50, 100);
  const parts = [
    { key: "size", label: `${e} employees`, score: size, weight: 0.25 },
    { key: "accounting", label: accountingLabel(a.accounting), score: accounting, weight: 0.25 },
    { key: "spend", label: `~£${Math.round(a.monthlySpendGBP / 1000)}k monthly card + bill spend`, score: round(spend), weight: 0.25 },
    { key: "incumbent", label: incumbentLabel(a.incumbent), score: incumbent, weight: 0.15 },
    { key: "complexity", label: `${a.entities} entit${a.entities === 1 ? "y" : "ies"}`, score: complexity, weight: 0.1 },
  ];
  const score = round(parts.reduce((s, p) => s + p.score * p.weight, 0));
  const flags = [];
  if (a.accounting === "Sage 50") flags.push("Sage 50 is not on Ramp's UK integration list (Sage Intacct is). Confirm the export route before promising a sync.");
  if (!SUPPORTED_ACCOUNTING.includes(a.accounting) && a.accounting !== "Sage 50")
    flags.push(`${a.accounting} is not a named Ramp UK integration. Scope it before discovery.`);
  return { score, parts, flags };
}

function accountingLabel(sys) {
  if (NATIVE_SYNC.includes(sys)) return `${sys} (strongest UK sync)`;
  if (SUPPORTED_ACCOUNTING.includes(sys)) return `${sys} (supported ERP)`;
  if (sys === "Sage 50") return "Sage 50 (not on the list)";
  return `${sys} (not a named integration)`;
}

function incumbentLabel(inc) {
  if (SPEND_TOOLS.includes(inc)) return `Replacing ${inc}`;
  return `No spend tool yet: ${inc}`;
}

// ---------- Timing ----------

export function signalStrength(s, halfLifeDays) {
  const meta = SIGNAL_TYPES[s.type];
  if (!meta) return 0;
  if (s.type === "incumbent_renewal") {
    const d = s.inDays ?? 999;
    return d < 0 ? 0 : d < 30 ? 0.55 : d <= 150 ? 1 : 0.3;
  }
  if (!meta.decays) return 1;
  const hl = meta.fast ? Math.max(3, halfLifeDays / 6) : halfLifeDays;
  return Math.pow(0.5, (s.daysAgo ?? 0) / hl);
}

export function timing(a, halfLifeDays) {
  const contributions = a.signals
    .map((s) => {
      const meta = SIGNAL_TYPES[s.type];
      const strength = signalStrength(s, halfLifeDays);
      return { ...s, label: meta ? meta.label : s.type, points: meta ? meta.weight * strength : 0, age: ageText(s) };
    })
    .sort((x, y) => y.points - x.points);
  const remaining = contributions.reduce((r, c) => r * (1 - c.points / 100), 1);
  return { score: round(100 * (1 - remaining)), contributions };
}

export function ageText(s) {
  if (s.type === "us_ramp_alumni") return "standing";
  if (s.inDays !== undefined) return `in ${s.inDays} days`;
  const d = s.daysAgo ?? 0;
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

// ---------- Plays ----------

const hasSpendTool = (a) => SPEND_TOOLS.includes(a.incumbent);

export const PLAYS = {
  welcome_back: {
    name: "Welcome back",
    summary: "They already use Ramp in the US. Now the UK entity can join too.",
    persona: "VP Finance / CFO",
    meetingRate: 0.4,
    proof: { text: "Fyxer: “As soon as we heard Ramp was launching here, we immediately wanted back in.” In its first month back it closed the books four days faster, about 40% quicker.", source: SOURCES.launch },
    match: (a) => (signalsOf(a, "us_ramp_alumni").length ? 1 : 0),
  },
  renewal_displacement: {
    name: "Renewal window switch",
    summary: "Their current contract renews soon. Get there before they sign again.",
    persona: "Head of Finance + Financial Controller",
    meetingRate: 0.24,
    proof: { text: "Attio: “our two-person finance team can support a company of over 200. And we completed the migration in less than a week.”", source: SOURCES.ukHome },
    match: (a) => {
      const r = renewal(a);
      return hasSpendTool(a) && r && r.inDays !== undefined && r.inDays <= 150 ? 1 : 0;
    },
  },
  new_finance_leader: {
    name: "First 90 days",
    summary: "A new finance leader is setting up their stack. Get in before it's decided.",
    persona: "New CFO / Head of Finance",
    meetingRate: 0.22,
    proof: { text: "Ramp says customers close their books up to 3x faster after switching.", source: SOURCES.ukHome },
    match: (a) => (hasRecent(a, "finance_leader_hired", 120) ? 1 : hasRecent(a, "hiring_finance", 30) ? 0.7 : 0),
  },
  partner_led: {
    name: "Accountant-led intro",
    summary: "Their accountant opens the door, with a joint Xero or QuickBooks setup.",
    persona: "Founder / Ops lead, via their accountant",
    meetingRate: 0.32,
    proof: { text: "Transactions sync to supported accounting systems with VAT and memos included.", source: SOURCES.launch },
    match: (a) => (hasRecent(a, "accountant_referral", 60) ? 1 : 0),
  },
  ai_spend: {
    name: "AI spend control",
    summary: "AI-native companies with fast-growing model and tool bills.",
    persona: "Head of Finance + CTO",
    meetingRate: 0.2,
    proof: { text: "ElevenLabs runs bill pay, corporate cards and AI token spend management on Ramp. Its finance team: “it was the only one where the OCR actually worked on a real invoice.”", source: SOURCES.press },
    match: (a) => (a.aiNative && hasRecent(a, "ai_spend_growth", 90) ? 1 : 0),
  },
  post_raise: {
    name: "Post-raise guardrails",
    summary: "Newly funded and hiring fast. Set spend controls before headcount grows.",
    persona: "CFO / COO",
    meetingRate: 0.16,
    proof: { text: "Multiverse: “Ramp helped us replace rigid limits with smarter guardrails.”", source: SOURCES.ukHome },
    match: (a) => (hasRecent(a, "funding_round", 120) ? 1 : hasRecent(a, "headcount_growth", 60) ? 0.6 : 0),
  },
  displacement: {
    name: "Switch from their current tool",
    summary: "Cards, expenses, bills and accounting in one place instead of a single-purpose tool.",
    persona: "Head of Finance",
    meetingRate: 0.13,
    proof: { text: "Attio: “we completed the migration in less than a week.”", source: SOURCES.ukHome },
    match: (a) => (hasSpendTool(a) ? 0.8 : 0),
  },
  close_faster: {
    name: "Faster month-end close",
    summary: "Replace spreadsheets, Amex and paper expense forms with coded, synced transactions.",
    persona: "Financial Controller",
    meetingRate: 0.12,
    proof: { text: "Ramp reports up to 85% of transaction reviews automated, with sync to Xero, QuickBooks, NetSuite and more.", source: SOURCES.ukHome },
    match: (a) =>
      hasRecent(a, "job_post_close_pain", 90) || hasRecent(a, "new_entity", 90) ? 1 : /Spreadsheets|Amex|Purchase cards/.test(a.incumbent) ? 0.6 : 0,
  },
  self_serve: {
    name: "Self-serve sign-up",
    summary: "Small team, simple setup. Send them to sign up online, no call needed.",
    persona: "Founder",
    meetingRate: 0,
    proof: { text: "Receipts can be sent over WhatsApp or the Ramp mobile app, and Ramp matches them to the right transaction.", source: SOURCES.ukHome },
    match: (a) => (a.employees < 30 && a.monthlySpendGBP < 15000 ? 1 : 0),
  },
};

export const PLAY_ORDER = Object.keys(PLAYS);

export function choosePlay(a, disabled = []) {
  const matches = PLAY_ORDER.filter((id) => !disabled.includes(id))
    .map((id) => ({ id, strength: PLAYS[id].match(a) }))
    .filter((m) => m.strength > 0);
  const small = a.employees < 30 && a.monthlySpendGBP < 15000;
  const ordered = small
    ? [...matches.filter((m) => m.id === "partner_led"), ...matches.filter((m) => m.id === "self_serve"), ...matches.filter((m) => !["partner_led", "self_serve"].includes(m.id))]
    : matches.filter((m) => m.id !== "self_serve");
  const primary = ordered.find((m) => m.strength >= 0.7) ?? ordered[0];
  return { primary: primary ? primary.id : null, alternates: ordered.filter((m) => m !== primary).map((m) => m.id) };
}

// ---------- Motion ----------

export function motion(a, playId) {
  if (playId === "self_serve") return { lane: "digital", label: "Self-serve", owner: "Lifecycle email" };
  if (playId === "partner_led") return { lane: "partner", label: "Via their accountant", owner: "Partner manager" };
  if (playId === "welcome_back") return { lane: "ae", label: "AE, direct", owner: "AE" };
  if (a.employees >= 1000) return { lane: "ae", label: "AE-led (enterprise)", owner: "AE" };
  if (a.employees >= 200 || a.monthlySpendGBP >= 200000) return { lane: "ae", label: "AE-led (mid-market)", owner: "AE" };
  return { lane: "sdr", label: "SDR, then AE", owner: "SDR" };
}

// ---------- Draft ----------

export function draft(a, playId, why) {
  const top = why[0];
  const hook = top ? top.note.replace(/\.$/, "") : `${a.name} runs on ${a.accounting}`;
  const inc = SPEND_TOOLS.includes(a.incumbent) ? a.incumbent : null;
  const personAlumni = signalsOf(a, "us_ramp_alumni").some((s) => s.kind === "person");
  const sync = SUPPORTED_ACCOUNTING.includes(a.accounting)
    ? `every card and bill transaction goes into ${a.accounting} already coded, with VAT`
    : `transactions arrive coded and ready for your books (we'd confirm the ${a.accounting} setup first)`;
  const lines = {
    welcome_back: personAlumni
      ? [`Subject: Ramp is live in the UK`, `You ran Ramp at your last company, and it's now live in the UK. At ${a.name} that means GBP cards and approval rules, and ${sync}.`, "Fyxer came back to Ramp when it launched here and closed its books four days faster in its first month back.", "Would it help if I set up a sandbox with your current policies?"]
      : [`Subject: Ramp for ${a.name}'s UK entity`, `Ramp is now live in the UK, so the UK entity can join your US team on it. You'd get GBP cards, the same approval rules, and ${sync}.`, "Fyxer came back to Ramp when it launched here and closed its books four days faster in its first month back.", "Worth 20 minutes to plan the UK rollout?"],
    renewal_displacement: [`Subject: Before the ${inc ?? "renewal"} decision`, `${hook}. Before you renew, it might be worth comparing: Ramp puts cards, expenses, bills and accounting in one place, and ${sync}.`, "Attio moved over in under a week.", "Could we look at a side-by-side before your notice date?"],
    new_finance_leader: [`Subject: Your first 90 days at ${a.name}`, `Congratulations on the new role. ${hook}. If spend and close are on your list, Ramp UK brings cards, bills and receipts together, and ${sync}.`, "I've put together a short list of what new finance leaders at similar-sized UK companies tend to tidy up first. Want me to send it over?"],
    partner_led: [`Subject: Joint setup for ${a.name}`, `${hook}. We can set up GBP cards and receipt capture together with your accountant, so ${sync}.`, "Setup is about 30 minutes, and your accountant can join the call."],
    ai_spend: [`Subject: Keeping ${a.name}'s AI spend under control`, `${hook}. Model and tool bills tend to grow faster than budgets. Ramp lets you give each vendor its own virtual card with a limit, and ${sync}.`, "Open to comparing notes on how other AI-native teams handle this?"],
    post_raise: [`Subject: Spend controls after the raise`, `Congratulations on the round. ${hook}. Now's a good time to set spending limits by team and vendor, before headcount grows.`, `Ramp UK does this with GBP cards and approval rules, and ${sync}.`, "15 minutes this week or next?"],
    displacement: [`Subject: ${inc ?? "Your current tool"}, plus bills and accounting`, `${a.name} uses ${inc ?? a.incumbent}. Ramp adds bill payments and accounting to the same platform, and ${sync}.`, "Attio switched in under a week. Worth a look?"],
    close_faster: [`Subject: Getting ${a.name}'s month-end close shorter`, `${hook}. Ramp checks receipts, coding and policy automatically, so finance only reviews the exceptions, and ${sync}.`, "Could I show you what that would mean for your close?"],
    self_serve: [`Subject: GBP cards for ${a.name}, set up in minutes`, "Get cards issued with limits already set, and let the team send receipts over WhatsApp.", `${sync}. You can sign up at ramp.com/en-gb.`],
  };
  const body = lines[playId] ?? [`Subject: ${a.name} and Ramp UK`, hook];
  return `${body[0]}\n\n[First name],\n\n${body.slice(1).join("\n\n")}\n\n[Rep name]\n\n${OPT_OUT_LINE}`;
}

export function sequence(playId, lane) {
  if (lane === "digital") return [
    { day: 0, channel: "Email", step: "Send the self-serve invite with a WhatsApp receipt demo" },
    { day: 3, channel: "In-product", step: "Prompt them to finish sign-up if they stop partway" },
    { day: 10, channel: "Email", step: "Send a guide to syncing with their accounting system" },
  ];
  if (lane === "partner") return [
    { day: 0, channel: "Partner", step: "Brief the accountant and agree a joint intro" },
    { day: 2, channel: "Accountant", step: "Accountant sends the three-way intro to their own client" },
    { day: 7, channel: "Meeting", step: "30-minute setup call with the accountant, once the client accepts" },
  ];
  const opener = playId === "welcome_back" ? "Warm intro through their US Ramp contact" : "Personalised email (draft below)";
  return [
    { day: 0, channel: "Email", step: opener },
    { day: 2, channel: "LinkedIn", step: `Connect with the ${PLAYS[playId]?.persona ?? "finance lead"}` },
    { day: 4, channel: "Call", step: "Call the finance lead and the controller" },
    { day: 8, channel: "Email", step: "Follow up with the case study, then a meeting ask" },
  ];
}

// ---------- Score one account ----------

/**
 * @param {import("./data.js").Account} a
 * @param {Record<string, unknown>} [leversIn]
 */
export function scoreAccount(a, leversIn = {}) {
  const lv = normaliseLevers(leversIn);
  const blocks = gates(a);
  const rules = contactRules(a);
  const f = fit(a);
  const t = timing(a, lv.halfLifeDays);
  const priority = round(lv.fitWeight * f.score + (1 - lv.fitWeight) * t.score);
  const play = choosePlay(a, lv.disabledPlays);
  const candidate = blocks.length || rules.suppressed ? null : play.primary;
  const candidateMotion = candidate ? motion(a, candidate) : null;
  const steps = candidate && candidateMotion ? permittedSteps(sequence(candidate, candidateMotion.lane), rules) : [];
  const touches = steps.filter((st) => st.channel !== "In-product");
  const noChannel = Boolean(candidate) && touches.length === 0;
  const suppressed = !blocks.length && (rules.suppressed || noChannel);
  const suppression = rules.suppressed ? rules.reasons[0] : noChannel ? `No permitted channel for the ${candidateMotion?.label ?? ""} motion. ${rules.reasons.join(" ")}` : null;
  const playId = suppressed ? null : candidate;
  const mv = playId && candidateMotion ? candidateMotion : { lane: "hold", label: "Hold", owner: "None" };
  let tier = priority >= 60 ? "P1" : priority >= 50 ? "P2" : "P3";
  if (t.score < 15 && playId !== "self_serve") tier = "Nurture";
  if (!playId) tier = "Nurture";
  if (suppressed) tier = "Suppressed";
  if (blocks.length) tier = "Blocked";
  const meta = playId ? PLAYS[playId] : null;
  const pMeeting = meta ? clamp(meta.meetingRate * (0.55 + (0.9 * t.score) / 100), 0, P_MEETING_CAP) : 0;
  return {
    id: a.id,
    account: a,
    priority,
    tier,
    fit: f,
    timing: t,
    gates: blocks,
    contact: { ...rules, suppression },
    play: playId,
    playName: meta ? meta.name : null,
    alternates: play.alternates.filter((p) => p !== playId),
    motion: mv,
    pMeeting: Math.round(pMeeting * 1000) / 1000,
    whyNow: t.contributions.filter((c) => c.points >= 1),
    proof: meta ? meta.proof : null,
    persona: meta ? meta.persona : null,
    sequence: playId ? steps : [],
    draft: playId && rules.email ? draft(a, playId, t.contributions) : null,
    draftNote: playId && !rules.email ? "Email isn't permitted for this account, so there is no email draft. Use the permitted steps in the sequence." : null,
  };
}

// ---------- Plan the book ----------

/**
 * @param {import("./data.js").Account[]} accounts
 * @param {Record<string, unknown>} [leversIn]
 */
export function plan(accounts, leversIn = {}) {
  const lv = normaliseLevers(leversIn);

  /** @type {Map<string, import("./data.js").Account[]>} */
  const groups = new Map();
  for (const a of accounts) {
    const k = ownershipKey(a).key;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  const prepared = accounts.map((a) => {
    const optedOut = (groups.get(ownershipKey(a).key) ?? []).find((m) => m.contact?.optedOut);
    return optedOut && !a.contact?.optedOut ? { ...a, contact: { ...(a.contact ?? {}), optedOut: true, optedOutOn: optedOut.contact?.optedOutOn } } : a;
  });

  /** @typedef {{key: string, matchedOn: string, status: "unowned" | "round_robin" | "existing_owner" | "duplicate", owner: string | null, duplicateOf: string | null, conflict: string | null, reason: string}} Ownership */
  /** @type {(ReturnType<typeof scoreAccount> & {rank: number, assignment?: {week: number | null, owner: string}, ownership: Ownership, sla: ReturnType<typeof firstTouchSla> | null})[]} */
  const scored = prepared
    .map((a) => {
      const k = ownershipKey(a);
      return { ...scoreAccount(a, lv), rank: 0, sla: null, ownership: { key: k.key, matchedOn: k.via, status: /** @type {Ownership["status"]} */ ("unowned"), owner: null, duplicateOf: null, conflict: null, reason: "" } };
    })
    .sort((x, y) => y.priority - x.priority || x.id.localeCompare(y.id));
  scored.forEach((s, i) => (s.rank = i + 1));

  /** @type {Map<string, typeof scored[number]>} */
  const primaryOf = new Map();
  for (const [key, members] of groups) {
    if (members.length === 0) continue;
    const rows = scored.filter((s) => s.ownership.key === key);
    const claims = rows
      .filter((r) => r.account.existingOwner)
      .sort((x, y) => (x.account.existingOwner?.since ?? "").localeCompare(y.account.existingOwner?.since ?? "") || x.id.localeCompare(y.id));
    const primary = claims[0] ?? rows[0];
    primaryOf.set(key, primary);
    const owners = [...new Set(claims.map((c) => c.account.existingOwner?.name))];
    if (owners.length > 1)
      primary.ownership.conflict = `Records name different owners (${claims.map((c) => `${c.account.existingOwner?.name} on ${c.id} since ${c.account.existingOwner?.since}`).join("; ")}). The earliest claim keeps it. RevOps should merge the records.`;
  }

  const weeks = Array.from({ length: lv.weeks }, (_, i) => ({
    week: i + 1,
    cap: { sdr: lv.sdrs * lv.accountsPerSdr, ae: lv.aes * lv.aeProspectSlots, partner: lv.partnerSlots },
    used: { sdr: 0, ae: 0, partner: 0, digital: 0 },
    expectedMeetings: 0,
    aeMeetingCapacity: lv.aes * lv.meetingsPerAe,
    /** @type {string[]} */
    accounts: [],
    pipelineGBP: 0,
    coverage: 0,
    aeOverloaded: false,
  }));
  const overflow = [];
  const rr = { sdr: 0, ae: 0, partner: 0 };
  const headcount = { sdr: lv.sdrs, ae: lv.aes, partner: 1 };

  for (const s of scored) {
    const primary = primaryOf.get(s.ownership.key);
    if (primary && primary.id !== s.id) {
      s.ownership.status = "duplicate";
      s.ownership.duplicateOf = primary.id;
      s.tier = "Duplicate";
      s.play = null;
      s.playName = null;
      s.pMeeting = 0;
      s.sequence = [];
      s.draft = null;
      s.draftNote = null;
      continue;
    }
    const existing = s.account.existingOwner;
    if (existing) {
      s.ownership.status = "existing_owner";
      s.ownership.owner = existing.name;
    }
    if (s.tier === "Blocked" || s.tier === "Nurture" || s.tier === "Suppressed") continue;
    const lane = s.motion.lane;
    if (lane === "digital") {
      weeks[0].used.digital++;
      weeks[0].accounts.push(s.id);
      s.assignment = { week: 1, owner: existing?.name ?? "Lifecycle email" };
    } else {
      const wk = weeks.find((w) => w.used[lane] < w.cap[lane]);
      if (!wk) {
        overflow.push(s.id);
        s.assignment = { week: null, owner: existing?.name ?? "Overflow" };
        continue;
      }
      wk.used[lane]++;
      wk.accounts.push(s.id);
      wk.expectedMeetings += s.pMeeting;
      if (existing) s.assignment = { week: wk.week, owner: existing.name };
      else {
        const idx = (rr[lane]++ % Math.max(headcount[lane], 1)) + 1;
        s.assignment = { week: wk.week, owner: lane === "partner" ? "Partner manager" : `${lane.toUpperCase()} ${idx}` };
      }
    }
    if (!existing) {
      s.ownership.status = "round_robin";
      s.ownership.owner = s.assignment.owner;
    }
    const week = s.assignment.week;
    if (week) s.sla = firstTouchSla(week, s.tier, s.assignment.owner);
  }

  for (const s of scored) {
    const o = s.ownership;
    if (o.status === "duplicate") {
      const p = scored.find((x) => x.id === o.duplicateOf);
      o.owner = p?.ownership.owner ?? null;
      o.reason = `Same company as ${p?.account.name} (${p?.id}), matched on ${o.matchedOn}. That record ${o.owner ? `is owned by ${o.owner}` : "has no owner yet"}. No second owner, week or sequence is assigned here. Log activity on ${p?.id}.`;
    } else if (o.status === "existing_owner") {
      const since = s.account.existingOwner?.since;
      o.reason = `Owned by ${o.owner} in CRM${since ? ` since ${since}` : ""}. Existing ownership takes precedence, so no round-robin owner is assigned.${s.assignment && !s.assignment.week ? " No capacity in the horizon, but it stays with its owner." : ""}`;
    } else if (o.status === "round_robin") {
      o.reason = s.assignment?.week
        ? `No existing owner and no duplicate found. Assigned to ${o.owner} for week ${s.assignment.week} in priority order.`
        : `No existing owner and no duplicate found, but no ${s.motion.label} capacity in the horizon. Not assigned yet.`;
      if (!s.assignment?.week) o.owner = null;
    } else {
      o.reason = s.tier === "Suppressed" ? "Suppressed, so it is not assigned to anyone." : s.tier === "Blocked" ? "Held at the UK gate, so it is not assigned." : "Nurture, so it is not assigned yet.";
    }
  }

  const byId = Object.fromEntries(scored.map((s) => [s.id, s]));
  for (const w of weeks) {
    w.expectedMeetings = Math.round(w.expectedMeetings * 10) / 10;
    w.pipelineGBP = Math.round(w.accounts.reduce((sum, id) => sum + byId[id].pMeeting * OPP_RATE * byId[id].account.monthlySpendGBP * 12, 0));
    w.coverage = Math.round((w.expectedMeetings / lv.targetMeetings) * 100);
    w.aeOverloaded = w.expectedMeetings > w.aeMeetingCapacity;
  }

  const w1 = weeks[0];
  const bottleneck = w1.aeOverloaded
    ? "AE meeting capacity"
    : overflow.length && lv.weeks > 0
      ? "Prospecting capacity (accounts overflow the horizon)"
      : w1.expectedMeetings < lv.targetMeetings
        ? "Pipeline volume: the target needs more accounts or stronger signals"
        : "None";

  /** @type {Record<string, number>} */
  const playMix = {};
  for (const s of scored) if (s.play) playMix[s.play] = (playMix[s.play] ?? 0) + 1;

  const tiers = { P1: 0, P2: 0, P3: 0, Nurture: 0, Suppressed: 0, Duplicate: 0, Blocked: 0 };
  for (const s of scored) tiers[s.tier]++;

  return {
    levers: lv,
    ranked: scored,
    weeks,
    overflow,
    duplicates: scored.filter((s) => s.ownership.status === "duplicate").map((s) => ({ id: s.id, duplicateOf: s.ownership.duplicateOf, owner: s.ownership.owner })),
    conflicts: scored.filter((s) => s.ownership.conflict).map((s) => ({ id: s.id, conflict: s.ownership.conflict })),
    bottleneck,
    playMix,
    tiers,
    totals: {
      accounts: scored.length,
      actionable: scored.filter((s) => s.assignment && s.assignment.week).length,
      expectedMeetings: Math.round(weeks.reduce((n, w) => n + w.expectedMeetings, 0) * 10) / 10,
      pipelineGBP: weeks.reduce((n, w) => n + w.pipelineGBP, 0),
    },
    assumptions: { synthetic: true, oppRate: OPP_RATE, pipelineBasis: "Estimated annual card and bill spend that could move to Ramp, weighted by P(meeting) × P(opportunity). This is not revenue." },
  };
}

// ---------- Validation for user-supplied accounts ----------

const ACCOUNTING = ["Xero", "QuickBooks", "NetSuite", "Sage Intacct", "Business Central", "Sage 50", "Other ERP"];

export function validateAccount(raw) {
  const errs = [];
  if (typeof raw !== "object" || raw === null) return { errors: ["account must be an object"] };
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 80) : "";
  if (!name) errs.push("name is required");
  const employees = Number(raw.employees);
  if (!Number.isInteger(employees) || employees < 1 || employees > 100000) errs.push("employees must be a whole number from 1 to 100000");
  const spend = Number(raw.monthlySpendGBP);
  if (!Number.isFinite(spend) || spend < 0 || spend > 100000000) errs.push("monthlySpendGBP must be between 0 and 100,000,000");
  const gbpShare = Number(raw.gbpShare);
  if (!Number.isFinite(gbpShare) || gbpShare < 0 || gbpShare > 1) errs.push("gbpShare must be between 0 and 1");
  const accounting = ACCOUNTING.includes(raw.accounting) ? raw.accounting : null;
  if (!accounting) errs.push(`accounting must be one of ${ACCOUNTING.join(", ")}`);
  const entities = raw.entities === undefined ? 1 : Number(raw.entities);
  if (!Number.isInteger(entities) || entities < 1 || entities > 200) errs.push("entities must be a whole number from 1 to 200");
  const legalForm = raw.legalForm === undefined ? "Ltd" : LEGAL_FORMS.includes(raw.legalForm) ? raw.legalForm : null;
  if (!legalForm) errs.push(`legalForm must be one of ${LEGAL_FORMS.join(", ")}`);
  const rc = raw.contact === undefined ? {} : raw.contact;
  if (typeof rc !== "object" || rc === null || Array.isArray(rc)) errs.push("contact must be an object");
  /** @type {import("./data.js").Contact} */
  const contact = {};
  if (typeof rc === "object" && rc !== null) {
    for (const k of ["optedOut", "emailConsent", "ctps", "doNotCall"]) {
      if (rc[k] === undefined) continue;
      if (typeof rc[k] !== "boolean") errs.push(`contact.${k} must be true or false`);
      else contact[k] = rc[k];
    }
    if (typeof rc.optedOutOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rc.optedOutOn)) contact.optedOutOn = rc.optedOutOn;
  }
  const companyNumber = typeof raw.companyNumber === "string" && raw.companyNumber.trim() ? raw.companyNumber.trim().toUpperCase() : undefined;
  if (companyNumber && !/^[A-Z0-9]{8}$/.test(companyNumber)) errs.push("companyNumber must be an 8-character Companies House number");
  const domain = typeof raw.domain === "string" && raw.domain.trim() ? raw.domain.trim().toLowerCase().slice(0, 100) : undefined;
  if (domain && !/^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/.test(domain)) errs.push("domain must look like example.co.uk");
  /** @type {{name: string, since?: string} | undefined} */
  let existingOwner;
  if (raw.existingOwner !== undefined && raw.existingOwner !== null && raw.existingOwner !== "") {
    const eo = raw.existingOwner;
    const oname = typeof eo === "object" && typeof eo.name === "string" ? eo.name.trim().slice(0, 40) : "";
    if (!oname) errs.push("existingOwner.name is required when existingOwner is set");
    else if (eo.since !== undefined && !(typeof eo.since === "string" && /^\d{4}-\d{2}-\d{2}$/.test(eo.since))) errs.push("existingOwner.since must be YYYY-MM-DD");
    else existingOwner = eo.since ? { name: oname, since: eo.since } : { name: oname };
  }
  const signals = Array.isArray(raw.signals) ? raw.signals : [];
  if (signals.length > 12) errs.push("at most 12 signals");
  const clean = [];
  for (const s of signals.slice(0, 12)) {
    if (!s || typeof s !== "object" || !(s.type in SIGNAL_TYPES)) { errs.push(`unknown signal type ${s && s.type}`); continue; }
    /** @type {import("./data.js").Signal} */
    const out = { type: s.type, note: typeof s.note === "string" && s.note.trim() ? s.note.trim().slice(0, 160) : SIGNAL_TYPES[s.type].label };
    if (s.type === "us_ramp_alumni") out.kind = s.kind === "person" ? "person" : "entity";
    if (s.type === "incumbent_renewal") out.inDays = clamp(Math.round(Number(s.inDays) || 0), 0, 730);
    else if (s.type !== "us_ramp_alumni") out.daysAgo = clamp(Math.round(Number(s.daysAgo) || 0), 0, 730);
    clean.push(out);
  }
  if (errs.length) return { errors: errs };
  return {
    account: {
      id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim().slice(0, 12) : "NEW",
      name,
      city: typeof raw.city === "string" ? raw.city.slice(0, 60) : "UK",
      sector: typeof raw.sector === "string" ? raw.sector.slice(0, 60) : "Unspecified",
      employees,
      stage: typeof raw.stage === "string" ? raw.stage.slice(0, 40) : "Unknown",
      legalForm: /** @type {string} */ (legalForm),
      ukEntity: raw.ukEntity !== false,
      gbpShare,
      entities,
      incumbent: typeof raw.incumbent === "string" && raw.incumbent.trim() ? raw.incumbent.trim().slice(0, 40) : "Spreadsheets",
      accounting,
      monthlySpendGBP: spend,
      aiNative: raw.aiNative === true,
      contact,
      ...(companyNumber ? { companyNumber } : {}),
      ...(domain ? { domain } : {}),
      ...(existingOwner ? { existingOwner } : {}),
      signals: clean,
    },
  };
}
