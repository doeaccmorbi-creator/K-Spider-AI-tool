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
    /* WhatsApp tool — file: whatsapp-bulk-sender.html → admin value: tool-whatsapp-bulk-sender */
    'whatsapp-bulk-sender-tool':    'tool-whatsapp-bulk-sender',
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
 
    var clickUrl = ad.clickUrl || '#';
    var hasLink  = clickUrl && clickUrl !== '#';
    var inner    = '';
 
    if (ad.type === 'image' && ad.imgUrl) {
      var sizeStyle = 'max-width:100%;height:auto;display:block;margin:0 auto;border-radius:8px;';
      if (ad.size === '728x90')   sizeStyle += 'width:728px;max-height:90px;object-fit:cover;';
      else if (ad.size === '300x250') sizeStyle += 'width:300px;height:250px;object-fit:cover;';
      else if (ad.size === '320x50')  sizeStyle += 'width:320px;max-height:50px;object-fit:cover;';
 
      inner = '<img src="' + safe(ad.imgUrl) + '" alt="' + safe(ad.imgAlt || 'Advertisement') + '" ' +
        'style="' + sizeStyle + '" loading="lazy" ' +
        'onerror="this.closest(\'[data-ks-slot]\').style.display=\'none\'">';
 
    } else if (ad.type === 'video' && ad.videoUrl) {
      var vurl = ad.videoUrl;
      var isYT    = /youtube\.com|youtu\.be/i.test(vurl);
      var isVimeo = /vimeo\.com/i.test(vurl);
      var vidHtml = '';
      var vsound  = ad.videoSound || 'muted';
      var vplay   = ad.videoPlay  || 'autoplay';
      var vposter = ad.videoPoster || '';
 
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
          '<source src="' + safe(vurl) + '" type="video/mp4">' +
          '</video>';
      }
      if (!vidHtml) return;
      inner = '<div style="width:100%">' + vidHtml + '</div>';
 
    } else if (ad.type === 'text') {
      var bg  = ad.bgColor || '#e8520a';
      var hl  = safe(ad.headline || '');
      var dsc = safe(ad.description || '');
      var btn = safe(ad.btnText || 'Learn More');
      var inf = ad.infoFields || {};
      var sf  = ad.showFields || {};
      var infoHtml = '';
 
      if (sf.company  && inf.companyName) infoHtml += '<div style="font-size:.72rem;font-weight:800;color:#fff;margin-bottom:2px">🏢 ' + safe(inf.companyName) + '</div>';
      if (sf.offer    && inf.offerText)   infoHtml += '<div style="font-size:.76rem;font-weight:700;background:rgba(255,255,255,.2);display:inline-block;padding:2px 10px;border-radius:20px;margin-bottom:4px;color:#fff">🎉 ' + safe(inf.offerText) + '</div>';
 
      var contactLine = '';
      if (sf.phone && inf.phone) {
        var waNum = inf.phone.replace(/[^0-9]/g, '');
        contactLine += '<span style="font-size:.7rem;margin-right:8px"><a href="https://wa.me/91' + waNum + '" target="_blank" style="color:#fff;text-decoration:underline" onclick="event.stopPropagation()">📱 ' + safe(inf.phone) + '</a></span>';
      }
      if (sf.email && inf.email)   contactLine += '<span style="font-size:.7rem;margin-right:8px"><a href="mailto:' + safe(inf.email) + '" style="color:#fff;text-decoration:underline" onclick="event.stopPropagation()">✉️ ' + safe(inf.email) + '</a></span>';
      if (sf.url   && inf.url)     contactLine += '<span style="font-size:.7rem"><a href="' + safe(inf.url) + '" target="_blank" style="color:#fff;text-decoration:underline" onclick="event.stopPropagation()">🌐 ' + safe(inf.url.replace(/^https?:\/\//, '')) + '</a></span>';
      if (contactLine) infoHtml += '<div style="margin-bottom:3px;line-height:1.9">' + contactLine + '</div>';
      if (sf.location && inf.location) infoHtml += '<div style="font-size:.68rem;color:rgba(255,255,255,.85)">📍 ' + safe(inf.location) + '</div>';
      if (sf.address  && inf.address)  infoHtml += '<div style="font-size:.66rem;color:rgba(255,255,255,.75);margin-top:1px">🏠 ' + safe(inf.address) + '</div>';
 
      inner = '<div style="background:' + bg + ';padding:14px 22px;border-radius:8px;text-align:center;color:#fff;width:100%;cursor:' + (hasLink ? 'pointer' : 'default') + '">' +
        '<div style="font-size:.95rem;font-weight:800;margin-bottom:3px">' + hl + '</div>' +
        (dsc ? '<div style="font-size:.80rem;opacity:.88;margin-bottom:8px">' + dsc + '</div>' : '') +
        (infoHtml ? '<div style="margin-bottom:8px">' + infoHtml + '</div>' : '') +
        '<span style="background:rgba(255,255,255,.22);padding:4px 16px;border-radius:20px;font-size:.76rem;font-weight:700">' + btn + '</span>' +
        '</div>';
 
    } else if (ad.type === 'html') {
      el.innerHTML = '<div style="font-size:10px;color:#aaa;margin-bottom:4px;text-align:center;letter-spacing:.05em">ADVERTISEMENT</div>' +
        '<div style="width:100%">' + (ad.htmlCode || '') + '</div>';
      trackImpression(ad._id);
      return;
 
    } else {
      return;
    }
 
    var wrap = hasLink
      ? '<a href="' + safe(clickUrl) + '" target="_blank" rel="noopener noreferrer sponsored" ' +
          'style="display:block;text-decoration:none;width:100%" ' +
          'onclick="window.ksAdTrackClick && window.ksAdTrackClick(\'' + safe(ad._id || '') + '\')">' + inner + '</a>'
      : '<div style="width:100%">' + inner + '</div>';
 
    el.innerHTML =
      '<div style="font-size:10px;color:#aaa;margin-bottom:4px;text-align:center;letter-spacing:.05em">ADVERTISEMENT</div>' +
      wrap;
 
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
          el.style.cssText = [
            'display:flex',
            'justify-content:center',
            'align-items:center',
            'width:100%',
            'padding:8px 0',
            'min-height:50px',
            'box-sizing:border-box'
          ].join(';');
 
          var slotName = el.getAttribute('data-ks-slot');
          if (!slotName) return;
 
          // Check: kya is slot ka ad mila?
          // Also check 'all-tools' aur tool-specific
          var adsForThisEl = bySlot[slotName] || bySlot['all-tools'] || bySlot[toolSlug] || null;
 
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
 
  // Page load ke 3 second baad ads load karo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(loadAds, 3000); });
  } else {
    setTimeout(loadAds, 3000);
  }
 
})();
 
