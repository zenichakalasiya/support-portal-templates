**On session start:** If `HANDOFF.md` exists in this directory, read it before
anything else for the latest state of the work.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Thirty-seven Support Portal layout templates for Motadata ServiceOps, grouped by
industry (IT & ITES, Healthcare, Manufacturing, Government, Education, BFSI, plus
a "Rejected" group kept for visibility). It's a static gallery: open `index.html`
directly (`file://`), no server, no build tool, no npm dependencies. Source of
truth is a Claude Design file (`Support Portal Layout System.dc.html`); this repo
is the hand-implemented, diffable version of that design.

`README.md` is the reviewer-facing companion — it carries the full table of which
layouts ship to which industry group and why. Read it before changing the
catalog.

## Commands

There is no package.json, no npm, no test suite, no linter. The only command in
this repo:

```
node build.js
```

Regenerates `js/templates.js` from the partials in `layouts/`. **Run this after
every edit to any file in `layouts/`** — `index.html` reads from the generated
bundle, not from the `layouts/*.html` files directly (opening via `file://`
blocks `fetch()`, so partials can't be loaded at runtime and must be pre-bundled
into a script). `build.js` bundles *every* `layouts/*.html` keyed by basename, so
a new partial needs no registration in the build itself.

To view changes: open `index.html` in a browser (double-click or `file://`
path — no dev server needed/used). A static server on `localhost:5173` has also
been used this project; either works. Final verification is visual — there is
no automated check for whether a layout *looks* right.

There is a headless sanity check short of that, though: `dc.js` and `logic.js`
both run in plain Node when a `window` object is passed in (`new
Function('window', body)(w)` after reading the file, then call methods on
`w.DC`/`w.Component`), so `renderVals()` can be exercised for every tab to
catch a thrown error or an unbalanced `<sc-if>`/`<div>` before opening a
browser. `DC.compile` itself still needs `document` and won't run this way.
Note also that `js/templates.js` is template literals, not JSON — grepping it
for `"id": "…"` finds nothing; eval it to inspect `TEMPLATES`.

The gallery is also published as a private Claude artifact:
<https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4>. It is a
snapshot, not a mirror — after `node build.js`, it has to be republished to the
same URL to pick up changes. Deep links work (`…/artifact/<id>#/mfg/4c2`).

## Architecture

### The template dialect (`js/dc.js`)

`layouts/*.html` files are markup authored in Claude Design, kept verbatim so
they stay diffable against the design source. `js/dc.js` (~100 lines of runtime)
implements just enough of that dialect to render it:

- `{{ expr }}` — interpolation, in text or attributes
- `<sc-for list="{{ xs }}" as="x">` — repeat children per item
- `<sc-if value="{{ flag }}">` — conditional render
- `onClick="{{ handler }}"` — binds a function from the value bag
- `ref="{{ callback }}"` — callback ref, fired with the DOM node

Expressions are deliberately tiny (dotted paths, negation, `==`/`===` comparisons
against literals) — no arbitrary JS is evaluated. `dc.js` also exposes `DCLogic`
(aliased as `DC.Logic`), a minimal base class mirroring Claude Design's component
model (`state`, `setState`, `props`, `renderVals()`, three lifecycle hooks). Do
not add JS control flow to `layouts/*.html` beyond what this dialect supports —
if a layout needs new logic, extend `dc.js`'s expression grammar deliberately,
don't work around it in markup. Compiled templates are memoised by cache key, so
a template string is parsed once per session.

### Data flow

- **`js/logic.js`** — `Component extends DCLogic`, carried over near-verbatim
  from the design file. Owns `state` (active industry group, active layout tab,
  carousel indices), `renderVals()` (the flat object every template renders
  against), and all fixture content (services, tickets, KB articles, approvals,
  etc.) grouped into helper methods (`layoutVals()`, `foyVals()`, `hcVals()`,
  `seedTokens()`, `annCarousel()`, `deskNoticeVals()`). `Component.PROPS` at the
  bottom of the file declares the three design-time props (palette / mood /
  cardStyle) and their option lists.
  Fixture lists are shared across layouts and several differ only by length
  (`kbs3/4/6/8`, `approvals/approvals3/approvals4`, `requests4/requests6`), so
  **grep before editing one** — some rows are byte-identical across lists and a
  naive string replace will hit the wrong fixture.
  The same trap applies inside a template: one file can reuse the same
  `as="x"` name across several `sc-for` loops (4e uses it for five), so a bare
  `{{ x.t }}` match lands in whichever card comes first — scope edits to the
  loop, not the file. Identical CSS can repeat too (two grids with the same
  columns), so anchor block edits by line number with an assertion on every
  boundary, and check `<sc-if>` balance alongside `<div>` after any edit that
  adds a conditional row.
- **`js/templates.js`** — GENERATED (`node build.js`). Do not hand-edit; edit
  `layouts/*.html` instead.
- **`js/slots.js`** — GENERATED. Placed photographs and their hand-adjusted
  crops, carried over from the design file for the 13 `<image-slot>` regions.
- **`js/image-slot.js`** — `<image-slot>` custom element; reproduces the design
  tool's crop/framing math so placed photos survive responsive resizing.
- **`js/app.js`** — mounts the gallery: instantiates `Component`, renders the
  shell (industry chips + tab strip) and the active layout on state change,
  keeps `location.hash` in sync (`#/<group>/<layout>`, e.g. `#/edu/7a`) so a
  specific layout is linkable, drives the theme/props panel, and mirrors the
  active palette onto CSS custom properties so chrome around the layouts (panel,
  focus rings, tab strip) follows the theme. Rendering is a full replace of the
  stage per layout switch, not a diff — this is intentional (one layout on
  screen at a time, a few hundred nodes, no need for a reconciler).

`index.html`'s script order is load-bearing and unbundled: `slots.js`,
`templates.js` (data) → `dc.js`, `image-slot.js` (runtime) → `logic.js` →
`app.js`. Each file is an IIFE hanging one global off `window`; a new `js/` file
must be added to `index.html` in the right position.

### The layout catalog

`LAYOUTS` (id → display name) and `GROUPS` (industry key, label, member tabs with
their role tags, industry note) are **locals inside `renderVals()`** in
`js/logic.js` (~line 359), not module-level constants. To add a layout: add it to
both, drop a partial in `layouts/`, and rebuild. Role tags (`primary`,
`catalog-first`, `course-led`, …) must also exist in the `TAGS` map just below,
or the tab renders with the fallback grey.

`GROUPS[0]` is a generated pseudo-group, **"Top selected by Team"** — each real
team member's personal top picks, by layout id, live in the `TEAM_PICKS` map
right after `GROUPS` is defined. It is unshifted onto `GROUPS` after being
built, so it never needs its own hand-written member list: for each id in
`TEAM_PICKS`, the group's industry tag(s) are derived by scanning the *real*
groups (`it`/`health`/`mfg`/`gov`/`edu`/`bfsi`) for membership, and tabs are
ordered by vote count (most picks first). To add or change a person's picks,
edit only `TEAM_PICKS` (and `PERSON_COLOR` for a new person's initials chip
colour) — everything else recomputes. This group's tabs render an extra row
(industry label + colour-coded initials chips per person) via `t.isTeam` in
`layouts/_shell.html`; other groups don't set that flag, so their tabs stay
the original single-line layout.

### Layout ID quirks

`renderVals()` derives one `is<id>` boolean per layout from the active tab, and
layouts key off those flags. Two deviations from 1:1 tab→template:

- The Prism family (`2a` / `2ag` / `2an`) shares one template, all three setting
  `is2a`; the hero colour comes from `seedTokens()`.
- `4p` is shared by Education and Healthcare; `show.notHealth` suppresses the
  Quick links and Notice board cards in the Healthcare context.

`js/app.js`'s `activeLayoutId()` resolves the active layout by first checking
`TEMPLATES[tab]` directly, then falling back to scanning `is<id>` flags — read
that function before assuming a tab id always maps to a template file. Six ids
appear in more than one group, which is why 37 layouts fill 45 tab positions.

## Notes worth knowing before editing

- **Fonts**: Inter, Newsreader, Material Symbols Rounded load from Google
  Fonts. Icons are ligatures — offline, they render as literal names
  (`chevron_right`) rather than glyphs.
- **Narrow windows**: layouts use fixed multi-column grids for a desktop
  service-desk window; below 1180px the stage scrolls horizontally by design
  rather than reflowing.
- **Photographs**: slots with no photograph (`3b2-ann`, `cn2-banner`,
  `foy-illus`, `ks-hero`, `ks-agent`, `paper-hero`, Gazette tiles) intentionally
  render a dashed placeholder with authored caption — this matches the design,
  don't "fix" it by adding an image. `mrd-t1`–`t3` and `cst-mark` are photographs
  held for slots no current layout renders; keep them.
- **Sticky header: only the template's own top bar sticks.** `#shell` (the
  gallery's own title/industry-chips/tab-strip chrome) is deliberately **not**
  sticky — it scrolls away with the theme bar above it, same as any other page
  content. A `position:sticky` rule on `#shell` was tried first and reverted:
  the user wants the gallery chrome (title, chips, tabs) to scroll away, not
  stay pinned — only each template's *own* top bar (the `dock_to_right` icon +
  "motadata" + Ask AI + avatar row, inside `#stage`) should dock to the very
  top of the viewport, at `top:0`. For this to work, the wrapping div around
  the whole template body must **not** carry `overflow:hidden` (it did, on
  every template, purely as inherited boilerplate; removing it is safe and
  required — `overflow:hidden` on any ancestor silently blocks a sticky
  descendant). When adding a new layout, copy the sticky top bar
  (`position:sticky;top:0`) and the overflow-free wrapper from an existing one
  rather than the raw design export.
- **The tab strip's horizontal scroll survives redraws.** `#shell` is fully
  torn down and rebuilt (`DC.render` does `into.textContent = ''`) on *every*
  state change anywhere in the app — including the 5-second `AUTO_ANN` timer —
  which would otherwise silently reset the tab strip's `scrollLeft` to 0 mid-
  scroll. `js/app.js`'s `draw()` captures the scroll container's `scrollLeft`
  before re-rendering `#shell` and restores it after. If `_shell.html`'s tab
  strip markup changes shape, keep a single element matching
  `[style*="overflow-x:auto"]` inside `#shell` — that's the selector `draw()`
  uses to find it.

## House rules that hold across the gallery

These were applied template-wide and should be kept when adding or editing one:

- **No leading icon before a card heading.** Card headers start with the title.
  Icons inside rows (an asset’s device glyph, a status pill) stay.
- **No hero eyebrow.** The small uppercase, letterspaced organisation line that
  sat above each welcome heading is gone from every template. Other uppercase
  labels (ANNOUNCEMENT strips, KPI labels, calendar months) remain.
- **Announcements read title · description · date** — no coloured category
  kicker, and every row is [ filled date block ] [ bold title / small regular
  subtext ]. The date block is `#f1f3f6` on light cards and
  `rgba(255,255,255,.14)` on dark ones. Notices follow the same rule.
- **Rotating announcements** use `annNow` with `annDots` (light dots, for dark
  cards) or `annDotsInk` (dark dots, for light cards). A tab listed in the
  `AUTO_ANN` set near the top of `logic.js` advances on its own every five
  seconds — add a tab there rather than writing a new timer.
  **The carousel controls sit on one line with the announcement**, not below it:
  the row is `[ date block | title / description ]` taking the free space, then a
  right-aligned group of `‹ dots ›` and the next-arrow (was "All
  announcements", renamed gallery-wide, then folded into the arrow itself — see
  below). Arrows are circular 24–28px buttons and stay even where the tab also
  auto-advances. `4i` has no separate card header above its strip at all —
  title and CTA both live inside the strip itself.
  Where the card is too narrow for one line (5c), the row splits instead: arrows
  and dots top right, top-aligned with the title, and the CTA on its own line at
  bottom right.
  **Last-slide rule:** every carousel's next-arrow swaps to a `View all ›` CTA
  on the final slide (`<sc-if value="{{ !annIsLast }}">` for the arrow,
  `<sc-if value="{{ annIsLast }}">` for the CTA — `annIsLast` comes from
  `annCarousel()` in `logic.js`), then swaps back once it wraps to the first
  slide. This is now on every carousel in the gallery, arrowed or previously
  auto-only: `3b2`, `3h`, `4a`, `4g`, `4i`, `4p`, `5c`, `6c`, `7c`, `8a`, `8b`
  all have `annPrev`/`annNext` arrows for this. Don't add a *second*, always-
  visible "View all" next to a carousel's own controls — the swap already
  covers it (this was cleaned up once already; re-adding a persistent link
  there is a regression, not a fix). `4d` shows `annNow` with a permanent
  "View all" and no dots/arrows — it isn't a real carousel (nothing changes
  it), so it's the one exception left out of the last-slide treatment.
  This "don't shrink the text" rule is for the **card-row** announcement style
  only (the `[date block | title/desc]` pattern above). The **hero-embedded**
  carousel — `annNow.t` set directly inside a welcome banner (`3b2`, `3h`, `4a`,
  `4d`, `4i`, `4p`, `5c`, `6c`, `7c`, `8a`, `8b`) — is the opposite: that title
  is truncated to one line (`white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis`) on purpose, because a long title wrapping to 2 lines
  there visibly grows the whole hero banner's height. Keep hero titles
  single-line; leave card-row titles free to wrap.
- **Pending Approvals rows** use the check / close / undo icon buttons, never
  text buttons. Tints are semantic and fixed; the corner radius follows the
  template.
- **Asset and CI lists** use tinted rounded tiles in a gapped column (the 3b
  treatment), with the tint taken from the layout's own palette; the icon itself
  sits on its own small background chip (bg + accent colour pair), matching
  whatever chip style that template's other action/service tiles already use —
  never a bare icon with no background.
- **"My Assets" and "My CIs" are two separate cards, not one merged "Assets &
  CIs" card.** Where a template still has a single combined card, split it:
  "My Assets" (badge **8**, the `assets` fixture) and "My CIs" (badge **4**, the
  `cis` fixture), each showing its items in a tile grid — usually 2 columns × 2
  rows. Precedent for the split (and its badge numbers) is `3g`/`3j`, which
  already did this in the design. When splitting a card that shares its row
  with something else that must **not** resize (a Contact/escalation card, e.g.
  `8a`/`8b`), nest the two new cards in their own sub-grid inside the original
  card's slot rather than changing the outer row's column count.
- **Most read** is a listing data card: header, then rows of id pill, title,
  date and category.
- **Government notice cards** (3i, 3j, 6a, 3c) use the announcement row with the
  notice number as the subtext: `[ date block ] [ bold title / No. IT/2026/114 ]`.
- **Data card headers are exactly `[ title ][ badge ] … [ View all › ]`.** That
  is the whole row — no leading glyph, no descriptive meta, one spacer. It holds
  for My Open Requests, Most read, Pending Approvals / My approvals, My Assets,
  My CIs and My Devices. The badge is a **number only** (8, 412, 3), never
  "8 assigned" or "412 articles"; a card with no count of its own takes the total
  that card type uses elsewhere — Most read 412, My Assets 8, My CIs 4, devices 6
  (or 4 where only 4 are shown, e.g. `5a`), open requests 8. Announcement and
  notice cards read `All announcements ›`
  instead. Two deliberate exceptions: the **4c / 4c2 counter tiles** (a flat
  figure + label per tile, no list behind any of them — now four tiles: Open
  Requests, Approvals, My Assets, My CIs, using the same figures as the list
  cards elsewhere) and **4h**, whose editorial layout uses an
  uppercase eyebrow over a serif heading with no header row at all.
- **Service and catalogue sections carry no link.** "Popular services",
  "Most used services", "Browse by category", "Service catalog" and the like are
  a heading alone — the "Browse catalog ›" / "Full catalog ›" / "All 214" links
  were removed gallery-wide. A decorative rule after the heading (3d) stays.
- **Contact Us cards carry no chat button.** It was removed everywhere and its
  height held by a spacer (`height:Npx;margin-top:Npx`) so card sizes and row
  alignments are unchanged — keep the spacer if you edit one of these cards.
  Two cards are exceptions the user asked for: **5a** and **2a/2ag/2an** had the
  spacer taken out so the card sits to its content. Both live in a hero row that
  does not stretch, so nothing else moved.

## Deployment

Repo: https://github.com/zenichakalasiya/support-portal-templates
Live URL: https://zenichakalasiya.github.io/support-portal-templates/

Public repo, deployed by `.github/workflows/deploy.yml` on every push to `main`
(the repo is uploaded as-is — `js/templates.js` is committed, so Pages needs no
build step). Run `node build.js` before pushing, or the live page serves the old
bundle. Root-level `*.png` review screenshots are gitignored.

Also published as a private Claude artifact:
https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4 — a snapshot,
republished manually.

## Handoff

Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
