# Handoff — 2026-09-14 16:59

## Read first

`CLAUDE.md`'s **House rules** section, two entries specifically: the new
**"Sticky headers, two layers"** note under *Notes worth knowing before
editing* (a real bug fix, not just a style choice — read it before touching
any template's top bar), and the rewritten **rotating announcements** rule,
which now distinguishes the card-row announcement style (still free to wrap)
from the hero-embedded carousel style (now truncated to one line on purpose —
these two used to say the opposite thing until this session).

## What we worked on this session

Continuation of the same session recorded in this file's previous version
(also dated today, 15:10) — that handoff is superseded by this one, but its
"My Assets & CIs split" work is still the foundation most of today's edits
build on. This half of the session was a mix of: finishing the Assets/CIs
split on the remaining templates, several one-off layout fixes from
screenshots, a global text rename, and — the big one — finding and fixing a
real, silent sticky-positioning bug that had been breaking the gallery's own
sticky header (and every template's own top bar) all along.

## Completed

**Global text rename**: "All announcements" → "View all", gallery-wide (23
shipping templates; the 3 Rejected-group files that had it — `3d`, `4a2`,
`5b` — were left alone, consistent with not touching that group otherwise).

**`4i` announcement strip**: removed the separate "Announcements" card-header
row entirely (title + "5 active" + CTA) — the CTA (`View all ›`) now lives
inside the dark strip itself, on the same line as the arrows/dots, matching
what the house rule already says `4i` should look like.

**More "My Assets & CIs" → two-card splits** (continuing the pattern from
the prior handoff):
- `2a`/`2ag`/`2an` (all three Prism colours, one shared file) — the old
  merged "My Estate" card is now "My Assets" (8) and "My CIs" (4) side by
  side, each a stacked column of full-width rows (icon, name, "tag ·
  category"), replacing the old auto-fit tile grid, per a reference
  screenshot the user gave.
- `3b` — added a "My CIs" card into the My Assets row (which didn't exist
  before), and added a **new** Announcements + Most Read row below it (`3b`
  had no Most Read section at all before this).
- `3b2` — full restructure: fixed the Contact Us card to hug its content
  (removed a large empty spacer), added a missing "My CIs" card, and
  rebuilt the whole body into a proper `268px 1fr 1fr` grid — row 1 is
  action cards | My Open Requests | Pending Approvals, row 2 is Contact Us |
  My Assets (2×2) | My CIs (2×2, new), row 3 is Most Read spanning full
  width (kept, per the user's explicit choice, rather than dropped).

**`3g` — two separate fixes, in sequence**:
1. Its "Most Used Services" tile grid was `auto-fit,minmax(180px,1fr)`,
   which was cramming all 6 tiles into one badly-truncated row at the
   gallery's actual rendered width — forced to a fixed `repeat(3,...)` (2
   rows × 3 columns).
2. The Announcements + Contact Us pair was first moved out to span the full
   page width (both columns of the 372px/1fr grid combined) at the user's
   request — but that broke the layout: the right column, now shorter than
   the left, left a large stretched blank gap before the relocated row. Per
   a follow-up correction, **reverted** that: Announcements + Contact Us are
   back inside the right column's own flex stack as its 3rd row, with
   `flex:1;min-height:0` so it fills the column's remaining height instead
   of leaving a gap. Net effect: no page-width breakout, just a cleaner
   3-row right column.

**Colour fix**: `7a`'s "Most used services" and "My devices" tile rows read
as too strongly yellow/tan — softened both the row background (`#FBF6EC`/
`#F6F2E9` → `#FCFAF4`) and the icon-tile background (`#F3E6CC` → `#F5EAD6`)
to a much paler cream, keeping the same amber icon colour for contrast.

**Sticky header — the actual bug, found and fixed**:
- `css/base.css` had `#shell > div { position: sticky; }` — targeting
  `#shell`'s rendered *child*, not `#shell` itself. Since that child is
  exactly as tall as `#shell` (a pass-through wrapper with no extra
  content), it had zero room to ever stay pinned: a sticky element can only
  remain stuck within its own parent's box, and the parent here offered no
  slack. Fixed to `#shell { position: sticky; top: 0; z-index: 30; }` —
  `#shell`'s real parent (`.app`) is the full page height, so this actually
  works. This one CSS fix makes the gallery's own header (title, industry
  chips, tab strip) genuinely sticky for every template, immediately.
- Rolled the equivalent fix out to **all 34 shipping-and-rejected
  templates' own top bars** (the `motadata` logo strip): added
  `position:sticky;top:158px;z-index:25` (158px = `#shell`'s measured
  height, so the template header docks directly below it) and removed an
  `overflow:hidden` on each template's outer wrapper div that was silently
  blocking the sticky effect. Verified live in a browser (not just by
  reading code) that both layers stay pinned correctly while content
  scrolls underneath, and that scrolling down still leaves the industry
  chips and tab strip clickable so templates can be switched mid-scroll.

**Announcement carousel title truncation**: the hero-embedded carousel title
(`annNow.t`, set directly inside a template's welcome banner) could wrap to
2 lines and visibly grow the whole banner's height. Truncated to one line
(`white-space:nowrap;overflow:hidden;text-overflow:ellipsis`) in `3b2` and
every other template using this same hero-carousel pattern: `8a`, `8b`,
`7c`, `6c`, `5c`, `4p`, `4i`, `4d`, `4a`, `3h` (`4g` already had it). This is
deliberately the opposite of the card-row announcement rule, which still
allows wrapping — see the updated house rule in `CLAUDE.md`.

## In progress

Nothing mid-flight. Everything above was verified with `node build.js`
(clean rebuild), a `<div>`/`<sc-for>`/`<sc-if>` balance check on every
touched file, and the headless `renderVals()` check for every affected
tab/industry combination. The sticky-header fix specifically was also
verified live in a real browser via the Claude-in-Chrome tools (scrolled,
measured `getBoundingClientRect()`, screenshotted) — not just read from
source — since a CSS layout bug like that can't be caught by the headless
render check.

## Next steps

1. **Full visual QA pass** is still the biggest open item — most of this
   session's verification has been structural/headless. The sticky header
   rollout in particular touched 34 files mechanically (via `sed`, matching
   a shared pattern) rather than by hand each time; worth spot-checking a
   handful of templates with unusual headers (`4h`'s padding-based header,
   `8a`'s 52px one) to confirm the `top:158px` offset still lines up
   visually, not just per the DOM measurements taken.
2. Still open from the previous handoff, unconfirmed: whether `8a`/`8b`'s
   new "My CIs" cards should have an "In use" pill like their "My Assets"
   rows do, and whether the 34px vs 36px icon-chip size difference between
   3-item and 4-item asset/CI tiles should be unified.
3. The Claude artifact snapshot is now quite stale relative to the gallery —
   republish it if it's still the thing being reviewed from.

## Decisions made

- **The `3g` full-page-width breakout for Announcements/Contact Us was
  tried, then explicitly reverted** after the user saw the actual result
  (a large blank gap) and clarified they wanted it to fill the *existing*
  right column, not break out across the whole page. Recorded so a future
  session doesn't "fix" it back to the full-width version thinking that was
  the intended end state — it wasn't.
- **`3b2`'s "Most Read" was kept as a new 3rd row (not dropped)** when My
  CIs took its old spot next to My Assets — the user chose this explicitly
  over removing it.
- **Sticky offset is a calibrated constant (158px), not JS-measured.**
  `#shell`'s actual rendered height was measured once via
  `getBoundingClientRect()` (≈157.67px) and rounded; this matches the
  codebase's existing convention of hand-tuned pixel constants (spacer
  heights, etc.) rather than adding a `ref`-based JS measurement system for
  one value that's expected to change rarely, if ever.

## Gotchas & notes

- **The sticky bug was subtle and easy to misdiagnose.** `getComputedStyle`
  reported `position: sticky` correctly the whole time; the element still
  didn't stick, because the *parent* had no extra height for it to stick
  within. If sticky positioning "isn't working" and computed style looks
  right, check whether the sticky element's direct parent is taller than
  the element itself — if they're the same height, sticky can never
  visibly hold.
- **`overflow:hidden` on a layout's outer wrapper silently blocks sticky
  descendants**, even when nothing is actually being clipped. Every
  template had this as copy-pasted boilerplate from the design export; it
  was safe to remove everywhere it was tested, but if a future layout
  visually regresses at its very top edge (a stray corner, a bleeding
  background), that's the first thing to check.
- Same shared-fixture caution as always applies to the sed-based bulk edits
  this session (the sticky-header rollout, the "View all" rename): every
  pattern was grepped for exact occurrence count per file *before* the bulk
  edit ran, specifically to make sure `3b` (already hand-edited earlier)
  wouldn't get double-matched and corrupted by the same sed pass meant for
  the other 33 files.
- `node build.js` was run after every batch of edits, not just once at the
  end, same as always.
