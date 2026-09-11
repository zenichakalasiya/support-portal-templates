/* ---------------------------------------------------------------------------
   app.js — mounts the gallery.

   Responsibilities, in order:
     1. instantiate the Component logic with the current props
     2. render the sticky shell (industry chips + layout tabs) and the active
        layout, re-rendering whenever state changes
     3. keep the URL hash in sync so a layout can be linked to directly
     4. drive the props panel (palette / mood / card style)
     5. mirror the active palette onto CSS custom properties, so the
        stylesheets can theme the chrome around the layouts

   Rendering is a full replace of the active layout rather than a diff. Only
   one layout is on screen at a time and each is a few hundred nodes, so the
   simple thing is comfortably fast and avoids a reconciler.
--------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var TEMPLATES = global.TEMPLATES;
  var PROPS = global.Component.PROPS;

  var shellEl, stageEl, panelEl;
  var logic;
  var frame = null;

  /* -- props --------------------------------------------------------------- */

  var props = {
    palette: PROPS.palette.value.slice(),
    mood: PROPS.mood.value,
    cardStyle: PROPS.cardStyle.value
  };

  /* -- URL <-> state ------------------------------------------------------- */

  // #/<group>/<layout>, e.g. #/edu/7a
  function readHash() {
    var m = /^#\/([a-z]+)(?:\/([0-9a-z]+))?$/.exec(global.location.hash || '');
    return m ? { group: m[1], tab: m[2] } : null;
  }

  function writeHash() {
    var next = '#/' + logic.state.group + '/' + logic.state.tab;
    if (global.location.hash === next) return;
    // A page opened straight off the disk has an opaque origin, and Chrome
    // refuses replaceState there. Falling back to the hash costs a history
    // entry per layout, which is a fair trade for the file:// case working.
    try {
      global.history.replaceState(null, '', next);
    } catch (e) {
      global.location.hash = next;
    }
  }

  // A hash can name a group that does not exist, or omit the layout entirely.
  // logic.renderVals() already falls back in that case; this copies the
  // fallback back into state so the URL and the keyboard agree with what is
  // actually on screen. Assigned directly, not via setState, because we are
  // mid-draw and this must not schedule another one.
  function reconcile(vals) {
    var groups = (vals.industries || []).map(function (g) { return g.key; });
    if (groups.length && groups.indexOf(logic.state.group) === -1) {
      logic.state.group = groups[0];
    }
    var tabs = (vals.tabs || []).map(function (t) { return t.id; });
    if (tabs.length && tabs.indexOf(logic.state.tab) === -1) {
      logic.state.tab = tabs[0];
    }
  }

  /* -- render -------------------------------------------------------------- */

  function schedule() {
    if (frame) return;
    frame = global.requestAnimationFrame(function () {
      frame = null;
      draw();
    });
  }

  function draw() {
    var vals = Object.assign({}, props, logic.renderVals());
    reconcile(vals);

    applyTheme(vals);
    DC.render(TEMPLATES._shell, vals, shellEl, '_shell');

    var id = activeLayoutId(vals);
    var html = TEMPLATES[id];
    if (html) {
      DC.render(html, vals, stageEl, id);
      stageEl.setAttribute('data-layout', id);
    } else {
      stageEl.textContent = '';
      stageEl.setAttribute('data-layout', '');
    }

    writeHash();
    document.title = titleFor(vals) + ' · Support Portal layout templates';
    logic.componentDidUpdate();
  }

  // renderVals() exposes one `is<id>` flag per layout. The 2a Prism family
  // shares a single template across three seeds (2a / 2ag / 2an), so the flag
  // for all three is `is2a` — fall back to the raw tab id for those.
  function activeLayoutId(vals) {
    var tab = logic.state.tab;
    if (TEMPLATES[tab]) return tab;
    for (var key in vals) {
      if (key.indexOf('is') === 0 && vals[key] === true) {
        var id = key.slice(2);
        if (TEMPLATES[id]) return id;
      }
    }
    return null;
  }

  function titleFor(vals) {
    var tabs = vals.tabs || [];
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === logic.state.tab) return tabs[i].id + ' ' + tabs[i].name;
    }
    return logic.state.tab;
  }

  /* -- theming ------------------------------------------------------------- */

  // The layouts style themselves inline from the value bag. These custom
  // properties exist so the chrome *around* them (panel, focus rings, the
  // scroll shadow on the tab strip) can follow the same palette.
  var THEME_VARS = [
    'ink', 'brand', 'brandLite', 'accent',
    'cardBg', 'cardBorder', 'groundBg', 'ringLine'
  ];

  function applyTheme(vals) {
    var root = document.documentElement;
    for (var i = 0; i < THEME_VARS.length; i++) {
      var name = THEME_VARS[i];
      if (typeof vals[name] === 'string') {
        root.style.setProperty('--' + kebab(name), vals[name]);
      }
    }
    root.setAttribute('data-mood', props.mood.toLowerCase().replace(/\s+/g, '-'));
    root.setAttribute('data-card-style', props.cardStyle.toLowerCase().replace(/\s+/g, '-'));
  }

  function kebab(s) {
    return s.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); });
  }

  /* -- props panel --------------------------------------------------------- */

  function buildPanel() {
    panelEl.textContent = '';

    panelEl.appendChild(swatchField(PROPS.palette, function (next) {
      props.palette = next.slice();
      rebuildLogic();
    }));

    ['mood', 'cardStyle'].forEach(function (key) {
      panelEl.appendChild(selectField(PROPS[key], props[key], function (next) {
        props[key] = next;
        rebuildLogic();
      }));
    });
  }

  function fieldShell(labelText) {
    var wrap = document.createElement('div');
    wrap.className = 'field';
    var label = document.createElement('span');
    label.className = 'field-label';
    label.textContent = labelText;
    wrap.appendChild(label);
    return wrap;
  }

  function swatchField(def, onPick) {
    var wrap = fieldShell(def.label);
    var row = document.createElement('div');
    row.className = 'swatches';

    def.options.forEach(function (option) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch';
      btn.title = option.join(', ');
      btn.setAttribute('aria-label', 'Palette ' + option.join(', '));
      option.forEach(function (color) {
        var chip = document.createElement('i');
        chip.style.background = color;
        btn.appendChild(chip);
      });
      btn.addEventListener('click', function () {
        onPick(option);
        row.querySelectorAll('.swatch').forEach(function (el) {
          el.setAttribute('aria-pressed', String(el === btn));
        });
      });
      btn.setAttribute('aria-pressed', String(option[0] === props.palette[0]));
      row.appendChild(btn);
    });

    wrap.appendChild(row);
    return wrap;
  }

  function selectField(def, current, onPick) {
    var wrap = fieldShell(def.label);
    var select = document.createElement('select');
    select.className = 'select';
    def.options.forEach(function (option) {
      var opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      if (option === current) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', function () { onPick(select.value); });
    wrap.appendChild(select);
    return wrap;
  }

  /* -- lifecycle ----------------------------------------------------------- */

  // Props are constructor arguments in the design's model, so a prop change
  // means a fresh Component — carrying the navigation state across so the
  // reader stays on the layout they were looking at.
  function rebuildLogic(seedState) {
    var carried = seedState || (logic ? Object.assign({}, logic.state) : null);
    if (logic) logic.componentWillUnmount();

    logic = new global.Component(Object.assign({}, props));
    logic.__onChange = schedule;
    if (carried) Object.assign(logic.state, carried);

    draw();
    logic.componentDidMount();
  }

  function start() {
    shellEl = document.getElementById('shell');
    stageEl = document.getElementById('stage');
    panelEl = document.getElementById('panel');

    buildPanel();

    // The URL has to be consumed before the first draw: drawing writes the
    // hash back, which would otherwise clobber the link that opened the page.
    var fromUrl = readHash();
    rebuildLogic(fromUrl ? { group: fromUrl.group, tab: fromUrl.tab } : null);

    global.addEventListener('hashchange', function () {
      var next = readHash();
      if (!next) return;
      if (next.group !== logic.state.group || next.tab !== logic.state.tab) {
        logic.setState({ group: next.group, tab: next.tab || logic.state.tab });
      }
    });

    // Left/right arrows step through the layouts of the current industry.
    global.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      var tabs = logic.renderVals().tabs || [];
      var at = tabs.findIndex(function (t) { return t.id === logic.state.tab; });
      if (at < 0) return;
      var to = at + (e.key === 'ArrowRight' ? 1 : -1);
      if (to < 0 || to >= tabs.length) return;
      e.preventDefault();
      logic.setState({ tab: tabs[to].id });
    });

    document.body.removeAttribute('data-booting');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
