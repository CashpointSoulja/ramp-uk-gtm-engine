import { describe, expect, it } from "vitest";
import { EVENTS, EVENT_EXAMPLES, METRICS, makeEvent, validateEvent } from "../public/events.js";

describe("event taxonomy", () => {
  it("has one valid example payload per event", () => {
    expect(EVENT_EXAMPLES.map((e) => e.event).sort()).toEqual(Object.keys(EVENTS).sort());
    for (const e of EVENT_EXAMPLES) expect(validateEvent(e)).toEqual([]);
  });

  it("rejects unknown events, wrong types, missing and extra props", () => {
    expect(validateEvent({ event: "nope", v: 1, ts: "2026-09-29T00:00:00Z", props: {} })).toEqual(["unknown event nope"]);
    const errs = validateEvent({ event: "lever_changed", v: 2, ts: "yesterday", props: { lever: "aes", from: "2", extra: 1 } });
    expect(errs).toEqual(
      expect.arrayContaining(["v must be 1", "ts must be an ISO timestamp", "lever_changed.from must be number", "lever_changed.to must be number", "lever_changed.extra is not in the taxonomy"]),
    );
  });

  it("makeEvent stamps version and time and throws on invalid props", () => {
    const e = makeEvent("draft_copied", { accountId: "A12", playId: "welcome_back" }, new Date("2026-09-29T09:00:00Z"));
    expect(e).toEqual({ event: "draft_copied", v: 1, ts: "2026-09-29T09:00:00.000Z", props: { accountId: "A12", playId: "welcome_back" } });
    expect(() => makeEvent("draft_copied", { accountId: "A12" })).toThrow(/playId/);
  });

  it("defines every metric with a numerator, denominator and grain", () => {
    expect(METRICS.length).toBeGreaterThanOrEqual(8);
    for (const m of METRICS) for (const k of ["numerator", "denominator", "grain", "use"] as const) expect(m[k].length).toBeGreaterThan(3);
  });
});
