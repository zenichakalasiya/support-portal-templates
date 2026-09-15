# Handoff — 2026-09-15 19:32

## Read first
`CLAUDE.md`'s three new/updated notes: "The layout catalog" (the new
`TEAM_PICKS`-driven pseudo-group), the carousel "Last-slide rule" under house
rules, and "The tab strip's horizontal scroll survives redraws" under Notes
worth knowing. All three describe mechanisms added or fixed this session.

## What we worked on this session
Continued polishing the announcement carousel pattern gallery-wide, cleaned up
a services-category card in `3i`, added a new curated "Top selected by Team"
catalog group with per-person picks and industry tags, and fixed a real bug
where the tab strip's horizontal scroll position kept resetting.

## Completed
- **Carousel last-slide CTA extended to the two remaining auto-only carousels**
  (`4g`, `6c`) — they now have `annPrev`/`annNext` arrows and the same
  arrow-swaps-to-"View all"-on-last-slide behavior as the other 9 carousel
  cards. `6c` also had a redundant, always-visible "View all" in its card
  header removed (now redundant with the arrow-based swap) and its header
  simplified to just the title. `4d` was deliberately left alone — it shows
  `annNow` but has no dots/arrows, so it isn't a real carousel.
- **`4g`'s announcement strip rebuilt** to match the standard pattern used
  everywhere else: date block on the left, title+subtext next to it, swiper
  (arrows + dots) on the right. Previously it used a one-off icon+eyebrow-label
  treatment with no subtext shown at all. Since `4g` is one shared template
  file, this fixes it across every industry it appears in (IT & ITES,
  Government, BFSI) at once.
- **`3i`'s "Browse by category" section cleaned up**: removed the "214
  services across 8 categories" subtext under the heading, and removed each
  category card's description line — cards now show just icon + title,
  centered, in a shorter card.
- **New "Top selected by Team" catalog group** (`js/logic.js`): a generated
  pseudo-industry-group, placed first among the chips (badge 25 — the count of
  unique templates picked). Built from a `TEAM_PICKS` map (person name → list
  of layout ids) plus a `PERSON_COLOR` map (person name → chip bg/fg) defined
  right after `GROUPS`. For each picked id, industry tag(s) are derived by
  scanning the real industry groups for membership (not hand-typed), and tabs
  are ordered by vote count, ties broken by `LAYOUTS` order. `layouts/_shell.html`
  renders an extra row on team tabs only (industry label + colour-coded
  initials chips, one per person who picked it, full name on hover) via a new
  `t.isTeam` flag — other groups' tabs are untouched, still single-line.
  Current picks: Saahil Pandya (SP), Juli Gopani (JG), Nirav Bhatt (NB), Zeni
  Chaklasiya (ZC). Three ambiguous "X / Y" entries in Nirav's original list
  (Atlas/Prism, Counter/Broadsheet, Wayfinder/Meridian) were confirmed by the
  user to mean **both** — each counted as two separate picks.
- **Fixed: tab strip horizontal scroll resetting to 0.** Root cause: `#shell`
  (the whole title/chips/tab-strip chrome) is fully torn down and rebuilt via
  `DC.render`'s `into.textContent = ''` on *every* app redraw — including the
  5-second `AUTO_ANN` timer that auto-advances carousels on `3h`/`4g`/`4i`/`6c`
  — which silently reset the tab strip's `scrollLeft` back to 0 mid-scroll.
  This affected every group's tab strip, not just the new Team one, but became
  very noticeable there since it has 25 tabs to scroll through. Fixed in
  `js/app.js`'s `draw()`: capture the tab strip's `scrollLeft` right before
  re-rendering `#shell`, restore it right after. Verified live with a genuine
  mouse-wheel scroll that survives past a 5-second auto-carousel tick.
- Local dev server on port 5173 died once mid-session (background task killed
  for low system memory) and was restarted with a tiny inline Node static
  file server (see the `node -e "... http.createServer ..."` one-liner used —
  no new dependency was added, nothing persisted to the repo).

## In progress
Nothing mid-flight. All changes above are complete, rebuilt (`node build.js`),
and headless-verified (all 36 tabs render without error, `<div>`/`<sc-if>`
balance checked on every edited file). This `tatago` run is saving and
publishing this exact batch of work.

## Next steps
- IT & ITES still has no layout tagged *(primary)* — flagged twice now to the
  user (once after moving `3b` to Rejected, again not yet re-raised this
  session), no answer yet. Worth asking again next time it comes up.
- The dead Claude-artifact URL in `CLAUDE.md`/README-adjacent docs
  (`https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4`,
  confirmed "not found" two sessions ago) is still uncorrected. Low priority
  unless the user brings it up again.
- The announcement-carousel spec file (`claude-design-announcement-carousel-prompt.md`,
  untracked in git, sitting in the repo root) still has unimplemented behaviors
  the user was told about and never asked for: container-query responsiveness,
  hover tooltips on truncated text, swipe/drag gestures, dot-pill width
  animation. Still explicitly deferred, no reply.
- Nothing else pending on the "Top selected by Team" feature — the user's
  last message before this `tatago` was confirming they liked the result, no
  open feedback thread on it.

## Decisions made
- Team-group tabs show BOTH an industry tag and person-initials chips, derived
  automatically rather than hand-maintained, specifically so the catalog can't
  drift out of sync with the real `GROUPS` membership or with `TEAM_PICKS`
  edits. Only touch `TEAM_PICKS`/`PERSON_COLOR` to change who picked what.
- Ambiguous "X / Y" picks in a team member's list default to counting as both,
  per explicit user confirmation this session — don't assume "either/or" for
  future ambiguous list entries without asking, this was a one-time
  clarification for Nirav's list specifically.
- The tab-strip scroll fix targets the `[style*="overflow-x:auto"]` element
  inside `#shell` specifically (there's exactly one). If `_shell.html`'s
  markup is restructured to add a second scrollable region inside `#shell`,
  `app.js`'s `draw()` will need updating too (it currently assumes one).

## Gotchas & notes
- Viewing a multi-group template (e.g. `4p`) from the "Top selected by Team"
  group renders its *non-Healthcare* variant even for teammates who picked it
  for Healthcare reasons, because `show.notHealth`/`show.isHealth` key off
  `state.group === "health"` specifically, and the team group is `state.group
  === "team"`. This is a known, minor, unfixed quirk — flagged to the user,
  not asked to be fixed.
- `4d` still shows a permanent "View all" next to a non-rotating `annNow`
  block — this is intentional per this session's audit (it has no dots/arrows
  so it isn't a real carousel), not an oversight to "finish" later.
