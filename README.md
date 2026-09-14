# Support Portal layout templates

Thirty-seven Support Portal layout templates for Motadata ServiceOps, grouped by
the industry each one ships to. Implemented from the Claude Design source
`Support Portal Layout System.dc.html`.

Open `index.html`. No build step, no dependencies, no server required.

---

## What is here

Seven industry groups. Selecting a group filters the tab strip to the layouts
proposed for it; the tag on a tab is the role that layout plays in the group.

| Group | Layouts | Notes |
| --- | --- | --- |
| IT & ITES | `3b2` Sidecar · Announcements, `3g` Atlas, `2a` Prism, `2ag` Prism · Green, `4f` Front Desk, `4f2` Counter · Image, `4g` Half Deck | No industry widget — the out-of-the-box baseline |
| Healthcare | `5a` Meridian *(primary)*, `5c` Bedside, `2an` Prism · Navy, `3i` Wayfinder, `4b` Broadsheet, `4f` Front Desk, `4p` Employee Center, `6c` Triptych | Status board first, report-dominant actions, downtime procedures |
| Manufacturing | `4i` Rails *(primary)*, `3h` Concierge, `4c` Mosaic, `4c2` Mosaic II, `4d` Portico | Action bars, plant and line status, shift handover |
| Government | `3i` Wayfinder *(primary)*, `4b` Broadsheet *(catalog-first)*, `3j` Bulletin, `6a` Gazette, `4f` Front Desk, `4g` Half Deck, `3c` Counter | Categories with descriptions, policies, circulars, notices |
| Education | `7a` Quadrangle *(primary)*, `7b` Course Shelf *(course-led)*, `7c` Study Desk *(tactile)*, `4e` Atrium, `4p` Employee Center *(multi-dept)* | Notice board and academic calendar above the actions |
| BFSI | `8a` Vault *(primary)*, `8b` Keystone *(help-centre)*, `4a` Service Center, `4f` Front Desk, `4g` Half Deck | Split banner with a finance motif, approvals full width |
| Rejected | `4a2` Help Desk, `4h` Broadside, `3d` Dispatch, `3h2` Concierge II, `2b` Ledger, `5b` Consort, `6b` Foyer, `3b` Sidecar | Not shipping — kept so the decision stays visible |

`3i`, `4b`, `4f`, `4g`, `4p` and the Prism family appear in more than one
group, which is why 37 layouts spread across 45 tab positions.

### Navigating

- Click an industry chip, then a layout tab.
- <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> step through the layouts of the current
  industry.
- The URL carries the position — `index.html#/edu/7a` opens Quadrangle
  directly, so a specific layout can be linked to in a review.
- The **Theme** bar re-renders every layout against a different brand palette,
  mood or card treatment. These are the three props the design file exposes;
  the defaults are the design's own.

---

## Layout of the code

```
index.html            page shell: fonts, theme bar, header mount, stage mount
build.js              regenerates js/templates.js from layouts/

layouts/
  _shell.html         industry chips + layout tab strip
  3b.html … 8b.html   one partial per layout, 35 files

css/
  tokens.css          custom properties for the chrome; brand values are
                      mirrored here at runtime from the active palette
  base.css            reset, theme bar, hover/focus states, narrow-window and
                      print behaviour

js/
  dc.js               the template runtime (see below)
  logic.js            the value bag: layout catalog, industry groups, every
                      content fixture. Carried over from the design source
  image-slot.js       <image-slot> custom element
  slots.js            GENERATED — placed photographs and their crops
  templates.js        GENERATED — layouts/ bundled for file:// use
  app.js              mounting, routing, theme bar, keyboard navigation

assets/               13 photographs placed in the design
```

### The template dialect

`layouts/*.html` is the markup **exactly as authored in Claude Design**, which
means it still speaks that dialect:

```html
{{ expr }}                          interpolation, in text and in attributes
<sc-for list="{{ xs }}" as="x">     repeat children once per item
<sc-if value="{{ flag }}">          render children when truthy
onClick="{{ handler }}"             bind a function from the value bag
ref="{{ callback }}"                callback ref, fired with the DOM node
```

`js/dc.js` implements it in about a hundred lines. That was a deliberate
choice: rewriting 670 KB of markup into some other form would have made every
future change in the design file a manual re-translation, whereas this way
`layouts/` can be diffed straight against the design source.

Expressions are intentionally tiny — a dotted path, optionally negated or
compared. No arbitrary JavaScript is evaluated; `dc.js` walks the value bag by
hand. Everything a layout can reference comes out of `renderVals()` in
`js/logic.js`.

### Editing

Layout markup lives in `layouts/`. After editing:

```
node build.js
```

That regenerates `js/templates.js`. It exists only so that opening
`index.html` straight off the disk works — `file://` blocks `fetch()`, so the
page cannot load its own partials, and bundling them as a script means no
server and no toolchain is needed to view the gallery.

Content, colours and the layout catalog live in `js/logic.js`. To add a
layout: add it to `LAYOUTS` and to the relevant group in `GROUPS`, drop a
partial in `layouts/`, and rebuild.

---

## Notes

**Fonts.** Inter, Newsreader and Material Symbols Rounded load from Google
Fonts. Icons are ligatures, so with no network connection they render as their
literal names (`chevron_right` rather than an arrow). Self-host the three
families if the gallery needs to work offline.

**Photographs.** Thirteen `<image-slot>` regions have a photograph and a crop
that was adjusted by hand at design time; `js/slots.js` carries the crop over
and `js/image-slot.js` reproduces the framing maths, so the crop survives a
responsive resize. Slots with no photograph — `3b2-ann`, `cn2-banner`,
`foy-illus`, `ks-hero`, `ks-agent`, `paper-hero`, and the Gazette tiles —
render the dashed placeholder with its authored caption, which is how they
appear in the design too. `mrd-t1`–`t3` and `cst-mark` are photographs the
design still holds for slots no current layout renders; they are kept so they
reappear if those slots come back.

**Narrow windows.** The layouts are designed for a desktop service-desk window
and use fixed multi-column grids. Below 1180px the stage scrolls horizontally
rather than reflowing into an arrangement the design never specified.

**Rendering.** Switching a layout replaces the stage rather than diffing it.
One layout is on screen at a time and each is a few hundred nodes, so the
simple thing is comfortably fast and avoids shipping a reconciler.

---

## Source

Claude Design project *ServiceOps portal layout system*
(`968d629a-9cdf-4371-be3b-329de5ad3fdf`), file
`Support Portal Layout System.dc.html`. The **Spec doc** link in the header
opens the companion spec in that project.
