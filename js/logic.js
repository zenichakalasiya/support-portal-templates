/* ---------------------------------------------------------------------------
   logic.js — the value bag every layout renders against.

   This is carried over from the Claude Design source essentially verbatim: it
   is the single place that decides which layouts exist, how they are grouped
   by industry, which one is active, and all of the fixture content the
   templates interpolate. Keeping it unmodified means a change made in the
   design file can be diffed straight back into here.

   Structure:
     state          active industry group, active layout, carousel indices
     renderVals()   the flat object handed to the template runtime
     layoutVals()   palette + every content fixture (services, KBs, tickets…)
     foyVals()      fixtures for the education / manufacturing / BFSI layouts
     seedTokens()   the coral / navy / green hero seed for the 2a Prism family
     hcVals()       healthcare-specific fixtures (5a / 5b / 5c)
     annCarousel(), deskNoticeVals()   the two rotating panels

   Props (palette, mood, cardStyle) are surfaced as controls in index.html;
   their defaults come from the design file's own prop declarations.
--------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var DCLogic = global.DCLogic;

  // tabs whose announcement strip rotates on its own
  const AUTO_ANN = new Set(["3h", "4g", "4i", "6c"]);

  // Announcement date tiles show a day number + 3-letter month only (no
  // weekday, no year) on the tile face; the original "11 Aug 2026" string
  // (already a short month) is reused as-is for the hover tooltip.
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
  const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  function dateTile(str) {
    const m = /^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/.exec(String(str || "").trim());
    if (!m) return { day: "", mon: "" };
    const day = parseInt(m[1], 10);
    const monIdx = MONTHS[m[2].toLowerCase()];
    return {
      day: String(day).padStart(2, "0"),
      mon: monIdx === undefined ? m[2].slice(0, 3).toUpperCase() : MONTH_SHORT[monIdx]
    };
  }
  function withDateTiles(list) {
    return (list || []).map(x => Object.assign({}, x, dateTile(x.d)));
  }

  // ---- 3b2 banner background varieties -------------------------------
  // Tint a seed's swatch colour into a light pill/chip background (mix toward
  // white) or a readable dark foreground (mix toward black), so every data
  // card's ID pills and icon chips can track whichever banner is active.
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  function tintLight(hex, amount) {
    const rgb = hexToRgb(hex);
    const mix = c => Math.round(c + (255 - c) * amount);
    return 'rgb(' + mix(rgb[0]) + ',' + mix(rgb[1]) + ',' + mix(rgb[2]) + ')';
  }
  function tintDark(hex, amount) {
    const rgb = hexToRgb(hex);
    const mix = c => Math.round(c * (1 - amount));
    return 'rgb(' + mix(rgb[0]) + ',' + mix(rgb[1]) + ',' + mix(rgb[2]) + ')';
  }
  // A page-ground wash that keeps the source colour's hue but pins saturation and
  // lightness, so every banner seed gets an equally visible tint regardless of how
  // light or pale its own dot is (tintLight() alone leaves a pale dot near-white).
  function washFromHex(hex, sat, light) {
    const rgb = hexToRgb(hex);
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    const s = max === min ? 0 : sat;
    const c = (1 - Math.abs(2 * light - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = light - c / 2;
    const hp = h * 6;
    let t;
    if (hp < 1) t = [c, x, 0];
    else if (hp < 2) t = [x, c, 0];
    else if (hp < 3) t = [0, c, x];
    else if (hp < 4) t = [0, x, c];
    else if (hp < 5) t = [x, 0, c];
    else t = [c, 0, x];
    return 'rgb(' + t.map(v => Math.round((v + m) * 255)).join(',') + ')';
  }
  function withAlpha(hex, alpha) {
    const rgb = hexToRgb(hex);
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
  }

  // Small SVG-shape generators, tiled at low opacity over a unique gradient
  // per variant. Shapes only borrow the geometric motif of a reference image
  // (quarter circles, hex grid, gear teeth, circuit traces, …) — no text,
  // logos or watermarks from any reference are reproduced.
  function svgUrl(w, h, inner) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + inner + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  function gearRingPath(cx, cy, rOuter, rInner, teeth, rHole) {
    const step = Math.PI / teeth;
    let d = '';
    for (let i = 0; i < teeth * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const a = i * step;
      d += (i === 0 ? 'M' : 'L') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1) + ' ';
    }
    d += 'Z M' + (cx + rHole).toFixed(1) + ',' + cy.toFixed(1) + ' ';
    d += 'A' + rHole + ',' + rHole + ' 0 1 0 ' + (cx - rHole).toFixed(1) + ',' + cy.toFixed(1) + ' ';
    d += 'A' + rHole + ',' + rHole + ' 0 1 0 ' + (cx + rHole).toFixed(1) + ',' + cy.toFixed(1) + ' Z';
    return d;
  }
  function gearGlyph(cx, cy, r, teeth, color, op) {
    return '<path d="' + gearRingPath(cx, cy, r, r * 0.8, teeth, r * 0.34) + '" fill="' + color + '" fill-opacity="' + op + '" fill-rule="evenodd"/>';
  }
  // A cascade of interlocking gears, biggest at the right edge and shrinking
  // as they trail left, confined to the right ~40% of the width — same
  // "anchored cluster, faint" idea as diamondCascadeInner, at low opacity so
  // it reads as a light watermark rather than a solid illustration.
  function gearsCascadeInner(w, h) {
    const white = "#FFFFFF";
    let out = '';
    [
      [0.95, 0.5, 0.78, 9, .22],
      [0.78, 0.24, 0.46, 9, .2],
      [0.83, 0.76, 0.4, 8, .19],
      [0.63, 0.5, 0.34, 8, .17],
      [0.7, 0.92, 0.26, 7, .16],
      [0.6, 0.1, 0.22, 7, .14],
      [0.58, 0.7, 0.17, 6, .13]
    ].forEach(function (d) {
      out += gearGlyph(w * d[0], h * d[1], h * d[2] / 2, d[3], white, d[4]);
    });
    return out;
  }
  function dotGrid(x0, y0, cols, rows, spacing, r, color, op) {
    let out = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        out += '<circle cx="' + (x0 + col * spacing).toFixed(1) + '" cy="' + (y0 + row * spacing).toFixed(1) + '" r="' + r + '" fill="' + color + '" fill-opacity="' + op + '"/>';
      }
    }
    return out;
  }
  // A halftone dot field whose opacity itself ramps up left-to-right, so the
  // dots read as a gradient rather than a uniform tiled pattern. The ramp
  // finishes by ~60% of the width (not 100%) and holds at full density the
  // rest of the way, so the pattern is already at its densest well before
  // the announcement card's left edge, all the way to the banner's right
  // side, instead of still fading in underneath where the card covers it.
  function dotGradientInner(w, h, color) {
    const cols = 26, rows = 9;
    let out = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = col / (cols - 1);
        const op = Math.min(1, Math.max(0, (t - 0.12) / 0.5)) * 0.62;
        if (op < 0.02) continue;
        const cx = (w / cols) * (col + 0.5);
        const cy = (h / rows) * (row + 0.5);
        out += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.6" fill="' + color + '" fill-opacity="' + op.toFixed(2) + '"/>';
      }
    }
    return out;
  }

  // ---- full-width scattered scene for the "Starlight" banner -----------
  function starBurst(cx, cy, rOuter, rInner, points, color, op) {
    const step = Math.PI / points;
    let d = '';
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const a = i * step - Math.PI / 2;
      d += (i === 0 ? 'M' : 'L') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1) + ' ';
    }
    return '<path d="' + d + 'Z" fill="' + color + '" fill-opacity="' + op + '"/>';
  }
  function squareShape(cx, cy, size, rotDeg, color, op) {
    const half = size / 2;
    return '<rect x="' + (cx - half).toFixed(1) + '" y="' + (cy - half).toFixed(1) + '" width="' + size.toFixed(1) + '" height="' + size.toFixed(1) + '" rx="' + (size * 0.14).toFixed(1) + '" fill="' + color + '" fill-opacity="' + op + '" transform="rotate(' + rotDeg + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>';
  }
  function ringArc(cx, cy, rOuter, rInner, startDeg, endDeg, color, op) {
    const a0 = startDeg * Math.PI / 180, a1 = endDeg * Math.PI / 180;
    const p = (r, a) => (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return '<path d="M ' + p(rOuter, a0) + ' A ' + rOuter.toFixed(1) + ',' + rOuter.toFixed(1) + ' 0 ' + large + ' 1 ' + p(rOuter, a1) +
      ' L ' + p(rInner, a1) + ' A ' + rInner.toFixed(1) + ',' + rInner.toFixed(1) + ' 0 ' + large + ' 0 ' + p(rInner, a0) + ' Z" fill="' + color + '" fill-opacity="' + op + '"/>';
  }
  function archShape(x, y, w, h, color, op) {
    const r = w / 2;
    return '<path d="M ' + x.toFixed(1) + ',' + (y + h).toFixed(1) +
      ' L ' + x.toFixed(1) + ',' + (y + r).toFixed(1) +
      ' A ' + r.toFixed(1) + ',' + r.toFixed(1) + ' 0 0 1 ' + (x + w).toFixed(1) + ',' + (y + r).toFixed(1) +
      ' L ' + (x + w).toFixed(1) + ',' + (y + h).toFixed(1) + ' Z" fill="' + color + '" fill-opacity="' + op + '"/>';
  }
  function nightSkyInner(w, h) {
    const lite = "#A9C6ED", mid = "#6E85B4", white = "#FFFFFF";
    return '<circle cx="' + (w * 0.15).toFixed(1) + '" cy="' + (h * 0.1).toFixed(1) + '" r="' + (h * 0.18).toFixed(1) + '" fill="' + lite + '" fill-opacity=".4"/>' +
      ringArc(w * 0.28, h * 0.32, h * 0.26, h * 0.14, 200, 470, mid, .4) +
      squareShape(w * 0.08, h * 0.62, h * 0.32, 15, lite, .4) +
      starBurst(w * 0.18, h * 0.82, h * 0.09, h * 0.032, 4, white, .55) +
      squareShape(w * 0.62, h * 0.08, h * 0.3, -18, lite, .4) +
      starBurst(w * 0.78, h * 0.32, h * 0.08, h * 0.03, 4, white, .55) +
      starBurst(w * 0.84, h * 0.42, h * 0.05, h * 0.018, 4, white, .55) +
      squareShape(w * 0.7, h * 0.78, h * 0.3, 25, lite, .4) +
      '<circle cx="' + (w * 0.48).toFixed(1) + '" cy="' + (h * 1.02).toFixed(1) + '" r="' + (h * 0.14).toFixed(1) + '" fill="' + mid + '" fill-opacity=".4"/>' +
      archShape(w * 0.87, h * 0.55, w * 0.11, h * 0.5, mid, .4) +
      '<circle cx="' + (w * 0.925).toFixed(1) + '" cy="' + (h * 0.5).toFixed(1) + '" r="' + (h * 0.14).toFixed(1) + '" fill="' + lite + '" fill-opacity=".4"/>';
  }

  // ---- full-width "orange rings + plus marks + dot grid" scene ---------
  function plusMark(cx, cy, size, color, op) {
    const half = size / 2, t = size * 0.24;
    return '<rect x="' + (cx - t / 2).toFixed(1) + '" y="' + (cy - half).toFixed(1) + '" width="' + t.toFixed(1) + '" height="' + size.toFixed(1) + '" fill="' + color + '" fill-opacity="' + op + '"/>' +
      '<rect x="' + (cx - half).toFixed(1) + '" y="' + (cy - t / 2).toFixed(1) + '" width="' + size.toFixed(1) + '" height="' + t.toFixed(1) + '" fill="' + color + '" fill-opacity="' + op + '"/>';
  }
  function plusCluster(x0, y0, cols, rows, spacing, size, color, op) {
    let out = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        out += plusMark(x0 + col * spacing, y0 + row * spacing, size, color, op);
      }
    }
    return out;
  }
  function ringDots(w, h) {
    const orange = "#F0A73C", white = "#FFFFFF", navy = "#0A2E38";
    const ring = (cx, cy, r, sw, color, op) => '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="none" stroke="' + color + '" stroke-width="' + sw.toFixed(1) + '" stroke-opacity="' + op + '"/>';
    const disc = (cx, cy, r, color, op) => '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + color + '" fill-opacity="' + op + '"/>';
    return disc(w * 0.02, -h * 0.05, h * 0.55, navy, .16) +
      ring(w * 0.03, h * 0.1, h * 0.1, h * 0.045, orange, .22) +
      disc(w * 0.14, h * 0.45, h * 0.16, white, .18) +
      plusCluster(w * 0.05, h * 0.66, 3, 2, h * 0.13, h * 0.09, white, .18) +
      ring(w * 0.83, h * 0.13, h * 0.1, h * 0.045, orange, .22) +
      ring(w * 0.95, h * 0.24, h * 0.2, h * 0.05, white, .18) +
      disc(w * 0.97, h * 0.55, h * 0.3, orange, .16) +
      dotGrid(w * 0.75, h * 0.36, 6, 5, h * 0.075, 2.2, white, .22) +
      disc(w * 0.03, h * 1.05, h * 0.35, navy, .16) +
      disc(w * 0.12, h * 1.12, h * 0.3, orange, .16) +
      disc(w * 0.74, h * 1.05, h * 0.25, white, .16) +
      disc(w * 0.92, h * 1.05, h * 0.3, navy, .16);
  }

  // A network of outlined diamonds + connecting diagonal lines, confined to
  // the right ~40% of the width, blending into the background: each shape's
  // own opacity ramps up the further right it sits, rather than a hard edge.
  function fadeOp(x, w, maxOp, startT) {
    const t = Math.max(0, Math.min(1, (x / w - (startT === undefined ? 0.55 : startT)) / (1 - (startT === undefined ? 0.55 : startT))));
    return (t * maxOp).toFixed(2);
  }
  function roundedDiamond(cx, cy, size, corner, color, sw, op, filled) {
    const half = size / 2;
    const attrs = 'x="' + (cx - half).toFixed(1) + '" y="' + (cy - half).toFixed(1) + '" width="' + size.toFixed(1) + '" height="' + size.toFixed(1) + '" rx="' + corner.toFixed(1) + '" transform="rotate(45 ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"';
    return filled
      ? '<rect ' + attrs + ' fill="' + color + '" fill-opacity="' + op + '"/>'
      : '<rect ' + attrs + ' fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-opacity="' + op + '"/>';
  }
  function diamondCascadeInner(w, h) {
    const white = "#FFFFFF", tint = "#BFE0FF";
    let out = '';
    // anchor cluster, weighted toward the right edge
    [[0.85, 0.28, 0.5, false], [0.68, 0.45, 0.42, false], [0.85, 0.68, 0.38, true], [0.97, 0.15, 0.26, false]].forEach(function (d) {
      const cx = w * d[0], cy = h * d[1], size = h * d[2];
      out += roundedDiamond(cx, cy, size, size * 0.16, d[3] ? tint : white, 1.6, fadeOp(cx, w, .5, 0.35), d[3]);
    });
    // cascade trailing left, shrinking toward the 40%-width mark
    [[0.58, 0.6, 0.22], [0.48, 0.78, 0.15], [0.42, 0.38, 0.11]].forEach(function (d) {
      const cx = w * d[0], cy = h * d[1], size = h * d[2];
      out += roundedDiamond(cx, cy, size, size * 0.18, white, 1.4, fadeOp(cx, w, .45, 0.35), false);
    });
    return out;
  }

  // Each variant is a single, non-repeating corner motif — not a tiled pattern
  // — layered once over a unique gradient wash, matching how the reference
  // images actually use these shapes (a cluster in one corner, not full-bleed
  // texture). `base` paints the whole banner; `motif` is the shape cluster,
  // sized and positioned so it sits in the banner's right corner without
  // repeating or overpowering the text.
  const BANNER_SEEDS = [
    {
      key: "3gwash", label: "3G Wash", dot: "#1E6FC4", light: true, rawBg: true,
      base: "background-color:#DCEBFA;background-image:radial-gradient(closest-side,#bcdcf6 0%,transparent 100%),radial-gradient(closest-side,#a9d3f2 0%,transparent 100%),radial-gradient(rgba(11,37,69,.07) 1.2px,transparent 1.3px),linear-gradient(104deg,#E9F2FC 0%,#DCEBFA 55%,#CFE4F7 100%);background-repeat:no-repeat,no-repeat,repeat,no-repeat;background-size:640px 340px,420px 300px,18px 18px,cover;background-position:92% -30%,68% 145%,0 0,center;",
      motif: "",
      note: "Brought over from 3g's own hero — the same soft radial glows and fine dot-grid texture over a light blue wash, with dark ink text for contrast. Now the default for this template."
    },
    {
      key: "desk3d", label: "Motadata Desk", dot: "#3E7C5A", light: true, hideAnn: true, bannerHeight: 320, center: true,
      base: "linear-gradient(120deg,#DCEAE1 0%,#E7F1EA 55%,#EFF6F0 100%)",
      motif: "",
      note: "A real 3D scene, not a generated pattern: a paper sheet with an extruded 'motadata' wordmark and six floating solids (charcoal, peach, terracotta, teal), each with proper top/front/side faces and soft ground shadows, over a sage wash. Its markup is hand-authored SVG directly in the 3b2 template (see isDesk / bannerIsDesk) rather than one of the JS shape generators the other seeds use. The announcement card steps aside so the scene has the full banner to itself."
    },
    {
      key: "dotgrad", label: "Dot Gradient", dot: "#2FAFC0", light: true, rawBg: true,
      base: "background-color:#FDF6E8;background-image:" + svgUrl(900, 220, dotGradientInner(900, 220, "#2FAFC0")) + ",linear-gradient(100deg,#FBF3C7 0%,#FDF6E8 30%,#EAF6F1 65%,#D3EEEA 100%);background-repeat:no-repeat,no-repeat;background-size:100% 100%,cover;background-position:center,center;",
      motif: "",
      note: "A halftone dot field that itself fades as a gradient — barely-there dots on the left growing into solid teal dots on the right — over a warm cream-to-cool teal wash."
    },
    {
      key: "starlight", label: "Starlight", dot: "#A9C6ED", rawBg: true, searchWhite: true,
      base: "background-color:#1E2740;background-image:" + svgUrl(900, 220, nightSkyInner(900, 220)) + ",linear-gradient(120deg,#1B2438 0%,#212C46 100%);background-repeat:no-repeat,no-repeat;background-size:100% 100%,cover;background-position:center,center;",
      motif: "",
      note: "Scattered sunburst stars, twinkle sparkles, a ring and an arch, spread across the full width behind both the text and the announcement card — over a grayish navy wash."
    },
    {
      key: "diamond", label: "Diamond Cascade", dot: "#8FC3FF", rawBg: true,
      base: "background-color:#0B3FA8;background-image:" + svgUrl(900, 220, diamondCascadeInner(900, 220)) + ",linear-gradient(135deg,#1E6FEB 0%,#0B3FA8 55%,#06225C 100%);background-repeat:no-repeat,no-repeat;background-size:100% 100%,cover;background-position:center,center;",
      motif: "",
      note: "A cluster of rounded-corner squares anchored at the right edge, cascading in a shrinking sequence toward the 40%-width mark, blending into the blue gradient rather than a hard edge."
    },
    {
      key: "hexpulse", label: "Hex Pulse Blue", dot: "#0E4C5C", rawBg: true, bannerHeight: 320, annBottom: true, searchWhite: true,
      base: "background-color:#0E4C5C;background-image:" + svgUrl(900, 220, ringDots(900, 220)) + ",linear-gradient(120deg,#0B3E4C 0%,#0E4C5C 60%,#11566A 100%);background-repeat:no-repeat,no-repeat;background-size:100% 100%,cover;background-position:center,center;",
      motif: "",
      note: "Orange rings, plus marks and a dot grid scattered full-width at low opacity, over a deep teal-blue wash."
    },
    {
      key: "gears", label: "Gear Works", dot: "#57616E", rawBg: true,
      base: "background-color:#3E4550;background-image:" + svgUrl(900, 220, gearsCascadeInner(900, 220)) + ",linear-gradient(125deg,#2A2F38 0%,#3E4550 55%,#57616E 100%);background-repeat:no-repeat,no-repeat;background-size:100% 100%,cover;background-position:center,center;",
      motif: "",
      note: "A cascade of interlocking gears, largest at the right edge and shrinking as they trail left across the right ~40% of the width, at light opacity over a steel-grey gradient."
    }
  ];

  class Component extends DCLogic {
    state = { tab: "3b", group: "it", reqH: 0, seed: "coral", bannerSeed: "3gwash" };
  
    foyVals() {
      // Plant-floor shortcuts. 4i shows all four, 3h the first three.
      const mfgLinks = [
        { i: "monitor_heart", t: "Line status board" },
        { i: "swap_horiz", t: "Shift handover notes" },
        { i: "precision_manufacturing", t: "Machine & asset register" },
        { i: "build", t: "Maintenance schedule" }
      ];
      return {
        mfgQuickLinks: mfgLinks,
        mfgQuickLinks3: mfgLinks.slice(0, 3),
        kbs5: (this.layoutVals().kbs8 || []).slice(0, 5),
        kbs4: (this.layoutVals().kbs8 || []).slice(0, 4),
        kbs2: (this.layoutVals().kbs8 || []).slice(0, 2),
        anns2: (this.layoutVals().anns5 || []).slice(0, 2),
        anns3: (this.layoutVals().anns5 || []).slice(0, 3),
        apprRowsStd: [
          { id: "INC-192", s: "Wrong configuration details · editorial review", d: "11 Aug, 02:14 PM", who: "Rosy", ai: "RO", ab: "#2f5fe0" },
          { id: "AST-13", s: "DESKTOP-5JPPI6F · asset assignment", d: "10 Aug, 12:57 PM", who: "Keya", ai: "KE", ab: "#7c3aed" }
        ],
        apprRows3b2: [
          { id: "INC-192", s: "Wrong configuration details · editorial review", d: "11 Aug, 02:14 PM", who: "Rosy", ai: "RO", ab: "#2f5fe0" },
          { id: "AST-13", s: "DESKTOP-5JPPI6F · asset assignment", d: "10 Aug, 12:57 PM", who: "Keya", ai: "KE", ab: "#7c3aed" }
        ],
        kbRows3b2: [
          { id: "KB-4", t: "How to Reset Your Password", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", t: "Connecting to Company VPN", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", t: "Reporting a Hardware Fault", d: "11 Aug, 04:38 PM", cat: "Guideline" },
          { id: "KB-9", t: "Requesting Software Installation", d: "07 Aug, 09:12 AM", cat: "How-to" }
        ],
        kbs6: (this.layoutVals().kbs8 || []).slice(0, 6),
        empKpis: [
          { i: "inbox", v: "8", l: "My open requests", s: "2 updated today" },
          { i: "how_to_reg", v: "2", l: "My approvals", s: "oldest 3 days" },
          { i: "folder_open", v: "3", l: "My projects", s: "1 milestone due" },
          { i: "task_alt", v: "5", l: "My tasks", s: "2 due this week" }
        ],
        eduKpis: [
          { i: "inbox", v: "8", l: "Open requests", s: "2 updated today" },
          { i: "how_to_reg", v: "3", l: "Approvals", s: "oldest 3 days" },
          { i: "task_alt", v: "5", l: "My tasks", s: "2 due this week" },
          { i: "event_available", v: "94%", l: "Attendance", s: "this semester" }
        ],
        eduActions4: [
          { i: "report", t: "Report an issue", s: "Wi-Fi, LMS, lab machines or classroom AV." },
          { i: "add_task", t: "Request a service", s: "Accounts, software, equipment or access." },
          { i: "manage_accounts", t: "Account self service", s: "Reset your password or unlock your account." },
          { i: "menu_book", t: "Find a guide", s: "Search 412 how-to articles and FAQs." }
        ],
        requests4: (this.layoutVals().requests6 || []).slice(0, 4),
        keystoneNav: [{ t: "Knowledge base" }, { t: "How-to videos" }, { t: "Help guides" }],
        keystoneTopics: [{ t: "reset password" }, { t: "market data access" }, { t: "report phishing" }],
        vaultNav: [
          { t: "Knowledge Articles", c: "" },
          { t: "Get Help", c: "" },
          { t: "Products & Services", c: "" },
          { t: "My Items", c: "2" }
        ],
        vaultCounts: [
          { l: "Tickets", n: "8", bg: "#7CC243", fg: "#123008" },
          { l: "Orders", n: "3", bg: "#7CC243", fg: "#123008" },
          { l: "Approvals", n: "3", bg: "#E8EDF6", fg: "#10306B" }
        ],
        bfsiKpis: [
          { v: "8", l: "Open requests", s: "2 updated today" },
          { v: "3", l: "Awaiting approval", s: "oldest 3 days" },
          { v: "22m", l: "Median first response", s: "P1 target 15m" },
          { v: "9", l: "Assets assigned", s: "2 due refresh" }
        ],
        bfsiActions4: [
          { i: "report", t: "Report an incident", s: "Trading floor, core banking or desktop faults." },
          { i: "add_task", t: "Request access", s: "Applications, market data and shared drives." },
          { i: "shield_lock", t: "Report phishing", s: "Forward a suspicious message for review." },
          { i: "fact_check", t: "Attestations", s: "Complete your quarterly access review." }
        ],
        courses4: [
          { k: "Compliance", t: "Information Security Essentials 2026", s: "4 of 9 modules · due 30 Sep", pct: "44%", slot: "cs-c1", ph: "Course thumbnail · 16:9" },
          { k: "Leadership", t: "Managing Distributed Teams", s: "6 of 8 modules · cohort 14", pct: "75%", slot: "cs-c2", ph: "Course thumbnail · 16:9" },
          { k: "Technical", t: "Cloud Fundamentals and Cost Control", s: "2 of 12 modules · self-paced", pct: "18%", slot: "cs-c3", ph: "Course thumbnail · 16:9" },
          { k: "Certification", t: "Service Management Foundation", s: "Exam booked · 12 Oct", pct: "92%", slot: "cs-c4", ph: "Course thumbnail · 16:9" }
        ],
        calendar4: [
          { mon: "Sep", day: "15", t: "Semester 1 mid-term examinations begin", s: "All departments · exam halls A–D" },
          { mon: "Sep", day: "22", t: "Last date for course add or drop", s: "Registrar's office · 17:00" },
          { mon: "Oct", day: "02", t: "Institute closed · Gandhi Jayanti", s: "Hostels and library remain open" },
          { mon: "Oct", day: "11", t: "Fee payment window opens for Semester 2", s: "Student portal · online only" }
        ],
        quickLinks3: [
          { i: "wifi", t: "Campus Wi-Fi setup" },
          { i: "key", t: "Reset LMS password" },
          { i: "menu_book", t: "Library account" }
        ],
        eduNotices: withDateTiles([
          { k: "Examinations", d: "12 Aug 2026", t: "Mid-term hall tickets are now available for download on the student portal.", s: "Download yours before the 20 Aug cut-off; late requests go through the exam cell." },
          { k: "Admissions", d: "10 Aug 2026", t: "Round 2 counselling schedule published for postgraduate programmes.", s: "Seat allotment results follow on 18 Aug; keep your documents to hand." },
          { k: "Maintenance", d: "08 Aug 2026", t: "Hostel block C Wi-Fi upgrade on Saturday 16 Aug, 02:00–05:00.", s: "Wired ports in the common room stay live through the window." },
          { k: "Library", d: "05 Aug 2026", t: "Extended reading room hours until 23:00 through the examination period.", s: "Entry needs your library card after 20:00." }
        ]),
        railKpis: [
          { v: "8", l: "Open requests", s: "2 updated today" },
          { v: "5", l: "My tasks", s: "2 due this shift" },
          { v: "9", l: "Devices", s: "under maintenance" }
        ],
        services4: (this.layoutVals().services6 || []).slice(0, 4),
        requests4: (this.layoutVals().requests8 || []).slice(0, 4),
        govNotices: withDateTiles([
          { k: "Circular", no: "No. IT/2026/114", d: "04 Sept 2026", t: "e-KYC verification becomes mandatory for all new service applications from 1 October 2026." },
          { k: "Tender", no: "No. DIT/PR/88", d: "29 Aug 2026", t: "Bids invited for the district data centre network refresh — closes 26 September." },
          { k: "Holiday", no: "No. GAD/2026/41", d: "22 Aug 2026", t: "Citizen facilitation centres closed on 2 October for Gandhi Jayanti." },
          { k: "Policy", no: "No. IT/2026/109", d: "14 Aug 2026", t: "Revised grievance escalation matrix takes effect across all departments." }
        ]),
        foyActions: [
          { i: "report", t: "Report an incident", s: "Something is broken, slow or behaving unexpectedly.", cta: "Report it" },
          { i: "add_task", t: "Request a service", s: "Hardware, software, access or a new account.", cta: "Browse catalog" },
          { i: "manage_accounts", t: "AD self service", s: "Reset your password or unlock your own account.", cta: "Open self service" },
          { i: "menu_book", t: "Knowledge", s: "Search 412 guides, FAQs and how-to articles.", cta: "Search articles" }
        ]
      };
    }
  
    annCarousel() {
      const items = withDateTiles([
        { k: "Rollout", d: "05 Sept 2026", t: "Windows 11 rollout starts 22 September", s: "Check whether your laptop is on the first wave, and what to back up first." },
        { k: "Maintenance", d: "11 Aug 2026", t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", s: "VPN, the intranet and payroll submission are unavailable for the full window." },
        { k: "Service desk", d: "04 Aug 2026", t: "Service desk hours extended to 20:00 IST", s: "Walk-in support at the Block B desk now runs through the evening shift." }
      ]);
      const i = ((this.state.annIdx || 0) % items.length + items.length) % items.length;
      return {
        annNow: items[i],
        annPos: (i + 1) + " of " + items.length,
        annIsLast: i === items.length - 1,
        annPrev: () => this.setState({ annIdx: i - 1 }),
        annNext: () => this.setState({ annIdx: i + 1 }),
        annDotsInk: items.map((_, n) => ({
          w: n === i ? "22px" : "7px",
          bg: n === i ? "#14468F" : "#cbd7e6",
          go: () => this.setState({ annIdx: n })
        })),
        annDots: items.map((_, n) => ({
          w: n === i ? "22px" : "8px",
          bg: n === i ? "#ffffff" : "rgba(255,255,255,.42)",
          go: () => this.setState({ annIdx: n })
        }))
      };
    }
  
    deskNoticeVals() {
      const list = this.foyVals().eduNotices || [];
      const n = list.length || 1;
      const i = ((this.state.deskN || 0) % n + n) % n;
      return {
        deskNotice: list[i] || {},
        deskOthers: list.map((x, j) => ({ ...x, go: () => this.setState({ deskN: j }) })).filter((x, j) => j !== i),
        deskOthers2: list.map((x, j) => ({ ...x, go: () => this.setState({ deskN: j }) })).filter((x, j) => j !== i).slice(0, 2),
        deskNoticePos: (i + 1) + " of " + n,
        deskPrev: () => this.setState(s => ({ deskN: (s.deskN || 0) - 1 })),
        deskNext: () => this.setState(s => ({ deskN: (s.deskN || 0) + 1 }))
      };
    }
  
    /* The 5a strip cycles every notice on its own. The Announcements card was
       replaced by Most Used Services, so this is the only place notices
       appear and all three need to be reachable. Hovering holds the current
       one; the timer stops itself once the stage is replaced. */
    hcAnnStart(node) {
      const STEP = 5000;
      const tick = () => {
        if (!node.isConnected) { clearInterval(this._hcAnnTimer); return; }
        this.setState(st => ({ hcAnnIdx: (st.hcAnnIdx || 0) + 1 }));
      };
      const start = () => {
        clearInterval(this._hcAnnTimer);
        this._hcAnnTimer = setInterval(tick, STEP);
      };
      start();
      node.addEventListener('mouseenter', () => clearInterval(this._hcAnnTimer));
      node.addEventListener('mouseleave', start);
    }

    /* Prism's announcement strip rotates by itself. It keeps its own index
       so the manually driven carousels in 3b2 / 3h / 4g / 5c are untouched.
       Dot colours come from the active seed, so each Prism variant tints its
       own dots. */
    prismAnn() {
      const items = withDateTiles([
        { k: "Maintenance", d: "11 Aug 2026", t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", s: "VPN, the intranet and payroll submission are unavailable for the full window." },
        { k: "Rollout", d: "08 Aug 2026", t: "New VPN client rollout begins next week", s: "Check whether your laptop is on the first wave, and what to back up first." },
        { k: "Service desk", d: "04 Aug 2026", t: "Service desk hours extended to 20:00 IST", s: "Walk-in support at the Block B desk now runs through the evening shift." }
      ]);
      const i = ((this.state.pAnnIdx || 0) % items.length + items.length) % items.length;
      const tok = this.seedTokens();
      return {
        pAnnNow: items[i],
        pAnnIsLast: i === items.length - 1,
        pAnnDots: items.map((a, n) => ({
          w: n === i ? "18px" : "6px",
          bg: n === i ? tok.t2Acc : tok.t2Dot,
          go: () => this.setState({ pAnnIdx: n })
        })),
        pAnnPrev: () => this.setState({ pAnnIdx: i - 1 }),
        pAnnNext: () => this.setState({ pAnnIdx: i + 1 }),
        pAnnAuto: (node) => this.prismAnnStart(node)
      };
    }

    prismAnnStart(node) {
      const STEP = 5000;
      const tick = () => {
        if (!node.isConnected) { clearInterval(this._pAnnTimer); return; }
        this.setState(st => ({ pAnnIdx: (st.pAnnIdx || 0) + 1 }));
      };
      const start = () => {
        clearInterval(this._pAnnTimer);
        this._pAnnTimer = setInterval(tick, STEP);
      };
      start();
      node.addEventListener('mouseenter', () => clearInterval(this._pAnnTimer));
      node.addEventListener('mouseleave', start);
    }

    hcVals() {
      const v = this.layoutVals();
      const req = v.requests6 || v.requests8 || [];
      const dev = v.assetsCis3 || [];
      // 5c banner action cards — replaced the FAQ accordion.
      const hcActions3 = [
        { i: "report", t: "Report a clinical fault" },
        { i: "vpn_key", t: "Request access or equipment" },
        { i: "menu_book", t: "Find a procedure or guide" }
      ];
      // carried over from the Announcements card this layout no longer has
      const hcAnns = withDateTiles([
        { k: "Maintenance", d: "11 Aug 2026", t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", s: "Clinical Wi-Fi stays up throughout." },
        { k: "Rollout", d: "08 Aug 2026", t: "New VPN client rollout begins next week", s: "Ward laptops update overnight on their own." },
        { k: "Service desk", d: "04 Aug 2026", t: "Service desk hours extended to 20:00 IST", s: "Clinical on-call cover is unchanged." }
      ]);
      const hcI = ((this.state.hcAnnIdx || 0) % hcAnns.length + hcAnns.length) % hcAnns.length;
      const out = {
        hcAnnNow: hcAnns[hcI],
        hcAnnIsLast: hcI === hcAnns.length - 1,
        hcAnnDots: hcAnns.map((a, n) => ({
          k: a.k,
          w: n === hcI ? "20px" : "7px",
          bg: n === hcI ? "#0F5C8C" : "#c3d3e0",
          go: () => this.setState({ hcAnnIdx: n })
        })),
        hcAnnPrev: () => this.setState({ hcAnnIdx: hcI - 1 }),
        hcAnnNext: () => this.setState({ hcAnnIdx: hcI + 1 }),
        hcAnnAuto: (node) => this.hcAnnStart(node),
        hcActions3,
        requests4: req.slice(0, 4),
        devices6: [
          { n: "Dell Latitude 5440", tag: "AST-1041", k: "Laptop", i: "laptop_mac" },
          { n: "Dell UltraSharp U2723QE", tag: "AST-1042", k: "Monitor", i: "desktop_windows" },
          { n: "Ward PC · Bay 4B", tag: "CI-2208", k: "Base CI", i: "dns" },
          { n: "iPad Pro 11 · rounds", tag: "AST-1188", k: "Tablet", i: "tablet_mac" },
          { n: "Zebra ZD421 label printer", tag: "AST-1203", k: "Printer", i: "print" },
          { n: "Ascom d63 handset", tag: "AST-1249", k: "Handset", i: "phone_iphone" }
        ],
        devices4: [
          { n: "Dell Latitude 5440", tag: "AST-1041", k: "Laptop", i: "laptop_mac" },
          { n: "Dell UltraSharp U2723QE", tag: "AST-1042", k: "Monitor", i: "desktop_windows" },
          { n: "Ward PC · Bay 4B", tag: "CI-2208", k: "Base CI", i: "dns" },
          { n: "iPad Pro 11 · rounds", tag: "AST-1188", k: "Tablet", i: "tablet_mac" }
        ],
        changes4: [
          { t: "Firewall rule change for the pathology VLAN", id: "CHG-441", d: "Aug 14", who: "Network", st: "Scheduled", si: "event", bg: "#e6eef9", fg: "#1a4f96" },
          { t: "EMR patch rollout to ward workstations", id: "CHG-438", d: "Aug 13", who: "Clinical apps", st: "In review", si: "hourglass_top", bg: "#fdf1d6", fg: "#8a5a08" },
          { t: "Retire legacy PACS viewer on radiology PCs", id: "CHG-430", d: "Aug 11", who: "Imaging", st: "Approved", si: "check_circle", bg: "#e7f4ee", fg: "#1f7a44" },
          { t: "Add pharmacy printer to the ward print queue", id: "CHG-427", d: "Aug 09", who: "Endpoint", st: "Implemented", si: "task_alt", bg: "#eef2f7", fg: "#4a5a70" }
        ],
        annFirst: { t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00. Clinical Wi-Fi stays up throughout." },
        govTiles: [
          { t: "Apply for a certificate", s: "Birth, death, income and residence certificates.", slot: "gz-t1", ph: "Citizen at a facilitation counter · 16:9" },
          { t: "Pay a bill or tax", s: "Property tax, water charges and trade licence renewals.", slot: "gz-t2", ph: "Municipal office or payment counter · 16:9" },
          { t: "Track a grievance", s: "Every complaint carries a number and a 21-day deadline.", slot: "gz-t3", ph: "Secretariat building exterior · 16:9" }
        ],
        kbs4: [
          { id: "KB-4", r: "01", t: "How to Reset Your Password", m: "Guideline Documents · 2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", r: "02", t: "Connecting to Company VPN", m: "FAQs · 1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-9", r: "03", t: "Requesting Software Installation", m: "Guideline Documents · 1.4k reads", d: "07 Aug, 09:12 AM", cat: "How-to" },
          { id: "KB-10", r: "04", t: "Setting Up Email on Mobile", m: "FAQs · 1.1k reads", d: "06 Jul, 08:55 AM", cat: "FAQs" }
        ],
        hcTiles: [
          { k: "Downtime", t: "Procedures for when a system is offline", s: "Paper charting packs, manual registers and phone escalation routes.", slot: "mrd-t1", ph: "Ward corridor or nurses' station · 16:9" },
          { k: "Devices", t: "Ward equipment and bedside hardware", s: "Report a fault, request a replacement or check what is assigned to 4B.", slot: "mrd-t2", ph: "Clinician with a tablet or monitor · 16:9" },
          { k: "Access", t: "Accounts, roles and bank staff logins", s: "New starters, role changes and shared accounts for agency staff.", slot: "mrd-t3", ph: "Badge reader or workstation login · 16:9" }
        ]
      };
      // the row of three keeps its heights even, so devices show four like the rest
      out.devices4 = (out.devices6 || []).slice(0, 4);
      return out;
    }
  
    seedTokens() {
      const green = this.state.tab === "2ag";
      const navyLocked = this.state.tab === "2an";
      const coral = navyLocked ? false : this.state.seed === "coral";
      const chip = on => "display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;border:1px solid " +
        (on ? "#07101f;background:#07101f;color:#fff" : "#dde4ee;background:#fff;color:#4a5a70");
      const base = {
        showSeedSwitch: !green && !navyLocked,
        seedCoral: () => this.setState({ seed: "coral" }),
        seedNavy: () => this.setState({ seed: "navy" }),
        seedCoralStyle: chip(coral),
        seedNavyStyle: chip(!coral),
        seedNote: coral
          ? "Hero wash #FDEEEC with grid texture at 6% coral. Heading #07101F on the wash reads 6.80:1. Suits Education, Healthcare and general tenants."
          : "Hero wash #EDF2F8 with grid texture at 6% #516381. Same #07101F heading and buttons. Suits BFSI and Government tenants."
      };
      if (green) return Object.assign(base, {
        t2Wash: "#e6f4ec", t2Bd: "#cbe5d8", t2Acc: "#0e7150", t2AccLite: "#7ac5a2",
        t2Btn: "#0c2f24", t2Btn2: "#0e7150", t2Ink: "#0d2c22",
        t2Mute: "#4c6459", t2Mute2: "#5c7368", t2Badge: "#eaf5f0", t2Badge50: withAlpha("#eaf5f0", .5), t2CardBd: "#dbe8e2",
        t2Ground: "#f4f9f6", t2Tex: "rgba(14,113,80,.07)",
        t2Ring1: "rgba(14,113,80,.16)", t2Ring2: "rgba(14,113,80,.2)",
        t2Blob: "#cfead9", t2Dot: "#b9cdc4", t2Hair: "#eef4f1", t2Hair2: "#f3f8f6"
      });
      return Object.assign(base, {
        t2Wash:     coral ? "#fdeeec" : "#edf2f8",
        t2Bd:       coral ? "#f5d8d3" : "#d6e0ed",
        t2Acc:      coral ? "#c2452f" : "#516381",
        t2AccLite:  coral ? "#e59a8b" : "#9aa9c0",
        t2Btn:      "#07101f",
        t2Btn2:     "#07101f",
        t2Ink:      "#07101f",
        t2Mute:     coral ? "#6b5450" : "#4f5b6d",
        t2Mute2:    coral ? "#8a716c" : "#6b7789",
        t2Badge:    coral ? "#fbe3df" : "#e3e9f2",
        t2Badge50:  withAlpha(coral ? "#fbe3df" : "#e3e9f2", .5),
        t2CardBd:   coral ? "#ecdedb" : "#dde4ee",
        t2Ground:   coral ? "#fcf7f6" : "#f6f8fb",
        t2Tex:      coral ? "rgba(194,69,47,.06)" : "rgba(81,99,129,.06)",
        t2Ring1:    coral ? "rgba(194,69,47,.16)" : "rgba(81,99,129,.16)",
        t2Ring2:    coral ? "rgba(194,69,47,.2)"  : "rgba(81,99,129,.2)",
        t2Blob:     coral ? "#f9ddd7" : "#dde5f0",
        t2Dot:      coral ? "#d8c2bd" : "#c2ccdb",
        t2Hair:     coral ? "#f6ecea" : "#eef2f7",
        t2Hair2:    coral ? "#faf4f3" : "#f4f7fa"
      });
    }

    sidecarBanner() {
      const activeKey = this.state.bannerSeed || BANNER_SEEDS[0].key;
      const active = BANNER_SEEDS.find(s => s.key === activeKey) || BANNER_SEEDS[0];
      const chip = on => "display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;border:1px solid " +
        (on ? "#07101f;background:#07101f;color:#fff" : "#dde4ee;background:#fff;color:#4a5a70");
      const light = !!active.light;
      const whiteSearch = light || !!active.searchWhite;
      return {
        showBannerSeed: true,
        bannerSwatches: BANNER_SEEDS.map(s => ({
          key: s.key,
          label: s.label,
          dot: "width:10px;height:10px;border-radius:3px;background:" + s.dot + ";flex-shrink:0",
          style: chip(s.key === activeKey),
          go: () => this.setState({ bannerSeed: s.key })
        })),
        bannerBg: active.rawBg ? active.base : ("background-image:" + active.base + ";background-size:cover;background-position:center;"),
        bannerMotif: active.motif ? ("background-image:" + active.motif + ";background-repeat:no-repeat;background-size:" + active.motifSize + ";background-position:" + active.motifPos + ";") : "",
        bannerTitleColor: light ? "#0b2545" : "#fff",
        bannerSubColor: light ? "#425a75" : "#c5dcea",
        bannerSearchBg: whiteSearch ? "#fff" : "#ffffff17",
        bannerSearchBorder: whiteSearch ? "1px solid #d3e3f4" : "1px solid #ffffff33",
        bannerSearchFg: whiteSearch ? "#5f6f83" : "#a9c9da",
        bannerSearchIcon: whiteSearch ? "#1E6FC4" : "#a9c9da",
        bannerBorder: light ? "1px solid #cfe0f2" : "1px solid rgba(255,255,255,.14)",
        bannerAccentBg: tintLight(active.dot, .88),
        bannerAccentBorder: tintLight(active.dot, .78),
        bannerAccentFg: tintDark(active.dot, .35),
        bannerHideAnn: !!active.hideAnn,
        bannerIsDesk: activeKey === "desk3d",
        bannerPageBg: washFromHex(active.dot, .28, .965),
        bannerTileBg: washFromHex(active.dot, .30, .975),
        bannerBadgeBg: washFromHex(active.dot, .34, .958),
        bannerGridCols: active.hideAnn ? "minmax(0,1fr) minmax(360px,560px)" : "minmax(0,1fr) minmax(280px,452px)",
        bannerMinHeight: (active.bannerHeight || 220) + "px",
        bannerLeftJustify: "space-between",
        bannerLeftGap: "20px",
        bannerLeftAlign: "stretch",
        bannerTextAlign: "left",
        bannerSearchWidth: "100%",
        bannerAnnJustify: active.annBottom ? "flex-end" : "flex-start"
      };
    }

    renderVals() {
      const LAYOUTS = [
        ["8a", "Vault"], ["8b", "Keystone"],
        ["7a", "Quadrangle"], ["7b", "Course Shelf"], ["7c", "Study Desk"],
        ["6c", "Triptych"], ["6b", "Foyer"], ["6a", "Gazette"], ["5a", "Meridian"], ["5b", "Consort"], ["5c", "Bedside"], ["4p", "Employee Center"], ["4i", "Rails"], ["4h", "Broadside"], ["4g", "Half Deck"], ["4f", "Front Desk"], ["4e", "Atrium"], ["4d", "Portico"], ["4c", "Mosaic"], ["4c2", "Mosaic II"], ["4b", "Broadsheet"], ["4a", "Service Center"], ["4a2", "Help Desk"], ["3j", "Bulletin"], ["3i", "Wayfinder"], ["3h", "Concierge"],
        ["4f2", "Counter · Image"], ["3h2", "Concierge II"], ["3g", "Atlas"], ["3d", "Dispatch"],
        ["3b", "Sidecar"], ["3b2", "Sidecar · Announcements"], ["3c", "Counter"], ["3c2", "Counter II"], ["2a", "Prism"], ["2ag", "Prism · Green"], ["2an", "Prism · Navy"],
        ["2b", "Ledger"]
      ];
      const GROUPS = [
        ["it", "IT & ITES", [["3b2", "announcement card"], ["3g", ""], ["2a", ""], ["2ag", ""], ["4f", ""], ["4f2", "image panel"], ["4g", ""]],
          "No industry widget — the out-of-the-box baseline. Requests, approvals and assets as individual cards."],
        ["health", "Healthcare", [["5a", "primary"], ["5c", ""], ["2an", ""], ["3i", ""], ["4b", ""], ["4f", ""], ["4p", ""], ["6c", ""]],
          "Status board first, report-dominant actions, downtime procedures and on-call. Announcements are downtimes only."],
        ["mfg", "Manufacturing", [["4i", "primary"], ["3h", ""], ["4c", ""], ["4c2", ""], ["4d", ""]],
          "Action bars, plant and line status, shift handover and line equipment ahead of the generic queue."],
        ["gov", "Government", [["3i", "primary"], ["4b", "catalog-first"], ["3j", ""], ["6a", ""], ["4f", ""], ["4g", ""], ["3c", ""]],
          "Categories with descriptions, policies and circulars, public notices and an office directory."],
        ["edu", "Education", [["7a", "primary"], ["7b", "course-led"], ["7c", "tactile"], ["4e", ""], ["4p", "multi-dept"]],
          "Notice board, academic calendar and quick links above the actions; approvals and catalog below, with a student KPI row."],
        ["bfsi", "BFSI", [["8a", "primary"], ["8b", "help-centre"], ["4a", ""], ["4f", ""], ["4g", ""]],
          "Split banner with a finance motif, category grid beside announcements, approvals full width, then assets, contacts and KPIs."],
        ["rejected", "Rejected", [["4a2", "unplaced"], ["4h", ""], ["3d", ""], ["3h2", ""], ["3c2", ""], ["2b", ""], ["5b", ""], ["6b", ""], ["3b", ""]],
          "Not shipping."]
      ];
      const NAMES = {};
      LAYOUTS.forEach(([id, name]) => { NAMES[id] = name; });

      // Each team member's personal top picks, by layout id. Used to build
      // the "Top selected by Team" group below — initials and industry tags
      // on each of its tabs are derived from this, not hand-maintained.
      const TEAM_PICKS = {
        "Saahil Pandya": ["5a", "4b", "4p", "6c", "3h", "4c", "4c2", "3j"],
        "Juli Gopani": ["2a", "4f2", "4g", "4i", "4d", "8a", "7a", "4e"],
        "Nirav Bhatt": ["4f", "3g", "2a", "4c", "3h", "3c", "4b", "3i", "5a", "8b", "7c", "4e", "4g"],
        "Zeni Chaklasiya": ["3b2", "4f", "2an", "6c", "4p", "4i", "4c2", "6a", "4e", "8b", "7a"],
        "Sakshi Asudhani": ["4e", "7a", "5a", "4p", "4c2", "4b", "3h", "3i"]
      };
      const PERSON_COLOR = {
        "Saahil Pandya": { bg: "#E6EEF9", fg: "#1A4F96" },
        "Juli Gopani": { bg: "#E3F2EA", fg: "#0B5C40" },
        "Nirav Bhatt": { bg: "#FDF1D6", fg: "#8A5A08" },
        "Zeni Chaklasiya": { bg: "#F3E8FB", fg: "#6B3FA0" },
        "Sakshi Asudhani": { bg: "#DFF4F3", fg: "#0F6E68" }
      };
      const SHORT_INDUSTRY = { it: "IT & ITES", health: "Healthcare", mfg: "Manufacturing", gov: "Government", edu: "Education", bfsi: "BFSI" };
      const initialsOf = name => name.split(" ").map(w => w[0]).join("").toUpperCase();
      const teamMeta = {};
      Object.keys(TEAM_PICKS).forEach(person => {
        Array.from(new Set(TEAM_PICKS[person])).forEach(id => {
          const c = PERSON_COLOR[person] || {};
          (teamMeta[id] || (teamMeta[id] = { people: [] })).people.push({ name: person, initials: initialsOf(person), bg: c.bg || "#f0f4f9", fg: c.fg || "#5f6f83" });
        });
      });
      Object.keys(teamMeta).forEach(id => {
        teamMeta[id].industries = GROUPS
          .filter(([key]) => key !== "rejected")
          .filter(([, , members]) => members.some(([mid]) => mid === id))
          .map(([key]) => SHORT_INDUSTRY[key] || key)
          .join(", ");
      });
      const teamOrder = Object.keys(teamMeta).sort((a, b) => {
        const byVotes = teamMeta[b].people.length - teamMeta[a].people.length;
        if (byVotes) return byVotes;
        return LAYOUTS.findIndex(([id]) => id === a) - LAYOUTS.findIndex(([id]) => id === b);
      });
      GROUPS.unshift(["team", "Top selected by Team", teamOrder.map(id => [id, ""]),
        "Personal top picks from the team, across every industry."]);

      GROUPS.unshift(["final", "Final", [
        ["4e", ""], ["4g", ""], ["7a", ""], ["4c2", ""], ["5a", ""], ["3h", ""],
        ["4f", ""], ["2a", ""], ["3b2", ""], ["3c", ""], ["4p", ""], ["8b", ""]
      ], "Final selection, ready to ship."]);

      const SHOW_ONLY_FINAL = true;
      if (SHOW_ONLY_FINAL) GROUPS.splice(1);

      let group = this.state.group;
      if (!GROUPS.some(g => g[0] === group)) group = GROUPS[0][0];
      const activeGroup = GROUPS.find(g => g[0] === group);
  
      let active = this.state.tab;
      if (!activeGroup[2].some(([id]) => id === active)) active = activeGroup[2][0][0];
  
      const industries = GROUPS.map(([key, name, members]) => {
        const on = key === group;
        const rej = key === "rejected";
        return {
          key, name, count: members.length,
          bg: on ? (rej ? "#3d2b2b" : "#0b2545") : "#ffffff",
          bd: on ? (rej ? "#3d2b2b" : "#0b2545") : "#dde4ee",
          fg: on ? "#ffffff" : "#4a5a70",
          cbg: on ? "#ffffff2e" : "#f0f4f9",
          cfg: on ? "#ffffff" : "#5f6f83",
          go: () => this.setState({ group: key, tab: members[0][0] })
        };
      });
  
      const TAGS = {
        primary: { fg: "#0b5c40", bg: "#e3f2ea" },
        "catalog-first": { fg: "#1a4f96", bg: "#e6eef9" },
        "multi-dept": { fg: "#1a4f96", bg: "#e6eef9" },
        held: { fg: "#8a5a08", bg: "#fdf1d6" },
        unplaced: { fg: "#8a5a08", bg: "#fdf1d6" },
        "course-led": { fg: "#2B3A8F", bg: "#EEF0FB" },
        tactile: { fg: "#2B3A8F", bg: "#EEF0FB" },
        "help-centre": { fg: "#10306B", bg: "#E8EDF6" }
      };
      const isTeamGroup = group === "team";
      const tabs = activeGroup[2].map(([id, tag]) => {
        const on = id === active;
        const t = TAGS[tag] || {};
        return {
          id, name: NAMES[id] || id, tag: tag || false,
          tagfg: t.fg || "#5f6f83", tagbg: t.bg || "#f0f4f9",
          bg: on ? "#eef3fa" : "#ffffff",
          bd: on ? "#1856b3" : "transparent",
          fg: on ? "#0b2545" : "#4a5a70",
          idfg: on ? "#1856b3" : "#7b8a9d",
          isTeam: isTeamGroup,
          people: isTeamGroup ? (teamMeta[id] || { people: [] }).people : [],
          industryLabel: isTeamGroup ? (teamMeta[id] || { industries: "" }).industries : "",
          go: () => this.setState({ tab: id })
        };
      });
      const industryNote = activeGroup[3];
      const optionCount = LAYOUTS.length;
      const show = {};
      LAYOUTS.forEach(([id]) => { show["is" + id] = id === active; });
      show.is2a = active === "2a" || active === "2ag" || active === "2an";
      // 4p is shared by Education and Healthcare; Healthcare drops its
      // Quick links and Notice board cards.
      show.notHealth = group !== "health";
      show.isHealth = group === "health";
  
  
      const measure = {
        reqCardRef: el => {
          this._reqCard = el;
          if (el && this._ro) { this._ro.disconnect(); this._ro.observe(el); this._observed = el; }
        },
        reqCardH: this.state.reqH ? this.state.reqH + "px" : "auto"
      };
  
      const vals = this.layoutVals();
      if (Array.isArray(vals.requests)) {
        vals.requests = vals.requests.map(r => Object.assign({}, r, this.greenStatus(r.st)));
      }
  
      vals.kbs4 = (vals.kbs6 || []).slice(0, 4);
      vals.kbs3 = (vals.kbs6 || []).slice(0, 3);
      vals.servicesCat4 = (vals.services || []).slice(0, 4);
      vals.servicesCat6 = (vals.services6 || []).map(s => Object.assign({}, s, { c: (s.c || "").split(" · ")[0] }));
      vals.services2a = (vals.services || []).concat([{ n: "Password Reset", c: "Security", i: "lock_reset" }]);
      vals.quickLinks4 = (vals.quickLinks || []).slice(0, 4);
      vals.deptCards4 = (vals.deptCards12 || []).slice(0, 4);
      vals.assetsCis8 = [].concat(vals.assets || [], vals.cis || []).slice(0, 8);
      vals.assetsCis5 = (vals.assetsCis8 || []).slice(0, 5);
      vals.assetsCis4 = (vals.assetsCis || vals.assets || []).slice(0, 4);
  
      const foy = this.foyVals();
      foy.govNotices3 = (foy.govNotices || []).slice(0, 3);
      foy.empKpis2 = (foy.empKpis || []).slice(0, 2);
  
      return Object.assign({ tabs, optionCount, industries, industryNote }, show, measure, vals, this.seedTokens(), this.sidecarBanner(), this.prismAnn(), this.hcVals(), this.deskNoticeVals(), this.annCarousel(), foy);
    }
  
    componentDidMount() {
      this._ro = new ResizeObserver(() => {
        const h = this._reqCard && this._reqCard.offsetHeight;
        if (h && h !== this.state.reqH) this.setState({ reqH: h });
      });
      if (this._reqCard) this._ro.observe(this._reqCard);
      this._annT = setInterval(() => {
        if (AUTO_ANN.has(this.state.tab)) this.setState(s => ({ annIdx: (s.annIdx || 0) + 1 }));
      }, 5000);
    }
  
    componentDidUpdate() {
      if (this._reqCard && this._ro && this._observed !== this._reqCard) {
        this._ro.disconnect();
        this._ro.observe(this._reqCard);
        this._observed = this._reqCard;
      }
    }
  
    componentWillUnmount() { if (this._ro) this._ro.disconnect(); if (this._annT) clearInterval(this._annT); }
  
    greenStatus(st) {
      const map = {
        "Open": { gbg: "#e3f2ea", gfg: "#0b5c40" },
        "In Progress": { gbg: "#d9efe4", gfg: "#0e7150" },
        "Pending": { gbg: "#fdf1d6", gfg: "#8a5a08" },
        "On Hold": { gbg: "#fdf1d6", gfg: "#8a5a08" },
        "Resolved": { gbg: "#eef4f1", gfg: "#40584d" },
        "Closed": { gbg: "#eef4f1", gfg: "#40584d" },
        "Reopened": { gbg: "#fbe9e6", gfg: "#9c3524" }
      };
      return map[st] || { gbg: "#eef4f1", gfg: "#40584d" };
    }
  
    layoutVals() {
      const pal = this.props.palette;
      const [inkBase, brand, brandLite, accent] = (Array.isArray(pal) && pal.length === 4)
        ? pal : ["#0b2545", "#1856b3", "#3f8ee8", "#f5b342"];
  
      const mood = this.props.mood ?? "Ink blocks";
      const porcelain = mood === "Porcelain";
      const hc = mood === "High contrast";
      const ink = porcelain ? "#e7ecf4" : (hc ? "#05101f" : inkBase);
  
      const cardStyle = this.props.cardStyle ?? "Elevated";
      const cardBg = cardStyle === "Flat tinted" ? "#f7f9fc" : "#ffffff";
      const cardBorder = cardStyle === "Flat tinted" ? "#f7f9fc" : (cardStyle === "Outlined" ? "#c9d4e2" : "#e9eef5");
      const cardShadow = cardStyle === "Elevated" ? "0 6px 18px rgba(11,37,69,.07)" : "none";

      const annFeaturedRaw = {
        k: "Maintenance",
        d: "11 Aug 2026",
        t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00",
        b: "Core switches are being replaced across both Ahmedabad floors. VPN, the intranet and payroll submission will be unavailable for the full window."
      };
      const annsRestRaw = [
        { k: "Rollout", t: "New VPN client rollout begins next week", d: "08 Aug 2026", s: "Check whether your laptop is on the first wave, and what to back up first." },
        { k: "Service desk", t: "Service desk hours extended to 20:00 IST", d: "04 Aug 2026", s: "Walk-in support at the Block B desk now runs through the evening shift." },
        { k: "Policy", t: "Asset refresh cycle moves from 4 years to 3", d: "29 Jul 2026", s: "Laptops and desktops now come up for replacement a year earlier than before." },
        { k: "Training", t: "Security awareness module due by 30 September", d: "22 Jul 2026", s: "Twenty minutes on the learning portal, with a reminder two weeks before." }
      ];
      // 4c2's Announcement card shows 3 compact rows (mon/day tile, title,
      // one-line subtitle) instead of one large featured item with a lot of
      // empty space below it — the featured item plus the first two of the
      // rest, normalized to the same {mon,day,t,sub} shape.
      const annTop3 = [Object.assign({ t: annFeaturedRaw.t, sub: annFeaturedRaw.b }, dateTile(annFeaturedRaw.d))]
        .concat(withDateTiles(annsRestRaw.slice(0, 2)).map(x => ({ mon: x.mon, day: x.day, t: x.t, sub: x.s })))
        // sep draws a rule *between* rows in 4c2's Announcement card — the first
        // row skips it, since the card header already carries its own divider.
        .map((x, i) => Object.assign({ sep: i > 0 }, x));

      return {
        ink, brand, brandLite, accent,
        onInk: porcelain ? "#0b2545" : "#ffffff",
        inkSub: porcelain ? "#5a6b81" : "#a9c8e8",
        inkAccent: porcelain ? brand : "#7fb2e4",
        inkGlow: porcelain ? "#d5dfec" : (hc ? "#123a6d" : brand),
        inkDot: porcelain ? "rgba(11,37,69,.10)" : "rgba(255,255,255,.10)",
        inkLine: porcelain ? "rgba(11,37,69,.14)" : "rgba(255,255,255,.16)",
        inkTile: porcelain ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.06)",
        inkTileBorder: porcelain ? "rgba(11,37,69,.10)" : "rgba(255,255,255,.13)",
        bandBtnBg: porcelain ? inkBase : "#ffffff",
        bandBtnFg: porcelain ? "#ffffff" : inkBase,
        groundBg: porcelain ? "#f6f8fb" : (hc ? "#e4eaf3" : "#eff4fa"),
        groundDot: porcelain ? "#dde5ef" : "#c8d8ec",
        ringLine: porcelain ? "#e2e9f2" : "#d3e0ee",
        brandSoft: brand + "12",
        accentSoft: accent + "2e",
        cardBg, cardBorder, cardShadow,
  
        railIcons: ["space_dashboard","confirmation_number","shopping_cart","dns","lightbulb","groups","apartment","checklist"].map(n => ({ n })),
        topIcons: ["format_size","forum","notifications","keyboard","home","info"].map(n => ({ n })),
  
        qa3: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb" }
        ],
  
        qaSmall: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#e7f0fb", fg: "#1856b3", sp: "span 1" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#eae7fb", fg: "#4c37b0", sp: "span 1" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08", sp: "span 1" },
          { t: "Track a request", s: "By ID or subject", i: "manage_search", bg: "#d9f2ee", fg: "#0f766e", sp: "span 1" },
          { t: "Book a room", s: "Facilities", i: "meeting_room", bg: "#f0f4f9", fg: "#5a6b81", sp: "span 2" }
        ],
  
        services: [
          { n: "Employee Off-boarding", c: "HR", i: "badge" },
          { n: "Microsoft Office 2019", c: "Software", i: "apps" },
          { n: "Payroll Setup", c: "Finance", i: "payments" },
          { n: "Flight Booking", c: "Travel", i: "flight" },
          { n: "VPN Access Request", c: "Network", i: "vpn_lock" }
        ],
  
        requests: [
          { id: "SR-201", t: "Request for New Laptop", d: "Aug 12, 10:09 AM", who: "Rosy P.", ai: "RP", ab: "#2f5fe0", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08", i: "shopping_cart" },
          { id: "INC-187", t: "Cannot Create KB Article", d: "Aug 10, 11:43 AM", who: "Keya S.", ai: "KS", ab: "#7c3aed", st: "In Progress", si: "sync", bg: "#e2ecfb", fg: "#1a56a8", i: "confirmation_number" },
          { id: "SR-180", t: "Employee On-boarding", d: "Aug 05, 03:22 PM", who: "Unassigned", ai: "—", ab: "#94a3b8", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08", i: "badge" },
          { id: "INC-178", t: "Password Reset Required", d: "Aug 05, 12:03 PM", who: "Rosy P.", ai: "RP", ab: "#2f5fe0", st: "Pending", si: "schedule", bg: "#eae7fb", fg: "#4c37b0", i: "key" }
        ],
  
        assetsCis: [
          { n: "Dell Latitude 5440", tag: "AST-3", k: "Laptop", i: "laptop_mac", fg: "#1a4f96" },
          { n: "Dell UltraSharp U2723QE", tag: "AST-1", k: "Monitor", i: "desktop_windows", fg: "#1a4f96" },
          { n: "Jabra Evolve2 65", tag: "AST-12", k: "Headset", i: "headphones", fg: "#4c37b0" },
          { n: "DESKTOP-5JPPI6F", tag: "CI-8", k: "Base CI", i: "dns", fg: "#0c6259" },
          { n: "Payroll App", tag: "CI-7", k: "Application", i: "apps", fg: "#0c6259" },
          { n: "AHM-SW-CORE-01", tag: "CI-4", k: "Network", i: "router", fg: "#0c6259" }
        ],
  
        assets: [
          { n: "Dell Latitude 5440", tag: "AST-3", k: "Laptop", i: "laptop_mac" },
          { n: "Dell UltraSharp U2723QE", tag: "AST-1", k: "Monitor", i: "desktop_windows" },
          { n: "Logitech MX Master 3S", tag: "AST-7", k: "Mouse", i: "mouse" },
          { n: "Jabra Evolve2 65", tag: "AST-12", k: "Headset", i: "headphones" }
        ],
  
        approvals: [
          { id: "INC-192", s: "Wrong configuration details · editorial review", d: "11 Aug, 02:14 PM", who: "Rosy", ai: "RO", ab: "#2f5fe0" },
          { id: "AST-13", s: "DESKTOP-5JPPI6F · asset assignment", d: "10 Aug, 12:57 PM", who: "Keya", ai: "KE", ab: "#7c3aed" }
        ],
  
        anns: withDateTiles([
          { k: "Maintenance", t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", d: "11 Aug 2026", s: "VPN, the intranet and payroll submission are unavailable for the full window." },
          { k: "Rollout", t: "New VPN client rollout begins next week", d: "08 Aug 2026", s: "Check whether your laptop is on the first wave, and what to back up first." },
          { k: "Service desk", t: "Service desk hours extended to 20:00 IST", d: "04 Aug 2026", s: "Walk-in support at the Block B desk now runs through the evening shift." }
        ]),
  
        kbs: [
          { id: "KB-4", r: "01", t: "How to Reset Your Password", m: "Guideline Documents · 2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", r: "02", t: "Connecting to Company VPN", m: "FAQs · 1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", r: "03", t: "Reporting a Hardware Fault", m: "Guideline Documents · 1.1k reads", d: "11 Aug, 04:38 PM", cat: "Guideline" }
        ],
  
        stats2b: [
          { l: "Open requests", v: "8", sub: "1 needs your info", i: "inbox", ic: "#1f6fd0", pct: "62%" },
          { l: "Awaiting approval", v: "2", sub: "Oldest 3 days", i: "how_to_reg", ic: "#b45309", pct: "34%" },
          { l: "Assets & CIs", v: "9", sub: "2 due for refresh", i: "inventory_2", ic: "#0f766e", pct: "78%" },
          { l: "Announcements", v: "5", sub: "1 posted today", i: "campaign", ic: "#4c37b0", pct: "44%" }
        ],
  
        squareActions: [
          { t: "New Incident", s: "Report an incident", i: "report", bg: "#e7f0fb", fg: "#1856b3" },
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#d9f2ee", fg: "#0f766e" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" }
        ],
  
        assetChips: [
          { n: "MacBook Pro 14", tag: "AST-3" },
          { n: "Dell U2723QE", tag: "AST-6" },
          { n: "iPhone 14", tag: "AST-9" },
          { n: "hostname", tag: "CI-8" },
          { n: "app-prod-01", tag: "CI-3" }
        ],
  
        kbTiles: [
          { id: "KB-4", t: "How to Reset Your Password", cat: "Guideline", i: "key", bg: "#eef3fa", fg: "#1a4f96", d: "30 Jul, 11:34 AM" },
          { id: "KB-1", t: "Connecting to Company VPN", cat: "FAQs", i: "vpn_lock", bg: "#eae7fb", fg: "#4c37b0", d: "19 Jul, 10:58 PM" },
          { id: "KB-6", t: "Reporting a Hardware Fault", cat: "Guideline", i: "build", bg: "#e4f4f0", fg: "#0c6259", d: "11 Aug, 04:38 PM" },
          { id: "KB-11", t: "Requesting Software for a New Starter", cat: "How-to", i: "apps", bg: "#fdf1d6", fg: "#8a5a08", d: "05 Aug, 02:20 PM" }
        ],
  
        stats: [
          { l: "Open requests", v: "8", sub: "1 needs your info", i: "inbox", ic: "#6fa8e6", pct: "62%" },
          { l: "Awaiting approval", v: "2", sub: "Oldest 3 days", i: "how_to_reg", ic: "#f5b342", pct: "34%" },
          { l: "Breaching SLA", v: "1", sub: "INC-187, 4h left", i: "timer", ic: "#f87171", pct: "18%" },
          { l: "Assets & CIs", v: "9", sub: "2 due for refresh", i: "inventory_2", ic: "#4ade80", pct: "78%" },
          { l: "Notices", v: "3", sub: "1 posted today", i: "campaign", ic: "#a5b4fc", pct: "44%" }
        ],
  
        pills: [
          { t: "New Incident", i: "report", bg: "#e7f0fb", fg: "#1856b3" },
          { t: "Request Service", i: "shopping_cart", bg: "#e7f0fb", fg: "#1856b3" },
          { t: "AD Self Service", i: "key", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "Knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" },
          { t: "Track a Request", i: "manage_search", bg: "#d9f2ee", fg: "#0f766e" },
          { t: "Contact the Desk", i: "support_agent", bg: "#f0f4f9", fg: "#5a6b81" }
        ],
  
        chipServices: [
          { n: "New Laptop Request", c: "Hardware" },
          { n: "Software Installation", c: "Software" },
          { n: "VPN Access", c: "Network" },
          { n: "New Employee Onboarding", c: "HR" },
          { n: "Payroll Setup", c: "Finance" },
          { n: "Microsoft Office 2019", c: "Software" }
        ],
  
        intents: [
          { t: "Report an incident", i: "report", bg: "#0b2545", fg: "#fff", bd: "#0b2545", ic: "#7fb2e4" },
          { t: "Reset my domain password", i: "key", bg: "#fff", fg: "#0b2545", bd: "#dbe4ef", ic: "#1856b3" },
          { t: "I need a new laptop", i: "laptop_mac", bg: "#fff", fg: "#0b2545", bd: "#dbe4ef", ic: "#1856b3" },
          { t: "Onboard a new employee", i: "event_available", bg: "#fff", fg: "#0b2545", bd: "#dbe4ef", ic: "#1856b3" },
          { t: "Access to Finance Drive", i: "badge", bg: "#fff", fg: "#0b2545", bd: "#dbe4ef", ic: "#1856b3" },
          { t: "Install software", i: "apps", bg: "#fff", fg: "#0b2545", bd: "#dbe4ef", ic: "#1856b3" }
        ],
  
        actions: [
          { t: "New Incident", s: "Report an incident", i: "report", bg: "#e7f0fb", fg: "#1856b3" },
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#d9f2ee", fg: "#0f766e" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" },
          { t: "Track a Request", s: "By ID or subject", i: "manage_search", bg: "#f0f4f9", fg: "#5a6b81" },
          { t: "Contact the Desk", s: "Call, chat or email", i: "support_agent", bg: "#fde8e8", fg: "#b02a2a" }
        ],
  
        kpis3j: [
          { v: "8", l: "My open requests", s: "2 updated today" },
          { v: "4", l: "Pending approvals", s: "waiting on you" }
        ],
  
        actions3j: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#d9f2ee", fg: "#0f766e" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" }
        ],
  
        railActions: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#d9f2ee", fg: "#0f766e" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" }
        ],
  
        deskChannels: [
          { l: "Phone", v: "+91 79 4890 1200", i: "call", a: "content_copy" },
          { l: "Email", v: "servicedesk@acme.com", i: "mail", a: "open_in_new" }
        ],
  
        actionsRest: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#d9f2ee", fg: "#0f766e" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" },
          { t: "Track a Request", s: "By ID or subject", i: "manage_search", bg: "#f0f4f9", fg: "#5a6b81" },
          { t: "Contact the Desk", s: "Call, chat or email", i: "support_agent", bg: "#fde8e8", fg: "#b02a2a" }
        ],
  
        actions4: [
          { t: "Request Service", i: "shopping_cart", fg: "#4c37b0" },
          { t: "AD Self Service", i: "key", fg: "#0c6259" },
          { t: "Knowledge", i: "lightbulb", fg: "#8a5a08" },
          { t: "Track a Request", i: "manage_search", fg: "#4a5a70" }
        ],
  
        actions2: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart", ac: "#4c37b0" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key", ac: "#0f766e" }
        ],
  
        glass3c: [
          { t: "Request Service", i: "shopping_cart" },
          { t: "AD Self Service", i: "key" },
          { t: "Knowledge", i: "lightbulb" }
        ],
  
        glassActions: [
          { t: "Request Service", i: "shopping_cart" },
          { t: "AD Self Service", i: "key" },
          { t: "Knowledge", i: "lightbulb" },
          { t: "Track a Request", i: "manage_search" }
        ],
  
        accentInk: porcelain ? "#8a5a08" : "#8a5a08",
  
        topics: [
          { n: "Computers & Accessories", i: "laptop_mac", bg: "#eef3fa", fg: "#1a4f96" },
          { n: "Software & Licences", i: "apps", bg: "#eae7fb", fg: "#4c37b0" },
          { n: "Network & VPN", i: "vpn_lock", bg: "#e4f4f0", fg: "#0c6259" },
          { n: "Accounts & Access", i: "key", bg: "#fdf1d6", fg: "#8a5a08" },
          { n: "Infrastructure", i: "dns", bg: "#eef3fa", fg: "#1a4f96" },
          { n: "Professional Services", i: "engineering", bg: "#fdeaea", fg: "#a52222" }
        ],
  
        topics5: [
          { n: "Computers & Accessories", i: "laptop_mac", bg: "#eef3fa", fg: "#1a4f96" },
          { n: "Software & Licences", i: "apps", bg: "#eae7fb", fg: "#4c37b0" },
          { n: "Network & VPN", i: "vpn_lock", bg: "#e4f4f0", fg: "#0c6259" },
          { n: "Accounts & Access", i: "key", bg: "#fdf1d6", fg: "#8a5a08" },
          { n: "Infrastructure", i: "dns", bg: "#eef3fa", fg: "#1a4f96" }
        ],
  
        catalog4: [
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Adobe Creative Cloud", m: "Software · manager approval", i: "apps", h: "favorite", hf: "#a52222" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Setting up external monitors", m: "Updated 2 days ago", i: "desktop_windows", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Request a work phone", m: "Hardware · 3 day SLA", i: "smartphone", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Request an external drive", m: "Hardware · same day", i: "storage", h: "favorite_border", hf: "#7b8a9d" }
        ],
  
        catalog18: [
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Adobe Creative Cloud", m: "Software · manager approval", i: "apps", h: "favorite", hf: "#a52222" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Setting up external monitors", m: "Updated 2 days ago", i: "desktop_windows", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Request a work phone", m: "Hardware · 3 day SLA", i: "smartphone", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Request an external drive", m: "Hardware · same day", i: "storage", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Onboarding a new starter's laptop", m: "Updated 5 days ago", i: "laptop_mac", h: "favorite", hf: "#a52222" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Remote access & VPN policy", m: "Updated 1 week ago", i: "vpn_lock", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Shared mailbox access", m: "Access · manager approval", i: "mail", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Form", ki: "assignment", kf: "#0c6259", t: "Report a phishing email", m: "Security · immediate", i: "shield", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Resetting multi-factor authentication", m: "Updated 3 days ago", i: "key", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "New laptop or desktop", m: "Hardware · asset check first", i: "laptop_mac", h: "favorite", hf: "#a52222" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Docking station & cables", m: "Hardware · same day", i: "cable", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Connecting to the guest wi-fi", m: "Updated 4 days ago", i: "wifi", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Form", ki: "assignment", kf: "#0c6259", t: "Request firewall rule change", m: "Network · security review", i: "security", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Software licence renewal", m: "Software · 5 day SLA", i: "verified", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Backing up before a laptop swap", m: "Updated 6 days ago", i: "backup", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Conference room AV setup", m: "Facilities · 2 day SLA", i: "cast", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Printing from a personal device", m: "Updated 1 week ago", i: "print", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Form", ki: "assignment", kf: "#0c6259", t: "Report a lost or stolen device", m: "Security · immediate", i: "phonelink_erase", h: "favorite_border", hf: "#7b8a9d" }
        ],
  
        catalog: [
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Adobe Creative Cloud", m: "Software · manager approval", i: "apps", h: "favorite", hf: "#a52222" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Setting up external monitors", m: "Updated 2 days ago", i: "desktop_windows", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Request a work phone", m: "Hardware · 3 day SLA", i: "smartphone", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Request an external drive", m: "Hardware · same day", i: "storage", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Onboarding a new starter's laptop", m: "Updated 5 days ago", i: "laptop_mac", h: "favorite", hf: "#a52222" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Remote access & VPN policy", m: "Updated 1 week ago", i: "vpn_lock", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Request", ki: "shopping_cart", kf: "#4c37b0", t: "Shared mailbox access", m: "Access · manager approval", i: "mail", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Form", ki: "assignment", kf: "#0c6259", t: "Report a phishing email", m: "Security · immediate", i: "shield", h: "favorite_border", hf: "#7b8a9d" },
          { k: "Article", ki: "description", kf: "#1a4f96", t: "Resetting multi-factor authentication", m: "Updated 3 days ago", i: "key", h: "favorite_border", hf: "#7b8a9d" }
        ],
  
        countdown: [
          { v: "114", l: "Days" },
          { v: "13", l: "Hours" },
          { v: "04", l: "Mins" },
          { v: "22", l: "Secs" }
        ],
  
        quickLinks: [
          { t: "Software licence portal", i: "apps", fg: "#4c37b0" },
          { t: "Password self service", i: "key", fg: "#0c6259" },
          { t: "Asset & CI register", i: "inventory_2", fg: "#1a4f96" },
          { t: "Service status page", i: "monitor_heart", fg: "#a52222" },
          { t: "Loan equipment booking", i: "devices", fg: "#8a5a08" },
          { t: "IT policies & standards", i: "policy", fg: "#4a5a70" }
        ],
  
        deptCards12: [
          { t: "Report an Incident", i: "report" },
          { t: "Request a Service", i: "shopping_cart" },
          { t: "Passwords & Access", i: "key" },
          { t: "Hardware & Devices", i: "laptop_mac" },
          { t: "Software & Licences", i: "apps" },
          { t: "HR, Leave & Payroll", i: "badge" },
          { t: "Facilities & Workspace", i: "meeting_room" },
          { t: "Knowledge & Support", i: "lightbulb" },
          { t: "Network & Connectivity", i: "vpn_lock" },
          { t: "Finance & Expenses", i: "payments" },
          { t: "Travel & Bookings", i: "flight" },
          { t: "Security & Compliance", i: "shield" }
        ],
  
        tasks: [
          { t: "Confirm delivery address for new laptop", id: "SR-201", s: "Open" },
          { t: "Approve asset assignment DESKTOP-5JPPI6F", id: "AST-13", s: "Open" },
          { t: "Confirm access list for Finance Drive", id: "SR-166", s: "Due" }
        ],
  
        sites: [
          { n: "Payroll", i: "payments", fg: "#1a4f96" },
          { n: "Security", i: "health_and_safety", fg: "#0c6259" },
          { n: "Expenses", i: "receipt_long", fg: "#4c37b0" },
          { n: "Knowledge", i: "school", fg: "#8a5a08" },
          { n: "Service Status", i: "workspace_premium", fg: "#a52222" },
          { n: "Intranet", i: "public", fg: "#1a4f96" }
        ],
  
        popArticles6: [
          { id: "KB-4", t: "How to Reset Your Password", m: "Guideline Documents · 2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", t: "Connecting to Company VPN", m: "FAQs · 1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", t: "Reporting a Hardware Fault", m: "Guideline Documents · 1.1k reads", d: "11 Aug, 04:38 PM", cat: "Guideline" },
          { id: "KB-11", t: "Requesting Software for a New Starter", m: "How-to · 940 reads", d: "05 Aug, 02:20 PM", cat: "How-to" },
          { id: "KB-3", t: "Setting Up Multi-Factor Authentication", m: "Guideline Documents · 870 reads", d: "28 Jul, 09:45 AM", cat: "Guideline" },
          { id: "KB-7", t: "Booking a Meeting Room from Outlook", m: "FAQs · 640 reads", d: "22 Jul, 03:08 PM", cat: "FAQs" }
        ],
  
        requests6: [
          { id: "SR-201", t: "Request for New Laptop", d: "Aug 12, 10:09 AM", who: "Rosy P.", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08" },
          { id: "INC-187", t: "Cannot Create KB Article", d: "Aug 10, 11:43 AM", who: "Keya S.", st: "In Progress", si: "sync", bg: "#e2ecfb", fg: "#1a56a8" },
          { id: "SR-180", t: "Employee On-boarding", d: "Aug 05, 03:22 PM", who: "HR team", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08" },
          { id: "INC-176", t: "Password Reset for Shared Mailbox", d: "Aug 04, 09:15 AM", who: "Service desk", st: "Resolved", si: "check_circle", bg: "#e4f4f0", fg: "#0c6259" },
          { id: "SR-171", t: "Monitor Replacement", d: "Aug 01, 02:40 PM", who: "Hardware", st: "In Progress", si: "sync", bg: "#e2ecfb", fg: "#1a56a8" },
          { id: "SR-166", t: "Access to Payroll App", d: "Jul 28, 11:02 AM", who: "Finance", st: "Resolved", si: "check_circle", bg: "#e4f4f0", fg: "#0c6259" }
        ],
  
        requests8: [
          { id: "SR-201", t: "Request for New Laptop", d: "Aug 12, 10:09 AM", who: "Rosy P.", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08" },
          { id: "INC-187", t: "Cannot Create KB Article", d: "Aug 10, 11:43 AM", who: "Keya S.", st: "In Progress", si: "sync", bg: "#e2ecfb", fg: "#1a56a8" },
          { id: "SR-180", t: "Employee On-boarding", d: "Aug 05, 03:22 PM", who: "Unassigned", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08" },
          { id: "INC-178", t: "Password Reset Required", d: "Aug 05, 12:03 PM", who: "Rosy P.", st: "Pending", si: "schedule", bg: "#eae7fb", fg: "#4c37b0" },
          { id: "INC-170", t: "Laptop Slow and Lagging", d: "Aug 04, 03:51 PM", who: "Amit V.", st: "In Progress", si: "sync", bg: "#e2ecfb", fg: "#1a56a8" },
          { id: "SR-166", t: "Access to Finance Drive", d: "Aug 03, 09:14 AM", who: "Keya S.", st: "On Hold", si: "schedule", bg: "#eae7fb", fg: "#4c37b0" },
          { id: "INC-159", t: "VPN Disconnects Frequently", d: "Jul 31, 04:02 PM", who: "Unassigned", st: "Open", si: "radio_button_unchecked", bg: "#fdf1d6", fg: "#8a5a08" },
          { id: "INC-151", t: "Monitor Flickering", d: "Jul 30, 11:20 AM", who: "Keya S.", st: "Resolved", si: "sync", bg: "#e2ecfb", fg: "#1a56a8" }
        ],
  
        approvals3: [
          { id: "INC-192", s: "Wrong configuration details · editorial review", d: "11 Aug, 02:14 PM", who: "Rosy", ai: "RO", ab: "#2f5fe0" },
          { id: "AST-13", s: "DESKTOP-5JPPI6F · asset assignment", d: "10 Aug, 12:57 PM", who: "Keya", ai: "KE", ab: "#7c3aed" },
          { id: "SR-158", s: "Adobe Creative Cloud licence · budget approval", d: "08 Aug, 04:30 PM", who: "Amit V.", ai: "AV", ab: "#0c6259" }
        ],
  
        approvals4: [
          { id: "INC-192", s: "Wrong configuration details · editorial review", d: "11 Aug, 02:14 PM", who: "Rosy", ai: "RO", ab: "#2f5fe0" },
          { id: "AST-13", s: "DESKTOP-5JPPI6F · asset assignment", d: "10 Aug, 12:57 PM", who: "Keya", ai: "KE", ab: "#7c3aed" },
          { id: "SR-158", s: "Adobe Creative Cloud licence · budget approval", d: "08 Aug, 04:30 PM", who: "Amit V.", ai: "AV", ab: "#0c6259" },
          { id: "SR-204", s: "Zoom Pro seat · licence renewal", d: "07 Aug, 11:20 AM", who: "Neha", ai: "NE", ab: "#b45309" }
        ],
  
        popularTerms: [
          { t: "reset password" },
          { t: "VPN setup" },
          { t: "new laptop" },
          { t: "expense claim" }
        ],
  
        quietLinks: [
          { t: "AD Self Service", i: "key", fg: "#0c6259" },
          { t: "Knowledge", i: "lightbulb", fg: "#8a5a08" }
        ],
  
        categories: [
          { n: "Hardware", d: "Laptops, monitors, phones and peripherals", k: "34 services", i: "laptop_mac", bg: "#eef3fa", fg: "#1a4f96" },
          { n: "Software & Access", d: "Licences, applications and permissions", k: "48 services", i: "apps", bg: "#eae7fb", fg: "#4c37b0" },
          { n: "Network", d: "VPN, wi-fi, remote access and connectivity", k: "19 services", i: "vpn_lock", bg: "#e4f4f0", fg: "#0c6259" },
          { n: "HR & People", d: "Onboarding, leave, payroll and training", k: "41 services", i: "badge", bg: "#fdf1d6", fg: "#8a5a08" },
          { n: "Finance", d: "Expenses, reimbursement and purchasing", k: "22 services", i: "payments", bg: "#eef3fa", fg: "#1a4f96" },
          { n: "Facilities", d: "Desks, meeting rooms and building access", k: "26 services", i: "meeting_room", bg: "#fdeaea", fg: "#a52222" },
          { n: "Travel", d: "Flights, hotels and travel approvals", k: "12 services", i: "flight", bg: "#e4f4f0", fg: "#0c6259" },
          { n: "Security", d: "Incidents, phishing reports and compliance", k: "12 services", i: "shield", bg: "#eae7fb", fg: "#4c37b0" }
        ],
  
        actionsPlain4: [
          { t: "Report an Incident", s: "Something is broken", i: "report" },
          { t: "Request a Service", s: "Browse the catalog", i: "shopping_cart" },
          { t: "AD Self Service", s: "Reset your password", i: "key" },
          { t: "Knowledge Base", s: "412 articles", i: "lightbulb" }
        ],
  
        heroActions: [
          { t: "Report an Issue", s: "Something is broken", i: "report", bg: "#fdeaea", fg: "#a52222" },
          { t: "Request a Service", s: "Browse the catalog", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { t: "Change Password", s: "AD self service", i: "key", bg: "#e4f4f0", fg: "#0c6259" }
        ],
  
        workFeed: [
          {
            when: "Today", count: "3 items",
            items: [
              { t: "Wrong configuration details", m: "INC-192 · peer review requested by Rosy", i: "how_to_reg", st: "Approve", bg: "#fdf1d6", fg: "#8a5a08" },
              { t: "DESKTOP-5JPPI6F", m: "AST-13 · asset assignment raised by Keya", i: "how_to_reg", st: "Approve", bg: "#fdf1d6", fg: "#8a5a08" },
              { t: "Cannot Create KB Article", m: "INC-187 · Rosy P. asked one follow-up question", i: "sync", bg: "#e2ecfb", fg: "#1a56a8", st: "In progress" }
            ]
          },
          {
            when: "This week", count: "4 items",
            items: [
              { t: "Request for New Laptop", m: "SR-201 · awaiting parts · due 19 Aug", i: "shopping_cart", bg: "#fdf1d6", fg: "#8a5a08", st: "Open" },
              { t: "Employee On-boarding", m: "SR-180 · with HR for approval", i: "badge", bg: "#e2ecfb", fg: "#1a56a8", st: "In progress" },
              { t: "Password reset for shared mailbox", m: "INC-176 · resolved, closes automatically Friday", i: "key", bg: "#e4f4f0", fg: "#0c6259", st: "Resolved" },
              { t: "Monitor replacement", m: "SR-171 · collection booked for Thursday", i: "desktop_windows", bg: "#e2ecfb", fg: "#1a56a8", st: "In progress" }
            ]
          },
          {
            when: "Earlier", count: "3 items",
            items: [
              { t: "Access to Payroll app", m: "SR-142 · granted 28 Jul", i: "payments", bg: "#e4f4f0", fg: "#0c6259", st: "Closed" },
              { t: "VPN keeps disconnecting", m: "INC-138 · closed 24 Jul", i: "vpn_lock", bg: "#e4f4f0", fg: "#0c6259", st: "Closed" },
              { t: "Training enrolment", m: "SR-129 · completed 18 Jul", i: "school", bg: "#e4f4f0", fg: "#0c6259", st: "Closed" }
            ]
          }
        ],
  
        railTiles3: [
          { t: "New Incident", i: "error" },
          { t: "Request Service", i: "grid_view" },
          { t: "AD Self Service", i: "key" }
        ],
  
        reqRows3: [
          { id: "SR-201", t: "Request for New Laptop", d: "Aug 12 · 10:09 AM", st: "Open", dot: "#e08a1e" },
          { id: "INC-187", t: "Cannot Create KB Article", d: "Aug 10 · 11:43 AM", st: "In Progress", dot: "#2f6fbf" },
          { id: "SR-180", t: "Employee On-boarding", d: "Aug 05 · 03:22 PM", st: "Open", dot: "#e08a1e" }
        ],
  
        apprRows2: [
          { ini: "RO", bg: "#2f6fbf", t: "Wrong configuration details", s: "Peer review requested · Rosy", tag: "INC-192" },
          { ini: "KE", bg: "#7b3f9d", t: "DESKTOP-5JPPI6F", s: "Approval required for AST-13 · Keya", tag: "AST-13" }
        ],
  
        annRows2: withDateTiles([
          { t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", s: "VPN, the intranet and payroll submission are unavailable for the full window.", d: "11 Aug 2026" },
          { t: "New VPN client rollout begins next week", s: "Check whether your laptop is on the first wave, and what to back up first.", d: "08 Aug 2026" }
        ]),
  
        chips4: [
          { t: "New Laptop Request", i: "laptop_mac" },
          { t: "Software Installation", i: "download" },
          { t: "VPN Access", i: "wifi" },
          { t: "New Employee Onboarding", i: "person_add" }
        ],
  
        kbs9: [
          { id: "KB-4", r: "01", t: "How to Reset Your Password", m: "Guideline Documents · 2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", r: "02", t: "Connecting to Company VPN", m: "FAQs · 1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", r: "03", t: "Reporting a Hardware Fault", m: "Guideline Documents · 1.1k reads", d: "11 Aug, 04:38 PM", cat: "Guideline" },
          { id: "KB-11", r: "04", t: "Requesting Software for a New Starter", m: "How-to · 940 reads", d: "05 Aug, 02:20 PM", cat: "How-to" },
          { id: "KB-3", r: "05", t: "Setting Up Multi-Factor Authentication", m: "Guideline Documents · 870 reads", d: "28 Jul, 09:45 AM", cat: "Guideline" },
          { id: "KB-7", r: "06", t: "Booking a Meeting Room from Outlook", m: "FAQs · 640 reads", d: "22 Jul, 03:08 PM", cat: "FAQs" },
          { id: "KB-12", r: "07", t: "Claiming Expenses After the Policy Change", m: "How-to · 520 reads", d: "18 Jul, 10:15 AM", cat: "How-to" },
          { id: "KB-5", r: "08", t: "Installing the Corporate Print Driver", m: "Guideline Documents · 480 reads", d: "15 Jul, 04:52 PM", cat: "Guideline" },
          { id: "KB-8", r: "09", t: "Requesting Access to a Shared Drive", m: "FAQs · 410 reads", d: "12 Jul, 11:26 AM", cat: "FAQs" }
        ],
  
        heroTiles3: [
          { t: "Report an incident", s: "Something is broken", i: "report", bg: "#c2415f" },
          { t: "Request a service", s: "Browse the catalog", i: "shopping_cart", bg: "#2f6fbf" },
          { t: "View solutions", s: "412 articles", i: "lightbulb", bg: "#0f766e" }
        ],
  
        services4: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac" },
          { n: "Software Installation", c: "Software · auto-approved", i: "apps" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock" },
          { n: "Employee Onboarding", c: "HR · 4 min form", i: "badge" }
        ],
  
        assetsCis3: [
          { n: "Dell Latitude 5440", tag: "AST-3", k: "Laptop", i: "laptop_mac" },
          { n: "Dell UltraSharp U2723QE", tag: "AST-1", k: "Monitor", i: "desktop_windows" },
          { n: "DESKTOP-5JPPI6F", tag: "CI-8", k: "Base CI", i: "dns" }
        ],
  
        faqAcc5: [
          { t: "How much notice does IT need to set up a new hire's laptop?", a: "Five working days for a standard build. Raise the onboarding request as soon as the start date is confirmed and Facilities will collect the machine from stock.", m: "Onboarding · 1.4k reads", open: true, icon: "expand_less", bg: "#f7f9fc" },
          { t: "How do I change my domain password?", a: "", m: "", open: false, icon: "expand_more", bg: "#ffffff" },
          { t: "What do I do when my VPN keeps disconnecting?", a: "", m: "", open: false, icon: "expand_more", bg: "#ffffff" },
          { t: "How do I claim an expense after the September policy change?", a: "", m: "", open: false, icon: "expand_more", bg: "#ffffff" },
          { t: "Who approves a software licence request?", a: "", m: "", open: false, icon: "expand_more", bg: "#ffffff" }
        ],
  
        faqs5: [
          { t: "How much notice does IT need to set up a new hire's laptop?", m: "Onboarding · 1.4k reads" },
          { t: "How do I change my domain password?", m: "Accounts · 3.1k reads" },
          { t: "What do I do when my VPN keeps disconnecting?", m: "Network · 890 reads" },
          { t: "How do I claim an expense after the September policy change?", m: "Finance · 640 reads" },
          { t: "Who approves a software licence request?", m: "Software · 520 reads" }
        ],
  
        portalActions3: [
          { t: "Incident Request", s: "Something broken or not working? Report an outage or a fault.", i: "report", bg: "#c2415f" },
          { t: "Service Request", s: "Need hardware, software or access to files? Open a service request.", i: "shopping_cart", bg: "#4c37b0" },
          { t: "Self-Help", s: "Search the knowledge base for answers to frequent questions.", i: "lightbulb", bg: "#2f6fbf" }
        ],
  
        portalKpis: [
          { v: "8", l: "Open requests", s: "2 updated today" },
          { v: "2", l: "Approvals", s: "waiting on you" },
          { v: "9", l: "Assets & CIs", s: "assigned to you" }
        ],
  
        svcTiles3: [
          { n: "Hardware", k: "34 services · laptops, monitors, phones", i: "laptop_mac", bg: "#ffffff", fg: "#1a4f96" },
          { n: "Software & Access", k: "48 services · licences and permissions", i: "apps", bg: "#f7f9fb", fg: "#4c37b0" },
          { n: "Network & VPN", k: "22 services · connectivity and remote access", i: "vpn_lock", bg: "#ffffff", fg: "#0c6259" }
        ],
  
        svcTiles9: [
          { n: "Hardware" }, { n: "Software & Access" }, { n: "Network & VPN" },
          { n: "HR & People" }, { n: "Finance" }, { n: "Facilities" },
          { n: "Travel" }, { n: "Security" }, { n: "Onboarding" }
        ],
  
        greetCounters: [
          { v: "8", l: "Open requests", i: "inbox" },
          { v: "2", l: "Approvals", i: "how_to_reg" },
          { v: "9", l: "My assets", i: "devices" }
        ],
  
        miniActions: [
          { t: "AD Self Service", i: "key", fg: "#0c6259" },
          { t: "Knowledge", i: "lightbulb", fg: "#8a5a08" },
          { t: "Track a Request", i: "manage_search", fg: "#4a5a70" }
        ],
  
        svcCards4: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac", bg: "#eef3fa", fg: "#1a4f96", h: "favorite", hc: "#b02a2a", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Software Installation", c: "Software · auto", i: "apps", bg: "#eae7fb", fg: "#4c37b0", h: "favorite", hc: "#b02a2a", bd: brand, btn: "View details", btnBg: brand, btnFg: "#ffffff" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock", bg: "#e4f4f0", fg: "#0c6259", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Payroll Setup", c: "Finance · 2 approvals", i: "payments", bg: "#fdf1d6", fg: "#8a5a08", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" }
        ],
  
        svcCards: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac", bg: "#eef3fa", fg: "#1a4f96", h: "favorite", hc: "#b02a2a", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Software Installation", c: "Software · auto", i: "apps", bg: "#eae7fb", fg: "#4c37b0", h: "favorite", hc: "#b02a2a", bd: brand, btn: "View details", btnBg: brand, btnFg: "#ffffff" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock", bg: "#e4f4f0", fg: "#0c6259", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Payroll Setup", c: "Finance · 2 approvals", i: "payments", bg: "#fdf1d6", fg: "#8a5a08", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Google Drive Access", c: "Software · manager", i: "cloud", bg: "#eef3fa", fg: "#1a4f96", h: "favorite", hc: "#b02a2a", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "New Employee Onboarding", c: "HR · 4 min form", i: "badge", bg: "#fdeaea", fg: "#a52222", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Meeting Room", c: "Facilities · instant", i: "meeting_room", bg: "#e4f4f0", fg: "#0c6259", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Book", btnBg: "#fbfcfe", btnFg: "#4a5a70" },
          { n: "Training Enrolment", c: "HR · auto", i: "school", bg: "#eae7fb", fg: "#4c37b0", h: "favorite_border", hc: "#7b8a9d", bd: "#e9eef5", btn: "Request", btnBg: "#fbfcfe", btnFg: "#4a5a70" }
        ],
  
        listRows: [
          { t: "Request for New Laptop", state: "Awaiting parts", pill: "Hardware", i: "shopping_cart", dot: "#8a5a08", pillBg: "#fdf1d6", pillFg: "#8a5a08", iconBg: "#eef3fa", iconFg: "#1a4f96", rowBg: "#ffffff", rowBd: brand, rowSh: "0 8px 20px rgba(11,37,69,.12)" },
          { t: "Cannot Create KB Article", state: "In progress", pill: "Software", i: "confirmation_number", dot: "#1a4f96", pillBg: "#eef3fa", pillFg: "#1a4f96", iconBg: "#f0f4f9", iconFg: "#4a5a70", rowBg: "#ffffff", rowBd: "#e9eef5", rowSh: "none" },
          { t: "Employee On-boarding", state: "Unassigned", pill: "HR", i: "badge", dot: "#8a5a08", pillBg: "#eae7fb", pillFg: "#4c37b0", iconBg: "#f0f4f9", iconFg: "#4a5a70", rowBg: "#ffffff", rowBd: "#e9eef5", rowSh: "none" },
          { t: "Password Reset Required", state: "Pending you", pill: "Access", i: "key", dot: "#4c37b0", pillBg: "#e4f4f0", pillFg: "#0c6259", iconBg: "#f0f4f9", iconFg: "#4a5a70", rowBg: "#ffffff", rowBd: "#e9eef5", rowSh: "none" },
          { t: "Monitor Flickering", state: "Resolved", pill: "Hardware", i: "desktop_windows", dot: "#0c6259", pillBg: "#fdf1d6", pillFg: "#8a5a08", iconBg: "#f0f4f9", iconFg: "#4a5a70", rowBg: "#ffffff", rowBd: "#e9eef5", rowSh: "none" },
          { t: "Access to Finance Drive", state: "Closed", pill: "Finance", i: "receipt_long", dot: "#7b8a9d", pillBg: "#f0f4f9", pillFg: "#4a5a70", iconBg: "#f0f4f9", iconFg: "#4a5a70", rowBg: "#ffffff", rowBd: "#e9eef5", rowSh: "none" }
        ],
  
        stages: [
          { n: "1", t: "Submitted", v: "Done", i: "check_circle", bg: "#f2faf7", bd: "#cfe9e1", fg: "#0c6259" },
          { n: "2", t: "Approved", v: "Done", i: "check_circle", bg: "#f2faf7", bd: "#cfe9e1", fg: "#0c6259" },
          { n: "3", t: "Fulfilment", v: "4 days left", i: "schedule", bg: "#fdfaf2", bd: "#f0e2c2", fg: "#8a5a08" }
        ],
  
        activity: [
          { i: "event_available", t: "Delivery window confirmed for 19 August, 10:00–13:00", d: "Added 14 Aug · 09:12", body: "" },
          { i: "attach_file", t: "Rosy P. attached asset-allocation-form.pdf", d: "Added 13 Aug · 16:40", body: "" },
          { i: "chat", t: "Rosy P. commented", d: "Added 12 Aug · 11:05", body: "Stock arrives Thursday. I've reserved a Latitude 5440 against this request — confirm the delivery address for the Ahmedabad office and I'll dispatch it the same day." },
          { i: "add_circle", t: "You raised this request from the service catalog", d: "Added 12 Aug · 10:09", body: "" }
        ],
  
        myItems: [
          { t: "2 requested items", d: "3 min ago", s: "In Progress", i: "shopping_cart", bg: "#eef3fa", fg: "#1a4f96", sb: "#fdf1d6", sf: "#8a5a08" },
          { t: "Sketch licence", d: "4 min ago", s: "In Progress", i: "brush", bg: "#eae7fb", fg: "#4c37b0", sb: "#fdf1d6", sf: "#8a5a08" },
          { t: "Flights to New York", d: "10 min ago", s: "Open", i: "flight", bg: "#e4f4f0", fg: "#0c6259", sb: "#e4f4f0", sf: "#0c6259" },
          { t: "Desk relocation", d: "15 min ago", s: "Open", i: "meeting_room", bg: "#fdeaea", fg: "#a52222", sb: "#e4f4f0", sf: "#0c6259" },
          { t: "Table lamp", d: "27 min ago", s: "Open", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08", sb: "#e4f4f0", sf: "#0c6259" },
          { t: "Access to Google Drive", d: "36 min ago", s: "Open", i: "cloud", bg: "#eef3fa", fg: "#1a4f96", sb: "#e4f4f0", sf: "#0c6259" }
        ],
  
        topArticles: [
          { id: "KB-4", t: "How to Reset Your Password", r: "4.8", m: "2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", t: "Connecting to Company VPN", r: "4.6", m: "1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", t: "Reporting a Hardware Fault", r: "4.5", m: "1.1k reads", d: "11 Aug, 04:38 PM", cat: "Guideline" },
          { id: "KB-3", t: "Setting Up Multi-Factor Authentication", r: "4.3", m: "870 reads", d: "28 Jul, 09:45 AM", cat: "Guideline" }
        ],
  
        annFeatured: Object.assign({}, annFeaturedRaw, dateTile(annFeaturedRaw.d)),
        annsRest: annsRestRaw,
        annTop3,

        anns5: withDateTiles([
          { k: "Maintenance", t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", d: "11 Aug 2026", s: "VPN, the intranet and payroll submission are unavailable for the full window." },
          { k: "Rollout", t: "New VPN client rollout begins next week", d: "08 Aug 2026", s: "Check whether your laptop is on the first wave, and what to back up first." },
          { k: "Service desk", t: "Service desk hours extended to 20:00 IST", d: "04 Aug 2026", s: "Walk-in support at the Block B desk now runs through the evening shift." },
          { k: "Policy", t: "Asset refresh cycle moves from 4 years to 3", d: "29 Jul 2026", s: "Laptops and desktops now come up for replacement a year earlier than before." },
          { k: "Training", t: "Security awareness module due by 30 September", d: "22 Jul 2026", s: "Twenty minutes on the learning portal, with a reminder two weeks before." }
        ]),
  
        kbs8: [
          { id: "KB-4", r: "01", t: "How to Reset Your Password", m: "Guideline Documents · 2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", r: "02", t: "Connecting to Company VPN", m: "FAQs · 1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", r: "03", t: "Reporting a Hardware Fault", m: "Guideline Documents · 1.1k reads", d: "11 Aug, 04:38 PM", cat: "Guideline" },
          { id: "KB-11", r: "04", t: "Requesting Software for a New Starter", m: "How-to · 940 reads", d: "05 Aug, 02:20 PM", cat: "How-to" },
          { id: "KB-3", r: "05", t: "Setting Up Multi-Factor Authentication", m: "Guideline Documents · 870 reads", d: "28 Jul, 09:45 AM", cat: "Guideline" },
          { id: "KB-7", r: "06", t: "Booking a Meeting Room from Outlook", m: "FAQs · 640 reads", d: "22 Jul, 03:08 PM", cat: "FAQs" },
          { id: "KB-12", r: "07", t: "Claiming Expenses After the Policy Change", m: "How-to · 520 reads", d: "18 Jul, 10:15 AM", cat: "How-to" },
          { id: "KB-2", r: "08", t: "Transferring an Asset to a Colleague", m: "Guideline Documents · 410 reads", d: "09 Jul, 01:40 PM", cat: "Guideline" }
        ],
  
        services6: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac" },
          { n: "Software Installation", c: "Software · auto-approved", i: "apps" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock" },
          { n: "Employee Onboarding", c: "HR · 4 min form", i: "badge" },
          { n: "Payroll Setup", c: "Finance · 2 approvals", i: "payments" },
          { n: "Flight Booking", c: "Travel · needs approval", i: "flight" }
        ],
  
        services12: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac" },
          { n: "Software Installation", c: "Software · auto-approved", i: "apps" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock" },
          { n: "New Employee Onboarding", c: "HR · 4 min form", i: "badge" },
          { n: "Payroll Setup", c: "Finance · 2 approvals", i: "payments" },
          { n: "Flight Booking", c: "Travel · manager approval", i: "flight" },
          { n: "Laptop Replacement", c: "IT · asset check first", i: "laptop_mac" },
          { n: "Expense Reimbursement", c: "Finance · 5 day SLA", i: "receipt_long" },
          { n: "Visitor Access Pass", c: "Facilities · same day", i: "meeting_room" },
          { n: "Shared Mailbox Access", c: "Software · manager approval", i: "mail" },
          { n: "Desk Phone Setup", c: "Network · 2 day SLA", i: "call" },
          { n: "Training Enrolment", c: "HR · auto-approved", i: "school" }
        ],
  
        kbs6: [
          { id: "KB-4", r: "01", t: "How to Reset Your Password", m: "Guideline Documents · 2.4k reads", d: "30 Jul, 11:34 AM", cat: "Guideline" },
          { id: "KB-1", r: "02", t: "Connecting to Company VPN", m: "FAQs · 1.9k reads", d: "19 Jul, 10:58 PM", cat: "FAQs" },
          { id: "KB-6", r: "03", t: "Reporting a Hardware Fault", m: "Guideline Documents · 1.1k reads", d: "11 Aug, 04:38 PM", cat: "Guideline" },
          { id: "KB-11", r: "04", t: "Requesting Software for a New Starter", m: "How-to · 940 reads", d: "05 Aug, 02:20 PM", cat: "How-to" },
          { id: "KB-3", r: "05", t: "Setting Up Multi-Factor Authentication", m: "Guideline Documents · 870 reads", d: "28 Jul, 09:45 AM", cat: "Guideline" },
          { id: "KB-7", r: "06", t: "Booking a Meeting Room from Outlook", m: "FAQs · 640 reads", d: "22 Jul, 03:08 PM", cat: "FAQs" }
        ],
  
        services9: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac" },
          { n: "Software Installation", c: "Software · auto-approved", i: "apps" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock" },
          { n: "New Employee Onboarding", c: "HR · 4 min form", i: "badge" },
          { n: "Payroll Setup", c: "Finance · 2 approvals", i: "payments" },
          { n: "Flight Booking", c: "Travel · manager approval", i: "flight" },
          { n: "Laptop Replacement", c: "IT · asset check first", i: "laptop_mac" },
          { n: "Expense Reimbursement", c: "Finance · 5 day SLA", i: "receipt_long" },
          { n: "Visitor Access Pass", c: "Facilities · same day", i: "meeting_room" }
        ],
  
        cis: [
          { n: "hostname", tag: "CI-8", k: "Base CI", i: "dns" },
          { n: "P1", tag: "CI-7", k: "Base CI", i: "dns" },
          { n: "localhost.localdomain", tag: "CI-5", k: "Linux Desktop", i: "computer" },
          { n: "app-prod-01", tag: "CI-3", k: "Server", i: "storage" }
        ],
  
        bannerActionsRest: [
          { t: "Request Service", s: "Browse the services offered", i: "shopping_cart" },
          { t: "AD Self Service", s: "Reset your domain password", i: "key" },
          { t: "Knowledge", s: "Browse knowledge", i: "lightbulb" }
        ],
  
        counterStatus: [
          { l: "Service status", v: "Degraded", i: "warning", bg: "#fdf1d6", fg: "#8a5a08" },
          { l: "Open in your team", v: "4 tickets", i: "confirmation_number", bg: "#eef3fa", fg: "#1a4f96" },
          { l: "Desk response", v: "~18 min", i: "bolt", bg: "#e4f4f0", fg: "#0c6259" }
        ],
  
        keypad: [
          { n: "2", t: "Request Service", s: "Browse the services offered", i: "shopping_cart", bg: "#eae7fb", fg: "#4c37b0" },
          { n: "3", t: "AD Self Service", s: "Reset your domain password", i: "key", bg: "#e4f4f0", fg: "#0c6259" },
          { n: "4", t: "Knowledge", s: "Browse knowledge", i: "lightbulb", bg: "#fdf1d6", fg: "#8a5a08" },
          { n: "5", t: "Track a Request", s: "By ID or subject", i: "manage_search", bg: "#eef3fa", fg: "#1a4f96" },
          { n: "6", t: "Call the Desk", s: "Ext. 4040", i: "support_agent", bg: "#fdeaea", fg: "#a52222" }
        ],
  
        bigCounters: [
          { v: "8", l: "My open tickets", s: "1 waiting on your reply" },
          { v: "2", l: "Approvals for you", s: "Oldest is 3 days old" },
          { v: "9", l: "Assets on your name", s: "2 due for refresh" }
        ],
  
        feed: [
          { k: "Approval", d: "Today, 11:20", t: "AST-13 · DESKTOP-5JPPI6F needs your sign-off", s: "Keya raised an asset assignment for the front-desk terminal. Approving hands it to Facilities.", i: "how_to_reg", bg: "#fdf1d6", fg: "#8a5a08", act: true },
          { k: "Update", d: "Today, 09:04", t: "INC-187 moved to In Progress", s: "Rosy P. picked up your ticket about creating KB articles and asked one follow-up question.", i: "sync", bg: "#eef3fa", fg: "#1a4f96", act: false },
          { k: "Notice", d: "Yesterday", t: "Planned network maintenance — Sat 16 Aug, 02:00–05:00", s: "Company wi-fi and the intranet will be unavailable. Payroll submissions should be completed before Friday.", i: "campaign", bg: "#f0f4f9", fg: "#4a5a70", act: false },
          { k: "Knowledge", d: "12 Aug", t: "New guide: claiming mileage after the September policy change", s: "Rates and the evidence you need to attach have both changed. Two-minute read.", i: "lightbulb", bg: "#e4f4f0", fg: "#0c6259", act: false }
        ],
  
        faqs: [
          { q: "How do I reset my domain password?" },
          { q: "My laptop won't connect to the office wi-fi" },
          { q: "Who approves a software licence request?" },
          { q: "How long does a new laptop request take?" }
        ],
  
        stats3: [
          { l: "Open requests", v: "8", sub: "1 needs info", i: "inbox" },
          { l: "Awaiting you", v: "2", sub: "oldest 3 days", i: "how_to_reg" },
          { l: "Devices assigned", v: "9", sub: "2 due refresh", i: "devices" }
        ],
  
        servicesLong: [
          { n: "New Laptop Request", c: "Hardware · 3 day SLA", i: "laptop_mac" },
          { n: "Software Installation", c: "Software · auto-approved", i: "apps" },
          { n: "VPN Access", c: "Network · same day", i: "vpn_lock" },
          { n: "New Employee Onboarding", c: "HR · 4 min form", i: "badge" },
          { n: "Payroll Setup", c: "Finance · 2 approvals", i: "payments" },
          { n: "Flight Booking", c: "Travel · manager approval", i: "flight" }
        ]
      };
    }
  }

  Component.PROPS = {
    palette: {
      label: 'palette',
      type: 'color',
      value: ['#0b2545', '#1856b3', '#3f8ee8', '#f5b342'],
      options: [
        ['#0b2545', '#1856b3', '#3f8ee8', '#f5b342'],
        ['#0d2b2a', '#0f766e', '#34a89c', '#f2a33c'],
        ['#1d1440', '#4c37b0', '#7c6ae0', '#f472b6']
      ]
    },
    mood: {
      label: 'mood',
      type: 'enum',
      value: 'Ink blocks',
      options: ['Ink blocks', 'Porcelain', 'High contrast']
    },
    cardStyle: {
      label: 'cardStyle',
      type: 'enum',
      value: 'Elevated',
      options: ['Elevated', 'Outlined', 'Flat tinted']
    }
  };

  global.Component = Component;
})(window);
