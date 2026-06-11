# Design System — Outbound Terminal

> The source of truth for every visual and UI decision in this product.
> Read this before writing any UI. Do not deviate without explicit user approval.
> A live render of this system lives at `design-preview.html` (open in a browser).

## Product Context
- **What this is:** A white-label GTM (go-to-market) agency tool — a custom frontend + business logic layer built on top of the Smartlead outreach API. Smartlead is the backend send engine; this is the product clients and the agency actually look at.
- **Who it's for:** Two audiences, one skeleton. **Clients** log in and see only their own data (campaigns, leads, send stats, replies, open/positive-reply rates, inbox health, meetings booked, reports). **Agency admin** sees everything across all clients (total clients, campaigns, sending volume, team performance, global analytics, client-wise filters).
- **Space / industry:** Cold-email / outbound sales tooling. Direct peers: Smartlead, Instantly, Lemlist, Apollo, Saleshandy, Reply.io.
- **Project type:** Multi-tenant analytics dashboard / operations console (web app).
- **Brand model:** Single brand. The agency strips Smartlead's identity and presents this as their own product. Color is architected as tokens so per-client theming stays *possible* later, but the product is designed for one confident brand now.

## The Memorable Thing
> The dark, brass-amber terminal where the numbers move.

Every decision serves this. When a client opens the dashboard, they should feel they're looking at serious financial-grade operations software — and the agency should look like a product company, not a Smartlead reseller. The amber-on-warm-charcoal palette plus mono numerals is the thing they remember.

## Aesthetic Direction
- **Direction:** Operations terminal, premium grade. A financial/ops cockpit, not a marketing site. Data is the hero; chrome disappears.
- **Decoration level:** Minimal-to-intentional. **Zero gradients.** Decoration = faint hairline grid behind empty data regions, subtle warm grain, crisp 1px borders. Restraint is the statement.
- **Mood:** Confident, dense, precise, warm. Serious without being cold.
- **Strategic basis (anti-convergence):** The entire category has converged on **blue/violet, light mode, gradient mesh, center-aligned heros, rounded glassy cards** — the AI-slop palette. Smartlead ships a literal purple gradient hero; Instantly is wall-to-wall blue gradient mesh. This system is the deliberate opposite on every converged axis: **warm-dark instead of light, brass-amber instead of blue, dense tables instead of glassy cards, mono numerals instead of proportional.**
- **Reference / anti-reference:** smartlead.ai and instantly.ai are what NOT to look like.

## Typography
Three voices, zero Inter. All free / OFL.

- **Display / Hero / page titles:** **Cabinet Grotesk** (700–800) — confident geometric grotesk with a little character. Load: Fontshare `https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&display=swap`
- **Body / UI / labels / buttons:** **Geist** (400–600) — holds up at 12px in dense tables, still modern at 16px. Load: Google Fonts.
- **Data / numerics:** **Geist Mono** (400–500), `font-feature-settings: "tnum" 1, "zero" 1` — **the signature.** Every metric, percentage, count, timestamp, email address, campaign ID renders in tabular mono. The terminal feel comes from the numbers being mono. Load: Google Fonts.
- **Loading:** `<link>` from Fontshare (Cabinet Grotesk) + Google Fonts (`Geist`, `Geist Mono`). Self-host for production to drop the third-party round-trip.
- **Never use:** Inter, Roboto, Space Grotesk, system-ui as display/body (these are the convergence signals), plus the standard blacklist.
- **Scale (rem, 16px base):**
  - Display: 3.375rem / 54px, weight 800, tracking -0.03em, line-height 1.02
  - H2: 1.625rem / 26px, weight 700, tracking -0.02em
  - H3 / card title: 0.875rem / 14px, weight 600
  - Body: 0.875rem / 14px (UI default), 1rem / 16px (prose)
  - Label / eyebrow: 0.6875rem / 11px mono, uppercase, tracking 0.12–0.14em
  - Metric value: 1.625rem / 26px mono, weight 500, tracking -0.03em
  - Table figure: 0.8125rem / 13px mono, tabular

## Color
Warm dark. One accent does the work. Blue is demoted to semantic-only "info" — never brand. Define as CSS custom properties; never hardcode hex in components.

**Dark (default):**
- `--bg` background `#15130F` (warm near-black, NOT blue-black)
- `--surface` `#1E1B16`
- `--elevated` `#26221B`
- `--hover` `#2E2920`
- `--line` hairline border `rgba(242,237,227,.10)` · `--line-strong` `rgba(242,237,227,.18)`
- `--text` `#F2EDE3` · `--muted` `#A39B8B` · `--faint` `#6E665A`
- `--amber` **brand accent** `#E8B04B` — primary buttons, active nav, key-metric emphasis, focus rings, the one money metric (reply rate). `--amber-deep` `#C8902B` (hover), `--amber-dim` `rgba(232,176,75,.14)` (tints/rings)

**Light (ships, warm paper):**
- `--bg` `#F6F1E7` · `--surface` `#FFFCF5` · `--elevated` `#FBF6EC`
- `--text` `#1A1712` · `--muted` `#6B6356` · `--faint` `#9A9183`
- `--amber` deepened to `#B8801A` for contrast on paper

**Semantic (separate register so they never fight the brand):**
- Success / positive reply / good inbox: mint `#5FD3A3` (light `#1F9D6B`)
- Error / bounce / blacklist: `#E5604D` (light `#C8412E`)
- Warning / near-cap / warming: orange `#E8843B` (light `#C7661E`) — **kept distinct from brand amber** by hue; amber is reserved for brand/interactive, orange for warnings only
- Info: slate-blue `#6E8BB5` — semantic only, never brand, never the dominant color on a screen

**Rules:**
- No gradients anywhere. No purple. No blue as chrome/brand.
- Exactly one accent (amber) carries interactivity and emphasis. If a second color appears, it must be semantic.
- Dark is the default surface; reduce saturation ~10–20% in light mode where needed.
- Status uses semantic borders + mono labels, not filled pills.

## Spacing
- **Base unit:** 4px.
- **Density:** Compact (it's an ops console). Table rows 36–40px. Cards padded 18–22px.
- **Scale:** `2(2) · xs(4) · sm(8) · 12 · md(16) · lg(24) · xl(32) · 2xl(48) · 3xl(64)`
- Tight but breathable — never cramped numbers; let metric values have air above/below labels.

## Layout
- **Approach:** Grid-disciplined hybrid. App is a strict layout; marketing (if any) can loosen.
- **App shell:** Left rail nav (188px) · main column (fluid) · optional right context panel (264px, e.g. live replies). Below ~920px the rails collapse, main stacks.
- **The command strip:** The first thing in any dashboard view — a row of 5 key metrics (Emails Sent, Open Rate, Reply Rate, Positive Replies, Meetings Booked) treated as a *poster of live numbers*, each a large mono value + tiny label + sparkline. NOT stat-cards-in-colored-circles. Reply Rate (the money metric) is emphasized in amber.
- **Data tables:** Dense, right-aligned numerics, inline micro-bars for rates, status dots, hover row highlight. Tables are first-class, not an afterthought.
- **Agency Admin** reuses the same skeleton: workspace switcher → all-clients rollup; command strip aggregates global volume + team performance; table becomes client-wise.
- **Max content width:** 1180px for system/marketing pages; app is fluid full-width.
- **Border radius:** sm 5–7px (chips, inputs, buttons), md 9–11px (cards, tables), lg 14px (app shell). No fully-round bubble radius on everything; pills (20px) only for filter chips and intent tags.

## Motion
- **Approach:** Minimal-functional.
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`.
- **Duration:** micro 80–120ms, state 120–180ms, view 250–350ms.
- **Signatures:** numbers count up on data load; realtime cells flash briefly (amber for brand metric, mint for positive) on change via Supabase Realtime; a live "synced Ns ago" pulse dot. No scroll-driven choreography, no decorative animation.

## Implementation Notes (stack-specific)
- **Tailwind:** map every token above to `theme.extend.colors` / `fontFamily` / `spacing`. Drive dark/light with a `data-theme` attribute on `<html>` and CSS variables (not Tailwind's class strategy alone) so the white-label theming hook is one variable swap.
- **Shadcn UI:** override the default neutral/zinc palette with these tokens in `globals.css`. Default shadcn radius is too round — set `--radius` to 0.5rem and tighten. Replace default font vars with the three voices above.
- **Tabular numerals:** apply `font-variant-numeric: tabular-nums` (or the `tnum` feature) globally to any element rendering data, so columns align.
- **White-label hook:** keep `--amber` (and optionally `--bg` ramp) as the single themeable token set. A future per-agency theme is a CSS-variable override at the workspace boundary, no component changes.
- **Anti-slop guardrails (enforce in review):** no purple/violet, no blue chrome, no gradients, no icon-in-colored-circle stat cards, no centered-everything, no Inter/Space Grotesk/system-ui as display or body, no bubble-radius on all elements, no gradient CTA.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-10 | Created design system "Outbound Terminal" | /design-consultation. Built as deliberate opposite of the blue/violet/light cold-email category after researching Smartlead + Instantly. |
| 2026-06-10 | Positioning: "serious ops console" | User choice. Operators live in deliverability/reply data all day; density + confidence = anti-slop. |
| 2026-06-10 | Single brand (not per-client themeable) | User choice. "White-label" = agency strips Smartlead branding; one confident brand beats neutral chrome. Tokens keep theming possible later. |
| 2026-06-10 | Warm-dark default, brass-amber `#E8B04B` accent, mono numerals | The three deliberate risks that give the product its own face vs. the category. Approved from HTML preview render. |
| 2026-06-10 | Type: Cabinet Grotesk / Geist / Geist Mono | All-free stack, zero Inter. Mono numerals are the signature. |
