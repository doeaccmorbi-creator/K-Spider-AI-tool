// ═══════════════════════════════════════════════════════════════
// K SPIDER AI TOOL — SECURITY HARDENING
// File: security.js  |  Add to index.html BEFORE </body>
// ═══════════════════════════════════════════════════════════════

(function KSpiderSecurity() {
  'use strict';

  // ──────────────────────────────────
  // 1. DISABLE RIGHT CLICK
  // ──────────────────────────────────
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // ──────────────────────────────────
  // 2. DISABLE KEY COMBINATIONS
  // ──────────────────────────────────
  document.addEventListener('keydown', function(e) {
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
    // Ctrl+C (Copy) — only block on non-input elements
    if (e.ctrlKey && e.key === 'c') {
      var tag = document.activeElement.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault(); return false;
      }
    }
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
    // Ctrl+Shift+C (Inspector)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); return false; }
    // F12 (DevTools)
    if (e.key === 'F12') { e.preventDefault(); return false; }
    // Ctrl+S (Save page)
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); return false; }
    // Ctrl+P (Print)
    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); return false; }
    // Ctrl+A (Select All — only block outside inputs)
    if (e.ctrlKey && e.key === 'a') {
      var activeTag = document.activeElement.tagName.toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        e.preventDefault(); return false;
      }
    }
  });

  // ──────────────────────────────────
  // 3. DISABLE TEXT SELECTION (on non-input elements)
  // ──────────────────────────────────
  document.addEventListener('selectstart', function(e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault(); return false;
    }
  });

  // ──────────────────────────────────
  // 4. DISABLE DRAG
  // ──────────────────────────────────
  document.addEventListener('dragstart', function(e) {
    e.preventDefault(); return false;
  });

  // ──────────────────────────────────
  // 5. DEVTOOLS DETECTION (basic)
  // ──────────────────────────────────
  var _devWarned = false;
  var _devCheck = setInterval(function() {
    var threshold = 160;
    if (
      window.outerWidth  - window.innerWidth  > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      if (!_devWarned) {
        _devWarned = true;
        console.clear();
        console.log('%c⚠️ WARNING', 'color:red;font-size:3rem;font-weight:800;');
        console.log('%cThis is a K Spider AI protected zone.\nUnauthorized inspection is prohibited.', 'color:#b8792a;font-size:1rem;');
        // Optionally blur/redirect
        // document.body.style.filter = 'blur(20px)';
      }
    } else {
      _devWarned = false;
    }
  }, 1000);

  // ──────────────────────────────────
  // 6. CONSOLE WARNING MESSAGE
  // ──────────────────────────────────
  try {
    console.log('%c🕷️ K Spider AI Tool', 'color:#b8792a;font-size:1.5rem;font-weight:800;');
    console.log('%cDeveloped by Gaurang Raval & Khush Raval', 'color:#7a7468;font-size:.9rem;');
    console.log('%c⚠️ WARNING: Do not paste any code here. This could allow attackers to steal your account.', 'color:#dc2626;font-size:.85rem;font-weight:600;');
  } catch(e) {}

  // ──────────────────────────────────
  // 7. ANTI-IFRAME / CLICKJACKING
  // ──────────────────────────────────
  if (window.top !== window.self) {
    window.top.location.href = window.self.location.href;
  }

  // ──────────────────────────────────
  // 8. IMAGE PROTECTION
  // ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img').forEach(function(img) {
      img.setAttribute('draggable', 'false');
      img.style.userSelect = 'none';
      img.style.webkitUserSelect = 'none';
      img.style.pointerEvents = 'none';
    });
  });

  // ──────────────────────────────────
  // 9. ANTI-SCRAPING: Add random delays
  //    to Firestore calls (rate limit UX)
  // ──────────────────────────────────
  window.KS_rateLimiter = (function() {
    var requests = {};
    var LIMIT = 20;  // max requests
    var WINDOW = 60000; // per minute

    return function(key) {
      var now = Date.now();
      if (!requests[key]) requests[key] = [];
      requests[key] = requests[key].filter(function(t) { return now - t < WINDOW; });
      if (requests[key].length >= LIMIT) return false;
      requests[key].push(now);
      return true;
    };
  })();

  // ──────────────────────────────────
  // 10. SECURE TOKEN STORAGE
  //     Wrapper around sessionStorage with obfuscation
  // ──────────────────────────────────
  window.KS_storage = {
    set: function(key, value) {
      try {
        var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(value))));
        sessionStorage.setItem('ks_' + key, encoded);
      } catch(e) {}
    },
    get: function(key) {
      try {
        var raw = sessionStorage.getItem('ks_' + key);
        if (!raw) return null;
        return JSON.parse(decodeURIComponent(escape(atob(raw))));
      } catch(e) { return null; }
    },
    remove: function(key) {
      sessionStorage.removeItem('ks_' + key);
    },
    clear: function() {
      Object.keys(sessionStorage).forEach(function(k) {
        if (k.startsWith('ks_')) sessionStorage.removeItem(k);
      });
    }
  };

  // ──────────────────────────────────
  // 11. CONTENT SECURITY POLICY (injected via meta)
  // ──────────────────────────────────
  // NOTE: For production, set these as HTTP headers via _headers file (GitHub Pages)
  // The meta tag version is added here as fallback
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    var cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    cspMeta.setAttribute('content',
      "default-src 'self' https:; " +
      "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net https://checkout.razorpay.com https://www.googletagmanager.com https://apis.google.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.razorpay.com; " +
      "frame-src https://checkout.razorpay.com; " +
      "object-src 'none';"
    );
    document.head.appendChild(cspMeta);
  }

  console.log('[KSpider] Security module loaded ✓');

})();
