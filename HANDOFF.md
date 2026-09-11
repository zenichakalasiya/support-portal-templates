# Handoff — 2026-09-11 18:55

## Read first

`CLAUDE.md` in full — it's short. The sections that matter most:
**Commands** (the `node build.js` rule), **The layout catalog** (`LAYOUTS`/`GROUPS`
live inside `renderVals()`), **House rules that hold across the gallery** (now
covering the announcement row shape and the `AUTO_ANN` rotation set), and the
**Data flow** paragraph about shared fixtures and reused `as="x"` names — that one
records the three near-misses from this session.

## What we worked on this session

A gallery-wide announcement consistency pass — one row shape, filled date blocks,
auto-rotating carousels — plus per-template work across Education, BFSI,
Manufacturing, Government and Healthcare. Three templates moved out of the
Rejected group into live industries.

## Completed

**Announcements, gallery-wide**
- Every announcement row is now **[ filled date block ] [ bold title / small
  regular subtext ]** — 12 list cards, 5 carousels, 3 strips, plus 3i's notices
  card and 4f's rows. Colours are lifted from each template's own palette.
- Date blocks went from outlined to **filled**: `#f1f3f6` on light cards,
  `rgba(255,255,255,.14)` on the dark ones.
- The photo was removed from the 3b2 and 7c carousels; the four hero banner
  images (3h, 4p, 5c, 4e) were left alone.
- `AUTO_ANN` in `logic.js` now holds `3h`, `4g`, `4i`, `6c` — those rotate on
  their own every five seconds. 4i and 3h lost their arrows, keeping dots only.
- Fixtures gained descriptions where the hierarchy needed them: `anns`, `anns5`,
  `annRows2`.

**Per template**
- **7c** — title block moved to the top left; the four KPIs and the announcement
  card now sit in one stretched row of five. Services trimmed to 4 and the three
  cards below equalised.
- **4p** — the assets row branches by group on a new `isHealth` flag: Healthcare
  gets a full-width card with 8 tiles (Quick links is hidden there), every other
  group gets 5 tiles beside Quick links, bottom-aligned.
- **4i / 3h** — announcement carousels rotate automatically, arrows removed.
- **4c** — the knowledge card's date text went white; it sits on purple.
- **4f / 4f2** — "View all" added to Announcements; 4f's rows on the standard
  hierarchy.
- **3g** — Pending Approvals paired with Most Read Knowledge at equal width;
  Announcements and Contact us share a height again.
- **6c** — rebuilt into three bands (announcements · title+search · contact /
  start something · most read · approvals / services · open requests), one
  rotating announcement, contact description dropped, approvals card fills its
  column so its bottom meets Most Read.
- **4d** — announcement strip on the standard hierarchy with a single
  announcement and an "All announcements" CTA; knowledge trimmed to 4; Most read
  and My assets now share a row.
- **3c** — assets and CIs tiled 3b-style; whole theme pinned to the banner colour.
- **8b** — divider removed, date moved into the standard block.
- **4a** — Support services switched from `deptCards4` (which duplicated the
  action cards) to `services4`; announcements added beneath the banner image.

**Group moves** — `GROUPS` in `logic.js`, and the README table:
- **6c → Healthcare**, **4d → Manufacturing**, **3c → Government**.
- Rejected is down to 7: 4a2, 4h, 3d, 3h2, 2b, 5b, 6b.

**New fixtures**: `assetsCis5`, `assetsCis8`, `quickLinks4`, `deptCards4`,
`approvals4`, `kbs3`, `kpis3j`, plus the `isHealth` flag.

## In progress

Nothing mid-flight. All 35 partials balance on `<div>`, `<sc-for>` and `<sc-if>`,
and everything was verified against what `localhost:5173` serves.

## Next steps

1. **4d's announcement strip uses `annNow` but 4d is not in `AUTO_ANN`**, and it
   has no arrows or dots — so it shows the first announcement permanently. Either
   add `4d` to the set or point it at `annFeatured` as a deliberately fixed one.
2. **3c no longer responds to the palette switcher** — pinning its theme to
   `#07101F` replaced the `{{ brand }}` and `{{ ink }}` tokens the theme bar
   drives. Confirm that's wanted.
3. Look over the three moved templates in their new groups — they were built for
   the Rejected shelf and may want industry-specific content.
4. Smaller open questions: 4f's coloured icon chips (left in place), the
   `campaign` markers on the announcement strips, and 6a's assets section, which
   is still a 3-up card component rather than the tiled list.
5. The Claude artifact (`/artifact/fdeaa529…`) is a stale private snapshot.

## Decisions made

- **Border → fill for date blocks**, because a single tint can't serve warm
  paper, sage, navy and ink-backed cards; each template keeps its own tone.
- **Notices lost their kicker too** (the user's call) but kept sentence + date,
  since they have no description field.
- **Structure over tweaks for alignment** — bottom-aligning cards in different
  columns was solved by putting them in a shared grid row, not by nudging heights.
- **`isHealth` rather than duplicating 4p** — one template, two conditional rows,
  so the Healthcare and Education variants stay in sync.
- 4f2 got the same "View all" as 4f, and 4f's icon chips were left alone, since
  they're a chip treatment rather than the bare heading icons that were removed.

## Gotchas & notes

- **`node build.js` after every `layouts/` edit.** The browser reads
  `js/templates.js`, never `layouts/*.html`.
- **Three edit traps cost time this session**, all now in `CLAUDE.md`:
  a template reusing `as="x"` across five loops (4e), identical CSS appearing
  twice in one file (7a's two `repeat(4,…)` grids), and an `sc-if` left unbalanced
  by a conditional row (4p). Anchor by line with assertions, and check
  `<sc-if>` balance as well as `<div>`.
- **Shell + backticks**: writing markdown through `node -e "…"` in bash eats
  backticks as command substitution and silently blanks the values. Write the
  script to a file instead — this mangled `CLAUDE.md` once and had to be repaired.
- **`DC.compile` can't be smoke-tested in Node** (no DOM). Use tag-balance checks
  plus `renderVals()`, then look in the browser.
- `localhost:5173` is served by a `server.js` in an old session's temp scratchpad.
- `layouts/` is the source of truth — `js/templates.js` and `js/slots.js` are
  generated; never hand-edit them.
