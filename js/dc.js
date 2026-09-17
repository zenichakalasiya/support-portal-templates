/* ---------------------------------------------------------------------------
   dc.js — the template runtime.

   The layouts in /layouts are the markup exactly as it was authored in Claude
   Design, which means they still speak that dialect:

     {{ expr }}                     interpolation, in text and in attributes
     <sc-for list="{{ xs }}" as="x">   repeat children once per item
     <sc-if value="{{ flag }}">        render children when truthy
     onClick="{{ handler }}"        bind a function from the value bag
     ref="{{ callback }}"           callback ref, fired with the DOM node

   Rather than rewrite 670 KB of markup, we implement the dialect. It is about
   a hundred lines and it keeps /layouts diffable against the design file.

   Expressions are deliberately tiny: a dotted path, optionally negated or
   compared. No arbitrary JS is evaluated — `resolve` walks the value bag by
   hand. Everything a layout can reference comes out of Logic#renderVals().
--------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*/;
  var NUMBER = /^-?\d+(\.\d+)?$/;

  /* -- expression evaluation ---------------------------------------------- */

  function parensWrapWhole(expr) {
    var depth = 0;
    for (var i = 0; i < expr.length - 1; i++) {
      if (expr[i] === '(') depth++;
      else if (expr[i] === ')' && --depth === 0) return false;
    }
    return true;
  }

  function findTopLevelEquality(expr) {
    var depth = 0;
    for (var i = 0; i < expr.length; i++) {
      var c = expr[i];
      if (c === '[' || c === '(') depth++;
      else if (c === ']' || c === ')') depth--;
      else if (depth === 0 && (c === '=' || c === '!') && expr[i + 1] === '=') {
        if (i > 0 && (expr[i - 1] === '=' || expr[i - 1] === '!')) continue;
        if (!expr.slice(0, i).trim()) continue;
        return { index: i, op: expr[i + 2] === '=' ? c + '==' : c + '=' };
      }
    }
    return null;
  }

  function resolvePath(vals, expr) {
    var head = expr.match(IDENT);
    if (!head) return undefined;
    var cur = vals == null ? undefined : vals[head[0]];
    var i = head[0].length;
    while (i < expr.length) {
      if (expr[i] === '.') {
        var rest = expr.slice(i + 1);
        var m = rest.match(IDENT) || rest.match(/^\d+/);
        if (!m) return undefined;
        cur = cur == null ? undefined : cur[m[0]];
        i += 1 + m[0].length;
      } else if (expr[i] === '[') {
        var depth = 1, j = i + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === '[') depth++;
          else if (expr[j] === ']' && --depth === 0) break;
          j++;
        }
        if (depth !== 0) return undefined;
        cur = cur == null ? undefined : cur[resolve(vals, expr.slice(i + 1, j))];
        i = j + 1;
      } else {
        return undefined;
      }
    }
    return cur;
  }

  function resolve(vals, src) {
    var expr = String(src).trim();
    if (!expr) return undefined;
    if (expr[0] === '(' && expr[expr.length - 1] === ')' && parensWrapWhole(expr)) {
      return resolve(vals, expr.slice(1, -1));
    }
    var eq = findTopLevelEquality(expr);
    if (eq) {
      var lv = resolve(vals, expr.slice(0, eq.index));
      var rv = resolve(vals, expr.slice(eq.index + eq.op.length));
      /* eslint-disable eqeqeq */
      if (eq.op === '===') return lv === rv;
      if (eq.op === '!==') return lv !== rv;
      if (eq.op === '==') return lv == rv;
      return lv != rv;
      /* eslint-enable eqeqeq */
    }
    if (expr[0] === '!') return !resolve(vals, expr.slice(1));
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (expr === 'undefined') return undefined;
    if (NUMBER.test(expr)) return Number(expr);
    var q = expr[0];
    if (expr.length >= 2 && (q === '"' || q === "'") && expr[expr.length - 1] === q) {
      return expr.slice(1, -1);
    }
    return resolvePath(vals, expr);
  }

  // An attribute that is exactly one hole yields the raw value (so a function
  // stays a function); anything else is string interpolation.
  function compileAttr(raw) {
    var whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
    if (whole) {
      var path = whole[1];
      return function (vals) { return resolve(vals, path); };
    }
    if (raw.indexOf('{{') === -1) {
      return function () { return raw; };
    }
    var parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    return function (vals) {
      return parts.map(function (s, i) {
        if (!(i & 1)) return s;
        var v = resolve(vals, s);
        return v === undefined || v === null ? '' : v;
      }).join('');
    };
  }

  /* -- compilation: DOM template -> render function ------------------------ */

  var CONTROL_FLOW = { 'sc-for': 1, 'sc-if': 1 };

  function compileChildren(node) {
    var out = [];
    for (var i = 0; i < node.childNodes.length; i++) {
      var b = compileNode(node.childNodes[i]);
      if (b) out.push(b);
    }
    return out;
  }

  function emit(builders, vals, into) {
    for (var i = 0; i < builders.length; i++) builders[i](vals, into);
  }

  function compileNode(node) {
    if (node.nodeType === 3) return compileText(node);
    if (node.nodeType !== 1) return null;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') return compileFor(node);
    if (tag === 'sc-if') return compileIf(node);
    return compileElement(node);
  }

  function compileText(node) {
    var txt = node.nodeValue || '';
    if (txt.indexOf('{{') === -1) {
      // Drop pure indentation, keep meaningful whitespace between inline bits.
      if (!txt.trim() && txt.indexOf(' ') === -1) return null;
      return function (vals, into) { into.appendChild(document.createTextNode(txt)); };
    }
    var parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
    return function (vals, into) {
      for (var i = 0; i < parts.length; i++) {
        if (!(i & 1)) {
          if (parts[i]) into.appendChild(document.createTextNode(parts[i]));
          continue;
        }
        var v = resolve(vals, parts[i]);
        if (v === undefined || v === null || typeof v === 'boolean') continue;
        into.appendChild(document.createTextNode(String(v)));
      }
    };
  }

  function compileFor(el) {
    var listGet = compileAttr(el.getAttribute('list') || '');
    var asName = el.getAttribute('as') || 'item';
    var kids = compileChildren(el);
    return function (vals, into) {
      var list = listGet(vals);
      if (!Array.isArray(list)) return;
      for (var i = 0; i < list.length; i++) {
        var sub = Object.create(vals);
        sub[asName] = list[i];
        sub.$index = i;
        emit(kids, sub, into);
      }
    };
  }

  function compileIf(el) {
    var valGet = compileAttr(el.getAttribute('value') || '');
    var kids = compileChildren(el);
    return function (vals, into) {
      if (valGet(vals)) emit(kids, vals, into);
    };
  }

  // Editor-only hints from Claude Design; they carry no runtime meaning.
  var DROP_ATTR = { 'hint-placeholder-count': 1, 'hint-placeholder-val': 1, 'data-comment-anchor': 1 };

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function compileElement(el) {
    // The HTML parser that builds the template already resolves an <svg>
    // subtree into the real SVG namespace (with correctly-cased tag names
    // like `linearGradient`, `feGaussianBlur`) — `tagName`/`toLowerCase()`
    // would mangle that case, so for anything already SVG-namespaced use
    // `localName` verbatim and re-create it via `createElementNS`, or the
    // browser treats it as an unknown HTML element and renders nothing.
    var isSvg = el.namespaceURI === SVG_NS;
    var tag = isSvg ? el.localName : el.tagName.toLowerCase();
    var attrs = [];
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (DROP_ATTR[a.name]) continue;
      attrs.push([a.name, compileAttr(a.value)]);
    }
    var kids = compileChildren(el);
    var isVoid = /^(br|hr|img|input|source|track|wbr)$/.test(tag);
    return function (vals, into) {
      var node = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
      for (var i = 0; i < attrs.length; i++) {
        var name = attrs[i][0];
        var v = attrs[i][1](vals);
        if (name === 'onclick' || name === 'onClick') {
          if (typeof v === 'function') {
            node.addEventListener('click', v);
            node.setAttribute('role', 'button');
            node.setAttribute('tabindex', '0');
            node.addEventListener('keydown', activateOnKey(v));
          }
          continue;
        }
        if (name === 'ref') {
          if (typeof v === 'function') v(node);
          continue;
        }
        if (v === undefined || v === null || v === false) continue;
        node.setAttribute(name, v === true ? '' : String(v));
      }
      if (!isVoid) emit(kids, vals, node);
      into.appendChild(node);
    };
  }

  function activateOnKey(fn) {
    return function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
    };
  }

  /* -- public compile ------------------------------------------------------ */

  var cache = Object.create(null);

  // Parse an HTML fragment once, keep the compiled builder list.
  function compile(html, cacheKey) {
    if (cacheKey && cache[cacheKey]) return cache[cacheKey];
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var builders = compileChildren(tpl.content);
    var fn = function (vals, into) { emit(builders, vals, into); };
    if (cacheKey) cache[cacheKey] = fn;
    return fn;
  }

  function render(html, vals, into, cacheKey) {
    into.textContent = '';
    compile(html, cacheKey)(vals, into);
    return into;
  }

  /* -- Logic base ---------------------------------------------------------- */

  // Mirrors the DCLogic surface the design file was written against: state,
  // setState, props, renderVals, and the three lifecycle hooks.
  function Logic(props) {
    this.props = props || {};
    this.state = {};
  }
  Logic.prototype.setState = function (update, cb) {
    var patch = typeof update === 'function' ? update(this.state) : update;
    Object.assign(this.state, patch);
    if (this.__onChange) this.__onChange();
    if (cb) cb();
  };
  Logic.prototype.forceUpdate = function () { if (this.__onChange) this.__onChange(); };
  Logic.prototype.renderVals = function () { return {}; };
  Logic.prototype.componentDidMount = function () {};
  Logic.prototype.componentDidUpdate = function () {};
  Logic.prototype.componentWillUnmount = function () {};

  global.DC = {
    resolve: resolve,
    compileAttr: compileAttr,
    compile: compile,
    render: render,
    Logic: Logic
  };
  // The design file writes `class Component extends DCLogic`.
  global.DCLogic = Logic;
})(window);
