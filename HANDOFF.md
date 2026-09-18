# Handoff — 2026-09-18 16:44

## Read first
Three parts of `CLAUDE.md`, all touched this session:
1. **"The 3b2 banner-seed system"** — `washFromHex()` and the three per-seed
   grounds that replaced the old `pageTint` flag.
2. **"House rules that hold across the gallery"** — the **Most read**, **Pending
   Approvals**, **ID pills** and **Service and catalogue sections** bullets all
   changed. The Most read bullet in particular *corrects a false claim* the file
   used to make.
3. **"Layout ID quirks"** — the `3c`/`3c2` paragraph now records which element is
   actually "3C's search margin", because that was got wrong once already.

## What we worked on this session
This session began by recovering a previous session's context from a **different
Claude account** whose weekly limit had run out mid-task (transcript read off
disk — see Gotchas). That earlier request's 9 items were verified against the
code, one missing piece was implemented, and then the user worked through a
second batch of review feedback across `3h`, `4c2`, `5a`, `8b` and `3c`.

## Completed

**Batch 1 — the recovered request (8 of 9 items were already in the tree; each
was re-verified against the code, not against the old session's summary):**
- ID-pill strokes gone gallery-wide (85 pill sites, zero `border:`/`outline:`),
  one fg/bg pair per template, so 4G / 5A / 4F match internally.
- `3c.html` *and* `3c2.html` both carry the data-card-block `margin-top:64px`.
- `3b2`: Starlight `searchWhite`, Hex Pulse Blue at height 320 with `annBottom`
  and a teal `dot`, swatch note bar gone.
- **The one genuinely missing item:** every `3b2` banner seed now themes the page,
  not just `desk3d`. `bannerPageBg` derives for all seeds (the `pageTint` flag is
  deleted), and two new vals — `bannerTileBg` and `bannerBadgeBg` — tint the
  asset/CI tiles, the Most read category pill and the card header count badges.
  New `washFromHex(hex, sat, light)` helper in `js/logic.js`. Data cards stay
  white. **Committed and published** as `7b88f33`.

**Batch 2 — this session's review feedback (all built, NOT yet published at the
time of writing; the publish step follows this handoff):**
- **3H — Most Used Services is now a single white data card**, matching the Most
  Read card beside it: heading inside the card above a divider, and the eight
  service tiles stripped of their individual card chrome. The row's grid is
  `align-items:stretch` with both cards as flex columns and the tile grid on
  `flex:1`, so the two cards always share a height.
- **3H tile wash went through three rounds** to land on `#F7F9FC` — see
  Decisions.
- **Most read leading icon chip now matches its own card's ID pill** (bg *and*
  fg) in all 12 templates that have a chip: 2a, 3b2, 3c, 3h, 4c2, 4e, 4f, 4g, 4p,
  5a, 7a, 8b. Six had drifted (3c and 4c2 by a near-miss grey, 3h a dark slate,
  4f/4g/5a an unrelated blue). **No icons were added anywhere.**
- **8B's ID pills** now take the My assets / My CIs icon-chip pair
  (`#E4EFF9`/`#1B5E9E`) at all 3 pill sites, so pills and those tiles' icons
  match. This makes 8B the one template whose pill colour is anchored to
  something other than My Open Requests.
- **4C2 announcements** have a rule between rows as well as under the header.
  The dialect has no `:first-child`, so `annTop3` in `js/logic.js` now carries a
  `sep` flag (`false, true, true`) and the row renders `<sc-if value="{{ n.sep }}">`.
- **5A's approvals buttons** were the gallery's only outlier (28×28, outlined, no
  fill, blue check). Now the standard 24×24 filled tints with 15px glyphs:
  approve `#e6f4ec`/`#1f7a44`, reject `#fdeaea`/`#b02a2a`, send back
  `#fdf1d6`/`#8a5a08`.
- **3C/3C2 search margin finally on the right element** — 64px above the search
  bar (was 36px in 3c, 28px in 3c2). See Gotchas for what went wrong before.
- **3C/3C2 hero top tightened** — space above the welcome title went 66px → 32px
  (hero `padding-top` 52→30, title `margin-top` 14→2).
- `node build.js` run after every change; headless sweep clean throughout —
  36 tabs, 42 tab×seed renders, 0 failures, every template's `sc-if`/`sc-for`
  balanced.

## In progress
Nothing mid-flight in the code. **But nothing in either batch has been verified
in a browser by Claude** — every check was headless. The user has been reviewing
each change themselves on a local static server and giving feedback, which is how
the 3H tile colour and the 3C spacing got corrected.

## Next steps
1. **Check 3H's service tiles.** At `#F7F9FC` there are only ~5 rgb units between
   the tile and its **white** icon chips, so the chips may now read as absent —
   the same complaint that was raised about 4E/4G, inverted. If so, the fix is to
   tint the chip (e.g. `#EDF1F5`, the colour those tiles originally used) rather
   than darken the tile again.
2. **Decide about `3c.html:101`.** The data-cards block still sits at
   `margin-top:64px`, raised from its original 34px by the earlier session's
   mistake. Nobody asked for that gap to grow. Either put it back to 34px or
   accept it deliberately.
3. Open question left unanswered: whether the **count-badge text colour** in
   `3b2` should follow the banner seed. It is still neutral `#0b2545` (matching
   the card title beside it) while its background now tints.

## Decisions made
- **3H's service tiles are cool grey, not amber.** An amber wash was tried first
  (`#FDF4E4`, from 3H's own `#F2A81D` safety stripe) on the reasoning that it was
  the template's own accent, lightened once to `#FEF9EE` on request, then
  rejected outright — "change this color from yellow to lighter grayish shade of
  theme" — and replaced with `#F2F5F9`, then lightened again to **`#F7F9FC`**,
  the same tile tint 3B2 and 8B use. If tinting 3H again, start cool.
- **Do not add Most read icons anywhere.** 21 Most read cards have no leading
  icon and `3h2` has a bare glyph; the user was asked directly and chose to
  enforce the chip rule on the **Final 12 only**, then confirmed explicitly:
  "don't add any new icons, just recolor the icon's bg placed before id pill."
- **Data cards in `3b2` stay white** — the user picked this over tinting the card
  surface, because the cards render from the gallery-wide `cardStyle` prop and a
  tinted card on a tinted page loses its separation. Don't "finish the job"
  later.
- **`washFromHex()` rather than `tintLight()`** for the `3b2` grounds: the seed
  dots are not equally light, so a fixed white-mix left the pale ones
  (`starlight`, `diamond`) *lighter* than the neutral they replaced.

## Gotchas & notes
- **"3C's search margin" is an ambiguous phrase that has already caused one
  wrong edit.** `3c.html` has two `margin-top` values in play: the **search bar**
  in the hero (line ~43, what the user means) and the **data-cards block**
  (line ~101). A previous session changed the second while reporting it had done
  the first — and because the number 64px *was* present in the file, a later
  verification pass confirmed it as done. **Grep alone was not enough; the
  element had to be read.**
- **Cross-account context recovery.** When a session dies on a usage limit its
  transcript is still on disk at
  `<config-dir>/projects/<project-slug>/<session-id>.jsonl`. This machine has two
  config dirs for two accounts — `~/.claude` and `~/.claude-pro` — so check both.
  Stream the file line by line pulling `type: "user"` / `type: "assistant"` text
  blocks; a long session's file runs ~90 MB. A background agent's tail end lives
  separately in the temp `tasks/<task-id>.output` file.
- **Browser automation is still unusable here**, three walls deep:
  1. The extension **refuses `file://` URLs**, so the normal double-click-
     `index.html` workflow can't be driven. A static server is required.
  2. **Port 5173 is poisoned in this Chrome profile** — a service worker from a
     different Motadata app ("Ticket Listing & Full Detail page") intercepts it
     and serves that app instead of whatever is actually listening. Confirmed by
     `curl` returning the correct gallery HTML at the same moment the browser
     showed the other app. Use another port; 5199 was used this session.
  3. Even on a clean port and a fresh tab, the extension reported a page title
     that didn't match the URL it claimed to be on and `#stage` was never
     present. Only one browser ever registered; `switch_browser` found no others.
     **Edge has the extension installed** and was going to be connected instead,
     but never registered with the account.
- **The static server is disposable** — a ~10-line Node script in the scratchpad
  temp dir, not committed, and it dies with the session. Any static server works;
  the project needs no build step to serve.
- The private Claude artifact
  (<https://claude.ai/code/artifact/fdeaa529-b28d-4f96-a9f4-bb9b385ff0f4>) is a
  snapshot that does **not** auto-update, and has not been republished with any
  of this session's work.
