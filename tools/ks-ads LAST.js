/* ══════════════════════════════════════════════════════════════════
   K SPIDER AI — Universal Ad System for Tool Pages  v1.0
   File: ks-ads.js  |  Place in: /tools/  folder
   ══════════════════════════════════════════════════════════════════

   HOW TO USE — Har tool ki HTML file mein ye 2 cheezein karo:

   STEP 1 ─ </body> se pehle ye script tag paste karo:
     <script src="ks-ads.js"></script>

   STEP 2 ─ Jahan ad dikhani ho wahan ye div paste karo:

   ┌─────────────────────────────────────────────────────────┐
   │  TOP BANNER (header ke neeche):                         │
   │  <div data-ks-slot="top-banner"></div>                  │
   │                                                         │
   │  SIDEBAR (left/right panel mein):                       │
   │  <div data-ks-slot="sidebar-left"></div>                │
   │                                                         │
   │  CONTENT KE BEECH (steps ke bich mein):                 │
   │  <div data-ks-slot="in-content"></div>                  │
   │                                                         │
   │  RESULT KE BAAD (output section ke neeche):             │
   │  <div data-ks-slot="after-result"></div>                │
   │                                                         │
   │  BOTTOM (page ke bilkul neeche):                        │
   │  <div data-ks-slot="bottom-banner"></div>               │
   └─────────────────────────────────────────────────────────┘

   ADMIN MEIN SLOT NAMES (Admin > Ads Manager > Slots field):
   ─────────────────────────────────────────────────────────
   top-banner        → Sabhi pages pe top mein
   sidebar-left      → Sidebar mein
   in-content        → Content ke beech mein
   after-result      → Result/output ke neeche
   bottom-banner     → Page ke bilkul neeche

   SPECIFIC TOOL PE AD DIKHANA (Admin mein):
   ─────────────────────────────────────────
   Sirf WhatsApp tool pe:     tool-whatsapp
   Sirf Image Editor pe:      tool-image-editor
   Sirf Resume Builder pe:    tool-resume-builder
   ... (har tool ka naam tum set kar sakte ho admin mein)

   MULTIPLE TOOLS PE EK SAATH:
   Admin mein slots field mein comma se likhो:
   top-banner, tool-whatsapp, tool-image-editor

══════════════════════════════════════════════════════════════════ */

(function KsToolAds() {
  'use strict';

  /* ══════════════════════════════════════════════════════
     FIX v1.1: Firebase auto-load — tool files mein
     Firebase CDN scripts nahi hoti, ye inject karta hai
  ══════════════════════════════════════════════════════ */
  var _FB_APP_URL = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
  var _FB_FS_URL  = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';

  /* ── Apna Firebase config yahan daalo (same as index.html) ── */
  var _FB_CONFIG = {
    apiKey:            "AIzaSyBHNEgIT6lIZNAWcd5Ssbr4BpBHKzqETk8",
    authDomain:        "kspideraimain.firebaseapp.com",
    projectId:         "kspideraimain",
    storageBucket:     "kspideraimain.firebasestorage.app",
    messagingSenderId: "940003391760",
    appId:             "1:940003391760:web:8617000465b6991d348d95"
  };

  /* ── Script inject helper ── */
  function loadScript(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) { cb && cb(); return; }
    var s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = cb || null;
    document.head.appendChild(s);
  }

  /* ── Firebase ensure: already loaded? skip. Else inject scripts ── */
  function ensureFirebase(callback) {
    // Case 1: Firebase already initialized (index.html pe hoga)
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      callback(); return;
    }
    // Case 2: firebase object hai par init nahi hua
    if (typeof firebase !== 'undefined') {
      try { if (!firebase.apps.length) firebase.initializeApp(_FB_CONFIG); } catch(e) {}
      callback(); return;
    }
    // Case 3: firebase load hi nahi hua (tool files) — inject karo
    loadScript(_FB_APP_URL, function() {
      loadScript(_FB_FS_URL, function() {
        try { if (!firebase.apps.length) firebase.initializeApp(_FB_CONFIG); } catch(e) {}
        callback();
      });
    });
  }

  /* ── Firebase se db lena ── */
  function getDb() {
    try {
      if (window.KS && window.KS.db) return window.KS.db;
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        return firebase.firestore();
      }
    } catch (e) {}
    return null;
  }

  /* ── HTML special characters safe karna ── */
  function safe(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Filename → Admin checkbox value mapping ── */
  /* Admin mein jo checkbox value hai, wahi yahan likhni hai */
  var FILE_TO_SLOT = {
    /* WhatsApp tool — file: whatsapp-bulk-sender-tool.html → admin value: tool-whatsapp-bulk-sender */
    'whatsapp-bulk-sender-tool':    'tool-whatsapp-bulk-sender',
    'whatsapp-bulk-sender':         'tool-whatsapp-bulk-sender', /* live URL without -tool */
    /* Learn Smarter — file: Learn_Smarter_with.html → admin value: tool-ai-teacher */
    'Learn_Smarter_with':           'tool-ai-teacher',
    'learn_smarter_with':           'tool-ai-teacher',
    'learn-smarter-with':           'tool-ai-teacher',
    /* Resume Builder */
    'resume-builder-tool':          'tool-resume-builder',
    'resume-builder':               'tool-resume-builder',
    /* Image Master Pro */
    'image-master-pro-tool':        'tool-image-master-pro',
    'image-master-pro':             'tool-image-master-pro',
    /* AI Business Consultant */
    'ai-business-consultant-tool':  'tool-ai-business-consultant',
    'ai-business-consultant':       'tool-ai-business-consultant',
    /* AI Prompt Engine */
    'ai-prompt-engine-tool':        'tool-ai-prompt-engine',
    'ai-prompt-engine':             'tool-ai-prompt-engine',
    /* AI File Converter */
    'ai-file-converter-tool':       'tool-ai-file-converter',
    'ai-file-converter':            'tool-ai-file-converter',
    /* Pharmacy Master */
    'pharmacy-master-tool':         'tool-pharmacy-master',
    'pharmacy-master':              'tool-pharmacy-master',
    /* Pharma Marketing */
    'pharma-marketing-tool':        'tool-pharma-marketing-tool',
    /* India F-Book */
    'india-fbook-tool':             'tool-india-fbook',
    'india-fbook':                  'tool-india-fbook',
    /* LinkShare */
    'linkshare-tool':               'tool-linkshare',
    'linkshare':                    'tool-linkshare',
    /* MultiPost */
    'multipost-tool':               'tool-multipost',
    'multipost':                    'tool-multipost',
    /* Doctor Elite Pro Max */
    'doctor-elite-pro-max-tool':    'tool-doctor-elite-pro-max',
    'doctor-elite-pro-max':         'tool-doctor-elite-pro-max',
    /* KSpider 400+ Tools */
    'kspider-400-tools-tool':       'tool-kspider-400-tools',
    'kspider-400-tools':            'tool-kspider-400-tools',
    /* Knowledge Spider */
    'knowledge-spider-tool':        'tool-knowledge-spider',
    'knowledge-spider':             'tool-knowledge-spider',
    /* WA Broadcast Pro */
    'wa-broadcast-pro-tool':        'tool-wa-broadcast-pro',
    'wa-broadcast-pro':             'tool-wa-broadcast-pro',
    /* Free AI Video Generator */
    'free-ai-video-generator-tool': 'tool-free-ai-video-generator',
    'free-ai-video-generator':      'tool-free-ai-video-generator',
    /* CyberShield Pro */
    'cybershield-pro-tool':         'tool-cybershield-pro',
    'cybershield-pro':              'tool-cybershield-pro',
    /* Lead Scout */
    'lead-scout-tool':              'tool-lead-scout',
    'lead-scout':                   'tool-lead-scout',
    /* WebCraft Pro */
    'webcraft-pro-tool':            'tool-webcraft-pro',
    'webcraft-pro':                 'tool-webcraft-pro',
    /* Script Studio */
    'script-studio-tool':           'tool-script-studio',
    'script-studio':                'tool-script-studio',
    /* File Analyzer Pro */
    'file-analyzer-pro-tool':       'tool-file-analyzer-pro',
    'file-analyzer-pro':            'tool-file-analyzer-pro',
    /* Review Booster Pro */
    'review-booster-pro-tool':      'tool-review-booster-pro',
    'review-booster-pro':           'tool-review-booster-pro',
    /* VOXAI Pro */
    'voxai-pro-tool':               'tool-voxai-pro',
    'voxai-pro':                    'tool-voxai-pro',
    /* RTO Exam Pro */
    'rto-exam-pro-tool':            'tool-rto-exam-pro',
    'rto-exam-pro':                 'tool-rto-exam-pro',
    /* KSpider Connect Jobs */
    'kspider-connect-jobs-tool':    'tool-kspider-connect-jobs',
    'kspider-connect-jobs':         'tool-kspider-connect-jobs',
    /* Doctor Clinic Tool */
    'doctor-clinic-tool':           'tool-doctor-clinic-tool',
    /* Social Captions */
    'social-captions-tool':         'tool-social-captions',
    'social-captions':              'tool-social-captions',
    /* Business Name Generator */
    'biz-name-gen-tool':            'tool-biz-name-gen',
    'biz-name-gen':                 'tool-biz-name-gen',
    /* Health Checker */
    'health-checker-tool':          'tool-health-checker',
    'health-checker':               'tool-health-checker',
    /* Legal Contract Generator */
    'contract-gen-tool':            'tool-contract-gen',
    'contract-gen':                 'tool-contract-gen'
  };

  /* ── Current tool ka slug detect karna ── */
  function getToolSlug() {
    var path = window.location.pathname;
    var file = path.split('/').pop().replace('.html','').replace('.htm','');
    // Pehle exact match try karo
    if (FILE_TO_SLOT[file]) return FILE_TO_SLOT[file];
    // Lowercase se try karo
    var fl = file.toLowerCase();
    if (FILE_TO_SLOT[fl]) return FILE_TO_SLOT[fl];
    // Fallback: tool- prefix laga do (last resort)
    return 'tool-' + fl;
  }

  /* ── Ek ad render karna ── */
  function renderAd(el, ad) {
    if (!el || !ad) return;

    var clickUrl = ad.clickUrl || '';
    var hasLink  = !!(clickUrl && clickUrl !== '#');
    var inner    = '';

    // ── Size map ──
    var sizeMap = {
      '728x90' :'width:728px;max-width:100%;height:90px;',
      '970x90' :'width:970px;max-width:100%;height:90px;',
      '970x250':'width:970px;max-width:100%;height:250px;',
      '300x250':'width:300px;max-width:100%;height:250px;',
      '336x280':'width:336px;max-width:100%;height:280px;',
      '250x250':'width:250px;max-width:100%;height:250px;',
      '200x200':'width:200px;max-width:100%;height:200px;',
      '160x600':'width:160px;max-width:100%;height:600px;',
      '120x600':'width:120px;max-width:100%;height:600px;',
      '300x600':'width:300px;max-width:100%;height:600px;',
      '320x50' :'width:320px;max-width:100%;height:50px;',
      '320x100':'width:320px;max-width:100%;height:100px;',
      'auto'   :'width:100%;'
    };
    var sizeStyle = sizeMap[ad.size || 'auto'] || 'width:100%;';

    // ══════════════════════════════
    // IMAGE AD
    // ══════════════════════════════
    if (ad.type === 'image' && ad.imgUrl) {
      inner = '<img src="' + safe(ad.imgUrl) + '" alt="' + safe(ad.imgAlt || 'Advertisement') + '" ' +
        'style="' + sizeStyle + 'height:auto;max-height:100%;display:block;margin:0 auto;border-radius:8px;object-fit:cover" ' +
        'loading="lazy" onerror="this.closest(\'[data-ks-slot]\').style.display=\'none\'">';

    // ══════════════════════════════
    // VIDEO AD
    // ══════════════════════════════
    } else if (ad.type === 'video' && ad.videoUrl) {
      var vurl    = ad.videoUrl;
      var vsound  = ad.videoSound  || 'muted';
      var vplay   = ad.videoPlay   || 'autoplay';
      var vposter = ad.videoPoster || '';
      var isYT    = /youtube\.com|youtu\.be/i.test(vurl);
      var isVimeo = /vimeo\.com/i.test(vurl);
      var vidHtml = '';

      if (isYT) {
        var ytId = vurl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytId) {
          var ytP = 'autoplay=' + (vplay==='autoplay'?'1':'0') + '&mute=' + (vsound==='muted'?'1':'0') + '&loop=1&controls=1&rel=0';
          vidHtml = '<div style="position:relative;width:100%;padding-top:56.25%;border-radius:8px;overflow:hidden">' +
            '<iframe style="position:absolute;inset:0;width:100%;height:100%" src="https://www.youtube.com/embed/' + ytId[1] + '?' + ytP +
            '" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe></div>';
        }
      } else if (isVimeo) {
        var vmId = vurl.match(/vimeo\.com\/(\d+)/);
        if (vmId) {
          var vmP = 'autoplay=' + (vplay==='autoplay'?'1':'0') + '&muted=' + (vsound==='muted'?'1':'0') + '&loop=1&byline=0&title=0';
          vidHtml = '<div style="position:relative;width:100%;padding-top:56.25%;border-radius:8px;overflow:hidden">' +
            '<iframe style="position:absolute;inset:0;width:100%;height:100%" src="https://player.vimeo.com/video/' + vmId[1] + '?' + vmP +
            '" frameborder="0" allow="autoplay;fullscreen" allowfullscreen></iframe></div>';
        }
      } else {
        var autoA = (vplay === 'autoplay') ? 'autoplay loop playsinline' : '';
        var muteA = (vsound === 'muted') ? 'muted' : '';
        vidHtml = '<video ' + autoA + ' ' + muteA + ' controls style="width:100%;max-height:280px;border-radius:8px;background:#000"' +
          (vposter ? ' poster="' + safe(vposter) + '"' : '') + '>' +
          '<source src="' + safe(vurl) + '" type="video/mp4"></video>';
      }
      if (!vidHtml) return;
      inner = '<div style="width:100%">' + vidHtml + '</div>';

    // ══════════════════════════════
    // TEXT AD — Full admin fields
    // ══════════════════════════════
    } else if (ad.type === 'text') {

      // All fields from admin — with exact same defaults as admin.html
      var bg           = ad.bgColor       || '#e8520a';
      var bg2          = ad.bgColor2      || '#c0392b';
      var bannerStyle  = ad.bannerStyle   || 'flat';
      var layoutAlign  = ad.layoutAlign   || 'center';
      var borderRadius = ad.borderRadius  || '12px';
      var hlSize       = ad.hlSize        || '1rem';
      var hlWeight     = ad.hlWeight      || '800';
      var hlStyle      = ad.hlStyle       || 'normal';
      var hlColor      = ad.hlColor       || '#ffffff';
      var hlDec        = ad.hlDecoration  || 'none';
      var hlPos        = ad.hlPosition    || 'middle';
      var descSize     = ad.descSize      || '.78rem';
      var descWeight   = ad.descWeight    || '400';
      var descStyle2   = ad.descStyle     || 'normal';
      var descColor    = ad.descColor     || '#ffffff';
      var btnBg        = ad.btnBg         || '#ffffff';
      var btnColor     = ad.btnColor      || '#e8520a';
      var btnFontSize  = ad.btnFontSize   || '.78rem';
      var btnPos       = ad.btnPosition   || 'center';
      var btnShape     = ad.btnShape      || '20px';
      var logoEnabled  = ad.logoEnabled   || false;
      var logoUrl      = ad.logoUrl       || '';
      var logoPosition = ad.logoPosition  || 'top-right';
      var logoSize     = ad.logoSize      || '40px';
      var logoOpacity  = ad.logoOpacity   || '1';

      var hl  = safe(ad.headline    || '');
      var dsc = safe(ad.description || '');
      var btn = safe(ad.btnText     || 'Learn More');
      var inf = ad.infoFields || {};
      var sf  = ad.showFields || {};

      // Banner background CSS — exactly matching admin preview
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

      // Info fields HTML
      var infoHtml = '';
      if (sf.company && inf.companyName)
        infoHtml += '<div style="font-size:.73rem;font-weight:800;color:' + hlColor + ';letter-spacing:.03em;margin-bottom:3px">🏢 ' + safe(inf.companyName) + '</div>';
      if (sf.offer && inf.offerText)
        infoHtml += '<div style="font-size:.76rem;font-weight:700;color:' + hlColor + ';background:rgba(255,255,255,.2);display:inline-block;padding:2px 12px;border-radius:20px;margin-bottom:5px">🎉 ' + safe(inf.offerText) + '</div>';

      var contactLine = '';
      if (sf.phone && inf.phone) {
        var waNum = inf.phone.replace(/[^0-9]/g, '');
        contactLine += '<span style="font-size:.7rem;margin-right:8px"><a href="https://wa.me/91' + waNum + '" target="_blank" style="color:' + descColor + ';text-decoration:underline" onclick="event.stopPropagation()">📱 ' + safe(inf.phone) + '</a></span>';
      }
      if (sf.email && inf.email)
        contactLine += '<span style="font-size:.7rem;margin-right:8px"><a href="mailto:' + safe(inf.email) + '" style="color:' + descColor + ';text-decoration:underline" onclick="event.stopPropagation()">✉️ ' + safe(inf.email) + '</a></span>';
      if (sf.url && inf.url)
        contactLine += '<span style="font-size:.7rem"><a href="' + safe(inf.url) + '" target="_blank" style="color:' + descColor + ';text-decoration:underline" onclick="event.stopPropagation()">🌐 ' + safe(inf.url.replace(/^https?:\/\//, '')) + '</a></span>';
      if (contactLine)
        infoHtml += '<div style="margin-bottom:5px;line-height:1.9">' + contactLine + '</div>';
      if (sf.location && inf.location)
        infoHtml += '<div style="font-size:.68rem;color:' + descColor + ';opacity:.82;margin-bottom:3px">📍 ' + safe(inf.location) + '</div>';
      if (sf.address && inf.address)
        infoHtml += '<div style="font-size:.66rem;color:' + descColor + ';opacity:.75;margin-bottom:4px">🏠 ' + safe(inf.address) + '</div>';

      // Logo HTML
      var logoPosCss = 'position:absolute;';
      if      (logoPosition === 'top-left')       logoPosCss += 'top:8px;left:8px;';
      else if (logoPosition === 'top-center')     logoPosCss += 'top:8px;left:50%;transform:translateX(-50%);';
      else if (logoPosition === 'top-right')      logoPosCss += 'top:8px;right:8px;';
      else if (logoPosition === 'bottom-left')    logoPosCss += 'bottom:8px;left:8px;';
      else if (logoPosition === 'bottom-center')  logoPosCss += 'bottom:8px;left:50%;transform:translateX(-50%);';
      else                                         logoPosCss += 'bottom:8px;right:8px;';
      logoPosCss += 'height:' + logoSize + ';width:auto;opacity:' + logoOpacity + ';pointer-events:none;z-index:10;border-radius:4px;';
      var logoHtml = (logoEnabled && logoUrl)
        ? '<img src="' + safe(logoUrl) + '" style="' + logoPosCss + '" onerror="this.style.display=\'none\'">'
        : '';

      // Button align
      var btnAlignCss = btnPos === 'left' ? 'text-align:left' : btnPos === 'right' ? 'text-align:right' : 'text-align:center';

      // Headline (top or bottom based on hlPos)
      var hlHtml = '<div style="font-size:' + hlSize + ';font-weight:' + hlWeight + ';font-style:' + hlStyle + ';color:' + hlColor + ';text-decoration:' + hlDec + ';margin-bottom:' + (dsc || infoHtml ? '6px' : '10px') + '">' + hl + '</div>';

      inner =
        '<div style="' + bgCss + ';border-radius:' + borderRadius + ';padding:16px 18px;text-align:' + layoutAlign + ';cursor:' + (hasLink ? 'pointer' : 'default') + ';position:relative;overflow:hidden;width:100%;box-sizing:border-box">' +
          logoHtml +
          (hlPos !== 'bottom' ? hlHtml : '') +
          (dsc ? '<div style="font-size:' + descSize + ';font-weight:' + descWeight + ';font-style:' + descStyle2 + ';color:' + descColor + ';opacity:.92;margin-bottom:8px;line-height:1.5">' + dsc + '</div>' : '') +
          (infoHtml ? '<div style="margin-bottom:8px">' + infoHtml + '</div>' : '') +
          '<div style="' + btnAlignCss + ';margin-top:4px">' +
            '<span style="background:' + btnBg + ';color:' + btnColor + ';padding:6px 20px;border-radius:' + btnShape + ';font-size:' + btnFontSize + ';font-weight:700;display:inline-block">' + btn + '</span>' +
          '</div>' +
          (hlPos === 'bottom' ? '<div style="font-size:' + hlSize + ';font-weight:' + hlWeight + ';font-style:' + hlStyle + ';color:' + hlColor + ';text-decoration:' + hlDec + ';margin-top:8px">' + hl + '</div>' : '') +
        '</div>';

    // ══════════════════════════════
    // HTML AD
    // ══════════════════════════════
    } else if (ad.type === 'html') {
      el.style.display = 'block';
      el.innerHTML = '<div style="width:100%">' + (ad.htmlCode || '') + '</div>';
      trackImpression(ad._id);
      return;

    } else {
      return; // unknown type
    }

    // ── Wrap with click link ──
    var wrap = hasLink
      ? '<a href="' + safe(clickUrl) + '" target="_blank" rel="noopener noreferrer sponsored" ' +
          'style="display:block;text-decoration:none;' + sizeStyle + '" ' +
          'onclick="window.ksAdTrackClick && window.ksAdTrackClick(\'' + safe(ad._id || '') + '\')">' + inner + '</a>'
      : '<div style="' + sizeStyle + '">' + inner + '</div>';

    el.style.display = 'block';
    el.innerHTML = wrap;
    trackImpression(ad._id);
  }

  /* ── Impression track karna ── */
  function trackImpression(adId) {
    if (!adId) return;
    var db = getDb();
    if (db) {
      db.collection('ads').doc(adId)
        .update({ impressions: firebase.firestore.FieldValue.increment(1) })
        .catch(function() {});
    }
  }

  /* ── Click track karna (global) ── */
  window.ksAdTrackClick = function(adId) {
    if (!adId) return;
    var db = getDb();
    if (db) {
      db.collection('ads').doc(adId)
        .update({ clicks: firebase.firestore.FieldValue.increment(1) })
        .catch(function() {});
    }
  };

  /* ── Slot rotation ── */
  var _adsBySlot = {};
  var _timers    = {};
  var _curIdx    = {};

  function rotateSlot(slotName, elements) {
    var ads = _adsBySlot[slotName];
    if (!ads || !ads.length) return;
    _curIdx[slotName] = ((_curIdx[slotName] || 0) + 1) % ads.length;
    var nextAd = ads[_curIdx[slotName]];
    elements.forEach(function(el) { renderAd(el, nextAd); });
  }

  function startSlot(slotName, elements) {
    var ads = _adsBySlot[slotName];
    if (!ads || !ads.length) return;
    _curIdx[slotName] = 0;
    elements.forEach(function(el) { renderAd(el, ads[0]); });

    if (_timers[slotName]) clearInterval(_timers[slotName]);
    var interval = (ads[0].interval || 10) * 1000;
    if (interval > 0 && ads.length > 1) {
      _timers[slotName] = setInterval(function() {
        rotateSlot(slotName, elements);
      }, interval);
    }
  }

  /* ── Main: Firebase se ads load karna ── */
  function loadAds() {
    var db = getDb();
    if (!db) { setTimeout(loadAds, 2000); return; }

    var toolSlug = getToolSlug(); // e.g. "tool-whatsapp-bulk-sender-tool"
    var now = new Date();

    db.collection('ads').where('status', '==', 'active').get()
      .then(function(snap) {
        if (snap.empty) return;

        var bySlot = {};

        snap.forEach(function(doc) {
          var d = doc.data();
          if (d.expiry && new Date(d.expiry) < now) return; // expired skip

          var slots = d.slots || [];
          slots.forEach(function(slot) {
            // Check karo: kya ye ad is page ke liye hai?
            // Yes agar: slot generic hai (top-banner etc.) ya tool-specific slug match karta hai
            var isGeneric    = ['top-banner','sidebar-left','in-content','after-result','bottom-banner'].indexOf(slot) > -1;
            var isToolMatch  = (slot === toolSlug);
            var isAllTools   = (slot === 'all-tools');

            if (isGeneric || isToolMatch || isAllTools) {
              if (!bySlot[slot]) bySlot[slot] = [];
              bySlot[slot].push(Object.assign({}, d, { _id: doc.id }));
            }
          });
        });

        // Shuffle for variety
        Object.keys(bySlot).forEach(function(s) {
          bySlot[s] = bySlot[s].sort(function() { return Math.random() - 0.5; });
        });

        _adsBySlot = bySlot;

        // Sabhi [data-ks-slot] elements dhoondo
        var allSlotEls = document.querySelectorAll('[data-ks-slot]');
        var slotElements = {}; // slotName → [el, el, ...]

        allSlotEls.forEach(function(el) {
          // Styling — slot ko visible banana
          el.style.cssText = 'display:none;width:100%;text-align:center;box-sizing:border-box;margin:0 auto;';

          var slotName = el.getAttribute('data-ks-slot');
          if (!slotName) return;

          // Check: kya is slot ka ad mila?
          // Also check 'all-tools' aur tool-specific
          // Priority: exact slot match → all-tools → tool-specific slug → any available slot
          var adsForThisEl = bySlot[slotName] || bySlot['all-tools'] || (toolSlug ? bySlot[toolSlug] : null) || null;
          // Last resort: pick first available slot's ads
          if (!adsForThisEl) {
            var keys = Object.keys(bySlot);
            if (keys.length) adsForThisEl = bySlot[keys[0]];
          }

          if (!adsForThisEl || !adsForThisEl.length) {
            el.style.display = 'none'; // koi ad nahi → hide
            return;
          }

          var useSlot = bySlot[slotName] ? slotName : (bySlot['all-tools'] ? 'all-tools' : toolSlug);
          if (!slotElements[useSlot]) slotElements[useSlot] = [];
          slotElements[useSlot].push(el);
        });

        // Start rotation for each slot
        Object.keys(slotElements).forEach(function(s) {
          startSlot(s, slotElements[s]);
        });
      })
      .catch(function(e) { console.warn('[KsToolAds] Load error:', e.message); });
  }

  // Page load ke baad Firebase ensure karo, phir ads load karo
  function startKsAds() {
    ensureFirebase(function() {
      setTimeout(loadAds, 500); // Firebase ready — ads load karo
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startKsAds);
  } else {
    startKsAds();
  }

})();
