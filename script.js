(function () {
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var storedTheme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

  function calm() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function canTransition() { return !!document.startViewTransition && !calm(); }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var color = theme === 'dark' ? '#101012' : '#fbfaf8';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', color);
    });
  }

  applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

  // the new theme spreads as a circle from the toggle
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    function go() { applyTheme(next); localStorage.setItem('theme', next); }
    if (!canTransition()) { go(); return; }

    var r = themeBtn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt-theme');
    var vt = document.startViewTransition(go);
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 560, easing: EASE, pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    vt.finished.finally(function () { root.classList.remove('vt-theme'); });
  });

  // ---------- text morph: shared letters glide between languages ----------

  function source(el) {
    if (el._t == null) el._t = el.textContent;
    return el._t;
  }

  function letters(el, text) {
    el.textContent = '';
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'ml';
      s.textContent = text[i];
      el.appendChild(s);
      out.push(s);
    }
    return out;
  }

  function spots(spans) {
    return spans.map(function (s) { var r = s.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  }

  // longest common subsequence, case-insensitive: map[newIndex] = oldIndex
  function match(a, b) {
    a = a.toLowerCase(); b = b.toLowerCase();
    var n = a.length, m = b.length, L = [], i, j;
    for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        L[i][j] = a[i] === b[j] && a[i] !== ' ' ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      }
    }
    var map = {}, used = {};
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j] && a[i] !== ' ') { map[j] = i; used[i] = true; i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    return { map: map, used: used };
  }

  function morph(el, from, delay) {
    var to = source(el);
    if (from === to) return;
    clearTimeout(el._mt);

    var oldPos = spots(letters(el, from));
    var spans = letters(el, to);
    var newPos = spots(spans);
    var m = match(from, to);
    var box = el.getBoundingClientRect();
    var staticPos = getComputedStyle(el).position === 'static';
    if (staticPos) el.style.position = 'relative';

    spans.forEach(function (s, j) {
      var i = m.map[j];
      if (i != null) {
        var dx = oldPos[i].x - newPos[j].x, dy = oldPos[i].y - newPos[j].y;
        s.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
          { duration: 560, delay: delay, easing: EASE, fill: 'backwards' });
      } else {
        s.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(0.4em)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }],
          { duration: 420, delay: delay + 90 + Math.min(j * 14, 140), easing: EASE, fill: 'backwards' });
      }
    });

    for (var i = 0; i < from.length; i++) {
      if (m.used[i] || from[i] === ' ') continue;
      var g = document.createElement('span');
      g.className = 'ml ml-ghost';
      g.setAttribute('aria-hidden', 'true');
      g.textContent = from[i];
      g.style.left = (oldPos[i].x - box.left) + 'px';
      g.style.top = (oldPos[i].y - box.top) + 'px';
      el.appendChild(g);
      g.animate([{ opacity: 1 }, { opacity: 0, filter: 'blur(4px)', transform: 'translateY(-0.4em)' }],
        { duration: 260, delay: delay, easing: 'ease-in', fill: 'forwards' });
    }

    el._mt = setTimeout(function () {
      el.textContent = to;
      if (staticPos) el.style.position = '';
    }, delay + 720);
  }

  var MORPH = '.h-t, .panel h2, .step-title, .idea-title, .ing-list li > span:first-child';

  function morphPairs(from, to) {
    var pairs = [];
    function collect(a, b) {
      a.forEach(function (el, i) { if (b[i] && !b[i].children.length && !el.children.length) pairs.push([source(el), b[i]]); });
    }
    collect(document.querySelectorAll('.lang-block[data-lang="' + from + '"] :is(' + MORPH + ')'),
      document.querySelectorAll('.lang-block[data-lang="' + to + '"] :is(' + MORPH + ')'));
    collect(document.querySelectorAll('.tab-l[data-l="' + from + '"]'), document.querySelectorAll('.tab-l[data-l="' + to + '"]'));
    return pairs;
  }

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  }

  var langBtns = document.querySelectorAll('[data-lang-btn]');
  var langBlocks = document.querySelectorAll('.lang-block');

  function setLang(lang, animate) {
    var from = document.body.getAttribute('data-lang');
    var pairs = animate && from !== lang && !calm() ? morphPairs(from, lang) : null;
    if (pairs) document.body.classList.add('lang-swap');

    document.body.setAttribute('data-lang', lang);
    langBlocks.forEach(function (el) {
      el.hidden = el.getAttribute('data-lang') !== lang;
    });
    langBtns.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
    });
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);

    if (pairs) {
      var n = 0;
      pairs.forEach(function (p) { if (inView(p[1])) morph(p[1], p[0], Math.min(n++ * 12, 120)); });
    }
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang-btn'), true);
    });
  });

  var storedLang = localStorage.getItem('lang');
  if (storedLang === 'ca' || storedLang === 'es') {
    setLang(storedLang);
  }

  // ---------- steps ----------

  var KEY = 'done';
  var done = [];
  try { done = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}

  var stepItems = document.querySelectorAll('.step');
  var resets = document.querySelectorAll('.reset-btn');
  var tallies = document.querySelectorAll('.tally-n');
  var total = document.querySelectorAll('.lang-block[data-lang="ca"] .step').length;

  // the counter changes with a vertical speed blur
  function tally(box, n, animate) {
    var cur = box.lastElementChild;
    if (cur && cur.textContent === String(n)) return;
    while (box.children.length > 1) box.removeChild(box.firstElementChild);
    var next = document.createElement('span');
    next.textContent = n;
    if (!animate || !cur || calm()) { box.replaceChildren(next); return; }

    var d = n > Number(cur.textContent) ? 1 : -1;
    box.appendChild(next);
    cur.setAttribute('aria-hidden', 'true');
    cur.animate([{ transform: 'none', filter: 'blur(0)', opacity: 1 },
      { transform: 'translateY(' + (-d * 110) + '%) scaleY(1.6)', filter: 'blur(1.5px)', opacity: 0 }],
      { duration: 220, easing: 'cubic-bezier(0.5, 0, 1, 0.6)', fill: 'forwards' }).onfinish = function () { cur.remove(); };
    next.animate([{ transform: 'translateY(' + (d * 110) + '%) scaleY(1.6)', filter: 'blur(1.5px)', opacity: 0 },
      { transform: 'none', filter: 'blur(0)', opacity: 1 }],
      { duration: 380, delay: 40, easing: EASE, fill: 'backwards' });
  }

  function renderDone(animate) {
    stepItems.forEach(function (li) {
      li.querySelector('.step-btn').setAttribute('aria-pressed', String(done.indexOf(li.dataset.id) > -1));
    });
    resets.forEach(function (b) { b.hidden = !done.length; });
    tallies.forEach(function (t) { tally(t, done.length, animate); });
    try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
  }

  stepItems.forEach(function (li) {
    li.querySelector('.step-btn').addEventListener('click', function () {
      var i = done.indexOf(li.dataset.id);
      if (i > -1) done.splice(i, 1); else done.push(li.dataset.id);
      renderDone(true);
      if (i < 0 && done.length === total) celebrate(li.querySelector('.step-num'));
    });
  });

  resets.forEach(function (b) {
    b.addEventListener('click', function () { done = []; renderDone(true); });
  });

  renderDone(false);

  // ---------- celebration: toppings burst from the last tick ----------

  function drawBit(ctx, b) {
    var s = b.s;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.scale(Math.cos(b.flip), 1);
    if (b.kind === 0) {
      ctx.fillStyle = '#b8412b';
      ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#8c2a1a';
      ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.12, s * 0.08, 0, 6.283); ctx.arc(s * 0.18, s * 0.05, s * 0.07, 0, 6.283); ctx.arc(-s * 0.05, s * 0.22, s * 0.06, 0, 6.283); ctx.fill();
    } else if (b.kind === 1) {
      ctx.fillStyle = '#3d8a37';
      ctx.beginPath(); ctx.moveTo(-s * 0.7, 0);
      ctx.quadraticCurveTo(0, -s * 0.55, s * 0.7, 0);
      ctx.quadraticCurveTo(0, s * 0.55, -s * 0.7, 0);
      ctx.fill();
      ctx.strokeStyle = '#78b96a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-s * 0.55, 0); ctx.lineTo(s * 0.55, 0); ctx.stroke();
    } else {
      ctx.fillStyle = '#f8f3e6';
      ctx.strokeStyle = 'rgba(120, 100, 60, 0.28)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.1);
      ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, s * 0.15, -s * 0.38);
      ctx.quadraticCurveTo(s * 0.6, -s * 0.2, s * 0.42, s * 0.25);
      ctx.quadraticCurveTo(s * 0.1, s * 0.55, -s * 0.3, s * 0.32);
      ctx.quadraticCurveTo(-s * 0.62, s * 0.15, -s * 0.5, -s * 0.1);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function celebrate(from) {
    if (calm()) return;
    var r = from.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var w = innerWidth, h = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var c = document.createElement('canvas');
    c.className = 'confetti';
    c.setAttribute('aria-hidden', 'true');
    c.width = w * dpr; c.height = h * dpr;
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);

    var bits = [];
    for (var i = 0; i < 60; i++) {
      var a = -Math.PI / 2 + 0.35 + (Math.random() - 0.5) * 1.7;
      var v = 7 + Math.random() * 10;
      bits.push({
        x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        rot: Math.random() * 6.283, vr: (Math.random() - 0.5) * 0.25,
        flip: Math.random() * 6.283, vf: 0.06 + Math.random() * 0.12,
        kind: i % 3, s: 10 + Math.random() * 8
      });
    }

    var life = 2400, t0 = performance.now(), last = t0;
    function frame(now) {
      var k = Math.min((now - last) / 16.67, 3), t = now - t0;
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = t > life - 500 ? Math.max(0, (life - t) / 500) : 1;
      bits.forEach(function (b) {
        var drag = Math.pow(0.975, k);
        b.vx *= drag;
        b.vy = b.vy * drag + 0.38 * k;
        b.x += (b.vx + Math.sin(b.flip) * 0.6) * k;
        b.y += b.vy * k;
        b.rot += b.vr * k;
        b.flip += b.vf * k;
        drawBit(ctx, b);
      });
      if (t < life) requestAnimationFrame(frame); else c.remove();
    }
    requestAnimationFrame(frame);
  }

  // ---------- tabs ----------

  var tabBtns = document.querySelectorAll('[data-tab-btn]');
  var panels = document.querySelectorAll('.panel');

  function setTab(tab) {
    document.body.classList.remove('lang-swap');
    tabBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-tab-btn') === tab));
    });
    document.querySelector('.tabbar').setAttribute('data-active', tab);
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-tab') !== tab; });
    try { localStorage.setItem('tab', tab); } catch (e) {}
    window.scrollTo(0, 0);
  }

  tabBtns.forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab-btn')); });
  });

  var storedTab = null;
  try { storedTab = localStorage.getItem('tab'); } catch (e) {}
  if (storedTab === 'ingredients' || storedTab === 'steps' || storedTab === 'ideas') setTab(storedTab);

  // ---------- idea sheet: the title flies from the list into the sheet ----------

  var sheet = document.getElementById('sheet');
  var sheetTitle = sheet.querySelector('.sheet-title-t');
  var sheetIng = sheet.querySelector('.sheet-ing');
  var sheetIns = sheet.querySelector('.sheet-ins');
  var sheetClose = document.getElementById('sheetClose');

  document.querySelectorAll('.idea-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var title = btn.querySelector('.idea-title');
      function open() {
        sheetTitle.textContent = title.textContent;
        sheetIng.textContent = btn.querySelector('.idea-ing').textContent;
        sheetIns.textContent = btn.querySelector('.idea-ins').textContent;
        sheetClose.setAttribute('aria-label', document.documentElement.lang === 'es' ? 'Cerrar' : 'Tanca');
        sheet.showModal();
      }
      if (!canTransition()) { open(); return; }

      title.style.viewTransitionName = 'idea-title';
      root.classList.add('vt-sheet');
      sheet.classList.add('vt-open');
      var vt = document.startViewTransition(function () {
        title.style.viewTransitionName = '';
        sheetTitle.style.viewTransitionName = 'idea-title';
        sheet.style.viewTransitionName = 'sheet';
        open();
      });
      vt.finished.finally(function () {
        sheetTitle.style.viewTransitionName = '';
        sheet.style.viewTransitionName = '';
        sheet.classList.remove('vt-open');
        root.classList.remove('vt-sheet');
      });
    });
  });

  sheetClose.addEventListener('click', function () { sheet.close(); });
  sheet.addEventListener('click', function (e) {
    var r = sheet.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) sheet.close();
  });
})();
