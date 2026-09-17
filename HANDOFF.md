# Handoff — 2026-09-17 16:36

## Read first
`CLAUDE.md`'s **"The 3b2 banner-seed system"** section (under Architecture) —
it now documents the `searchWhite` flag, the `rawBg` full-width-pattern
convention (painted on the outer grid container, not a column div), why
`dotGradientInner`'s fade finishes at ~60% width rather than 100%, and the
new `gearsCascadeInner` generator. Read that before touching any `3b2`
banner seed again.

## What we worked on this session
A short, targeted follow-up session fixing four specific things the
previous session's `3b2` banner-seed work and `4g` cleanup had gotten
visibly wrong, all from screenshot-referenced user feedback: the Dot
Gradient pattern stopping short of the announcement card, Hex Pulse Blue's
translucent search bar, a leftover stroke on 4G's announcement card, and
Gear Works' motif not matching the requested cascading-gears reference
image.

## Completed
- **Dot Gradient banner pattern now reaches the true right edge.** Root
  cause: `dotgrad` (and every other full-width `rawBg` seed) painted its
  pattern via `active.base` on the *outer* grid container already — that
  part was correct — but the fade formula in `dotGradientInner` ramped
  opacity linearly across the *entire* 0–100% design width, reaching full
  density only at x=900 (100%). Since the announcement card's left edge
  typically sits around 65–73% of the real banner width, the pattern was
  still visibly ramping up right where the card covers it, so the sliver
  of pattern visible beside/after the card looked faded rather than dense
  — read by the user as "the pattern only fills half the card's area, then
  it's just flat color." Fixed by changing the fade to finish by ~60% of
  the design width and hold at max density (0.62 alpha) for the rest —
  verified with canvas pixel-sampling of the live rendered background
  (screenshots were unreliable this session, see Gotchas) showing alpha
  plateaus at column 16 of 26 (~63% across) and stays flat through column
  25, comfortably before and through where the card sits.
- **Hex Pulse Blue's search bar is now solid white.** Added a `searchWhite`
  boolean seed flag (only `hexpulse` sets it) and a `whiteSearch = light ||
  active.searchWhite` derivation in `sidecarBanner()`, so a specific
  non-`light` seed can still opt into the white/bordered search-field
  styling that `light` seeds get by default, without changing the banner's
  own dark-teal theme or hero text colors.
- **4G's hero-embedded announcement card lost its stroke.** Removed
  `border:1px solid rgba(255,255,255,.20)` from the card's style in
  `layouts/4g.html`, keeping the `rgba(255,255,255,.10)` glass fill.
- **Gear Works banner rebuilt as a full-width gear cascade**, replacing the
  old small bottom-right corner motif (`gearsInner`, now deleted). New
  `gearGlyph()` helper (built on the existing `gearRingPath`) plus
  `gearsCascadeInner()` place a biggest-gear-at-the-right, shrinking-as-it-
  trails-left cluster of 7 gears across roughly the outer 40% of the
  banner width, at low opacity (0.13–0.22), following the same "anchored
  cluster, low opacity" pattern `diamondCascadeInner` already used. The
  `gears` seed switched from a `motif`-based corner accent to `rawBg: true`
  like the other full-width pattern seeds.

## In progress
Nothing mid-flight. All four fixes were rebuilt (`node build.js` for the
`4g.html` markup change; `js/logic.js` changes need no build step, they're
loaded directly) and verified: a headless `renderVals()` sweep across every
seed and every layout tab (`ok: 36 fail: 0`, `_shell` excluded), plus live
DOM/canvas inspection in a real browser session confirming each fix
actually renders as intended (see Gotchas for why canvas pixel-sampling was
used instead of trusting screenshots).

## Next steps
- Nothing explicitly deferred this session — all four reported issues were
  fixed and verified before moving on.
- If more `3b2` banner seeds get added later, the `rawBg` + `svgUrl(900,
  220, ...)` + "fade must finish well before ~65% width" pattern
  established this session is the one to follow for anything meant to
  stay visible behind/beside the announcement card.

## Decisions made
- **Full-width banner patterns paint on the outer grid container, not the
  motif div**, and any left-to-right fade inside them must finish by
  roughly 60% of the design width, not 100% — because the announcement
  card covers the last ~30% of the banner and a fade tuned to the full
  range never visibly reaches its own maximum. This is now the standard to
  follow for any new full-width `rawBg` seed.
- **`searchWhite` is a seed-level override, independent of `light`** — a
  dark-themed seed can still want a white search field. Don't fold this
  into the `light` flag itself; keep it as its own boolean so a seed can
  mix "dark hero, white search" freely.

## Gotchas & notes
- **The Chrome browser automation tool's screenshot/zoom actions were
  unreliable again this session** (stale captures, a `Page.captureScreenshot`
  timeout, and a `zoom` call that returned a screenshot of the wrong scroll
  position entirely). Do not trust a single screenshot as proof of a fix —
  prefer DOM inspection (`getAttribute('style')`) for style-only changes,
  and canvas-based pixel sampling (draw the SVG background onto an
  off-screen `<canvas>` sized to the real container, then sample specific
  x-fractions or scan for first/last non-zero alpha) for verifying an SVG
  background pattern's actual on-screen coverage — this is what caught and
  confirmed the Dot Gradient fix in this session.
- **A subtler trap found this session: clicking a banner-seed swatch in an
  unfocused/backgrounded browser tab silently "fails" to visually update,**
  even though the click handler DID fire and `state.bannerSeed` DID change.
  Cause: `js/app.js`'s `schedule()` defers the actual re-render via
  `requestAnimationFrame`, and Chrome throttles/pauses `rAF` callbacks for
  a tab that is `document.hidden`/unfocused — common for an automation-
  driven tab that never receives real OS focus. The fix for testing
  purposes: take a screenshot (or otherwise force the tab into the
  foreground) *after* the click and *before* re-inspecting the DOM, which
  forces the pending frame to flush. This is a testing-tool quirk, not an
  app bug — do not "fix" `schedule()` or `app.js` in response to this; the
  rAF-based render batching is correct behavior for a real, focused user
  session.
- The local static server (`http-server` on port 5173, used for this
  session's browser verification since `file://` blocks `fetch()`) was
  started and later stopped again — nothing left running past this
  session.
