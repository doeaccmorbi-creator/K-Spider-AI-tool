/**
 * ============================================================
 *  K SPIDER AI TOOL — UNIVERSAL TOOL ACCESS GUARD
 *  File: ks-guard.js
 *  Version: 1.1.0
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
 *
 *  ────────────────────────────────────────────────────────
 *  v1.1.0 change (kept 100% backward compatible with v1.0.0):
 *
 *  v1.0.0 hid EVERY page and redirected EVERY unverified
 *  visitor to index.html — no exception. That breaks any tool
 *  that hands out its own SHAREABLE GUEST LINKS meant to be
 *  opened by people who have never registered on K Spider AI
 *  at all (e.g. RTO Exam Pro's "RTO Agent promotional link",
 *  format ?k=SHORTCODE&r=REFID — a random person on WhatsApp
 *  clicks it and should see the tool immediately, not get
 *  bounced to a signup page).
 *
 *  v1.1.0 adds ONE narrow, additive exception: if the URL
 *  carries a recognised "guest link" query param (see
 *  GUEST_LINK_PARAMS below), the guard skips BOTH the
 *  visibility-hide and the redirect and lets that page render
 *  normally — exactly as if the guard script weren't there for
 *  that one visit. Every other visit (no such param) behaves
 *  IDENTICALLY to v1.0.0: hidden until verified, redirected if
 *  not. No tool needs any change to opt in — a tool just needs
 *  its shareable link to use one of these param names.
 *
 *  Currently recognised guest-link params: k, ref, code, promo.
 *  Add more here (one line) if a future tool needs a different
 *  name — never remove one already in use by a live tool.
 *  ────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────
  // Index file ka path (tool file ki location ke hisaab se adjust karo)
  // Agar tools/ folder mein hain to '../index.html' sahi hai
  var INDEX_URL = '../index.html';

  // localStorage key (index.html ke saath match hona chahiye)
  var STORAGE_KEY = 'ks_u';

  // Query params jo "shareable guest link" maane jaate hain —
  // in mein se KOI bhi mile to guard is visit ko chhod deta hai.
  var GUEST_LINK_PARAMS = ['k', 'ref', 'code', 'promo'];
  // ────────────────────────────────────────────────────────

  function isGuestLink() {
    try {
      var qs = window.location.search || '';
      if (!qs) return false;
      var params = new URLSearchParams(qs);
      for (var i = 0; i < GUEST_LINK_PARAMS.length; i++) {
        var v = params.get(GUEST_LINK_PARAMS[i]);
        if (v && v.trim() !== '') return true;
      }
      return false;
    } catch (e) {
      return false;   // agar URLSearchParams fail ho (bahut purana browser), safe default = normal guard chale
    }
  }

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

  // ── Shareable guest link -> skip the guard entirely for this visit ──
  if (isGuestLink()) return;

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
