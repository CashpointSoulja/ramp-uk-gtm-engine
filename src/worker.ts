import { ACCOUNTS, AS_OF, SIGNAL_TYPES } from "../public/data.js";
import { ASSUMPTIONS, DEFAULT_LEVERS, LEGAL_FORMS, PLAYS, SOURCES, plan, scoreAccount, validateAccount } from "../public/engine.js";
import { EVENTS, EVENT_EXAMPLES, METRICS } from "../public/events.js";

interface Env {
  ASSETS: Fetcher;
}

const MAX_BODY_BYTES = 64_000;
const MAX_EXTRA_ACCOUNTS = 50;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function readBody(request: Request): Promise<Record<string, unknown> | string> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return "body too large";
  if (!text.trim()) return {};
  try {
    const b = JSON.parse(text);
    return typeof b === "object" && b !== null && !Array.isArray(b) ? (b as Record<string, unknown>) : "body must be a JSON object";
  } catch {
    return "invalid JSON body";
  }
}

const playCatalogue = () =>
  Object.entries(PLAYS).map(([id, p]) => ({ id, name: p.name, summary: p.summary, persona: p.persona, meetingRate: p.meetingRate, proof: p.proof }));

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/health") return json({ ok: true, engine: "deterministic", accounts: ACCOUNTS.length, asOf: AS_OF });

    if (pathname === "/api/meta" && request.method === "GET")
      return json({
        asOf: AS_OF,
        accounts: ACCOUNTS,
        signalTypes: SIGNAL_TYPES,
        plays: playCatalogue(),
        defaultLevers: DEFAULT_LEVERS,
        legalForms: LEGAL_FORMS,
        assumptions: ASSUMPTIONS,
        sources: SOURCES,
      });

    if (pathname === "/api/events" && request.method === "GET") return json({ events: EVENTS, examples: EVENT_EXAMPLES, metrics: METRICS });

    if (pathname === "/api/plan" && request.method === "POST") {
      const b = await readBody(request);
      if (typeof b === "string") return json({ error: b }, 400);
      const extra = b.extraAccounts === undefined ? [] : b.extraAccounts;
      if (!Array.isArray(extra) || extra.length > MAX_EXTRA_ACCOUNTS)
        return json({ error: `'extraAccounts' must be an array of up to ${MAX_EXTRA_ACCOUNTS} accounts` }, 400);
      const added = [];
      for (const [i, raw] of extra.entries()) {
        const v = validateAccount(raw);
        if (!v.account) return json({ error: `extraAccounts[${i}]: ${v.errors.join("; ")}` }, 400);
        added.push({ ...v.account, id: `X${String(i + 1).padStart(2, "0")}` });
      }
      const levers = typeof b.levers === "object" && b.levers !== null ? (b.levers as Record<string, unknown>) : {};
      return json(plan([...ACCOUNTS, ...added], levers));
    }

    if (pathname === "/api/score" && request.method === "POST") {
      const b = await readBody(request);
      if (typeof b === "string") return json({ error: b }, 400);
      const v = validateAccount(b.account);
      if (!v.account) return json({ error: v.errors.join("; ") }, 400);
      const levers = typeof b.levers === "object" && b.levers !== null ? (b.levers as Record<string, unknown>) : {};
      return json(scoreAccount(v.account, levers));
    }

    if (pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
