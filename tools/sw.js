// ════════════════════════════════════════════════════════════════
//  KSpider Connect — Service Worker
//  Site: kspiderai.in
//  File: /sw.js  (place in ROOT folder, same level as HTML file)
//  Strategy:
//    • Shell / HTML  → Network-first, fallback to cache
//    • Fonts / CSS   → Cache-first (long-lived assets)
//    • Firebase / AI / Ads / Analytics → Network only (bypass SW)
//  Author: Gaurang Raval — KSpider AI | 2025
// ════════════════════════════════════════════════════════════════

const CACHE_NAME    = 'kspider-v5';
const OFFLINE_PAGE  = './KSpider_Job_Placement.html';

// ── Assets to pre-cache on install ────────────────────────────
const PRECACHE = [
  './',
  './KSpider_Job_Placement.html',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Sora:wght@400;600;700;800&display=swap',
];

// ── Domains that MUST go to network (never cache) ─────────────
const BYPASS_DOMAINS = [
  'firebaseio.com',
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseapp.com',
  'googleapis.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'pagead2.google.com',
  'razorpay.com',
  'puter.com',
  'js.puter.com',
  'kspiderai.workers.dev',   // KS Proxy API
  'nominatim.openstreetmap.org', // Geo reverse geocoding
  'ui-avatars.com',
  'pravatar.cc',
];

// ── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing KSpider v5...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          PRECACHE.map(url =>
            cache.add(url).catch(err =>
              console.warn('[SW] Pre-cache skip:', url, err.message)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] Pre-cache done.');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating KSpider v5...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim()) // Take control of all pages
  );
});

// ── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests
  if (req.method !== 'GET') return;

  // 2. Bypass SW for network-only domains (Firebase, Ads, AI etc.)
  if (BYPASS_DOMAINS.some(d => url.hostname.includes(d))) return;

  // 3. Bypass chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) return;

  // 4. Fonts & Google Fonts CSS → Cache-first
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 5. Same-origin static assets (images, icons, css, js) → Cache-first
  if (
    url.origin === self.location.origin &&
    (
      req.destination === 'image'  ||
      req.destination === 'style'  ||
      req.destination === 'script' ||
      req.destination === 'font'   ||
      url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|gif|css|js|woff2?)$/)
    )
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 6. HTML navigation & same-origin requests → Network-first
  event.respondWith(networkFirst(req));
});

// ── STRATEGY: Cache-first ──────────────────────────────────────
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (err) {
    console.warn('[SW] Cache-first fetch failed:', req.url);
    return new Response('Resource unavailable offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ── STRATEGY: Network-first ────────────────────────────────────
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (err) {
    // Offline fallback
    const cached = await caches.match(req);
    if (cached) {
      console.log('[SW] Offline — serving from cache:', req.url);
      return cached;
    }

    // Final fallback: serve the app shell
    const shell = await caches.match(OFFLINE_PAGE);
    if (shell) return shell;

    return new Response(
      `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>KSpider Connect — Offline</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:sans-serif;background:#0A0F1E;color:#E2E8F0;
             display:flex;align-items:center;justify-content:center;
             min-height:100vh;text-align:center;padding:24px;}
        .box{max-width:340px;}
        .icon{font-size:56px;margin-bottom:16px;}
        h1{font-size:20px;font-weight:800;margin-bottom:8px;color:#0A84FF;}
        p{font-size:13px;color:#94A3B8;line-height:1.6;margin-bottom:20px;}
        button{padding:12px 28px;background:#0A84FF;color:#fff;border:none;
               border-radius:99px;font-size:13px;font-weight:700;cursor:pointer;}
      </style></head>
      <body><div class="box">
        <div class="icon">🕷️</div>
        <h1>You're Offline</h1>
        <p>KSpider Connect needs internet to load live jobs and posts.<br>
        Please check your connection and try again.</p>
        <button onclick="location.reload()">🔄 Retry</button>
      </div></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ── MESSAGE HANDLER (force update from app) ────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() =>
      console.log('[SW] Cache cleared on request.')
    );
  }
});
