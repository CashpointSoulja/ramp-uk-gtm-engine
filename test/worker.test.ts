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
});
