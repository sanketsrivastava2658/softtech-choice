# Outbound Terminal

White-label GTM agency tool — a Next.js (App Router) + TypeScript + Tailwind + Shadcn frontend on top of the Smartlead API, with Supabase (Postgres / Auth / RLS / Realtime) and Vercel. Two surfaces share one shell: a client panel (each client sees only their own data, enforced by Supabase RLS) and an agency admin panel (all clients, global analytics).

## Design System
Always read `DESIGN.md` before making any visual or UI decision.
All font choices, colors, spacing, layout, and aesthetic direction are defined there.
The system is "Outbound Terminal": warm-dark, single brass-amber accent (`#E8B04B`),
Cabinet Grotesk / Geist / Geist Mono, dense ops-console layout, tabular mono numerals.

Hard rules (the product is the deliberate opposite of the blue/violet/light cold-email category):
- No purple/violet, no blue as brand/chrome, no gradients anywhere.
- No icon-in-colored-circle stat cards; use the "command strip" of mono metrics.
- No Inter / Space Grotesk / system-ui as display or body font.
- Every number (metric, %, count, timestamp, ID, email) renders in Geist Mono, tabular.
- One accent (amber) carries interactivity; any second color must be semantic.
- Dark is the default theme; light ships too. Color lives in CSS variables for white-label.

Do not deviate without explicit user approval. In QA/review, flag any code that
violates DESIGN.md or the rules above.

A live render of the system is at `design-preview.html`.
