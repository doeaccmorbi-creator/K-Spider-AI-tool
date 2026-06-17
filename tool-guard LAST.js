/**
 * ════════════════════════════════════════════════════════
 * K SPIDER AI — TOOL ACCESS GUARD v2.1
 * ════════════════════════════════════════════════════════
 * Upload this file to root: /tool-guard.js
 * Add in each tool HTML <head>:
 *   <script src="/tool-guard.js"></script>
 * OR from /tools/ subfolder:
 *   <script src="../tool-guard.js"></script>
 * ════════════════════════════════════════════════════════
 */
(function KSpiderToolGuard() {
  'use strict';

  var TOKEN_KEY  = 'ks_tool_token';
  var EXPIRY_KEY = 'ks_tool_exp';
  var HOME_URL   = 'https://www.kspiderai.in/';

  function showBlocked() {
    if (document.body) document.body.style.display = 'none';
    function render() {
      document.body.style.cssText = 'display:flex!important;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0f0e0c;color:#f0ede8;font-family:"DM Sans",-apple-system,sans-serif;text-align:center;padding:24px;margin:0;';
      document.body.innerHTML =
        '<div style="max-width:420px;">'+
        '<div style="font-size:3.5rem;margin-bottom:16px;">🔐</div>'+
        '<h1 style="font-size:1.3rem;font-weight:800;color:#f87171;margin-bottom:10px;">Direct Access Blocked</h1>'+
        '<p style="font-size:.85rem;color:#8a8479;line-height:1.75;margin-bottom:8px;">Yeh tool sirf <strong style="color:#d4922e;">K Spider AI</strong> platform ke through access kiya ja sakta hai.</p>'+
        '<p style="font-size:.78rem;color:#5a5650;line-height:1.7;margin-bottom:24px;">Direct URL se tool open nahi hoga.<br>Website pe jakar register/login karein aur wahan se tool launch karein.</p>'+
        '<a href="'+HOME_URL+'" style="display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:linear-gradient(135deg,#b8792a,#d4922e);color:#fff;border-radius:12px;text-decoration:none;font-weight:800;font-size:.9rem;box-shadow:0 4px 16px rgba(184,121,42,.35);">🕷️ Go to K Spider AI</a>'+
        '<div style="margin-top:16px;font-size:.7rem;color:#3a3630;">www.kspiderai.in</div>'+
        '</div>';
      document.title = 'Access Blocked — K Spider AI';
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); }
    else { render(); }
  }

  function isLocalDev() {
    var h = window.location.hostname;
    return window.location.protocol === 'file:' ||
           h === 'localhost' || h === '127.0.0.1' ||
           h.indexOf('.local') !== -1;
  }

  function checkAccess() {
    if (isLocalDev()) return true;

    // Check referrer
    var ref = document.referrer || '';
    if (ref.indexOf('kspiderai.in') !== -1) return true;

    // Check session token
    var token = '', expiry = 0;
    try {
      token  = sessionStorage.getItem(TOKEN_KEY)  || '';
      expiry = parseInt(sessionStorage.getItem(EXPIRY_KEY) || '0');
    } catch(e) { return true; }

    var hasToken  = token.length > 10 && token.indexOf('kst_') === 0;
    var tokenOk   = hasToken && expiry > Date.now();

    // Clear after use
    if (hasToken) {
      try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(EXPIRY_KEY); } catch(e) {}
    }

    return tokenOk;
  }

  if (!checkAccess()) {
    if (document.head) {
      var s = document.createElement('style');
      s.textContent = 'body,html{display:none!important}';
      document.head.appendChild(s);
    }
    showBlocked();
    window.stop && window.stop();
  }

})();
