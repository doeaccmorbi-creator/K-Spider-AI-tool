// ═══════════════════════════════════════════════════════════════
// K SPIDER AI TOOL — RAZORPAY PAYMENT INTEGRATION
// File: payment.js  |  Version: 1.0 Production
// ═══════════════════════════════════════════════════════════════
// Requires: firebase-config.js loaded first
// Razorpay script added dynamically

(function() {

  // ── Load Razorpay SDK dynamically ──
  function loadRazorpay(callback) {
    if (window.Razorpay) { callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = callback;
    s.onerror = function() { console.error('[KSpider] Razorpay SDK failed to load'); };
    document.head.appendChild(s);
  }

  // ── Plan config ──
  var PLANS = {
    premium_monthly:   { name: 'K Spider Premium',   amount: 49900,   currency: 'INR', planType: 'premium',   duration: 'monthly',  desc: 'All premium tools unlocked' },
    premium_yearly:    { name: 'K Spider Premium',   amount: 299900,  currency: 'INR', planType: 'premium',   duration: 'yearly',   desc: 'All premium tools — billed yearly' },
    franchise_monthly: { name: 'K Spider Franchise', amount: 199900,  currency: 'INR', planType: 'franchise', duration: 'monthly',  desc: 'Full franchise access + all tools' },
    franchise_yearly:  { name: 'K Spider Franchise', amount: 999900,  currency: 'INR', planType: 'franchise', duration: 'yearly',   desc: 'Full franchise access — billed yearly' }
  };

  // ═══════════════════════════
  // MAIN: Initiate Payment
  // ═══════════════════════════
  window.KS_initPayment = function(planKey, isYearly) {
    if (!planKey) return;

    // Auto-select yearly/monthly
    var key = isYearly ? planKey + '_yearly' : planKey + '_monthly';
    var plan = PLANS[key];
    if (!plan) { alert('Invalid plan selected.'); return; }

    // Check auth
    var waitForKS = setInterval(function() {
      if (typeof window.KS === 'undefined') return;
      clearInterval(waitForKS);

      var user = KS.auth.currentUser;
      if (!user) {
        window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
        return;
      }

      // Fetch user data
      KS.db.collection('users').doc(user.uid).get()
        .then(function(doc) {
          var userData = doc.exists ? doc.data() : {};

          loadRazorpay(function() {
            openRazorpay(plan, key, user, userData);
          });
        })
        .catch(function(err) {
          console.error('[KSpider Payment] Error:', err);
          KS_showPaymentError('Could not load user data. Try again.');
        });
    }, 100);
  };

  // ═══════════════════════════
  // Open Razorpay Checkout
  // ═══════════════════════════
  function openRazorpay(plan, planKey, user, userData) {
    var options = {
      key:         window.KS.RAZORPAY_KEY,
      amount:      plan.amount,
      currency:    plan.currency,
      name:        'K Spider for Kreation',
      description: plan.desc,
      image:       'https://www.kspiderai.in/assets/logo.png',
      prefill: {
        name:    userData.name  || user.displayName || '',
        email:   userData.email || user.email || '',
        contact: userData.phone || ''
      },
      notes: {
        userID:   user.uid,
        planType: plan.planType,
        duration: plan.duration,
        planKey:  planKey
      },
      theme: {
        color: '#b8792a'
      },
      modal: {
        ondismiss: function() {
          KS_showPaymentModal('cancelled');
        }
      },
      handler: function(response) {
        // Payment SUCCESS
        handlePaymentSuccess(response, plan, planKey, user);
      }
    };

    try {
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        handlePaymentFailed(response, plan, user);
      });
      rzp.open();
    } catch(e) {
      console.error('[KSpider Payment] Razorpay error:', e);
      KS_showPaymentError('Payment gateway error. Try again later.');
    }
  }

  // ═══════════════════════════
  // Handle Success
  // ═══════════════════════════
  function handlePaymentSuccess(response, plan, planKey, user) {
    var paymentData = {
      userID:    user.uid,
      paymentID: response.razorpay_payment_id,
      orderID:   response.razorpay_order_id    || '',
      signature: response.razorpay_signature   || '',
      planType:  plan.planType,
      planKey:   planKey,
      amount:    plan.amount / 100,
      currency:  plan.currency,
      status:    'success',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    // Save payment to Firestore
    KS.db.collection('payments').add(paymentData)
      .then(function(docRef) {
        // Upgrade user plan
        return KS.db.collection('users').doc(user.uid).update({
          planType:      plan.planType,
          paymentStatus: 'paid',
          lastPaymentID: response.razorpay_payment_id,
          planKey:       planKey,
          planActivatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(function() {
        KS_showPaymentModal('success', plan);
      })
      .catch(function(err) {
        console.error('[KSpider Payment] Firestore save error:', err);
        // Payment succeeded but save failed — log for manual review
        KS_showPaymentModal('success_save_error', plan);
      });
  }

  // ═══════════════════════════
  // Handle Failure
  // ═══════════════════════════
  function handlePaymentFailed(response, plan, user) {
    var failData = {
      userID:       user.uid,
      paymentID:    response.error.metadata && response.error.metadata.payment_id || 'unknown',
      planType:     plan.planType,
      amount:       plan.amount / 100,
      currency:     plan.currency,
      status:       'failed',
      errorCode:    response.error.code,
      errorDesc:    response.error.description,
      timestamp:    firebase.firestore.FieldValue.serverTimestamp()
    };

    KS.db.collection('payments').add(failData).catch(function() {});
    KS_showPaymentModal('failed');
  }

  // ═══════════════════════════
  // Payment Modal UI
  // ═══════════════════════════
  window.KS_showPaymentModal = function(state, plan) {
    var existing = document.getElementById('ks-pay-modal');
    if (existing) existing.remove();

    var messages = {
      success: {
        icon: '🎉',
        title: 'Payment Successful!',
        msg: 'Your ' + (plan ? plan.name : '') + ' plan is now active. Enjoy all premium tools!',
        btnText: '🚀 Start Using Tools',
        btnClass: 'success',
        action: function() { window.location.reload(); }
      },
      failed: {
        icon: '❌',
        title: 'Payment Failed',
        msg: 'Your payment could not be processed. No money was deducted. Please try again.',
        btnText: 'Try Again',
        btnClass: 'error',
        action: function() { closePayModal(); }
      },
      cancelled: {
        icon: '🚫',
        title: 'Payment Cancelled',
        msg: 'You cancelled the payment. No charges were made.',
        btnText: 'Close',
        btnClass: 'neutral',
        action: function() { closePayModal(); }
      },
      success_save_error: {
        icon: '⚠️',
        title: 'Payment Received',
        msg: 'Payment was successful! There was a sync issue. Contact support with your payment ID if plan is not activated.',
        btnText: 'Contact Support',
        btnClass: 'warning',
        action: function() { window.location.href = 'mailto:kspider221206@gmail.com'; }
      }
    };

    var m = messages[state] || messages.failed;
    var styles = {
      success: 'background:rgba(5,150,105,.1);color:#059669;border:1px solid rgba(5,150,105,.2);',
      error:   'background:rgba(220,38,38,.1);color:#dc2626;border:1px solid rgba(220,38,38,.2);',
      neutral: 'background:rgba(0,0,0,.05);color:#4a4639;border:1px solid rgba(0,0,0,.1);',
      warning: 'background:rgba(245,158,11,.1);color:#d97706;border:1px solid rgba(245,158,11,.2);'
    };

    var modal = document.createElement('div');
    modal.id = 'ks-pay-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-family:DM Sans,-apple-system,sans-serif;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:40px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2);">
        <div style="font-size:3.5rem;margin-bottom:12px;">${m.icon}</div>
        <div style="font-size:1.3rem;font-weight:700;color:#1a1814;margin-bottom:8px;">${m.title}</div>
        <div style="padding:12px 16px;border-radius:10px;font-size:.85rem;margin-bottom:20px;${styles[m.btnClass]}">${m.msg}</div>
        <button onclick="document.getElementById('ks-pay-modal-btn').click()" id="ks-pay-modal-btn-x"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#b8792a,#d4922e);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">
          ${m.btnText}
        </button>
        <button id="ks-pay-modal-btn" style="display:none;" onclick="(${m.action.toString()})()"></button>
      </div>`;

    document.body.appendChild(modal);
    document.getElementById('ks-pay-modal-btn-x').onclick = m.action;
  };

  function closePayModal() {
    var m = document.getElementById('ks-pay-modal');
    if (m) m.remove();
  }

  window.KS_showPaymentError = function(msg) {
    KS_showPaymentModal('failed');
    console.error('[KSpider Payment]', msg);
  };

  // ═══════════════════════════
  // OPEN PRICING MODAL (called from upgrade prompts)
  // ═══════════════════════════
  window.openPricingModal = function(plan) {
    // Scroll to pricing section if on homepage
    var pricingSection = document.getElementById('pricing') || document.querySelector('[data-section="pricing"]');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Redirect to home with pricing anchor
      window.location.href = 'index.html#pricing';
    }
  };

  console.log('[KSpider] Payment module loaded ✓');

})();
