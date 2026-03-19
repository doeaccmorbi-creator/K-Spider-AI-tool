// ═══════════════════════════════════════════════════════════════
// K SPIDER AI TOOL — FIREBASE CONFIG + CORE AUTH SYSTEM
// File: firebase-config.js  |  Version: 2.0 Production
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
// Razorpay Dashboard → Settings → API Keys → Live Key
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
// FIREBASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════
(function initKSpiderFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('[KSpider] Firebase SDK not loaded.');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  // Global KS object
  window.KS = window.KS || {};
  window.KS.db            = firebase.firestore();
  window.KS.auth          = firebase.auth();
  window.KS.ADMIN_EMAILS  = ADMIN_EMAILS;
  window.KS.PLAN_PRICES   = PLAN_PRICES;
  window.KS.RAZORPAY_KEY  = RAZORPAY_KEY_ID;
  window.KS.UPI_ID        = UPI_ID;

  // ── Firestore offline persistence ──
  window.KS.db.enablePersistence({ synchronizeTabs: true })
    .catch(function(err) {
      if (err.code === 'failed-precondition') {
        console.warn('[KSpider] Multiple tabs open — persistence disabled');
      } else if (err.code === 'unimplemented') {
        console.warn('[KSpider] Browser does not support persistence');
      }
    });

  console.log('[KSpider] Firebase initialized ✅');
})();

// ═══════════════════════════════════════════════════════════════
// HELPER: Is current user admin?
// ═══════════════════════════════════════════════════════════════
window.KS.isAdmin = function(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Check tool access (basic plan check — no Firestore)
// For real-time Firestore check, use KS.checkUserAccess()
// ═══════════════════════════════════════════════════════════════
window.KS.canAccessTool = function(toolId, userPlan) {
  if (!userPlan || userPlan === 'free') return false; // free = no premium tools
  if (userPlan === 'franchise') return true;           // franchise = all tools
  if (userPlan === 'premium') return true;             // premium = all premium tools
  return false;
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Real-time Firestore access check with expiry validation
// Usage: KS.checkUserAccess('premium', function(allowed, reason) { ... })
// ═══════════════════════════════════════════════════════════════
window.KS.checkUserAccess = function(requiredPlan, callback) {
  var user = (typeof getUser === 'function') ? getUser() : null;
  if (!user || !user.email) { callback(false, 'not_logged_in'); return; }

  var key = user.email.replace(/[.#$\/\[\]]/g, '_');

  window.KS.db.collection('users').doc(key).get()
    .then(function(doc) {
      if (!doc.exists) { callback(false, 'no_record'); return; }

      var d = doc.data();

      // Check if account is disabled
      if (d.disabled) { callback(false, 'disabled'); return; }

      var planType = d.planType || 'free';

      // Check plan expiry for paid plans
      if (d.planExpiry && planType !== 'free') {
        var expiry = new Date(d.planExpiry);
        if (expiry < new Date()) { callback(false, 'expired'); return; }
      }

      // Sync latest plan data to localStorage
      if (typeof getUser === 'function' && typeof saveUser === 'function') {
        var u = getUser();
        if (u) {
          u.planType   = planType;
          u.planExpiry = d.planExpiry || null;
          saveUser(u);
        }
      }

      // Check plan level
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
