import { describe, expect, it } from "vitest";
import html from "../public/index.html?raw";
import { readFileSync } from "node:fs";
import sheet from "../docs/BRAND_SHEET.md?raw";
import readme from "../README.md?raw";

const css = readFileSync("public/style.css", "utf8");

describe("brand guardrails", () => {
  it("keeps the independent-concept, synthetic-data and non-affiliation notices", () => {
    expect(html).toContain("Independent concept by Ayo Ahmed · not affiliated with Ramp · synthetic accounts");
    expect(html).toContain("Not affiliated with, endorsed by or built with data from Ramp.");
    expect(html).toMatch(/Every company, signal and number in the queue is synthetic/);
  });

  it("uses no Ramp logo, wordmark image or proprietary font", () => {
    expect(html).not.toMatch(/<img[^>]*ramp/i);
    expect(css).not.toMatch(/lausanne/i);
    expect(html).not.toMatch(/lausanne/i);
    expect(css).toMatch(/font-family: "Inter", Arial, sans-serif/);
    expect(css).toContain('url("/fonts/inter-latin-wght-normal.woff2")');
  });

  it("implements the adapted tokens from the brand sheet", () => {
    for (const [name, value] of [["--ink", "#0c0a08"], ["--surface", "#f4f2f0"], ["--line", "#d2cecb"], ["--accent", "#e4f222"], ["--dark", "#1a1919"], ["--r-cta", "6px"], ["--r", "12px"]]) {
      expect(css).toContain(`${name}: ${value};`);
      expect(sheet).toContain(value);
    }
  });

  it("documents observed and adapted tokens separately and is linked from the README", () => {
    expect(sheet).toMatch(/## 1\. Observed tokens[\s\S]*## 2\. Adapted product tokens/);
    expect(readme).toContain("(docs/BRAND_SHEET.md)");
  });
});
