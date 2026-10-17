/* =========================================================================
   Dr. Shreyansh Academy — Learning Hub (learn.js)
   The "thinks for the student" layer on top of the MCQ Hub:
     🗓 Today's plan        auto-built from weak chapters, due revision, exam goal
     🔁 Spaced revision     every wrong question returns after 1 · 3 · 7 · 21 · 60 days
     📓 Mistake notebook    mistakes tagged by reason (concept / calculation / silly / time / guess)
     🗺 Mastery map         every chapter coloured by how well it is known
     📝 Mock exams          real NEET (180 Q · 200 min) and JEE-MCQ patterns with coaching insights
     ✨ Smart practice      picks the questions that help most (due → wrong before → unseen → right difficulty)
     🏷 Auto difficulty     Easy / Medium / Hard from what ALL students actually answered
   NEW file; the MCQ Hub only gains small optional hooks.
   ========================================================================= */
(function(){
'use strict';
var STAGES=[1,3,7,21,60], MAXSEEN=3000, MAXNB=120, MAXSRS=600, MAXMOCK=20;
var REASONS=[['concept','🧠','Concept'],['calc','🧮','Calculation'],['silly','😅','Silly mistake'],['time','⏱','Time pressure'],['guess','🎲','Guess']];
var TIPS={concept:'Most mistakes are concept gaps — watch the chapter lecture, re-read the notes, then re-attempt.',calc:'Calculation slips are costing you marks — write each step, double-check signs and units.',silly:'Silly mistakes dominate — slow down by 10 seconds and re-read the question before choosing.',time:'Time pressure is the main issue — practise in Test mode and skip anything that needs over 90 seconds.',guess:'Many answers were guesses — only answer when you can eliminate two options; otherwise skip (−1 hurts).'};
var T={tab:'plan',nbf:'all',map:'',D:null,busy:false,idxBusy:false,stats:{},statsBusy:{},pend:{},saveT:null,mb:false,exam:''};
var LRN=window.LRN={};

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return window.__LRN_TODAY||ymd(new Date()); }
function addDays(ds,n){ var d=new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n); return ymd(d); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function me(){ return DB.currentUser; }
function prem(){ return !!me()&&me().plan==='premium'; }
function again(){ if(ROUTE.view==='learn') render(); }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t; } return a; }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function newD(){ return {v:1,srs:{},nb:{},seen:[],plan:{d:'',w:'',n:''},td:{d:'',by:{}},mocks:[],gx:{xp:0,wk:{w:'',xp:0},gd:0,rc:0,mk:0},bd:{}}; }
function card(i,x){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(x||'')+'">'+i+'</div>'; }
function h3(t){ return '<h3 style="font-size:15px;margin:0 0 12px">'+t+'</h3>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function bar(p,col){ return '<div style="height:8px;border-radius:5px;background:var(--paper-2);overflow:hidden"><i style="display:block;height:100%;width:'+Math.min(100,p)+'%;background:'+(col||'var(--green-500)')+'"></i></div>'; }

/* ------------------------------ data ------------------------------------- */
LRN.load=function(){
  if(T.D) return Promise.resolve(T.D);
  if(T.busy) return T.busy;
  var u=me(); if(!u||!u.uid||!live()){ T.D=newD(); return Promise.resolve(T.D); }
  T.busy=fbDb.collection('learnData').doc(u.uid).get().then(function(d){ var n=newD(); if(d.exists){ var x=d.data()||{}; for(var k in n){ if(x[k]!==undefined) n[k]=x[k]; } } T.D=n; })
    .catch(function(e){ console.warn('[LRN] load failed',e); T.D=newD(); }).then(function(){ T.busy=false; return T.D; });
  return T.busy;
};
function save(){
  var u=me(); if(!u||!u.uid||!T.D||!live()) return; clearTimeout(T.saveT);
  T.saveT=setTimeout(function(){ var p=Object.assign({},T.D,{upd:ts()}); fbDb.collection('learnData').doc(u.uid).set(p).catch(function(e){ console.warn('[LRN] save failed',e); }); },1200);
}
function ready(){ return !!(T.D&&window.MCQ&&MCQ.index&&MCQ.prog); }
function kick(){
  if(!window.MCQ) return;
  if(!T.D) LRN.load().then(again);
  if(!MCQ.index&&!T.idxBusy){ T.idxBusy=true; MCQ.loadIndex().then(function(){ T.idxBusy=false; again(); }); }
  if(!MCQ.prog) MCQ.loadProg().then(again);
}
function dueIds(){ var t=today(); return Object.keys(T.D.srs).filter(function(id){ return T.D.srs[id].d<=t; }); }
LRN.dueCount=function(){ return T.D?dueIds().length:0; };
LRN.summary=function(){
  if(!T.D) return {};
  var c={}; Object.keys(T.D.nb).forEach(function(id){ var r=T.D.nb[id].r; if(r) c[r]=(c[r]||0)+1; });
  var top=Object.keys(c).sort(function(a,b){ return c[b]-c[a]; })[0]||'';
  var lab=REASONS.filter(function(x){ return x[0]===top; })[0];
  return {due:dueIds().length,topReason:lab?lab[2]:''};
};

/* record every finished practice/mock: revision schedule, notebook, seen, difficulty stats */
LRN.onResult=function(items,label){
  LRN.load().then(function(){
    var D=T.D, t=today(), seen={}, byCh={}, c=0, w=0, bySubj={}, cleared=0;
    D.seen.forEach(function(i){ seen[i]=1; });
    if(D.td.d!==t) D.td={d:t,by:{}};
    items.forEach(function(x){
      var q=x.q; if(!q||!q.k||q.k==='custom'||x.a===null) return;
      var id=q.k+'~'+q.i; if(x.ok) c++; else w++;
      if(!seen[id]){ seen[id]=1; D.seen.push(id); }
      D.td.by[q.k]=(D.td.by[q.k]||0)+1;
      if(q.k!=='gen'){ var o=(byCh[q.k]=byCh[q.k]||{}); var s=(o[q.i]=o[q.i]||{a:0,c:0,p:[0,0,0,0]}); s.a++; if(x.ok) s.c++; if(x.a>=0&&x.a<4) s.p[x.a]++; }
      var ch=MCQ.chapByKey&&MCQ.chapByKey(q.k); if(ch){ var b=(bySubj[ch.s]=bySubj[ch.s]||{c:0,w:0}); if(x.ok) b.c++; else b.w++; }
      if(!x.ok){
        D.srs[id]={k:q.k,s:0,d:addDays(t,1)};
        var prev=D.nb[id]||{}; D.nb[id]={k:q.k,i:q.i,q:String(q.q).slice(0,400),o:q.o,a:q.a,e:String(q.e||'').slice(0,300),w:x.a,ts:Date.now(),ok:0,r:T.pend[id]||prev.r||''};
        delete T.pend[id];
      } else {
        var e=D.srs[id]; if(e&&e.d<=t){ cleared++; e.s++; if(e.s>=STAGES.length) delete D.srs[id]; else e.d=addDays(t,STAGES[e.s]); }
        var n=D.nb[id]; if(n){ n.ok=(n.ok||0)+1; if(n.ok>=2) delete D.nb[id]; }
      }
    });
    if(D.seen.length>MAXSEEN) D.seen=D.seen.slice(D.seen.length-MAXSEEN);
    var nk=Object.keys(D.nb); if(nk.length>MAXNB){ nk.sort(function(a,b){ return D.nb[a].ts-D.nb[b].ts; }).slice(0,nk.length-MAXNB).forEach(function(k){ delete D.nb[k]; }); }
    var sk=Object.keys(D.srs); if(sk.length>MAXSRS){ sk.sort(function(a,b){ return D.srs[b].s-D.srs[a].s; }).slice(0,sk.length-MAXSRS).forEach(function(k){ delete D.srs[k]; }); }
    if(/mock/i.test(label)&&c+w>0){ D.mocks.unshift({t:Date.now(),l:String(label).slice(0,40),sc:c*4-w,mx:items.length*4,acc:pct(c,c+w),s:bySubj}); if(D.mocks.length>MAXMOCK) D.mocks.length=MAXMOCK; }
    if(window.RWD&&RWD.onResult){ try{ RWD.onResult({D:D,items:items,label:label,c:c,w:w,cleared:cleared,P:MCQ.prog}); }catch(e){ console.warn('[RWD]',e); } }
    save(); statsWrite(byCh); LRN.refreshGlance&&LRN.refreshGlance();
  });
};
function statsWrite(byCh){
  if(!live()) return; var inc=firebase.firestore.FieldValue.increment;
  Object.keys(byCh).forEach(function(k){
    var s={}; Object.keys(byCh[k]).forEach(function(id){ var v=byCh[k][id], o={a:inc(v.a),c:inc(v.c)}; v.p.forEach(function(n,ix){ if(n) o['p'+ix]=inc(n); }); s[id]=o; });
    fbDb.collection('qStats').doc(k).set({s:s},{merge:true}).catch(function(){}); delete T.stats[k];
  });
}
/* difficulty from all students' answers */
function loadStats(k){
  if(T.stats[k]) return Promise.resolve(T.stats[k]);
  if(T.statsBusy[k]) return T.statsBusy[k];
  T.statsBusy[k]=fbDb.collection('qStats').doc(k).get().then(function(d){ T.stats[k]=(d.exists&&d.data().s)||{}; return T.stats[k]; })
    .catch(function(){ T.stats[k]={}; return {}; }).then(function(r){ delete T.statsBusy[k]; return r; });
  return T.statsBusy[k];
}
LRN.loadStats=function(k){ return loadStats(k); };
LRN.optStats=function(k,i){ var s=T.stats[k]; s=s&&s[i]; if(!s||!s.a||s.a<5) return null; return {a:s.a,c:s.c,p:[s.p0||0,s.p1||0,s.p2||0,s.p3||0]}; };
function diffOf(q){ var s=T.stats[q.k]; s=s&&s[q.i]; if(!s||s.a<5) return null; var p=s.c/s.a; return {p:p,l:p>=0.7?'Easy':(p>=0.4?'Medium':'Hard')}; }
window.lrnBadge=function(q){
  if(!live()||!q||!q.k||q.k==='custom'||q.k==='gen') return '';
  if(!T.stats[q.k]){ if(!T.statsBusy[q.k]) loadStats(q.k).then(function(){ if(ROUTE.view==='mcq') render(); }); return ''; }
  var d=diffOf(q); if(!d) return '';
  var col=d.l==='Easy'?'var(--green-700)':(d.l==='Hard'?'var(--red-600)':'var(--gold-700)');
  return ' · <b style="color:'+col+'">'+d.l+'</b> <span style="color:var(--faint)">('+Math.round(d.p*100)+'% get it right)</span>';
};

/* ------------------------------ smart practice --------------------------- */
function chAcc(k){ var p=MCQ.prog.ch[k]; return p&&p.a>=5?p.c/p.a:null; }
function smartPick(qs,k,n){
  var D=T.D, t=today(), seen={}; D.seen.forEach(function(i){ seen[i]=1; });
  var wrong={}; (MCQ.prog.wrong||[]).forEach(function(i){ wrong[i]=1; });
  var acc=chAcc(k), target=acc===null?0.55:(acc<0.5?0.75:(acc<0.8?0.55:0.35));
  return qs.map(function(q){
    var id=k+'~'+q.i, sc=Math.random()*10, e=D.srs[id];
    if(e&&e.d<=t) sc+=100; else if(wrong[id]) sc+=60; if(!seen[id]) sc+=40;
    var d=diffOf(q); sc+=d?30*(1-Math.abs(d.p-target)):15;
    return {q:q,s:sc};
  }).sort(function(a,b){ return b.s-a.s; }).slice(0,n).map(function(x){ return x.q; });
}
function startSession(qs,label,opts,chapter){
  if(!qs.length){ toast('No questions available for this yet','ℹ️'); T.mb=false; again(); return; }
  Promise.all([MCQ.loadIndex(),MCQ.loadProg()]).then(function(){
    if(chapter){ MCQ.exam=chapter.e; MCQ.subj=chapter.s; }
    T.mb=false; MCQ.begin(qs,label,opts||{mode:'learn',timer:false}); go('mcq');
  });
}
LRN.smart=function(k,n){
  var ch=MCQ.chapByKey(k); if(!ch) return; T.mb=true; again();
  Promise.all([MCQ.loadChapter(k),loadStats(k)]).then(function(r){ startSession(shuffle(smartPick(r[0],k,n||15)),'Smart practice · '+ch.c,{mode:'learn',timer:false},ch); })
    .catch(function(){ T.mb=false; toast('Could not load questions','⚠️'); again(); });
};
window.lrnSmart=function(k,n){ LRN.smart(k,n); };
window.lrnRevise=function(){
  var ids=dueIds().slice(0,25); if(!ids.length){ toast('Nothing due — great job!','🎉'); return; }
  var by={}; ids.forEach(function(id){ var p=id.split('~'); (by[p[0]]=by[p[0]]||{})[p[1]]=1; });
  T.mb=true; again();
  var real=Object.keys(by).filter(function(k){ return k!=='gen'; }), gens=by.gen?Object.keys(by.gen).map(function(i){ return window.GEN&&GEN.rebuild(i); }).filter(Boolean):[];
  Promise.all(real.map(function(k){ return MCQ.loadChapter(k); })).then(function(arrs){
    var all=[].concat.apply([],arrs).filter(function(q){ return by[q.k]&&by[q.k][q.i]; }).concat(gens);
    startSession(shuffle(all),'Revision · due today',{mode:'learn',timer:false});
  }).catch(function(){ T.mb=false; toast('Could not load questions','⚠️'); again(); });
};

/* ------------------------------ mocks ------------------------------------ */
var MOCKS=[
 {id:'neet',l:'NEET Full Mock',d:'180 questions · 200 minutes · Physics 45 · Chemistry 45 · Biology 90 · +4 / −1',exam:'NEET',q:{Physics:45,Chemistry:45,Biology:90},mins:200},
 {id:'neet90',l:'NEET Half Mock',d:'90 questions · 100 minutes · half-length practice (P 23 · C 22 · B 45)',exam:'NEET',q:{Physics:23,Chemistry:22,Biology:45},mins:100},
 {id:'jee',l:'JEE Main Mock (MCQ pattern)',d:'60 questions · 120 minutes · Physics 20 · Chemistry 20 · Maths 20 · +4 / −1 (numerical-type questions are not in the bank yet)',exam:'JEE',q:{Physics:20,Chemistry:20,Maths:20},mins:120}
];
window.lrnMock=async function(id){
  if(!prem()){ toast('🔒 Full mock exams are a Premium feature','★'); return; }
  var s=MOCKS.filter(function(x){ return x.id===id; })[0]; if(!s||T.mb) return;
  T.mb=true; again();
  try{
    await MCQ.loadIndex(); var out=[], short=[];
    for(var sub in s.q){
      var chs=shuffle(MCQ.index.chapters.filter(function(c){ return c.e===s.exam&&c.s===sub; })), pool=[], i=0;
      while(pool.length<s.q[sub]*1.3&&i<chs.length){ var grp=chs.slice(i,i+5); i+=5; pool=pool.concat([].concat.apply([],await Promise.all(grp.map(function(c){ return MCQ.loadChapter(c.k); })))); }
      var pick=shuffle(pool).slice(0,s.q[sub]); if(pick.length<s.q[sub]) short.push(sub+' '+pick.length+'/'+s.q[sub]); out=out.concat(pick);
    }
    if(short.length) toast('Bank is short for: '+short.join(', ')+' — using what is available','ℹ️');
    if(out.length<10){ T.mb=false; toast('Not enough questions for this mock yet','⚠️'); again(); return; }
    var sum=Object.keys(s.q).reduce(function(a,k){ return a+s.q[k]; },0), mins=out.length===sum?s.mins:Math.max(10,Math.round(s.mins*out.length/sum));
    await Promise.all([MCQ.loadProg()]); T.mb=false; MCQ.begin(out,s.l,{mode:'test',timer:true,mins:mins}); go('mcq');
  }catch(e){ console.warn(e); T.mb=false; toast('Could not build the mock. Try again.','⚠️'); again(); }
};

/* ------------------------------ result coaching -------------------------- */
window.lrnResultExtra=function(r){
  if(!T.D&&live()) LRN.load();
  var ans=r.items.filter(function(x){ return x.a!==null; }), n=ans.length; if(!n) return '';
  var wrong=ans.filter(function(x){ return !x.ok; }), tot=ans.reduce(function(a,x){ return a+x.t; },0), avg=Math.round(tot/n);
  var quick=wrong.filter(function(x){ return x.t<8; }).length, slow=ans.filter(function(x){ return x.t>120; }).length;
  var subj={}; r.items.forEach(function(x){ var ch=MCQ.chapByKey&&MCQ.chapByKey(x.q.k); if(!ch||x.a===null) return; var b=subj[ch.s]=subj[ch.s]||{c:0,w:0}; if(x.ok) b.c++; else b.w++; });
  var tip=quick>=Math.max(3,wrong.length*0.25)?'⚠️ '+quick+' wrong answers were given in under 8 seconds — these look like guesses. Skip when unsure; every wrong answer costs 5 marks swing.':
    (avg>90?'⏱ Your average is '+avg+'s per question — too slow for exam conditions. Practise Test mode and skip anything that needs over 90 seconds.':
    (wrong.length===0?'🌟 Perfect round — no mistakes. Try a harder chapter or a mock next.':'💡 Revise the '+wrong.length+' mistake'+(wrong.length>1?'s':'')+' below — they are already scheduled to return in your Revision list.'));
  var html=card(h3('🧠 Coaching insights')+'<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:13.5px;margin-bottom:10px"><span>Avg time: <b>'+avg+'s</b>/question</span><span>Marks lost to wrong answers: <b>−'+wrong.length+'</b></span>'+(slow?'<span>Over 2 min: <b>'+slow+'</b></span>':'')+(quick?'<span>Quick wrong (&lt;8s): <b>'+quick+'</b></span>':'')+'</div>'+
    (Object.keys(subj).length>1?'<table class="table-simple" style="margin-bottom:10px"><thead><tr><th>Subject</th><th>Right</th><th>Wrong</th><th>Score</th></tr></thead><tbody>'+Object.keys(subj).map(function(s){ var b=subj[s]; return '<tr><td>'+esc(s)+'</td><td>'+b.c+'</td><td>'+b.w+'</td><td><b>'+(b.c*4-b.w)+'</b></td></tr>'; }).join('')+'</tbody></table>':'')+
    '<div style="font-size:13.5px;line-height:1.6">'+esc(tip)+'</div>');
  if(wrong.length) html+=card(h3('📓 Why did you get these wrong? <span style="font-weight:400;font-size:12px;color:var(--muted)">(10 seconds — helps your notebook find your pattern)</span>')+
    wrong.slice(0,8).map(function(x){ var id=x.q.k+'~'+x.q.i, cur=(T.D&&T.D.nb[id]&&T.D.nb[id].r)||T.pend[id]||'';
      return '<div style="padding:9px 0;border-top:1px solid var(--border)"><div style="font-size:13px;margin-bottom:6px">'+esc(String(x.q.q).slice(0,150))+(x.q.q.length>150?'…':'')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+REASONS.map(function(rs){ return '<button class="mcq-chip '+(cur===rs[0]?'on':'')+'" style="padding:4px 10px;font-size:12px" onclick="lrnTag(\''+esc(id)+'\',\''+rs[0]+'\')">'+rs[1]+' '+rs[2]+'</button>'; }).join('')+'</div></div>'; }).join(''));
  return html;
};
window.lrnTag=function(id,reason){
  T.pend[id]=reason;
  LRN.load().then(function(){ var e=T.D.nb[id]; if(e){ e.r=reason; delete T.pend[id]; save(); } if(ROUTE.view==='mcq') render(); });
  if(ROUTE.view==='mcq') render();
};

/* ------------------------------ hub screens ------------------------------ */
window.renderLearn=function(){
  if(!me()) return renderAuth();
  var sb=sidebar('learn');
  function wrap(b){ return '<div class="app-shell">'+sb+'<div class="main" style="max-width:1000px">'+b+'</div></div>'; }
  if(!live()||!window.MCQ) return wrap(note('⚡','The Learning Hub works in live mode. Connect Firebase first.'));
  if(!ready()){ kick(); return wrap('<div class="main-head"><div><h2>🧠 Learning Hub</h2></div></div>'+note('⏳','Loading your learning data…')); }
  if(MCQ.index.chapters.length===0) return wrap(note('📚','The question bank is being set up.'));
  var D=T.D, due=dueIds().length, nbN=Object.keys(D.nb).length;
  var tabs=[['plan','🗓 Today'],['rev','🔁 Revision'+(due?' ('+due+')':'')],['nb','📓 Notebook'+(nbN?' ('+nbN+')':'')],['map','🗺 Mastery map'],['mock','📝 Mock exams'],['gen','♾ Numericals'],['rwd','🏆 Rewards']];
  var body={plan:tabPlan,rev:tabRev,nb:tabNb,map:tabMap,mock:tabMock,gen:tabGen,rwd:tabRwd}[T.tab]();
  return wrap('<div class="main-head"><div><h2>🧠 Learning Hub</h2><p>Practice that adapts to you — revision, mistakes, mastery and real exam mocks</p></div></div>'+
    '<div class="mcq-tabs">'+tabs.map(function(t){ return '<button class="mcq-chip '+(T.tab===t[0]?'on':'')+'" onclick="lrnTab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+'</div>'+
    (T.mb?'<div class="card" style="padding:14px 18px;margin-bottom:14px">⏳ Preparing your questions…</div>':'')+body);
};
window.lrnTab=function(t){ T.tab=t; render(); };
function chapAll(){ return MCQ.index.chapters; }
function mastery(ch){
  var p=MCQ.prog.ch[ch.k], a=p?p.a:0, acc=a?p.c/a:0;
  if(!a) return {l:'Not started',c:'var(--paper-2)',t:'var(--muted)',lv:0,acc:0,a:0};
  if(a<5) return {l:'Started',c:'#dbeafe',t:'#1e40af',lv:1,acc:acc,a:a};
  if(acc<0.5) return {l:'Needs work',c:'#fecaca',t:'#991b1b',lv:2,acc:acc,a:a};
  if(acc<0.7) return {l:'Improving',c:'#fde68a',t:'#92400e',lv:3,acc:acc,a:a};
  if(acc<0.85||a<20) return {l:'Strong',c:'#bbf7d0',t:'#166534',lv:4,acc:acc,a:a};
  return {l:'Mastered',c:'#4ade80',t:'#14532d',lv:5,acc:acc,a:a};
}
function ensurePlan(){
  var D=T.D, t=today(); if(D.plan&&D.plan.d===t) return;
  var chs=chapAll(), exam=(MCQ.prog.goal&&MCQ.prog.goal.exam&&/NEET|JEE/.test(MCQ.prog.goal.exam))?(MCQ.prog.goal.exam.indexOf('NEET')>=0?'NEET':'JEE'):'';
  var cand=chs.filter(function(c){ var p=MCQ.prog.ch[c.k]; return p&&p.a>=5; }).sort(function(a,b){ return pct(MCQ.prog.ch[a.k].c,MCQ.prog.ch[a.k].a)-pct(MCQ.prog.ch[b.k].c,MCQ.prog.ch[b.k].a); });
  var fresh=chs.filter(function(c){ return !MCQ.prog.ch[c.k]&&(!exam||c.e===exam); });
  if(!fresh.length) fresh=chs.filter(function(c){ return !MCQ.prog.ch[c.k]; });
  D.plan={d:t,w:cand.length?cand[0].k:'',n:fresh.length?fresh[0].k:''}; save();
}
function tabPlan(){
  var D=T.D; ensurePlan(); var t=today(), due=dueIds().length, P=MCQ.prog, g=P.goal||{}, daily=g.daily||30, tn=(P.days&&P.days[t])||0;
  var chs=chapAll(), mast=chs.filter(function(c){ return mastery(c).lv>=4; }).length, started=chs.filter(function(c){ return mastery(c).lv>=1; }).length;
  var w=D.plan.w&&MCQ.chapByKey(D.plan.w), nw=D.plan.n&&MCQ.chapByKey(D.plan.n), by=D.td.d===t?D.td.by:{};
  function item(done,ic,title,sub,btn,fn){ return '<div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-top:1px solid var(--border);flex-wrap:wrap"><div style="font-size:22px">'+(done?'✅':ic)+'</div><div style="flex:1;min-width:200px"><b style="'+(done?'text-decoration:line-through;color:var(--muted)':'')+'">'+title+'</b><div style="font-size:12.5px;color:var(--muted)">'+sub+'</div></div>'+(done?'':'<button class="btn btn-primary btn-sm" onclick="'+fn+'">'+btn+'</button>')+'</div>'; }
  var wDone=w&&(by[w.k]||0)>=10, nDone=nw&&(by[nw.k]||0)>=10;
  return '<div class="stat-row" style="margin-bottom:16px"><div class="card stat-box"><b>'+due+'</b><span>Revision due today</span></div><div class="card stat-box"><b>'+Object.keys(D.nb).length+'</b><span>In mistake notebook</span></div><div class="card stat-box"><b>'+mast+'</b><span>Chapters strong / mastered</span></div><div class="card stat-box"><b>'+pct(started,chs.length)+'%</b><span>Syllabus started</span></div></div>'+
    card(h3('🗓 Your plan for today')+
      item(due===0,'🔁','Revise what you got wrong',due?due+' question'+(due>1?'s':'')+' are due now — the best use of 10 minutes':'Nothing due. Come back tomorrow.','Start revision →','lrnRevise()')+
      (w?item(wDone,'🎯','Fix your weakest chapter: '+esc(w.c),'Accuracy '+pct(MCQ.prog.ch[w.k].c,MCQ.prog.ch[w.k].a)+'% · 15 smart-picked questions','Start →',"lrnSmart('"+esc(w.k)+"',15)"):'')+
      (nw?item(nDone,'🚀','Start a new chapter: '+esc(nw.c),esc(nw.e)+' · '+esc(nw.s)+' · 10 questions to begin','Start →',"lrnSmart('"+esc(nw.k)+"',10)"):'')+
      '<div style="padding-top:14px;border-top:1px solid var(--border)"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><b>Daily goal</b><span>'+tn+' / '+daily+' questions</span></div>'+bar(pct(tn,daily),tn>=daily?'var(--green-500)':'var(--gold-500)')+'</div>')+
    card(h3('How this works')+'<div style="font-size:13px;line-height:1.75;color:var(--muted)">Every wrong answer comes back after <b>1, 3, 7, 21 and 60 days</b> until you get it right — this is how top rankers lock facts into long-term memory. Your plan is rebuilt each morning from your weakest chapters and your exam goal. Set your exam date in <a href="#" onclick="go(\'studyhub\');return false" style="color:var(--navy-700);font-weight:600">Study Planner</a>.</div>');
}
function tabRev(){
  var D=T.D, t=today(), due=dueIds(), up={}, k;
  Object.keys(D.srs).forEach(function(id){ var d=D.srs[id].d; if(d>t){ up[d]=(up[d]||0)+1; } });
  var days=Object.keys(up).sort().slice(0,7), by={}; due.forEach(function(id){ var kk=id.split('~')[0]; by[kk]=(by[kk]||0)+1; });
  return card(h3('🔁 Spaced revision')+'<div style="font-size:32px;font-weight:700;margin-bottom:4px">'+due.length+'</div><div style="font-size:13.5px;color:var(--muted);margin-bottom:14px">question'+(due.length===1?'':'s')+' due today · '+Object.keys(D.srs).length+' scheduled in total</div>'+
    (due.length?'<button class="btn btn-primary" onclick="lrnRevise()">Start revision ('+Math.min(25,due.length)+' questions) →</button>':'<div style="font-size:14px;color:var(--green-700);font-weight:600">🎉 You are all caught up.</div>'))+
    (Object.keys(by).length?card(h3('Due by chapter')+Object.keys(by).map(function(kk){ var ch=MCQ.chapByKey(kk); return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border);font-size:13.5px"><span>'+esc(ch?ch.c:(kk==='gen'?'Infinite numericals':kk))+'</span><b>'+by[kk]+'</b></div>'; }).join('')):'')+
    (days.length?card(h3('Coming up')+days.map(function(d){ return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border);font-size:13.5px"><span>'+esc(new Date(d+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'}))+'</span><b>'+up[d]+'</b></div>'; }).join('')):'');
}
function tabNb(){
  var D=T.D, ids=Object.keys(D.nb).sort(function(a,b){ return D.nb[b].ts-D.nb[a].ts; }), cnt={all:ids.length,none:0}, f=T.nbf;
  REASONS.forEach(function(r){ cnt[r[0]]=0; }); ids.forEach(function(id){ var r=D.nb[id].r; if(r) cnt[r]++; else cnt.none++; });
  var top=REASONS.slice().sort(function(a,b){ return cnt[b[0]]-cnt[a[0]]; })[0], list=ids.filter(function(id){ var r=D.nb[id].r; return f==='all'||(f==='none'?!r:r===f); });
  return (ids.length?card(h3('📓 Your mistake pattern')+(cnt[top[0]]?'<div style="font-size:13.5px;line-height:1.6;margin-bottom:12px"><b>'+top[1]+' '+top[2]+'</b> is your biggest leak ('+cnt[top[0]]+' of '+ids.length+'). '+esc(TIPS[top[0]])+'</div>':'<div style="font-size:13.5px;color:var(--muted);margin-bottom:12px">Tag a few mistakes below with their reason and your pattern will appear here.</div>')+
      REASONS.map(function(r){ return '<div style="display:flex;gap:10px;align-items:center;font-size:12.5px;margin-bottom:5px"><span style="width:130px">'+r[1]+' '+r[2]+'</span><div style="flex:1">'+bar(pct(cnt[r[0]],ids.length),'var(--navy-600)')+'</div><b style="width:26px;text-align:right">'+cnt[r[0]]+'</b></div>'; }).join('')):'')+
    '<div class="mcq-tabs">'+[['all','All ('+cnt.all+')'],['none','Untagged ('+cnt.none+')']].concat(REASONS.map(function(r){ return [r[0],r[1]+' '+r[2]+' ('+cnt[r[0]]+')']; })).map(function(t){ return '<button class="mcq-chip '+(f===t[0]?'on':'')+'" onclick="lrnNbF(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+'</div>'+
    (list.length?list.slice(0,40).map(function(id){ var n=D.nb[id];
      return card('<div style="font-size:14px;line-height:1.55;margin-bottom:8px">'+esc(n.q)+'</div>'+n.o.map(function(o,oi){ return '<div style="font-size:13px;padding:2px 0;'+(oi===n.a?'color:var(--green-700);font-weight:700':(oi===n.w?'color:var(--red-600)':''))+'">'+String.fromCharCode(65+oi)+'. '+esc(o)+(oi===n.a?' ✓':(oi===n.w?' ✗ (your answer)':''))+'</div>'; }).join('')+
        (n.e?'<div class="explain-box" style="margin-top:8px">'+esc(n.e)+'</div>':'')+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center">'+REASONS.map(function(rs){ return '<button class="mcq-chip '+(n.r===rs[0]?'on':'')+'" style="padding:4px 10px;font-size:12px" onclick="lrnTag(\''+esc(id)+'\',\''+rs[0]+'\')">'+rs[1]+' '+rs[2]+'</button>'; }).join('')+''+(window.tutorOpen?'<button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="lrnNbTutor(\''+esc(id)+'\')">🎓 Tutor</button>':'')+'<button class="btn btn-ghost btn-sm" onclick="lrnNbDel(\''+esc(id)+'\')">Got it — remove</button></div>','margin-bottom:10px'); }).join(''):note('📓',ids.length?'Nothing in this filter.':'Your notebook is empty. Every question you get wrong in practice lands here automatically.'));
}
window.lrnNbF=function(f){ T.nbf=f; render(); };
window.lrnNbTutor=function(id){ var n=T.D.nb[id]; if(n&&window.tutorOpen) tutorOpen({q:n.q,o:n.o,a:n.a,e:n.e,k:n.k,i:n.i,w:n.w}); };
window.lrnNbDel=function(id){ delete T.D.nb[id]; save(); render(); };
function tabMap(){
  var chs=chapAll(), exams=[]; chs.forEach(function(c){ if(exams.indexOf(c.e)<0) exams.push(c.e); });
  var ord=['NEET','JEE','JEE Advanced']; exams.sort(function(a,b){ return (ord.indexOf(a)<0?9:ord.indexOf(a))-(ord.indexOf(b)<0?9:ord.indexOf(b)); });
  if(exams.indexOf(T.exam)<0) T.exam=exams[0];
  var subs=[]; chs.forEach(function(c){ if(c.e===T.exam&&subs.indexOf(c.s)<0) subs.push(c.s); });
  var legend=[['Not started','var(--paper-2)'],['Started','#dbeafe'],['Needs work','#fecaca'],['Improving','#fde68a'],['Strong','#bbf7d0'],['Mastered','#4ade80']];
  return '<div class="mcq-tabs">'+exams.map(function(e){ return '<button class="mcq-chip '+(e===T.exam?'on':'')+'" onclick="lrnExam(\''+esc(e)+'\')">'+esc(e)+'</button>'; }).join('')+'</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:var(--muted);margin-bottom:14px">'+legend.map(function(l){ return '<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:12px;height:12px;border-radius:3px;background:'+l[1]+';border:1px solid var(--border)"></i>'+l[0]+'</span>'; }).join('')+'<span>· tap a chapter for smart practice</span></div>'+
    subs.map(function(s){ var cs=chs.filter(function(c){ return c.e===T.exam&&c.s===s; }), sc=cs.map(mastery), good=sc.filter(function(m){ return m.lv>=4; }).length;
      return card('<div style="display:flex;justify-content:space-between;margin-bottom:10px"><b style="font-size:15px">'+esc(s)+'</b><span style="font-size:12.5px;color:var(--muted)">'+good+' / '+cs.length+' strong or mastered</span></div>'+
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">'+cs.map(function(c,i){ var m=sc[i];
          return '<div onclick="lrnSmart(\''+esc(c.k)+'\',15)" style="cursor:pointer;padding:9px 10px;border-radius:9px;background:'+m.c+';color:'+m.t+';font-size:12px;line-height:1.35;border:1px solid rgba(0,0,0,.06)"><b style="display:block;margin-bottom:3px">'+esc(c.c)+'</b>'+(m.a?Math.round(m.acc*100)+'% · '+m.a+' tried':m.l)+'</div>'; }).join('')+'</div>'); }).join('');
}
window.lrnExam=function(e){ T.exam=e; render(); };
function tabMock(){
  var D=T.D, P=prem();
  return MOCKS.map(function(m){ return card('<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b style="font-size:15px">'+esc(m.l)+(P?'':' 🔒')+'</b><div style="font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.5">'+esc(m.d)+'</div></div><button class="btn '+(P?'btn-primary':'btn-outline')+' btn-sm" onclick="lrnMock(\''+m.id+'\')">'+(P?'Start mock →':'Premium')+'</button></div>','margin-bottom:10px'); }).join('')+
    (D.mocks.length?card(h3('📈 Your mock history')+'<table class="table-simple"><thead><tr><th>Mock</th><th>Date</th><th>Score</th><th>Accuracy</th></tr></thead><tbody>'+D.mocks.slice(0,10).map(function(x){ return '<tr><td>'+esc(x.l)+'</td><td>'+new Date(x.t).toLocaleDateString('en-IN')+'</td><td><b>'+x.sc+'</b> / '+x.mx+'</td><td>'+x.acc+'%</td></tr>'; }).join('')+'</tbody></table>'):'')+
    '<div style="font-size:12px;color:var(--muted)">Mocks are timed, strictly +4 / −1, and end with coaching insights. Questions are drawn at random from the bank each time.</div>';
}
/* ---- ♾ Infinite numericals ---- */
var GN={subj:'Physics',topics:{},lv:1,n:10};
function tabGen(){
  if(!window.GEN) return note('⚠️','Numerical generator file (gen.js) is not loaded. Upload gen.js and refresh.');
  var subs=GEN.subjects(), tp=GEN.topics(GN.subj), sel=tp.filter(function(t){ return GN.topics[t.id]; }).length;
  return card(h3('♾ Infinite numericals')+'<div style="font-size:13.5px;color:var(--muted);line-height:1.6;margin-bottom:14px">Fresh formula-based questions every time — <b>'+GEN.count+' question types</b>, never the same twice. Each has a full worked solution and every wrong answer comes back in your revision list. Free for everyone.</div>'+
    '<div class="mcq-tabs">'+subs.map(function(s){ return '<button class="mcq-chip '+(GN.subj===s?'on':'')+'" onclick="lrnGn(\'subj\',\''+s+'\')">'+s+'</button>'; }).join('')+'</div>'+
    '<div style="font-size:12px;font-weight:700;color:var(--muted);margin:6px 0 6px">TOPICS <span style="font-weight:400">(none selected = all)</span></div>'+
    '<div class="mcq-tabs">'+tp.map(function(t){ return '<button class="mcq-chip '+(GN.topics[t.id]?'on':'')+'" onclick="lrnGnTopic(\''+t.id+'\')">'+esc(t.t)+'</button>'; }).join('')+'</div>'+
    '<div style="display:flex;gap:22px;flex-wrap:wrap;margin:8px 0 16px"><div><div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px">LEVEL</div><div class="mcq-tabs" style="margin:0">'+GEN.levels.map(function(x,i){ return '<button class="mcq-chip '+(GN.lv===i?'on':'')+'" onclick="lrnGn(\'lv\','+i+')">'+x+'</button>'; }).join('')+'</div></div>'+
      '<div><div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px">QUESTIONS</div><div class="mcq-tabs" style="margin:0">'+[10,20,30].map(function(n){ return '<button class="mcq-chip '+(GN.n===n?'on':'')+'" onclick="lrnGn(\'n\','+n+')">'+n+'</button>'; }).join('')+'</div></div></div>'+
    '<button class="btn btn-primary" onclick="lrnGnStart()">Start '+GN.n+' '+GEN.levels[GN.lv].toLowerCase()+' '+GN.subj+' numericals →</button>');
}
window.lrnGn=function(k,v){ GN[k]=v; if(k==='subj') GN.topics={}; render(); };
window.lrnGnTopic=function(id){ GN.topics[id]=!GN.topics[id]; render(); };
window.lrnGnStart=function(){
  var ids=Object.keys(GN.topics).filter(function(k){ return GN.topics[k]; }), qs=GEN.session(GN.subj,ids,GN.n,GN.lv);
  if(!qs.length){ toast('Could not build questions','⚠️'); return; }
  startSession(qs,'Numericals · '+GN.subj+' · '+GEN.levels[GN.lv],{mode:'learn',timer:false});
};
function tabRwd(){ return window.RWD?RWD.render():note('⚠️','Rewards file (rewards.js) is not loaded. Upload rewards.js and refresh.'); }
LRN.tabs={ready:ready,note:note,card:card,h3:h3,bar:bar,esc:esc};
LRN.data=function(){ return T.D; };
LRN.save=function(){ save(); };
})();
