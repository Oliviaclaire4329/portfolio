(function () {
  /* Always open a page at the top (e.g. after clicking Next project) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  window.addEventListener('pageshow', function () { if (!location.hash) window.scrollTo(0, 0); });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- Burger menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
        var setOpen = function (open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { setOpen(!body.classList.contains('menu-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('menu-open')) setOpen(false); });

    var peek = menu.querySelector('.menu-peek');
    var peekImg = peek && peek.querySelector('img');
    menu.querySelectorAll('[data-img]').forEach(function (a) {
      var show = function () {
        peekImg.src = a.getAttribute('data-img');
        peek.style.setProperty('--px', (Math.random() * 30).toFixed(1) + '%');
        peek.style.setProperty('--py', (Math.random() * 24).toFixed(1) + '%');
        peek.classList.add('on');
      };
      var hide = function () { peek.classList.remove('on'); };
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
      a.addEventListener('mouseleave', hide); a.addEventListener('blur', hide);
    });
  }

  /* ---------- Project rail: scroll down, projects move across ---------- */
  var rail = document.querySelector('.rail');
  if (rail) {
    var track = rail.querySelector('.rail-track');
    var cards = Array.prototype.slice.call(rail.querySelectorAll('.rail-card'));
        var count = rail.querySelector('.rail-count');
    var distance = 0, focus = -1, ticking = false, stickTop = 0;

    var isStatic = function () { return reduce || window.innerWidth < 760; };

    var setFocus = function (idx) {
      if (idx === focus) return;
      cards.forEach(function (c, i) { c.classList.toggle('is-focus', i === idx); });
      if (count) count.textContent = (idx + 1) + ' / ' + cards.length;
      focus = idx;
    };

    var nearest = function (refX, useLeft) {
      var best = 0, bestD = Infinity;
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var x = useLeft ? r.left : r.left + r.width / 2;
        var d = Math.abs(x - refX);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    };

    var update = function () {
      ticking = false;
      if (rail.classList.contains('is-static')) return;
      var p = Math.min(1, Math.max(0, (stickTop - rail.getBoundingClientRect().top) / (distance || 1)));
      track.style.transform = 'translate3d(' + (-p * distance) + 'px,0,0)';
      var vw = window.innerWidth;
      setFocus(nearest(vw * (0.2 + 0.6 * p), false));
    };
    var requestUpdate = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    var layout = function () {
      if (isStatic()) {
        rail.classList.add('is-static');
        rail.style.height = '';
        track.style.transform = '';
        setFocus(nearest(track.getBoundingClientRect().left, true));
        return;
      }
      rail.classList.remove('is-static');
      distance = Math.max(0, track.scrollWidth - window.innerWidth);
      var sticky = rail.querySelector('.rail-sticky');
      stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
      rail.style.height = (sticky.offsetHeight + distance) + 'px';
      update();
    };

    track.addEventListener('scroll', function () {
      if (rail.classList.contains('is-static')) setFocus(nearest(track.getBoundingClientRect().left, true));
    }, { passive: true });
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    layout();
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = t; }, 1600); };
      var fallback = function () {
        var el = document.querySelector('.email'); if (!el) return;
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
