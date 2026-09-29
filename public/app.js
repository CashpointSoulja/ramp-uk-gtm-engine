import { ACCOUNTS, AS_OF, SIGNAL_TYPES } from "./data.js";
import { DEFAULT_LEVERS, LEVER_LIMITS, PLAYS, PLAY_ORDER, plan, validateAccount } from "./engine.js";

const $ = (sel) => document.querySelector(sel);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const gbp = (n) => (n >= 1e6 ? `£${(n / 1e6).toFixed(1)}m` : n >= 1e3 ? `£${Math.round(n / 1e3)}k` : `£${Math.round(n)}`);
const pct = (n) => `${Math.round(n * 100)}%`;
const LANES = { sdr: "SDR", ae: "AE", partner: "Partner", digital: "Self-serve", hold: "Hold" };
const TIERS = ["All", "P1", "P2", "P3", "Nurture", "Blocked"];

const state = {
  levers: structuredClone(DEFAULT_LEVERS),
  extra: [],
  logged: {},
  selected: null,
  tier: "All",
  q: "",
  tab: "queue",
  result: null,
};

function accounts() {
  return [...ACCOUNTS, ...state.extra].map((a) => (state.logged[a.id] ? { ...a, signals: [...state.logged[a.id], ...a.signals] } : a));
}

function recompute() {
  state.result = plan(accounts(), state.levers);
  if (!state.selected || !state.result.ranked.some((s) => s.id === state.selected)) state.selected = state.result.ranked[0].id;
}

function byId(id) {
  return state.result.ranked.find((s) => s.id === id);
}

// ---------- KPIs ----------

function renderKpis() {
  const r = state.result;
  const w1 = r.weeks[0];
  const target = r.levers.targetMeetings;
  const cov = Math.min(100, Math.round((w1.expectedMeetings / target) * 100));
  $("#kpis").innerHTML = `
    <div class="kpi"><span class="k">Worked in week 1</span><span class="v">${w1.accounts.length}<small> / ${r.totals.accounts}</small></span><span class="h">${r.tiers.P1} P1 · ${r.tiers.P2} P2 · ${r.tiers.Blocked} blocked</span></div>
    <div class="kpi"><span class="k">Expected meetings, wk 1</span><span class="v">${w1.expectedMeetings.toFixed(1)}<small> / ${target} target</small></span><span class="bar"><i style="width:${cov}%"></i></span></div>
    <div class="kpi"><span class="k">Weighted pipeline, ${r.levers.weeks} wk</span><span class="v">${gbp(r.totals.pipelineGBP)}</span><span class="h">annual spend basis, not revenue</span></div>
    <div class="kpi ${r.bottleneck === "None" ? "ok" : "warn"}"><span class="k">Bottleneck</span><span class="v sm">${esc(r.bottleneck)}</span><button class="link" data-goto="capacity">Open capacity plan →</button></div>`;
}

// ---------- Queue ----------

function renderChips() {
  const counts = { All: state.result.ranked.length, ...state.result.tiers };
  $("#tier-chips").innerHTML = TIERS.map(
    (t) => `<button class="chip ${state.tier === t ? "on" : ""}" data-tier="${t}" aria-pressed="${state.tier === t}">${t} <b>${counts[t] ?? 0}</b></button>`,
  ).join("");
}

function renderList() {
  const q = state.q.trim().toLowerCase();
  const rows = state.result.ranked.filter(
    (s) =>
      (state.tier === "All" || s.tier === state.tier) &&
      (!q || [s.account.name, s.account.city, s.account.sector, s.playName ?? ""].some((f) => f.toLowerCase().includes(q))),
  );
  $("#acct-list").innerHTML = rows.length
    ? rows
        .map((s) => {
          const who = s.assignment ? (s.assignment.week ? `Wk ${s.assignment.week} · ${s.assignment.owner}` : "Over capacity") : s.tier === "Blocked" ? "Held at gate" : "Nurture";
          return `<li><button class="acct ${s.id === state.selected ? "sel" : ""}" data-id="${esc(s.id)}" aria-current="${s.id === state.selected}">
            <span class="rank">${s.rank}</span>
            <span class="main"><span class="nm">${esc(s.account.name)}${s.account.id.startsWith("U") ? ' <em class="new">added</em>' : ""}</span>
              <span class="meta">${esc(s.account.city)} · ${esc(s.account.sector)} · ${s.account.employees} staff</span>
              <span class="play">${s.playName ? esc(s.playName) : s.tier === "Blocked" ? "Blocked by UK gate" : "No play yet"}</span></span>
            <span class="side"><span class="tier t-${s.tier}">${s.tier}</span><span class="pri">${s.priority}</span><span class="who ${s.assignment && !s.assignment.week ? "over" : ""}">${esc(who)}</span></span>
          </button></li>`;
        })
        .join("")
    : `<li class="empty">No accounts match. Clear the search or pick another tier.</li>`;
}

function meter(label, v, cls = "") {
  return `<div class="meter ${cls}"><div class="ml"><span>${label}</span><b>${v}</b></div><div class="mt"><i style="width:${v}%"></i></div></div>`;
}

function renderDetail() {
  const s = byId(state.selected);
  if (!s) return;
  const a = s.account;
  const lv = state.levers;
  const signalOpts = Object.entries(SIGNAL_TYPES).map(([k, m]) => `<option value="${k}">${esc(m.label)}</option>`).join("");
  const gate = s.gates.length
    ? `<div class="callout block"><b>Held at the UK gate</b><ul>${s.gates.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>`
    : `<div class="callout pass"><b>Passes the UK gates</b> UK entity · ${pct(a.gbpShare)} of spend in GBP</div>`;
  const flags = s.fit.flags.map((f) => `<div class="callout flag"><b>Check first</b> ${esc(f)}</div>`).join("");
  const why = s.whyNow.length
    ? s.whyNow
        .map(
          (c) => `<li><span class="wl"><b>${esc(c.label)}</b> <span class="age">${esc(c.age)}</span></span><span class="wn">${esc(c.note)}</span>
          <span class="wbar"><i style="width:${Math.min(100, (c.points / 45) * 100)}%"></i><em>+${Math.round(c.points)}</em></span></li>`,
        )
        .join("")
    : `<li class="none">No live signals. Every signal has decayed or none exist, so this account waits in nurture.</li>`;
  const fitRows = s.fit.parts.map((p) => `<li><span>${esc(p.label)}</span><span class="fs"><i style="width:${p.score}%"></i></span><b>${p.score}</b></li>`).join("");
  const assign = s.assignment
    ? s.assignment.week
      ? `<span class="pill">Week ${s.assignment.week}</span><span class="pill">${esc(s.assignment.owner)}</span>`
      : `<span class="pill over">Over capacity: add a rep or a week</span>`
    : "";
  const play = s.play
    ? `<section class="card play-card">
        <div class="ph"><div><span class="lbl">Play</span><h3>${esc(s.playName)}</h3><p>${esc(PLAYS[s.play].summary)}</p></div>
          <div class="pm"><span class="lbl">P(meeting)</span><b>${pct(s.pMeeting)}</b></div></div>
        <div class="pills"><span class="pill lane-${s.motion.lane}">${esc(s.motion.label)}</span><span class="pill">Persona: ${esc(s.persona)}</span>${assign}</div>
        <blockquote>${esc(s.proof.text)} <a href="${esc(s.proof.source.url)}" target="_blank" rel="noopener">${esc(s.proof.source.label)}</a></blockquote>
        ${s.alternates.length ? `<p class="alts">Next best if this stalls: ${s.alternates.map((p) => `<span>${esc(PLAYS[p].name)}</span>`).join("")}</p>` : ""}
      </section>
      <section class="card">
        <span class="lbl">Sequence</span>
        <ol class="seq">${s.sequence.map((st) => `<li><span class="d">Day ${st.day}</span><span class="c">${esc(st.channel)}</span><span>${esc(st.step)}</span></li>`).join("")}</ol>
      </section>
      <section class="card">
        <div class="dh"><span class="lbl">First-touch draft</span><button class="ghost sm" id="copy">Copy</button></div>
        <pre class="draft" id="draft-text">${esc(s.draft)}</pre>
        <p class="fine">Built from the account's own signals, systems and current tool. Placeholders in brackets.</p>
      </section>`
    : `<section class="card"><span class="lbl">Play</span><p>${s.gates.length ? "No play until the gate clears." : "No play matches strongly enough yet. Log a signal below to see where it would land."}</p></section>`;

  $("#detail").innerHTML = `
    <div class="dhead">
      <div><p class="eyebrow">#${s.rank} of ${state.result.ranked.length} · ${esc(a.stage)} · ${esc(a.city)}</p><h2>${esc(a.name)}</h2>
        <p class="facts">${esc(a.sector)} · ${a.employees} staff · ${a.entities} entit${a.entities === 1 ? "y" : "ies"} · ${gbp(a.monthlySpendGBP)}/mo spend · ${esc(a.accounting)} · today: ${esc(a.incumbent)}</p></div>
      <div class="scores">
        <div class="big"><span class="lbl">Priority</span><b>${s.priority}</b><span class="tier t-${s.tier}">${s.tier}</span></div>
        ${meter("Fit", s.fit.score, "fit")}${meter("Timing", s.timing.score, "tim")}
        <p class="fine">Priority = ${Math.round(lv.fitWeight * 100)}% fit + ${100 - Math.round(lv.fitWeight * 100)}% timing</p>
      </div>
    </div>
    ${gate}${flags}
    <div class="grid2">
      <section class="card"><span class="lbl">Why now</span><ul class="why">${why}</ul>
        <form class="log" id="log-form"><span class="lbl">Log a new signal</span>
          <div class="logrow"><select name="type" aria-label="Signal type">${signalOpts}</select>
          <input name="days" type="number" min="0" max="365" value="0" aria-label="Days ago, or days until renewal" title="Days ago (days until renewal for renewals)" />
          <button class="primary sm" type="submit">Log</button></div></form>
      </section>
      <section class="card"><span class="lbl">Fit</span><ul class="fit">${fitRows}</ul></section>
    </div>
    ${play}`;
}

// ---------- Capacity ----------

const LEVER_UI = [
  ["Scoring", [["fitWeight", "Fit vs timing", (v) => `${Math.round(v * 100)}% fit`, 0.05], ["halfLifeDays", "Signal half-life", (v) => `${v} days`, 1]]],
  ["Team", [["sdrs", "SDRs", (v) => v, 1], ["accountsPerSdr", "New accounts per SDR / wk", (v) => v, 1], ["aes", "AEs", (v) => v, 1], ["aeProspectSlots", "AE self-sourced accounts / wk", (v) => v, 1], ["meetingsPerAe", "First meetings per AE / wk", (v) => v, 1], ["partnerSlots", "Accountant intros / wk", (v) => v, 1]]],
  ["Goal", [["targetMeetings", "Meeting target / wk", (v) => v, 1], ["weeks", "Planning horizon", (v) => `${v} wk`, 1]]],
];

function renderLevers() {
  $("#levers").innerHTML =
    LEVER_UI.map(
      ([group, items]) => `<fieldset><legend>${group}</legend>${items
        .map(([k, label, fmt, step]) => {
          const [lo, hi] = LEVER_LIMITS[k];
          const max = k === "halfLifeDays" ? 120 : k === "targetMeetings" ? 30 : k === "accountsPerSdr" ? 25 : k === "partnerSlots" ? 12 : hi;
          return `<label class="lever"><span class="ll">${label}<output id="o-${k}">${fmt(state.levers[k])}</output></span>
            <input type="range" name="${k}" min="${lo}" max="${Math.min(hi, max)}" step="${step}" value="${state.levers[k]}" /></label>`;
        })
        .join("")}</fieldset>`,
    ).join("") + `<button type="button" class="ghost wide" id="reset">Reset to defaults</button>`;
}

function renderCapacity() {
  const r = state.result;
  const lanes = ["sdr", "ae", "partner"];
  const weeks = r.weeks
    .map((w) => {
      const bars = lanes
        .map((l) => {
          const cap = w.cap[l];
          const used = w.used[l];
          const p = cap ? Math.round((used / cap) * 100) : 0;
          return `<div class="lane"><span class="ln">${LANES[l]}</span><span class="lt"><i class="${p >= 100 ? "full" : ""}" style="width:${Math.min(p, 100)}%"></i></span><b>${used}/${cap}</b></div>`;
        })
        .join("");
      const mp = w.aeMeetingCapacity ? Math.round((w.expectedMeetings / w.aeMeetingCapacity) * 100) : 100;
      return `<section class="card week"><div class="wh"><h3>Week ${w.week}</h3><span>${w.accounts.length} accounts · ${gbp(w.pipelineGBP)} pipeline</span></div>
        ${bars}
        <div class="lane"><span class="ln">Self-serve</span><span class="lt dig"><i style="width:${w.used.digital ? 100 : 0}%"></i></span><b>${w.used.digital}</b></div>
        <div class="mtg ${w.aeOverloaded ? "bad" : ""}"><span>Expected meetings <b>${w.expectedMeetings.toFixed(1)}</b> vs target <b>${r.levers.targetMeetings}</b></span>
          <span>AE meeting load <b>${mp}%</b> of ${w.aeMeetingCapacity}</span></div></section>`;
    })
    .join("");
  const over = r.overflow.length
    ? `<section class="card"><span class="lbl">Over capacity (${r.overflow.length})</span><p class="fine">Ready to work, but no rep has room in the horizon. Add capacity or a week.</p><ul class="overflow">${r.overflow
        .map((id) => {
          const s = byId(id);
          return `<li><button class="link" data-open="${esc(id)}">${esc(s.account.name)}</button><span>${LANES[s.motion.lane]} · P${s.priority}</span></li>`;
        })
        .join("")}</ul></section>`
    : `<section class="card"><span class="lbl">Over capacity</span><p class="fine">Nothing. Every actionable account has an owner and a week.</p></section>`;
  const mix = PLAY_ORDER.filter((p) => r.playMix[p])
    .map((p) => `<li><span>${esc(PLAYS[p].name)}</span><b>${r.playMix[p]}</b></li>`)
    .join("");
  $("#cap-out").innerHTML = `
    <div class="callout ${r.bottleneck === "None" ? "pass" : "flag"}"><b>Bottleneck: ${esc(r.bottleneck)}</b> ${advice(r)}</div>
    <div class="weeks">${weeks}</div>
    <div class="grid2">${over}<section class="card"><span class="lbl">Play mix across the book</span><ul class="mix">${mix}</ul></section></div>
    <p class="fine">${esc(r.assumptions.pipelineBasis)} Meeting-to-opportunity rate assumed at ${pct(r.assumptions.oppRate)}.</p>`;
}

function advice(r) {
  const w1 = r.weeks[0];
  if (r.bottleneck === "AE meeting capacity") return `Week 1 expects ${w1.expectedMeetings.toFixed(1)} meetings but AEs can take ${w1.aeMeetingCapacity}. Add an AE, or move self-sourced AE time back to meetings.`;
  if (r.bottleneck.startsWith("Prospecting")) return `${r.overflow.length} ready accounts have no owner. One more SDR or a longer horizon clears most of them.`;
  if (r.bottleneck.startsWith("Pipeline")) return `The team has room, but week 1 only reaches ${w1.expectedMeetings.toFixed(1)} of ${r.levers.targetMeetings} meetings. Source more UK accounts with live signals, or lower the target.`;
  return "Capacity, meetings and target line up for this horizon.";
}

// ---------- Plays ----------

function renderPlays() {
  const r = state.result;
  $("#plays").innerHTML = PLAY_ORDER.map((id, i) => {
    const p = PLAYS[id];
    const off = state.levers.disabledPlays.includes(id);
    const n = r.playMix[id] ?? 0;
    const names = r.ranked.filter((s) => s.play === id).slice(0, 4).map((s) => `<button class="link" data-open="${esc(s.id)}">${esc(s.account.name)}</button>`).join("");
    return `<article class="card pcard ${off ? "off" : ""}">
      <div class="pch"><span class="ord">${i + 1}</span><h3>${esc(p.name)}</h3>
        <label class="switch"><input type="checkbox" data-play="${id}" ${off ? "" : "checked"} aria-label="Use ${esc(p.name)}" /><span></span></label></div>
      <p>${esc(p.summary)}</p>
      <div class="pills"><span class="pill">${esc(p.persona)}</span><span class="pill">Base meeting rate ${pct(p.meetingRate)}</span><span class="pill strong">${n} account${n === 1 ? "" : "s"}</span></div>
      <blockquote>${esc(p.proof.text)} <a href="${esc(p.proof.source.url)}" target="_blank" rel="noopener">${esc(p.proof.source.label)}</a></blockquote>
      ${names ? `<div class="pnames">${names}</div>` : ""}
    </article>`;
  }).join("");
}

// ---------- Method ----------

function renderMethod() {
  const sig = Object.entries(SIGNAL_TYPES)
    .map(([, m]) => `<tr><td>${esc(m.label)}</td><td>${m.weight}</td><td>${m.decays ? (m.fast ? "Fast (half-life ÷ 6)" : "Half-life") : "Does not decay"}</td></tr>`)
    .join("");
  $("#method").innerHTML = `
    <section class="card"><h3>How an account is ranked</h3><ol class="steps">
      <li><b>UK gates.</b> Ramp UK serves UK-headquartered businesses that run mainly in GBP. An account without a UK entity, or with under half its spend in GBP, is held and gets no play.</li>
      <li><b>Fit (0–100).</b> Size 25%, accounting system 25%, monthly card and bill spend 25%, current tool 15%, entity count 10%. Xero and QuickBooks score highest because they have the strongest UK sync. NetSuite, Sage Intacct and Business Central are supported. Anything else is flagged for checking.</li>
      <li><b>Timing (0–100).</b> Each signal has a weight and loses strength with age, set by the half-life lever. Signals combine as 1 − ∏(1 − wᵢ), so two medium signals beat one weak one without going over 100. Renewals peak 30–150 days out.</li>
      <li><b>Priority</b> = fit weight × fit + (1 − fit weight) × timing. Accounts with timing under 15 go to nurture, whatever their fit.</li>
      <li><b>Play.</b> Nine plays are checked in order. The first strong match wins and the others become fallbacks. Small, simple accounts go to self-serve unless an accountant has referred them.</li>
      <li><b>Motion and capacity.</b> Each play maps to SDR, AE, accountant or self-serve. Accounts fill each week's slots in priority order, and anything left over is shown as over capacity.</li>
    </ol></section>
    <div class="grid2">
      <section class="card"><h3>Signals</h3><table class="tbl"><thead><tr><th>Signal</th><th>Weight</th><th>Decay</th></tr></thead><tbody>${sig}</tbody></table></section>
      <section class="card"><h3>What this is and isn't</h3><ul class="plain">
        <li>An independent concept by Ayo Ahmed. Not affiliated with or endorsed by Ramp.</li>
        <li>All 30 accounts and their signals are made up. In production they would come from CRM, enrichment, web intent and partner feeds.</li>
        <li>Product facts and customer quotes are taken from Ramp's public UK pages and linked where used.</li>
        <li>Meeting rates and the 55% meeting-to-opportunity rate are starting assumptions to test against real results, not benchmarks.</li>
        <li>Scoring is deterministic and explainable. The same inputs always give the same plan, and every point can be traced.</li>
      </ul></section>
    </div>
    <section class="card"><h3>API</h3><p class="fine">The same engine runs in a Cloudflare Worker. The browser and the API give identical results.</p>
<pre class="code">GET  /api/health
GET  /api/meta
POST /api/plan   {"levers": {"sdrs": 3, "halfLifeDays": 30}, "extraAccounts": [...]}
POST /api/score  {"account": {"name": "Harbourline", "employees": 120, "monthlySpendGBP": 60000,
                  "gbpShare": 0.9, "accounting": "Xero", "incumbent": "Pleo",
                  "signals": [{"type": "incumbent_renewal", "inDays": 60}]}}</pre></section>`;
}

// ---------- Render + events ----------

function render() {
  renderKpis();
  if (state.tab === "queue") { renderChips(); renderList(); renderDetail(); }
  if (state.tab === "capacity") renderCapacity();
  if (state.tab === "plays") renderPlays();
  if (state.tab === "method") renderMethod();
}

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== `view-${tab}`));
  if (tab === "capacity") renderLevers();
  render();
}

function openAccount(id) {
  state.selected = id;
  state.tier = "All";
  if (state.tab !== "queue") setTab("queue");
  else render();
  if (window.matchMedia("(max-width: 900px)").matches) $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

document.addEventListener("click", (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  const tab = el.closest("[data-tab]");
  if (tab) return setTab(tab.dataset.tab);
  const go = el.closest("[data-goto]");
  if (go) return setTab(go.dataset.goto);
  const tier = el.closest("[data-tier]");
  if (tier) { state.tier = tier.dataset.tier; return render(); }
  const acct = el.closest(".acct");
  if (acct) return openAccount(acct.dataset.id);
  const open = el.closest("[data-open]");
  if (open) return openAccount(open.dataset.open);
  if (el.id === "copy") {
    navigator.clipboard?.writeText($("#draft-text").textContent).then(() => toast("Draft copied"), () => toast("Copy blocked by the browser"));
    return;
  }
  if (el.id === "reset") {
    state.levers = structuredClone(DEFAULT_LEVERS);
    recompute(); renderLevers(); render();
    return;
  }
  if (el.id === "add-toggle") {
    const f = $("#add-form");
    f.hidden = !f.hidden;
    el.setAttribute("aria-expanded", String(!f.hidden));
  }
});

$("#q").addEventListener("input", (e) => { state.q = e.target.value; renderList(); });

$("#levers").addEventListener("input", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLInputElement)) return;
  state.levers[t.name] = Number(t.value);
  const item = LEVER_UI.flatMap(([, i]) => i).find(([k]) => k === t.name);
  $(`#o-${t.name}`).textContent = item[2](state.levers[t.name]);
  recompute(); render();
});

$("#plays").addEventListener("change", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLInputElement) || !t.dataset.play) return;
  const id = t.dataset.play;
  const set = new Set(state.levers.disabledPlays);
  t.checked ? set.delete(id) : set.add(id);
  state.levers.disabledPlays = [...set];
  recompute(); render();
  toast(`${PLAYS[id].name} ${t.checked ? "on" : "off"}. Plan rebuilt.`);
});

document.addEventListener("submit", (e) => {
  const f = e.target;
  if (!(f instanceof HTMLFormElement) || f.id !== "log-form") return;
  e.preventDefault();
  const d = new FormData(f);
  const type = String(d.get("type"));
  const days = Math.max(0, Math.min(365, Number(d.get("days")) || 0));
  const before = byId(state.selected);
  const sig = type === "incumbent_renewal" ? { type, inDays: days, note: `Logged: renewal in ${days} days` }
    : type === "us_ramp_alumni" ? { type, kind: "entity", note: "Logged: already on Ramp in the US" }
    : { type, daysAgo: days, note: `Logged: ${SIGNAL_TYPES[type].label.toLowerCase()}` };
  (state.logged[state.selected] ??= []).unshift(sig);
  recompute();
  const after = byId(state.selected);
  render();
  const moved = before.rank - after.rank;
  toast(`${after.account.name}: #${before.rank} → #${after.rank}${moved ? ` (${moved > 0 ? "up" : "down"} ${Math.abs(moved)})` : ""}, ${before.tier} → ${after.tier}${after.playName ? `, play: ${after.playName}` : ""}`);
});

let added = 0;
$("#add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const type = String(d.get("signal"));
  const days = Number(d.get("signalDays")) || 0;
  const signal = type === "none" ? null : type === "incumbent_renewal" ? { type, inDays: days } : { type, daysAgo: days };
  const v = validateAccount({
    id: `U${++added}`,
    name: d.get("name"),
    city: "UK",
    sector: "Added by you",
    stage: "Unknown",
    employees: Number(d.get("employees")),
    monthlySpendGBP: Number(d.get("monthlySpendGBP")),
    gbpShare: Number(d.get("gbpShare")),
    entities: Number(d.get("entities")),
    accounting: d.get("accounting"),
    incumbent: d.get("incumbent"),
    aiNative: d.get("aiNative") === "on",
    ukEntity: d.get("ukEntity") === "on",
    signals: signal ? [signal] : [],
  });
  if (v.errors) { $("#add-err").textContent = v.errors.join(". "); return; }
  $("#add-err").textContent = "";
  state.extra.push(v.account);
  recompute();
  const s = byId(v.account.id);
  toast(`${s.account.name} scored ${s.priority} (${s.tier}) and ranks #${s.rank}`);
  e.target.hidden = true;
  $("#add-toggle").setAttribute("aria-expanded", "false");
  openAccount(s.id);
});

$("#add-signal").innerHTML = `<option value="none">None yet</option>` + Object.entries(SIGNAL_TYPES).map(([k, m]) => `<option value="${k}" ${k === "finance_leader_hired" ? "selected" : ""}>${esc(m.label)}</option>`).join("");
$("#asof").textContent = new Date(`${AS_OF}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

recompute();
render();
