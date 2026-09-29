import { describe, expect, it } from "vitest";
import { ACCOUNTS, SIGNAL_TYPES } from "../public/data.js";
import {
  DEFAULT_LEVERS,
  PLAYS,
  choosePlay,
  draft,
  fit,
  gates,
  normaliseLevers,
  plan,
  scoreAccount,
  signalStrength,
  timing,
  validateAccount,
} from "../public/engine.js";

const base = {
  id: "T1",
  name: "Test Co",
  city: "London",
  sector: "SaaS",
  employees: 120,
  stage: "Series A",
  ukEntity: true,
  gbpShare: 0.9,
  entities: 1,
  incumbent: "Pleo",
  accounting: "Xero",
  monthlySpendGBP: 60000,
  aiNative: false,
  signals: [] as { type: string; daysAgo?: number; inDays?: number; kind?: string; note: string }[],
};
const acct = (over: Partial<typeof base> = {}) => ({ ...base, ...over });

describe("synthetic data", () => {
  it("has 30 accounts with unique ids and only known signal types", () => {
    expect(ACCOUNTS).toHaveLength(30);
    expect(new Set(ACCOUNTS.map((a) => a.id)).size).toBe(30);
    for (const a of ACCOUNTS) for (const s of a.signals) expect(SIGNAL_TYPES).toHaveProperty(s.type);
  });
});

describe("UK gates", () => {
  it("blocks accounts with no UK entity or under half GBP spend", () => {
    expect(gates(acct())).toEqual([]);
    expect(gates(acct({ ukEntity: false }))).toHaveLength(1);
    expect(gates(acct({ gbpShare: 0.4 }))[0]).toMatch(/40% of spend is in GBP/);
    expect(gates(acct({ ukEntity: false, gbpShare: 0.1 }))).toHaveLength(2);
  });

  it("gives blocked accounts no play, no meetings and no owner", () => {
    const s = scoreAccount(acct({ ukEntity: false, signals: [{ type: "finance_leader_hired", daysAgo: 1, note: "x" }] }));
    expect(s.tier).toBe("Blocked");
    expect(s.play).toBeNull();
    expect(s.pMeeting).toBe(0);
    expect(s.draft).toBeNull();
  });
});

describe("fit", () => {
  it("prefers the strongest UK syncs and flags unsupported ledgers", () => {
    const xero = fit(acct()).score;
    const intacct = fit(acct({ accounting: "Sage Intacct" }));
    const sage50 = fit(acct({ accounting: "Sage 50" }));
    const other = fit(acct({ accounting: "Other ERP" }));
    expect(xero).toBeGreaterThan(intacct.score);
    expect(intacct.score).toBeGreaterThan(sage50.score);
    expect(sage50.score).toBeGreaterThan(other.score);
    expect(intacct.flags).toEqual([]);
    expect(sage50.flags[0]).toMatch(/Sage 50/);
    expect(other.flags[0]).toMatch(/not a named Ramp UK integration/);
  });

  it("scores higher for more spend and stays within 0-100", () => {
    expect(fit(acct({ monthlySpendGBP: 200000 })).score).toBeGreaterThan(fit(acct({ monthlySpendGBP: 10000 })).score);
    for (const a of ACCOUNTS) {
      const f = fit(a).score;
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(100);
    }
  });
});

describe("timing and decay", () => {
  it("halves a decaying signal at the half-life", () => {
    expect(signalStrength({ type: "funding_round", daysAgo: 0, note: "" }, 45)).toBe(1);
    expect(signalStrength({ type: "funding_round", daysAgo: 45, note: "" }, 45)).toBeCloseTo(0.5);
    expect(signalStrength({ type: "funding_round", daysAgo: 90, note: "" }, 45)).toBeCloseTo(0.25);
  });

  it("decays web intent six times faster", () => {
    expect(signalStrength({ type: "pricing_page_visit", daysAgo: 45, note: "" }, 45)).toBeLessThan(0.02);
  });

  it("peaks renewals 30 to 150 days out", () => {
    const r = (inDays: number) => signalStrength({ type: "incumbent_renewal", inDays, note: "" }, 45);
    expect(r(10)).toBeLessThan(r(60));
    expect(r(200)).toBeLessThan(r(60));
    expect(r(60)).toBe(1);
  });

  it("combines signals without passing 100", () => {
    const many = acct({
      signals: Object.keys(SIGNAL_TYPES).map((type) => ({ type, daysAgo: 0, inDays: 60, note: "" })),
    });
    const t = timing(many, 45);
    expect(t.score).toBeLessThanOrEqual(100);
    expect(t.score).toBeGreaterThan(90);
    expect(timing(acct(), 45).score).toBe(0);
  });

  it("a shorter half-life lowers timing for old signals", () => {
    const a = acct({ signals: [{ type: "finance_leader_hired", daysAgo: 60, note: "" }] });
    expect(timing(a, 20).score).toBeLessThan(timing(a, 90).score);
  });
});

describe("play selection", () => {
  it("picks welcome back for US Ramp customers first", () => {
    const a = acct({ signals: [{ type: "us_ramp_alumni", kind: "entity", note: "" }, { type: "incumbent_renewal", inDays: 60, note: "" }] });
    const p = choosePlay(a);
    expect(p.primary).toBe("welcome_back");
    expect(p.alternates).toContain("renewal_displacement");
  });

  it("falls back to the next play when one is disabled", () => {
    const a = acct({ signals: [{ type: "us_ramp_alumni", kind: "entity", note: "" }, { type: "incumbent_renewal", inDays: 60, note: "" }] });
    expect(choosePlay(a, ["welcome_back"]).primary).toBe("renewal_displacement");
  });

  it("sends small simple accounts to self-serve unless an accountant referred them", () => {
    const small = acct({ employees: 12, monthlySpendGBP: 8000, incumbent: "Spreadsheets" });
    expect(choosePlay(small).primary).toBe("self_serve");
    const referred = { ...small, signals: [{ type: "accountant_referral", daysAgo: 5, note: "" }] };
    expect(choosePlay(referred).primary).toBe("partner_led");
  });

  it("routes each play to the right motion lane", () => {
    expect(scoreAccount(acct({ employees: 12, monthlySpendGBP: 8000, incumbent: "Spreadsheets", signals: [{ type: "pricing_page_visit", daysAgo: 0, note: "" }] })).motion.lane).toBe("digital");
    expect(scoreAccount(acct({ employees: 1500, signals: [{ type: "finance_leader_hired", daysAgo: 5, note: "" }] })).motion.lane).toBe("ae");
    expect(scoreAccount(acct({ signals: [{ type: "finance_leader_hired", daysAgo: 5, note: "" }] })).motion.lane).toBe("sdr");
  });
});

describe("drafts", () => {
  it("uses the account's own signal, ledger and tool", () => {
    const a = acct({ signals: [{ type: "incumbent_renewal", inDays: 60, note: "Pleo renews in December." }] });
    const d = draft(a, "renewal_displacement", timing(a, 45).contributions);
    expect(d).toMatch(/Before the Pleo decision/);
    expect(d).toMatch(/Pleo renews in December\. Before/);
    expect(d).toMatch(/Xero/);
  });

  it("does not promise a sync for unsupported ledgers", () => {
    const a = acct({ accounting: "Sage 50", signals: [{ type: "finance_leader_hired", daysAgo: 3, note: "New CFO" }] });
    const d = draft(a, "new_finance_leader", timing(a, 45).contributions);
    expect(d).toMatch(/confirm the Sage 50 setup/);
    expect(d).not.toMatch(/goes into Sage 50/);
  });

  it("writes a different welcome-back note for a person who used Ramp before", () => {
    const person = acct({ signals: [{ type: "us_ramp_alumni", kind: "person", note: "" }] });
    const entity = acct({ signals: [{ type: "us_ramp_alumni", kind: "entity", note: "" }] });
    expect(draft(person, "welcome_back", [])).toMatch(/You ran Ramp at your last company/);
    expect(draft(entity, "welcome_back", [])).toMatch(/UK entity can join your US team/);
  });
});

describe("levers", () => {
  it("clamps out-of-range values and drops unknown plays", () => {
    const lv = normaliseLevers({ fitWeight: 3, sdrs: -4, weeks: 99, halfLifeDays: "abc", disabledPlays: ["welcome_back", "nope", 5] });
    expect(lv.fitWeight).toBe(1);
    expect(lv.sdrs).toBe(0);
    expect(lv.weeks).toBe(4);
    expect(lv.halfLifeDays).toBe(DEFAULT_LEVERS.halfLifeDays);
    expect(lv.disabledPlays).toEqual(["welcome_back"]);
  });
});

describe("capacity plan", () => {
  it("is deterministic", () => {
    expect(plan(ACCOUNTS)).toEqual(plan(ACCOUNTS));
  });

  it("never fills a lane past its weekly capacity", () => {
    for (const levers of [{}, { sdrs: 1, aes: 1 }, { sdrs: 6, accountsPerSdr: 10, weeks: 3 }]) {
      const p = plan(ACCOUNTS, levers);
      for (const w of p.weeks) for (const lane of ["sdr", "ae", "partner"] as const) expect(w.used[lane]).toBeLessThanOrEqual(w.cap[lane]);
    }
  });

  it("assigns every actionable account a week or lists it as overflow", () => {
    const p = plan(ACCOUNTS, { sdrs: 1, aes: 1, weeks: 1 });
    const actionable = p.ranked.filter((s) => !["Blocked", "Nurture", "Suppressed"].includes(s.tier));
    const assigned = actionable.filter((s) => s.assignment?.week);
    const overflow = actionable.filter((s) => s.assignment?.owner === "Overflow");
    expect(assigned.length + overflow.length).toBe(actionable.length);
    expect(p.overflow.length).toBe(overflow.length);
    expect(p.overflow.length).toBeGreaterThan(0);
    expect(p.bottleneck).toMatch(/Prospecting capacity/);
  });

  it("fills higher priority accounts first within a lane", () => {
    const p = plan(ACCOUNTS, { sdrs: 1, accountsPerSdr: 2, weeks: 1 });
    const sdr = p.ranked.filter((s) => s.motion.lane === "sdr" && s.tier !== "Blocked" && s.tier !== "Nurture");
    const firstOverflow = sdr.findIndex((s) => s.assignment?.owner === "Overflow");
    expect(sdr.slice(0, firstOverflow).every((s) => s.assignment?.week === 1)).toBe(true);
    expect(sdr.slice(firstOverflow).every((s) => s.assignment?.owner === "Overflow")).toBe(true);
  });

  it("flags AE meeting capacity when AEs cannot take the expected meetings", () => {
    const p = plan(ACCOUNTS, { meetingsPerAe: 1, aes: 1, sdrs: 8, accountsPerSdr: 10 });
    expect(p.weeks[0].aeOverloaded).toBe(true);
    expect(p.bottleneck).toBe("AE meeting capacity");
  });

  it("holds blocked accounts and ranks by priority", () => {
    const p = plan(ACCOUNTS);
    const blocked = p.ranked.filter((s) => s.tier === "Blocked");
    expect(blocked.map((s) => s.id).sort()).toEqual(["A11", "A19"]);
    expect(blocked.every((s) => !s.assignment)).toBe(true);
    for (let i = 1; i < p.ranked.length; i++) expect(p.ranked[i - 1].priority).toBeGreaterThanOrEqual(p.ranked[i].priority);
  });

  it("moves an account up when a fresh signal is logged", () => {
    const target = "A21";
    const before = plan(ACCOUNTS).ranked.find((s) => s.id === target)!;
    const boosted = ACCOUNTS.map((a) => (a.id === target ? { ...a, signals: [{ type: "finance_leader_hired", daysAgo: 0, note: "" }, ...a.signals] } : a));
    const after = plan(boosted).ranked.find((s) => s.id === target)!;
    expect(before.tier).toBe("Nurture");
    expect(after.rank).toBeLessThan(before.rank);
    expect(after.play).toBe("new_finance_leader");
  });

  it("every play has a cited public source", () => {
    for (const p of Object.values(PLAYS)) expect(p.proof.source.url).toMatch(/^https:\/\//);
  });
});

describe("validateAccount", () => {
  it("accepts a well-formed account and fills defaults", () => {
    const v = validateAccount({ name: " Harbourline ", employees: 80, monthlySpendGBP: 40000, gbpShare: 0.95, accounting: "QuickBooks", signals: [{ type: "funding_round", daysAgo: 12 }] });
    expect(v.errors).toBeUndefined();
    expect(v.account?.name).toBe("Harbourline");
    expect(v.account?.entities).toBe(1);
    expect(v.account?.incumbent).toBe("Spreadsheets");
    expect(v.account?.signals[0]).toMatchObject({ type: "funding_round", daysAgo: 12 });
  });

  it("rejects bad input with specific messages", () => {
    const v = validateAccount({ name: "", employees: 1.5, monthlySpendGBP: -1, gbpShare: 2, accounting: "Excel", signals: [{ type: "bogus" }, null] });
    expect(v.account).toBeUndefined();
    const msg = v.errors!.join(" | ");
    for (const part of ["name is required", "employees", "monthlySpendGBP", "gbpShare", "accounting must be one of", "unknown signal type bogus"]) expect(msg).toContain(part);
    expect(validateAccount(null).errors).toEqual(["account must be an object"]);
  });

  it("caps signal count and clamps ages", () => {
    expect(validateAccount({ name: "X", employees: 5, monthlySpendGBP: 1, gbpShare: 1, accounting: "Xero", signals: Array(13).fill({ type: "funding_round" }) }).errors).toContain("at most 12 signals");
    const v = validateAccount({ name: "X", employees: 5, monthlySpendGBP: 1, gbpShare: 1, accounting: "Xero", signals: [{ type: "incumbent_renewal", inDays: 9999 }] });
    expect(v.account?.signals[0].inDays).toBe(730);
  });
});
