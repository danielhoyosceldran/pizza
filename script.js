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
})();
