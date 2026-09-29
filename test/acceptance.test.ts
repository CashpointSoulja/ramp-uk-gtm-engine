// Acceptance cases from docs/ACCEPTANCE_CASES.md. Each test name starts with its case ID.
import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "../public/data.js";
import { ASSUMPTIONS, OPT_OUT_LINE, OWNERSHIP_RULES, addBusinessDays, contactRules, ownershipKey, plan, scoreAccount, validateAccount } from "../public/engine.js";

type Acct = (typeof ACCOUNTS)[number];
const book = plan(ACCOUNTS);
const row = (p: ReturnType<typeof plan>, id: string) => {
  const s = p.ranked.find((x) => x.id === id);
  if (!s) throw new Error(`missing ${id}`);
  return s;
};
const withAccount = (id: string, f: (a: Acct) => Acct) => ACCOUNTS.map((a) => (a.id === id ? f(a) : a));
const base: Acct = { ...ACCOUNTS.find((a) => a.id === "A01")!, id: "T1", name: "Test Co", signals: [{ type: "finance_leader_hired", daysAgo: 5, note: "New CFO" }] };

describe("acceptance cases", () => {
  it("AC-01 ranks the book deterministically: same input, same plan", () => {
    expect(JSON.stringify(plan(ACCOUNTS))).toBe(JSON.stringify(book));
    expect(book.ranked.map((s) => s.id).slice(0, 5)).toEqual(["A12", "A02", "A01", "A05", "A24"]);
  });

  it("AC-02 holds accounts without a UK entity or with under 50% GBP spend, with no play or owner", () => {
    for (const id of ["A19", "A11"]) {
      const s = row(book, id);
      expect(s.tier).toBe("Blocked");
      expect(s.play).toBeNull();
      expect(s.assignment).toBeUndefined();
    }
    expect(row(book, "A19").gates.join(" ")).toMatch(/No UK entity/);
    expect(row(book, "A11").gates.join(" ")).toMatch(/40% of spend is in GBP/);
  });

  it("AC-03 suppresses an opted-out account from every lane, with no draft or sequence", () => {
    const s = row(book, "A14");
    expect(s.tier).toBe("Suppressed");
    expect(s.play).toBeNull();
    expect(s.draft).toBeNull();
    expect(s.sequence).toEqual([]);
    expect(s.assignment).toBeUndefined();
    expect(s.contact.suppression).toMatch(/Opted out of marketing on 2026-09-21/);
  });

  it("AC-04 an opt-out recorded mid-plan removes the account from its week and lowers expected meetings", () => {
    const before = row(book, "A10");
    expect(before.assignment?.week).toBe(1);
    const after = plan(withAccount("A10", (a) => ({ ...a, contact: { optedOut: true } })));
    expect(row(after, "A10").tier).toBe("Suppressed");
    expect(after.weeks[0].accounts).not.toContain("A10");
    expect(after.weeks[0].expectedMeetings).toBeLessThan(book.weeks[0].expectedMeetings);
  });

  it("AC-05 does not email a partnership or sole trader without consent; suppresses it if no channel is left", () => {
    const s = row(book, "A26");
    expect(contactRules(s.account).subscriber).toBe("individual");
    expect(s.tier).toBe("Suppressed");
    expect(s.contact.suppression).toMatch(/No permitted channel/);
    const consented = row(book, "A08");
    expect(consented.account.legalForm).toBe("Sole trader");
    expect(consented.tier).not.toBe("Suppressed");
    expect(consented.draft).toContain(OPT_OUT_LINE);
  });

  it("AC-06 an SDR account without email consent gets a call-only sequence and no email draft", () => {
    const s = scoreAccount({ ...base, legalForm: "Sole trader" });
    expect(s.play).not.toBeNull();
    expect(s.sequence.map((x) => x.channel)).toEqual(["Call"]);
    expect(s.draft).toBeNull();
    expect(s.draftNote).toMatch(/no email draft/);
  });

  it("AC-07 treats a Scottish partnership and an LLP as corporate subscribers", () => {
    expect(contactRules({ ...base, legalForm: "Scottish partnership" }).email).toBe(true);
    expect(contactRules({ ...base, legalForm: "LLP" }).email).toBe(true);
    expect(row(book, "A06").sequence.some((x) => x.channel === "Email")).toBe(true);
  });

  it("AC-08 drops call steps for a number on the CTPS/TPS but keeps the account", () => {
    const s = row(book, "A29");
    expect(s.tier).toBe("P2");
    expect(s.sequence.some((x) => x.channel === "Call")).toBe(false);
    expect(s.sequence.some((x) => x.channel === "Email")).toBe(true);
  });

  it("AC-09 every email draft in the book carries the opt-out line", () => {
    const drafts = book.ranked.filter((s) => s.draft);
    expect(drafts.length).toBeGreaterThan(10);
    for (const s of drafts) expect(s.draft).toContain(OPT_OUT_LINE);
  });

  it("AC-10 a new finance-leader signal moves Greyline Architects from nurture to P2 with the First 90 days play", () => {
    const next = plan(withAccount("A21", (a) => ({ ...a, signals: [{ type: "finance_leader_hired", daysAgo: 0, note: "New CFO" }, ...a.signals] })));
    expect(row(book, "A21")).toMatchObject({ rank: 28, tier: "Nurture" });
    expect(row(next, "A21")).toMatchObject({ rank: 11, tier: "P2", play: "new_finance_leader" });
  });

  it("AC-11 cutting AE meeting capacity surfaces AE meeting capacity as the bottleneck", () => {
    expect(book.bottleneck).toMatch(/^Pipeline volume/);
    expect(plan(ACCOUNTS, { meetingsPerAe: 1 }).bottleneck).toBe("AE meeting capacity");
  });

  it("AC-12 cutting headcount pushes ready accounts into overflow instead of dropping them", () => {
    const p = plan(ACCOUNTS, { aes: 1 });
    expect(p.overflow.length).toBe(3);
    expect(p.bottleneck).toMatch(/^Prospecting capacity/);
    for (const id of p.overflow) expect(row(p, id).assignment?.owner).toBe("Overflow");
  });

  it("AC-13 turning off a play moves its accounts to their next-best play", () => {
    const p = plan(ACCOUNTS, { disabledPlays: ["welcome_back"] });
    expect(p.playMix.welcome_back).toBeUndefined();
    expect(row(p, "A12").play).toBe("renewal_displacement");
    expect(row(p, "A02").play).toBe("ai_spend");
  });

  it("AC-14 flags Sage 50 and does not promise a sync in the draft", () => {
    const s = row(book, "A06");
    expect(s.fit.flags.join(" ")).toMatch(/Sage 50 is not on Ramp's UK integration list/);
    expect(s.draft).toMatch(/we'd confirm the Sage 50 setup first/);
  });

  it("AC-15 rejects malformed user accounts with specific messages", () => {
    const v = validateAccount({ name: "", employees: 0, monthlySpendGBP: -1, gbpShare: 2, accounting: "Tally", legalForm: "Trust", contact: { optedOut: "yes" } });
    expect(v.account).toBeUndefined();
    expect(v.errors).toEqual(
      expect.arrayContaining([
        "name is required",
        expect.stringMatching(/^employees/),
        expect.stringMatching(/^gbpShare/),
        expect.stringMatching(/^legalForm must be one of/),
        "contact.optedOut must be true or false",
      ]),
    );
  });

  it("AC-16 labels every non-sourced number as a synthetic assumption or policy choice", () => {
    const ids = ASSUMPTIONS.map((a) => a.id);
    for (const id of ["meeting_rates", "opp_rate", "capacity", "signal_weights", "half_life", "timing_multiplier"]) expect(ids).toContain(id);
    for (const a of ASSUMPTIONS) expect(["synthetic", "policy"]).toContain(a.kind);
    expect(ASSUMPTIONS.find((a) => a.id === "capacity")?.note).toMatch(/Not a description of any real team/);
    expect(book.assumptions.synthetic).toBe(true);
  });

  it("AC-17 a duplicate of an owned account gets no second owner, week, sequence or draft", () => {
    const dup: Acct = { ...ACCOUNTS.find((a) => a.id === "A12")!, id: "U1", name: "Orbital Ledger Ltd" };
    const p = plan([...ACCOUNTS, dup]);
    const d = row(p, "U1");
    expect(d.tier).toBe("Duplicate");
    expect(d.assignment).toBeUndefined();
    expect(d.sla).toBeNull();
    expect(d.sequence).toEqual([]);
    expect(d.draft).toBeNull();
    expect(d.ownership).toMatchObject({ status: "duplicate", duplicateOf: "A12", owner: "AE 1", matchedOn: "normalised name" });
    expect(row(p, "A12").assignment).toEqual(row(book, "A12").assignment);
    expect(p.weeks[0].accounts).toEqual(book.weeks[0].accounts);
    expect(p.weeks[0].expectedMeetings).toBe(book.weeks[0].expectedMeetings);
    expect(p.duplicates).toEqual([{ id: "U1", duplicateOf: "A12", owner: "AE 1" }]);
  });

  it("AC-18 matches duplicates on Companies House number, then domain, then normalised name", () => {
    const a = { ...base, name: "Alpha Ltd" };
    expect(ownershipKey({ ...a, companyNumber: "sc123456", domain: "alpha.co.uk" }).key).toBe("ch:SC123456");
    expect(ownershipKey({ ...a, domain: "https://www.Alpha.co.uk/about" }).key).toBe("web:alpha.co.uk");
    expect(ownershipKey({ ...a, name: "The Alpha Group Limited" }).key).toBe(ownershipKey(a).key);
    const p = plan([...ACCOUNTS, { ...base, id: "U1", name: "Totally Different Name", domain: "x.io" }, { ...base, id: "U2", name: "Another Name", domain: "www.x.io" }]);
    expect(row(p, "U2").ownership.status === "duplicate" || row(p, "U1").ownership.status === "duplicate").toBe(true);
  });

  it("AC-19 an existing CRM owner keeps the account and is never replaced by round-robin", () => {
    const s = row(book, "A24");
    expect(s.account.existingOwner?.name).toBe("AE 2");
    expect(s.assignment).toEqual({ week: 1, owner: "AE 2" });
    expect(s.ownership.status).toBe("existing_owner");
    for (const lv of [{ aes: 1 }, { aes: 4 }, { disabledPlays: ["welcome_back"] }]) {
      const p = plan(ACCOUNTS, lv);
      expect(row(p, "A24").ownership.owner).toBe("AE 2");
      if (row(p, "A24").assignment) expect(row(p, "A24").assignment?.owner).toBe("AE 2");
    }
  });

  it("AC-20 an existing owner on a lower-priority duplicate takes precedence over the higher-priority record", () => {
    const owned: Acct = { ...ACCOUNTS.find((a) => a.id === "A12")!, id: "U1", name: "Orbital Ledger Limited", signals: [], existingOwner: { name: "SDR 2", since: "2026-08-01" } };
    const p = plan([...ACCOUNTS, owned]);
    expect(row(p, "U1").ownership).toMatchObject({ status: "existing_owner", owner: "SDR 2" });
    expect(row(p, "A12")).toMatchObject({ tier: "Duplicate", ownership: { duplicateOf: "U1", owner: "SDR 2" } });
    expect(row(p, "A12").assignment).toBeUndefined();
  });

  it("AC-21 conflicting owners on duplicates: the earliest claim keeps it and RevOps is flagged", () => {
    const rival: Acct = { ...ACCOUNTS.find((a) => a.id === "A24")!, id: "U1", name: "Sparrowhawk Labs Limited", existingOwner: { name: "SDR 1", since: "2026-09-20" } };
    const p = plan([...ACCOUNTS, rival]);
    expect(row(p, "A24").assignment?.owner).toBe("AE 2");
    expect(row(p, "U1")).toMatchObject({ tier: "Duplicate", ownership: { owner: "AE 2" } });
    expect(p.conflicts).toHaveLength(1);
    expect(p.conflicts[0].conflict).toMatch(/earliest claim keeps it/);
  });

  it("AC-22 every company has at most one owner in every plan", () => {
    const extra: Acct[] = [
      { ...ACCOUNTS.find((a) => a.id === "A12")!, id: "U1", name: "Orbital Ledger Ltd" },
      { ...ACCOUNTS.find((a) => a.id === "A01")!, id: "U2", name: "LARKSPUR HEALTH LIMITED", existingOwner: { name: "SDR 2", since: "2026-07-01" } },
    ];
    for (const lv of [{}, { sdrs: 1, aes: 1 }, { sdrs: 6, aes: 6, weeks: 4 }]) {
      const p = plan([...ACCOUNTS, ...extra], lv);
      const owners = new Map<string, Set<string>>();
      for (const s of p.ranked) if (s.assignment) owners.set(s.ownership.key, new Set([...(owners.get(s.ownership.key) ?? []), s.assignment.owner]));
      for (const set of owners.values()) expect(set.size).toBe(1);
      const assignedPerKey = new Map<string, number>();
      for (const s of p.ranked) if (s.assignment) assignedPerKey.set(s.ownership.key, (assignedPerKey.get(s.ownership.key) ?? 0) + 1);
      for (const n of assignedPerKey.values()) expect(n).toBe(1);
    }
  });

  it("AC-23 an opt-out on any record suppresses every record of that company", () => {
    const dup: Acct = { ...ACCOUNTS.find((a) => a.id === "A12")!, id: "U1", name: "Orbital Ledger Ltd", contact: { optedOut: true, optedOutOn: "2026-09-28" } };
    const p = plan([...ACCOUNTS, dup]);
    expect(row(p, "A12").tier).toBe("Suppressed");
    expect(row(p, "A12").assignment).toBeUndefined();
    expect(row(p, "U1").tier).toBe("Duplicate");
  });

  it("AC-24 gives each assigned account one owner and a deterministic first-touch SLA", () => {
    expect(row(book, "A12").sla).toEqual({ owner: "AE 1", tier: "P1", weekStart: "2026-09-29", businessDays: 1, firstTouchBy: "2026-09-30" });
    const p2 = book.ranked.find((s) => s.tier === "P2" && s.assignment?.week === 1)!;
    expect(p2.sla?.firstTouchBy).toBe("2026-10-01");
    const wk2 = plan(ACCOUNTS, { sdrs: 1, aes: 1 }).ranked.find((s) => s.assignment?.week === 2 && s.tier === "P3");
    if (wk2) expect(wk2.sla).toMatchObject({ weekStart: "2026-10-06", firstTouchBy: "2026-10-09" });
    expect(addBusinessDays("2026-10-02", 1)).toBe("2026-10-05");
    for (const s of book.ranked) {
      if (s.assignment?.week) expect(s.sla?.owner).toBe(s.assignment.owner);
      else expect(s.sla).toBeNull();
    }
    expect(OWNERSHIP_RULES.map((r) => r.id)).toEqual(expect.arrayContaining(["one_owner", "existing_owner_wins", "duplicate_no_owner", "first_touch_sla"]));
  });

  it("AC-25 rejects malformed ownership fields", () => {
    const v = validateAccount({ ...base, companyNumber: "123", domain: "not a domain", existingOwner: { name: "" } });
    expect(v.errors).toEqual(expect.arrayContaining([expect.stringMatching(/^companyNumber/), expect.stringMatching(/^domain/), expect.stringMatching(/^existingOwner.name/)]));
    expect(validateAccount({ ...base, existingOwner: { name: "AE 9", since: "yesterday" } }).errors).toEqual(["existingOwner.since must be YYYY-MM-DD"]);
  });
});
