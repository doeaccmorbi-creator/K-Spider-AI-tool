/* =========================================================================
   Dr. Shreyansh Academy — Error Log (errlog.js)
   -------------------------------------------------------------------------
   Catches every JavaScript error / failed promise / failed script load,
   keeps the last 40 on the device (localStorage) and — when the person is
   signed in and online — sends ONE small record per distinct error per day
   to Firestore "errorLogs" (same error again = just count + 1, so it stays
   inside the free Spark quota). Max 6 uploads per visit.
   Privacy: e-mails / long tokens are stripped, only the uid is stored.
   Admin sees the list in the app: sidebar -> "Error Log".
   This file must load BEFORE app.js.
   ========================================================================= */
(function(){
'use strict';
var KEY='dsa_errlog', MAX=40, SENT=0, MAXSENT=6, VER=window.DSA_VER||'20261118';
var E=window.ERRLOG={};

function ls(){ try{ return window.localStorage; }catch(e){ return null; } }
function readAll(){ var s=ls(); if(!s) return []; try{ return JSON.parse(s.getItem(KEY)||'[]')||[]; }catch(e){ return []; } }
function writeAll(a){ var s=ls(); if(!s) return; try{ s.setItem(KEY,JSON.stringify(a.slice(-MAX))); }catch(e){} }
function clean(t,n){
  t=String(t==null?'':t);
  t=t.replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g,'[email]').replace(/[A-Za-z0-9_\-]{32,}/g,'[token]');
  return t.length>n?t.slice(0,n)+'…':t;
}
function hash(s){ var h=5381,i; for(i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))|0; } return (h>>>0).toString(36); }
function day(){ var d=new Date(); return d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2); }
function ctx(){
  var view='', role='';
  try{ view=(window.ROUTE&&ROUTE.view)||''; }catch(e){}
  try{ role=(window.DB&&DB.currentUser&&DB.currentUser.role)||''; }catch(e){}
  return {view:view,role:role};
}
function canSend(){
  try{ return !!(window.FIREBASE_ENABLED && window.fbDb && window.fbAuth && fbAuth.currentUser && navigator.onLine!==false); }catch(e){ return false; }
}
function send(r){
  if(SENT>=MAXSENT || !canSend()) return false;
  SENT++;
  try{
    var id=day()+'_'+r.h;
    var F=firebase.firestore.FieldValue;
    fbDb.collection('errorLogs').doc(id).set({
      msg:r.msg, src:r.src, line:r.line, stack:r.stack, kind:r.kind, ver:VER,
      view:r.view, role:r.role, ua:r.ua, uid:fbAuth.currentUser.uid,
      count:F.increment(1), last:F.serverTimestamp()
    },{merge:true}).then(function(){ r.sent=1; var a=readAll(); a.forEach(function(x){ if(x.h===r.h&&x.t===r.t) x.sent=1; }); writeAll(a); }).catch(function(){});
  }catch(e){}
  return true;
}
function record(kind,msg,src,line,col,stack){
  try{
    msg=clean(msg,300); if(!msg) return;
    var c=ctx();
    var r={t:Date.now(),kind:kind,msg:msg,src:clean(String(src||'').replace(/^https?:\/\/[^\/]+/,''),120),line:+line||0,
      stack:clean(stack,900),view:c.view,role:c.role,ua:clean(navigator.userAgent,120),h:hash(kind+'|'+msg+'|'+src+'|'+line)};
    var a=readAll(), last=a[a.length-1];
    if(last && last.h===r.h && Date.now()-last.t<60000) return; // same error in a loop — ignore
    a.push(r); writeAll(a);
    send(r);
  }catch(e){}
}

window.addEventListener('error',function(ev){
  if(ev && ev.target && ev.target!==window && (ev.target.src||ev.target.href)){ // failed <script>/<link>/<img>
    var u=ev.target.src||ev.target.href;
    if(navigator.onLine===false) return; // no internet = not a bug
    if(/\.(js|css)(\?|$)/.test(u)) record('load','Failed to load '+u.split('/').pop(),u,0,0,'');
    return;
  }
  record('js',ev.message,ev.filename,ev.lineno,ev.colno,ev.error&&ev.error.stack);
},true);
window.addEventListener('unhandledrejection',function(ev){
  var r=ev.reason, m=(r&&r.message)||String(r);
  if(/network|offline|failed to fetch|client is offline|unavailable/i.test(m)) return; // plain connection problems are not bugs
  record('promise',m,'',0,0,r&&r.stack);
});

/* ---- public helpers ---- */
E.list=function(){ return readAll().slice().reverse(); };
E.clear=function(){ writeAll([]); };
E.flush=function(){ readAll().filter(function(x){ return !x.sent; }).slice(-MAXSENT).forEach(send); };
E.report=function(msg){ record('manual',msg,'',0,0,''); };
E.text=function(){
  return readAll().slice().reverse().map(function(x){
    return '['+new Date(x.t).toLocaleString()+'] '+x.kind+' · '+x.view+' · '+x.msg+(x.src?'\n  at '+x.src+':'+x.line:'')+(x.stack?'\n'+x.stack:'');
  }).join('\n\n')||'No errors recorded.';
};
window.addEventListener('online',function(){ setTimeout(E.flush,1500); });
setTimeout(E.flush,6000); // after login the first pending errors go out
})();
