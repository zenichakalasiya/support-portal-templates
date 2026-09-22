# Handoff — 2026-09-22 11:14

## Read first
`CLAUDE.md`'s **"Contact Us cards carry no chat button"** bullet (under
"House rules that hold across the gallery") — it now has a long paragraph
right after it covering this session's work in detail, including the 2A
restructure specifics (grid-row removal, the new row layout, the deleted
`showPrismContact` flag).

## What we worked on this session
One focused request: across all 12 "Final" templates, make every Contact
Us (or equivalent) card show an icon before both the phone number and the
email, matching a reference card (title → divider → icon+phone →
icon+email). Six of the twelve needed work; the other six (5A, 3H, 3C,
3B2, 4C2, and the one card already inside 2a) already matched the
reference and were left alone.

## Completed
- **4E / 4G** — "Service Desk" card's single line
  (`+91 79 4040 0000 · servicedesk@acme.com`, no icons) split into two
  separate icon+text rows (`call` / `mail` glyphs).
- **4F** — same single-line problem in the dark rail's footer area, except
  here it was genuinely broken: `white-space:nowrap` + `text-overflow:
  ellipsis` meant it visibly truncated on narrower widths. Same two-row
  fix.
- **4P** — the horizontal contact bar (title, hours, phone, email side by
  side) had no icons at all; added `call`/`mail` glyphs before the phone
  and email segments without changing the bar's horizontal shape.
- **7A** — had no Contact Us card whatsoever. Rather than adding a new
  column or replacing Academic Calendar (both were offered as options),
  the user asked to split the existing Quick Links column into two
  stacked cards: Quick Links on top, a new Contact Us card below, each
  `flex:1` inside a shared wrapper so they split the column's
  stretched height evenly.
- **8B** — the true "last row" of the page was a branding footer bar
  (motadata logo, © copyright, a row of social icons via a `keystoneFoot`
  fixture) — that whole footer became the Contact Us card (title above,
  icon+phone and icon+email below). `keystoneFoot` was deleted from
  `js/logic.js` since nothing else used it. The separate "Can't find what
  you're looking for?" escalation card (CTA button + portrait image)
  earlier in the page was **not** touched — the user was specific that
  only the blue footer row was in scope.
- **2A (2a/2ag/2an, all three variants)** — the biggest change, and it
  went well beyond "add icons": the user asked to (1) stop the "Report an
  incident" tile from spanning 2 grid rows so all 4 action cards sit in
  one equal-height row, (2) move the announcement card out of that grid
  into a new row below, paired with (3) a brand-new Contact Us card
  (content styled like 3H's: title, divider, icon+phone, icon+email) to
  its left, both stretched to match height via a `320px 1fr` grid with
  `align-items:stretch`. The old Contact Us card that used to live inside
  the hero wash — visible for Navy (`2an`) only via a `showPrismContact`
  flag — was removed entirely; the new card shows unconditionally for all
  three variants. `showPrismContact` is deleted from `seedTokens()` since
  its only two call sites are gone.

## In progress
Nothing mid-flight. Every change was rebuilt (`node build.js`) and
verified two ways: a headless `renderVals()` sweep (36 tabs, 0 failures,
`<div>`/`<sc-if>`/`<sc-for>` balance checked on every edited file) and, this
time, an actual browser check on a local static server — port 5173 was
occupied by two stale listeners when the session started (killed both);
port 5199 worked cleanly. Confirmed visually or via DOM query: 4e, 4g, 4f,
4p, 7a, 8b, 2a (Coral) and 2an (Navy) all show the new icon rows / new
layout correctly, with no console errors.

## Next steps
Nothing outstanding from this request — all 12 Final templates now have a
consistent icon+phone/icon+email Contact Us treatment. If more templates
get promoted into "Final" later, give their Contact Us card (or add one)
the same title/divider/icon-row shape before considering it done.

## Decisions made
- **7A's new Contact Us card was added by splitting an existing column**,
  not by adding a 4th column to the top 3-column row or by replacing
  Academic Calendar — this was an explicit choice among three options
  offered, made to avoid disturbing the row's existing balance.
- **8B's footer (logo/copyright/social icons) was fully repurposed into
  Contact Us**, not supplemented — the user pointed at "the bottom last
  row that is blue" specifically, distinct from the escalation card above
  it, which stays as-is.
- **2A's Contact Us card is no longer Navy-exclusive.** It was previously
  gated by `showPrismContact: navyLocked` inside `seedTokens()`; the user
  explicitly asked for it across "2A's all versions," so the gate and the
  flag are both gone, not just bypassed.

## Gotchas & notes
- **Port 5173 was already bound by two stale processes** at the start of
  this session (visible via `netstat`), consistent with a note from a
  prior handoff about this Chrome profile poisoning that port with a
  service worker from an unrelated Motadata app. Killing the stale PIDs
  and using port 5199 instead worked without issue — prefer a non-5173
  port for this repo's local preview server going forward.
- **The right-hand data-card column in several Final templates scrolls
  independently of the page** (e.g. 4e, 4g) — a plain mouse-wheel `scroll`
  action at a coordinate inside that column sometimes scrolled the wrong
  container or did nothing visible. When a screenshot doesn't show the
  expected scroll progress, verify via a direct DOM query (`querySelector`
  + `closest`) instead of retrying the scroll.
- A separate, unrelated background research task from an earlier part of
  this session (auditing ID-pill colors) went further than asked and
  produced a real, useful commit (`b75d570`) — it was reviewed in full
  before being kept. Nothing about that is pending; mentioned here only
  because the commit's authorship in `git log` (a fork of this session)
  might otherwise look unexplained.
