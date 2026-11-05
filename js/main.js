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

  /* ---------- Project rail: slides left and right ---------- */
  var rail = document.querySelector('.rail');
  if (rail) {
    var track = rail.querySelector('.rail-track');
    var cards = Array.prototype.slice.call(rail.querySelectorAll('.rail-card'));
    var count = rail.querySelector('.rail-count');
    var prev = rail.querySelector('[data-dir="-1"]');
    var next = rail.querySelector('[data-dir="1"]');
    var focus = -1, ticking = false;

    var padLeft = function () { return parseFloat(getComputedStyle(track).paddingLeft) || 0; };

    /* The project lined up with the left edge is the current one */
    var current = function () {
      var edge = track.getBoundingClientRect().left + padLeft();
      var best = 0, bestD = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.getBoundingClientRect().left - edge);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    };

    var update = function () {
      ticking = false;
      var max = track.scrollWidth - track.clientWidth;
      var idx = current();
      if (idx !== focus) {
        cards.forEach(function (c, i) { c.classList.toggle('is-focus', i === idx); });
        if (count) count.textContent = (idx + 1) + ' / ' + cards.length;
        focus = idx;
      }
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };
    var requestUpdate = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    var goTo = function (idx) {
      idx = Math.max(0, Math.min(cards.length - 1, idx));
      var left = cards[idx].offsetLeft - track.offsetLeft - padLeft();
      track.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
    };
    var step = function (dir) { goTo(current() + dir); };

    /* Leave room after the last project so every project can line up on the left */
    var sizeEnd = function () {
      var last = cards[cards.length - 1];
      var room = track.clientWidth - padLeft() - last.offsetWidth - parseFloat(getComputedStyle(track).paddingRight);
      track.style.setProperty('--end', Math.max(1, room) + 'px');
    };

    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });

    /* Mouse: click and drag to slide. A drag never opens a project. */
    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) { track.classList.remove('is-dragging'); goTo(current()); }
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    track.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function () { sizeEnd(); requestUpdate(); });
    window.addEventListener('load', function () { sizeEnd(); requestUpdate(); });
    sizeEnd(); update();
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
