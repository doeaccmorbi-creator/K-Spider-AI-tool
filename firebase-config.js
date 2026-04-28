// ═══════════════════════════════════════════════════════════════
// K SPIDER AI TOOL — FIREBASE CONFIG + CORE AUTH SYSTEM
// File: firebase-config.js  |  Version: 3.0 Production (Fixed)
// www.kspiderai.in | By Gaurang Raval & Khush Raval
// ═══════════════════════════════════════════════════════════════
 
// ── FIREBASE PROJECT CONFIG ──
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBHNEgIT6lIZNAWcd5Ssbr4BpBHKzqETk8",
  authDomain:        "kspideraimain.firebaseapp.com",
  projectId:         "kspideraimain",
  storageBucket:     "kspideraimain.firebasestorage.app",
  messagingSenderId: "940003391760",
  appId:             "1:940003391760:web:8617000465b6991d348d95"
};
 
// ── ADMIN EMAIL WHITELIST ──
const ADMIN_EMAILS = [
  "kspider221206@gmail.com"
];
 
// ── RAZORPAY CONFIG ──
const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_LIVE_KEY"; // ← Apna live key daalo
 
// ── UPI PAYMENT DETAILS ──
const UPI_ID   = "9099928877@pthdfc";
const UPI_NAME = "Raval Gaurangbhai Mukundbhai";
 
// ── PLAN PRICES (INR) ──
const PLAN_PRICES = {
  premium_yearly:    2999,
  premium_monthly:   499,
  franchise_yearly:  9999,
  franchise_monthly: 1999
};
 
// ═══════════════════════════════════════════════════════════════
// FIREBASE INITIALIZATION — v3.0
// FIX: firebase.auth() and firebase.firestore() are called only
//      AFTER checking typeof — prevents "firebase.auth is not a
//      function" race condition when auth-compat loads after app-compat
// ═══════════════════════════════════════════════════════════════
(function initKSpiderFirebase() {
 
  // ── Guard: Firebase SDK not loaded at all ──
  if (typeof firebase === 'undefined') {
    console.error('[KSpider] firebase-config.js: Firebase SDK not loaded. Retrying in 500ms...');
    setTimeout(initKSpiderFirebase, 500);
    return;
  }
 
  // ── Guard: auth-compat or firestore-compat not yet loaded ──
  // These are separate scripts — they may load after firebase-app-compat
  if (typeof firebase.auth !== 'function' || typeof firebase.firestore !== 'function') {
    console.warn('[KSpider] firebase-config.js: auth/firestore SDK not ready yet. Retrying in 200ms...');
    setTimeout(initKSpiderFirebase, 200);
    return;
  }
 
  // ── Initialize app only once ──
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
 
  // ── Build global KS object ──
  // If index.html already created window.KS, extend it — don't overwrite
  window.KS = window.KS || {};
  window.KS.db            = firebase.firestore();
  window.KS.auth          = firebase.auth();
  window.KS.ADMIN_EMAILS  = ADMIN_EMAILS;
  window.KS.PLAN_PRICES   = PLAN_PRICES;
  window.KS.RAZORPAY_KEY  = RAZORPAY_KEY_ID;
  window.KS.UPI_ID        = UPI_ID;
 
  // ── Firestore offline persistence ──
  // synchronizeTabs:true requires all tabs to use persistence — safe for single-origin apps
  // Wrapped in try-catch: some browsers/modes (private/Safari) throw silently
  try {
    window.KS.db.enablePersistence({ synchronizeTabs: true })
      .catch(function(err) {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open — only one can use persistence at a time
          console.warn('[KSpider] Persistence: multiple tabs open — disabled for this tab');
        } else if (err.code === 'unimplemented') {
          // Browser does not support IndexedDB (e.g. Firefox private mode)
          console.warn('[KSpider] Persistence: browser does not support offline cache');
        } else {
          console.warn('[KSpider] Persistence error:', err.code);
        }
      });
  } catch(e) {
    console.warn('[KSpider] enablePersistence threw:', e);
  }
 
  // ── Helper functions (defined inside IIFE so KS is guaranteed to exist) ──
 
  // Is current user admin?
  window.KS.isAdmin = function(email) {
    return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
  };
 
  // Basic plan check (no Firestore — uses localStorage value)
  // For real-time check use KS.checkUserAccess()
  window.KS.canAccessTool = function(toolId, userPlan) {
    if (!userPlan || userPlan === 'free') return false;
    if (userPlan === 'franchise') return true;
    if (userPlan === 'premium')   return true;
    return false;
  };
 
  // Real-time Firestore access check with expiry validation
  // Usage: KS.checkUserAccess('premium', function(allowed, reason) { ... })
  window.KS.checkUserAccess = function(requiredPlan, callback) {
    var user = (typeof getUser === 'function') ? getUser() : null;
    if (!user || !user.email) { callback(false, 'not_logged_in'); return; }
 
    var key = user.email.replace(/[.#$\/\[\]]/g, '_');
 
    window.KS.db.collection('users').doc(key).get()
      .then(function(doc) {
        if (!doc.exists) { callback(false, 'no_record'); return; }
 
        var d = doc.data();
 
        // Disabled account
        if (d.disabled) { callback(false, 'disabled'); return; }
 
        var planType = d.planType || 'free';
 
        // Expiry check for paid plans
        if (d.planExpiry && planType !== 'free') {
          var expiry = new Date(d.planExpiry);
          if (expiry < new Date()) { callback(false, 'expired'); return; }
        }
 
        // Sync latest plan to localStorage
        if (typeof getUser === 'function' && typeof saveUser === 'function') {
          var u = getUser();
          if (u) {
            u.planType   = planType;
            u.planExpiry = d.planExpiry || null;
            saveUser(u);
          }
        }
 
        // Plan level check
        if (requiredPlan === 'premium') {
          if (planType === 'premium' || planType === 'franchise') {
            callback(true, planType);
          } else {
            callback(false, 'upgrade_required');
          }
        } else if (requiredPlan === 'franchise') {
          if (planType === 'franchise') {
            callback(true, planType);
          } else {
            callback(false, 'franchise_required');
          }
        } else {
          // Free tool — allow all verified users
          callback(true, planType);
        }
      })
      .catch(function(err) {
        console.error('[KSpider] Access check error:', err);
        // Fallback to localStorage if Firestore fails
        var u = (typeof getUser === 'function') ? getUser() : null;
        var p = u ? (u.planType || u.plan || 'free') : 'free';
        if (requiredPlan === 'premium') {
          callback(p === 'premium' || p === 'franchise', p);
        } else if (requiredPlan === 'franchise') {
          callback(p === 'franchise', p);
        } else {
          callback(true, p);
        }
      });
  };
 
  console.log('[KSpider] firebase-config.js v3.0 ready ✅');
 
})();
