// Hemie sprite actor — plays cut-out video sprites at random spots on the screensaver.
(function () {
  var SHEETS = {
    walk: { src: (window.__resources && window.__resources.walkSheet) || 'assets/hemie-walk.png', cw: 266, ch: 420, cols: 8, rows: 4, loop: [0, 23] },
    hello: { src: (window.__resources && window.__resources.helloSheet) || 'assets/hemie-hello.png', cw: 298, ch: 440, cols: 6, rows: 5, n: 27 }
  };
  var preload = {};
  Object.keys(SHEETS).forEach(function (k) { var i = new Image(); i.src = SHEETS[k].src; preload[k] = i; });

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function back(t) { t = clamp(t, 0, 1); var s = 1.6; t -= 1; return t * t * ((s + 1) * t + s) + 1; }

  function el(tag, css, parent) { var e = document.createElement(tag); e.style.cssText = css; if (parent) parent.appendChild(e); return e; }

  function Sprite(stage, sheetName, h) {
    var S = SHEETS[sheetName];
    this.S = S; this.h = h; this.w = Math.round(h * S.cw / S.ch);
    this.root = el('div', 'position:absolute;left:0;top:0;width:' + this.w + 'px;height:' + this.h + 'px;will-change:transform;pointer-events:none', stage);
    this.shadow = el('div', 'position:absolute;left:12%;right:12%;bottom:-4%;height:9%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 70%)', this.root);
    this.img = el('div', 'position:absolute;top:0;left:0;width:100%;height:100%;background-image:url(' + S.src + ');background-repeat:no-repeat;background-size:' + (this.w * S.cols) + 'px ' + (this.h * S.rows) + 'px;filter:drop-shadow(0 10px 18px rgba(0,0,0,.35))', this.root);
    this.frame(0);
  }
  Sprite.prototype.frame = function (i) {
    if (i === this._f) return; this._f = i;
    var S = this.S, c = i % S.cols, r = Math.floor(i / S.cols);
    this.img.style.backgroundPosition = (-c * this.w) + 'px ' + (-r * this.h) + 'px';
  };
  Sprite.prototype.place = function (x, y, sc, flip, rot, op) {
    // x,y = bottom-centre anchor
    var t = 'translate3d(' + (x - this.w / 2) + 'px,' + (y - this.h) + 'px,0) scale(' + (flip ? -sc : sc) + ',' + sc + ')' + (rot ? ' rotate(' + (flip ? -rot : rot) + 'deg)' : '');
    this.root.style.transformOrigin = '50% 100%';
    this.root.style.transform = t;
    this.root.style.opacity = op == null ? 1 : op;
  };
  Sprite.prototype.remove = function () { if (this.root.parentNode) this.root.parentNode.removeChild(this.root); };

  function bubble(stage, text) {
    var b = el('div', 'position:absolute;left:0;top:0;padding:12px 18px;border-radius:20px 20px 20px 6px;background:#f6f1ea;color:#1b1622;font:500 18px/1.3 Sora,-apple-system,sans-serif;max-width:300px;box-shadow:0 12px 30px rgba(0,0,0,.3);opacity:0;transition:opacity .3s;pointer-events:none', stage);
    b.textContent = text; return b;
  }

  function clipBox(c, h) {
    var r = c.strip.getBoundingClientRect(), sr = c.stage.getBoundingClientRect();
    var bottom = r.top - sr.top + (r.bottom - r.top) * 0.6;
    var box = el('div', 'position:absolute;left:0;right:0;top:' + (bottom - h - 40) + 'px;height:' + (h + 40) + 'px;overflow:hidden;pointer-events:none', c.stage);
    return { box: box, left: r.left - sr.left, right: r.right - sr.left, H: h + 40 };
  }
  // ---------------- acts ----------------
  // each act: setup(ctx) returns {dur, tick(t)} ; ctx = {W,H,stage,strip,fx}
  var ACTS = {
    stroll: function (c) {
      var dir = Math.random() < .5 ? 1 : -1, y = rnd(c.H * .42, c.H * .9), sc = 0.55 + (y / c.H) * 0.55;
      var sp = new Sprite(c.stage, 'walk', 300), x0 = dir > 0 ? -sp.w : c.W + sp.w, x1 = dir > 0 ? c.W + sp.w : -sp.w;
      var dur = Math.abs(x1 - x0) / (95 * sc);
      return { dur: dur, z: 3, tick: function (t) {
        sp.frame(Math.floor(t * 12) % 24); sp.place(x0 + (x1 - x0) * (t / dur), y + Math.abs(Math.sin(t * 12 * Math.PI / 4)) * -3, sc, dir < 0);
      }, end: function () { sp.remove(); } };
    },
    chase: function (c) {
      var dir = Math.random() < .5 ? 1 : -1, y = rnd(c.H * .5, c.H * .88), sc = 0.5 + (y / c.H) * 0.5;
      var sp = new Sprite(c.stage, 'walk', 300), orb = el('div', 'position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:#ffd08a;box-shadow:0 0 22px 8px rgba(255,179,92,.6)', c.stage);
      var x0 = dir > 0 ? -sp.w : c.W + sp.w, x1 = dir > 0 ? c.W + sp.w * 2 : -sp.w * 2, dur = 6;
      return { dur: dur, z: 3, tick: function (t) {
        var k = t / dur, ox = x0 + (x1 - x0) * Math.min(1, k * 1.15) + dir * 140;
        orb.style.transform = 'translate3d(' + ox + 'px,' + (y - 150 * sc - Math.abs(Math.sin(t * 3.4)) * 160 * sc) + 'px,0)';
        var hop = (t > 2.6 && t < 3.3) ? Math.sin((t - 2.6) / .7 * Math.PI) * 70 * sc : 0;
        sp.frame(Math.floor(t * 22) % 24); sp.place(x0 + (x1 - x0) * k, y - hop, sc, dir < 0, 6);
      }, end: function () { sp.remove(); orb.parentNode && orb.parentNode.removeChild(orb); } };
    },
    popup: function (c) {
      var h = Math.min(c.H * .42, 380), sp = new Sprite(c.stage, 'hello', h), x = rnd(c.W * .2, c.W * .8), b = bubble(c.stage, c.line), dur = 7;
      return { dur: dur, z: 3, tick: function (t) {
        var up = back(t / .7) * (1 - ease((t - 6.2) / .8));
        sp.frame(Math.min(26, Math.floor(Math.max(0, t - .5) * 12) % 27));
        sp.shadow.style.display = 'none';
        sp.place(x, c.H + h * (1 - up) + 10, 1, x > c.W / 2);
        b.style.opacity = (t > 1 && t < 6) ? 1 : 0;
        var bx = clamp(x + (x > c.W / 2 ? -sp.w * .1 - 300 : sp.w * .1), 12, c.W - 312);
        b.style.transform = 'translate3d(' + bx + 'px,' + (c.H - h * up - 30) + 'px,0)';
      }, end: function () { sp.remove(); b.parentNode.removeChild(b); } };
    },
    peek: function (c) {
      var h = 260, cb = clipBox(c, h), sp = new Sprite(cb.box, 'hello', h), x = rnd(cb.left + 60, cb.right - 60), base = cb.H, dur = 8;
      sp.shadow.style.display = 'none';
      return { dur: dur, z: 0, tick: function (t) {
        var k = ease(t / .6) - ease((t - 3) / .4) + ease((t - 4.2) / .5) - ease((t - 7.3) / .6);
        var lean = t < 3.4 ? Math.sin(t * 1.6) * 5 : -6;
        sp.frame(t < 3.4 ? Math.floor(t * 10) % 12 : (t < 5.8 ? 12 : 13));
        sp.place(x + (t > 3.4 ? 30 : 0), base + h * .45 + (1 - k) * h * .6, 1, t > 3.4, lean);
      }, end: function () { cb.box.parentNode && cb.box.parentNode.removeChild(cb.box); } };
    },
    sneak: function (c) {
      var side = Math.random() < .5 ? -1 : 1, h = Math.min(c.H * .4, 360), sp = new Sprite(c.stage, 'hello', h), y = rnd(c.H * .45, c.H * .8), dur = 7.5;
      sp.shadow.style.display = 'none';
      var b = bubble(c.stage, 'shh…');
      return { dur: dur, z: 3, tick: function (t) {
        var k = ease(t / .9) - ease((t - 6.4) / .9);
        var edge = side < 0 ? 0 : c.W, x = edge - side * (sp.w * .5 * k - sp.w * .5 + sp.w * .32);
        sp.frame(t < 4.5 ? Math.floor(t * 9) % 12 : (t < 5.3 ? 12 : 0));
        sp.place(x, y, 1, side > 0, side * -16 * k);
        b.style.opacity = (t > 4.4 && t < 6) ? 1 : 0;
        b.style.transform = 'translate3d(' + clamp(x + (side < 0 ? 40 : -200), 12, c.W - 160) + 'px,' + (y - h * .95) + 'px,0)';
      }, end: function () { sp.remove(); b.parentNode.removeChild(b); } };
    },
    knock: function (c) {
      var h = Math.min(c.H * .58, 520), sp = new Sprite(c.stage, 'hello', h), cx = rnd(c.W * .35, c.W * .65), dur = 8, fired = {};
      sp.shadow.style.display = 'none';
      var label = el('div', 'position:absolute;left:0;top:0;padding:10px 18px;border-radius:999px;background:rgba(27,22,34,.78);color:#f6f1ea;font:500 17px "JetBrains Mono",monospace;letter-spacing:.24em;text-transform:uppercase;white-space:nowrap;opacity:0;transition:opacity .3s;pointer-events:none', c.stage);
      label.textContent = 'knock · knock';
      var glass = el('div', 'position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 40%,rgba(255,255,255,.0),rgba(255,255,255,.0));opacity:0;transition:opacity .4s', c.stage);
      return { dur: dur, z: 3, tick: function (t) {
        var appr = ease(t / 1.6), leave = ease((t - 6.8) / 1.2), sc = 0.45 + 0.6 * appr - 0.7 * leave;
        sp.frame(t < 2.2 ? Math.floor(t * 8) % 12 : t < 4.4 ? 14 : t < 5.6 ? 20 + Math.floor((t - 4.4) * 5) % 7 : 0);
        var knockT = [2.5, 3.0, 3.5], bump = 0;
        knockT.forEach(function (k) { if (t > k && t < k + .12) bump = 1; if (t >= k && !fired[k]) { fired[k] = 1; c.ripple(cx + sp.w * .32 * sc, c.H - h * sc * .78); c.shake(); } });
        sp.place(cx, c.H + 40 - bump * 6, sc * (1 + bump * .015), false, 0, 1 - leave);
        label.style.opacity = (t > 2.3 && t < 4.4) ? 1 : 0;
        var lw = label.offsetWidth || 200, hy = c.H - h * sc * .78;
        label.style.transform = 'translate3d(' + clamp(cx + sp.w * .32 * sc - lw / 2, 12, c.W - lw - 12) + 'px,' + (hy - 90) + 'px,0)';
      }, end: function () { sp.remove(); label.parentNode.removeChild(label); glass.parentNode.removeChild(glass); } };
    },
    sleep: function (c) {
      var h = 240, cb = clipBox(c, h), sp = new Sprite(cb.box, 'hello', h), x = rnd(cb.left + 70, cb.right - 70), base = cb.H, dur = 16, zt = 0;
      var top0 = parseFloat(cb.box.style.top);
      sp.shadow.style.display = 'none'; sp.frame(12);
      return { dur: dur, z: 0, tick: function (t) {
        var k = ease(t / 1.2) - ease((t - 14.8) / 1.2);
        sp.place(x, base + h * .45 + (1 - k) * h * .6 + Math.sin(t * 1.8) * 3, 1 + Math.sin(t * 1.8) * .012, false, 8 + Math.sin(t * .9) * 2);
        if (t > 2 && t - zt > 1.4 && t < 14) { zt = t; c.zee(x + 50, top0 + cb.H - h * .5); }
      }, end: function () { cb.box.parentNode && cb.box.parentNode.removeChild(cb.box); } };
    }
  };
  var RANDOM = ['stroll', 'chase', 'sleep'];

  function Actor(o) {
    this.stage = o.stage; this.strip = o.strip; this.shakeEl = o.shake;
    this.opts = { act: 'random', gap: 150, line: 'Hi!' };
    this.cur = null; this.next = 0; this.running = false; this.last = null;
    var self = this; this._loop = function (ts) { self.loop(ts); };
  }
  Actor.prototype.set = function (o) { for (var k in o) this.opts[k] = o[k]; };
  Actor.prototype.start = function (delay) { if (this.running) return; this.running = true; this.next = performance.now() / 1000 + (delay == null ? 2.5 : delay); this.raf = requestAnimationFrame(this._loop); };
  Actor.prototype.stop = function () { this.running = false; cancelAnimationFrame(this.raf); if (this.cur) { this.cur.end(); this.cur = null; } this.stage.innerHTML = ''; };
  Actor.prototype.restart = function () { var r = this.running; this.stop(); if (r) this.start(0.6); };
  Actor.prototype.ctx = function () {
    var self = this, W = this.stage.clientWidth, H = this.stage.clientHeight;
    return { W: W, H: H, stage: this.stage, strip: this.strip, line: this.opts.line,
      ripple: function (x, y) {
        for (var i = 0; i < 2; i++) { var r = el('div', 'position:absolute;left:' + (x - 50) + 'px;top:' + (y - 50) + 'px;width:100px;height:100px;border-radius:50%;border:3px solid rgba(255,255,255,.95);box-shadow:0 0 20px rgba(255,179,92,.6);animation:hk-ripple .8s ease-out ' + (i * .12) + 's both;pointer-events:none', self.stage); (function (n) { setTimeout(function () { n.parentNode && n.parentNode.removeChild(n); }, 1300); })(r); }
      },
      shake: function () { var s = self.shakeEl; if (!s) return; s.style.transform = 'translate(-7px,4px)'; setTimeout(function () { s.style.transform = 'translate(5px,-3px)'; }, 50); setTimeout(function () { s.style.transform = ''; }, 110); },
      zee: function (x, y) { var z = el('div', 'position:absolute;left:' + x + 'px;top:' + y + 'px;font:500 ' + (18 + Math.random() * 12) + 'px "JetBrains Mono",monospace;color:#ffc27f;text-shadow:0 0 10px rgba(255,179,92,.6);animation:hk-z 2.6s ease-out both;pointer-events:none', self.stage); z.textContent = Math.random() < .5 ? 'z' : 'Z'; setTimeout(function () { z.parentNode && z.parentNode.removeChild(z); }, 2700); }
    };
  };
  Actor.prototype.pick = function () {
    var a = this.opts.act;
    if (a && a !== 'random' && ACTS[a]) return a;
    var hr = new Date().getHours();
    if ((hr >= 22 || hr < 6) && Math.random() < .6) return 'sleep';
    if (hr >= 6 && hr < 22 && this.last !== 'sleep' && Math.random() < .75) return pick(['stroll', 'chase'].filter(function (x) { return x !== this.last; }, this));
    var self = this, pool = RANDOM.filter(function (x) { return x !== self.last; });
    return pick(pool);
  };
  Actor.prototype.loop = function () {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this._loop);
    var now = performance.now() / 1000;
    if (!this.cur) {
      if (this.opts.gap == null || now < this.next || !this.stage.clientWidth) return;
      var name = this.pick(); this.last = name;
      this.cur = ACTS[name](this.ctx()); this.cur.t0 = now;
      this.stage.style.zIndex = this.cur.z;
    }
    var t = now - this.cur.t0;
    this.cur.tick(Math.min(t, this.cur.dur));
    if (t >= this.cur.dur) { this.cur.end(); this.cur = null; this.next = now + this.opts.gap; }
  };
  window.HemieActor = { create: function (o) { return new Actor(o); }, acts: Object.keys(ACTS) };
})();
