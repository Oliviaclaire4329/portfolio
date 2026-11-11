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

    var atEnd = function () { return track.scrollLeft >= track.scrollWidth - track.clientWidth - 2; };
    var fullyVisible = function (i) {
      var t = track.getBoundingClientRect(), r = cards[i].getBoundingClientRect();
      return r.left >= t.left - 2 && r.right <= t.right + 2;
    };
    var pending = null; /* the project a Prev/Next click is heading to */
    var chosen = false; /* true when Prev/Next picked the current project */

    /* Let the last project travel to about halfway across, so the end never feels empty
       but the last caption still has room to show */
    var sizeEnd = function () {
      var last = cards[cards.length - 1], cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap) || 0;
      var room = track.clientWidth * 0.5 - last.offsetWidth - (parseFloat(cs.paddingRight) || 0);
      track.style.setProperty('--gap-end', room > 0 ? gap + 'px' : '0px');
      track.style.setProperty('--end', Math.max(0, room) + 'px');
    };

    var setFocus = function (idx) {
      if (idx === focus) return;
      cards.forEach(function (c, i) { c.classList.toggle('is-focus', i === idx); });
      if (count) count.textContent = (idx + 1) + ' / ' + cards.length;
      focus = idx;
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= cards.length - 1;
    };

    var update = function () {
      ticking = false;
      if (pending !== null) return;
      if (track.scrollLeft <= 2) { setFocus(0); return; }
      if (chosen && focus >= 0 && fullyVisible(focus)) return; /* keep what Prev/Next picked */
      /* While scrolling, a project becomes current once its left edge passes the middle of the slider */
      var line = track.getBoundingClientRect().left + track.clientWidth * 0.5 + 2, idx = 0;
      cards.forEach(function (c, i) { if (c.getBoundingClientRect().left <= line) idx = i; });
      setFocus(idx);
    };
    var requestUpdate = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    var settle;
    var goTo = function (idx) {
      idx = Math.max(0, Math.min(cards.length - 1, idx));
      var max = track.scrollWidth - track.clientWidth;
      var left = Math.min(max, cards[idx].offsetLeft - track.offsetLeft - padLeft());
      pending = idx; chosen = true; setFocus(idx);
      clearTimeout(settle);
      if (Math.abs(track.scrollLeft - left) < 2) { pending = null; return; }
      track.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      settle = setTimeout(landed, 900);
    };
    var step = function (dir) { goTo((pending !== null ? pending : focus) + dir); };
    var release = function () { pending = null; chosen = false; clearTimeout(settle); };
    var landed = function () { pending = null; clearTimeout(settle); };
    track.addEventListener('scrollend', function () { if (pending !== null) landed(); });
    ['wheel', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, release, { passive: true }); });

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
      release(); down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
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
      if (moved) { track.classList.remove('is-dragging'); requestUpdate(); }
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    track.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function () { sizeEnd(); requestUpdate(); });
    window.addEventListener('load', function () { sizeEnd(); requestUpdate(); });
    sizeEnd(); update();
  }


  /* ---------- Motion reels: play while on screen, stay still for reduced motion ---------- */
  var reels = document.querySelectorAll('.reel-phone video');
  if (reels.length) {
    /* Laptops and desktops get the full-resolution files; phones keep the lighter ones */
    if (window.matchMedia('(min-width: 761px)').matches) {
      reels.forEach(function (v) { var hd = v.getAttribute('data-hd'); if (hd) v.src = hd; });
    }
    var quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quiet) {
      reels.forEach(function (v) { v.controls = true; });
    } else if ('IntersectionObserver' in window) {
      /* Start downloading well before a reel scrolls into view, so it's sharp and ready when it arrives */
      var near = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.preload = 'auto'; e.target.load(); near.unobserve(e.target); }
        });
      }, { rootMargin: '1500px 0px' });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
          else e.target.pause();
        });
      }, { rootMargin: '100px 0px' });
      reels.forEach(function (v) { near.observe(v); io.observe(v); });
    } else reels.forEach(function (v) { v.autoplay = true; v.preload = 'auto'; v.play(); });
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
