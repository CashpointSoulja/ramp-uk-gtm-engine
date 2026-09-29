// Acceptance cases from docs/ACCEPTANCE_CASES.md. Each test name starts with its case ID.
import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "../public/data.js";
import { ASSUMPTIONS, OPT_OUT_LINE, contactRules, plan, scoreAccount, validateAccount } from "../public/engine.js";

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
});
