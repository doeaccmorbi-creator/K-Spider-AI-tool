/**
 * ════════════════════════════════════════════════════════
 * K SPIDER AI — TOOL ACCESS GUARD v3.0
 * ════════════════════════════════════════════════════════
 * Upload this file to root: /tool-guard.js
 * Add in each tool HTML <head>:
 *   <script src="/tool-guard.js"></script>
 * OR from /tools/ subfolder:
 *   <script src="../tool-guard.js"></script>
 *
 * v3.0 CHANGE: No longer hides/blocks page content based on
 * referrer or session token. Full-page content-hiding based on
 * how a visitor arrived is a "cloaking" pattern that browser
 * security scanners (Microsoft Defender SmartScreen, Google
 * Safe Browsing) flag as phishing-like behavior — this caused
 * the whole site to be reported as a dangerous/unsafe site.
 *
 * Instead, this version shows a small, non-blocking banner for
 * visitors who arrived without going through kspiderai.in,
 * inviting them to the main site, but lets the tool itself load
 * and function normally. This keeps shared/copied links working
 * (as the team requires) while still funneling direct traffic
 * back to the main platform for registration/login.
 * ════════════════════════════════════════════════════════
 */
(function KSpiderToolGuard() {
  'use strict';

  var HOME_URL = 'https://www.kspiderai.in/';

  function isLocalDev() {
    var h = window.location.hostname;
    return window.location.protocol === 'file:' ||
           h === 'localhost' || h === '127.0.0.1' ||
           h.indexOf('.local') !== -1;
  }

  function cameFromSite() {
    var ref = document.referrer || '';
    return ref.indexOf('kspiderai.in') !== -1;
  }

  function showSoftBanner() {
    function render() {
      var bar = document.createElement('div');
      bar.id = 'ks-direct-visit-banner';
      bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;background:linear-gradient(135deg,#b8792a,#d4922e);color:#fff;font-family:"DM Sans",-apple-system,sans-serif;font-size:.82rem;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;box-shadow:0 -4px 16px rgba(0,0,0,.25);';
      bar.innerHTML =
        '<span>🕷️ Yeh tool <strong>K Spider AI</strong> platform ka hissa hai — full features ke liye register/login karein.</span>' +
        '<a href="' + HOME_URL + '" style="background:rgba(255,255,255,.2);color:#fff;padding:5px 14px;border-radius:18px;text-decoration:none;font-weight:700;white-space:nowrap;">Go to K Spider AI →</a>' +
        '<button id="ks-banner-close" style="background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;line-height:1;padding:0 4px;opacity:.8;">✕</button>';
      document.body.appendChild(bar);
      var closeBtn = document.getElementById('ks-banner-close');
      if (closeBtn) closeBtn.onclick = function(){ bar.remove(); };
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); }
    else { render(); }
  }

  if (!isLocalDev() && !cameFromSite()) {
    showSoftBanner();
  }

})();
