// ══════════════════════════════════════════════════════════
// K SPIDER AI — AUTH GUARD + PLAN ENFORCER
// Include this FIRST in doctor.html before any other script
// ══════════════════════════════════════════════════════════

// Firebase config — same as login page
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Init Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const _ksAuth = firebase.auth();
const _ksDb   = firebase.firestore();

// Plan limits
const KS_PLANS = {
  basic:   { rxLimit: 50,     features: ['rx','history'], label: 'Basic', price: '₹1,499/yr' },
  pro:     { rxLimit: 200,    features: ['rx','drug-db','report-interp','history','clinical-scores','vitals-tracker','rx-templates','disease-explorer','tools','followup'], label: 'Pro ⭐', price: '₹2,999/yr' },
  premium: { rxLimit: 999999, features: ['rx','drug-db','report-interp','history','clinical-scores','vitals-tracker','rx-templates','disease-explorer','tools','followup','saas-billing','saas-appointments','adv-opd-queue','adv-appointments','adv-eprescription','adv-ai-diagnosis','adv-patient-engagement','adv-clinic-admin'], label: 'Premium', price: '₹4,999/yr' },
  trial:   { rxLimit: 20,     features: ['rx','drug-db','report-interp','history','clinical-scores','vitals-tracker','disease-explorer','tools'], label: 'Trial', price: 'Free Trial' }
};

// Current user session
window.KS_USER = null;

// Show blocking loading screen until auth resolves
document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', `
    <div id="ks-auth-loader" style="position:fixed;inset:0;z-index:99999;background:#0b2545;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;font-family:'DM Sans',sans-serif;">
      <div style="font-size:36px">🕷️</div>
      <div style="font-size:18px;font-weight:700;color:white;">K Spider Doctor AI</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);">Verifying your account...</div>
      <div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.15);border-top-color:#00c9a7;border-radius:50%;animation:ksspin 0.8s linear infinite;margin-top:8px;"></div>
      <style>@keyframes ksspin{to{transform:rotate(360deg)}}</style>
    </div>
  `);
});

_ksAuth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const snap = await _ksDb.collection('doctors').doc(user.uid).get();
    if (!snap.exists) { window.location.href = 'index.html'; return; }
    const data = snap.data();

    // Check status
    if (data.status === 'suspended') {
      showBlockScreen('suspended');
      return;
    }
    if (data.status === 'expired') {
      showBlockScreen('expired', data.plan);
      return;
    }
    // Check trial expiry
    if (data.status === 'trial' && data.trialEndsAt) {
      const trialEnd = data.trialEndsAt.toDate ? data.trialEndsAt.toDate() : new Date(data.trialEndsAt);
      if (new Date() > trialEnd) {
        await _ksDb.collection('doctors').doc(user.uid).update({ status: 'expired' });
        showBlockScreen('expired', data.plan);
        return;
      }
    }

    // Set global user
    window.KS_USER = {
      uid: user.uid,
      email: user.email,
      name: data.name || 'Doctor',
      qual: data.qual || 'MBBS',
      plan: data.plan || 'basic',
      status: data.status,
      rxCount: data.rxCount || 0,
      rxLimit: data.rxLimit || KS_PLANS[data.plan]?.rxLimit || 50,
      clinic: data.clinic || '',
      phone: data.phone || '',
      reg: data.reg || ''
    };

    // Auto-fill doctor profile in localStorage from Firestore
    const profile = {
      name: data.name || '',
      qual: data.qual || 'MBBS',
      spec: data.spec || 'General Physician',
      reg: data.reg || '',
      clinic: data.clinic || '',
      address: data.address || '',
      phone: data.phone || '',
      email: user.email || '',
      whatsapp: data.whatsapp || data.phone || ''
    };
    localStorage.setItem('doctor_profile', JSON.stringify(profile));

    // Update topbar with user info
    updateTopbar();

    // Apply plan-based feature gating
    applyPlanGating(data.plan, data.status);

    // Remove loader
    const loader = document.getElementById('ks-auth-loader');
    if (loader) loader.remove();

    // Update Rx count display
    updateRxCounter();

  } catch(e) {
    console.error('Auth check error:', e);
    window.location.href = 'index.html';
  }
});

function updateTopbar() {
  const u = window.KS_USER;
  if (!u) return;
  const plan = KS_PLANS[u.status === 'trial' ? 'trial' : u.plan] || KS_PLANS.basic;
  // Update topbar actions area
  const topbarActions = document.getElementById('saas-topbar-actions');
  if (topbarActions) {
    topbarActions.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-family:'DM Sans',sans-serif;">
        <div style="text-align:right;line-height:1.2;">
          <div style="font-size:13px;font-weight:700;color:#0b3c5d;">${u.name}</div>
          <div style="font-size:10px;color:#64748b;">${plan.label} · ${u.rxCount}/${u.rxLimit === 999999 ? '∞' : u.rxLimit} Rx</div>
        </div>
        <div style="width:34px;height:34px;background:linear-gradient(135deg,#1a6eb5,#00c9a7);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;" title="${u.email}" onclick="saasSwitchSection('doctor-profile','👨‍⚕️ Doctor Profile','Clinic & doctor settings',null)">👨‍⚕️</div>
        <button onclick="ksSignOut()" style="background:#fee2e2;border:1px solid #fecaca;color:#dc2626;border-radius:7px;padding:6px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">Sign Out</button>
      </div>
    `;
  }
  // Update sidebar user info if present
  const sidebarUser = document.getElementById('sidebar-user-info');
  if (sidebarUser) {
    sidebarUser.innerHTML = `
      <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);font-family:'DM Sans',sans-serif;">
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">${plan.label} Plan</div>
        <button onclick="ksSignOut()" style="margin-top:8px;width:100%;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;border-radius:6px;padding:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">Sign Out</button>
      </div>
    `;
  }
}

function applyPlanGating(plan, status) {
  const effectivePlan = status === 'trial' ? 'trial' : plan;
  const allowed = KS_PLANS[effectivePlan]?.features || KS_PLANS.basic.features;

  // Sections that need gating — if not in allowed, add lock overlay
  const gatedSections = {
    'drug-db':           'pro',
    'report-interp':     'pro',
    'clinical-scores':   'pro',
    'vitals-tracker':    'pro',
    'rx-templates':      'pro',
    'disease-explorer':  'pro',
    'saas-billing':      'premium',
    'saas-appointments': 'premium',
    'adv-opd-queue':     'premium',
    'adv-appointments':  'premium',
    'adv-eprescription': 'premium',
    'adv-ai-diagnosis':  'premium',
    'adv-patient-engagement': 'premium',
    'adv-clinic-admin':  'premium',
  };

  Object.entries(gatedSections).forEach(([sectionId, reqPlan]) => {
    if (!allowed.includes(sectionId)) {
      const el = document.getElementById(sectionId);
      if (el) {
        // Add lock overlay
        el.style.position = 'relative';
        if (!el.querySelector('.ks-lock-overlay')) {
          const reqLabel = KS_PLANS[reqPlan]?.label || reqPlan;
          const reqPrice = KS_PLANS[reqPlan]?.price || '';
          el.insertAdjacentHTML('afterbegin', `
            <div class="ks-lock-overlay" style="position:absolute;inset:0;z-index:100;background:rgba(11,37,69,0.88);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;border-radius:8px;flex-direction:column;gap:12px;font-family:'DM Sans',sans-serif;">
              <div style="font-size:40px;">🔒</div>
              <div style="font-size:18px;font-weight:700;color:white;">${reqLabel} Feature</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.6);text-align:center;max-width:280px;">Upgrade to ${reqLabel} (${reqPrice}) to unlock this feature.</div>
              <button onclick="ksShowUpgrade()" style="background:linear-gradient(135deg,#1a6eb5,#00c9a7);border:none;color:white;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:4px;">Upgrade Now →</button>
            </div>
          `);
        }
      }
      // Add lock badge to sidebar nav item
      const navBtn = document.querySelector(`.sidebar-nav-item[data-section="${sectionId}"]`);
      if (navBtn && !navBtn.querySelector('.ks-lock-badge')) {
        navBtn.insertAdjacentHTML('beforeend', '<span class="ks-lock-badge" style="font-size:10px;margin-left:auto;">🔒</span>');
      }
    }
  });
}

function updateRxCounter() {
  const u = window.KS_USER;
  if (!u) return;
  const el = document.getElementById('ks-rx-counter');
  if (el) {
    const pct = Math.min(100, (u.rxCount / (u.rxLimit === 999999 ? u.rxCount + 1 : u.rxLimit)) * 100);
    el.innerHTML = `Rx: ${u.rxCount}/${u.rxLimit === 999999 ? '∞' : u.rxLimit}`;
  }
}

async function ksIncrementRx() {
  const u = window.KS_USER;
  if (!u) return false;
  if (u.rxCount >= u.rxLimit) {
    ksShowUpgrade();
    return false;
  }
  u.rxCount++;
  window.KS_USER = u;
  try {
    await _ksDb.collection('doctors').doc(u.uid).update({
      rxCount: firebase.firestore.FieldValue.increment(1)
    });
    updateRxCounter();
  } catch(e) { console.error('Rx count update failed', e); }
  return true;
}

function ksShowUpgrade() {
  const html = `
  <div id="ks-upgrade-modal" style="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px;font-family:'DM Sans',sans-serif;">
    <div style="background:linear-gradient(135deg,#0b2545,#13315c);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:36px;max-width:480px;width:100%;color:white;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">⭐</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:8px;">Upgrade Your Plan</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:24px;">Contact us to upgrade and unlock all features</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px;">
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Basic</div>
          <div style="font-size:20px;font-weight:700;color:white;margin:6px 0;">₹1,499</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);">50 Rx/month</div>
        </div>
        <div style="background:rgba(0,201,167,0.1);border:1.5px solid rgba(0,201,167,0.4);border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:#00c9a7;text-transform:uppercase;letter-spacing:1px;">Pro ⭐</div>
          <div style="font-size:20px;font-weight:700;color:white;margin:6px 0;">₹2,999</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);">200 Rx + All Tools</div>
        </div>
        <div style="background:rgba(244,168,50,0.1);border:1px solid rgba(244,168,50,0.3);border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:#f4a832;text-transform:uppercase;letter-spacing:1px;">Premium</div>
          <div style="font-size:20px;font-weight:700;color:white;margin:6px 0;">₹4,999</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);">Unlimited · All</div>
        </div>
      </div>
      <a href="https://wa.me/91XXXXXXXXXX?text=Hi, I want to upgrade my K Spider Doctor AI plan. My email: ${window.KS_USER?.email || ''}" target="_blank"
        style="display:block;background:linear-gradient(135deg,#25D366,#128C7E);color:white;padding:14px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:10px;">
        💬 Upgrade via WhatsApp
      </a>
      <button onclick="document.getElementById('ks-upgrade-modal').remove()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);border-radius:10px;padding:10px 20px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%;">Maybe Later</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function ksSignOut() {
  if (confirm('Sign out of K Spider Doctor AI?')) {
    await _ksAuth.signOut();
    localStorage.removeItem('ks_user');
    window.location.href = 'index.html';
  }
}
