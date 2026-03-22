// =============================================
//  IRONTRACK — Supabase config
// =============================================
const SUPABASE_URL = 'https://nnhgkhdrqrdcjrgczbgr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uaGdraGRycXJkY2pyZ2N6YmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTYwMTAsImV4cCI6MjA4OTczMjAxMH0.FTG5vsnR-53mE7-Vs41wJ5OUDbOQ1bZXkZ2SJldwH60';

// ---- Supabase REST helpers ----
async function sbFetch(path, options = {}) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + (getToken() || SUPABASE_KEY),
    'Content-Type': 'application/json',
  };
  if (options.prefer) headers['Prefer'] = options.prefer;

  const res = await fetch(SUPABASE_URL + path, {
    method: options.method || 'GET',
    headers,
    body: options.body || undefined,
  });

  // 204 No Content — success, nothing to parse
  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }

  // empty body guard
  const text = await res.text();
  if (!text || text.trim() === '') return null;
  try { return JSON.parse(text); } catch(e) { return null; }
}

// ---- Auth ----
function getToken()   { return localStorage.getItem('sb_token'); }
function getUser()    { try { return JSON.parse(localStorage.getItem('sb_user')); } catch(e) { return null; } }
function setSession(data) {
  localStorage.setItem('sb_token', data.access_token);
  localStorage.setItem('sb_user',  JSON.stringify(data.user));
}
function clearSession() {
  localStorage.removeItem('sb_token');
  localStorage.removeItem('sb_user');
}

async function signUp(email, password) {
  const data = await sbFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data && data.access_token) setSession(data);
  return data;
}

async function signIn(email, password) {
  const data = await sbFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data) setSession(data);
  return data;
}

async function signOut() {
  try { await sbFetch('/auth/v1/logout', { method: 'POST' }); } catch(e) {}
  clearSession();
}

function requireAuth() {
  if (!getToken() || !getUser()) window.location.href = 'login.html';
}

// ---- DB helpers ----
async function dbGet(table, filters = '') {
  return sbFetch(`/rest/v1/${table}?${filters}&limit=1000`, { method: 'GET' });
}

async function dbUpsert(table, data) {
  // return=representation → Supabase returns the row as JSON instead of 204
  return sbFetch(`/rest/v1/${table}`, {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify(data)
  });
}

async function dbDelete(table, id) {
  return sbFetch(`/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE' });
}

// ============================================================
// IRONTRACK UI ENHANCEMENTS
// - Global preloader overlay (optional, only if page doesn't have its own)
// - Reveal animations for key blocks using IntersectionObserver
// ============================================================
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Avoid duplicates on pages that already have loaders.
  const hasPageLoader = !!document.getElementById('loader'); // same HTML look as index.html
  const hasLandingLoader = !!document.getElementById('landing-loader');
  const hasGlobalLoader = !!document.getElementById('global-preloader');
  const hasAppShell = !!document.querySelector('.pw');

  let preloader = null;
  let createdPreloader = false;

  if (hasPageLoader) {
    preloader = document.getElementById('loader');
  } else if (hasAppShell && !hasLandingLoader && !hasGlobalLoader) {
    preloader = document.createElement('div');
    preloader.id = 'global-preloader';
    preloader.setAttribute('role', 'status');
    preloader.setAttribute('aria-live', 'polite');
    preloader.innerHTML = `
      <div class="loader-logo">Iron<em>Track</em></div>
      <div class="loader-bar" aria-hidden="true"></div>
    `;
    document.body.appendChild(preloader);
    createdPreloader = true;
  } else {
    preloader = document.getElementById('global-preloader');
  }

  const revealRoot =
    document.getElementById('main-content') ||
    document.getElementById('main') ||
    document.getElementById('landing-content') ||
    document.body;

  // While loader is visible: keep root content hidden to avoid a flash.
  const shouldHideContent =
    !!preloader && revealRoot && revealRoot !== document.body && revealRoot.style;

  if (shouldHideContent) {
    try {
      revealRoot.style.setProperty('opacity', '0', 'important');
      // Opacity=0 keeps layout, so IntersectionObserver can still work reliably.
      revealRoot.style.setProperty('transition', 'opacity .35s ease');
    } catch (e) {}
  }

  const selectors = [
    // Landing-like / marketing
    '.hero-inner',
    '.hero-section',
    '.section',
    '.feat',
    '.step',
    '.split-feature',
    '.sf-visual',
    '.sf-mock-row',
    '.sf-mini-card',
    '.quote-card',
    '.price-card',
    '.faq-item',
    '.cta-section',
    // App blocks
    '.pcard',
    '.excard',
    '.chart-card',
    '.hm-cell',
    '.mrow',
    '.ap-row',
    '.qlink',
    '.scard',
    '.kpi',
    '.entry-item',
    '.editor-wrap',
    '.dbt',
    '.sbn',
    '.mc',
    '.fblock',
    '.dbt',
    '.day-header',
    '.mlist-panel',
    '.bar'
  ].join(',');

  const maxTargets = 260;
  const prepared = new WeakSet();
  let io = null;
  let revealedCount = 0;

  function prepareEl(el) {
    if (!el || prepared.has(el)) return;
    prepared.add(el);

    if (prefersReducedMotion) return;

    el.style.willChange = 'opacity, transform';
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'opacity 650ms ease, transform 650ms ease';
  }

  function revealEl(el) {
    if (!el) return;
    if (prefersReducedMotion) {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
      return;
    }
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    el.style.transition = 'opacity 650ms ease, transform 650ms ease';
    revealedCount++;
  }

  function collectTargets(root) {
    if (!root) return [];
    const list = [];
    if (root.nodeType === 1) {
      if (root.matches && root.matches(selectors)) list.push(root);
      if (root.querySelectorAll) list.push(...root.querySelectorAll(selectors));
    } else {
      list.push(...revealRoot.querySelectorAll(selectors));
    }
    return list;
  }

  function observeVisibleTargets(targets) {
    if (!Array.isArray(targets) || targets.length === 0) return;

    const limited = targets.slice(0, maxTargets);
    limited.forEach(prepareEl);

    if (!io) return;
    limited.forEach((el) => {
      io.observe(el);
    });
  }

  function startObserver() {
    if (prefersReducedMotion) {
      // No animation; just clean styles if something prepared already.
      try {
        revealRoot.querySelectorAll(selectors).forEach((el) => {
          el.style.opacity = '';
          el.style.transform = '';
          el.style.transition = '';
        });
      } catch (e) {}
      return;
    }

    if (!('IntersectionObserver' in window)) {
      // Fallback: reveal everything after load.
      try {
        revealRoot.querySelectorAll(selectors).forEach((el) => revealEl(el));
      } catch (e) {}
      return;
    }

    io = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealEl(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '80px 0px' }
    );

    // Reveal those that are already visible.
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const initial = Array.from(revealRoot.querySelectorAll(selectors)).slice(0, maxTargets);

    initial.forEach(prepareEl);
    initial.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom >= -60 && r.top <= vh + 60 && r.right >= -60 && r.left <= vw + 60) {
        revealEl(el);
        io.unobserve(el);
      } else {
        io.observe(el);
      }
    });

    // Handle dynamic content (e.g. nutrition/progress render after fetch).
    const obs = new MutationObserver((mutations) => {
      if (!io) return;
      const added = [];
      mutations.forEach((m) => {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach((n) => {
            if (n && n.nodeType === 1) added.push(n);
          });
        }
      });
      if (!added.length) return;
      // Collect targets inside added nodes.
      for (let i = 0; i < added.length; i++) {
        const node = added[i];
        const t = collectTargets(node).slice(0, 40); // limit per mutation burst
        t.forEach(prepareEl);
        t.forEach((el) => io.observe(el));
      }
    });

    obs.observe(revealRoot, { childList: true, subtree: true });
  }

  function waitForContentReady() {
    // Some pages hide content initially (opacity:0 or display:none). Wait until it becomes visible-ish.
    const mc =
      document.getElementById('main-content') ||
      document.getElementById('main') ||
      document.getElementById('landing-content');
    if (!mc) return Promise.resolve();

    const start = Date.now();
    const maxWaitMs = 3800;
    const minWaitMs = 600;

    function check() {
      const st = window.getComputedStyle(mc);
      const op = parseFloat(st.opacity || '1');
      const rects = mc.getClientRects ? mc.getClientRects() : [];
      const visible = st.display !== 'none' && op > 0.18 && rects.length > 0;
      const hasAny = mc.querySelector && mc.querySelector('*');
      return visible && !!hasAny && Date.now() - start > minWaitMs;
    }

    return new Promise((resolve) => {
      if (check()) return resolve();

      const timer = setInterval(() => {
        if (check() || Date.now() - start > maxWaitMs) {
          clearInterval(timer);
          resolve();
        }
      }, 60);
    });
  }

  function waitForFonts() {
    try {
      if (document.fonts && document.fonts.ready) return document.fonts.ready;
    } catch (e) {}
    return Promise.resolve();
  }

  function waitForLoadEvent() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') return resolve();
      window.addEventListener('load', function () { resolve(); }, { once: true });
    });
  }

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('hidden');
    setTimeout(() => {
      try { preloader.style.display = 'none'; } catch (e) {}
    }, 420);
  }

  // Boot sequence
  waitForLoadEvent()
    .then(waitForFonts)
    .then(waitForContentReady)
    .then(function () {
      // Ensure we can animate once the page is visible.
      if (!prefersReducedMotion) {
        // Prepare once before IO reveals elements.
        try {
          observeVisibleTargets(Array.from(revealRoot.querySelectorAll(selectors)).slice(0, maxTargets));
        } catch (e) {}
      }

      startObserver();

      // Now that children are prepared (opacity: 0), reveal the root smoothly.
      if (shouldHideContent) {
        try {
          revealRoot.style.setProperty('opacity', '1', 'important');
        } catch (e) {}
      }

      hidePreloader();
    })
    .catch(function () {
      hidePreloader();
      startObserver();
    });
})();