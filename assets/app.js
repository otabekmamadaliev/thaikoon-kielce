/* Thaikoon Restaurant — skrypt tylko tej strony. Bez zależności. */
(function () {
  'use strict';
  var T = {}; try { T = JSON.parse(document.getElementById('i18n').textContent) || {}; } catch (e) {}
  var t = function (k, d) { return T[k] || d; };
  var spokojnie = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* pasek reaguje na zjechanie z gory */
  var pasek = document.querySelector('.belka');
  if (pasek) {
    var s = function () { pasek.classList.toggle('przewiniety', window.scrollY > 30); };
    s(); window.addEventListener('scroll', s, { passive: true });
  }

  /* menu na telefonie */
  var btn = document.querySelector('.ham');
  var mob = document.getElementById('mm');
  if (btn && mob) {
    var etykieta = btn.getAttribute('aria-label');
    btn.addEventListener('click', function () {
      var open = mob.classList.toggle('otwarte');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? t('closeMenu', etykieta) : etykieta);
    });
    mob.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { mob.classList.remove('otwarte'); btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mob.classList.contains('otwarte')) btn.click();
    });
  }

  /* Sekcje wchodza po kolei. Stan widoczny jest domyslny w CSS — bez JS
     i przy zredukowanym ruchu nic sie nie chowa. */
  if ('IntersectionObserver' in window && !spokojnie) {
    var cele = document.querySelectorAll('.stol figure, .dania article, .lokal-tekst p, .atuty li, .lokal-foto, .godziny > div');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.2,.7,.3,1)';
        en.target.style.opacity = 1; en.target.style.transform = 'none';
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    Array.prototype.forEach.call(cele, function (el, i) {
      el.style.opacity = 0; el.style.transform = 'translateY(16px)';
      el.style.transitionDelay = (i % 5) * 60 + 'ms';
      io.observe(el);
    });
  }

  /* Klikniecie w przelacznik zapamietuje wybor, zeby automat nie zabieral
     uzytkownika z powrotem przy nastepnym wejsciu. */
  document.querySelectorAll('a.lang').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('jezyk', (a.getAttribute('hreflang') || a.textContent).trim().toLowerCase().slice(0, 2)); } catch (e) {}
    });
  });
})();
/* stan.js — żywy stan lokalu dla Thaikoona. Dołączany do assets/app.js.
 *
 * Liczy „otwarte / zamknięte" w przeglądarce gościa, bo strona jest statyczna
 * i cokolwiek wpiszemy przy budowaniu, zestarzeje się w ciągu godziny.
 *
 * Zakresy przychodzą z build.mjs jako minuty od północy — dzięki temu skrypt
 * nie musi parsować napisów „12:00 – 22:00" w trzech językach naraz.
 */
(function () {
  'use strict';

  var zrodlo = document.querySelector('[data-zakresy]');
  var box = document.getElementById('stan');
  if (!zrodlo || !box) return;

  var T = {};
  try { T = JSON.parse(document.getElementById('i18n').textContent) || {}; } catch (e) {}
  var t = function (k) { return T[k] || ''; };

  var zakresy;
  try { zakresy = JSON.parse(zrodlo.textContent); } catch (e) { return; }
  if (!Array.isArray(zakresy) || zakresy.length !== 7) return;

  /* Jeżeli w wizytówce nie ma ANI JEDNEJ realnej godziny (wszystkie dni to
     „do potwierdzenia"), plakietka w ogóle się nie pokazuje. Napis
     „Zamknięte" nad czynnym lokalem to nie drobiazg — to wyprowadzony
     w pole gość i stracony klient właściciela. Brak wiedzy nie jest
     tym samym co zamknięte. */
  var znane = zakresy.filter(function (z) { return z; }).length;
  if (!znane) return;

  var teraz = new Date();
  var dzis = (teraz.getDay() + 6) % 7;               // poniedziałek = 0
  var minuty = teraz.getHours() * 60 + teraz.getMinutes();

  var hhmm = function (m) {
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  };

  var dzisiaj = zakresy[dzis];
  var otwarte = dzisiaj && minuty >= dzisiaj[0] && minuty < dzisiaj[1];
  var tekst;

  if (otwarte) {
    tekst = t('stanOpen') + ' ' + hhmm(dzisiaj[1]);
  } else if (dzisiaj && minuty < dzisiaj[0]) {
    // Jeszcze nie otworzyli, ale otworzą dziś.
    tekst = t('stanOpensAt') + ' ' + hhmm(dzisiaj[0]);
  } else {
    // Po zamknięciu albo dzień wolny — szukamy najbliższego dnia z godzinami.
    var i = 1, nast = null;
    while (i <= 7 && !nast) {
      var kandydat = zakresy[(dzis + i) % 7];
      if (kandydat) nast = { za: i, o: kandydat[0] };
      i++;
    }
    if (!nast) { tekst = t('stanClosed'); }
    else if (nast.za === 1) { tekst = t('stanOpensTomorrow') + ' ' + hhmm(nast.o); }
    else { tekst = t('stanClosed'); }
  }

  box.querySelector('.stan-tekst').textContent = tekst;
  box.classList.add(otwarte ? 'stan--otwarte' : 'stan--zamkniete');
  box.hidden = false;

  var wiersz = document.querySelector('.dzien-wiersz[data-dzien="' + dzis + '"]');
  if (wiersz) wiersz.classList.add('dzis');
})();
