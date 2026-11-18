/* =========================================================================
   Dr. Shreyansh Academy — Offline MCQ Packs (offline.js)
   -------------------------------------------------------------------------
   * Download chapter MCQ packs to the phone (IndexedDB — free, no server).
   * Practise with NO internet and even without logging in (Learn / Test mode).
   * Offline results wait in a queue; after the student logs in and says
     "Yes" they are added to the normal MCQ progress.
   * While online, a downloaded chapter is read from the phone instead of
     Firestore -> saves Firestore reads (Spark plan = 50,000 reads / day).
   * Premium packs are removed from the phone when the plan is no longer
     premium (checked every time the student is online), and a pack stops
     opening offline 21 days after it was last verified online.
   ========================================================================= */
(function(){
'use strict';
var DBN='dsa-offline', LEASE=21*864e5, FREE_N=10, SEC_PER_Q=60;
var O=window.OFF={screen:'home',sel:{},exam:'',subj:'',busy:null,msg:'',sess:null,res:null,cfg:{cnt:20,mode:'learn',shuffle:true},packs:null,index:null,queue:null,est:null};

/* ---------- tiny helpers ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function user(){ try{ return DB.currentUser; }catch(e){ return null; } }
function fdb(){ try{ return (window.FIREBASE_ENABLED && typeof fbDb!=='undefined') ? fbDb : null; }catch(e){ return null; } }
function staff(){ var u=user(); return !!u&&(u.role==='admin'||u.role==='faculty'); }
function prem(){ var u=user(); return !!u&&u.plan==='premium'; }
function online(){ return navigator.onLine!==false; }
function pad(n){ return (n<10?'0':'')+n; }
function fmtT(s){ s=Math.max(0,Math.round(s)); return pad(Math.floor(s/60))+':'+pad(s%60); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)),t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function kb(n){ return n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'; }
function refresh(){ try{ if(ROUTE.view==='offline') render(); }catch(e){} }

/* ---------- IndexedDB (falls back to memory if blocked) ---------- */
var _db=null, MEM={packs:{},kv:{}};
function open(){
  if(_db) return _db;
  _db=new Promise(function(res){
    try{
      var r=indexedDB.open(DBN,1);
      r.onupgradeneeded=function(){ var d=r.result; ['packs','kv'].forEach(function(n){ if(!d.objectStoreNames.contains(n)) d.createObjectStore(n); }); };
      r.onsuccess=function(){ res(r.result); };
      r.onerror=function(){ res(null); };
      r.onblocked=function(){ res(null); };
    }catch(e){ res(null); }
  });
  return _db;
}
function get(store,key){
  return open().then(function(d){
    if(!d) return MEM[store][key];
    return new Promise(function(res){
      try{ var r=d.transaction(store,'readonly').objectStore(store).get(key); r.onsuccess=function(){ res(r.result); }; r.onerror=function(){ res(undefined); }; }catch(e){ res(undefined); }
    });
  });
}
function put(store,key,val){
  return open().then(function(d){
    if(!d){ MEM[store][key]=val; return true; }
    return new Promise(function(res){
      try{ var t=d.transaction(store,'readwrite'); t.objectStore(store).put(val,key); t.oncomplete=function(){ res(true); }; t.onerror=t.onabort=function(){ res(false); }; }catch(e){ res(false); }
    });
  });
}
function del(store,key){
  return open().then(function(d){
    if(!d){ delete MEM[store][key]; return true; }
    return new Promise(function(res){
      try{ var t=d.transaction(store,'readwrite'); t.objectStore(store).delete(key); t.oncomplete=function(){ res(true); }; t.onerror=t.onabort=function(){ res(false); }; }catch(e){ res(false); }
    });
  });
}
function allPacks(){
  return open().then(function(d){
    if(!d) return Object.keys(MEM.packs).map(function(k){ return MEM.packs[k]; });
    return new Promise(function(res){
      try{ var r=d.transaction('packs','readonly').objectStore('packs').getAll(); r.onsuccess=function(){ res(r.result||[]); }; r.onerror=function(){ res([]); }; }catch(e){ res([]); }
    });
  });
}

/* ---------- pack store ---------- */
O.loadPacks=function(){
  return allPacks().then(function(a){ var m={}; a.forEach(function(p){ m[p.k]=p; }); O.packs=m; return m; });
};
function valid(p){ return p && p.until>Date.now(); }
O.fromPack=function(k,tier,n){ // used by mcq.js: returns questions or null
  return get('packs',k).then(function(p){
    if(!p||!p.qs||!p.qs.length) return null;
    if(tier==='B' && p.tier!=='B') return null;
    if(p.tier==='B' && !(staff()||prem()) ) return null;
    if(online()){ // online: only trust the pack if it is still the current size
      if(p.tier==='B' && n!=null && p.qs.length!==n) return null;
      if(Date.now()-p.savedAt>30*864e5) return null;
    } else if(!valid(p)) return null;
    return p.qs;
  }).catch(function(){ return null; });
};
O.offlineFallback=function(k){ // network failed: any still-valid pack for this chapter
  return get('packs',k).then(function(p){ if(p&&p.qs&&valid(p)&&(p.tier!=='B'||staff()||prem())) return p.qs; return null; }).catch(function(){ return null; });
};
O.saveIndex=function(ix){ if(ix&&ix.chapters) put('kv','index',{chapters:ix.chapters,total:ix.total,savedAt:Date.now()}); };
O.loadIndex=function(){ return get('kv','index').then(function(x){ return x&&x.chapters?x:null; }).catch(function(){ return null; }); };
O.purgePremiumIfLapsed=function(){
  var u=user(); if(!u||u.role!=='student'||prem()||!online()) return Promise.resolve();
  return allPacks().then(function(a){ return Promise.all(a.filter(function(p){ return p.tier==='B'; }).map(function(p){ return del('packs',p.k); })); }).then(function(){ O.packs=null; });
};
O.remove=function(k){ return del('packs',k).then(function(){ if(O.packs) delete O.packs[k]; }); };
O.clearAll=function(){
  return allPacks().then(function(a){ return Promise.all(a.map(function(p){ return del('packs',p.k); })); })
    .then(function(){ O.packs={}; return (window.caches?caches.delete('dsa-offline-img'):0); }).catch(function(){});
};

/* progress backup used by mcq.js while offline */
O.saveProg=function(uid,p,dirty){ if(uid&&p) put('kv','prog:'+uid,{p:p,dirty:!!dirty,t:Date.now()}); };
O.loadProg=function(uid){ return get('kv','prog:'+uid).catch(function(){ return null; }); };

/* ---------- download ---------- */
function prefetchImages(qs){
  if(!window.caches) return Promise.resolve();
  var urls={}; qs.forEach(function(q){ if(q.m&&/^https:\/\//.test(q.m)) urls[q.m]=1; });
  var list=Object.keys(urls); if(!list.length) return Promise.resolve();
  return caches.open('dsa-offline-img').then(function(c){
    return Promise.all(list.map(function(u){ return fetch(u,{mode:'no-cors',referrerPolicy:'no-referrer'}).then(function(r){ return c.put(u,r); }).catch(function(){}); }));
  }).catch(function(){});
}
function fetchChapter(c,tier){
  var d=fdb(); if(!d) return Promise.reject(new Error('offline'));
  var col=tier==='B'?'mcqBank':'mcqFree';
  return d.collection(col).doc(c.k).get().then(function(s){
    if(!s.exists) throw new Error('missing');
    var qs=(s.data().qs||[]).map(function(x){ x.k=c.k; return x; });
    return {k:c.k,tier:tier,qs:qs,e:c.e,s:c.s,c:c.c,cl:c.cl||'',savedAt:Date.now(),until:Date.now()+LEASE};
  });
}
O.download=function(chs){
  if(O.busy) return;
  if(!online()){ toast('Internet chahiye — pehle online download karo','⚠️'); return; }
  var tier=(prem()||staff())?'B':'F', todo=chs.slice(), done=0, fail=0, total=todo.length, bytes=0;
  O.busy={n:0,total:total}; refresh();
  function worker(){
    var c=todo.shift(); if(!c) return Promise.resolve();
    return fetchChapter(c,tier).catch(function(e){
      if(tier==='B'){ return fetchChapter(c,'F'); } throw e;
    }).then(function(p){ bytes+=JSON.stringify(p.qs).length; return put('packs',c.k,p).then(function(){ return prefetchImages(p.qs); }); })
      .then(function(){ done++; },function(){ fail++; })
      .then(function(){ O.busy={n:done+fail,total:total}; refresh(); return worker(); });
  }
  return Promise.all([worker(),worker(),worker()]).then(function(){
    O.busy=null; O.packs=null; O.msg=done+' chapter pack'+(done===1?'':'s')+' saved'+(fail?' · '+fail+' failed':'')+' ('+kb(bytes)+')';
    return O.loadPacks();
  }).then(function(){ toast(O.msg,'📥'); estimate(); refresh(); });
};
function estimate(){
  try{ if(navigator.storage&&navigator.storage.estimate) navigator.storage.estimate().then(function(e){ O.est=e; refresh(); }); }catch(e){}
  try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persist(); }catch(e){} // ask the browser not to auto-delete packs
}

/* ---------- result queue ---------- */
function loadQueue(){ return get('kv','queue').then(function(q){ O.queue=q||[]; return O.queue; }); }
function saveQueue(){ return put('kv','queue',O.queue||[]); }
O.pending=function(){ return (O.queue||[]).length; };
O.applyTo=function(P,items){ // same bookkeeping as MCQ.mcqSubmit
  items.forEach(function(it){
    Object.keys(it.per||{}).forEach(function(k){ var p=P.ch[k]||(P.ch[k]={a:0,c:0,t:0}); p.a+=it.per[k].a; p.c+=it.per[k].c; p.t+=(it.per[k].t||0); });
    (it.right||[]).forEach(function(id){ var i=P.wrong.indexOf(id); if(i>=0) P.wrong.splice(i,1); });
    (it.wrong||[]).forEach(function(id){ var i=P.wrong.indexOf(id); if(i>=0) P.wrong.splice(i,1); P.wrong.unshift(id); });
    if(P.wrong.length>400) P.wrong.length=400;
    var ans=it.a||0, d=it.day||today();
    if(ans>0){
      P.hist=P.hist||[]; P.hist.unshift({t:it.t,l:it.label+' (offline)',n:it.n,c:it.c,a:ans,s:it.score,m:it.mode,d:it.secs}); if(P.hist.length>25) P.hist.length=25;
      P.days=P.days||{}; P.days[d]=(P.days[d]||0)+ans;
      var st=P.streak||(P.streak={last:'',n:0});
      if(st.last!==d && st.last<d){ var gap=st.last?Math.round((new Date(d+'T00:00:00')-new Date(st.last+'T00:00:00'))/864e5):99; st.n=(gap===1)?st.n+1:1; st.last=d; }
    }
  });
};
O.syncNow=function(){
  var u=user(), M=window.MCQ;
  if(!u||!u.uid||!M||!M.loadProg||!O.queue||!O.queue.length) return Promise.resolve(0);
  var mine=O.queue.filter(function(x){ return !x.uid||x.uid===u.uid; });
  if(!mine.length) return Promise.resolve(0);
  return M.loadProg().then(function(P){
    O.applyTo(P,mine);
    O.queue=O.queue.filter(function(x){ return mine.indexOf(x)<0; });
    return saveQueue().then(function(){ M.save(); return mine.length; });
  });
};
O.askSync=function(){
  var n=(O.queue||[]).filter(function(x){ var u=user(); return u&&u.uid&&(!x.uid||x.uid===u.uid); }).length;
  if(!n) return;
  if(confirm('Offline practice ke '+n+' session(s) mile. Kya inhe apne '+(user().name||'')+' progress me jodna hai?\n\n(Agar ye kisi aur ne diye the to Cancel dabao.)')){
    O.syncNow().then(function(c){ toast(c+' offline session(s) progress me jud gaye','✅'); refresh(); });
  }
};

/* ---------- helpers for screens ---------- */
function chapters(){ return (O.index&&O.index.chapters)||[]; }
function exams(){ var s={},o=[]; chapters().forEach(function(c){ if(!s[c.e]){ s[c.e]=1; o.push(c.e); } }); return o; }
function subjOf(e){ var s={},o=[]; chapters().forEach(function(c){ if(c.e===e&&!s[c.s]){ s[c.s]=1; o.push(c.s); } }); return o; }
function listFor(e,s){ return chapters().filter(function(c){ return c.e===e&&c.s===s; }); }
function status(c){
  var p=O.packs&&O.packs[c.k]; if(!p) return 'none';
  if(!valid(p)) return 'expired';
  if(p.tier==='B' && p.qs.length!==c.n) return 'old';
  return 'ok';
}
function gate(){ return document.getElementById('app'); }
function shell(body){
  var u=user();
  if(u&&u.role==='student') return '<div class="app-shell">'+sidebar('offline')+'<div class="main" style="max-width:980px">'+body+'</div></div>';
  return '<div class="container" style="padding-top:24px;padding-bottom:40px;max-width:900px">'+body+'</div>';
}
function head(t,sub,back){
  return '<div class="main-head"><div>'+(back?'<button class="btn btn-ghost btn-sm" style="margin-bottom:6px" onclick="OFF.go(\''+back+'\')">← Back</button>':'')+'<h2>'+t+'</h2><p>'+sub+'</p></div></div>';
}
function card(h,st){ return '<div class="card" style="padding:18px 20px;margin-bottom:14px;'+(st||'')+'">'+h+'</div>'; }
O.go=function(s){ O.screen=s; O.res=null; if(s!=='session') O.sess=null; render(); window.scrollTo({top:0,behavior:'instant'}); };

/* ---------- screens ---------- */
window.renderOffline=function(){
  if(!O.packs){ O.loadPacks().then(refresh); }
  if(!O.index){ (function(){ var M=window.MCQ; var p=(M&&M.loadIndex&&fdb()&&online())?M.loadIndex():Promise.resolve(null); p.then(function(ix){ if(ix){ O.saveIndex(ix); return ix; } return O.loadIndex(); }).then(function(ix){ O.index=ix||{chapters:[]}; refresh(); }); })(); }
  if(!O.queue){ loadQueue().then(function(){ refresh(); if(user()&&user().uid) setTimeout(O.askSync,300); }); }
  if(!O.est) estimate();
  if(!O.packs||!O.index){ return shell(head('📴 Offline MCQ Packs','')+card('<div style="text-align:center;padding:20px;color:var(--muted)">⏳ Loading…</div>')); }
  if(O.screen==='session'&&O.sess) return shell(scrSession());
  if(O.screen==='result'&&O.res) return shell(scrResult());
  if(O.screen==='setup') return shell(scrSetup());
  return shell(scrHome());
};
function packList(){ var a=[]; Object.keys(O.packs||{}).forEach(function(k){ a.push(O.packs[k]); }); return a; }
function scrHome(){
  var u=user(), P=packList().filter(valid), nq=P.reduce(function(s,p){ return s+p.qs.length; },0);
  var size=packList().reduce(function(s,p){ return s+JSON.stringify(p.qs).length; },0);
  var ex=exams(); if(ex.indexOf(O.exam)<0) O.exam=ex[0]||'';
  var su=subjOf(O.exam); if(su.indexOf(O.subj)<0) O.subj=su[0]||'';
  var pend=O.pending();
  var h=head('📴 Offline MCQ Packs','Chapter packs phone me save karo — bina internet practice')+
  (online()?'':card('<b>📴 Aap offline ho.</b> <span style="color:var(--muted);font-size:13px">Saved packs se practice chal sakti hai. Naye packs download karne ke liye internet chahiye.</span>','border-color:var(--gold-500)'))+
  card('<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center"><div><b style="font-size:22px;font-family:var(--font-mono)">'+P.length+'</b><br><span style="font-size:12px;color:var(--muted)">packs on this phone</span></div>'+
    '<div><b style="font-size:22px;font-family:var(--font-mono)">'+nq.toLocaleString('en-IN')+'</b><br><span style="font-size:12px;color:var(--muted)">questions ready · '+kb(size)+'</span></div>'+
    (pend?'<div><b style="font-size:22px;font-family:var(--font-mono)">'+pend+'</b><br><span style="font-size:12px;color:var(--muted)">results waiting to sync</span></div>':'')+
    '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" '+(P.length?'':'disabled')+' onclick="OFF.go(\'setup\')">▶ Practice offline</button>'+
    (u&&pend?'<button class="btn btn-outline btn-sm" onclick="OFF.askSync()">⟳ Sync results</button>':'')+'</div></div>'+
    (O.est&&O.est.quota?'<div style="font-size:11.5px;color:var(--faint);margin-top:10px">Phone storage used by this app: '+kb(O.est.usage||0)+'</div>':'')+
    (O.msg?'<div style="font-size:12.5px;color:var(--green-700);margin-top:8px">'+esc(O.msg)+'</div>':''));
  if(!u){
    h+=card('<b>🔐 Download ke liye login karo</b><div style="font-size:13px;color:var(--muted);margin:6px 0 12px">Packs ek baar online login karke download hote hain. Download ho gaye to bina login ke bhi offline practice ho sakti hai.</div><button class="btn btn-gold btn-sm" onclick="go(\'auth\',{role:\'student\'})">Log in →</button>');
  } else if(!fdb()){
    h+=card('Live mode me hi download hota hai.');
  }
  if(u&&fdb()&&chapters().length){
    var cs=listFor(O.exam,O.subj), tier=(prem()||staff())?'B':'F';
    var need=cs.filter(function(c){ var s=status(c); return s!=='ok'; });
    h+='<div class="mcq-tabs" role="group" aria-label="Exam">'+ex.map(function(e){ return '<button class="mcq-chip '+(e===O.exam?'on':'')+'" onclick="OFF.pick(\'exam\',\''+esc(e)+'\')">'+esc(e)+'</button>'; }).join('')+'</div>'+
      '<div class="mcq-tabs" role="group" aria-label="Subject">'+su.map(function(s){ return '<button class="mcq-chip '+(s===O.subj?'on':'')+'" onclick="OFF.pick(\'subj\',\''+esc(s)+'\')">'+esc(s)+'</button>'; }).join('')+'</div>';
    h+=card('<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><b>'+esc(O.subj)+' · '+cs.length+' chapters</b>'+
      '<span class="pill '+(tier==='B'?'pill-gold':'pill-navy')+'">'+(tier==='B'?'★ Full bank packs':'Free: '+FREE_N+' sample Qs per chapter')+'</span>'+
      '<button class="btn btn-primary btn-sm" style="margin-left:auto" '+((O.busy||!need.length||!online())?'disabled':'')+' onclick="OFF.dlSubject()">'+(O.busy?'Downloading '+O.busy.n+'/'+O.busy.total+'…':'⬇ Download all'+(need.length?' ('+need.length+')':' ✓'))+'</button></div>'+
      '<div style="max-height:440px;overflow:auto">'+cs.map(function(c){
        var s=status(c), p=O.packs[c.k], n=p?p.qs.length:(tier==='B'?c.n:Math.min(FREE_N,c.n));
        var lab={none:'Not saved',ok:'✓ Saved',old:'Update available',expired:'Expired — go online'}[s];
        return '<div class="mcq-row" style="cursor:default"><span class="nm">'+esc(c.c)+(c.cl?' <small>· Class '+esc(c.cl)+'</small>':'')+'<br><small>'+n+' questions · '+lab+'</small></span>'+
          (s==='ok'?'<button class="btn btn-ghost btn-sm" onclick="OFF.rm(\''+esc(c.k)+'\')" aria-label="Remove pack '+esc(c.c)+'">🗑 Remove</button>':
          '<button class="btn btn-outline btn-sm" '+((O.busy||!online())?'disabled':'')+' onclick="OFF.dl(\''+esc(c.k)+'\')" aria-label="Download pack '+esc(c.c)+'">⬇ '+(s==='none'?'Download':'Update')+'</button>')+'</div>';
      }).join('')+'</div>')+
      '<div style="text-align:right"><button class="btn btn-ghost btn-sm" onclick="OFF.wipe()">🗑 Remove all packs from this phone</button></div>';
  } else if(u&&fdb()&&O.index&&!chapters().length){
    h+=card('Question bank list abhi load nahi hui. Internet check karke dobara kholo.');
  }
  if(!u&&!P.length) h+=card('<div style="text-align:center;color:var(--muted)">Abhi koi pack saved nahi hai.</div>');
  return h;
}
O.pick=function(k,v){ O[k]=v; if(k==='exam') O.subj=''; render(); };
O.dl=function(k){ var c=chapters().filter(function(x){ return x.k===k; })[0]; if(c) O.download([c]); };
O.dlSubject=function(){ O.download(listFor(O.exam,O.subj).filter(function(c){ return status(c)!=='ok'; })); };
O.rm=function(k){ O.remove(k).then(function(){ toast('Pack removed','🗑'); render(); }); };
O.wipe=function(){ if(confirm('Is phone se saare offline packs hata dein?')) O.clearAll().then(function(){ toast('All packs removed','🗑'); render(); }); };

/* ----- setup ----- */
function scrSetup(){
  var P=packList().filter(valid).sort(function(a,b){ return (a.s+a.c).localeCompare(b.s+b.c); });
  var c=O.cfg, n=Object.keys(O.sel).length;
  return head('▶ Offline practice','Saved packs me se chapters chuno','home')+
  card('<div class="mcq-lbl" style="margin-top:0">Mode</div><div class="mcq-tabs" role="group" aria-label="Mode"><button class="mcq-chip '+(c.mode==='learn'?'on':'')+'" onclick="OFF.cfgSet(\'mode\',\'learn\')">📖 Learn (instant answer)</button><button class="mcq-chip '+(c.mode==='test'?'on':'')+'" onclick="OFF.cfgSet(\'mode\',\'test\')">📝 Test (+4/−1, timed)</button></div>'+
    '<div class="mcq-lbl">Questions</div><div class="mcq-tabs" role="group" aria-label="Number of questions">'+[10,20,30,50,0].map(function(x){ return '<button class="mcq-chip '+(c.cnt===x?'on':'')+'" onclick="OFF.cfgSet(\'cnt\','+x+')">'+(x||'All')+'</button>'; }).join('')+'</div>'+
    '<div class="mcq-tabs" style="margin:12px 0 0"><button class="mcq-chip '+(c.shuffle?'on':'')+'" onclick="OFF.cfgSet(\'shuffle\','+(!c.shuffle)+')">🔀 Shuffle</button></div>')+
  card('<b>Saved chapters</b><div style="max-height:380px;overflow:auto;margin-top:10px">'+P.map(function(p){
    return '<div class="mcq-row '+(O.sel[p.k]?'on':'')+'" onclick="OFF.tog(\''+esc(p.k)+'\')"><span class="nm">'+(O.sel[p.k]?'☑ ':'☐ ')+esc(p.c)+'<br><small>'+esc(p.e)+' · '+esc(p.s)+' · '+p.qs.length+' Qs'+(p.tier==='F'?' (sample)':'')+'</small></span></div>';
  }).join('')+'</div><button class="btn btn-primary btn-block" style="margin-top:14px" onclick="OFF.start()">Start ('+n+' chapter'+(n===1?'':'s')+') →</button>');
}
O.cfgSet=function(k,v){ O.cfg[k]=v; render(); };
O.tog=function(k){ if(O.sel[k]) delete O.sel[k]; else O.sel[k]=1; render(); };
O.start=function(){
  var keys=Object.keys(O.sel); if(!keys.length){ toast('Kam se kam ek chapter chuno','⚠️'); return; }
  var qs=[], names=[];
  keys.forEach(function(k){ var p=O.packs[k]; if(p&&valid(p)){ qs=qs.concat(p.qs); names.push(p.c); } });
  if(O.cfg.shuffle) qs=shuffle(qs); if(O.cfg.cnt) qs=qs.slice(0,O.cfg.cnt);
  if(!qs.length){ toast('Pack khali ya expired hai — online ho kar update karo','⚠️'); return; }
  var u=user();
  O.sess={qs:qs,i:0,ans:qs.map(function(){return null;}),marked:qs.map(function(){return false;}),times:qs.map(function(){return 0;}),mode:O.cfg.mode,label:names.length===1?names[0]:names.length+' chapters',
    timer:O.cfg.mode==='test',total:qs.length*SEC_PER_Q,deadline:Date.now()+qs.length*SEC_PER_Q*1000,qStart:Date.now(),started:Date.now(),tid:null,uid:u&&u.uid||null};
  O.screen='session'; render(); window.scrollTo({top:0,behavior:'instant'});
};

/* ----- session ----- */
function touch(){ var s=O.sess; if(!s) return; var n=Date.now(); s.times[s.i]+=(n-s.qStart)/1000; s.qStart=n; }
function ensureTimer(){
  var s=O.sess; if(!s||!s.timer||s.tid) return;
  s.tid=setInterval(function(){
    if(!O.sess||O.screen!=='session'){ clearInterval(s.tid); return; }
    var left=Math.ceil((s.deadline-Date.now())/1000), el=document.getElementById('offTimer');
    if(el){ el.textContent='⏱ '+fmtT(left); if(left<=60) el.classList.add('low'); }
    if(left<=0){ clearInterval(s.tid); toast("Time's up!",'⏱'); O.submit(true); }
  },1000);
}
function scrSession(){
  var s=O.sess, q=s.qs[s.i], a=s.ans[s.i], learn=s.mode==='learn', shown=learn&&a!==null, left=s.timer?Math.ceil((s.deadline-Date.now())/1000):0;
  setTimeout(ensureTimer,0);
  var img=(typeof q.m==='string'&&/^https:\/\//.test(q.m))?'<div style="margin:10px 0;text-align:center"><img src="'+esc(q.m)+'" alt="Question figure" loading="lazy" referrerpolicy="no-referrer" style="max-width:100%;border-radius:8px"></div>':'';
  return '<div class="card test-head"><h3>'+esc(s.label)+' <span class="pill pill-navy" style="margin-left:6px">📴 Offline</span></h3>'+(s.timer?'<div class="test-timer" id="offTimer">⏱ '+fmtT(left)+'</div>':'<div class="pill pill-navy">'+(learn?'Learn mode':'Test mode')+'</div>')+'</div>'+
  '<div class="test-shell"><div><div class="card q-card"><div class="q-tag">Question '+(s.i+1)+' of '+s.qs.length+(q.t?' · '+esc(q.t):'')+(q.y?' · '+esc(q.y):'')+'</div>'+
  '<div class="q-text">'+esc(q.q)+'</div>'+img+'<div class="opt-list">'+q.o.map(function(o,oi){
    var cls=''; if(shown){ if(oi===q.a) cls='correct'; else if(oi===a) cls='wrong'; } else if(a===oi) cls='selected';
    return '<div class="opt-row '+cls+'" onclick="OFF.pick2('+oi+')"><span class="opt-letter">'+String.fromCharCode(65+oi)+'</span><span>'+esc(o)+'</span></div>';
  }).join('')+'</div>'+
  (shown?'<div class="explain-box" style="margin-top:12px"><b>'+(a===q.a?'✓ Correct':'✗ Incorrect — answer: '+String.fromCharCode(65+q.a))+'</b>'+(q.e?'<div style="margin-top:6px">'+esc(q.e)+'</div>':'')+'</div>':'')+'</div>'+
  '<div class="q-nav"><button class="btn btn-outline btn-sm" '+(s.i===0?'disabled':'')+' onclick="OFF.nav(-1)">← Previous</button>'+
  (learn?'':'<button class="btn btn-ghost btn-sm" onclick="OFF.mark()">'+(s.marked[s.i]?'⚑ Marked':'⚐ Mark for review')+'</button>')+
  (s.i===s.qs.length-1?'<button class="btn btn-gold btn-sm" onclick="OFF.submit()">'+(learn?'Finish ✓':'Submit test ✓')+'</button>':'<button class="btn btn-primary btn-sm" onclick="OFF.nav(1)">Next →</button>')+'</div></div>'+
  '<div class="card palette"><h5>Question palette</h5><div class="palette-grid">'+s.qs.map(function(_,qi){ return '<div class="pnum '+(s.ans[qi]!==null?'answered':'')+' '+(s.marked[qi]?'marked':'')+' '+(qi===s.i?'current':'')+'" onclick="OFF.jump('+qi+')">'+(qi+1)+'</div>'; }).join('')+
  '</div><button class="btn btn-ghost btn-sm btn-block" style="margin-top:12px" onclick="OFF.quit()">Quit</button></div></div>';
}
O.pick2=function(oi){ var s=O.sess; if(!s) return; if(s.mode==='learn'){ if(s.ans[s.i]!==null) return; touch(); s.ans[s.i]=oi; } else { touch(); s.ans[s.i]=(s.ans[s.i]===oi?null:oi); } render(); };
O.nav=function(d){ touch(); var s=O.sess; s.i=Math.max(0,Math.min(s.qs.length-1,s.i+d)); render(); };
O.jump=function(i){ touch(); O.sess.i=i; render(); };
O.mark=function(){ var s=O.sess; s.marked[s.i]=!s.marked[s.i]; render(); };
O.quit=function(){ if(!confirm('Practice band karein? Ab tak ke answers save honge.')) return; O.submit(true); };
O.submit=function(force){
  var s=O.sess; if(!s) return; touch(); if(s.tid) clearInterval(s.tid);
  var un=s.ans.filter(function(x){return x===null;}).length;
  if(!force&&s.mode==='test'&&un>0&&!confirm(un+' question(s) unanswered. Submit anyway?')){ ensureTimer(); return; }
  var c=0,w=0,sk=0,per={},wrong=[],right=[],items=[];
  s.qs.forEach(function(q,i){
    var a=s.ans[i], ok=(a!==null&&a===q.a), id=q.k+'~'+q.i; items.push({q:q,a:a,ok:ok});
    if(a===null){ sk++; return; }
    per[q.k]=per[q.k]||{a:0,c:0,t:0}; per[q.k].a++; per[q.k].t+=Math.round(s.times[i]);
    if(ok){ c++; per[q.k].c++; right.push(id); } else { w++; wrong.push(id); }
  });
  var score=c*4-w, secs=Math.round((Date.now()-s.started)/1000);
  if(c+w>0){
    O.queue=O.queue||[]; O.queue.push({t:Date.now(),day:today(),uid:s.uid,label:s.label,mode:s.mode,n:s.qs.length,c:c,a:c+w,score:score,secs:secs,per:per,wrong:wrong,right:right});
    if(O.queue.length>60) O.queue=O.queue.slice(-60);
    saveQueue();
  }
  O.res={label:s.label,mode:s.mode,c:c,w:w,sk:sk,score:score,max:s.qs.length*4,secs:secs,items:items}; O.sess=null; O.screen='result'; render(); window.scrollTo({top:0,behavior:'instant'});
};
function scrResult(){
  var r=O.res, acc=pct(r.c,r.c+r.w), u=user();
  return head('Result — '+esc(r.label),'Offline practice complete','home')+
  card('<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center"><div><b style="font-size:22px;font-family:var(--font-mono)">'+r.score+'/'+r.max+'</b><br><span style="font-size:12px;color:var(--muted)">score</span></div>'+
    '<div><b style="font-size:22px;font-family:var(--font-mono);color:var(--green-600)">'+r.c+'</b><br><span style="font-size:12px;color:var(--muted)">correct</span></div>'+
    '<div><b style="font-size:22px;font-family:var(--font-mono);color:var(--red-500)">'+r.w+'</b><br><span style="font-size:12px;color:var(--muted)">wrong</span></div>'+
    '<div><b style="font-size:22px;font-family:var(--font-mono)">'+acc+'%</b><br><span style="font-size:12px;color:var(--muted)">accuracy</span></div></div>'+
    '<div style="font-size:12.5px;color:var(--muted);margin-top:12px">'+(u?'Ye result progress me jodne ke liye "Sync results" dabao.':'Result is phone me save hai. Online aakar login karoge to progress me jodne ka option milega.')+'</div>')+
  '<div class="mcq-lbl">Review</div>'+r.items.map(function(it,i){
    var q=it.q, cls=it.a===null?'skip':(it.ok?'ok':'bad');
    return '<details class="mcq-rev '+cls+'"><summary>Q'+(i+1)+'. '+esc(q.q).slice(0,140)+'</summary><div style="margin-top:8px">'+q.o.map(function(o,oi){ return '<div style="padding:3px 0;'+(oi===q.a?'font-weight:700;color:var(--green-700)':(oi===it.a?'color:var(--red-600)':''))+'">'+String.fromCharCode(65+oi)+'. '+esc(o)+(oi===q.a?' ✓':'')+(oi===it.a&&!it.ok?' (your answer)':'')+'</div>'; }).join('')+(q.e?'<div class="explain-box">'+esc(q.e)+'</div>':'')+'</div></details>';
  }).join('')+
  '<div style="display:flex;gap:10px;margin-top:14px"><button class="btn btn-primary btn-sm" onclick="OFF.go(\'setup\')">Practice again</button><button class="btn btn-outline btn-sm" onclick="OFF.go(\'home\')">Back to packs</button></div>';
}

/* ---------- landing-page entry + status ---------- */
function mountLanding(){
  try{
    if(typeof ROUTE==='undefined'||ROUTE.view!=='landing') return;
    var host=document.querySelector('.hero-cta'); if(!host||document.getElementById('offEntry')) return;
    O.loadPacks().then(function(m){
      var has=Object.keys(m).some(function(k){ return valid(m[k]); });
      if(!has&&online()) return;
      if(document.getElementById('offEntry')) return;
      var b=document.createElement('button'); b.id='offEntry'; b.className='btn btn-outline'; b.textContent='📴 Offline Practice'; b.onclick=function(){ go('offline'); };
      host.appendChild(b);
    });
  }catch(e){}
}
function netToast(){
  window.addEventListener('offline',function(){ try{ toast('Aap offline ho — saved packs se practice kar sakte ho','📴'); }catch(e){} });
  window.addEventListener('online',function(){ try{ toast('Wapas online ✓','🌐'); if(user()) O.purgePremiumIfLapsed(); if(user()&&O.queue&&O.queue.length) O.askSync(); }catch(e){} });
}
netToast();
document.addEventListener('DOMContentLoaded',function(){ setTimeout(mountLanding,200); });
var _r=window.render; if(typeof _r==='function'&&!_r.__off){ var w=function(){ var x=_r.apply(this,arguments); setTimeout(mountLanding,0); return x; }; w.__off=true; window.render=w; }
setTimeout(function(){ if(user()) O.purgePremiumIfLapsed(); },2500);
})();
