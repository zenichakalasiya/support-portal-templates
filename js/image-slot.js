/* ---------------------------------------------------------------------------
   image-slot.js — <image-slot> custom element.

   Several layouts hand a whole region over to a photograph: the Meridian
   banner, the Portico portrait column, the Vault panel. In Claude Design those
   regions are <image-slot> elements whose crop the designer nudged by hand,
   and that crop was saved alongside the design. js/slots.js carries it over.

   The crop is stored as { s, x, y }:
     s   zoom, relative to the baseline that makes the image fill the frame
     x   horizontal nudge, in percent of the frame width, from centre
     y   vertical nudge, in percent of the frame height, from centre

   Sizing is expressed entirely in percentages of the frame, so the crop that
   was chosen at design time survives any responsive resize — the image keeps
   the same framing whether the panel is 400px or 900px wide.

   A slot with no image renders the dashed placeholder with its authored
   caption, which is what the layouts that never got a photo should look like.
--------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var SLOTS = global.IMAGE_SLOTS || {};

  var CSS = [
    'image-slot{position:relative;display:block;width:100%;height:100%;overflow:hidden}',
    'image-slot[shape=rounded]{border-radius:var(--slot-radius,12px)}',
    'image-slot .slot-frame{position:absolute;inset:0;overflow:hidden}',
    'image-slot .slot-frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);',
    '  -webkit-user-drag:none;user-select:none}',
    'image-slot .slot-empty{position:absolute;inset:0;display:flex;align-items:center;',
    '  justify-content:center;padding:16px;text-align:center;background:rgba(11,37,69,.04);',
    '  border:1px dashed rgba(11,37,69,.22);border-radius:inherit;box-sizing:border-box}',
    'image-slot .slot-empty span{font-size:12px;line-height:1.5;color:#7b8a9d;max-width:34ch}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  function ImageSlot() {
    return Reflect.construct(HTMLElement, [], ImageSlot);
  }
  ImageSlot.prototype = Object.create(HTMLElement.prototype);
  ImageSlot.prototype.constructor = ImageSlot;
  Object.setPrototypeOf(ImageSlot, HTMLElement);

  ImageSlot.prototype.connectedCallback = function () {
    if (this._built) { this._apply(); return; }
    this._built = true;

    var radius = this.getAttribute('radius');
    if (radius) this.style.setProperty('--slot-radius', radius + 'px');

    var slot = SLOTS[this.id];
    if (!slot || !slot.src) { this._renderEmpty(); return; }

    this._view = { s: slot.s == null ? 1 : slot.s, x: slot.x || 0, y: slot.y || 0 };
    this._contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';

    var frame = document.createElement('div');
    frame.className = 'slot-frame';
    var img = document.createElement('img');
    img.alt = this.getAttribute('placeholder') || '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = slot.src;
    frame.appendChild(img);
    this.appendChild(frame);
    this._img = img;

    var self = this;
    if (img.complete && img.naturalWidth) this._apply();
    else img.addEventListener('load', function () { self._apply(); });
    img.addEventListener('error', function () {
      frame.remove();
      self._img = null;
      self._renderEmpty();
    });

    if (global.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self._apply(); });
      this._ro.observe(this);
    }
  };

  ImageSlot.prototype.disconnectedCallback = function () {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  };

  ImageSlot.prototype._renderEmpty = function () {
    var box = document.createElement('div');
    box.className = 'slot-empty';
    var label = document.createElement('span');
    label.textContent = this.getAttribute('placeholder') || 'Image';
    box.appendChild(label);
    this.appendChild(box);
  };

  // Reproduces the design tool's framing maths exactly: a baseline scale that
  // fills (or fits) the frame, multiplied by the saved zoom, with the centre
  // offset by the saved nudge.
  ImageSlot.prototype._apply = function () {
    var img = this._img;
    if (!img || !img.naturalWidth) return;
    var fw = this.clientWidth, fh = this.clientHeight;
    if (!fw || !fh) return;

    var iw = img.naturalWidth, ih = img.naturalHeight;
    var base = this._contain
      ? Math.min(fw / iw, fh / ih)
      : Math.max(fw / iw, fh / ih);
    var k = base * this._view.s;

    img.style.width = (iw * k / fw * 100) + '%';
    img.style.height = (ih * k / fh * 100) + '%';
    img.style.left = (50 + this._view.x) + '%';
    img.style.top = (50 + this._view.y) + '%';
  };

  if (!global.customElements.get('image-slot')) {
    global.customElements.define('image-slot', ImageSlot);
  }
})(window);
