/* ═══════════════════════════════════════════════
   BOT DETECTION & CLOUDFLARE TURNSTILE OVERLAY
═══════════════════════════════════════════════ */

const SITEKEY = '0x4AAAAAAB3rRYXeLVFLBhKT';
  let overlayActive    = false;
  let turnstileId      = null;
  let interactionSeen  = false;

  /* ── Bot signal checks ── */
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
    return BOT_CHECKS.some(fn => { try { return fn(); } catch(e) { return false; } });
  }

  /* ── Show the overlay ── */
  function showBotOverlay() {
    if (overlayActive) return;
    overlayActive = true;

    const overlay = document.getElementById('bot-overlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    /* Render turnstile widget if API is already loaded */
    if (window.turnstile && turnstileId === null) renderTurnstile();
  }

  /* ── Render widget ── */
  function renderTurnstile() {
    turnstileId = window.turnstile.render('#bot-turnstile-container', {
      sitekey:          SITEKEY,
      theme:            'dark',
      callback:         onTurnstileSuccess,
      'error-callback': onTurnstileError,
    });
  }

  /* ── Called by Turnstile script once it loads ── */
  window.onTurnstileLoad = function () {
    if (overlayActive && turnstileId === null) renderTurnstile();
  };

  /* ── Verification success ── */
  function onTurnstileSuccess(token) {
    const overlay = document.getElementById('bot-overlay');
    overlay.classList.add('hiding');
    document.body.style.overflow = '';
    setTimeout(() => {
      overlay.classList.remove('active', 'hiding');
      overlayActive = false;
    }, 650);
  }

  /* ── Verification error ── */
  function onTurnstileError() {
    document.getElementById('bot-retry').style.display = 'flex';
  }

  /* ── Retry button ── */
  function retryTurnstile() {
    document.getElementById('bot-retry').style.display = 'none';
    if (window.turnstile && turnstileId !== null) {
      window.turnstile.reset(turnstileId);
    }
  }

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

  /* ── Run checks on load ── */
  window.addEventListener('load', function () {
    /* Immediate bot signal check */
    if (isSuspicious()) { showBotOverlay(); return; }

    /* Slow-load heuristic: page took > 8 s AND no interaction yet */
    const loadMs = performance.now();
    if (loadMs > 8000 && !interactionSeen) { showBotOverlay(); return; }

    /* No interaction at all after 20 s → suspicious */
    setTimeout(function () {
      if (!interactionSeen) showBotOverlay();
    }, 20000);
  });


  /* ═══════════════════════════════════
     PRICE AUTO-CONVERSION: £00.00 → Free
  ═══════════════════════════════════ */
  document.querySelectorAll('.product-price').forEach(function (el) {
    /* Find the text node (price value) — it's the last child after <small> */
    const nodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
    nodes.forEach(function (node) {
      const val = node.textContent.trim();
      /* Match any £0.00 variant, e.g. £00.00, £0.00, £000.00 */
      if (/^£0+\.0+$/.test(val)) {
        node.textContent = 'Free';
        const small = el.querySelector('small');
        if (small) small.style.display = 'none';
      }
    });
  });


  /* ═══════════════════════════════════
     CURSOR (desktop only)
  ═══════════════════════════════════ */
  const cursor = document.getElementById('cursor');
  if (window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, .product-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('big'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
    });
  } else {
    cursor.style.display = 'none';
  }


  /* ═══════════════════════════════════
     HERO VIDEO fade-in (desktop only)
  ═══════════════════════════════════ */
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo && window.innerWidth > 768) {
    const onReady = () => heroVideo.classList.add('loaded');
    if (heroVideo.readyState >= 3) {
      onReady();
    } else {
      heroVideo.addEventListener('canplay', onReady, { once: true });
    }
    heroVideo.addEventListener('error', () => heroVideo.style.display = 'none');
  }


  /* ═══════════════════════════════════
     HAMBURGER NAV TOGGLE
  ═══════════════════════════════════ */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    }
  });


  /* ═══════════════════════════════════
     SCROLL REVEAL
  ═══════════════════════════════════ */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));