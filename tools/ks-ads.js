/*!
 * K SPIDER AI â€” ks-ads.js  v11.4
 * www.kspiderai.in | By Gaurang Raval & Khush Raval | 2026
 *
 * UPDATES v11.4:
 *  âœ… .ks-ad-inner: inline-block â†’ block + margin:0 auto (true center, no left overflow)
 *  âœ… .ks-ad-wrap: display:flex + justify-content:center added (perfect centering)
 *  âœ… AdSense ins.adsbygoogle hidden (prevents AdSense ADVERTISEMENT label conflict)
 *
 * UPDATES v11.3:
 *  âœ… CRITICAL: Removed CSS contain:layout style â€” Chrome/Android native ADVERTISEMENT label fix
 *
 * UPDATES v11.2:
 *  âœ… Image alt="" fix â€” prevents "Advertisement" alt text on broken images
 *  âœ… Image onerror â€” broken image slot auto-hides
 *
 * UPDATES v11.1:
 *  âœ… Overflow-safe scaling via ResizeObserver
 *  âœ… html/body overflow-x:hidden
 *  âœ… Leaderboard responsive CSS for 728x90 / 970x90
 *
 * UPDATES v11.0:
 *  âœ… Screen jump fix â€” height lock + fade cross-transition
 *  âœ… Animated HTML banners â€” self-contained <style> CSS preserved
 *  âœ… Full text-ad styling support
 *  âœ… Firestore-efficient rotation (setInterval)
 *  âœ… .ks-slot-inner wrapper pattern
 *
 * USAGE:
 *   1. <script src="ks-ads.js"></script>
 *   2. <div data-ks-slot="top-banner"></div>
 *   3. Done. Ads load automatically.
 */

(function(global) {
  'use strict';

  /* â”€â”€ Guard: run only once per page â”€â”€ */
  if (global.__ksAdsLoaded) return;
  global.__ksAdsLoaded = true;

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     CONFIG
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var FB_CFG = {
    apiKey:            'AIzaSyBHNEgIT6lIZNAWcd5Ssbr4BpBHKzqETk8',
    authDomain:        'kspideraimain.firebaseapp.com',
    projectId:         'kspideraimain',
    storageBucket:     'kspideraimain.firebasestorage.app',
    messagingSenderId: '940003391760',
    appId:             '1:940003391760:web:8617000465b6991d348d95'
  };

  /* Slot â†’ minimum heights (px) â€” prevents page collapse while loading */
  var SLOT_MIN_H = {
    'top-banner':    90,
    'bottom-banner': 90,
    'in-content':   120,
    'after-result': 120,
    'sidebar-left': 250,
    'sidebar-right':250
  };

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     CSS INJECTION â€” once per page
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  (function injectCss() {
    if (document.getElementById('ks-ads-css')) return;
    var s = document.createElement('style');
    s.id  = 'ks-ads-css';
    s.textContent = [
    /* â”€â”€ v11.2 ADSENSE PLACEHOLDER FIX â”€â”€
       Google AdSense reserves space with "ADVERTISEMENT" label above ins tags.
       Since KSpider uses its own ks-ads system, hide AdSense placeholders to
       prevent the "ADVERTISEMENT" text appearing next to KSpider ad banners. */
    'ins.adsbygoogle{display:none!important}',
    /* Also hide the AdSense label/ribbon that appears beside ad containers */
    '.adsbygoogle-noablate,.google-auto-placed,#google_ads_frame1,',
    '#google_ads_frame2,.GoogleActiveViewElement,',
    '[id^="google_ads_iframe"]{display:none!important}',
    /* â”€â”€ END ADSENSE FIX â”€â”€ */
    /* â”€â”€ v11.1 OVERFLOW FIX: html/body never scroll horizontally because of ads â”€â”€ */
    'html{overflow-x:hidden}',
      /* Wrapper â€” NOTE: NO contain property â€” contain:style triggers Chrome/Android
         to inject a native "ADVERTISEMENT" label on ad containers */
      '.ks-ad-wrap{width:100%;text-align:center;max-width:100vw;overflow:hidden;box-sizing:border-box;position:relative;display:flex;justify-content:center;align-items:center}',
      /* Inner fades between banners â€” no pop/jump. block+margin:auto = true centering */
      '.ks-ad-inner{display:block;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;',
        'border-radius:8px;transition:opacity .32s ease;will-change:opacity;margin:0 auto}',
      '.ks-ad-inner.ks-fading{opacity:0}',
      /* â”€â”€ v11.1: force every element inside an ad to respect container width â”€â”€ */
      '.ks-ad-inner *{max-width:100%;box-sizing:border-box}',
      '.ks-ad-inner img,.ks-ad-inner video,.ks-ad-inner iframe{max-width:100%;height:auto;display:block}',
      /* Slot-specific min-heights */
      '[data-ks-slot="top-banner"] .ks-ad-inner,',
      '[data-slot="top-banner"] .ks-ad-inner{min-height:90px}',
      '[data-ks-slot="bottom-banner"] .ks-ad-inner,',
      '[data-slot="bottom-banner"] .ks-ad-inner{min-height:90px}',
      '[data-ks-slot="in-content"] .ks-ad-inner,',
      '[data-slot="in-content"] .ks-ad-inner{min-height:120px}',
      '[data-ks-slot="after-result"] .ks-ad-inner,',
      '[data-slot="after-result"] .ks-ad-inner{min-height:120px}',
      '[data-ks-slot="sidebar-left"] .ks-ad-inner,',
      '[data-ks-slot="sidebar-right"] .ks-ad-inner,',
      '[data-slot="sidebar-left"] .ks-ad-inner,',
      '[data-slot="sidebar-right"] .ks-ad-inner{min-height:250px;width:300px;max-width:100%}',
      /* â”€â”€ v11.1 LEADERBOARD (728x90 / 970x90) RESPONSIVE FIX â”€â”€
         Desktop: full 728/970px width, centered.
         Tablet (â‰¤900px): scales to viewport width.
         Mobile (â‰¤480px): drops to 320x50/100 safe size automatically. */
      '.ks-ad-leaderboard{width:100%;max-width:728px;margin:0 auto;overflow:hidden}',
      '.ks-ad-leaderboard.ks-lb-970{max-width:970px}',
      '@media(max-width:900px){',
        '.ks-ad-leaderboard,.ks-ad-leaderboard.ks-lb-970{max-width:100%}',
      '}',
      '@media(max-width:480px){',
        '[data-ks-slot="top-banner"] .ks-ad-inner,',
        '[data-slot="top-banner"] .ks-ad-inner,',
        '[data-ks-slot="bottom-banner"] .ks-ad-inner,',
        '[data-slot="bottom-banner"] .ks-ad-inner{min-height:50px}',
        '.ks-ad-leaderboard{max-height:100px}',
      '}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  })();

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     FIREBASE HELPERS
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function getDb() {
    try {
      if (global.KS && global.KS.db) return global.KS.db;
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(FB_CFG);
        return firebase.firestore();
      }
    } catch (e) {}
    return null;
  }

  function waitForFirebase(cb, tries) {
    tries = tries || 0;
    if (typeof firebase !== 'undefined') { cb(); return; }
    if (tries > 25) { console.warn('[ks-ads] Firebase timeout'); return; }
    setTimeout(function() { waitForFirebase(cb, tries + 1); }, 250);
  }

  function loadFirebaseIfNeeded(cb) {
    if (typeof firebase !== 'undefined') { cb(); return; }
    var ver = '9.23.0', base = 'https://www.gstatic.com/firebasejs/' + ver + '/';
    function loadScript(src, next) {
      if (document.querySelector('script[src="' + src + '"]')) { if (next) next(); return; }
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = next || null;
      document.head.appendChild(s);
    }
    loadScript(base + 'firebase-app-compat.js', function() {
      loadScript(base + 'firebase-firestore-compat.js', cb);
    });
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     UTILITIES
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function bgCss(ad) {
    var c1 = ad.bgColor || ad.bgColor1 || '#e8520a';
    var c2 = ad.bgColor2;
    var dir = ad.gradientDir || '135deg';
    if (c2 && c2 !== c1) return 'background:linear-gradient(' + dir + ',' + c1 + ',' + c2 + ')';
    return 'background:' + c1;
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     TRACKING
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function trackImp(id) {
    if (!id) return;
    var db = getDb();
    if (db) db.collection('ads').doc(id)
      .update({ impressions: firebase.firestore.FieldValue.increment(1) })
      .catch(function() {});
  }

  global.kspiderAdClick = function(id) {
    if (!id) return;
    var db = getDb();
    if (db) db.collection('ads').doc(id)
      .update({ clicks: firebase.firestore.FieldValue.increment(1) })
      .catch(function() {});
  };
  global.ksAdTrackClick = global.kspiderAdClick;

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     INNER ELEMENT â€” get or create .ks-ad-inner
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function getInner(container) {
    var inner = container.querySelector('.ks-ad-inner');
    if (!inner) {
      container.innerHTML = '';
      inner = document.createElement('div');
      inner.className = 'ks-ad-inner';
      container.appendChild(inner);
    }
    return inner;
  }

  function hideSlot(container) {
    var inner = getInner(container);
    inner.innerHTML = '';
    inner.style.display = 'none';
    container.style.display = 'none';
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     AD RENDERER
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function renderAd(inner, ad) {
    var clickUrl = (ad.clickUrl || '').trim();
    var hasLink  = !!(clickUrl && clickUrl !== '#');
    var adId     = ad._id || '';
    var html     = '';

    /* â”€â”€ IMAGE â”€â”€ */
    if (ad.type === 'image') {
      if (!ad.imgUrl) { inner.style.display = 'none'; return; }
      /* alt="" intentional â€” prevents "Advertisement" text showing if image fails to load.
         onerror hides the broken slot cleanly instead of showing alt text. */
      var imgTag = '<img src="' + esc(ad.imgUrl) + '" alt="" ' +
        'style="width:100%;height:auto;display:block;border-radius:8px;object-fit:cover" loading="lazy" ' +
        'onerror="this.closest(\'[data-ks-slot],[data-slot]\')&&(this.closest(\'[data-ks-slot],[data-slot]\').style.display=\'none\')">';
      html = hasLink
        ? '<a href="' + esc(clickUrl) + '" target="_blank" rel="noopener noreferrer sponsored" ' +
            'style="display:block;text-decoration:none" ' +
            'onclick="kspiderAdClick(\'' + esc(adId) + '\')">' + imgTag + '</a>'
        : '<div>' + imgTag + '</div>';

    /* â”€â”€ VIDEO â”€â”€ */
    } else if (ad.type === 'video') {
      if (!ad.videoUrl) { inner.style.display = 'none'; return; }
      var vurl  = ad.videoUrl;
      var vplay = ad.videoPlay   === 'autoplay' ? 'autoplay loop playsinline' : '';
      var vmute = ad.videoSound  === 'muted'    ? 'muted' : '';
      var vpst  = ad.videoPoster ? ' poster="' + esc(ad.videoPoster) + '"' : '';
      var vHtml = '';
      if (/youtube\.com|youtu\.be/i.test(vurl)) {
        var ytId = vurl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytId) {
          var ytp = 'autoplay=' + (ad.videoPlay === 'autoplay' ? '1' : '0') +
            '&mute=' + (ad.videoSound === 'muted' ? '1' : '0') + '&loop=1&rel=0';
          vHtml = '<div style="position:relative;width:100%;padding-top:56.25%;border-radius:8px;overflow:hidden">' +
            '<iframe style="position:absolute;inset:0;width:100%;height:100%;border:0" ' +
            'src="https://www.youtube.com/embed/' + ytId[1] + '?' + ytp + '" ' +
            'allow="autoplay;encrypted-media" allowfullscreen></iframe></div>';
        }
      } else {
        vHtml = '<video ' + vplay + ' ' + vmute + vpst + ' controls ' +
          'style="width:100%;max-height:280px;border-radius:8px;background:#000">' +
          '<source src="' + esc(vurl) + '" type="video/mp4"></video>';
      }
      if (!vHtml) { inner.style.display = 'none'; return; }
      var vClick = hasLink
        ? 'onclick="kspiderAdClick(\'' + esc(adId) + '\');window.open(\'' + esc(clickUrl) + '\',\'_blank\')"' : '';
      html = '<div style="cursor:' + (hasLink ? 'pointer' : 'default') + '" ' + vClick + '>' + vHtml + '</div>';

    /* â”€â”€ TEXT â€” full admin styling support â”€â”€ */
    } else if (ad.type === 'text') {
      var br  = ad.borderRadius || '12px';
      var al  = ad.layoutAlign  || 'center';
      var af  = al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center';

      /* Headline */
      var hls = 'font-size:'   + (ad.hlSize         || '1rem')   +
        ';font-weight:'        + (ad.hlWeight        || '800')    +
        ';font-style:'         + (ad.hlStyle         || 'normal') +
        ';color:'              + (ad.hlColor         || '#fff')   +
        ';text-decoration:'    + (ad.hlDecoration    || 'none')   +
        ';text-transform:'     + (ad.hlTransform     || 'none')   +
        ';letter-spacing:'     + (ad.hlLetterSpacing || 'normal') +
        ';text-shadow:'        + (ad.hlTextShadow    || 'none')   +
        ';line-height:1.3;margin-bottom:5px;';
      if (ad.hlHighlight && ad.hlHighlight !== '#00000000')
        hls += 'background:' + ad.hlHighlight + ';padding:2px 6px;border-radius:4px;';

      /* Description */
      var ds = 'font-size:'  + (ad.descSize   || '.8rem')               +
        ';font-weight:'      + (ad.descWeight  || '400')                 +
        ';font-style:'       + (ad.descStyle   || 'normal')              +
        ';color:'            + (ad.descColor   || 'rgba(255,255,255,.88)') +
        ';line-height:1.5;margin-bottom:8px;';

      /* Button */
      var bb   = ad.btnBg       || '#fff';
      var bc   = ad.btnColor    || '#e8520a';
      var bfz  = ad.btnFontSize || '.78rem';
      var bsh  = ad.btnShape    || '20px';
      var bp   = ad.btnPosition || 'center';
      var bpf  = bp === 'left' ? 'flex-start' : bp === 'right' ? 'flex-end' : 'center';
      var btnH = '';
      if (ad.btnText) {
        if (hasLink)
          btnH = '<a href="' + esc(clickUrl) + '" target="_blank" rel="noopener sponsored" ' +
            'style="background:' + bb + ';color:' + bc + ';font-size:' + bfz +
            ';border-radius:' + bsh + ';padding:7px 20px;font-weight:700;text-decoration:none;' +
            'font-family:inherit;display:inline-block" ' +
            'onclick="kspiderAdClick(\'' + esc(adId) + '\');event.stopPropagation()">' + esc(ad.btnText) + ' â†’</a>';
        else
          btnH = '<span style="background:' + bb + ';color:' + bc + ';font-size:' + bfz +
            ';border-radius:' + bsh + ';padding:7px 20px;font-weight:700;display:inline-block">' +
            esc(ad.btnText) + '</span>';
      }

      /* Logo watermark */
      var logo = '';
      if (ad.logoEnabled && ad.logoUrl) {
        var lp  = ad.logoPosition || 'top-right';
        var ls  = ad.logoSize     || '40px';
        var lo  = ad.logoOpacity  || '1';
        var lcs = 'position:absolute;opacity:' + lo + ';width:' + ls + ';height:' + ls +
          ';object-fit:contain;border-radius:6px;z-index:3;';
        if      (lp === 'top-right')    lcs += 'top:8px;right:8px;';
        else if (lp === 'top-left')     lcs += 'top:8px;left:8px;';
        else if (lp === 'bottom-right') lcs += 'bottom:8px;right:8px;';
        else                            lcs += 'bottom:8px;left:8px;';
        logo = '<img src="' + esc(ad.logoUrl) + '" style="' + lcs + '" alt="logo" loading="lazy" ' +
          'onerror="this.remove()">';
      }

      /* Contact / info fields */
      var sf = ad.showFields  || {};
      var inf= ad.infoFields  || {};
      var ii = '';
      if (sf.company  && inf.companyName)
        ii += '<div style="font-size:.7rem;font-weight:800;color:#fff;opacity:.9;margin-bottom:2px">ðŸ¢ ' + esc(inf.companyName) + '</div>';
      if (sf.offer    && inf.offerText)
        ii += '<div style="font-size:.7rem;font-weight:700;background:rgba(255,255,255,.18);display:inline-block;' +
          'padding:2px 12px;border-radius:20px;margin-bottom:6px;color:#fff">ðŸŽ ' + esc(inf.offerText) + '</div>';
      var cl = '';
      if (sf.phone && inf.phone) {
        var pn = inf.phone.replace(/[^0-9+]/g,'');
        cl += '<a href="tel:' + esc(pn) + '" style="color:#fff;text-decoration:underline;font-size:.7rem;margin-right:8px" ' +
          'onclick="event.stopPropagation()">ðŸ“ž ' + esc(inf.phone) + '</a>';
      }
      if (sf.email && inf.email)
        cl += '<a href="mailto:' + esc(inf.email) + '" style="color:#fff;text-decoration:underline;font-size:.7rem;margin-right:8px" ' +
          'onclick="event.stopPropagation()">âœ‰ï¸ ' + esc(inf.email) + '</a>';
      if (sf.url && inf.url)
        cl += '<a href="' + esc(inf.url) + '" target="_blank" rel="noopener" ' +
          'style="color:#fff;text-decoration:underline;font-size:.7rem" onclick="event.stopPropagation()">ðŸŒ ' +
          esc(inf.url.replace(/^https?:\/\/(www\.)?/,'')) + '</a>';
      if (cl) ii += '<div style="margin-bottom:4px;line-height:2">' + cl + '</div>';
      if (sf.location && inf.location)
        ii += '<div style="font-size:.67rem;color:rgba(255,255,255,.8);margin-bottom:2px">ðŸ“ ' + esc(inf.location) + '</div>';
      if (sf.address  && inf.address)
        ii += '<div style="font-size:.65rem;color:rgba(255,255,255,.72)">ðŸ  ' + esc(inf.address) + '</div>';

      var tStyle = bgCss(ad) + ';border-radius:' + br + ';text-align:' + al +
        ';padding:16px 18px;position:relative;width:100%;box-sizing:border-box;' +
        'cursor:' + (hasLink ? 'pointer' : 'default') + ';';
      var tClick = hasLink
        ? 'onclick="kspiderAdClick(\'' + esc(adId) + '\');window.open(\'' + esc(clickUrl) + '\',\'_blank\')"' : '';

      html = '<div ' + tClick + ' style="' + tStyle + '">' + logo +
        '<div style="' + hls + '">' + esc(ad.headline || '') + '</div>' +
        (ad.description ? '<div style="' + ds + '">' + esc(ad.description) + '</div>' : '') +
        (ii ? '<div style="margin-bottom:8px">' + ii + '</div>' : '') +
        (btnH ? '<div style="display:flex;justify-content:' + bpf + '">' + btnH + '</div>' : '') +
        '</div>';

    /* â”€â”€ HTML â€” animated banners: preserve self-contained <style> CSS â”€â”€ */
    } else if (ad.type === 'html') {
      if (!ad.htmlCode) { inner.style.display = 'none'; return; }
      /* Strip <script> and event handlers for XSS safety, but KEEP <style> tags */
      var safeHtml = ad.htmlCode
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
      inner.innerHTML = '<div style="width:100%;border-radius:8px;overflow:hidden">' + safeHtml + '</div>';
      inner.style.display  = 'block';
      inner.style.minHeight= '';   /* HTML ads define their own height */
      trackImp(adId);
      return;

    } else {
      inner.style.display = 'none';
      return;
    }

    inner.innerHTML    = html;
    inner.style.display= 'block';
    trackImp(adId);
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     v11.1 â€” VIEWPORT-SAFE SCALING (ResizeObserver)
     Watches every ad slot; if rendered content is wider than
     the slot/viewport, applies a CSS transform scale-down so
     nothing overflows horizontally. Non-destructive â€” only
     adds a transform, never changes underlying ad HTML.
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function applyOverflowGuard(container, inner) {
    function fit() {
      if (!inner || !container) return;
      // Reset any previous scaling before measuring
      inner.style.transform = '';
      inner.style.transformOrigin = 'top center';
      var availW   = container.clientWidth || container.offsetWidth || window.innerWidth;
      var contentW = inner.scrollWidth;
      if (availW > 0 && contentW > availW + 1) {
        var scale = availW / contentW;
        inner.style.transform = 'scale(' + scale.toFixed(4) + ')';
        // Compensate height so layout doesn\'t leave a gap
        var h = inner.scrollHeight * scale;
        container.style.height = h + 'px';
      } else {
        container.style.height = '';
      }
    }
    fit();
    // Re-fit on resize (debounced via ResizeObserver where available)
    if (typeof ResizeObserver !== 'undefined') {
      try {
        var ro = new ResizeObserver(function() { fit(); });
        ro.observe(container);
        if (!container._ksRO) container._ksRO = ro;
      } catch (e) {}
    } else {
      window.addEventListener('resize', fit);
    }
  }

  /* Detect 728x90 / 970x90 style leaderboard ads and tag with
     a responsive class so the CSS rules above apply cleanly. */
  function tagLeaderboardSize(container, ad) {
    var w = parseInt(ad.width || (ad.size && String(ad.size).split('x')[0]) || 0, 10);
    if (w >= 970) {
      container.classList.add('ks-ad-leaderboard', 'ks-lb-970');
    } else if (w >= 600) {
      container.classList.add('ks-ad-leaderboard');
    }
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     SLOT MANAGEMENT
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var _slotData   = {};   /* key â†’ {ads, idx, timer, heightLocked} */

  function getSlotKey(container, index) {
    var slot = container.getAttribute('data-ks-slot') || container.getAttribute('data-slot') || 'top-banner';
    return slot + '_' + index;
  }

  function loadSlot(container, index) {
    var db   = getDb(); if (!db) return;
    var slot = container.getAttribute('data-ks-slot') || container.getAttribute('data-slot') || 'top-banner';
    var key  = getSlotKey(container, index);
    var today= new Date().toISOString().split('T')[0];

    db.collection('ads')
      .where('status', '==', 'active')
      .where('slots',  'array-contains', slot)
      .limit(10)
      .get()
      .then(function(snap) {
        var ads = [];
        snap.forEach(function(doc) {
          var d = doc.data();
          if (d.expiry && d.expiry < today) return;
          d._id = doc.id;
          ads.push(d);
        });

        if (!ads.length) { hideSlot(container); return; }

        var state = { ads: ads, idx: 0, timer: null, heightLocked: false };
        _slotData[key] = state;

        var inner = getInner(container);
        container.style.display = 'block';
        // v11.1: ensure container itself never overflows viewport
        container.style.maxWidth = '100%';
        container.style.overflow = 'hidden';
        container.style.boxSizing = 'border-box';

        /* Render first ad */
        tagLeaderboardSize(container, ads[0]);
        renderAd(inner, ads[0]);
        // v11.1: scale down if content wider than slot/viewport
        setTimeout(function(){ applyOverflowGuard(container, inner); }, 60);

        /* Start rotation if multiple ads */
        if (ads.length > 1) {
          var ms = Math.max(3000, (parseInt(ads[0].interval) || 10) * 1000);
          /* Measure all banner heights and lock to max â€” prevents any jump */
        setTimeout(function(){
          var maxH = inner.offsetHeight || 0;
          var probe = document.createElement('div');
          probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;'+
            'width:'+(inner.offsetWidth||300)+'px;left:-9999px;top:0;';
          document.body.appendChild(probe);
          ads.forEach(function(ad){ probe.innerHTML=''; renderAd(probe,ad); var h=probe.offsetHeight; if(h>maxH)maxH=h; });
          probe.parentNode.removeChild(probe);
          if(maxH>0){ inner.style.minHeight=maxH+'px'; state.heightLocked=true; }
        }, 500);

        state.timer = setInterval(function() {
            /* Fade out */
            inner.classList.add('ks-fading');
            setTimeout(function() {
              state.idx = (state.idx + 1) % state.ads.length;
              tagLeaderboardSize(container, state.ads[state.idx]);
              renderAd(inner, state.ads[state.idx]);
              inner.classList.remove('ks-fading');
              // v11.1: re-check overflow after each rotation
              setTimeout(function(){ applyOverflowGuard(container, inner); }, 60);
            }, 300);
          }, ms);
        }
      })
      .catch(function(e) { console.warn('[ks-ads] ' + e.message); });
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     INIT
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function initAllSlots() {
    var slots = document.querySelectorAll(
      '[data-ks-slot],[data-slot],.kspider-ad-slot'
    );
    slots.forEach(function(el, i) {
      /* NOTE: No contain property â€” contain:style causes Chrome/Android to show
         a native "ADVERTISEMENT" label over the ad slot */
      el.style.width       = '100%';
      el.style.maxWidth    = '100%';
      el.style.overflow    = 'hidden';
      el.style.textAlign   = 'center';
      el.style.boxSizing   = 'border-box';
      el.style.margin      = '0 auto';
      loadSlot(el, i);
    });
  }

  function boot() {
    loadFirebaseIfNeeded(function() {
      waitForFirebase(function() {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initAllSlots);
        } else {
          setTimeout(initAllSlots, 150);
        }
      });
    });
  }

  boot();

  /* Public API */
  global.KsAds = {
    version:   '11.4',
    reload:    initAllSlots,
    trackClick:global.kspiderAdClick
  };

  console.log('[ks-ads.js] v11.4 ready (centered + ADVERTISEMENT-free) | kspiderai.in');

})(window);
