/* =========================================================================
   Dr. Shreyansh Academy — MCQ Practice Hub  (mcq.js)
   -------------------------------------------------------------------------
   Self-contained module. Adds ONE new student screen ("MCQ Practice Hub")
   and does not change any existing screen's behaviour.
   Data (all in the DSA Firebase project, written by DSA Admin -> MCQ Bank):
     mcqMeta/index        chapter list + counts (any signed-in user)
     mcqFree/{chapter}    10 sample questions per chapter (any signed-in user)
     mcqBank/{chapter}    full question bank (Premium users / admin only)
     mcqProgress/{uid}    the student's own practice progress
   ========================================================================= */
(function(){
'use strict';
var MAXWRONG=400, MAXMARK=300, MAXHIST=25, FREE_N=10, SEC_PER_Q=60;
var S = window.MCQ = {screen:'home', exam:'', subj:'', index:null, idxErr:'', idxBusy:false,
  prog:null, progBusy:false, cache:{}, sel:null, sess:null, res:null, busy:false, saveT:null};

/* ---------- small helpers ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function db(){ try{ return (window.FIREBASE_ENABLED && typeof fbDb!=='undefined') ? fbDb : null; }catch(e){ return null; } }
function user(){ return DB.currentUser; }
function prem(){ return !!user() && user().plan==='premium'; }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function yesterday(){ return ymd(new Date(Date.now()-864e5)); }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function pct(a,b){ return b>0 ? Math.round(a*100/b) : 0; }
function fmtT(s){ s=Math.max(0,Math.round(s)); return pad(Math.floor(s/60))+':'+pad(s%60); }
function refresh(){ if(typeof ROUTE!=='undefined' && ROUTE.view==='mcq') render(); }
function locked(what){ toast('🔒 '+what+' is a Premium feature','★'); }

/* one-time CSS (uses the app's own colour variables) */
(function(){
  if(document.getElementById('mcq-css')) return;
  var st=document.createElement('style'); st.id='mcq-css';
  st.textContent =
  '.mcq-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}'+
  '.mcq-chip{padding:7px 14px;border-radius:999px;border:1px solid var(--border);background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:var(--ink)}'+
  '.mcq-chip.on{background:var(--navy-800);color:#fff;border-color:var(--navy-800)}'+
  '.mcq-chip.lock{opacity:.55}'+
  '.mcq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin-bottom:18px}'+
  '.mcq-tile{padding:18px;cursor:pointer;transition:transform .12s}.mcq-tile:hover{transform:translateY(-2px)}'+
  '.mcq-tile h4{margin:0 0 4px;font-family:var(--font-display);font-size:16px}.mcq-tile p{margin:0;font-size:12.5px;color:var(--muted)}'+
  '.mcq-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;background:#fff;cursor:pointer;font-size:13.5px}'+
  '.mcq-row.on{border-color:var(--navy-600);background:var(--paper-2)}'+
  '.mcq-row .nm{flex:1;font-weight:600}.mcq-row small{color:var(--muted);font-size:12px}'+
  '.mcq-row input{pointer-events:none}'+
  '.mcq-bar{height:6px;border-radius:4px;background:var(--paper-2);overflow:hidden;margin-top:8px}.mcq-bar i{display:block;height:100%;background:var(--green-500)}'+
  '.mcq-sel{padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:#fff;max-width:100%}'+
  '.mcq-lbl{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin:14px 0 6px}'+
  '.mcq-rev{border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;background:#fff;font-size:13.5px}'+
  '.mcq-rev summary{cursor:pointer;font-weight:600}.mcq-rev.ok{border-left:4px solid var(--green-500)}.mcq-rev.bad{border-left:4px solid var(--red-500)}.mcq-rev.skip{border-left:4px solid var(--faint)}';
  document.head.appendChild(st);
})();

/* ---------- data layer ---------- */
function newProg(){ return {v:1, ch:{}, wrong:[], mark:[], hist:[], streak:{last:'',n:0}, daily:{d:'',s:0}, days:{}, goal:{}, todo:[]}; }
function kickIndex(){
  if(S.idxBusy) return; S.idxBusy=true;
  db().collection('mcqMeta').doc('index').get().then(function(d){
    S.idxBusy=false;
    if(d.exists && d.data() && d.data().chapters && d.data().chapters.length){ S.index=d.data(); S.idxErr=''; }
    else S.idxErr='empty';
  }).catch(function(e){ S.idxBusy=false; S.idxErr='err'; console.warn('[MCQ] index load failed',e); }).then(refresh);
}
S.loadProg=function(){
  if(S.prog) return Promise.resolve(S.prog);
  if(S.progP) return S.progP;
  var u=user(); if(!u||!u.uid||!db()){ S.prog=newProg(); return Promise.resolve(S.prog); }
  S.progP=db().collection('mcqProgress').doc(u.uid).get().then(function(d){
    var p=newProg(); if(d.exists){ var x=d.data()||{}; for(var k in p){ if(x[k]!==undefined) p[k]=x[k]; } }
    S.prog=p;
  }).catch(function(e){ console.warn('[MCQ] progress load failed',e); S.prog=newProg(); })
  .then(function(){ S.progP=null; return S.prog; });
  return S.progP;
};
function kickProg(){ if(S.progBusy) return; S.progBusy=true; S.loadProg().then(function(){ S.progBusy=false; refresh(); }); }
/* compact summary mirrored onto the student's own profile so parents / faculty / admin can see activity */
function mirror(){
  var u=user(); if(!u||!u.uid||!S.prog||!db()) return;
  var P=S.prog, a=0, c=0, n7=0, i;
  Object.keys(P.ch).forEach(function(k){ a+=P.ch[k].a; c+=P.ch[k].c; });
  for(i=0;i<7;i++) n7+=(P.days[ymd(new Date(Date.now()-i*864e5))]||0);
  var weak=S.index?Object.keys(P.ch).filter(function(k){ return P.ch[k].a>=5&&chapByKey(k); }).sort(function(x,y){ return pct(P.ch[x].c,P.ch[x].a)-pct(P.ch[y].c,P.ch[y].a); }).slice(0,3).map(function(k){ return chapByKey(k).c; }):[];
  db().collection('users').doc(u.uid).update({mcqSummary:{a:a,c:c,n7:n7,streak:(P.streak&&P.streak.n)||0,last:(P.streak&&P.streak.last)||'',weak:weak,upd:Date.now()}}).catch(function(){});
}
function saveProg(){
  var u=user(); if(!u||!u.uid||!S.prog||!db()) return;
  clearTimeout(S.saveT);
  S.saveT=setTimeout(function(){
    var p=Object.assign({},S.prog,{upd:firebase.firestore.FieldValue.serverTimestamp()});
    var keep={}, t=Date.now(); Object.keys(p.days||{}).forEach(function(d){ if(t-new Date(d).getTime()<36*864e5) keep[d]=p.days[d]; }); p.days=keep;
    db().collection('mcqProgress').doc(u.uid).set(p).then(mirror).catch(function(e){ console.warn('[MCQ] progress save failed',e); });
  },800);
}
S.save=function(){ saveProg(); };
function loadChapter(k){
  var tier=prem()?'B':'F', ck=tier+k;
  if(S.cache[ck]) return Promise.resolve(S.cache[ck]);
  function fromFree(){ return db().collection('mcqFree').doc(k).get().then(function(d){ return d.exists?(d.data().qs||[]):[]; }); }
  var p = tier==='B'
    ? db().collection('mcqBank').doc(k).get().then(function(d){ return d.exists?(d.data().qs||[]):[]; }).catch(function(e){ console.warn('[MCQ] bank denied, using sample',e); return fromFree(); })
    : fromFree();
  return p.then(function(qs){ qs=qs.map(function(x){ x.k=k; return x; }); S.cache[ck]=qs; return qs; });
}
function chaptersOf(exam,subj){ return S.index.chapters.filter(function(c){ return c.e===exam && c.s===subj; }); }
function chapByKey(k){ for(var i=0;i<S.index.chapters.length;i++){ if(S.index.chapters[i].k===k) return S.index.chapters[i]; } return null; }

/* ---------- navigation ---------- */
window.mcqGo=function(screen,exam,subj){
  clearTimer();
  if(screen==='subject' && subj){ S.exam=exam; S.subj=subj; S.sel={ch:{},cnt:prem()?20:FREE_N,mode:'learn',timer:true,shuffle:true,tag:'',year:'',cls:'all',q:''}; }
  if(screen==='home' && exam) S.exam=exam;
  if(screen==='stats' && !prem()){ locked('Analytics'); return; }
  S.screen=screen; render(); window.scrollTo({top:0,behavior:'instant'});
};
window.mcqExam=function(e){ S.exam=e; render(); };

/* ---------- screens ---------- */
function box(icon,msg,extra){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+icon+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+msg+'</div>'+(extra||'')+'</div>'; }
function head(title,sub,back){
  return '<div class="main-head"><div>'+(back?'<button class="btn btn-ghost btn-sm" style="margin-bottom:6px" onclick="mcqGo(\''+back+'\')">← Back</button>':'')+
    '<h2>'+title+'</h2><p>'+sub+'</p></div></div>';
}
window.renderMcq=function(){
  if(!user()) return renderAuth();
  var body;
  if(!db()) body = head('MCQ Practice Hub','Chapter-wise and topic-wise MCQ practice')+box('⚡','The MCQ Practice Hub works in live mode. Connect Firebase first.');
  else if(!S.index){
    if(S.idxErr==='empty') body=head('MCQ Practice Hub','')+box('📚','The new question bank is being set up. You can use the Practice Series meanwhile.','<br><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="go(\'mcqtracks\')">Open the Practice Series (live sheets) →</button>');
    else if(S.idxErr) body=head('MCQ Practice Hub','')+box('⚠️','Could not load the question bank. Check your internet and try again.','<br><button class="btn btn-primary btn-sm" onclick="MCQ.idxErr=\'\';render()">Retry</button> <button class="btn btn-outline btn-sm" onclick="go(\'mcqtracks\')">Practice Series</button>');
    else { kickIndex(); body=box('⏳','Loading question bank…'); }
  }
  else if(!S.prog){ kickProg(); body=box('⏳','Loading your progress…'); }
  else if(S.screen==='subject') body=scrSubject();
  else if(S.screen==='session' && S.sess) { body=scrSession(); setTimeout(ensureTimer,0); }
  else if(S.screen==='result' && S.res) body=scrResult();
  else if(S.screen==='stats') body=scrStats();
  else body=scrHome();
  return '<div class="app-shell">'+sidebar('mcqtracks')+'<div class="main" style="max-width:980px">'+body+'</div></div>';
};

function examList(){
  var seen={},o=[]; S.index.chapters.forEach(function(c){ if(!seen[c.e]){ seen[c.e]=1; o.push(c.e); } });
  var ord=['NEET','JEE','JEE Advanced']; o.sort(function(a,b){ var x=ord.indexOf(a),y=ord.indexOf(b); return (x<0?9:x)-(y<0?9:y); });
  return o;
}
function subjStats(exam,subj){
  var a=0,c=0; chaptersOf(exam,subj).forEach(function(ch){ var p=S.prog.ch[ch.k]; if(p){ a+=p.a; c+=p.c; } }); return {a:a,c:c};
}
function scrHome(){
  var exams=examList(); if(exams.indexOf(S.exam)<0) S.exam=exams[0];
  var tot=S.index.chapters.reduce(function(s,c){ return s+c.n; },0);
  var subjects=[];
  S.index.chapters.forEach(function(c){ if(c.e===S.exam && subjects.indexOf(c.s)<0) subjects.push(c.s); });
  var icons={Physics:'⚛️',Chemistry:'🧪',Biology:'🧬',Maths:'📐'};
  var st=S.prog.streak||{}, streakOn=(st.last===today()||st.last===yesterday())?st.n:0;
  return head('MCQ Practice Hub', tot.toLocaleString('en-IN')+' practice questions · chapter-wise, topic-wise, revision & more')+
  (prem()
    ? '<div class="card" style="padding:14px 18px;margin-bottom:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="pill pill-gold">★ PREMIUM — full bank unlocked</span><span style="font-size:13px;color:var(--muted)">🔥 '+streakOn+'-day streak</span><button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="mcqGo(\'stats\')">📊 My analytics</button></div>'
    : '<div class="card" style="padding:14px 18px;margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="pill pill-navy">FREE</span><span style="font-size:13px;color:var(--muted);flex:1">You get '+FREE_N+' sample questions in every chapter. Premium unlocks the full bank, test mode, filters, daily challenge, revision and analytics.</span><button class="btn btn-gold btn-sm" onclick="go(\'plans\')">Unlock Premium →</button></div>')+
  '<div class="mcq-tabs">'+exams.map(function(e){ return '<button class="mcq-chip '+(e===S.exam?'on':'')+'" onclick="mcqExam(\''+esc(e)+'\')">'+esc(e)+'</button>'; }).join('')+'</div>'+
  '<div class="mcq-grid">'+subjects.map(function(s){
    var cs=chaptersOf(S.exam,s), n=cs.reduce(function(x,c){ return x+c.n; },0), st2=subjStats(S.exam,s);
    return '<div class="card mcq-tile" onclick="mcqGo(\'subject\',\''+esc(S.exam)+'\',\''+esc(s)+'\')"><div style="font-size:26px">'+(icons[s]||'📘')+'</div><h4>'+esc(s)+'</h4><p>'+cs.length+' chapters · '+n.toLocaleString('en-IN')+' questions</p>'+
      (st2.a?'<div class="mcq-bar"><i style="width:'+pct(st2.c,st2.a)+'%"></i></div><p style="margin-top:4px">'+pct(st2.c,st2.a)+'% accuracy · '+st2.a+' attempted</p>':'<p style="margin-top:8px;color:var(--faint)">Not started yet</p>')+'</div>';
  }).join('')+'</div>';
}

function subjKeys(){ return chaptersOf(S.exam,S.subj).map(function(c){ return c.k; }); }
function listEntries(arr){ var ks=subjKeys(); return (arr||[]).filter(function(x){ return ks.indexOf(x.split('~')[0])>=0; }); }
function tagYearOptions(){
  var tg={},yr={};
  chaptersOf(S.exam,S.subj).forEach(function(c){ for(var t in (c.tg||{})) tg[t]=(tg[t]||0)+c.tg[t]; for(var y in (c.yr||{})) yr[y]=(yr[y]||0)+c.yr[y]; });
  return {tg:tg,yr:yr};
}
function chRows(){
  var cs=chaptersOf(S.exam,S.subj), q=(S.sel.q||'').toLowerCase();
  cs=cs.filter(function(c){ return (S.sel.cls==='all'||c.cl===S.sel.cls) && (!q||c.c.toLowerCase().indexOf(q)>=0); });
  if(!cs.length) return '<div style="padding:16px;color:var(--muted);font-size:13px">No chapters match.</div>';
  return cs.map(function(c){
    var p=S.prog.ch[c.k], on=!!S.sel.ch[c.k];
    return '<div class="mcq-row '+(on?'on':'')+'" onclick="mcqTogCh(\''+esc(c.k)+'\')"><input type="'+(prem()?'checkbox':'radio')+'" '+(on?'checked':'')+'><span class="nm">'+esc(c.c)+'</span><small>'+(c.cl?'Class '+esc(c.cl)+' · ':'')+(prem()?c.n:Math.min(c.n,FREE_N))+' Q'+(p&&p.a?' · '+pct(p.c,p.a)+'%':'')+'</small></div>';
  }).join('');
}
function scrSubject(){
  var sel=S.sel, ty=tagYearOptions(), P=prem();
  var nWrong=listEntries(S.prog.wrong).length, nMark=listEntries(S.prog.mark).length;
  var dailyDone=S.prog.daily && S.prog.daily.d===today();
  var cnts=[10,20,30,50,0];
  var classes=[]; chaptersOf(S.exam,S.subj).forEach(function(c){ if(c.cl && classes.indexOf(c.cl)<0) classes.push(c.cl); }); classes.sort();
  var nSel=Object.keys(sel.ch).length;
  return head(esc(S.exam)+' · '+esc(S.subj),'Pick chapters, set up your practice, and start','home')+
  '<div class="mcq-grid">'+
    quick('📅','Daily Challenge',dailyDone?'✓ Done today — go again':'10 fresh questions','mcqQuick(\'daily\')')+
    quick('🎯','Weak Areas','Auto-picks your lowest-accuracy chapters','mcqQuick(\'weak\')')+
    quick('🔁','Revision',nWrong+' questions you got wrong','mcqQuick(\'wrong\')')+
    quick('⭐','Bookmarked',nMark+' saved questions','mcqQuick(\'mark\')')+
  '</div>'+
  '<div class="card" style="padding:18px 20px;margin-bottom:16px">'+
    '<div class="mcq-lbl" style="margin-top:0">Mode</div><div class="mcq-tabs" style="margin-bottom:0">'+
      '<button class="mcq-chip '+(sel.mode==='learn'?'on':'')+'" onclick="mcqSet(\'mode\',\'learn\')">📖 Learn (instant answer + explanation)</button>'+
      '<button class="mcq-chip '+(sel.mode==='test'?'on':'')+(P?'':' lock')+'" onclick="mcqSet(\'mode\',\'test\')">📝 Test (+4 / −1, timed) '+(P?'':'🔒')+'</button></div>'+
    '<div class="mcq-lbl">Number of questions</div><div class="mcq-tabs" style="margin-bottom:0">'+
      cnts.map(function(n){ var lk=!P&&n!==10; return '<button class="mcq-chip '+(sel.cnt===n?'on':'')+(lk?' lock':'')+'" onclick="mcqSet(\'cnt\','+n+')">'+(n?n:'All')+(lk?' 🔒':'')+'</button>'; }).join('')+'</div>'+
    '<div style="display:flex;gap:18px;flex-wrap:wrap">'+
      '<div><div class="mcq-lbl">Question type</div><select class="mcq-sel" onchange="mcqSet(\'tag\',this.value)"><option value="">All types'+(P?'':' 🔒')+'</option>'+
        Object.keys(ty.tg).sort().map(function(t){ return '<option value="'+esc(t)+'" '+(sel.tag===t?'selected':'')+'>'+esc(t)+' ('+ty.tg[t]+')</option>'; }).join('')+'</select></div>'+
      (Object.keys(ty.yr).length?'<div><div class="mcq-lbl">Year</div><select class="mcq-sel" onchange="mcqSet(\'year\',this.value)"><option value="">All years'+(P?'':' 🔒')+'</option>'+
        Object.keys(ty.yr).sort().reverse().map(function(y){ return '<option value="'+esc(y)+'" '+(sel.year===y?'selected':'')+'>'+esc(y)+' ('+ty.yr[y]+')</option>'; }).join('')+'</select></div>':'')+
    '</div>'+
    '<div class="mcq-tabs" style="margin:14px 0 0">'+
      '<button class="mcq-chip '+(sel.shuffle?'on':'')+'" onclick="mcqSet(\'shuffle\','+(!sel.shuffle)+')">🔀 Shuffle</button>'+
      (sel.mode==='test'?'<button class="mcq-chip '+(sel.timer?'on':'')+'" onclick="mcqSet(\'timer\','+(!sel.timer)+')">⏱ Timer ('+(sel.cnt||'all')+' × 1 min)</button>':'')+
    '</div></div>'+
  '<div class="card" style="padding:18px 20px">'+
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><b style="font-size:15px">Chapters</b>'+
      (classes.length>1?'<button class="mcq-chip '+(sel.cls==='all'?'on':'')+'" onclick="mcqSet(\'cls\',\'all\')">All</button>'+classes.map(function(c){ return '<button class="mcq-chip '+(sel.cls===c?'on':'')+'" onclick="mcqSet(\'cls\',\''+esc(c)+'\')">Class '+esc(c)+'</button>'; }).join(''):'')+
      (P?'<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="mcqAllCh(true)">Select all</button><button class="btn btn-ghost btn-sm" onclick="mcqAllCh(false)">Clear</button>':'')+'</div>'+
    '<input class="mcq-sel" style="width:100%;margin-bottom:10px;padding:10px 12px" placeholder="🔍 Search chapter…" value="'+esc(sel.q)+'" oninput="mcqSearch(this.value)">'+
    (P?'':'<div style="font-size:12.5px;color:var(--muted);margin-bottom:8px">Free plan: one chapter at a time, '+FREE_N+' sample questions.</div>')+
    '<div id="mcqChList" style="max-height:420px;overflow:auto">'+chRows()+'</div>'+
    '<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="mcqStart()" '+(S.busy?'disabled':'')+'>'+(S.busy?'Loading…':'Start practice ('+nSel+' chapter'+(nSel===1?'':'s')+' selected) →')+'</button>'+
  '</div>';
}
function quick(ic,t,sub,fn){
  var lk=!prem();
  return '<div class="card mcq-tile" onclick="'+(lk?'mcqLockQ()':fn)+'"><div style="font-size:22px">'+ic+(lk?' 🔒':'')+'</div><h4>'+t+'</h4><p>'+sub+'</p></div>';
}
window.mcqLockQ=function(){ locked('This practice mode'); };
window.mcqSet=function(key,val){
  var P=prem();
  if(!P){
    if(key==='mode'&&val==='test') return locked('Test mode');
    if(key==='cnt'&&val!==10) return locked('More questions per session');
    if((key==='tag'||key==='year')&&val) return locked('Question-type and year filters');
  }
  S.sel[key]=val; render();
};
window.mcqSearch=function(v){ S.sel.q=v; var el=document.getElementById('mcqChList'); if(el) el.innerHTML=chRows(); };
window.mcqTogCh=function(k){
  if(prem()){ if(S.sel.ch[k]) delete S.sel.ch[k]; else S.sel.ch[k]=1; } else { S.sel.ch={}; S.sel.ch[k]=1; }
  render();
};
window.mcqAllCh=function(on){
  S.sel.ch={}; if(on){ var q=(S.sel.q||'').toLowerCase(); chaptersOf(S.exam,S.subj).forEach(function(c){ if((S.sel.cls==='all'||c.cl===S.sel.cls)&&(!q||c.c.toLowerCase().indexOf(q)>=0)) S.sel.ch[c.k]=1; }); }
  render();
};

/* ---------- building a session ---------- */
function loadMany(keys){ return Promise.all(keys.map(loadChapter)).then(function(arrs){ return [].concat.apply([],arrs); }); }
function begin(qs,label,opts){
  if(!qs.length){ toast('No questions found for this selection','⚠️'); S.busy=false; render(); return; }
  var n=qs.length, mode=opts.mode;
  S.sess={qs:qs,i:0,ans:qs.map(function(){return null;}),marked:qs.map(function(){return false;}),times:qs.map(function(){return 0;}),
    mode:mode,label:label,daily:!!opts.daily,timer:(mode==='test'&&opts.timer),total:n*SEC_PER_Q,deadline:Date.now()+n*SEC_PER_Q*1000,
    qStart:Date.now(),started:Date.now(),tid:null};
  S.busy=false; S.screen='session'; render(); window.scrollTo({top:0,behavior:'instant'});
}
function filterQs(qs,sel){
  if(sel.tag) qs=qs.filter(function(q){ return q.t===sel.tag; });
  if(sel.year) qs=qs.filter(function(q){ return String(q.y)===sel.year; });
  return qs;
}
function finishPick(qs,sel,label,extra){
  qs=sel.shuffle?shuffle(qs):qs;
  if(sel.cnt) qs=qs.slice(0,sel.cnt);
  begin(qs,label,Object.assign({mode:sel.mode,timer:sel.timer},extra||{}));
}
window.mcqStart=function(){
  var sel=S.sel, keys=Object.keys(sel.ch);
  if(!keys.length){ toast('Select at least one chapter','⚠️'); return; }
  if(!prem()) keys=keys.slice(0,1);
  S.busy=true; render();
  loadMany(keys).then(function(all){
    var label=keys.length===1?chapByKey(keys[0]).c:(keys.length+' chapters · '+S.subj);
    var s2=Object.assign({},sel); if(!prem()){ s2.tag=''; s2.year=''; s2.mode='learn'; s2.cnt=FREE_N; }
    finishPick(filterQs(all,s2),s2,label);
  }).catch(function(e){ console.warn(e); S.busy=false; toast('Could not load questions. Try again.','⚠️'); render(); });
};
window.mcqQuick=function(kind){
  var sel=S.sel, ks=subjKeys(), all=chaptersOf(S.exam,S.subj);
  if(kind==='daily'){
    S.busy=true; render();
    loadMany(shuffle(ks).slice(0,4)).then(function(qs){ finishPick(qs,Object.assign({},sel,{cnt:10,shuffle:true}),'Daily Challenge · '+S.subj,{daily:true}); })
      .catch(function(){ S.busy=false; toast('Could not load questions','⚠️'); render(); });
  } else if(kind==='weak'){
    var cand=all.filter(function(c){ var p=S.prog.ch[c.k]; return p && p.a>=5; })
      .sort(function(a,b){ return pct(S.prog.ch[a.k].c,S.prog.ch[a.k].a)-pct(S.prog.ch[b.k].c,S.prog.ch[b.k].a); }).slice(0,3);
    if(!cand.length){ toast('Practice a few chapters first — weak areas appear after 5+ attempts','ℹ️'); return; }
    S.busy=true; render();
    loadMany(cand.map(function(c){return c.k;})).then(function(qs){ finishPick(qs,Object.assign({},sel,{shuffle:true,tag:'',year:''}),'Weak areas · '+cand.map(function(c){return c.c;}).join(', ')); })
      .catch(function(){ S.busy=false; toast('Could not load questions','⚠️'); render(); });
  } else {
    var ents=listEntries(kind==='wrong'?S.prog.wrong:S.prog.mark);
    if(!ents.length){ toast(kind==='wrong'?'No wrong questions saved yet':'No bookmarked questions yet','ℹ️'); return; }
    var want={}, keys={}; ents.forEach(function(x){ var p=x.split('~'); want[p[1]]=1; keys[p[0]]=1; });
    S.busy=true; render();
    loadMany(Object.keys(keys)).then(function(qs){
      qs=qs.filter(function(q){ return want[q.i]; });
      finishPick(qs,Object.assign({},sel,{tag:'',year:'',cnt:0}),(kind==='wrong'?'Revision':'Bookmarks')+' · '+S.subj);
    }).catch(function(){ S.busy=false; toast('Could not load questions','⚠️'); render(); });
  }
};

/* ---------- session screen ---------- */
function clearTimer(){ if(S.sess && S.sess.tid){ clearInterval(S.sess.tid); S.sess.tid=null; } }
function ensureTimer(){
  var s=S.sess; if(!s||!s.timer||s.tid||S.screen!=='session') return;
  s.tid=setInterval(function(){
    if(S.screen!=='session'||ROUTE.view!=='mcq'){ clearTimer(); return; }
    var left=Math.ceil((s.deadline-Date.now())/1000), el=document.getElementById('mcqTimer');
    if(el){ el.textContent='⏱ '+fmtT(left); el.className='test-timer'+(left<60?' low':''); }
    if(left<=0){ clearTimer(); toast('Time is up — submitting','⏱'); window.mcqSubmit(true); }
  },1000);
}
function touch(){ var s=S.sess; if(!s) return; var now=Date.now(); s.times[s.i]+=(now-s.qStart)/1000; s.qStart=now; }
function scrSession(){
  var s=S.sess, q=s.qs[s.i], a=s.ans[s.i], learn=s.mode==='learn', shown=learn&&a!==null;
  var bm=S.prog.mark.indexOf(q.k+'~'+q.i)>=0, left=s.timer?Math.ceil((s.deadline-Date.now())/1000):0;
  return '<div class="card test-head"><h3>'+esc(s.label)+'</h3>'+(s.timer?'<div class="test-timer" id="mcqTimer">⏱ '+fmtT(left)+'</div>':'<div class="pill pill-navy">'+(learn?'Learn mode':'Test mode')+'</div>')+'</div>'+
  '<div class="test-shell"><div>'+
    '<div class="card q-card"><div class="q-tag">Question '+(s.i+1)+' of '+s.qs.length+(q.t?' · '+esc(q.t):'')+(q.y?' · '+esc(q.y):'')+'</div>'+
    '<div class="q-text">'+esc(q.q)+'</div><div class="opt-list">'+
    q.o.map(function(o,oi){
      var cls=''; if(shown){ if(oi===q.a) cls='correct'; else if(oi===a) cls='wrong'; } else if(a===oi) cls='selected';
      return '<div class="opt-row '+cls+'" onclick="mcqPick('+oi+')"><span class="opt-letter">'+String.fromCharCode(65+oi)+'</span><span>'+esc(o)+'</span></div>';
    }).join('')+'</div>'+
    (shown?'<div class="explain-box" style="margin-top:12px"><b>'+(a===q.a?'✓ Correct':'✗ Incorrect — answer: '+String.fromCharCode(65+q.a))+'</b>'+(q.e?'<div style="margin-top:6px">'+esc(q.e)+'</div>':'')+'</div>':'')+
    '</div>'+
    '<div class="q-nav"><button class="btn btn-outline btn-sm" '+(s.i===0?'disabled':'')+' onclick="mcqNav(-1)">← Previous</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="mcqBm()">'+(bm?'★ Saved':'☆ Bookmark')+'</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="mcqReport()">🚩 Report</button>'+
      (learn?'':'<button class="btn btn-ghost btn-sm" onclick="mcqMark()">'+(s.marked[s.i]?'⚑ Marked':'⚐ Mark for review')+'</button>')+
      (s.i===s.qs.length-1?'<button class="btn btn-gold btn-sm" onclick="mcqSubmit()">'+(learn?'Finish ✓':'Submit test ✓')+'</button>':'<button class="btn btn-primary btn-sm" onclick="mcqNav(1)">Next →</button>')+
    '</div></div>'+
    '<div class="card palette"><h5>Question palette</h5><div class="palette-grid">'+
      s.qs.map(function(_,qi){ return '<div class="pnum '+(s.ans[qi]!==null?'answered':'')+' '+(s.marked[qi]?'marked':'')+' '+(qi===s.i?'current':'')+'" onclick="mcqJump('+qi+')">'+(qi+1)+'</div>'; }).join('')+
    '</div><button class="btn btn-ghost btn-sm btn-block" style="margin-top:12px" onclick="mcqQuit()">Quit practice</button></div></div>';
}
window.mcqPick=function(oi){
  var s=S.sess; if(!s) return;
  if(s.mode==='learn'){ if(s.ans[s.i]!==null) return; touch(); s.ans[s.i]=oi; }
  else s.ans[s.i]=(s.ans[s.i]===oi?null:oi);
  render();
};
window.mcqNav=function(d){ touch(); var s=S.sess; s.i=Math.max(0,Math.min(s.qs.length-1,s.i+d)); render(); };
window.mcqJump=function(i){ touch(); S.sess.i=i; render(); };
window.mcqMark=function(){ var s=S.sess; s.marked[s.i]=!s.marked[s.i]; render(); };
window.mcqBm=function(){
  var q=S.sess.qs[S.sess.i], id=q.k+'~'+q.i, m=S.prog.mark, ix=m.indexOf(id);
  if(ix>=0) m.splice(ix,1); else { m.unshift(id); if(m.length>MAXMARK) m.length=MAXMARK; }
  saveProg(); render();
};
window.mcqReport=function(){
  var s=S.sess, q=s&&s.qs[s.i]; if(!q||!db()) return;
  var r=prompt('What is wrong with this question?\n1 = Wrong answer key\n2 = Typo / unclear question\n3 = Problem with options\n4 = Other\n\nType 1-4 and press OK');
  if(!r) return;
  var map={'1':'Wrong answer key','2':'Typo / unclear','3':'Problem with options','4':'Other'};
  db().collection('mcqReports').add({qid:q.i,k:q.k,q:String(q.q).slice(0,220),reason:map[r.trim()]||String(r).slice(0,80),by:user().email||'',uid:user().uid||'',when:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ toast('Thanks — sent to the team for checking','🚩'); }).catch(function(){ toast('Could not send report right now','⚠️'); });
};
window.mcqQuit=function(){ if(!confirm('Quit this practice? Answers given so far will be saved.')) return; window.mcqSubmit(true); };

/* ---------- finishing + progress ---------- */
window.mcqSubmit=function(force){
  var s=S.sess; if(!s) return; touch(); clearTimer();
  var un=s.ans.filter(function(x){return x===null;}).length;
  if(!force && s.mode==='test' && un>0 && !confirm(un+' question(s) are unanswered. Submit anyway?')){ ensureTimer(); return; }
  var c=0,w=0,sk=0, per={}, P=S.prog, items=[];
  s.qs.forEach(function(q,i){
    var a=s.ans[i], ok=(a!==null&&a===q.a), id=q.k+'~'+q.i;
    items.push({q:q,a:a,ok:ok,t:s.times[i]});
    if(a===null){ sk++; return; }
    if(ok) c++; else w++;
    var p=P.ch[q.k]||(P.ch[q.k]={a:0,c:0,t:0}); p.a++; if(ok) p.c++; p.t+=Math.round(s.times[i]);
    per[q.k]=per[q.k]||{a:0,c:0}; per[q.k].a++; if(ok) per[q.k].c++;
    var wi=P.wrong.indexOf(id);
    if(ok){ if(wi>=0) P.wrong.splice(wi,1); } else { if(wi>=0) P.wrong.splice(wi,1); P.wrong.unshift(id); }
  });
  if(P.wrong.length>MAXWRONG) P.wrong.length=MAXWRONG;
  var score=c*4-w, answered=c+w, secs=Math.round((Date.now()-s.started)/1000);
  if(answered>0){
    P.hist.unshift({t:Date.now(),l:s.label,n:s.qs.length,c:c,a:answered,s:score,m:s.mode,d:secs}); if(P.hist.length>MAXHIST) P.hist.length=MAXHIST;
    var st=P.streak||(P.streak={last:'',n:0});
    if(st.last!==today()){ st.n=(st.last===yesterday())?st.n+1:1; st.last=today(); }
    if(s.daily) P.daily={d:today(),s:score};
  }
  if(answered>0){ P.days=P.days||{}; P.days[today()]=(P.days[today()]||0)+answered; }
  saveProg();
  S.res={label:s.label,mode:s.mode,items:items,c:c,w:w,sk:sk,score:score,max:s.qs.length*4,secs:secs,per:per};
  S.sess=null; S.screen='result'; render(); window.scrollTo({top:0,behavior:'instant'});
};
function scrResult(){
  var r=S.res, answered=r.c+r.w;
  var perRows=Object.keys(r.per).map(function(k){ var ch=chapByKey(k); return '<tr><td>'+esc(ch?ch.c:k)+'</td><td>'+r.per[k].c+' / '+r.per[k].a+'</td><td>'+pct(r.per[k].c,r.per[k].a)+'%</td></tr>'; }).join('');
  var wrongQs=r.items.filter(function(x){ return x.a!==null&&!x.ok; }).map(function(x){return x.q;});
  return head('Practice complete',esc(r.label))+
  '<div class="stat-row" style="margin-bottom:16px">'+
    '<div class="card stat-box"><b>'+r.score+'</b><span>Score (of '+r.max+')</span></div>'+
    '<div class="card stat-box"><b>'+pct(r.c,answered)+'%</b><span>Accuracy</span></div>'+
    '<div class="card stat-box"><b>'+r.c+' / '+r.w+' / '+r.sk+'</b><span>Right / Wrong / Skipped</span></div>'+
    '<div class="card stat-box"><b>'+fmtT(r.secs)+'</b><span>Time</span></div></div>'+
  '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'+
    (wrongQs.length?'<button class="btn btn-gold btn-sm" onclick="mcqRetryWrong()">🔁 Retry the '+wrongQs.length+' wrong</button>':'')+
    '<button class="btn btn-primary btn-sm" onclick="mcqGo(\'subject\',\''+esc(S.exam)+'\',\''+esc(S.subj)+'\')">Practice more</button>'+
    '<button class="btn btn-outline btn-sm" onclick="mcqGo(\'home\')">Hub home</button></div>'+
  (perRows&&Object.keys(r.per).length>1?'<div class="card" style="padding:6px 6px 2px;margin-bottom:16px"><table class="table-simple"><thead><tr><th>Chapter</th><th>Score</th><th>Accuracy</th></tr></thead><tbody>'+perRows+'</tbody></table></div>':'')+
  '<h3 style="font-family:var(--font-display);margin:6px 0 10px">Review</h3>'+
  r.items.map(function(x,i){
    var q=x.q, st=x.a===null?'skip':(x.ok?'ok':'bad');
    return '<details class="mcq-rev '+st+'"><summary>'+(i+1)+'. '+esc(q.q)+'</summary><div style="margin-top:8px">'+
      q.o.map(function(o,oi){ return '<div style="padding:2px 0;'+(oi===q.a?'color:var(--green-700);font-weight:700':(oi===x.a?'color:var(--red-600);font-weight:700':''))+'">'+String.fromCharCode(65+oi)+'. '+esc(o)+(oi===q.a?' ✓':(oi===x.a?' ✗ (your answer)':''))+'</div>'; }).join('')+
      (x.a===null?'<div style="color:var(--faint);margin-top:4px">Skipped</div>':'')+(q.e?'<div class="explain-box" style="margin-top:8px">'+esc(q.e)+'</div>':'')+'</div></details>';
  }).join('');
}
window.mcqRetryWrong=function(){
  var qs=S.res.items.filter(function(x){ return x.a!==null&&!x.ok; }).map(function(x){return x.q;});
  begin(shuffle(qs),'Retry · wrong answers',{mode:'learn',timer:false});
};

/* ---------- analytics (Premium) ---------- */
function scrStats(){
  var P=S.prog, ex=examList(), a=0, c=0;
  Object.keys(P.ch).forEach(function(k){ a+=P.ch[k].a; c+=P.ch[k].c; });
  var st=P.streak||{}, streakOn=(st.last===today()||st.last===yesterday())?st.n:0;
  var rows=Object.keys(P.ch).filter(function(k){ return P.ch[k].a>0&&chapByKey(k); }).map(function(k){ var ch=chapByKey(k),p=P.ch[k]; return {ch:ch,p:p,acc:pct(p.c,p.a)}; })
    .sort(function(x,y){ return x.acc-y.acc; });
  return head('My analytics','Your accuracy across every chapter you have practised','home')+
  '<div class="stat-row" style="margin-bottom:16px">'+
    '<div class="card stat-box"><b>'+a+'</b><span>Questions attempted</span></div>'+
    '<div class="card stat-box"><b>'+pct(c,a)+'%</b><span>Overall accuracy</span></div>'+
    '<div class="card stat-box"><b>'+streakOn+'</b><span>Day streak 🔥</span></div>'+
    '<div class="card stat-box"><b>'+P.wrong.length+'</b><span>To revise</span></div></div>'+
  '<div class="card" style="padding:6px 6px 2px;margin-bottom:16px"><table class="table-simple"><thead><tr><th>Chapter (weakest first)</th><th>Exam · Subject</th><th>Correct</th><th>Accuracy</th><th>Avg time</th></tr></thead><tbody>'+
    (rows.length?rows.map(function(r){ return '<tr><td>'+esc(r.ch.c)+'</td><td>'+esc(r.ch.e)+' · '+esc(r.ch.s)+'</td><td>'+r.p.c+' / '+r.p.a+'</td><td><span class="pill '+(r.acc>=70?'pill-green':(r.acc>=40?'pill-gold':'pill-red'))+'">'+r.acc+'%</span></td><td>'+Math.round(r.p.t/r.p.a)+'s</td></tr>'; }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">No practice yet — start a chapter to see your analytics.</td></tr>')+
  '</tbody></table></div>'+
  '<h3 style="font-family:var(--font-display);margin:6px 0 10px">Recent sessions</h3>'+
  (P.hist.length?P.hist.slice(0,10).map(function(h){ return '<div class="card" style="padding:10px 14px;margin-bottom:6px;display:flex;gap:10px;flex-wrap:wrap;font-size:13px"><b style="flex:1;min-width:140px">'+esc(h.l)+'</b><span>'+h.c+'/'+h.a+' correct</span><span>'+(h.m==='test'?'Score '+h.s:'Learn')+'</span><span style="color:var(--muted)">'+new Date(h.t).toLocaleDateString('en-IN')+'</span></div>'; }).join(''):'<div style="color:var(--muted);font-size:13px">Nothing yet.</div>');
}
})();
