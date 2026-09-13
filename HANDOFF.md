# Handoff — 2026-09-13 22:13

## Read first

`CLAUDE.md` in full — it's short. Focus on **House rules that hold across the
gallery**, which now records the CTA convention and the Contact Us spacer, and the
**Data flow** paragraph on shared fixtures and reused `as="x"` names, which lists
the edit traps that have caught us before.

## What we worked on this session

One gallery-wide CTA pass: every data card header now ends with a right-aligned
`View all ›`, announcement and notice cards read `All announcements ›`, and the
chat button is gone from every Contact Us card with its height preserved.

## Completed

- **106 `View all ›` links** across the data cards — My Open Requests, Pending
  Approvals, Most Read / knowledge, My Assets & CIs, My Devices, My CIs. Each is
  the last child of the title row, pushed right by a `flex:1` spacer, in that
  template's own accent colour.
- **20 `All announcements ›` links** on the announcement and notice cards.
- **Labels normalised** (the user's choice): "All 412 articles", "All 9",
  "View all assets", "View all 9", "Open full list", "Knowledge base" all became
  `View all`. Counts and meta text beside the title were left alone.
- **Chat button removed from all 17 Contact Us cards**, each replaced by a spacer
  carrying the button's exact height and top margin, so card sizes and every row
  alignment are unchanged.
- **Nine duplicate CTAs cleaned up.** 3c, 3i and 3j put their card link in a
  footer below the list; once the header gained one, those cards had two. The
  stale footers were removed.
- **Four section-style headers caught by hand** — 2b and 3d label their cards with
  small uppercase type, which fell outside the sweep's font-size filter. 2b's
  circular arrow buttons and 3d's "Open full list" are now the standard link.

## In progress

Nothing mid-flight. All 35 partials balance on `<div>`, `<sc-for>` and `<sc-if>`,
every tab in every industry resolves to a template, and the served bundle was
checked for counts and for the CTA sitting last in each header row.

## Next steps

1. **4d's announcement strip uses the rotating `annNow` but 4d is not in
   `AUTO_ANN`**, and it has no arrows or dots — it shows the first announcement
   permanently. Either add `4d` to the set or point it at `annFeatured`.
2. **3c no longer responds to the palette switcher** — its theme is pinned to
   `#07101F`, replacing the `{{ brand }}` and `{{ ink }}` tokens the theme bar
   drives. Confirm that is wanted.
3. Review the three templates that moved groups last session (6c → Healthcare,
   4d → Manufacturing, 3c → Government) — they were built for the Rejected shelf
   and may want industry-specific content.
4. Smaller open items: 4f's coloured icon chips, the `campaign` markers on the
   announcement strips, and 6a's assets section (still a 3-up card component
   rather than the tiled list).
5. The Claude artifact (`/artifact/fdeaa529…`) is a stale private snapshot.

## Decisions made

- **Labels normalised rather than preserved.** Asked first; the user chose full
  consistency over keeping the counts in the link text. The counts still appear
  as pills or meta beside the card titles, so nothing was actually lost.
- **Spacer rather than a shorter card** for Contact Us. Asked first; the user
  chose to hold the height so the surrounding rows stay aligned.
- **KPI counter tiles get no CTA.** 4c and 4c2's "My open requests" and
  "Assets & CIs" show a single figure, not a list — a "View all" there would
  point at nothing.
- **Cards outside the four named types keep their own wording** ("Browse
  catalog", "Full catalog", "Browse all"), since the request named specific cards.

## Gotchas & notes

- **`node build.js` after every `layouts/` edit.** The browser reads
  `js/templates.js`, never `layouts/*.html`.
- **A sweep keyed on font-size will miss section-style headers.** 2b and 3d label
  cards with 11.5px uppercase letterspaced type; anything filtering for 13–24px
  headings skips them. Audit after a sweep rather than trusting the count.
- **Some templates put the card link in a footer, not the header** (3c, 3i, 3j) —
  adding a header CTA duplicates it. Check the whole card, not just its header.
- **Earlier traps, still live**: shared fixtures with byte-identical rows, one
  template reusing `as="x"` across several loops (4e uses it for five), identical
  CSS appearing twice in one file, and `sc-if` balance after adding a conditional
  row. Anchor block edits by line with assertions on every boundary.
- **Shell + backticks**: writing markdown through `node -e "…"` in bash eats
  backticks as command substitution and blanks the values silently. Write the
  script to a file instead.
- `layouts/` is the source of truth — `js/templates.js` and `js/slots.js` are
  generated; never hand-edit them.
