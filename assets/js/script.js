/* ─────────────────────────────────────────────────────────────────────────
   blobbyofficial.com — script.js
   Self-contained IIFE: no global leakage except the two symbols that must
   be reachable from HTML (window.onTurnstileLoad, window.retryTurnstile).
───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';


  /* ═══════════════════════════════════════════════════════════════════════
     BOT DETECTION & CLOUDFLARE TURNSTILE OVERLAY
     ───────────────────────────────────────────────────────────────────────
     ⚠️  For airtight server-side verification, POST the token to:
         https://challenges.cloudflare.com/turnstile/v0/siteverify
     without that step the overlay can be dismissed via devtools. Cloudflare's
     widget still runs its own behavioural analysis on every visitor, which
     is what we rely on here in a client-only setup.
  ═══════════════════════════════════════════════════════════════════════ */

  const TURNSTILE_SITEKEY = '0x4AAAAAAB3rRYXeLVFLBhKT';

  let overlayActive   = false;
  let turnstileId     = null;
  let interactionSeen = false;

  /* ── Heuristic signals — filters naive scrapers / unpatched headless browsers ── */
  const BOT_CHECKS = [
    () => navigator.webdriver === true,
    () => /HeadlessChrome|PhantomJS|Nightmare/i.test(navigator.userAgent),
    () => !navigator.languages || navigator.languages.length === 0,
    () => screen.width === 0 || screen.height === 0,
    /* No plugins AND not a touch device → likely headless */
    () => typeof navigator.plugins === 'object' &&
          navigator.plugins.length === 0 &&
          !('ontouchstart' in window),
  ];

  function isSuspicious() {
    return BOT_CHECKS.some(fn => { try { return fn(); } catch (e) { return false; } });
  }
f
  function showBotOverlay() {    if (overlayActive) return;
    const overlay = document.getElementById('bot-overlay');
    if (!overlay) return;

    overlayActive = true;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (window.turnstile && turnstileId === null) renderTurnstile();
  }

  function renderTurnstile() {
    const container = document.getElementById('bot-turnstile-container');
    if (!container || turnstileId !== null) return;

    turnstileId = window.turnstile.render(container, {
      sitekey:          TURNSTILE_SITEKEY,
      theme:            'dark',
      callback:         onTurnstileSuccess,
      'error-callback': onTurnstileError,
    });
  }

  /* Called by the Turnstile <script> tag once it finishes loading */
  window.onTurnstileLoad = function () {
    if (overlayActive && turnstileId === null) renderTurnstile();
  };

  function dismissOverlay() {
    const overlay = document.getElementById('bot-overlay');
    if (!overlay) return;

    overlay.classList.add('hiding');
    document.body.style.overflow = '';
    setTimeout(() => {
      overlay.classList.remove('active', 'hiding');
      overlayActive = false;
    }, 650);
  }

  function onTurnstileSuccess(/* token */) {
    /*
     * token is available here if you ever add a backend — pass it to your
     * /api/verify endpoint instead of dismissing immediately.
     */
    dismissOverlay();
  }

  function onTurnstileError() {
    const retryEl = document.getElementById('bot-retry');
    if (retryEl) retryEl.style.display = 'flex';
  }

  /* Exposed globally so HTML onclick="retryTurnstile()" still works */
  window.retryTurnstile = function () {
    const retryEl = document.getElementById('bot-retry');
    if (retryEl) retryEl.style.display = 'none';
    if (window.turnstile && turnstileId !== null) {
      window.turnstile.reset(turnstileId);
    }
  };

  /* ── Track first human interaction ── */
  const INTERACTION_EVENTS = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click', 'pointerdown'];

  function markInteraction() {
    interactionSeen = true;
    INTERACTION_EVENTS.forEach(ev =>
      document.removeEventListener(ev, markInteraction, { passive: true })
    );
  }

  INTERACTION_EVENTS.forEach(ev =>
    document.addEventListener(ev, markInteraction, { passive: true })
  );

  window.addEventListener('load', function () {
    if (isSuspicious()) { showBotOverlay(); return; }

    /* Slow-load heuristic: page took > 8 s with zero interaction → suspicious */
    if (performance.now() > 8000 && !interactionSeen) { showBotOverlay(); }

    /*
     * ❌ Removed: 20-second idle timeout.
     *    It caused false positives for real users reading long content or on
     *    slow connections. Cloudflare's widget analyses behaviour far more
     *    accurately than a blunt timer.
     */
  });


  /* ═══════════════════════════════════════════════════════════════════════
     PRICE AUTO-CONVERSION  £0.00 → "Free"
  ═══════════════════════════════════════════════════════════════════════ */

  document.querySelectorAll('.product-price').forEach(el => {
    Array.from(el.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE && /^£0+\.0+$/.test(n.textContent.trim()))
      .forEach(n => {
        n.textContent = 'Free';
        const small = el.querySelector('small');
        if (small) small.style.display = 'none';
      });
  });


  /* ═══════════════════════════════════════════════════════════════════════
     CUSTOM CURSOR  (fine-pointer / desktop only)
     ───────────────────────────────────────────────────────────────────────
     transform: translate() keeps cursor movement on the GPU compositor
     thread — no layout reflow on every mousemove.
     Your CSS should set:  #cursor { position: fixed; left: 0; top: 0; }
     and rely solely on this script's transform for positioning.
  ═══════════════════════════════════════════════════════════════════════ */

  const cursor = document.getElementById('cursor');

  if (cursor) {
    if (window.matchMedia('(pointer: fine)').matches) {
      let rafId = null;
      let mouseX = 0;
      let mouseY = 0;

      document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (rafId !== null) return;           /* coalesce rapid events into one frame */
        rafId = requestAnimationFrame(() => {
          cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
          rafId = null;
        });
      });

      document.querySelectorAll('a, button, .product-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('big'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
      });

    } else {
      cursor.style.display = 'none';
    }
  }


  /* ═══════════════════════════════════════════════════════════════════════
     HERO VIDEO  fade-in (desktop only)
  ═══════════════════════════════════════════════════════════════════════ */

  const heroVideo = document.getElementById('heroVideo');

  if (heroVideo && window.matchMedia('(min-width: 769px)').matches) {
    const onReady = () => heroVideo.classList.add('loaded');

    if (heroVideo.readyState >= 3) {
      onReady();
    } else {
      heroVideo.addEventListener('canplay', onReady, { once: true });
    }

    heroVideo.addEventListener('error', () => {
      heroVideo.style.display = 'none';
    }, { once: true });
  }


  /* ═══════════════════════════════════════════════════════════════════════
     HAMBURGER NAV TOGGLE
  ═══════════════════════════════════════════════════════════════════════ */

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');

  if (navToggle && navLinks) {

    function closeNav() {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* Close when any in-nav link is clicked */
    navLinks.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', closeNav)
    );

    /* Close when viewport crosses the desktop breakpoint (replaces resize listener) */
    window.matchMedia('(min-width: 769px)').addEventListener('change', e => {
      if (e.matches) closeNav();
    });
  }


  /* ═══════════════════════════════════════════════════════════════════════
     SCROLL REVEAL
  ═══════════════════════════════════════════════════════════════════════ */

  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length > 0) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); /* stop watching once revealed */
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => revealObserver.observe(el));
  }

})();
