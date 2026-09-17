# Handoff — 2026-09-17 15:43

## Read first
`CLAUDE.md`'s new **"The 3b2 banner-seed system"** section (under Architecture)
— it documents `BANNER_SEEDS`, `sidecarBanner()`, and the `hideAnn`/`center`/
`bannerHeight` per-seed overrides added this session. Also new: the **"Final"**
pseudo-group note (top of "The layout catalog"), the `3c2` duplicate note
(end of "Layout ID quirks"), and the updated "Most read" house rule (now
includes a leading icon chip on every row, gallery-wide).

## What we worked on this session
An extremely long session covering three broad threads: (1) a large batch of
explicit UI fixes across ~15 templates (7a, 4c2, 5a, 3h, 4f, 2a, 3c, 8b, 4g,
4e, 4p — spacing, colors, card restructuring, search-bar conventions), (2)
building an entirely new banner-seed switcher system for `3b2` from scratch,
iterating through several rejected layouts before landing on the final
correct design, and (3) a gallery-wide consistency pass adding a leading icon
to every "Most read" row and fixing several leftover theme-mismatched colors.

## Completed
- **New "Final" pseudo-group** (`js/logic.js`, unshifted before "Top selected
  by Team"): a fixed ordered set of 12 ship-ready layouts (4e, 4g, 7a, 4c2,
  5a, 3h, 4f, 2a, 3b2, 3c, 4p, 8b). Group description text truncates to one
  line (`layouts/_shell.html`).
- **Date tiles redesigned gallery-wide**: every announcement/notice date tile
  now shows day + 3-letter month (`dateTile()`/`withDateTiles()` in
  `logic.js`), not a weekday — this touched every layout with an `anns`-style
  fixture, including several in the Rejected group that share the fixture.
- **7a (Quadrangle)**: 6px→10px corner radius on every card, hover-reveal
  arrows on action tiles, most-used-services promoted to its own full-width
  row (category-only subtext), "My Open Requests" card added, brown/gold ID
  pill colors standardized, My Devices split into My Assets (8) + My CIs (4),
  gap added between hero subtext and search bar.
- **4c2 (Mosaic II)**: hover-reveal arrows, announcement description
  truncated to 1 line, quick links top-aligned, most-used-services switched
  to category-only subtext, 4 KPI tiles redesigned (number-top, centered, no
  subtext), Most Read given a header + icon chip, "Need support?" icon
  removed and its broken contact row fixed to a proper phone row.
- **Gallery-wide**: 17 templates' search bars converted from icon+text-button
  to icon-only (no "Search" CTA text); services-subtext audited everywhere to
  be category-only (`servicesCat4`/`servicesCat6` derived fixtures added);
  every carousel's last-slide swap corrected to keep circular prev/next
  arrows unchanged and wrap only the "View all" swap-in in an **outlined**
  pill (this was rebuilt twice after two rounds of user correction).
- **5a**: My Assets/My CIs split from a combined card; added Most Read as a
  3rd column; Pending Approvals and My Open Requests trimmed to exactly 4
  rows each (swapped onto the existing `approvals4`/`requests4` fixtures);
  Most Used Services icon color fixed from a mismatched teal to the
  template's own blue.
- **3h**: KPI tiles simplified (icon removed, number+label only), Contact Us
  card's flex-wrap disabled so it never reflows at narrow widths, Quick
  Links row padding tightened, description truncated to 1 line with the
  Quick Links card height matched via the row's existing grid stretch, bolt
  icon removed from the Quick Links header.
- **4f**: Popular Services promoted to the top of the page as a 6-card row,
  search icon moved to the right.
- **2a (Prism, shared by 2a/2ag/2an)**: removed the empty white pill above
  the hero title, restructured hero to title/subtext top-left with a real
  gap before the search bar, added a 6th service card, My Assets/CIs data
  tiles were briefly hardcoded to a coral tint (`FBE3DF`) then made
  theme-aware again via `{{ t2Badge }}` after the user reported 2an (Navy)
  showing a wrong red/coral background — now resolves per-theme (coral tone
  for Coral, light gray-blue for Navy, mint for Green).
- **3c**: title forced to 1 line, gaps increased between title/subtext/search,
  Contact Us card rebuilt to match 3h's style (title + phone + email) and
  widened into the services grid (6 equal columns instead of 5+90px) so it
  has room, sized/height-matched to the service cards.
- **3c2 ("Counter II")**: new hand-built duplicate of 3c with action-card and
  KPI fills inverted (white action cards / glass KPIs), added to the
  Rejected group.
- **4g**: stroke removed from the 3 hero action tiles (background-only glass
  style now).
- **8b**: My Assets briefly bumped to 5 items then reverted back to 4 (to
  keep symmetry with My CIs' 4) per explicit follow-up.
- **3b2 banner-seed system, built from scratch this session** (see
  `CLAUDE.md`'s new Architecture section for the mechanics). Final state: 7
  seeds — **3G Wash** (default; 3g's own radial-glow + dot-grid background,
  light theme), **Motadata Desk** (an original isometric-shape illustration:
  a notebook doodled with an "M" plus a wedge/cube/dome/cone, on a sage wash;
  announcement card hidden for this one seed only), **Dot Gradient** (a
  halftone dot field whose own opacity fades left-to-right), **Starlight**
  (scattered rounded-square "stars", small sparkle stars, a ring and an arch,
  full-width behind both the text and the announcement card, on a grayish
  navy wash — shapes were later given a corner-radius-square treatment
  instead of spiky bursts, and all opacities halved), **Diamond Cascade**
  (rounded-corner-square cluster anchored at the right edge cascading in a
  shrinking sequence toward the 40%-width mark, replacing an earlier
  "network of diamond outlines + connecting lines" design the user disliked),
  **Hex Pulse Blue** (orange rings, plus marks and a dot grid full-width at
  low opacity over a deep teal wash; this one seed also has its own taller
  height (320px vs the shared 220px) and a vertically-centered layout — text
  stays left-aligned, but the title/search block centers to match the
  announcement card's height), **Gear Works** (unchanged from earlier in the
  session — a pair of interlocking gears, bottom-right, steel-grey wash).
  10 earlier seeds (Layered Blocks, ITSM Flow, Pinwheel, Dotted Blocks, Hex
  Medical, Hex Light, Pulse & Plus, Circuit Tech, Confetti Blocks, Playful X)
  were built, then explicitly removed per a later request to trim the set —
  their now-orphaned SVG-generator helper functions were deleted too.
  Also added: theme-aware tinting (`bannerAccentBg/Fg/Border`, derived from
  each seed's swatch colour) applied to 3b2's own My Open Requests/Pending
  Approvals ID pills, My Assets/My CIs icon chips, and Most Read's icon+pill,
  so switching the banner re-tints the rest of the page too. The user's
  reference screenshots for these designs are saved in
  `reference/3b2-banners/` for their own future use (not wired into the app).
- **Most Read icon convention, gallery-wide**: added a leading `description`
  icon chip before the ID pill in every Most Read row across 10 templates
  (4e, 4g, 7a, 5a, 4f, 2a, 3b2, 3c, 4p, 8b), matching the pattern 4c2 already
  had. Colors matched to each template's own existing accent (blue for the
  4e/4g/4p/4f/8b family, brown/gold for 7a, theme variables for 2a).

## In progress
Nothing mid-flight. Every change above is rebuilt (`node build.js`) and
headless-verified (all 37 tabs render without error — 3c2 brought the total
from 36 to 37 — with `<div>`/`<sc-if>`/`<sc-for>`/`<span>` balance checked on
every edited file this session). This `tatago` run is saving and publishing
this exact batch of work.

## Next steps
- Nothing explicitly deferred or asked-for-later by the user this session —
  every request in this session was fully implemented and confirmed working
  before moving to the next one.
- Worth a light visual pass next time someone's in the gallery: the 3b2
  banner-seed switcher has grown to 7 options with quite different visual
  languages (light/dark, full-width/corner-accent, hideAnn/normal) — if more
  seeds get added, consider whether the swatch row still reads well at a
  glance, or whether it needs grouping/scrolling treatment.
- The dead Claude-artifact URL noted in previous handoffs
  (`https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4`) is
  still uncorrected — not raised again this session, still low priority.

## Decisions made
- **3b2's banner motif sits behind the announcement card in the same grid
  cell**, not stacked below it or squeezed between columns — this was only
  reached after two earlier layouts were built and explicitly rejected by
  the user. Any future banner-seed work should keep this architecture (motif
  as the outer cell's own background, ann card as a normal child on top).
- **Hex Pulse Blue and Motadata Desk are allowed per-seed layout overrides**
  (height, centering, hiding the ann card) that no other seed uses — this is
  intentional per explicit request, not scope creep; don't generalize these
  overrides to other seeds without being asked.
- **Carousel last-slide treatment is locked**: circular prev/next arrows
  never change shape; only the "View all" swap-in becomes an outlined
  (never filled) pill. This was corrected from an initial "one big merged
  pill" implementation the user explicitly rejected — don't regress to that.
- **10 of the original 17 banner seeds were deliberately deleted**, not just
  hidden — their generator functions are gone from `logic.js` too. If asked
  to "bring back" one of those seed names, it needs to be rebuilt, not
  un-hidden.
- **`2a`'s My Assets/CIs tile background must stay theme-aware
  (`{{ t2Badge }}`)**, not hardcoded to one palette's tint — a hardcoded
  coral value was tried once and caused a visibly wrong red background on
  the Navy variant.

## Gotchas & notes
- The Chrome extension used for visual verification was flaky throughout
  this session (screenshot zoom/scale inconsistencies, occasional stale
  renders, one `dispatchEvent` click needed in place of a coordinate click
  when a screenshot's apparent zoom level didn't match reality). When a
  screenshot looks visually wrong but the change should be correct, prefer
  `javascript_tool` DOM inspection (reading actual computed `style`
  attributes) over trusting the screenshot — this caught at least one false
  alarm this session where the fix was actually correct.
- `svgUrl()` + the small shape-generator functions (`isoCube`, `isoWedge`,
  `halfDome`, `isoCone`, `roundedDiamond`, `starBurst`, `squareShape`,
  `ringArc`→removed, `dotGrid`, `dotGradientInner`, `nightSkyInner`,
  `ringDots`, `diamondCascadeInner`, `motadataDeskInner`, `fadeOp`,
  `tintLight`/`tintDark`) all live as plain module-scope functions near the
  top of `js/logic.js`, above `BANNER_SEEDS`. Before adding a new banner
  seed, check whether an existing generator can be reused/parameterized
  rather than writing a near-duplicate.
- `fadeOp(x, w, maxOp, startT)` (used by `diamondCascadeInner`) takes an
  optional 4th param for where the fade begins (fraction of width, default
  0.55) — this was added so the cascade could be told to extend to the
  40%-width mark instead of the original 55% used elsewhere.
