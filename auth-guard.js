// ═══════════════════════════════════════════════════════════════
// K SPIDER AI TOOL — AUTH GUARD + TOOL ACCESS PROTECTION
// File: auth-guard.js  |  Add this to EVERY premium tool page
// ═══════════════════════════════════════════════════════════════
// Usage: Add to <head> of any page you want to protect:
//   <script src="firebase-config.js"></script>
//   <script src="auth-guard.js" data-tool="whatsapp-sender" data-plan="premium"></script>

(function KSpiderAuthGuard() {

  // Read config from script tag attributes
  var scriptTag     = document.currentScript || document.querySelector('script[data-tool]');
  var REQUIRED_TOOL = (scriptTag && scriptTag.getAttribute('data-tool')) || '';
  var REQUIRED_PLAN = (scriptTag && scriptTag.getAttribute('data-plan')) || 'free';
  // Plans: 'free' = any logged-in user | 'premium' = premium+ | 'franchise' = franchise only

  // ── Inject guard overlay ──
  function injectOverlay() {
    if (document.getElementById('ks-guard-overlay')) return;

    var style = document.createElement('style');
    style.textContent = `
      #ks-guard-overlay {
        position: fixed; inset: 0; z-index: 999999;
        background: rgba(248,247,244,.97);
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; gap: 0;
        font-family: 'DM Sans', -apple-system, sans-serif;
      }
      #ks-guard-overlay .guard-box {
        background: #fff;
        border: 1px solid rgba(0,0,0,.1);
        border-radius: 20px;
        padding: 48px 40px;
        max-width: 440px;
        width: 90%;
        text-align: center;
        box-shadow: 0 16px 60px rgba(0,0,0,.08);
        animation: guardIn .4s cubic-bezier(.22,1,.36,1);
      }
      @keyframes guardIn { from { transform: translateY(30px); opacity:0; } to { transform:none; opacity:1; } }
      .guard-icon { font-size: 3.5rem; margin-bottom: 16px; display: block; }
      .guard-title { font-size: 1.5rem; font-weight: 700; color: #1a1814; margin-bottom: 8px; }
      .guard-sub   { font-size: .9rem; color: #7a7468; line-height: 1.6; margin-bottom: 28px; }
      .guard-plan-badge {
        display: inline-flex; align-items: center; gap: 6px;
        background: linear-gradient(135deg, rgba(184,121,42,.1), rgba(212,146,46,.1));
        border: 1px solid rgba(184,121,42,.25);
        border-radius: 20px; padding: 5px 14px;
        font-size: .78rem; font-weight: 700;
        color: #b8792a; margin-bottom: 20px;
        text-transform: uppercase; letter-spacing: .05em;
      }
      .guard-btn {
        display: inline-block;
        width: 100%; padding: 14px;
        background: linear-gradient(135deg, #b8792a, #d4922e);
        color: #fff; border: none; border-radius: 12px;
        font-size: 1rem; font-weight: 700;
        cursor: pointer; text-decoration: none;
        margin-bottom: 10px;
        transition: opacity .2s; font-family: inherit;
      }
      .guard-btn:hover { opacity: .9; }
      .guard-btn-sec {
        display: inline-block; width: 100%; padding: 12px;
        background: transparent; color: #7a7468;
        border: 1.5px solid rgba(0,0,0,.1);
        border-radius: 12px; font-size: .88rem;
        font-weight: 600; cursor: pointer;
        text-decoration: none; transition: all .2s; font-family: inherit;
      }
      .guard-btn-sec:hover { border-color: rgba(184,121,42,.3); color: #b8792a; background: rgba(184,121,42,.05); }
      .guard-spinner {
        width: 40px; height: 40px;
        border: 3px solid rgba(184,121,42,.2);
        border-top-color: #d4922e;
        border-radius: 50%;
        animation: spin .7s linear infinite;
        margin: 0 auto;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'ks-guard-overlay';
    overlay.innerHTML = '<div class="guard-box"><div class="guard-spinner"></div></div>';
    document.body.appendChild(overlay);
  }

  // ── Show loading state ──
  function showLoading() {
    injectOverlay();
  }

  // ── Remove overlay — allow access ──
  function grantAccess() {
    var ov = document.getElementById('ks-guard-overlay');
    if (ov) {
      ov.style.transition = 'opacity .3s';
      ov.style.opacity = '0';
      setTimeout(function() { ov.remove(); }, 300);
    }
  }

  // ── Show "not logged in" modal ──
  function showLoginRequired() {
    var ov = document.getElementById('ks-guard-overlay');
    if (!ov) return;
    ov.querySelector('.guard-box').innerHTML = `
      <span class="guard-icon">🔐</span>
      <div class="guard-title">Login Required</div>
      <div class="guard-sub">
        You need to be logged in to access K Spider AI tools.<br>
        Create a free account in seconds!
      </div>
      <a class="guard-btn" href="auth.html?redirect=${encodeURIComponent(window.location.href)}">
        🚀 Login / Register Free
      </a>
      <a class="guard-btn-sec" href="index.html">← Back to Home</a>
    `;
  }

  // ── Show "upgrade required" modal ──
  function showUpgradeRequired(currentPlan) {
    var ov = document.getElementById('ks-guard-overlay');
    if (!ov) return;

    var planLabel = REQUIRED_PLAN === 'franchise' ? 'Franchise' : 'Premium';
    var price     = REQUIRED_PLAN === 'franchise' ? '₹1,999/mo' : '₹499/mo';

    ov.querySelector('.guard-box').innerHTML = `
      <span class="guard-icon">💎</span>
      <div class="guard-plan-badge">🔒 ${planLabel} Tool</div>
      <div class="guard-title">Upgrade to Unlock</div>
      <div class="guard-sub">
        This tool requires a <strong>${planLabel} Plan</strong>.<br>
        Your current plan: <strong>${(currentPlan || 'Free').charAt(0).toUpperCase() + (currentPlan||'free').slice(1)}</strong><br>
        Upgrade now and unlock all premium tools.
      </div>
      <button class="guard-btn" onclick="openPricingModal('${REQUIRED_PLAN}')">
        ⚡ Upgrade to ${planLabel} — ${price}
      </button>
      <a class="guard-btn-sec" href="index.html">← Browse Free Tools</a>
    `;
  }

  // ── Main guard logic ──
  function runGuard() {
    showLoading();

    // Wait for Firebase to be ready
    var tries = 0;
    var waitForFirebase = setInterval(function() {
      tries++;
      if (tries > 50) {
        clearInterval(waitForFirebase);
        showLoginRequired();
        return;
      }
      if (typeof window.KS === 'undefined' || typeof firebase === 'undefined') return;
      clearInterval(waitForFirebase);

      KS.auth.onAuthStateChanged(function(user) {
        if (!user) {
          showLoginRequired();
          return;
        }

        // User is logged in — check plan
        if (REQUIRED_PLAN === 'free') {
          grantAccess();
          return;
        }

        // Fetch user plan from Firestore
        KS.db.collection('users').doc(user.uid).get()
          .then(function(doc) {
            if (!doc.exists) { showLoginRequired(); return; }

            var data     = doc.data();
            var planType = data.planType || 'free';
            var allowed  = false;

            if (REQUIRED_PLAN === 'premium') {
              allowed = (planType === 'premium' || planType === 'franchise' || KS.isAdmin(data.email));
            } else if (REQUIRED_PLAN === 'franchise') {
              allowed = (planType === 'franchise' || KS.isAdmin(data.email));
            } else {
              allowed = true;
            }

            // Check specific tool access
            if (REQUIRED_TOOL && !KS.canAccessTool(REQUIRED_TOOL, planType) && !KS.isAdmin(data.email)) {
              allowed = false;
            }

            if (allowed) {
              grantAccess();
              // Expose current user globally
              window.KS_USER = data;
            } else {
              showUpgradeRequired(planType);
            }
          })
          .catch(function(err) {
            console.error('[KSpider Guard] Firestore error:', err);
            showLoginRequired();
          });
      });
    }, 100);
  }

  // ── Run on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runGuard);
  } else {
    runGuard();
  }

})();

// ═══════════════════════════════════════════════════════════════
// GLOBAL: Logout function (add to nav logout button)
// ═══════════════════════════════════════════════════════════════
window.KS_logout = function() {
  if (typeof firebase === 'undefined') return;
  firebase.auth().signOut().then(function() {
    sessionStorage.clear();
    window.location.href = 'auth.html';
  });
};

// ═══════════════════════════════════════════════════════════════
// GLOBAL: Get current user plan (for UI elements in index.html)
// ═══════════════════════════════════════════════════════════════
window.KS_getCurrentUser = function(callback) {
  var waitForKS = setInterval(function() {
    if (typeof window.KS === 'undefined') return;
    clearInterval(waitForKS);

    KS.auth.onAuthStateChanged(function(user) {
      if (!user) { callback(null, null); return; }
      KS.db.collection('users').doc(user.uid).get()
        .then(function(doc) {
          callback(user, doc.exists ? doc.data() : null);
        })
        .catch(function() { callback(user, null); });
    });
  }, 100);
};

// ═══════════════════════════════════════════════════════════════
// SESSION EXPIRY — Auto logout after 8 hours of inactivity
// ═══════════════════════════════════════════════════════════════
(function sessionExpiry() {
  var SESSION_HOURS = 8;
  var SESSION_KEY   = 'ks_last_active';
  var SESSION_MS    = SESSION_HOURS * 60 * 60 * 1000;

  function updateActivity() {
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
  }

  function checkExpiry() {
    var last = parseInt(sessionStorage.getItem(SESSION_KEY) || '0');
    if (last && (Date.now() - last > SESSION_MS)) {
      if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(function() {
          sessionStorage.clear();
          window.location.href = 'auth.html?expired=1';
        });
      }
    }
  }

  // Update on user interaction
  ['click','keypress','mousemove','touchstart'].forEach(function(e) {
    document.addEventListener(e, updateActivity, { passive: true });
  });

  updateActivity();
  setInterval(checkExpiry, 60000); // Check every minute
})();
