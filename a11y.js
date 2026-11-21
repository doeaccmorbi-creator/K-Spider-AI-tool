/* =========================================================================
   Dr. Shreyansh Academy — Dark mode + Accessibility (a11y.js)
   -------------------------------------------------------------------------
   * Theme: Auto (follows phone/PC) / Light / Dark   (one-tap 🌙 button in the top bar)
   * ♿ panel: text size, high contrast, reduce motion, readable font
   * Keyboard: every clickable card/option works with Tab + Enter/Space,
     focus is kept after the screen redraws, 1-4 / A-D pick an answer,
     ← → move between questions, M marks.
   * Screen readers: landmarks, aria labels, live announcements, skip link.
   Settings are remembered on the device only. Nothing here uses the network.
   Load this file in <head> (before app.js) so the theme is applied before the first paint.
   ========================================================================= */
(function(){
'use strict';
var KEY='dsa_a11y', D={theme:'auto',size:0,contrast:false,motion:'auto',font:false};
var ST=Object.assign({},D);
function lsGet(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } }
function lsSet(){ try{ localStorage.setItem(KEY,JSON.stringify(ST)); }catch(e){} }
var saved=lsGet(); if(saved) ST=Object.assign(ST,saved);
var ZOOM=[1,1.15,1.3];

/* ---------- CSS ---------- */
var css=
'html:root{--green-600:#167A42;--green-500:#167A42;--faint:#66748F}html .pill-gold{color:#7a5410}'+
'html[data-theme="dark"] .pill-gold{color:var(--gold-600)}html[data-theme="dark"] .eyebrow,html[data-theme="dark"] .step .num{color:var(--green-500)}html[data-theme="dark"] .deck-subject{color:var(--navy-800)!important}'+
'.a11y-skip{position:fixed;left:8px;top:-60px;z-index:1000;background:var(--navy-900);color:#fff;padding:10px 16px;border-radius:9px;font-weight:700;text-decoration:none;transition:top .15s}.a11y-skip:focus{top:8px}'+
'.a11y-btn{width:38px;height:38px;border-radius:10px;border:1.5px solid var(--border);background:var(--card);color:var(--ink);font-size:17px;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0}'+
'.a11y-btn:hover{border-color:var(--navy-700)}'+
'.a11y-bar{display:flex;gap:6px;align-items:center;margin-left:8px}'+
'.a11y-ov{position:fixed;inset:0;background:rgba(5,11,23,.55);z-index:900;display:flex;align-items:flex-start;justify-content:flex-end;padding:64px 14px 14px}'+
'.a11y-panel{width:340px;max-width:100%;max-height:calc(100vh - 80px);overflow:auto;background:var(--card);color:var(--ink);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-lg);padding:18px 18px 16px}'+
'.a11y-panel h3{font-size:16px;margin:0 0 2px}.a11y-panel p{margin:0 0 12px;font-size:12.5px;color:var(--muted)}'+
'.a11y-row{padding:11px 0;border-top:1px solid var(--border)}.a11y-row b{display:block;font-size:13px;margin-bottom:7px}'+
'.a11y-seg{display:flex;gap:6px;flex-wrap:wrap}'+
'.a11y-seg button{flex:1;min-width:64px;padding:9px 10px;border-radius:9px;border:1.5px solid var(--border);background:var(--card);color:var(--ink);font-size:13px;font-weight:600}'+
'.a11y-seg button[aria-pressed=true]{background:var(--navy-700);border-color:var(--navy-700);color:#fff}'+
'.a11y-tog{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;font-weight:600}'+
'.a11y-tog button{min-width:62px;padding:7px 12px;border-radius:99px;border:1.5px solid var(--border);background:var(--card);color:var(--ink);font-weight:700;font-size:12.5px}'+
'.a11y-tog button[aria-pressed=true]{background:var(--green-700);border-color:var(--green-700);color:#fff}'+
'.a11y-live{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'+
/* keyboard focus is always clearly visible */
':focus-visible{outline:3px solid #F5B301!important;outline-offset:2px!important;border-radius:6px}'+
'[role=button][tabindex]{cursor:pointer}'+
/* text size via zoom, with the 100vh layout numbers compensated */
'html[data-size="1"]{--z:1.15}html[data-size="2"]{--z:1.3}'+
'html[data-size="1"] body,html[data-size="2"] body{zoom:var(--z)}'+
'html[data-size="1"] .sidebar,html[data-size="2"] .sidebar{height:calc((100vh - 61px)/var(--z))}'+
'html[data-size="1"] .app-shell,html[data-size="2"] .app-shell{min-height:calc((100vh - 61px)/var(--z))}'+
'html[data-size="1"] .a11y-ov,html[data-size="2"] .a11y-ov{zoom:calc(1/var(--z))}'+
/* readable font */
'html[data-font="readable"] body,html[data-font="readable"] button,html[data-font="readable"] input,html[data-font="readable"] select,html[data-font="readable"] textarea{font-family:Verdana,Tahoma,"Trebuchet MS",sans-serif!important;letter-spacing:.02em;word-spacing:.08em}'+
'html[data-font="readable"] .q-text,html[data-font="readable"] .notes-reader p,html[data-font="readable"] .notes-reader li,html[data-font="readable"] .opt-row{line-height:1.75}'+
/* reduce motion */
'html[data-motion="reduce"] *,html[data-motion="reduce"] *::before,html[data-motion="reduce"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}'+
'@media (prefers-reduced-motion:reduce){html[data-motion="auto"] *,html[data-motion="auto"] *::before,html[data-motion="auto"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}'+
/* high contrast (light) */
'html[data-contrast="high"]{--border:#3a4660;--muted:#26334d;--faint:#33415c;--green-600:#157A41;--gold-600:#6b4a00;--red-600:#9b1c1c}'+
'html[data-contrast="high"] .card,html[data-contrast="high"] .opt-row,html[data-contrast="high"] .chapter-row,html[data-contrast="high"] .mcq-row,html[data-contrast="high"] .mcq-chip,html[data-contrast="high"] .btn-outline{border-width:2px}'+
'html[data-contrast="high"] a{text-decoration:underline}'+
'html[data-contrast="high"] .side-link{color:#fff}'+
/* ===================== DARK THEME ===================== */
'html[data-theme="dark"]{color-scheme:dark;'+
'--paper:#0B1220;--paper-2:#17233D;--card:#111B30;--ink:#E8EEFA;--muted:#B0BDD6;--faint:#8D9CB9;--border:#2A3956;'+
'--navy-950:#050B17;--navy-900:#2F6FDE;--navy-800:#8DB6FF;--navy-700:#2A63CF;--navy-600:#5C93F0;'+
'--green-100:#0F3322;--green-700:#62D993;--green-600:#187F46;--green-500:#2FC871;'+
'--gold-100:#3B2E10;--gold-600:#EDBE5A;--gold-500:#D9A73B;'+
'--red-100:#3E1919;--red-600:#FF9393;--red-500:#E15252;'+
'--shadow-sm:0 1px 2px rgba(0,0,0,.5);--shadow-md:0 8px 24px rgba(0,0,0,.45);--shadow-lg:0 24px 60px rgba(0,0,0,.6)}'+
'html[data-theme="dark"] body{background:var(--paper);color:var(--ink)}'+
'html[data-theme="dark"] h1,html[data-theme="dark"] h2,html[data-theme="dark"] h3,html[data-theme="dark"] h4,html[data-theme="dark"] h5{color:var(--ink)}'+
'html[data-theme="dark"] .hero-stat b,html[data-theme="dark"] .deck-q,html[data-theme="dark"] .stat-box b,html[data-theme="dark"] .content-callout b,html[data-theme="dark"] .subject-card h3{color:var(--ink)}'+
'html[data-theme="dark"] .topbar{background:rgba(11,18,32,.88)}'+
'html[data-theme="dark"] .brand{color:var(--ink)}'+
'html[data-theme="dark"] .topbar-nav{color:var(--navy-800)}'+
'html[data-theme="dark"] .btn-primary,html[data-theme="dark"] .mcq-chip.on,html[data-theme="dark"] .opt-row.selected .opt-letter,html[data-theme="dark"] .avatar-sm,html[data-theme="dark"] .feat .ic,html[data-theme="dark"] .a11y-skip{background:#2A63CF;color:#fff;border-color:#2A63CF}'+
'html[data-theme="dark"] .btn-primary:hover{background:#3571E0}'+
'html[data-theme="dark"] .btn-outline{color:var(--ink)}html[data-theme="dark"] .btn-outline:hover{background:var(--paper-2);border-color:var(--navy-600)}'+
'html[data-theme="dark"] .btn-ghost{color:var(--muted)}html[data-theme="dark"] .btn-ghost:hover{color:var(--ink)}'+
'html[data-theme="dark"] .role-tab.active{background:var(--card);color:var(--ink)}'+
'html[data-theme="dark"] .field input,html[data-theme="dark"] .field select,html[data-theme="dark"] input,html[data-theme="dark"] select,html[data-theme="dark"] textarea,html[data-theme="dark"] .mcq-sel{background:var(--paper);color:var(--ink);border-color:var(--border)}'+
'html[data-theme="dark"] select{background:var(--paper)!important;color:var(--ink)!important;border-color:var(--border)!important}'+
'html[data-theme="dark"] ::placeholder{color:var(--faint)}'+
'html[data-theme="dark"] .chapter-row,html[data-theme="dark"] .pnum,html[data-theme="dark"] .mcq-chip,html[data-theme="dark"] .mcq-row,html[data-theme="dark"] .mcq-rev,html[data-theme="dark"] .score-ring-inner{background:var(--card);color:var(--ink)}'+
'html[data-theme="dark"] .mcq-row.on{background:var(--paper-2)}'+
'html[data-theme="dark"] .pnum.answered{background:var(--green-600);color:#fff}html[data-theme="dark"] .pnum.marked{background:var(--gold-500);color:#2a1d00}'+
'html[data-theme="dark"] .pnum.current{color:var(--ink);border-color:var(--navy-600)}'+
'html[data-theme="dark"] .notes-reader p,html[data-theme="dark"] .notes-reader li,html[data-theme="dark"] .content-callout li,html[data-theme="dark"] .content-table td{color:var(--ink)}'+
'html[data-theme="dark"] .content-table th{color:var(--ink)}'+
'html[data-theme="dark"] .demo-note{border-color:#5b4716;color:#f2d98d}'+
'html[data-theme="dark"] .toast{background:#E8EEFA;color:#0B1220}'+
'html[data-theme="dark"] .explain-box{color:var(--ink)}'+
'html[data-theme="dark"] .pill-green{color:var(--green-700)}'+
'html[data-theme="dark"] .watermark-layer{opacity:.1}html[data-theme="dark"] .watermark-layer span{color:#fff}'+
'html[data-theme="dark"] .notes-img-wrap img{background:#fff}'+
'html[data-theme="dark"] .hero-bg{opacity:.7}'+
'html[data-theme="dark"] .score-ring{background:conic-gradient(var(--green-500) calc(var(--pct)*1%),var(--paper-2) 0)}'+
'html[data-theme="dark"] [style*="background:#fff"],html[data-theme="dark"] [style*="background: #fff"],html[data-theme="dark"] [style*="background:white"]{background:var(--card)!important}'+
'html[data-theme="dark"] [style*="color:#000"]{color:var(--ink)!important}'+
'html[data-theme="dark"] details>summary{color:var(--ink)}'+
/* dark + high contrast */
'html[data-theme="dark"][data-contrast="high"]{--border:#C3D0EA;--muted:#E1E9F8;--faint:#D0DAEE}'+
'@media (max-width:600px){.a11y-bar{margin-left:4px}.a11y-btn{width:34px;height:34px}.a11y-ov{padding:58px 8px 8px}.topbar-inner{padding:10px 12px!important;gap:6px}}'+
'@media print{.a11y-bar,.a11y-skip,.a11y-ov{display:none!important}}';
var st=document.createElement('style'); st.id='a11y-css'; st.textContent=css; document.head.appendChild(st);

/* ---------- apply ---------- */
function sysDark(){ try{ return window.matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; } }
function effTheme(){ return ST.theme==='auto'?(sysDark()?'dark':'light'):ST.theme; }
function apply(){
  var h=document.documentElement;
  h.setAttribute('data-theme',effTheme());
  h.setAttribute('data-size',String(ST.size));
  h.setAttribute('data-contrast',ST.contrast?'high':'normal');
  h.setAttribute('data-motion',ST.motion);
  h.setAttribute('data-font',ST.font?'readable':'normal');
  var m=document.querySelector('meta[name=theme-color]'); if(m) m.setAttribute('content',effTheme()==='dark'?'#0B1220':'#0E2148');
  var tb=document.getElementById('a11yTheme'); if(tb){ var d=effTheme()==='dark'; tb.textContent=d?'☀️':'🌙'; tb.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode'); tb.title=tb.getAttribute('aria-label'); }
}
try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){ if(ST.theme==='auto') apply(); }); }catch(e){}
function set(k,v){ ST[k]=v; lsSet(); apply(); if(document.getElementById('a11yPanel')) openPanel(true); }
window.A11Y={get:function(){ return Object.assign({},ST); },set:set,announce:announce};

/* ---------- announcer ---------- */
var live=document.createElement('div'); live.className='a11y-live'; live.setAttribute('role','status'); live.setAttribute('aria-live','polite'); live.id='a11yLive';
function announce(t){ live.textContent=''; setTimeout(function(){ live.textContent=t; },60); }

/* ---------- top-bar buttons + panel ---------- */
var lastFocus=null;
function openPanel(keep){
  if(!keep) lastFocus=document.activeElement;
  var old=document.getElementById('a11yOv'); if(old) old.remove();
  var ov=document.createElement('div'); ov.className='a11y-ov'; ov.id='a11yOv';
  function seg(key,opts){ return '<div class="a11y-seg" role="group">'+opts.map(function(o){ return '<button type="button" aria-pressed="'+(String(ST[key])===String(o[0]))+'" data-k="'+key+'" data-v="'+o[0]+'">'+o[1]+'</button>'; }).join('')+'</div>'; }
  function tog(key,label,on){ return '<div class="a11y-tog"><span id="t_'+key+'">'+label+'</span><button type="button" aria-labelledby="t_'+key+'" aria-pressed="'+!!on+'" data-t="'+key+'">'+(on?'ON':'OFF')+'</button></div>'; }
  ov.innerHTML='<div class="a11y-panel" id="a11yPanel" role="dialog" aria-modal="true" aria-labelledby="a11yH">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><h3 id="a11yH">Display &amp; accessibility</h3><p>Saved on this device only.</p></div><button type="button" class="a11y-btn" id="a11yClose" aria-label="Close settings">✕</button></div>'+
    '<div class="a11y-row"><b>Theme</b>'+seg('theme',[['auto','Auto'],['light','☀️ Light'],['dark','🌙 Dark']])+'</div>'+
    '<div class="a11y-row"><b>Text size</b>'+seg('size',[[0,'A Normal'],[1,'A+ Large'],[2,'A++ Extra']])+'</div>'+
    '<div class="a11y-row">'+tog('contrast','High contrast',ST.contrast)+'</div>'+
    '<div class="a11y-row">'+tog('motion','Reduce animations',ST.motion==='reduce')+'</div>'+
    '<div class="a11y-row">'+tog('font','Easy-to-read font',ST.font)+'</div>'+
    '<div class="a11y-row"><b>Keyboard shortcuts (practice / test)</b><div style="font-size:12.5px;color:var(--muted);line-height:1.7">1-4 or A-D: choose answer · → / N: next · ← / P: previous · M: mark · Tab + Enter: use any button</div></div>'+
    '<div class="a11y-row" style="display:flex;gap:8px"><button type="button" class="btn btn-outline btn-sm" id="a11yReset">Reset all</button><button type="button" class="btn btn-primary btn-sm" id="a11yDone" style="margin-left:auto">Done</button></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){
    if(e.target===ov) return closePanel();
    var b=e.target.closest('button'); if(!b) return;
    if(b.id==='a11yClose'||b.id==='a11yDone') return closePanel();
    if(b.id==='a11yReset'){ ST=Object.assign({},D); lsSet(); apply(); announce('Settings reset'); return openPanel(true); }
    if(b.dataset.k){ var v=b.dataset.v; if(b.dataset.k==='size') v=+v; set(b.dataset.k,v); }
    else if(b.dataset.t){ var t=b.dataset.t; if(t==='motion') set('motion',ST.motion==='reduce'?'auto':'reduce'); else set(t,!ST[t]); }
    var again=document.querySelector('#a11yPanel [data-k="'+(b.dataset.k||'')+'"][data-v="'+(b.dataset.v||'')+'"],#a11yPanel [data-t="'+(b.dataset.t||'')+'"]'); if(again) again.focus();
  });
  document.getElementById('a11yClose').focus();
}
function closePanel(){ var o=document.getElementById('a11yOv'); if(o) o.remove(); if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
document.addEventListener('keydown',function(e){
  var o=document.getElementById('a11yOv'); if(!o) return;
  if(e.key==='Escape'){ e.preventDefault(); closePanel(); return; }
  if(e.key==='Tab'){ // keep focus inside the dialog
    var f=[].slice.call(o.querySelectorAll('button')).filter(function(x){ return !x.disabled; });
    if(!f.length) return; var a=f[0], z=f[f.length-1];
    if(e.shiftKey && document.activeElement===a){ e.preventDefault(); z.focus(); }
    else if(!e.shiftKey && document.activeElement===z){ e.preventDefault(); a.focus(); }
    else if(!o.contains(document.activeElement)){ e.preventDefault(); a.focus(); }
  }
},true);

function mountBar(){
  var tb=document.querySelector('.topbar-inner'); if(!tb||document.getElementById('a11yBar')) return;
  var bar=document.createElement('div'); bar.className='a11y-bar'; bar.id='a11yBar';
  bar.innerHTML='<button type="button" class="a11y-btn" id="a11yTheme"></button><button type="button" class="a11y-btn" id="a11yOpen" aria-label="Display and accessibility settings" aria-haspopup="dialog" title="Display &amp; accessibility">♿</button>';
  var inst=document.getElementById('installAppBtn'); tb.insertBefore(bar,inst||null);
  document.getElementById('a11yTheme').onclick=function(){ set('theme',effTheme()==='dark'?'light':'dark'); announce(effTheme()==='dark'?'Dark mode on':'Light mode on'); };
  document.getElementById('a11yOpen').onclick=function(){ openPanel(); };
  apply();
}

/* ---------- accessibility enhancer (runs after every redraw) ---------- */
var uid=0, NATIVE={A:1,BUTTON:1,INPUT:1,SELECT:1,TEXTAREA:1,SUMMARY:1,LABEL:1,OPTION:1};
function enhance(root){
  root=root||document.getElementById('app'); if(!root) return;
  var app=document.getElementById('app');
  var tb=document.getElementById('topbar'); if(tb) tb.setAttribute('role','banner');
  var main=root.querySelector('.main');
  if(main){ main.setAttribute('role','main'); main.id='main-content'; main.setAttribute('tabindex','-1'); app.removeAttribute('role'); }
  else { app.setAttribute('role','main'); app.id='app'; }
  var sb=root.querySelector('.sidebar'); if(sb){ sb.setAttribute('role','navigation'); sb.setAttribute('aria-label','Main menu'); }
  [].forEach.call(root.querySelectorAll('.side-link'),function(b){ if(b.classList.contains('active')) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  // clickable non-buttons -> keyboard reachable
  [].forEach.call(root.querySelectorAll('[onclick]'),function(el){
    if(NATIVE[el.tagName]||el.hasAttribute('tabindex')&&el.getAttribute('role')) return;
    if(el.closest('button,a')) return;
    el.setAttribute('role','button'); if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0'); el.setAttribute('data-a11y-click','1');
  });
  [].forEach.call(root.querySelectorAll('.opt-row,.mcq-chip,.pnum,.role-tab,.tab-btn'),function(el){
    var on=el.classList.contains('selected')||el.classList.contains('on')||el.classList.contains('active')||el.classList.contains('current');
    el.setAttribute('aria-pressed',on?'true':'false');
  });
  [].forEach.call(root.querySelectorAll('.pnum'),function(el){ if(!el.hasAttribute('aria-label')) el.setAttribute('aria-label','Question '+el.textContent.trim()+(el.classList.contains('answered')?', answered':', not answered')+(el.classList.contains('marked')?', marked':'')); });
  [].forEach.call(root.querySelectorAll('.opt-row'),function(el){ var l=el.querySelector('.opt-letter'); if(l&&!el.hasAttribute('aria-label')){ el.setAttribute('aria-label','Option '+l.textContent.trim()+': '+(el.textContent||'').replace(l.textContent,'').trim().slice(0,160)+(el.classList.contains('correct')?' — correct answer':el.classList.contains('wrong')?' — your wrong answer':'')); } });
  // images without alt text (decorative by default)
  [].forEach.call(document.querySelectorAll('img:not([alt])'),function(i){ i.setAttribute('alt',''); });
  // labels <-> fields
  [].forEach.call(root.querySelectorAll('.field'),function(f){
    var l=f.querySelector('label'), c=f.querySelector('input,select,textarea'); if(!l||!c) return;
    if(!c.id) c.id='a11yf'+(++uid); if(!l.getAttribute('for')) l.setAttribute('for',c.id);
  });
  [].forEach.call(root.querySelectorAll('input,select,textarea'),function(c){
    if(c.type==='hidden'||c.getAttribute('aria-label')||c.getAttribute('aria-labelledby')) return;
    if((c.labels&&c.labels.length)||(c.id&&root.querySelector('label[for="'+c.id+'"]'))) return;
    var n=c.getAttribute('placeholder')||c.getAttribute('title'); if(n) c.setAttribute('aria-label',n);
  });
  // icon-only buttons: use title if any
  [].forEach.call(root.querySelectorAll('button:not([aria-label])'),function(b){ if(!b.textContent.trim()&&b.title) b.setAttribute('aria-label',b.title); });
  [].forEach.call(root.querySelectorAll('.side-link .ic,.empty .ic'),function(i){ i.setAttribute('aria-hidden','true'); });
  var th=document.getElementById('toastHost'); if(th&&!th.getAttribute('role')){ th.setAttribute('role','status'); th.setAttribute('aria-live','polite'); }
}
document.addEventListener('keydown',function(e){
  var t=e.target;
  if(t&&t.getAttribute&&t.getAttribute('data-a11y-click')&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); t.click(); }
});

/* ---------- keyboard shortcuts for practice / tests ---------- */
document.addEventListener('keydown',function(e){
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  var t=e.target, tag=t&&t.tagName; if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable)) return;
  if(document.getElementById('a11yOv')) return;
  var opts=document.querySelectorAll('#app .opt-list .opt-row, #app .q-card .opt-row'); if(!opts.length) return;
  var k=e.key.toLowerCase(), idx=-1;
  if(/^[1-9]$/.test(k)) idx=+k-1; else if(/^[a-f]$/.test(k)&&!(k==='m'||k==='n'||k==='p')) idx=k.charCodeAt(0)-97;
  if(idx>=0&&idx<opts.length){ e.preventDefault(); opts[idx].click(); return; }
  var btns=[].slice.call(document.querySelectorAll('#app .q-nav button')), byTxt=function(rx){ return btns.filter(function(b){ return rx.test(b.textContent)&&!b.disabled; })[0]; };
  var b=null;
  if(k==='arrowright'||k==='n') b=byTxt(/Next/); else if(k==='arrowleft'||k==='p') b=byTxt(/Previous/); else if(k==='m') b=byTxt(/Mark/);
  if(b){ e.preventDefault(); b.click(); }
});

/* ---------- keep keyboard focus + announce screen changes ---------- */
function sig(el){
  if(!el||el===document.body) return null;
  var app=document.getElementById('app'); if(!app||!app.contains(el)) return null;
  var o={tag:el.tagName,id:el.id||'',oc:el.getAttribute('onclick')||'',tx:(el.textContent||'').trim().slice(0,40),ph:el.getAttribute('placeholder')||'',nm:el.getAttribute('name')||''};
  try{ if(el.selectionStart!=null){ o.s=el.selectionStart; o.e=el.selectionEnd; } }catch(x){}
  var same=[].slice.call(app.querySelectorAll(el.tagName)); o.i=same.indexOf(el); return o;
}
function restore(o){
  if(!o) return; var app=document.getElementById('app'), c=null, i;
  if(o.id){ c=document.getElementById(o.id); }
  if(!c){ var all=[].slice.call(app.querySelectorAll(o.tag)); for(i=0;i<all.length;i++){ var a=all[i]; if((o.oc&&a.getAttribute('onclick')===o.oc&&(a.textContent||'').trim().slice(0,40)===o.tx)||(o.ph&&a.getAttribute('placeholder')===o.ph)||(o.nm&&a.getAttribute('name')===o.nm)){ c=a; break; } } }
  if(!c){ var al=app.querySelectorAll(o.tag); if(o.i>=0&&al[o.i]&&(al[o.i].textContent||'').trim().slice(0,40)===o.tx) c=al[o.i]; }
  if(c&&c.focus){ try{ c.focus({preventScroll:true}); if(o.s!=null&&c.setSelectionRange) c.setSelectionRange(o.s,o.e); }catch(x){} }
}
var lastView=null, TITLE='Dr. Shreyansh Academy';
function wrapRender(){
  if(typeof window.render!=='function'||window.render.__a11y) return;
  var orig=window.render;
  var w=function(){
    var s=null; try{ s=sig(document.activeElement); }catch(x){}
    var r=orig.apply(this,arguments);
    try{
      enhance();
      var view=(window.ROUTE&&ROUTE.view)||'';
      var h=document.querySelector('#app .main-head h2, #app h1, #app h2');
      var name=h?h.textContent.trim():'';
      document.title=(name?name+' — ':'')+TITLE;
      if(view!==lastView){ lastView=view; var m=document.getElementById('main-content')||document.getElementById('app'); if(m&&!(document.activeElement&&document.activeElement!==document.body&&document.getElementById('app').contains(document.activeElement))){ if(name) announce(name); } }
      else restore(s);
    }catch(x){}
    return r;
  };
  w.__a11y=true; window.render=w;
}

function init(){
  if(!live.parentNode) document.body.appendChild(live);
  if(!document.querySelector('.a11y-skip')){ var a=document.createElement('a'); a.className='a11y-skip'; a.href='#main-content'; a.textContent='Skip to main content'; a.onclick=function(e){ e.preventDefault(); var m=document.getElementById('main-content')||document.getElementById('app'); if(m){ m.setAttribute('tabindex','-1'); m.focus(); } }; document.body.insertBefore(a,document.body.firstChild); }
  mountBar(); wrapRender(); enhance(); apply();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
