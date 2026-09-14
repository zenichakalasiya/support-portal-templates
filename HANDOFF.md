# Handoff — 2026-09-14 19:25

## Read first
`CLAUDE.md`'s "Sticky header: only the template's own top bar sticks" note
(under Notes worth knowing) — it documents the corrected sticky behavior from
this session, which reversed an earlier session's approach. Also the "My
Assets"/"My CIs" split rule and the announcement carousel rules, both still
current.

## What we worked on this session
Moved the `3b` (Sidecar) layout from IT & ITES into the Rejected group, then
fixed the gallery's sticky-header behavior: only each template's own header
bar (the motadata logo row) should stick to the top of the viewport — not the
gallery's title/industry-chips/tab-strip chrome (`#shell`), which should
scroll away normally along with the theme bar above it.

## Completed
- `js/logic.js`: removed `3b` from the `"it"` GROUPS entry, added it to
  `"rejected"`. Verified headlessly (IT tabs no longer include `3b`; Rejected
  tabs now end with `3b`).
- `README.md`: catalog table updated to match — `3b` Sidecar moved from the
  IT & ITES row to the Rejected row.
- **Sticky header fix (the real fix this session):** an earlier session made
  `#shell` sticky at `top:0`, which pinned the whole gallery title/chips/tab
  strip along with the template's own header bar underneath it at
  `top:158px`. The user reported (with screenshots) that this was wrong — only
  the motadata logo header row should stick; the gallery chrome should scroll
  away like any other content. Fixed by:
  - `css/base.css`: removed the `#shell { position: sticky; ... }` rule
    entirely — `#shell` is back to normal static flow.
  - All 35 `layouts/*.html` files (every template except `_shell.html`):
    changed their own top bar's sticky offset from `top:158px` to `top:0`,
    since it no longer needs to sit below a sticky `#shell`.
  - Ran `node build.js` and a headless render-all-tabs check (36/36 OK), then
    verified live on `localhost:5173` via `getBoundingClientRect()` after
    scrolling and a screenshot: theme bar and `#shell` both scroll off,
    template header bar pins at the very top. Confirmed against a screenshot
    the user provided showing the old (wrong) behavior.

## In progress
Nothing mid-flight — this batch of work (3b→Rejected move, sticky-header
correction) is complete and about to be published via this same `tatago` run.

## Next steps
- IT & ITES has no layout tagged *(primary)* anymore, since `3b` held that tag
  before the move. Not resolved — flagged to the user, no answer yet. Worth
  asking again: promote another IT & ITES layout (e.g. `3g` Atlas) to primary,
  or leave the group without one.
- The Claude-artifact URL documented in `CLAUDE.md`
  (`https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4`) was
  found dead ("not found") in an earlier session and still hasn't been
  corrected — no replacement URL has been obtained from the user. Low
  priority unless the user brings it up.
- The announcement-carousel spec file
  (`claude-design-announcement-carousel-prompt.md`, untracked in git) has more
  behaviors beyond the "last slide → View all CTA" rule already implemented
  (container-query responsiveness, hover tooltips, swipe/drag, motion timing,
  extending arrows to `4g`/`6c`/`4d`). Explicitly deferred pending the user's
  go-ahead — no reply yet.

## Decisions made
- Sticky behavior is now: gallery chrome (`#shell`) scrolls normally; only the
  in-template header bar is pinned, at `top:0`. This reverses the prior
  session's design (which stuck both, stacked) per explicit user correction
  with screenshots — do not reintroduce a sticky `#shell`.
- `3b` now lives only in the Rejected group (previously also tagged primary
  under IT & ITES).

## Gotchas & notes
- When calibrating any future sticky offset again, remember the trap from a
  prior session: a sticky element can only stay visually pinned while
  scrolling within its own direct parent's box, and `overflow:hidden` on any
  ancestor silently blocks sticky descendants — both applied when the old
  158px-offset scheme was built and both still apply now that the offset is 0.
- `claude-design-announcement-carousel-prompt.md` sitting untracked in git
  root is the spec file the user pointed to earlier for carousel behavior —
  keep it around, don't delete it as gitignore-bait.
