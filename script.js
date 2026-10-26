(function () {
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var storedTheme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var color = theme === 'dark' ? '#101012' : '#fbfaf8';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', color);
    });
  }

  applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  var langBtns = document.querySelectorAll('[data-lang-btn]');
  var langBlocks = document.querySelectorAll('.lang-block');

  function setLang(lang) {
    document.body.setAttribute('data-lang', lang);
    langBlocks.forEach(function (el) {
      el.hidden = el.getAttribute('data-lang') !== lang;
    });
    langBtns.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
    });
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-lang-btn'));
    });
  });

  var storedLang = localStorage.getItem('lang');
  if (storedLang === 'ca' || storedLang === 'es') {
    setLang(storedLang);
  }

  var KEY = 'done';
  var done = [];
  try { done = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}

  var stepItems = document.querySelectorAll('.step');
  var resets = document.querySelectorAll('.reset-btn');

  function renderDone() {
    stepItems.forEach(function (li) {
      li.querySelector('.step-btn').setAttribute('aria-pressed', String(done.indexOf(li.dataset.id) > -1));
    });
    resets.forEach(function (b) { b.hidden = !done.length; });
    try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
  }

  stepItems.forEach(function (li) {
    li.querySelector('.step-btn').addEventListener('click', function () {
      var i = done.indexOf(li.dataset.id);
      if (i > -1) done.splice(i, 1); else done.push(li.dataset.id);
      renderDone();
    });
  });

  resets.forEach(function (b) {
    b.addEventListener('click', function () { done = []; renderDone(); });
  });

  renderDone();

  var tabBtns = document.querySelectorAll('[data-tab-btn]');
  var panels = document.querySelectorAll('.panel');

  function setTab(tab) {
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

  var sheet = document.getElementById('sheet');
  var sheetTitle = sheet.querySelector('.sheet-title');
  var sheetIng = sheet.querySelector('.sheet-ing');
  var sheetIns = sheet.querySelector('.sheet-ins');
  var sheetClose = document.getElementById('sheetClose');

  document.querySelectorAll('.idea-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      sheetTitle.textContent = btn.querySelector('.idea-title').textContent;
      sheetIng.textContent = btn.querySelector('.idea-ing').textContent;
      sheetIns.textContent = btn.querySelector('.idea-ins').textContent;
      sheetClose.setAttribute('aria-label', document.documentElement.lang === 'es' ? 'Cerrar' : 'Tanca');
      sheet.showModal();
    });
  });

  sheetClose.addEventListener('click', function () { sheet.close(); });
  sheet.addEventListener('click', function (e) {
    var r = sheet.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) sheet.close();
  });
})();
