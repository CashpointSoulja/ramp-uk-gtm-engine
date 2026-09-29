import { describe, expect, it } from "vitest";
import worker from "../src/worker";

const env = { ASSETS: { fetch: async () => new Response("asset", { status: 200 }) } } as unknown as { ASSETS: Fetcher };
const call = (path: string, init?: RequestInit) => worker.fetch(new Request(`https://x.test${path}`, init) as never, env);
const post = (path: string, body: unknown) => call(path, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

describe("worker API", () => {
  it("reports health", async () => {
    const r = await call("/api/health");
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, engine: "deterministic", accounts: 30 });
  });

  it("serves meta with plays and default levers", async () => {
    const b = (await (await call("/api/meta")).json()) as { plays: unknown[]; accounts: unknown[]; defaultLevers: object };
    expect(b.plays).toHaveLength(9);
    expect(b.accounts).toHaveLength(30);
    expect(b.defaultLevers).toHaveProperty("fitWeight");
  });

  it("plans with custom levers and extra accounts", async () => {
    const r = await post("/api/plan", {
      levers: { sdrs: 4, weeks: 3 },
      extraAccounts: [{ name: "Harbourline", employees: 90, monthlySpendGBP: 50000, gbpShare: 1, accounting: "Xero", signals: [{ type: "funding_round", daysAgo: 3 }] }],
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as { ranked: { id: string; account: { name: string } }[]; weeks: unknown[]; levers: { sdrs: number } };
    expect(b.weeks).toHaveLength(3);
    expect(b.levers.sdrs).toBe(4);
    expect(b.ranked.find((s) => s.id === "X01")?.account.name).toBe("Harbourline");
  });

  it("scores a single account", async () => {
    const r = await post("/api/score", { account: { name: "Solo", employees: 300, monthlySpendGBP: 150000, gbpShare: 0.9, accounting: "NetSuite", incumbent: "Soldo", signals: [{ type: "incumbent_renewal", inDays: 60 }] } });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ play: "renewal_displacement", motion: { lane: "ae" } });
  });

  it("rejects invalid input", async () => {
    expect((await post("/api/plan", "{nope")).status).toBe(400);
    expect((await post("/api/plan", [1, 2])).status).toBe(400);
    expect((await post("/api/plan", { extraAccounts: "x" })).status).toBe(400);
    expect((await post("/api/plan", { extraAccounts: Array(51).fill({}) })).status).toBe(400);
    expect((await post("/api/plan", "x".repeat(70_000))).status).toBe(400);
    const bad = await post("/api/score", { account: { name: "Y" } });
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { error: string }).error).toMatch(/employees/);
  });

  it("404s unknown API routes and serves assets otherwise", async () => {
    expect((await call("/api/nope")).status).toBe(404);
    expect(await (await call("/")).text()).toBe("asset");
  });

  it("serves the event taxonomy with examples and metrics", async () => {
    const r = await call("/api/events");
    expect(r.status).toBe(200);
    const b = (await r.json()) as { events: object; examples: unknown[]; metrics: unknown[] };
    expect(Object.keys(b.events)).toContain("opt_out_recorded");
    expect(b.examples.length).toBe(Object.keys(b.events).length);
    expect(b.metrics.length).toBeGreaterThan(0);
  });

  it("exposes the assumption register in meta", async () => {
    const b = (await (await call("/api/meta")).json()) as { assumptions: { kind: string }[]; legalForms: string[] };
    expect(b.assumptions.every((a) => a.kind === "synthetic" || a.kind === "policy")).toBe(true);
    expect(b.legalForms).toContain("Sole trader");
  });

  it("applies contact rules to scored accounts and rejects bad contact flags", async () => {
    const ok = await post("/api/score", { account: { name: "Optout Ltd", employees: 100, monthlySpendGBP: 50000, gbpShare: 1, accounting: "Xero", contact: { optedOut: true }, signals: [{ type: "funding_round", daysAgo: 2 }] } });
    expect(((await ok.json()) as { tier: string }).tier).toBe("Suppressed");
    const bad = await post("/api/score", { account: { name: "X", employees: 10, monthlySpendGBP: 1000, gbpShare: 1, accounting: "Xero", contact: { ctps: "no" } } });
    expect(bad.status).toBe(400);
  });

  it("flags a scored account that duplicates the book instead of giving it an owner", async () => {
    const r = await post("/api/score", { account: { name: "Orbital Ledger Limited", employees: 320, monthlySpendGBP: 240000, gbpShare: 0.76, accounting: "NetSuite", incumbent: "Spendesk", signals: [{ type: "funding_round", daysAgo: 3 }] } });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ tier: "Duplicate", ownership: { status: "duplicate", duplicateOf: "A12", owner: "AE 1" } });
  });

  it("keeps existing owners and returns SLAs and duplicates from /api/plan", async () => {
    const r = await post("/api/plan", { extraAccounts: [{ name: "Sparrowhawk Labs Ltd", employees: 32, monthlySpendGBP: 42000, gbpShare: 0.5, accounting: "Xero", existingOwner: { name: "SDR 1", since: "2026-09-25" } }] });
    const b = (await r.json()) as { duplicates: { id: string; owner: string }[]; conflicts: unknown[]; ranked: { id: string; sla: { firstTouchBy: string } | null; assignment?: { owner: string } }[] };
    expect(b.duplicates).toEqual([{ id: "X01", duplicateOf: "A24", owner: "AE 2" }]);
    expect(b.conflicts).toHaveLength(1);
    expect(b.ranked.find((s) => s.id === "A24")?.assignment?.owner).toBe("AE 2");
    expect(b.ranked.find((s) => s.id === "A12")?.sla?.firstTouchBy).toBe("2026-09-30");
    const bad = await post("/api/plan", { extraAccounts: [{ name: "Z", employees: 5, monthlySpendGBP: 1000, gbpShare: 1, accounting: "Xero", existingOwner: { name: "" } }] });
    expect(bad.status).toBe(400);
  });

  it("serves the ownership rules in meta", async () => {
    const b = (await (await call("/api/meta")).json()) as { ownershipRules: { id: string }[]; firstTouchSlaBusinessDays: Record<string, number> };
    expect(b.ownershipRules.map((x) => x.id)).toContain("existing_owner_wins");
    expect(b.firstTouchSlaBusinessDays).toEqual({ P1: 1, P2: 2, P3: 3 });
  });
});
