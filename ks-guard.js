/**
 * ============================================================
 *  K SPIDER AI TOOL — UNIVERSAL TOOL ACCESS GUARD
 *  File: ks-guard.js
 *  Version: 1.0.0
 *
 *  HOW TO USE:
 *  Paste this ONE line inside <head> of EVERY tool HTML file:
 *  <script src="../ks-guard.js"></script>
 *
 *  (Agar tool file tools/ folder mein hai to "../ks-guard.js")
 *  (Agar same root mein hai to "ks-guard.js")
 *
 *  Yeh script automatically:
 *  ✅ Check karegi ki user registered + email verified hai
 *  ✅ Nahi hone par index.html pe redirect karegi
 *  ✅ Registration modal auto-open karegi
 *  ✅ Page content tab tak HIDE rahega jab tak verify na ho
 * ============================================================
 */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────
  // Index file ka path (tool file ki location ke hisaab se adjust karo)
  // Agar tools/ folder mein hain to '../index.html' sahi hai
  var INDEX_URL = '../index.html';

  // localStorage key (index.html ke saath match hona chahiye)
  var STORAGE_KEY = 'ks_u';
  // ────────────────────────────────────────────────────────

  function getUser() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed.v || null;
    } catch (e) {
      return null;
    }
  }

  function isVerified() {
    var u = getUser();
    return !!(u && u.verified === true);
  }

  function redirectToRegister() {
    // Redirect to index with a flag so registration modal auto-opens
    window.location.replace(INDEX_URL + '?action=register&from=' + encodeURIComponent(window.location.pathname));
  }

  // ── Immediately hide body content to prevent flash ──
  document.documentElement.style.visibility = 'hidden';

  // ── Run guard as soon as DOM is ready ──
  function runGuard() {
    if (!isVerified()) {
      redirectToRegister();
      return;
    }
    // User is verified — show the page
    document.documentElement.style.visibility = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runGuard);
  } else {
    runGuard();
  }

})();
