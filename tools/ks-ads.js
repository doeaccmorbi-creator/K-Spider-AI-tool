/* ══════════════════════════════════════════════════════════════════
   K SPIDER AI — Universal Ad System  v10.0 (FINAL)
   File: ks-ads.js  |  Place in: /tools/ folder (or root)
   Updated: 2026  |  By Gaurang Raval & Khush Raval
   www.kspiderai.in
   ══════════════════════════════════════════════════════════════════

   HOW TO USE — Har tool ki HTML file mein ye 2 cheezein karo:

   STEP 1 ─ </body> se pehle ye script tag paste karo:
     <script src="ks-ads.js"></script>

   STEP 2 ─ Jahan ad dikhani ho wahan ye div paste karo:

   ┌─────────────────────────────────────────────────────────┐
   │  TOP BANNER    : <div data-ks-slot="top-banner"></div>  │
   │  SIDEBAR       : <div data-ks-slot="sidebar-left"></div>│
   │  IN-CONTENT    : <div data-ks-slot="in-content"></div>  │
   │  AFTER-RESULT  : <div data-ks-slot="after-result"></div>│
   │  BOTTOM BANNER : <div data-ks-slot="bottom-banner"></div>│
   └─────────────────────────────────────────────────────────┘

   FIREBASE PROJECT: kspideraimain
   FIXES v10.0:
   ✅ onclick single-quote safe (&#39; escape)
   ✅ Firebase double-init guard (apps.length check)
   ✅ Firebase auto-inject (tool pages pe bhi kaam karta hai)
   ✅ Impression + Click tracking (Firestore increment)
   ✅ Ad expiry check (date-based)
   ✅ Auto-rotation per slot (admin-set interval)
   ✅ All ad types: image, video (MP4/YouTube/Vimeo), text, html
   ✅ All text ad styles: flat, gradient, dark-glass, neon-border, gold-luxury
   ✅ Info fields: phone (WhatsApp), email, url, location, address
   ✅ Logo overlay support
   ✅ kspider-ad-slot class bhi support (backward compat)
   ✅ Firestore Rules compatible with kspideraimain rules v8.0
══════════════════════════════════════════════════════════════════ */

(function KsToolAds() {
  'use strict';

  /* ─────────────────────────────────────────────
     FIREBASE CONFIG  (kspideraimain project)
  ───────────────────────────────────────────── */
  var _FB_CONFIG = {
    apiKey:            "AIzaSyBHNEgIT6lIZNAWcd5Ssbr4BpBHKzqETk8",
    authDomain:        "kspideraimain.firebaseapp.com",
    projectId:         "kspideraimain",
    storageBucket:     "kspideraimain.firebasestorage.app",
    messagingSenderId: "940003391760",
    appId:             "1:940003391760:web:8617000465b6991d348d95"
  };

  var _FB_APP_URL = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
  var _FB_FS_URL  = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';

  /* ─────────────────────────────────────────────
     SCRIPT INJECT HELPER
  ───────────────────────────────────────────── */
  function loadScript(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) { if (cb) cb(); return; }
    var s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = cb || null;
    s.onerror = function() { console.warn('[KsAds] Failed to load:', src); if (cb) cb(); };
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────
     FIREBASE ENSURE (auto-inject if missing)
  ───────────────────────────────────────────── */
  function ensureFirebase(callback) {
    // Already initialized — use directly
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      callback(); return;
    }
    // firebase object hai but init nahi
    if (typeof firebase !== 'undefined') {
      try { if (!firebase.apps.length) firebase.initializeApp(_FB_CONFIG); } catch(e) {}
      callback(); return;
    }
    // firebase load hi nahi — inject both scripts
    loadScript(_FB_APP_URL, function() {
      loadScript(_FB_FS_URL, function() {
        try {
          if (typeof firebase !== 'undefined' && !firebase.apps.length)
            firebase.initializeApp(_FB_CONFIG);
        } catch(e) { console.warn('[KsAds] Firebase init error:', e.message); }
        callback();
      });
    });
  }

  /* ─────────────────────────────────────────────
     GET FIRESTORE DB
  ───────────────────────────────────────────── */
  function getDb() {
    try {
      // Use shared KS db if available (index.html)
      if (window.KS && window.KS.db) return window.KS.db;
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length)
        return firebase.firestore();
    } catch(e) {}
    return null;
  }

  /* ─────────────────────────────────────────────
     HTML SAFE ESCAPE (onclick-safe)
  ───────────────────────────────────────────── */
  function safe(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');  // ✅ single quote safe — onclick attribute nahi tootega
  }

  /* ─────────────────────────────────────────────
     TOOL SLUG DETECTION
  ───────────────────────────────────────────── */
  var FILE_TO_SLOT = {
    'whatsapp-bulk-sender-tool':    'tool-whatsapp-bulk-sender',
    'whatsapp-bulk-sender':         'tool-whatsapp-bulk-sender',
    'Learn_Smarter_with':           'tool-ai-teacher',
    'learn_smarter_with':           'tool-ai-teacher',
    'learn-smarter-with':           'tool-ai-teacher',
    'resume-builder-tool':          'tool-resume-builder',
    'resume-builder':               'tool-resume-builder',
    'image-master-pro-tool':        'tool-image-master-pro',
    'image-master-pro':             'tool-image-master-pro',
    'ai-business-consultant-tool':  'tool-ai-business-consultant',
    'ai-business-consultant':       'tool-ai-business-consultant',
    'ai-prompt-engine-tool':        'tool-ai-prompt-engine',
    'ai-prompt-engine':             'tool-ai-prompt-engine',
    'ai-file-converter-tool':       'tool-ai-file-converter',
    'ai-file-converter':            'tool-ai-file-converter',
    'pharmacy-master-tool':         'tool-pharmacy-master',
    'pharmacy-master':              'tool-pharmacy-master',
    'pharma-marketing-tool':        'tool-pharma-marketing-tool',
    'india-fbook-tool':             'tool-india-fbook',
    'india-fbook':                  'tool-india-fbook',
    'k-spider-India-f-book':        'tool-india-fbook',
    'linkshare-tool':               'tool-linkshare',
    'linkshare':                    'tool-linkshare',
    'multipost-tool':               'tool-multipost',
    'multipost':                    'tool-multipost',
    'doctor-elite-pro-max-tool':    'tool-doctor-elite-pro-max',
    'doctor-elite-pro-max':         'tool-doctor-elite-pro-max',
    'kspider-400-tools-tool':       'tool-kspider-400-tools',
    'kspider-400-tools':            'tool-kspider-400-tools',
    'knowledge-spider-tool':        'tool-knowledge-spider',
    'knowledge-spider':             'tool-knowledge-spider',
    'wa-broadcast-pro-tool':        'tool-wa-broadcast-pro',
    'wa-broadcast-pro':             'tool-wa-broadcast-pro',
    'free-ai-video-generator-tool': 'tool-free-ai-video-generator',
    'free-ai-video-generator':      'tool-free-ai-video-generator',
    'cybershield-pro-tool':         'tool-cybershield-pro',
    'cybershield-pro':              'tool-cybershield-pro',
    'lead-scout-tool':              'tool-lead-scout',
    'lead-scout':                   'tool-lead-scout',
    'webcraft-pro-tool':            'tool-webcraft-pro',
    'webcraft-pro':                 'tool-webcraft-pro',
    'script-studio-tool':           'tool-script-studio',
    'script-studio':                'tool-script-studio',
    'file-analyzer-pro-tool':       'tool-file-analyzer-pro',
    'file-analyzer-pro':            'tool-file-analyzer-pro',
    'review-booster-pro-tool':      'tool-review-booster-pro',
    'review-booster-pro':           'tool-review-booster-pro',
    'voxai-pro-tool':               'tool-voxai-pro',
    'voxai-pro':                    'tool-voxai-pro',
    'rto-exam-pro-tool':            'tool-rto-exam-pro',
    'rto-exam-pro':                 'tool-rto-exam-pro',
    'kspider-connect-jobs-tool':    'tool-kspider-connect-jobs',
    'kspider-connect-jobs':         'tool-kspider-connect-jobs',
    'doctor-clinic-tool':           'tool-doctor-clinic-tool',
    'social-captions-tool':         'tool-social-captions',
    'social-captions':              'tool-social-captions',
    'biz-name-gen-tool':            'tool-biz-name-gen',
    'biz-name-gen':                 'tool-biz-name-gen',
    'health-checker-tool':          'tool-health-checker',
    'health-checker':               'tool-health-checker',
    'contract-gen-tool':            'tool-contract-gen',
    'contract-gen':                 'tool-contract-gen'
  };

  function getToolSlug() {
    var path = window.location.pathname;
    var file = path.split('/').pop().replace(/\.html?$/, '');
    if (FILE_TO_SLOT[file]) return FILE_TO_SLOT[file];
    if (FILE_TO_SLOT[file.toLowerCase()]) return FILE_TO_SLOT[file.toLowerCase()];
    return 'tool-' + file.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /* ─────────────────────────────────────────────
     IMPRESSION & CLICK TRACKING
  ───────────────────────────────────────────── */
  function trackImpression(adId) {
    if (!adId) return;
    var db = getDb();
    if (!db) return;
    db.collection('ads').doc(adId)
      .update({ impressions: firebase.firestore.FieldValue.increment(1) })
      .catch(function() {});
  }

  window.ksAdTrackClick = function(adId) {
    if (!adId) return;
    var db = getDb();
    if (!db) return;
    db.collection('ads').doc(adId)
      .update({ clicks: firebase.firestore.FieldValue.increment(1) })
      .catch(function() {});
  };

  // Legacy support: kspiderAdClick bhi kaam kare
  window.kspiderAdClick = window.ksAdTrackClick;

  /* ─────────────────────────────────────────────
     RENDER AD
  ───────────────────────────────────────────── */
  function renderAd(el, ad) {
    if (!el || !ad) return;

    var clickUrl = (ad.clickUrl || '').trim();
    var hasLink  = !!(clickUrl && clickUrl !== '#');
    var adId     = ad._id || '';
    var inner    = '';

    var sizeMap = {
      '728x90' : 'width:728px;max-width:100%;height:90px;',
      '970x90' : 'width:970px;max-width:100%;height:90px;',
      '970x250': 'width:970px;max-width:100%;height:250px;',
      '300x250': 'width:300px;max-width:100%;height:250px;',
      '336x280': 'width:336px;max-width:100%;height:280px;',
      '250x250': 'width:250px;max-width:100%;height:250px;',
      '200x200': 'width:200px;max-width:100%;height:200px;',
      '160x600': 'width:160px;max-width:100%;height:600px;',
      '120x600': 'width:120px;max-width:100%;height:600px;',
      '300x600': 'width:300px;max-width:100%;height:600px;',
      '300x1050':'width:300px;max-width:100%;height:1050px;',
      '320x50'  : 'width:320px;max-width:100%;height:50px;',
      '320x100' : 'width:320px;max-width:100%;height:100px;',
      'auto'    : 'width:100%;'
    };
    var sizeStyle = sizeMap[ad.size || 'auto'] || 'width:100%;';

    /* ── IMAGE ── */
    if (ad.type === 'image' && ad.imgUrl) {
      inner = '<img src="' + safe(ad.imgUrl) + '" alt="' + safe(ad.imgAlt || 'Advertisement') + '" ' +
        'style="' + sizeStyle + 'height:auto;max-height:100%;display:block;margin:0 auto;border-radius:8px;object-fit:cover" ' +
        'loading="lazy" onerror="this.closest(\'[data-ks-slot],[data-slot]\').style.display=\'none\'">';

    /* ── VIDEO (MP4 / YouTube / Vimeo) ── */
    } else if (ad.type === 'video' && ad.videoUrl) {
      var vurl   = ad.videoUrl;
      var vplay  = ad.videoPlay  || 'autoplay';
      var vsound = ad.videoSound || 'muted';
      var vposter= ad.videoPoster|| '';
      var vidHtml= '';

      if (/youtube\.com|youtu\.be/i.test(vurl)) {
        var ytId = vurl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytId) {
          var ytP = 'autoplay=' + (vplay==='autoplay'?'1':'0') +
                    '&mute=' + (vsound==='muted'?'1':'0') + '&loop=1&controls=1&rel=0';
          vidHtml = '<div style="position:relative;width:100%;padding-top:56.25%;border-radius:8px;overflow:hidden">' +
            '<iframe style="position:absolute;inset:0;width:100%;height:100%" src="https://www.youtube.com/embed/' +
            ytId[1] + '?' + ytP + '" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe></div>';
        }
      } else if (/vimeo\.com/i.test(vurl)) {
        var vmId = vurl.match(/vimeo\.com\/(\d+)/);
        if (vmId) {
          var vmP = 'autoplay=' + (vplay==='autoplay'?'1':'0') +
                    '&muted=' + (vsound==='muted'?'1':'0') + '&loop=1&byline=0&title=0';
          vidHtml = '<div style="position:relative;width:100%;padding-top:56.25%;border-radius:8px;overflow:hidden">' +
            '<iframe style="position:absolute;inset:0;width:100%;height:100%" src="https://player.vimeo.com/video/' +
            vmId[1] + '?' + vmP + '" frameborder="0" allow="autoplay;fullscreen" allowfullscreen></iframe></div>';
        }
      } else {
        var autoA = (vplay === 'autoplay') ? 'autoplay loop playsinline' : '';
        var muteA = (vsound === 'muted') ? 'muted' : '';
        vidHtml = '<video ' + autoA + ' ' + muteA + ' controls ' +
          'style="width:100%;max-height:280px;border-radius:8px;background:#000"' +
          (vposter ? ' poster="' + safe(vposter) + '"' : '') + '>' +
          '<source src="' + safe(vurl) + '" type="video/mp4"></video>';
      }
      if (!vidHtml) return;
      inner = '<div style="width:100%">' + vidHtml + '</div>';

    /* ── TEXT (all admin styles) ── */
    } else if (ad.type === 'text') {
      var bg          = ad.bgColor       || '#e8520a';
      var bg2         = ad.bgColor2      || '#c0392b';
      var bannerStyle = ad.bannerStyle   || 'flat';
      var layoutAlign = ad.layoutAlign   || 'center';
      var borderRad   = ad.borderRadius  || '12px';
      var hlSize      = ad.hlSize        || '1rem';
      var hlWeight    = ad.hlWeight      || '800';
      var hlStyle     = ad.hlStyle       || 'normal';
      var hlColor     = ad.hlColor       || '#ffffff';
      var hlDec       = ad.hlDecoration  || 'none';
      var hlPos       = ad.hlPosition    || 'middle';
      var descSize    = ad.descSize      || '.78rem';
      var descWeight  = ad.descWeight    || '400';
      var descStyleV  = ad.descStyle     || 'normal';
      var descColor   = ad.descColor     || '#ffffff';
      var btnBg       = ad.btnBg         || '#ffffff';
      var btnColor    = ad.btnColor      || '#e8520a';
      var btnFontSize = ad.btnFontSize   || '.78rem';
      var btnPos      = ad.btnPosition   || 'center';
      var btnShape    = ad.btnShape      || '20px';
      var logoEnabled = ad.logoEnabled   || false;
      var logoUrl     = ad.logoUrl       || '';
      var logoPos     = ad.logoPosition  || 'top-right';
      var logoSize    = ad.logoSize      || '40px';
      var logoOpacity = ad.logoOpacity   || '1';
      var hl          = safe(ad.headline    || '');
      var dsc         = safe(ad.description || '');
      var btn         = safe(ad.btnText     || 'Learn More');
      var inf         = ad.infoFields || {};
      var sf          = ad.showFields || {};

      // Background style
      var bgCss = '';
      if (bannerStyle === 'gradient')
        bgCss = 'background:linear-gradient(135deg,' + bg + ',' + bg2 + ')';
      else if (bannerStyle === 'dark-glass')
        bgCss = 'background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15)';
      else if (bannerStyle === 'neon-border')
        bgCss = 'background:' + bg + ';border:2px solid ' + bg2 + ';box-shadow:0 0 16px ' + bg2 + '88';
      else if (bannerStyle === 'gold-luxury')
        bgCss = 'background:linear-gradient(135deg,#1a1209,#2d2011,#1a1209);border:1px solid #b8792a;box-shadow:inset 0 0 30px rgba(184,121,42,.15)';
      else
        bgCss = 'background:' + bg;

      // Info fields
      var infoHtml = '';
      if (sf.company && inf.companyName)
        infoHtml += '<div style="font-size:.73rem;font-weight:800;color:' + hlColor + ';margin-bottom:3px">🏢 ' + safe(inf.companyName) + '</div>';
      if (sf.offer && inf.offerText)
        infoHtml += '<div style="font-size:.76rem;font-weight:700;color:' + hlColor + ';background:rgba(255,255,255,.2);display:inline-block;padding:2px 12px;border-radius:20px;margin-bottom:5px">🎉 ' + safe(inf.offerText) + '</div>';

      var contactLine = '';
      if (sf.phone && inf.phone) {
        var waNum = inf.phone.replace(/[^0-9]/g, '');
        contactLine += '<span style="font-size:.7rem;margin-right:8px"><a href="https://wa.me/91' + waNum +
          '" target="_blank" style="color:' + descColor + ';text-decoration:underline" ' +
          'onclick="event.stopPropagation()">📱 ' + safe(inf.phone) + '</a></span>';
      }
      if (sf.email && inf.email)
        contactLine += '<span style="font-size:.7rem;margin-right:8px"><a href="mailto:' + safe(inf.email) +
          '" style="color:' + descColor + ';text-decoration:underline" onclick="event.stopPropagation()">✉️ ' + safe(inf.email) + '</a></span>';
      if (sf.url && inf.url)
        contactLine += '<span style="font-size:.7rem"><a href="' + safe(inf.url) +
          '" target="_blank" style="color:' + descColor + ';text-decoration:underline" onclick="event.stopPropagation()">🌐 ' +
          safe(inf.url.replace(/^https?:\/\//, '')) + '</a></span>';
      if (contactLine)
        infoHtml += '<div style="margin-bottom:5px;line-height:1.9">' + contactLine + '</div>';
      if (sf.location && inf.location)
        infoHtml += '<div style="font-size:.68rem;color:' + descColor + ';opacity:.82;margin-bottom:3px">📍 ' + safe(inf.location) + '</div>';
      if (sf.address && inf.address)
        infoHtml += '<div style="font-size:.66rem;color:' + descColor + ';opacity:.75;margin-bottom:4px">🏠 ' + safe(inf.address) + '</div>';

      // Logo
      var logoCss = 'position:absolute;';
      if      (logoPos === 'top-left')      logoCss += 'top:8px;left:8px;';
      else if (logoPos === 'top-center')    logoCss += 'top:8px;left:50%;transform:translateX(-50%);';
      else if (logoPos === 'top-right')     logoCss += 'top:8px;right:8px;';
      else if (logoPos === 'bottom-left')   logoCss += 'bottom:8px;left:8px;';
      else if (logoPos === 'bottom-center') logoCss += 'bottom:8px;left:50%;transform:translateX(-50%);';
      else                                  logoCss += 'bottom:8px;right:8px;';
      logoCss += 'height:' + logoSize + ';width:auto;opacity:' + logoOpacity + ';pointer-events:none;z-index:10;border-radius:4px;';
      var logoHtml = (logoEnabled && logoUrl)
        ? '<img src="' + safe(logoUrl) + '" style="' + logoCss + '" onerror="this.style.display=\'none\'">'
        : '';

      var btnAlignCss = btnPos === 'left' ? 'text-align:left' : btnPos === 'right' ? 'text-align:right' : 'text-align:center';
      var hlHtml = '<div style="font-size:' + hlSize + ';font-weight:' + hlWeight + ';font-style:' + hlStyle +
        ';color:' + hlColor + ';text-decoration:' + hlDec + ';margin-bottom:' + (dsc || infoHtml ? '6px' : '10px') + '">' + hl + '</div>';

      inner = '<div style="' + bgCss + ';border-radius:' + borderRad + ';padding:16px 18px;text-align:' +
        layoutAlign + ';cursor:' + (hasLink ? 'pointer' : 'default') + ';position:relative;overflow:hidden;width:100%;box-sizing:border-box">' +
        logoHtml +
        (hlPos !== 'bottom' ? hlHtml : '') +
        (dsc ? '<div style="font-size:' + descSize + ';font-weight:' + descWeight + ';font-style:' + descStyleV +
          ';color:' + descColor + ';opacity:.92;margin-bottom:8px;line-height:1.5">' + dsc + '</div>' : '') +
        (infoHtml ? '<div style="margin-bottom:8px">' + infoHtml + '</div>' : '') +
        '<div style="' + btnAlignCss + ';margin-top:4px">' +
          '<span style="background:' + btnBg + ';color:' + btnColor + ';padding:6px 20px;border-radius:' +
          btnShape + ';font-size:' + btnFontSize + ';font-weight:700;display:inline-block">' + btn + '</span>' +
        '</div>' +
        (hlPos === 'bottom' ? '<div style="font-size:' + hlSize + ';font-weight:' + hlWeight + ';color:' +
          hlColor + ';margin-top:8px">' + hl + '</div>' : '') +
        '</div>';

    /* ── HTML AD ── */
    } else if (ad.type === 'html') {
      el.style.display = 'block';
      el.innerHTML = '<div style="width:100%">' + (ad.htmlCode || '') + '</div>';
      trackImpression(adId);
      return;

    } else { return; }

    // Wrap with click link
    // ✅ FIX: onclick uses safe() — single quotes properly escaped as &#39;
    var wrap = hasLink
      ? '<a href="' + safe(clickUrl) + '" target="_blank" rel="noopener noreferrer sponsored" ' +
          'style="display:block;text-decoration:none;' + sizeStyle + '" ' +
          'onclick="window.ksAdTrackClick && window.ksAdTrackClick(&#39;' + safe(adId) + '&#39;)">' + inner + '</a>'
      : '<div style="' + sizeStyle + '">' + inner + '</div>';

    el.style.display  = 'block';
    el.style.cssText += 'text-align:center;margin:0 auto;';
    el.innerHTML = wrap;
    trackImpression(adId);
  }

  /* ─────────────────────────────────────────────
     SLOT ROTATION ENGINE
  ───────────────────────────────────────────── */
  var _adsBySlot = {};
  var _timers    = {};
  var _curIdx    = {};

  function rotateSlot(slotName, elements) {
    var ads = _adsBySlot[slotName];
    if (!ads || !ads.length) return;
    _curIdx[slotName] = ((_curIdx[slotName] || 0) + 1) % ads.length;
    elements.forEach(function(el) { renderAd(el, ads[_curIdx[slotName]]); });
  }

  function startSlot(slotName, elements) {
    var ads = _adsBySlot[slotName];
    if (!ads || !ads.length) return;
    _curIdx[slotName] = 0;
    elements.forEach(function(el) { renderAd(el, ads[0]); });
    if (_timers[slotName]) clearInterval(_timers[slotName]);
    var interval = (parseInt(ads[0].interval) || 10) * 1000;
    if (interval > 0 && ads.length > 1) {
      _timers[slotName] = setInterval(function() { rotateSlot(slotName, elements); }, interval);
    }
  }

  /* ─────────────────────────────────────────────
     LOAD ADS FROM FIRESTORE
  ───────────────────────────────────────────── */
  function loadAds() {
    var db = getDb();
    if (!db) { setTimeout(loadAds, 1500); return; }

    var toolSlug = getToolSlug();
    var now      = new Date();

    db.collection('ads').where('status', '==', 'active').get()
      .then(function(snap) {
        if (snap.empty) return;
        var bySlot = {};

        snap.forEach(function(doc) {
          var d = doc.data();
          // Skip expired
          if (d.expiry && new Date(d.expiry) < now) return;
          var slots = d.slots || [];
          var GENERIC = ['top-banner','sidebar-left','in-content','after-result','bottom-banner'];
          slots.forEach(function(slot) {
            var match = GENERIC.indexOf(slot) > -1 || slot === toolSlug || slot === 'all-tools';
            if (!match) return;
            if (!bySlot[slot]) bySlot[slot] = [];
            bySlot[slot].push(Object.assign({}, d, { _id: doc.id }));
          });
        });

        // Shuffle each slot
        Object.keys(bySlot).forEach(function(s) {
          bySlot[s] = bySlot[s].sort(function() { return Math.random() - 0.5; });
        });
        _adsBySlot = bySlot;

        // Find all slot elements — supports BOTH data-ks-slot AND data-slot AND .kspider-ad-slot
        var allEls = document.querySelectorAll('[data-ks-slot],[data-slot],.kspider-ad-slot');
        var slotElements = {};

        allEls.forEach(function(el) {
          el.style.cssText = 'display:none;width:100%;text-align:center;box-sizing:border-box;margin:0 auto;';
          var slotName = el.getAttribute('data-ks-slot') || el.getAttribute('data-slot') || '';
          if (!slotName) return;
          var adsForEl = bySlot[slotName] || bySlot['all-tools'] || (toolSlug ? bySlot[toolSlug] : null);
          if (!adsForEl || !adsForEl.length) {
            var keys = Object.keys(bySlot);
            if (keys.length) adsForEl = bySlot[keys[0]];
          }
          if (!adsForEl || !adsForEl.length) { el.style.display = 'none'; return; }
          var useSlot = bySlot[slotName] ? slotName : (bySlot['all-tools'] ? 'all-tools' : toolSlug);
          if (!slotElements[useSlot]) slotElements[useSlot] = [];
          slotElements[useSlot].push(el);
        });

        Object.keys(slotElements).forEach(function(s) { startSlot(s, slotElements[s]); });
      })
      .catch(function(e) { console.warn('[KsAds] Load error:', e.message); });
  }

  /* ─────────────────────────────────────────────
     ADVERTISE REQUEST FORM (3-step)
  ───────────────────────────────────────────── */
  window.ksShowAdForm = function() {
    if (document.getElementById('ks-ad-form-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'ks-ad-form-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:28px 24px;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;position:relative">' +
        '<button onclick="document.getElementById(\'ks-ad-form-overlay\').remove()" ' +
        'style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666">×</button>' +
        '<h3 style="margin:0 0 6px;font-size:1.1rem;color:#e8520a">📢 Advertise on K Spider AI</h3>' +
        '<p style="font-size:.82rem;color:#666;margin-bottom:18px">Reach millions of users across India. Fill the form — our team will contact you within 24 hours.</p>' +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<input id="ksaf-name" placeholder="Your Name *" style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:.88rem;width:100%;box-sizing:border-box">' +
          '<input id="ksaf-phone" type="tel" placeholder="Phone / WhatsApp *" style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:.88rem;width:100%;box-sizing:border-box">' +
          '<input id="ksaf-email" type="email" placeholder="Email (optional)" style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:.88rem;width:100%;box-sizing:border-box">' +
          '<input id="ksaf-biz" placeholder="Business / Product Name *" style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:.88rem;width:100%;box-sizing:border-box">' +
          '<select id="ksaf-budget" style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:.88rem;width:100%;box-sizing:border-box">' +
            '<option value="">Select Budget Range</option>' +
            '<option>Under ₹1,000/month</option><option>₹1,000–₹5,000/month</option>' +
            '<option>₹5,000–₹20,000/month</option><option>₹20,000+ /month</option>' +
          '</select>' +
          '<textarea id="ksaf-msg" placeholder="Brief about your ad (optional)" rows="3" ' +
          'style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:.88rem;resize:vertical;width:100%;box-sizing:border-box"></textarea>' +
          '<button onclick="window._ksSubmitAdRequest()" ' +
          'style="background:#e8520a;color:#fff;border:none;padding:12px;border-radius:8px;font-size:.95rem;font-weight:700;cursor:pointer;width:100%">' +
          '🚀 Submit Advertise Request</button>' +
          '<div id="ksaf-msg-out" style="font-size:.82rem;text-align:center;color:#e8520a;min-height:20px"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  };

  window._ksSubmitAdRequest = function() {
    var name   = (document.getElementById('ksaf-name')  || {}).value || '';
    var phone  = (document.getElementById('ksaf-phone') || {}).value || '';
    var email  = (document.getElementById('ksaf-email') || {}).value || '';
    var biz    = (document.getElementById('ksaf-biz')   || {}).value || '';
    var budget = (document.getElementById('ksaf-budget')|| {}).value || '';
    var msg    = (document.getElementById('ksaf-msg')   || {}).value || '';
    var out    = document.getElementById('ksaf-msg-out');
    if (!name.trim() || !phone.trim() || !biz.trim()) {
      if (out) out.textContent = '⚠️ Please fill Name, Phone and Business Name.'; return;
    }
    var db = getDb();
    if (!db) { if (out) out.textContent = '⚠️ Please try again in a moment.'; return; }
    var btn = document.querySelector('#ks-ad-form-overlay button[onclick*="ksSubmitAdRequest"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
    db.collection('adRequests').add({
      name: name.trim(), phone: phone.trim(), email: email.trim(),
      businessName: biz.trim(), budget: budget, message: msg.trim(),
      status: 'pending', source: 'ks-ads.js',
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      pageUrl: window.location.href
    })
    .then(function() {
      if (out) out.innerHTML = '✅ <strong>Request submitted!</strong> We\'ll contact you within 24 hours.';
      if (btn) { btn.style.display = 'none'; }
    })
    .catch(function(e) {
      if (out) out.textContent = '❌ Error: ' + (e.message || 'Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = '🚀 Submit Advertise Request'; }
    });
  };

  /* ─────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────── */
  function boot() {
    ensureFirebase(function() { setTimeout(loadAds, 300); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  console.log('[KsAds] v10.0 ready | kspiderai.in | By Gaurang Raval & Khush Raval');

})();
