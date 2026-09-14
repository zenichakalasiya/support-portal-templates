# Handoff — 2026-09-14 15:10

## Read first

`CLAUDE.md`, especially the **House rules** section — the "My Assets / My CIs
are two separate cards" rule is brand new this session and explains the pattern
behind most of the edits below. Also re-read the **Commands** section's note on
running `renderVals()` headlessly in Node; that check was used after every edit
this session instead of opening a browser each time.

## What we worked on this session

A long series of targeted fixes and one recurring structural change: wherever a
template still showed a single merged "My Assets & CIs" card, it was split into
two real cards — "My Assets" (badge 8) and "My CIs" (badge 4) — following the
precedent `3g`/`3j` already set. That split touched most of the gallery. Beyond
that, this session did a full audit-and-fix pass on the Contact Us card format,
the "services" listing → card treatment, and icon backgrounds on asset/CI
tiles, plus several one-off layout fixes called out from screenshots.

## Completed

**"My Assets & CIs" split into two cards** (badge 8 / badge 4, `assets` / `cis`
fixtures), each usually as a 2×2 tile grid:
- `4f`, `4f2` — split side by side; `4g` — added as a new stacked section below
  the existing "My Assets"; `4d` — added as a new row below "Most read
  knowledge" (which was made full-width, its 4 rows now 2×2 to fill the space);
  `4p` — split within its existing 1.55fr column slot, for **both** the
  Healthcare (`isHealth`, `assetsCis8`) and Education (`notHealth`,
  `assetsCis5`) branches; `3i` — split and added as a third column alongside
  the existing "My Open Requests" (now 3 equal columns, `align-items:stretch`);
  `4b` — split into 2 equal columns; `4a` — split into 3 equal columns
  alongside "Contact Us"; `8a`/`8b` — added "My CIs" beside the *existing*
  "My assets" card (left untouched: still `assetsCis3`, badge 9, "In use"
  pills) by nesting both inside the row's original slot so the neighbouring
  Contact/escalation-desk card's width was **not** touched; `4c`/`4c2` — the
  KPI counter-tile block was restructured from an asymmetric 2-tile-then-1-tile
  layout into two full rows of 2 tiles: Open Requests + Approvals, then My
  Assets (8) + My CIs (4).

**Icon backgrounds added to every My Assets / My CIs tile gallery-wide** (19
files: `3b`, `3b2`, `3g`, `2a`/`2ag`/`2an`, `4f`, `4f2`, `4g`, `4b`, `4d`, `3c`,
`3j`, `3i`, `7a`, `7b`, `7c`, `4p`, `4a`, `8a`, `8b`) — matching each template's
own existing action/service-tile chip colour, not one global colour. `6a`/`6b`
already had chips and were left alone. Rejected-group templates (`3h2`, `3d`,
`4h`) were explicitly skipped per earlier instruction not to touch that group.

**Contact Us card format standardised**: title → divider → phone icon+number →
email icon+email, nothing else (no header icon, no hours subtitle, no chat
button). Fixed in `3b`, `3b2`, `3g`, `3j`, `4a`, `3h`, `3h2`, `2a` family, `2b`,
plus reorder-only touch-ups in `3c`/`6c`. Left `5a`/`5c` alone — their contact
cards show Healthcare-specific fields (extension, on-call line), not generic
phone/email, so they're a different card, not this pattern.

**Services listing → card treatment with icon backgrounds**: converted flat/
hairline listings into tinted tile grids in `4p`, `4i`, `4c2`, `5b`, `7a`, `7b`;
added just the missing icon chip to already-boxed cards in `5a`, `4a`, `7c`,
`4e`. Left `4h` alone (its timeline/editorial motif would clash with boxed
tiles) — flagged, not silently skipped.

**Announcement section fixes**: `4f`/`4f2`'s shared `annRows2` fixture had a
"Posted Mon, Aug 11" prose date and an `s` (description) field the markup never
rendered — fixed the data to a compact date ("11 Aug 2026") and rebuilt `4f2`'s
row from a bullet-dot list into the standard date-tile structure (`4f2` had no
description rendering at all before). Then, per a follow-up, "Most read" was
placed beside Announcements in the same row/size in both `4f` and `4f2`,
trimmed to 2 items via a new `kbs2` fixture (`4f2` didn't have a Most Read
section before this — one was added to match `4f`).

**One-off fixes from screenshots**:
- Removed "Track a Request" from the IT group's `railActions` (`3b`/`3b2`) and
  from `3i`'s "Raise a ticket" card (`quietLinks`).
- `4b`: removed the "Home › Information Technology" breadcrumb; went through
  an `align-items:center` attempt for top/bottom alignment with the
  Announcements card, then reverted to `align-items:stretch` +
  `justify-content:space-between` on the left column after feedback that
  centering doesn't actually align the top/bottom edges when block heights
  differ.
- `5a` "My Devices": limited to 4 cards in one row (new `devices4` fixture,
  `devices6` left untouched since `5b` — Rejected — still uses it), added icon
  backgrounds, then bumped title/description font size and row padding/gap on
  request to increase the card's height.
- `3h`: added icon backgrounds to the dark `greetCounters` KPI row (Open
  requests / Approvals / My assets).
- `4d`: "Most read knowledge" was briefly made a 2-column grid to fill its new
  full-row width, then reverted back to a single stacked column per follow-up
  feedback — it's 1 column × 4 rows now.
- `4p`: the "Quick links" card in the Education (`notHealth`) branch wasn't
  stretching to match its row siblings — it sat in a `flex-direction:column`
  wrapper with no `flex:1`. Added `flex:1` to the card and `grid-auto-rows:1fr`
  to its row list so the 3 links space out evenly across the full height.

## In progress

Nothing mid-flight. Every change this session was verified with `node
build.js` (bundle regenerates clean) and the headless `renderVals()` check
(every affected tab/industry combination renders without a thrown error). No
visual browser check was done this session beyond restarting the local
`localhost:5173` server — that's still worth a pass before calling any of this
done.

## Next steps

1. **Visual QA pass in a browser** across everything touched — this session's
   verification was structural (div/sc-for/sc-if balance + headless render),
   not visual. Particularly worth checking: the new 3-column rows (`3i`, `4a`)
   for cramped tile text, and the `4c`/`4c2` counter-tile restructure for
   overall row height now that the tile block shape changed twice.
2. Flagged, no response yet: the new "My CIs" cards in `8a`/`8b` dropped the
   "In use" status pill that "My assets" rows still show — reasonable since it
   doesn't map cleanly to a Configuration Item, but worth confirming.
3. Flagged, no response yet: 3-item asset/CI tiles (`assetsCis3` in `7a`/`7b`/
   `7c`/`8a`/`8b`) use a slightly smaller icon chip (34px) than the 4-item ones
   elsewhere (36px) — intentional size-to-content, but could be made uniform if
   preferred.
4. The Claude artifact snapshot is stale relative to all of this — republish it
   if it's still being used for review.

## Decisions made

- **Split badge numbers are 8 (My Assets) and 4 (My CIs), not derived from the
  old combined "9."** Reason: `3g`/`3j` had already established this exact
  split with these exact numbers in the original design, so every other split
  this session matched that precedent rather than inventing new figures or
  literally halving 9.
- **Where a merged card shares a row with something that must not resize**
  (`8a`/`8b`'s escalation-desk card), the two new cards are nested in a sub-grid
  inside the original card's column slot, rather than changing the outer row's
  column count — keeps the untouched sibling's width exactly as it was.
- **Rejected-group templates were left out of every gallery-wide sweep** this
  session (icon backgrounds, services cards, the Assets/CIs split) unless a
  request named one specifically — consistent with earlier-session guidance not
  to spend effort on templates that aren't shipping.

## Gotchas & notes

- **`4f2` had no "Most Read" section at all before this session** — it isn't
  that one was broken, there simply wasn't one. Added to match `4f`.
- **`assetsCis3`/`assetsCis5`/`assetsCis8` are still in use** by templates this
  session did *not* touch for the Assets/CIs split (e.g. the mixed mini-lists
  inside some Contact-adjacent cards) — don't assume every `assetsCis*` list
  needs splitting; check what a given template actually asked for.
- Same shared-fixture trap as always: `assets`, `cis`, `kbs4`, `annRows2`,
  `railActions`, `quietLinks`, `devices6` are each reused by more than one
  file — every edit this session started with a grep across `layouts/` before
  touching the fixture in `js/logic.js`, and that caught at least one case
  (`devices6` also used by `5b`, so a new `devices4` fixture was added instead
  of mutating the shared one).
- `node build.js` regenerates `js/templates.js`; it was run after every batch
  of layout edits this session, not just once at the end.
