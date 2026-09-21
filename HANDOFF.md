# Handoff — 2026-09-21 12:45

## Read first
`CLAUDE.md`, three areas, all edited across these sessions:
1. **"The 3b2 banner-seed system"** — `washFromHex()` and the three per-seed
   grounds that replaced the old `pageTint` flag.
2. **"House rules that hold across the gallery"** — the **Most read**, **Pending
   Approvals**, **ID pills**, **Service and catalogue sections** and the new
   **`7a` cards carry no outline** bullets. The Most read bullet *corrects a
   false claim* the file used to make.
3. **"Layout ID quirks"** — the `3c`/`3c2` paragraph now records which element is
   actually "3C's search margin", because that was got wrong once already.

## What we worked on this session
Picked up a 9-item request from a **different Claude account** that had hit its
weekly limit mid-task (transcript recovered off disk — see Gotchas), verified it
against the code, implemented the one piece that was missing, then worked through
two further rounds of the user's review feedback across `3h`, `4c2`, `5a`, `8b`,
`3c` and `7a`.

## Completed

**Recovered request (8 of its 9 items were already in the tree; each was
re-verified against the code, not against the old session's summary):**
- ID-pill strokes gone gallery-wide (85 pill sites), one fg/bg pair per template.
- `3c`/`3c2` data-card block at `margin-top:64px`.
- `3b2`: Starlight `searchWhite`, Hex Pulse Blue at height 320 with `annBottom`
  and a teal `dot`, swatch note bar gone.
- **The missing item:** every `3b2` seed now themes the page, not just `desk3d`.
  `bannerPageBg` derives for all seeds (`pageTint` flag deleted) and two new vals
  — `bannerTileBg`, `bannerBadgeBg` — tint the asset/CI tiles, the Most read
  category pill and the header count badges. New `washFromHex(hex, sat, light)`
  in `js/logic.js`. Data cards stay white.

**Review feedback:**
- **3H — Most Used Services is one white data card**, heading inside above a
  divider, tiles stripped of their own card chrome. The row grid is
  `align-items:stretch` with both cards as flex columns and the tile grid on
  `flex:1`, so it always matches Most Read's height.
- **Most read leading icon chip matches its own card's ID pill** (bg and fg) in
  all 12 templates that have a chip. **No icons were added anywhere** — explicit
  instruction.
- **8B's ID pills** take the My assets / My CIs icon-chip pair
  (`#E4EFF9`/`#1B5E9E`) at all 3 pill sites.
- **4C2** has a rule between announcement rows via a new `sep` flag on `annTop3`.
- **5A's approvals buttons** now use the standard 24×24 filled tints.
- **3C/3C2**: the 64px margin finally landed on the **search bar**, and the hero
  top tightened (space above the title 66px → 32px).
- **7A: all ten card outlines removed** (`#E4DCCC`). This is the only change not
  yet published at the time this handoff was written — the publish step follows.

Everything above was rebuilt with `node build.js` and swept headlessly after
every change: 36 tabs, 42 tab×seed renders, 0 failures, all `sc-if`/`sc-for`
balanced.

## In progress
Nothing mid-flight in the code. **Nothing has been verified in a browser by
Claude** — every check was headless. The user reviewed each change themselves on
a local static server, which is how the 3H tile colour and the 3C margin got
corrected.

## Next steps
1. **Look at 7A with the outlines gone.** It has **no `box-shadow` anywhere**,
   and its `#FCFAF6` page is ~4 rgb units off white, so the white cards may now
   read as one flat sheet. Fix by adding a soft shadow or deepening the page
   ground — *not* by restoring the stroke.
2. **Check 3H's service tiles.** At `#F7F9FC` there are ~5 rgb units between tile
   and its **white** icon chips, so the chips may read as absent — the 4E/4G
   complaint inverted. Fix by tinting the chip (e.g. `#EDF1F5`), not by darkening
   the tile again.
3. **Decide about `3c.html:101`** — the data-cards block still sits at
   `margin-top:64px`, raised from 34px by the earlier session's mistake. Nobody
   asked for that gap to grow.
4. Still open: whether `3b2`'s **count-badge text colour** should follow the
   banner seed. It is neutral `#0b2545` while its background now tints.

## Decisions made
- **3H's service tiles are cool grey, not amber.** Amber was tried first
  (`#FDF4E4`, from 3H's own `#F2A81D` safety stripe), lightened once on request,
  then rejected outright and replaced with `#F2F5F9`, lightened again to
  **`#F7F9FC`**. If tinting 3H again, start cool.
- **Do not add Most read icons anywhere.** 21 Most read cards have no leading
  icon and `3h2` has a bare glyph. Asked directly, the user chose to enforce the
  chip rule on the **Final 12 only**, then confirmed: "don't add any new icons,
  just recolor the icon's bg placed before id pill."
- **`3b2`'s data cards stay white** — chosen over tinting the card surface,
  because they render from the gallery-wide `cardStyle` prop and a tinted card on
  a tinted page loses separation. Don't "finish the job" later.
- **`washFromHex()` rather than `tintLight()`** for the `3b2` grounds: the seed
  dots aren't equally light, so a fixed white-mix left the pale ones
  (`starlight`, `diamond`) *lighter* than the neutral they replaced.
- **7A's remaining `#E4DCCC` borders are structural**, not card outlines, and
  were deliberately kept: top bar, side rail, hero bottom edge.

## Gotchas & notes
- **"3C's search margin" has already caused one wrong edit.** `3c.html` has two
  `margin-top` values in play: the **search bar** in the hero (line ~43, what the
  user means) and the **data-cards block** (line ~101). An earlier session
  changed the second while reporting it had done the first — and because 64px
  *was* in the file, a later verification pass confirmed it as done. **Grep alone
  was not enough; the element had to be read.**
- **Cross-account context recovery.** When a session dies on a usage limit its
  transcript is still at `<config-dir>/projects/<project-slug>/<session-id>.jsonl`.
  This machine has two config dirs for two accounts — `~/.claude` and
  `~/.claude-pro` — so check both. Stream it line by line pulling
  `type: "user"` / `type: "assistant"` text blocks; a long session runs ~90 MB. A
  background agent's tail end is in the temp `tasks/<task-id>.output` file.
- **Browser automation is unusable here**, three walls deep: the extension
  **refuses `file://` URLs**; **port 5173 is poisoned in this Chrome profile** by
  a service worker from another Motadata app ("Ticket Listing & Full Detail
  page") that serves that app no matter what is actually listening (confirmed by
  `curl` returning the right HTML at the same moment); and even on a clean port
  and fresh tab the extension reported a page title that didn't match the URL it
  claimed, with `#stage` never present. Edge has the extension installed but
  never registered with the account.
- **The preview server is disposable and short-lived** — a ~10-line Node script
  in the scratchpad temp dir (port 5199 was used). Claude Code **killed it once
  mid-session because the machine was low on memory**; that is expected behaviour
  and says nothing about the server. Restart it only when asked.
- The private Claude artifact
  (<https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4>) is a
  snapshot that does **not** auto-update, and has not been republished with any
  of this work.
