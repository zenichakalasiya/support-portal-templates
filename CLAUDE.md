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
  (`kbs3/4/6/8`, `approvals/approvals3/approvals4`, `requests4/requests6`,
  `anns2/anns3` — both `.slice()` off the same `anns5`), so
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

`GROUPS` is preceded by two hand-picked pseudo-groups, unshifted on in this
order so **"Final"** ends up first: **"Final"** — a fixed, ordered list of 12
layout ids the user chose as the ship-ready set (4e, 4g, 7a, 4c2, 5a, 3h, 4f,
2a, 3b2, 3c, 4p, 8b) — and **"Top selected by Team"** underneath it.

`GROUPS[1]` is the generated pseudo-group, **"Top selected by Team"** — each real
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

### The 3b2 banner-seed system

`3b2`'s hero banner has its own switcher (`showBannerSeed`, rendered as a
"Banner" swatch row above the template), separate from and modeled on `2a`'s
`seedTokens()`. `BANNER_SEEDS` (module-level array in `js/logic.js`, near the
SVG shape-generator helpers) holds one entry per swatch — `key`, `label`,
`dot` (swatch colour), `base` (CSS background value or, if `rawBg: true`, a
complete `background-*` declaration string), `motif` (an inline SVG data URI
from a small shape generator, or `""`), `motifSize`/`motifPos`. `sidecarBanner()`
picks the active entry via `state.bannerSeed` (default `"3gwash"`) and derives
everything the template needs: `bannerBg`/`bannerMotif` (the two background
layers), theme-aware text colours (`bannerTitleColor` etc., switched by each
seed's `light` flag), and tint colours for the template's own data-card ID
pills and icon chips (`bannerAccentBg/Fg/Border`, computed from `dot` via the
`tintLight`/`tintDark` helpers) — so switching banners re-tints the whole page,
not just the hero. Seed-level flags change the layout itself: `hideAnn`
(used by `desk3d` only) drops the announcement card entirely and widens the
right grid column (`bannerGridCols`) so the motif gets the full banner;
`annBottom` (used by `hexpulse` only) bottom-aligns the announcement card
(`bannerAnnJustify: "flex-end"`) so its bottom edge lines up with the
search bar's bottom edge in that seed's taller (320px) banner — title stays
top-left and search stays bottom-left, the same `space-between` layout
every other seed uses, just with more vertical room between them.
`bannerHeight` overrides the shared 220px min-height per seed. The motif
sits *behind* the announcement card (same grid cell, `bannerMotif` on the
outer div, the white card as a normal child on top) so it naturally peeks
out wherever the card doesn't cover it — this was a deliberate correction
after two earlier layouts (motif squeezed between columns, then motif
stacked in a separate box below the card) were both explicitly rejected.
Another flag, `searchWhite` (used by `hexpulse` and `starlight`), forces a
white search bar even on a non-`light` seed — those seeds' own dark washes
read better with a solid white search field than the usual translucent one
dark seeds get. There is no longer an on-screen note per seed — the
swatch row used to carry a one-line description (`bannerNote`/`active.note`)
next to the swatches; it was removed from `layouts/3b2.html` (each seed's
`note:` field still exists on `BANNER_SEEDS` as internal documentation, it
just isn't rendered anywhere any more).
Full-width patterns (`dotgrad`, `starlight`, `diamond`, `hexpulse`, `gears`)
are `rawBg: true` and painted directly on the outer grid container rather than
via the `motif` div, each a `svgUrl()`-generated SVG stretched
`background-size:100% 100%` over the whole banner (not just the right
column) so the pattern reaches the true right edge, not just the edge of
whichever column happens to hold the announcement card. `dotGradientInner`'s
left-to-right fade deliberately reaches full density by ~60% of the design
width rather than 100% — the announcement card's left edge usually falls
around 65–73% of the real banner width, so a fade tuned to the full 0–100%
range would still be visibly ramping up right where the card covers it,
looking unfinished in the sliver of pattern that peeks out beside the card.
`gearsCascadeInner` (built from `gearGlyph`, itself built on the older
`gearRingPath`) follows the same "anchored cluster, biggest at the edge,
shrinking as it trails away, low opacity" shape as `diamondCascadeInner`,
just with gears instead of diamonds.

`desk3d` is the one seed that breaks this pattern on purpose: its artwork
is a pixel-accurate port of a hand-authored reference illustration (paper
sheet, an extruded 3D "motadata" wordmark, six floating 3D solids with
real top/front/side faces and blurred ground-shadow ellipses), not
something a `w,h -> svg string` generator could reasonably reproduce. It
is **hand-authored `<svg>` markup living directly in `layouts/3b2.html`**,
gated by `bannerIsDesk` (`sidecarBanner()`'s `activeKey === "desk3d"`) —
nested inside the existing `bannerHideAnn` branch, with the generic
`{{ bannerMotif }}` div kept as the `!bannerIsDesk` fallback for any future
hideAnn seed. `desk3d`'s own `motif` field is `""`; it plays no part in
this seed's rendering. `desk3d`'s `dot` is a sage green (`#3E7C5A`), not
picked to match its swatch alone — it's the seed's whole colour identity:
`bannerAccentBg/Fg/Border` (the data cards' ID pill / icon-chip tint) derive
from it as usual, and so does `bannerPageBg` — the page's own ground
colour, behind the top bar, side rail and every data card.

**Every seed tints the page, not just `desk3d`.** This used to be a
`pageTint` flag that only `desk3d` set (everything else got a flat neutral
`#f6f8fb`); the flag is gone and `bannerPageBg` is now derived for every
seed. It does *not* use `tintLight()`: mixing a seed's `dot` toward white
by a fixed amount gives wildly uneven results, because the dots are not
equally light to begin with — `starlight` (`#A9C6ED`) and `diamond`
(`#8FC3FF`) are already pale, so `tintLight(dot, .95)` left them *lighter*
than the old neutral and their white cards stopped reading as cards at all.
`washFromHex(hex, sat, light)` (next to `tintLight`/`tintDark` in
`js/logic.js`) instead keeps only the source colour's **hue** and pins
saturation and lightness, so every seed lands at the same strength in its
own hue. Three grounds derive from it, each one step darker than the last,
and all three sit *behind* white cards:

- `bannerPageBg` — `washFromHex(dot, .28, .965)`, the page ground
  (replaces the old neutral `#f6f8fb`).
- `bannerTileBg` — `washFromHex(dot, .30, .975)`, the small fills
  *inside* cards: My Assets / My CIs tiles (was `#f7f9fc`) and the Most
  read category pill (was `#f3f6fa`).
- `bannerBadgeBg` — `washFromHex(dot, .34, .958)`, the data-card header
  count badges, 8 / 8 / 4 / 412 (was `#f0f4f9`).

`desk3d`'s approved green ground is preserved by this change, landing at
`rgb(244,249,246)` where the old `pageTint` formula gave
`rgb(245,248,247)`. **The data cards themselves stay white** — they render
from the gallery-wide `cardStyle` design prop (`cardBg`/`cardBorder`/
`cardShadow`), and tinting the card surface per seed would both override
that prop for this one template and flatten the card-against-page contrast.
The seed colour reaches the cards through their contents (ID pills, icon
chips, tiles, badges) instead, which was the explicit call here — don't
"finish the job" by tinting `cardBg` in `3b2`.

Every seed's `dot` is meant to be its whole colour identity, not just its
swatch dot — `hexpulse`'s was originally `#F0A73C` (the orange used for the
decorative rings/plus-marks *inside* `ringDots()`, a minor accent within
the pattern) rather than a shade of its own deep-teal wash, which read as a
mismatched orange on every ID pill and icon chip on the page while the
banner itself was teal. It's now `#0E4C5C`, lifted straight from that
wash's own gradient stops — check any new seed's `dot` against its `base`
wash (not just against decorative motif colours) before shipping it.
This is also *why* `js/dc.js`'s `compileElement` is namespace-aware:
`document.createElement(tag)` always produces an HTML element, so a raw
`<svg>` block authored in a `layouts/*.html` file would silently render as
nothing (an inert unknown element) without it. `compileElement` now checks
`el.namespaceURI === SVG_NS` on the *parsed template node* — the browser's
own HTML parser already resolves an `<svg>` subtree into the real SVG
namespace with correctly-cased tag names (`linearGradient`,
`feGaussianBlur`, etc.) via the standard foreign-content algorithm, so this
reads that resolution back rather than re-deriving it — and calls
`createElementNS` with `el.localName` (not `tagName.toLowerCase()`, which
would mangle that camelCase) when it's true. This is a generic runtime
capability, not a `desk3d` special case: any layout can now embed literal
`<svg>` markup (gradients, filters, camelCase tags and all) and it will
render correctly.

### Layout ID quirks

`renderVals()` derives one `is<id>` boolean per layout from the active tab, and
layouts key off those flags. Two deviations from 1:1 tab→template:

- The Prism family (`2a` / `2ag` / `2an`) shares one template, all three setting
  `is2a`; the hero colour comes from `seedTokens()`.
- `4p` is shared by Education and Healthcare; `show.notHealth` suppresses the
  Quick links and Notice board cards in the Healthcare context.

`3c2` ("Counter II", in the Rejected group) is a hand-duplicated sibling of
`3c` with its action-card and KPI fills inverted (white action cards / glass
KPIs, vs. `3c`'s glass action cards / white KPIs) — a deliberate one-off
variant, not a shared template, kept in sync with `3c` only by hand if `3c`'s
banner/action-row changes again. **Hero spacing is hand-synced too** — both now
carry `padding:30px 48px 40px` on the hero, `margin-top:2px` on the welcome
title and `margin-top:64px` on the search bar. Note the search bar's top margin
is the one the user means by "3C's search margin"; the `margin-top:64px` further
down `3c.html` (~line 101) is a *different* element — the data-cards block — and
an earlier session changed that one by mistake while believing it had done the
search. Check which element you are on before touching either.
Both `3c` and `3c2`'s "Announcements" card show `anns3` (3 rows, no
`overflow-y`) instead of the full `anns5` — it used to render all 5 with
`overflow-y:auto`, which produced a visible scrollbar since 5 rows didn't
fit the card's fixed `{{ reqCardH }}` height (matched to "My Open
Requests" next to it). The header badge still reads the true total (5),
per the usual "badge is the type's real count, not what's on screen"
convention — only the row count and the scroll were the problem.

`js/app.js`'s `activeLayoutId()` resolves the active layout by first checking
`TEMPLATES[tab]` directly, then falling back to scanning `is<id>` flags — read
that function before assuming a tab id always maps to a template file. Six ids
appear in more than one group, which is why 37 layouts fill 45 tab positions.

## Notes worth knowing before editing

- **`reference/3b2-banners/`** holds the user's own reference screenshots for
  the `3b2` banner-seed designs (named `<n>-<seed-key>-<theme>.png`) — kept for
  their own future reference, not wired into the app or referenced by any
  template. Safe to leave alone; not dead weight to clean up.
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
  template. The canonical button is a **24×24 filled tint chip with no
  border**, 15px glyph: approve `#e6f4ec`/`#1f7a44`, reject
  `#fdeaea`/`#b02a2a`, send back `#fdf1d6`/`#8a5a08`. `5a` was the one
  outlier — 28×28, outlined, no fill, a blue check — and was brought in line.
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
- **Most read** is a listing data card: header, then rows of a leading
  `description` icon chip (matching `4c2`'s original treatment), id pill,
  title, date and category. **The chip is NOT gallery-wide** — an earlier
  version of this file claimed it was, but only the **Final 12** carry one
  (2a, 3b2, 3c, 3h, 4c2, 4e, 4f, 4g, 4p, 5a, 7a, 8b). Twenty-one other Most
  read cards have no leading icon at all (2b, 3b, 3c2, 3d, 3g, 3i, 3j, 4a,
  4a2, 4b, 4c, 4d, 4f2, 4i, 5b, 5c, 6b, 6c, 7b, 7c, 8a) and `3h2` has a bare
  glyph with no chip behind it. **Leave them that way — do not add icons to
  the others**; the user asked explicitly for a recolour only. Where the chip
  does exist, its bg/fg **must equal that card's own ID pill bg/fg**, so the
  two read as one pair; this was applied across all 12 and several (3c, 3h,
  4c2, 4f, 4g, 5a) had drifted to an unrelated blue or near-miss grey.
- **ID pills (`SR-201`, `INC-187`, `KB-4`, …) carry no stroke — background
  colour only.** Every `My Open Requests` / `Pending Approvals` / `Most read`
  (or other id-pill-bearing) card in a given template shares one bg/text
  colour for its pills, canonically whichever colour `My Open Requests` used
  before this pass — a handful of templates (4F, 4F2, 4G, 5A, 8B, plus
  smaller near-duplicate-shade mismatches in 2B, 3B, 3D, 4B, 5C) had a
  different colour on their Most Read (or, for 4G, Pending Approvals) pill
  and were brought in line. `3b2`'s pills already read from
  `bannerAccentBg/Fg` (the active banner seed's tint) and needed only the
  stroke removed, not a colour change. **`8b` is the one template whose pill
  colour is anchored elsewhere**: its pills take the My assets / My CIs
  icon-chip pair (`#E4EFF9`/`#1B5E9E`) rather than what My Open Requests
  happened to use, so the pills and those tiles' icons match.
- **`7a`'s cards carry a `1px solid #F0EADD` outline and no `box-shadow`.**
  This flipped twice: the original warm sand stroke (`#E4DCCC`) was removed
  on request in an earlier session (leaving cards to sit on the `#FCFAF6`
  page ground by color contrast alone), then explicitly restored — this
  time in the divider color (`#F0EADD`, the same shade every card's own
  internal header-row divider already uses) rather than the original
  `#E4DCCC`. All 11 card containers carry it (the 10 data cards plus the 4
  hero action tiles), matching the one inner tile (the "Most used
  services" mini-cards) that had this exact border already. The three
  structural `#E4DCCC` borders (top bar's bottom edge, side rail's right
  edge, hero's bottom edge) are unrelated and untouched either way — they
  were never card outlines. Still no `box-shadow` anywhere in this
  template; don't add one, the border now does that job.
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
  In `3h` the section is **one white data card** rather than loose tiles on the
  page: the heading sits inside the card above a divider (mirroring the Most
  Read card beside it), and the eight service tiles lost their individual card
  chrome for a light cool-grey wash (`#F7F9FC`, from 3H's ink-and-steel
  neutrals rather than its amber accent — an amber tile wash was tried first
  and rejected as too yellow) with white icon chips so the icons stay visible
  against it. That
  row's grid is `align-items:stretch`, and both cards are flex columns with the
  tile grid on `flex:1`, so Most Used Services and Most Read always share one
  height — don't put `align-items:start` back on that grid.
- **Contact Us cards carry no chat button.** It was removed everywhere and its
  height held by a spacer (`height:Npx;margin-top:Npx`) so card sizes and row
  alignments are unchanged — keep the spacer if you edit one of these cards.
  Three cards are exceptions the user asked for: **5a**, **2a/2ag/2an** and
  **4p** had the spacer taken out so the card sits to its content. 5a and
  2a live in a hero row that does not stretch, so nothing else moved; 4p's
  spacer (`height:36px;margin-top:0px`, left over from when its contact
  bar used to just be one flex row with nothing below it) was pure dead
  weight once the bar grew a real title+divider+data structure — removing
  it just tightens the bar itself, no other row depends on its height.
- **A proper Contact Us *card* (its own bordered box, title above a
  divider, phone and email as two separate stacked rows) gets a `call`/
  `mail` icon before each row.** `4e`/`4g`'s "Service Desk" card, `7a`'s
  (added — see below), `2a`'s (added — see below), and the pre-existing
  ones on `3h`/`3c`/`3b2`/`4c2`/`5a` all follow this. A Contact Us that
  reads as **one inline bar or strip** instead (phone and email as plain
  text in a single line, not their own rows) does **not** get icons —
  phone and email are joined by a plain `·` instead, e.g.
  `+91 79 4040 0000 · servicedesk@acme.com`. `4f`'s dark rail footer (no
  title, just a `border-top` separator) and `4p`'s horizontal contact bar
  and `8b`'s footer bar (title, then a divider, then the `·`-joined line)
  all follow this — icons were tried on all three at one point and
  explicitly reverted. If a template's Contact Us is ever restyled from
  one shape to the other, its icon treatment must flip with it. `7a` had
  no Contact Us card whatsoever — one was added by splitting the Quick
  links column into two stacked cards (Quick links on top, Contact Us
  below) rather than adding a 4th column or replacing an existing card.
  They started as `flex:1` each (an even 50/50 split of the column's
  stretched height) but that was dropped on request — both now size to
  their own content instead (no `flex:1` on either card, nor on Contact
  Us's inner content wrapper), so Quick links (3 rows) reads taller than
  Contact Us (2 rows) rather than both being forced equal with Contact Us
  carrying a lot of empty space. `8b`'s Contact Us lives in what used to
  be a branding footer (logo, copyright, social icons — all removed,
  `keystoneFoot` deleted as now-dead) at the very bottom of the page. The
  separate "Can't find what you're looking for?" escalation card (CTA
  button + portrait) above it is untouched — that one wasn't the "blue
  row" being replaced. **2a's Contact Us card was
  reworked more heavily**: it used to live inside the hero wash, visible
  for the Navy variant (`2an`) only. The hero action-card grid's big
  "Report an incident" tile no longer spans 2 rows (`grid-row:span 2`
  removed) — it's also sized identically to the other 3 action cards now
  (38px icon, 15px title, no trailing "Report it now →" link, which was
  removed outright) rather than just no-longer-spanning, so all four
  really do read as one equal-height row instead of the row stretching to
  a taller card 1. The announcement card (`pAnnAuto`) moved out of that
  grid into a new row directly below it, paired with a new Contact Us
  card (3h's title/divider/icon+phone/icon+email content) on the left.
  This new row reuses the **exact same** `1.6fr 1fr 1fr 1fr` column
  definition as the action-card row above it (not an independent `320px
  1fr` split) — Contact Us sits in column 1 only, so its width matches
  "Report an incident" exactly, and the announcement card carries
  `grid-column:span 3` to take columns 2–4, matching the other three
  action cards' combined width. `align-items:start` (not the grid default
  `stretch`) so each card is exactly as tall as its own content — Contact
  Us (short: title, divider, 2 rows) and the announcement (one line) end
  up close in height without either being artificially stretched to match
  a taller sibling. The announcement card's own internal content is
  `align-items:flex-start` (was `center`) so the date-tile-plus-text block
  and the carousel controls sit at the top rather than centering in
  whatever height the flex-wrap row ends up with. Contact Us shows
  unconditionally for all three variants (`2a`/`2ag`/`2an`) —
  `showPrismContact` was deleted along with the Navy-only gate.

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
