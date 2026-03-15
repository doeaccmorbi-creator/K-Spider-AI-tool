// ═══════════════════════════════════════════════════════════════
// K SPIDER AI TOOL — FIREBASE CONFIG + CORE AUTH SYSTEM
// File: firebase-config.js  |  Version: 1.0 Production
// ⚠️ REPLACE ALL PLACEHOLDER VALUES WITH YOUR ACTUAL FIREBASE CONFIG
// ═══════════════════════════════════════════════════════════════

// ── FIREBASE PROJECT CONFIG (LIVE ✅) ──
// Project: kspideraimain (NEW — Spark plan, Firestore enabled)
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBHNEgIT6lIZNAWcd5Ssbr4BpBHKzqETk8",
  authDomain:        "kspideraimain.firebaseapp.com",
  projectId:         "kspideraimain",
  storageBucket:     "kspideraimain.firebasestorage.app",
  messagingSenderId: "940003391760",
  appId:             "1:940003391760:web:8617000465b6991d348d95"
};

// ── ADMIN EMAIL WHITELIST ──
// Ye emails admin dashboard access kar sakte hain
const ADMIN_EMAILS = [
  "kspider221206@gmail.com"
];

// ── RAZORPAY CONFIG ──
// Get from: Razorpay Dashboard → Settings → API Keys
const RAZORPAY_KEY_ID = "rzp_live_XXXXXXXXXXXXXXXX"; // Replace with your live key

// ── PLAN PRICES (in paise — multiply INR × 100) ──
const PLAN_PRICES = {
  premium_monthly:  49900,   // ₹499/month
  premium_yearly:   299900,  // ₹2999/year
  franchise_monthly: 199900, // ₹1999/month
  franchise_yearly:  999900  // ₹9999/year
};

// ── TOOL ACCESS MATRIX ──
// Define which plan can access which tools
const TOOL_ACCESS = {
  free: [
    "image-compressor",
    "qr-generator",
    "word-counter",
    "color-picker"
  ],
  premium: [
    "whatsapp-sender",
    "wa-broadcast-pro",
    "resume-builder",
    "passport-photo",
    "bg-remover",
    "image-editor",
    "ai-teacher",
    "doctor-ai"
  ],
  franchise: [
    // franchise gets ALL tools — both free + premium + exclusive
    "all"
  ]
};

// ═══════════════════════════════════════════════════════════════
// FIREBASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════
(function initKSpiderFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('[KSpider] Firebase SDK not loaded. Include Firebase scripts before firebase-config.js');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  // Expose globally
  window.KS = window.KS || {};
  window.KS.db   = firebase.firestore();
  window.KS.auth = firebase.auth();
  window.KS.ADMIN_EMAILS   = ADMIN_EMAILS;
  window.KS.TOOL_ACCESS    = TOOL_ACCESS;
  window.KS.PLAN_PRICES    = PLAN_PRICES;
  window.KS.RAZORPAY_KEY   = RAZORPAY_KEY_ID;

  // Enable Firestore offline persistence
  window.KS.db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn('[KSpider] Firestore persistence: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('[KSpider] Firestore persistence: browser not supported');
      }
    });

  console.log('[KSpider] Firebase initialized ✓');
})();

// ═══════════════════════════════════════════════════════════════
// HELPER: Check if current user is admin
// ═══════════════════════════════════════════════════════════════
window.KS.isAdmin = function(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Check if user can access a specific tool
// ═══════════════════════════════════════════════════════════════
window.KS.canAccessTool = function(toolId, planType) {
  if (!planType) planType = 'free';
  if (planType === 'franchise') return true;
  if (planType === 'premium') {
    return TOOL_ACCESS.premium.includes(toolId) || TOOL_ACCESS.free.includes(toolId);
  }
  return TOOL_ACCESS.free.includes(toolId);
};
