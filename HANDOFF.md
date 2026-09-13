# Handoff — 2026-09-13 23:36

## Read first

`CLAUDE.md`, especially **House rules that hold across the gallery**. Three rules
changed this session: the announcement carousel controls now sit inline with the
title (with a documented exception for narrow cards), two Contact Us cards were
allowed to shrink, and government notice cards have their own row rule. The
**Data flow** paragraph on shared fixtures and reused `as="x"` names still lists
the edit traps that have caught us before.

## What we worked on this session

One announcement pass across the gallery — the carousel arrows, dots and
`All announcements ›` link moved onto the same line as the announcement title and
description — plus a batch of per-template fixes the user called out from
screenshots.

## Completed

**Announcement strips, controls inline** — 5c, 2a/2ag/2an, 4i, 3h, 8a, 8b, 4a.
The row is now `[ date block | bold title / description ]` taking the free space,
then a right-aligned group of `‹ dots ›` and the CTA.

- **8a** had no date block at all — the date was small grey text under the title.
  Rebuilt to the standard row; "Read the notice" became `All announcements ›`.
- **2a (Prism)** still carried the old coloured kicker (`ANNOUNCEMENT · Maintenance`)
  and "Read the full notice". Rebuilt the same way. Its `prismAnn()` fixture had
  no description, so `s` was written for all three items, and `pAnnPrev` /
  `pAnnNext` were added beside `pAnnAuto`.
- **4i and 3h got their arrows back.** They were removed earlier when both went
  auto-rotating; they now have both — the `AUTO_ANN` five-second timer still runs
  and the arrows work alongside it.
- **8b** lost its leading `campaign` glyph and gained the description line.
- **5c stacks instead** (see Decisions).

**Duplicate CTAs removed** — the footer `All announcements ›` under 3i and 4b, and
the footer "All notices in the gazette ›" under 3j and 6a. Each of those cards
already carried the link in its header.

**Government notice rows** — 3j and 6a now use the announcement shape with the
notice number as the subtext, matching 3i. Both were date-on-top with a
plain-weight title.

**Education** — 7a and 7b notice rows reshaped the same way; `eduNotices` gained a
description per row. 7c's KPI tiles centred, figure 21px → 30px, gap 5px → 11px,
description 11px → 12px.

**4p (shared by Education and Healthcare)** — the date block over the banner photo
was `rgba(255,255,255,.14)` and invisible; it is now a dark scrim
`rgba(10,26,46,.62)` with a hairline white border. KPI figure 24px → 30px with a
10px gap under it.

**Leading glyphs removed** — the `description` tile in 6a's open request rows, the
`north_east` arrow before 4e's KB rows and before 3j's Most read rows, and the
`campaign` glyph in 4b's Announcements header.

**Smaller fixes** — 2a's Contact Us lost the 44px chat-button spacer; 4d's Most
read reads down one column instead of across two; 5a's Contact Us spacer removed,
right stack top-aligned, and its strip rebuilt (start of the session).

## In progress

Nothing mid-flight. All 36 partials balance on `<div>`, `<sc-for>` and `<sc-if>`,
`renderVals()` runs clean for every affected tab, and the served bundle was
checked for each change.

## Next steps

1. **Review 5c's split strip against the other six** — it is the only card that
   stacks, so confirm it still reads as the same component.
2. **4d's announcement strip uses the rotating `annNow` but 4d is not in
   `AUTO_ANN`**, and it has no arrows or dots — it shows the first announcement
   permanently. Either add `4d` to the set or point it at `annFeatured`.
3. **3c no longer responds to the palette switcher** — its theme is pinned to
   `#07101F`, replacing the `{{ brand }}` and `{{ ink }}` tokens the theme bar
   drives. Confirm that is wanted. 3c is also the one government template whose
   notice rows were not re-checked this session.
4. Review the three templates that moved groups two sessions ago (6c → Healthcare,
   4d → Manufacturing, 3c → Government) — they were built for the Rejected shelf
   and may want industry-specific content.
5. Smaller open items: the remaining `campaign` markers on announcement strips,
   and 6a's assets section (still a 3-up card component rather than the tiled
   list).
6. The Claude artifact (`/artifact/fdeaa529…`) is a stale private snapshot.

## Decisions made

- **5c splits over two lines rather than compressing.** The user reported the
  one-line row not working there; that card is ~440px wide with a three-line
  title. Arrows and dots went top right, the CTA bottom right, rather than
  shrinking the announcement text. Recorded in `CLAUDE.md` as the narrow-card
  exception.
- **4i's strip does not repeat the CTA.** Its section header above the dark card
  already carries `All announcements ›`; adding a second would be exactly the
  duplicate the user has been removing. Flagged to the user rather than done
  silently.
- **4p's date block got a dark scrim, not more white.** The house rule calls for
  `rgba(255,255,255,.14)` on dark cards, but over a bright photo raising the white
  opacity would wash out the white date text. A dark scrim with a white hairline
  makes the block read and keeps the text legible.
- **Government notice subtext is the notice number.** `govNotices` has no
  description field, and 3i already rendered `No. IT/2026/114` in the subtext
  slot, so 3j and 6a follow it rather than inventing copy.
- **Two Contact Us cards may shrink.** 5a and 2a were explicitly asked for; both
  sit in hero rows that do not stretch, so removing the spacer moved nothing else.
  The other 15 keep theirs.
- **4e's trailing arrows kept.** Only the arrow *before* each KB row was asked
  for; the two trailing `north_east` glyphs (Quick links, service catalog) are a
  different affordance and were left, with a note to the user.

## Gotchas & notes

- **`node build.js` after every `layouts/` edit.** The browser reads
  `js/templates.js`, never `layouts/*.html`.
- **The bundle is template literals, not JSON.** A verification script that
  regex-scrapes `"id": "…"` out of `js/templates.js` finds nothing — keys have no
  `.html` suffix and values are backticked. Eval it instead:
  `new Function('window', body)(w)` then read `w.TEMPLATES`.
- **Regex windows in bundle checks.** A `[\s\S]{0,200}` gap between two fragments
  is not enough to span one styled `<div>` — these run 150–250 characters. Two
  checks read false for that reason alone this session.
- **`dc.js` does load in Node** when `window` is passed in as an argument, so
  `renderVals()` can be exercised for every tab without a browser. (`DC.compile`
  still cannot be — it needs `document`.)
- **The localhost server runs from the session scratchpad.** It dies with the
  session that started it; `scratchpad/server.js` can be restarted on 5173 at any
  time and serves with `cache-control: no-store`.
- **Earlier traps, still live**: shared fixtures with byte-identical rows, one
  template reusing `as="x"` across several loops (4e uses it for five), identical
  CSS appearing twice in one file, and `sc-if` balance after adding a conditional
  row. Anchor block edits by line with assertions on every boundary.
- **Shell heredocs**: writing a JS file through `bash <<'EOF'` failed on the
  escaped quotes in this session's markup. Use the Write tool for scripts, and
  never `node -e "…"` for markdown (backticks become command substitution).
- `layouts/` is the source of truth — `js/templates.js` and `js/slots.js` are
  generated; never hand-edit them.
