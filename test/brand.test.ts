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

  it("shows the Ramp mark only beside an independence notice, with no wordmark or proprietary font", () => {
    expect(html).toContain('aria-label="Ramp mark"');
    expect(html).toContain("Not an official Ramp product, and not affiliated with or endorsed by Ramp.");
    expect(html).toContain("Ramp, the Ramp name and the Ramp mark belong to Ramp.");
    expect(html.indexOf('class="notice"')).toBeLessThan(html.indexOf('class="top"'));
    expect(html).not.toMatch(/M5\.098 6\.736/);
    expect(html).not.toMatch(/<img[^>]*ramp/i);
    expect(css).not.toMatch(/lausanne/i);
    expect(html).not.toMatch(/lausanne/i);
    expect(css).toMatch(/font-family: "Inter", Arial, sans-serif/);
    expect(css).toContain('url("/fonts/inter-latin-wght-normal.woff2")');
  });

  it("uses the observed hero and section scale", () => {
    expect(css).toMatch(/\.hero h1 \{ font-size: 64px; line-height: 64px;/);
    expect(css).toMatch(/\.hero h1 \{ font-size: 40px; line-height: 42px;/);
    expect(css).toMatch(/\.vhead h2 \{ font-size: 40px; line-height: 42px;/);
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
