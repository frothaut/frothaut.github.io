(function () {
  var root = document.documentElement;

  function setLang(lang) {
    root.classList.remove('lang-de', 'lang-en');
    root.classList.add('lang-' + lang);
    root.setAttribute('lang', lang);
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    try { localStorage.setItem('firo-lang', lang); } catch (e) {}
  }

  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  try {
    var saved = localStorage.getItem('firo-lang');
    if (saved === 'de' || saved === 'en') setLang(saved);
  } catch (e) {}
})();
