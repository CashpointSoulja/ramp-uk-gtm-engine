# Brand sheet and design template

This sheet sets the look of the GTM Engine UI. It has two parts, kept separate on purpose:

1. **Observed tokens.** What Ramp's public UK pages use, measured from the live pages. This is a record of what the pages use. It is not a Ramp brand guideline, and Ramp didn't supply or approve it.
2. **Adapted product tokens.** What this concept uses, and why each value differs where it does. `public/style.css` implements these as CSS custom properties.

**Independent concept.** This UI is independent work by Ayo Ahmed and isn't affiliated with, endorsed by or produced for Ramp. It borrows the *feel* of a public page (white space, neutral type, one bright accent). It doesn't use Ramp's logo, wordmark, icons, illustrations, product screenshots or proprietary font files. The header, footer and README keep the independent-concept, synthetic-data and non-affiliation notices.

## Method

| | |
|---|---|
| Pages | https://ramp.com/en-gb (UK home) and https://ramp.com/blog/uk-launch (UK launch post, dated 15 September 2026) |
| Date | 29 September 2026 |
| Viewports | 1440 × 900 desktop and 390 × 844 mobile |
| How | The pages were loaded in Chrome and the computed styles (`getComputedStyle`) of headings, body copy, links, buttons and inputs were read. Colours were converted to sRGB hex, and colour, radius, border and type-size use was tallied across every visible element. Screenshots were taken for visual review. |
| Limits | This is one snapshot of two pages. Ramp's site can change. Nothing here comes from internal Ramp material. Measured values are exact for that date. The descriptive notes are judgement. |

## 1. Observed tokens

### Colour

| Token (descriptive name) | Value | Where it was seen |
|---|---|---|
| Near-black text | `#0c0a08` | Body copy, all headings, nav links and CTA labels. This was the most-used text colour on both pages |
| Secondary text | `#0c0a08` at 60% opacity (≈ `#6d6c6b` on white) | Hero subhead, section body copy, blog paragraphs, breadcrumb links |
| Page background | `#ffffff` | UK home page body |
| Warm grey surface | `#f4f2f0` | Blog header band, feature panels, product-mock frame on the home page |
| Lime CTA | `#e4f222` with near-black text | "See a demo" (nav), "Get started" (hero email capture), "Get started for free" (mobile blog) |
| Dark CTA | `#1a1919` with white text | "Get started" (nav) |
| Dark band | `#0c0a08` / `#1a1919` with white text, and white at 60% for secondary text | Testimonial and footer sections |
| Hairline border | `#d2cecb` 1px | Card and panel edges, dividers. This was the most-used border |
| Soft border | `#1d1d1d` at 10% | Email input, blog sign-up input |
| Tint | `#e4ebf6` | Small illustrative panels on the home page |

### Type

| Role | Desktop (1440) | Mobile (390) | Notes |
|---|---|---|---|
| Family | `Lausanne, Arial, sans-serif` | same | Lausanne is a proprietary typeface. Only weight 400 was loaded on the home page. Weights 300, 350 and 700 are declared, and 700 loads on the blog for inline bold |
| UK hero headline (`h1`, home) | 64 / 64px, 400, −0.01px | 40 / 42px | "Time is money. Save both." Centred |
| Blog headline (`h1`, launch post) | 40 / 42px, 400, −0.005px | 28 / 32px | Left-aligned |
| Section heading (`h2`) | 40 / 42px, 400. FAQs 48 / 50px | 28 / 32px | |
| Blog section heading | 28 / 32px, 400 | 22 / 26px | 62px top padding |
| Card heading (`h3`) | 28 / 32px and 20 / 26px, 400 | 22 / 26px | |
| Hero subhead | 20 / 26px, 400, secondary colour | 18 / 22px | |
| Blog body | 18 / 30px, 400, secondary colour. Inline bold at 700 | 17 / 30px | Long-form measure is 744px |
| Body / UI | 16 / 24px, 400 | 16 / 24px, and 15 / 21px for section copy | This was the most-used size |
| Nav and small UI | 14 / 20px, 400 | 14 / 20px | Nav items 44px tall with 0 12px padding |
| Fine print | 13 / 19px | 12 / 18px | |

Every heading was regular weight (400). Hierarchy comes from size alone, not weight.

### Shape, space and elevation

| Token | Value | Where it was seen |
|---|---|---|
| CTA radius | 6px | Every button and CTA (nav "See a demo", "Get started", "Sign in" and nav hover targets) |
| CTA size | 14px label, 12px 16px padding, 34px tall (nav). 16px label, 0 20px padding, about 52px tall (hero). Mobile hero is full width and 42px tall | |
| Input radius | 10px (desktop hero email field, lime button inside), 6px (mobile and blog) | |
| Card and panel radius | 12px (most-used), also 8px, 16px and 18px | Feature panels, blog image, product mock |
| Pill radius | 999px | Small chips, mobile only |
| Shadows | Essentially none | Only one transparent shadow was found on each page. Surfaces are separated by tone and hairlines, not elevation |
| Content width | about 1297px inner container at 1440 (72px gutters). 358px at 390 (16px gutters) | |
| White space | Broad: the hero sits in a mostly empty white field, and sections are separated by large vertical gaps | |
| Header | White, nav 14px, 6px-radius targets, lime and dark CTAs at the right | Mobile: wordmark plus a 40px, 6px-radius menu button |

### Observed voice (for reference only)

Short, plain sentences with a light touch ("Busywork? Sorted.", "Time is money. Save both.") and British spelling ("Categorise"). The product copy here keeps its existing plain, specific voice and doesn't borrow Ramp slogans.

## 2. Adapted product tokens

The engine is a dense, data-heavy working tool, not a landing page, so some values are adapted. Every change is listed with its reason.

### Colour tokens (`:root` in `public/style.css`)

| CSS var | Value | Based on | Adaptation and reason |
|---|---|---|---|
| `--ink` | `#0c0a08` | Near-black text | Same |
| `--ink2` | `#6d6c6b` | Secondary text | A solid colour instead of 60% alpha, so contrast is predictable on every surface. It's 5.2:1 on white and 4.7:1 on `#f4f2f0` |
| `--ink3` | `#6d6c6b` | Secondary text | Tertiary text uses the same grey. A lighter grey would fail the 4.5:1 minimum for small text |
| `--paper` | `#ffffff` | Page background | Same. The page is white, with broad white space |
| `--surface` | `#f4f2f0` | Warm grey surface | Used for KPI tiles, the hero band, meters and quiet fills |
| `--card` | `#ffffff` | Page background | Cards are white on white with a hairline |
| `--line` | `#d2cecb` | Hairline border | Used for decorative dividers and card edges only (1.6:1) |
| `--control` | `#8c8a88` | New | Borders on inputs, selects and toggles that must be visible without a label. Meets WCAG 1.4.11, the 3:1 minimum for non-text UI (3.4:1 on white) |
| `--accent` | `#e4f222` | Lime CTA | Used as a fill only, always with `--ink` text (16:1). Never used as text or a border on white (1.2:1) |
| `--accent-ink` | `#0c0a08` | Near-black text | Text on lime |
| `--dark` | `#1a1919` | Dark CTA | Selected tab, dark buttons, toast, code block |
| `--good` / `--warn` / `--bad` | `#1f6b43` / `#6b4100` / `#b3261e` | New | The tool needs pass, check and block states that the observed pages don't have. The colours are muted, kept on pale tints, and each is ≥5.8:1 on its tint |

### Type tokens

| Role | Adapted | Observed | Reason |
|---|---|---|---|
| Family | `"Inter", Arial, sans-serif` | `Lausanne, Arial, sans-serif` | Lausanne is proprietary and not licensed for this concept. Inter is a neutral grotesque under the SIL Open Font License 1.1. It is self-hosted at `public/fonts/` as one 48 KB variable Latin file, and its licence is in `public/fonts/OFL.txt`. Arial, the observed fallback, is kept as the next fallback |
| Headings | Weight 400 | 400 | Same. Hierarchy comes from size |
| Page headline (`.hero h1`) | 40 / 42px desktop, 28 / 32px mobile | Home hero 64px, blog 40px | This is a working screen under a sticky header, so it uses the blog headline scale. The 64px hero would push the queue below the fold |
| Account name (`.dhead h2`) | 28 / 32px | Blog section heading 28 / 32px | Same scale |
| Card heading (`.card h3`) | 20 / 26px | `h3` 20 / 26px | Same |
| Big numbers (KPIs, priority) | 28–40px, 400, tabular figures | none | Numbers stay regular weight, in the observed style, and use tabular figures so columns line up |
| Body / UI | 15 / 22px (16px on the page body) | 16 / 24px | 15px keeps the dense queue and tables scannable. It never goes below 12px |
| Labels and meta | 12–13px, 500 | 13 / 19px, 400 | A small weight step (500) replaces the old bold labels. Inter at 400 alone is too faint for 12px uppercase labels |
| Emphasis | 600 | 700 inline bold | Inter at 600 matches the visual weight of Lausanne Bold at UI sizes |

### Shape, space and elevation

| Token | Adapted | Observed | Reason |
|---|---|---|---|
| `--r-cta` | 6px | 6px | Same, for every button, tab and input |
| `--r` (cards) | 12px | 12px | Same |
| Pills (tiers, chips) | 999px | 999px (mobile) | Same |
| Shadow | none | none | Tone and hairlines only |
| Gutters | 28px desktop, 16px ≤900px | 72px and 16px | Tighter on desktop to fit the two-pane queue. The same 16px on mobile |
| Max width | 1440px | about 1297px inner | Kept wider for the data panes |

## 3. Component templates

| Component | Template |
|---|---|
| Primary CTA (`.primary`) | Lime fill, `--ink` label, 6px radius, 10px 16px padding, weight 500. Hover darkens the lime slightly. One per region, used only for the main action ("Score and add to queue", "Log") |
| Secondary button (`.ghost`) | White, 1px `--control` border, 6px radius. Used for "Copy", "Record opt-out" and "Score a new account" |
| Dark button / selected tab | `--dark` fill with white text and 6px radius, matching the dark CTA |
| Header | White with a bottom hairline, sticky. The title is plain text, "Ramp UK GTM Engine" in title case. The mark is a neutral three-bar "ranked queue" glyph in lime on ink, which is not a Ramp mark. The independence line sits under the title |
| KPI tile | `--surface` fill, no border, no shadow, 12px radius. Label 13px `--ink2`, value 28–32px at 400 |
| Card | White, 1px `--line`, 12px radius, no shadow |
| Queue row | A white card row. Selected rows get a 1px `--ink` ring. The tier pill is on the right |
| Tier pills | P1 ink with lime text. P2 lime with ink text. P3 surface grey. Nurture, Suppressed, Duplicate and Blocked use pale tints with dark text (≥4.5:1) |
| Inputs | White, 1px `--control`, 6px radius, 40px tall. The focus ring is 2px `--ink` with a 2px offset |
| Callouts (pass, check, block) | A pale tint with dark tinted text and a 1px tinted border, 12px radius |
| Toast and code | `--dark` fill with white text, echoing the observed dark bands |

## 4. Rules

**Do:**
- Keep broad white space: a white page, one warm-grey surface and hairlines.
- Use regular-weight headings, and build hierarchy through size.
- Use lime sparingly: primary actions, P1/P2 emphasis and meter fills. Always put ink text on lime.
- Keep every notice visible: "Independent concept by Ayo Ahmed · not affiliated with Ramp · synthetic accounts" in the header, and the full footer disclaimer.
- Keep focus rings visible, and hit targets at least 34px (40px on mobile inputs).

**Don't:**
- Use Ramp's logo, wordmark, lowercase "ramp" lettering, favicon, icons, illustrations or screenshots.
- Load, copy or embed Lausanne or any other Ramp font file.
- Present the UI as official Ramp work, or reuse Ramp slogans as headlines.
- Put lime text on white, or use `--line` as the only boundary of an input.

## 5. Accessibility checks for the re-skin

- Contrast was computed with the WCAG relative-luminance formula. Every text and background pair used meets 4.5:1, and non-text control boundaries meet 3:1. The values are in the tables above.
- Controls, tab roles, `aria-selected`, `aria-live` regions, labels and keyboard focus are unchanged from the previous UI.
- `prefers-reduced-motion` still disables transitions.
- At 390px there is no horizontal overflow, and every control stays reachable.
