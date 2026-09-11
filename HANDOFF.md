# Handoff — 2026-09-11 17:32

## Read first

`CLAUDE.md` in full — it's short. The three sections that matter most:
**Commands** (the `node build.js` rule), **The layout catalog** (`LAYOUTS`/`GROUPS`
live *inside* `renderVals()`), and **House rules that hold across the gallery**,
which is new and records the conventions now applied to every template.

## What we worked on this session

Two gallery-wide passes — announcement kickers removed everywhere, and the hero
eyebrow line removed from 21 templates — plus per-template reworks across
Education (7a, 7b, 7c, 4e, 4p), BFSI (8a, 8b, 4a, 4f, 4g) and three Rejected-group
layouts (4d, 3c, 6c).

## Completed

**Gallery-wide**
- **Announcement kickers gone.** The coloured category label (MAINTENANCE,
  ROLLOUT…) removed from all 24 announcement and notice spots. Announcements now
  read title · description · date. `anns` and `anns5` had no description field, so
  one was written for every item. 8a and 8b are one-line strips, so they show
  title + date; notices show sentence + date.
- **Hero eyebrow gone** from 21 templates (2a, 3b, 3b2, 3c, 3g, 3i, 3j, 4a, 4a2,
  4g, 4h, 4i, 5a, 5b, 5c, 6a, 6c, 7a, 7b, 7c, 8a). Where it sat beside a small
  decorative rule, the rule and the emptied wrapper went too.
- **Heading icons** removed across Education, BFSI and the templates touched here.

**Education**
- **7a** — KPI strip removed, 7 header icons, Most used services became a 4-row
  listing.
- **7b** — 7 header icons; both card rows were inverted splits (`1fr/1.25fr` then
  `1.3fr/1fr`), now equal halves so all four cards share a width.
- **7c** — Notice Board replaced by a swipeable announcement carousel in the paper
  palette; approvals card dropped; services / calendar / quick links became one
  row of three at equal heights, services trimmed to 4 and tiled 5a-style; hero
  moved into its own `#F6F2E9` banner band with the action cards outside it, and
  the announcement card shares a grid row with the KPIs.
- **4e** — FAQ became Quick links (4); knowledge, catalog and requests trimmed to
  4; catalog took the assets-tile treatment; hero gradient reworked to a 222px
  eased fade so the photograph blends into the panel; eyebrow and subtitle removed.
- **4p** — KPI icons removed (tiles keep their size), Notice board dropped now the
  banner carousel carries notices, in-card pills squared to 4px.

**BFSI**
- **8a** — announcement strip attached below the banner (5a's pattern), counts card
  removed, banner top padding raised, services band now full width.
- **8b** — KPI row and Announcements card removed, the "Latest notice" bar became
  the announcement swiper, Promoted articles became a Most read listing card beside
  Pending approvals, both at equal width and height.
- **4a** — rebuilt: banking banner with the greeting on the colour side and the
  photograph at full strength, small action cards below it, and the body as three
  two-column rows (services/approvals, requests/most read, assets/contact). A
  Pending approvals card was added — 4a had none.
- **4f** — Most read listing card added. **4g** — Most read rows normalised.

**Rejected group**
- **4d** — three KPIs moved beside the action cards at matching heights in white
  cards; assets card rebuilt in the 3b style.
- **3c** — banner recoloured `#07101F` and the whole template's accents and icons
  pinned to it; search resized twice (now 40px title / 48px search); services
  divider and the one-liner under the search removed; Most read cut to 3 and
  bottom-aligned with Pending approvals via a 2×2 grid; assets and CIs tiled.
- **6c** — top row rearranged to Announcements · (title+search over Most Read) ·
  Contact us; the duplicate left contact card removed; requests trimmed to 4;
  outer columns widened 25% → 30%; title card reordered so the heading leads and
  the search sits at the foot.

**New fixtures** in `logic.js`: `quickLinks4`, `deptCards4`, plus descriptions on
`anns` / `anns5`.

## In progress

Nothing mid-flight. Everything is built, rebuilt and verified against what
`localhost:5173` serves.

## Next steps

1. Look over the gallery after the two sweeps — the eyebrow removal touched 21
   templates, so a pass across several tabs is worth it.
2. **3c no longer responds to the palette switcher.** Pinning its theme to
   `#07101F` replaced `{{ brand }}` and `{{ ink }}`, which the theme bar drives.
   Decide whether that's wanted or whether the banner should use `{{ ink }}` so
   both follow the selected palette.
3. 4f's card headers use coloured icon chips rather than bare icons, so they
   survived the icon sweep. Decide whether those four should go too.
4. The `campaign` icon still marks the announcement bars in 3h, 4p, 5c, 8a, 8b —
   a section marker, not row data. Remove or keep.
5. 6a Gazette's assets section is still a 3-up card component rather than the
   tiled list the rest of the gallery uses.
6. The Claude artifact (`/artifact/fdeaa529…`) is a stale private snapshot; either
   resync it or retire it now that Pages is the shared link.

## Decisions made

- **Notices lost their kicker too** (user's call), but kept their category-free
  sentence + date. Descriptions were added only to the `anns` family, since
  notices already carry a full sentence as their title.
- **Per-layout tints over one shared grey** for tiles and fades, so warm paper
  layouts (7a/7c) and navy ones (8a/8b) keep their palette while sharing the
  treatment.
- **Semantic colours fixed, geometry local** — approval icon tints are constant;
  radius follows each template.
- **Structure over tweaks for alignment.** Bottom-aligning two cards in different
  columns (3c) or aligning a card with a KPI block (7c) was done by putting them
  in a shared grid row, not by nudging heights.
- Hero eyebrow removal was scoped to the line above the welcome heading only;
  other uppercase labels (ANNOUNCEMENT strips, KPI labels, calendar months) stay.

## Gotchas & notes

- **`node build.js` after every `layouts/` edit.** The browser reads
  `js/templates.js`, never `layouts/*.html`.
- **A template can reuse `as="x"` across several loops.** 4e uses it for `kbs4`,
  `quickLinks4`, `anns`, `services4` and `requests4` — a bare `{{ x.t }}` match put
  a description in the wrong card and removed an arrow from the wrong rows. Scope
  edits to the `sc-for` block, then verify what each loop renders.
- **Fixture lists share byte-identical rows.** Stripping an icon from `kpis3j`
  silently hit `empKpis` (used by 4p) because that list appears earlier in
  `logic.js`. Anchor by line, and print the value back afterwards.
- **Identical CSS can appear twice in one file.** A block regex for 7a's KPI grid
  also matched the action-card grid 68 lines earlier; it would have deleted both.
  Anchor block edits by line number with assertions on every boundary.
- **`DC.compile` can't be smoke-tested in Node** (no DOM). Use tag-balance checks
  plus `renderVals()`, then look in the browser.
- `localhost:5173` is served by a `server.js` in an **old session's temp
  scratchpad**; if that process dies the script may be gone with it.
- `layouts/` is the source of truth — `js/templates.js` and `js/slots.js` are
  generated; never hand-edit them.
