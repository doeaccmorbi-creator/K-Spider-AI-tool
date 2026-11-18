/* =========================================================================
   Dr. Shreyansh Academy — Live Quiz (quiz.js)
   Kahoot-style class quiz, real-time, free-tier:
     Teacher: builds a quiz (from the bank or pasted), shares a 5-letter code,
              runs it question by question, sees answers arriving live.
     Student: joins with the code, answers against the clock, sees the
              correct answer, points and the leaderboard after every question.
   Answers are NOT sent to students until the teacher reveals them (they live
   in a host-only document), so nobody can peek.  Scores are computed by the
   teacher's screen.  Uses Firestore live listeners; a 30-student quiz of 10
   questions costs roughly 1–2% of a day's free reads.
   ========================================================================= */
(function(){
'use strict';
var Z={f:{ch:{},count:10,secs:20,exam:'',subj:'',src:'bank'},host:null,my:null,busy:false,tick:null};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function me(){ return DB.currentUser; }
function isStaff(){ var u=me(); return !!u&&(u.role==='admin'||(u.role==='faculty'&&u.approved!==false)); }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function shell(a,b){ return '<div class="app-shell">'+sidebar(a)+'<div class="main" style="max-width:860px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:18px 22px;margin-bottom:14px;'+(x||'')+'">'+i+'</div>'; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function lbl(t){ return '<div style="font-size:12px;color:var(--muted);margin:10px 0 4px">'+t+'</div>'; }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t; } return a; }
var COL=['#e11d48','#2563eb','#d97706','#16a34a'], SH=['▲','◆','●','■'];
function points(ok,ms,secs){ if(!ok) return 0; var lim=secs*1000; return Math.round(500+500*(1-Math.min(ms,lim)/lim)); }
window.QZ={points:points};
function firstName(n){ var p=String(n||'Student').trim().split(/\s+/); return p[0]+(p[1]?' '+p[1][0]+'.':''); }
function stopTick(){ if(Z.tick){ clearInterval(Z.tick); Z.tick=null; } }
function unsubAll(o){ if(!o) return; ['u1','u2','u3'].forEach(function(k){ if(o[k]){ try{ o[k](); }catch(e){} o[k]=null; } }); if(o.timer){ clearTimeout(o.timer); o.timer=null; } }
function codeGen(){ var c='ABCDEFGHJKMNPQRSTUVWXYZ23456789',o='',i; for(i=0;i<5;i++) o+=c[Math.floor(Math.random()*c.length)]; return o; }
function podium(scores){ return Object.keys(scores||{}).map(function(u){ return {u:u,n:scores[u].n,s:scores[u].s}; }).sort(function(a,b){ return b.s-a.s; }); }
function board(list,meUid,n){ return list.slice(0,n).map(function(r,i){ return '<div style="display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:9px;margin-bottom:6px;background:'+(r.u===meUid?'var(--gold-100,#fef3c7)':'var(--paper-2)')+'"><b style="width:30px">'+(i<3?['🥇','🥈','🥉'][i]:(i+1))+'</b><span style="flex:1">'+esc(r.n)+(r.u===meUid?' (you)':'')+'</span><b>'+r.s+'</b></div>'; }).join(''); }

/* ========================= HOST (teacher / admin) ========================= */
window.renderLiveQuiz=function(){
  if(!me()) return renderAuth();
  if(!live()) return shell('livequiz',note('⚡','Live Quiz works in live mode. Connect Firebase first.'));
  if(!isStaff()) return shell('livequiz',note('🔒','Only approved teachers and the admin can host a Live Quiz.'));
  var h=Z.host; if(!h) return shell('livequiz',head('🎮 Live Quiz','Host a real-time quiz for your class')+setup());
  var s=h.s||{}, code=h.code, st=s.state||'lobby', pl=h.players||[], qi=s.qi||0;
  var top='<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><span class="pill pill-navy">Code</span><b style="font-size:26px;letter-spacing:6px">'+esc(code)+'</b><span style="color:var(--muted);font-size:13px">'+esc(s.title||'')+' · '+pl.length+' player'+(pl.length===1?'':'s')+'</span><button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="qzEnd()">✕ End & close</button></div>';
  if(st==='lobby') return shell('livequiz',head('🎮 Live Quiz','Students open Live Quiz and enter this code')+card(top+'<div style="font-size:64px;font-weight:800;letter-spacing:12px;text-align:center;margin:10px 0">'+esc(code)+'</div><div style="text-align:center;font-size:14px;color:var(--muted);margin-bottom:12px">'+pl.length+' joined</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">'+pl.map(function(p){ return '<span class="pill pill-green">'+esc(firstName(p.name))+'</span>'; }).join('')+'</div><div style="text-align:center"><button class="btn btn-primary" onclick="qzStart()" '+(pl.length?'':'disabled')+'>▶ Start quiz ('+s.total+' questions)</button></div>'));
  var q=h.keys[qi];
  if(st==='question') return shell('livequiz',head('🎮 Question '+(qi+1)+' of '+s.total,'')+card(top+'<div style="font-size:20px;font-weight:600;line-height:1.45;margin:10px 0 16px">'+esc(q.q)+'</div>'+(window.mcqImg?mcqImg(q):'')+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+q.o.map(function(o,i){ return '<div style="background:'+COL[i]+';color:#fff;padding:14px 16px;border-radius:10px;font-weight:600">'+SH[i]+' '+esc(o)+'</div>'; }).join('')+'</div>'+
    '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div style="font-size:30px;font-weight:800" id="qzT">'+s.secs+'</div><div style="flex:1;min-width:160px"><div id="qzBar" style="height:10px;border-radius:6px;background:var(--navy-600);width:100%"></div></div><span style="font-size:14px"><b id="qzAn">'+(h.ansN||0)+'</b> / '+pl.length+' answered</span><button class="btn btn-gold btn-sm" onclick="qzReveal()">Reveal now</button></div>'));
  if(st==='reveal'){ var dist=s.dist||[0,0,0,0], mx=Math.max.apply(null,dist.concat([1])), sc=podium(s.scores);
    return shell('livequiz',head('🎮 Answer — Question '+(qi+1)+' of '+s.total,'')+card(top+'<div style="font-size:18px;font-weight:600;margin-bottom:12px">'+esc(q.q)+'</div>'+q.o.map(function(o,i){ var ok=i===q.a; return '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><div style="flex:1;padding:10px 14px;border-radius:9px;background:'+(ok?'#16a34a':'var(--paper-2)')+';color:'+(ok?'#fff':'inherit')+';font-weight:'+(ok?700:500)+'">'+SH[i]+' '+esc(o)+(ok?' ✓':'')+'</div><div style="width:150px"><div style="height:12px;border-radius:6px;background:'+COL[i]+';width:'+Math.round(dist[i]*100/mx)+'%;min-width:4px"></div></div><b style="width:28px">'+dist[i]+'</b></div>'; }).join('')+(q.e?'<div class="explain-box" style="margin:10px 0">'+esc(q.e)+'</div>':'')+
      '<h4 style="margin:14px 0 8px">🏆 Leaderboard</h4>'+board(sc,'',5)+'<div style="text-align:center;margin-top:14px"><button class="btn btn-primary" onclick="qzNext()">'+(qi+1<s.total?'Next question →':'Finish quiz 🏁')+'</button></div>')); }
  var sc2=podium(s.scores);
  return shell('livequiz',head('🏁 Quiz finished','')+card(top+'<h3 style="text-align:center;margin:6px 0 14px">Final leaderboard</h3>'+board(sc2,'',10)+'<div style="text-align:center;margin-top:16px"><button class="btn btn-outline" onclick="qzCsv()">⬇ Download results (CSV)</button> <button class="btn btn-primary" onclick="qzEnd()">Close quiz</button></div>'));
};
function setup(){
  var f=Z.f, chs=(window.MCQ&&MCQ.index)?MCQ.index.chapters:[], exams=[],subs=[];
  if(window.MCQ&&!MCQ.index&&!Z.ib){ Z.ib=true; MCQ.loadIndex().then(function(){ Z.ib=false; if(ROUTE.view==='livequiz') render(); }); }
  chs.forEach(function(c){ if(exams.indexOf(c.e)<0) exams.push(c.e); }); if(!f.exam||exams.indexOf(f.exam)<0) f.exam=exams[0]||'';
  chs.forEach(function(c){ if(c.e===f.exam&&subs.indexOf(c.s)<0) subs.push(c.s); }); if(!f.subj||subs.indexOf(f.subj)<0) f.subj=subs[0]||'';
  var list=chs.filter(function(c){ return c.e===f.exam&&c.s===f.subj; }).sort(function(a,b){ return a.c<b.c?-1:1; });
  return card('<div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:200px">'+lbl('Quiz title')+'<input id="qzTitle" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="60" placeholder="e.g. Friday revision quiz"></div>'+
    '<div>'+lbl('Seconds per question')+'<select id="qzSecs" class="mcq-sel">'+[10,15,20,30,45].map(function(n){ return '<option '+(f.secs===n?'selected':'')+'>'+n+'</option>'; }).join('')+'</select></div>'+
    '<div>'+lbl('Questions')+'<select id="qzCount" class="mcq-sel">'+[5,8,10,15,20].map(function(n){ return '<option '+(f.count===n?'selected':'')+'>'+n+'</option>'; }).join('')+'</select></div></div>'+
    '<div class="mcq-tabs" style="margin-top:12px"><button class="mcq-chip '+(f.src==='bank'?'on':'')+'" onclick="qzSrc(\'bank\')">From question bank</button><button class="mcq-chip '+(f.src==='paste'?'on':'')+'" onclick="qzSrc(\'paste\')">Paste my questions</button></div>'+
    (f.src==='bank'?'<div style="display:flex;gap:10px;flex-wrap:wrap"><div><select class="mcq-sel" onchange="qzSel(\'exam\',this.value)">'+exams.map(function(e){ return '<option '+(e===f.exam?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div><div><select class="mcq-sel" onchange="qzSel(\'subj\',this.value)">'+subs.map(function(e){ return '<option '+(e===f.subj?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div></div><div style="max-height:200px;overflow:auto;margin-top:8px">'+list.map(function(c){ return '<div class="mcq-row '+(f.ch[c.k]?'on':'')+'" onclick="qzCh(\''+esc(c.k)+'\')"><input type="checkbox" '+(f.ch[c.k]?'checked':'')+'><span class="nm">'+esc(c.c)+'</span><small>'+c.n+' Q</small></div>'; }).join('')+'</div>'
      :'<textarea id="qzText" rows="9" class="mcq-sel" style="width:100%;font-family:monospace;font-size:12.5px;margin-top:8px" placeholder="Q: What is the SI unit of force?\nA: Joule\nB: Newton\nC: Watt\nD: Pascal\nAns: B\nExp: F = ma\n\n(blank line between questions)"></textarea>')+
    '<button class="btn btn-primary" style="margin-top:14px" onclick="qzCreate()" '+(Z.busy?'disabled':'')+'>'+(Z.busy?'Creating…':'Create quiz →')+'</button>');
}
var KEEP={};
function keep(){ ['qzTitle','qzSecs','qzCount','qzText'].forEach(function(id){ var e=document.getElementById(id); if(e) KEEP[id]=e.value; }); }
function restore(){ Object.keys(KEEP).forEach(function(id){ var e=document.getElementById(id); if(e&&KEEP[id]!==undefined) e.value=KEEP[id]; }); }
window.qzSrc=function(v){ keep(); Z.f.src=v; render(); restore(); };
window.qzSel=function(k,v){ keep(); Z.f[k]=v; Z.f.ch={}; render(); restore(); };
window.qzCh=function(k){ keep(); Z.f.ch[k]=!Z.f.ch[k]; render(); restore(); };
window.qzCreate=async function(){
  var u=me(), f=Z.f, title=val('qzTitle')||'Live Quiz', secs=+val('qzSecs')||20, count=+val('qzCount')||10, qs=[];
  Z.busy=true; keep(); render(); restore();
  try{
    if(f.src==='paste'){ var p=window.QB?QB.parseMany(val('qzText')):{qs:[],errs:['Question helper not loaded']}; if(p.errs.length){ throw new Error(p.errs[0]); } qs=p.qs.map(function(x){ return {q:x.q,o:x.o,a:x.a,e:x.e||'',m:x.img||''}; }); }
    else { var keys=Object.keys(f.ch).filter(function(k){ return f.ch[k]; }); if(!keys.length) throw new Error('Choose at least one chapter'); var pool=[]; for(var i=0;i<keys.length;i++){ pool=pool.concat(await MCQ.loadChapter(keys[i])); } qs=shuffle(pool).slice(0,count).map(function(x){ return {q:x.q,o:x.o,a:x.a,e:x.e||'',m:x.m||''}; }); }
    qs=qs.slice(0,25); if(qs.length<2) throw new Error('A quiz needs at least 2 questions');
    var code='',tries=0; do{ code=codeGen(); var ex=await fbDb.collection('liveQuiz').doc(code).get(); if(!ex.exists) break; }while(++tries<5);
    var s={title:title.slice(0,60),hostUid:u.uid,hostName:u.name||'',state:'lobby',qi:0,total:qs.length,secs:secs,q:null,t0:0,ans:-1,dist:null,ex:'',scores:{},batchId:'',when:ts()};
    await fbDb.collection('liveQuiz').doc(code).set(s); await fbDb.collection('liveQuiz').doc(code).collection('keys').doc('k').set({qs:qs});
    Z.busy=false; hostWatch(code,qs,s); render();
  }catch(e){ Z.busy=false; toast(e.message||'Could not create the quiz','⚠️'); render(); restore(); }
};
function hostWatch(code,qs,s){
  unsubAll(Z.host); var h=Z.host={code:code,keys:qs,s:s,players:[],ansN:0,scores:{},u1:null,u2:null,u3:null,timer:null};
  var ref=fbDb.collection('liveQuiz').doc(code);
  h.u1=ref.collection('players').onSnapshot(function(snap){ h.players=snap.docs.map(function(d){ return {uid:d.id,name:d.data().name}; }); if(ROUTE.view==='livequiz') render(); });
}
function hostAnswersWatch(qi){
  var h=Z.host; if(h.u2){ h.u2(); h.u2=null; } h.ansN=0;
  h.u2=fbDb.collection('liveQuiz').doc(h.code).collection('answers').where('qi','==',qi).onSnapshot(function(snap){ h.ansN=snap.size; var e=document.getElementById('qzAn'); if(e) e.textContent=h.ansN; });
}
function hostSet(patch){ var h=Z.host; Object.assign(h.s,patch); return fbDb.collection('liveQuiz').doc(h.code).update(patch); }
window.qzStart=function(){ openQ(0); };
function openQ(i){
  var h=Z.host, q=h.keys[i]; clearTimeout(h.timer); hostAnswersWatch(i);
  hostSet({state:'question',qi:i,q:{q:q.q,o:q.o,m:q.m||''},t0:Date.now(),ans:-1,dist:null,ex:''}).then(function(){ render(); startTick(h.s.secs); }).catch(function(e){ toast(e.message,'⚠️'); });
  h.timer=setTimeout(function(){ if(h.s.state==='question'&&h.s.qi===i) window.qzReveal(); },(h.s.secs+3)*1000);
}
function startTick(secs){
  stopTick(); var t0=Date.now();
  Z.tick=setInterval(function(){ if(ROUTE.view!=='livequiz'||!Z.host||Z.host.s.state!=='question'){ stopTick(); return; } var left=Math.max(0,secs-(Date.now()-t0)/1000), e=document.getElementById('qzT'), b=document.getElementById('qzBar'); if(e) e.textContent=Math.ceil(left); if(b) b.style.width=Math.round(left*100/secs)+'%'; if(left<=0) stopTick(); },250);
}
window.qzReveal=async function(){
  var h=Z.host; if(!h||h.s.state!=='question') return; stopTick(); clearTimeout(h.timer); var qi=h.s.qi, q=h.keys[qi], secs=h.s.secs;
  try{
    var snap=await fbDb.collection('liveQuiz').doc(h.code).collection('answers').where('qi','==',qi).get(), dist=[0,0,0,0], by={};
    snap.docs.forEach(function(d){ var a=d.data(); by[a.uid]=a; if(a.o>=0&&a.o<4) dist[a.o]++; });
    var scores=Object.assign({},h.s.scores||{});
    h.players.forEach(function(p){ var a=by[p.uid], prev=scores[p.uid]||{n:firstName(p.name),s:0}; var pts=a?points(a.o===q.a,a.ms,secs):0; scores[p.uid]={n:firstName(p.name),s:prev.s+pts,d:pts}; });
    await hostSet({state:'reveal',ans:q.a,dist:dist,ex:q.e||'',scores:scores}); render();
  }catch(e){ toast(e.message||'Could not reveal','⚠️'); }
};
window.qzNext=function(){ var h=Z.host; if(h.s.qi+1<h.s.total) openQ(h.s.qi+1); else { stopTick(); hostSet({state:'ended',q:null}).then(render); } };
window.qzCsv=function(){ var h=Z.host, sc=podium(h.s.scores), t=[['Rank','Name','Points']].concat(sc.map(function(r,i){ return [i+1,r.n,r.s]; })).map(function(r){ return r.map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n'); var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'})); a.download='quiz-'+h.code+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
window.qzEnd=function(){
  var h=Z.host; if(!h) return; if(h.s.state!=='ended'&&!confirm('End this quiz for everyone?')) return; stopTick(); unsubAll(h);
  var ref=fbDb.collection('liveQuiz').doc(h.code); ref.collection('keys').doc('k').delete().catch(function(){}); ref.update({state:'ended',q:null}).catch(function(){}); Z.host=null; toast('Quiz closed'); render();
};

/* ============================ STUDENT ===================================== */
window.renderQuizJoin=function(){
  if(!me()) return renderAuth();
  if(!live()) return shell('quizjoin',note('⚡','Live Quiz works in live mode. Connect Firebase first.'));
  var m=Z.my; if(!m) return shell('quizjoin',head('🎮 Live Quiz','Join your teacher\'s quiz')+card('<div style="text-align:center"><div style="font-size:15px;margin-bottom:12px">Enter the code shown on the teacher\'s screen</div><input id="qzCode" class="mcq-sel" maxlength="5" style="font-size:28px;letter-spacing:8px;text-align:center;width:220px;padding:12px;text-transform:uppercase" placeholder="ABCDE"><div style="margin-top:14px"><button class="btn btn-primary" onclick="qzJoin()">Join →</button></div></div>'));
  var s=m.s||{}, st=s.state||'lobby', uid=me().uid;
  var bar='<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted);margin-bottom:10px"><span>🎮 '+esc(s.title||'Live Quiz')+'</span><button class="btn btn-ghost btn-sm" onclick="qzLeave()">Leave</button></div>';
  if(st==='lobby') return shell('quizjoin',card(bar+'<div style="text-align:center;padding:30px 10px"><div style="font-size:44px">⏳</div><h3>You\'re in, '+esc(firstName(me().name))+'!</h3><div style="color:var(--muted);font-size:14px">Waiting for the teacher to start…</div></div>'));
  if(st==='question'){ var q=s.q||{o:[]}, mine=m.picked[s.qi], left=m.left; 
    return shell('quizjoin',card(bar+'<div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>Question '+(s.qi+1)+' / '+s.total+'</b><b id="qzT" style="font-size:22px">'+Math.ceil(left)+'</b></div><div style="height:8px;border-radius:5px;background:var(--paper-2);margin-bottom:14px"><div id="qzBar" style="height:100%;border-radius:5px;background:var(--navy-600);width:'+Math.round(left*100/s.secs)+'%"></div></div><div style="font-size:19px;font-weight:600;line-height:1.45;margin-bottom:14px">'+esc(q.q)+'</div>'+(window.mcqImg?mcqImg(q):'')+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+q.o.map(function(o,i){ var dis=mine!==undefined||left<=0; return '<button onclick="qzAnswer('+i+')" '+(dis?'disabled':'')+' style="background:'+COL[i]+';color:#fff;border:0;padding:18px 12px;border-radius:12px;font-size:15px;font-weight:600;opacity:'+(mine!==undefined&&mine!==i?0.35:1)+';outline:'+(mine===i?'4px solid #111':'none')+'">'+SH[i]+' '+esc(o)+'</button>'; }).join('')+'</div>'+
      (mine!==undefined?'<div style="text-align:center;margin-top:14px;color:var(--muted)">Answer locked ✓ — waiting for others…</div>':(left<=0?'<div style="text-align:center;margin-top:14px;color:var(--red-600)">Time is up</div>':''))));
  }
  var sc=podium(s.scores), my=(s.scores||{})[uid]||{s:0,d:0}, rank=sc.findIndex(function(r){ return r.u===uid; })+1;
  if(st==='reveal'){ var picked=m.picked[s.qi], ok=picked===s.ans;
    return shell('quizjoin',card(bar+'<div style="text-align:center;padding:14px"><div style="font-size:54px">'+(picked===undefined?'⏰':(ok?'✅':'❌'))+'</div><h2 style="margin:6px 0">'+(picked===undefined?'No answer':(ok?'Correct!':'Not quite'))+'</h2><div style="font-size:15px">+<b>'+(my.d||0)+'</b> points · total <b>'+my.s+'</b> · rank <b>#'+(rank||'–')+'</b> of '+sc.length+'</div></div>'+
      (s.ex?'<div class="explain-box" style="margin:6px 0 14px">'+esc(s.ex)+'</div>':'')+'<h4 style="margin:10px 0 8px">🏆 Top 5</h4>'+board(sc,uid,5)+'<div style="text-align:center;color:var(--muted);font-size:13px;margin-top:10px">Next question coming up…</div>'));
  }
  return shell('quizjoin',card(bar+'<div style="text-align:center;padding:10px"><div style="font-size:54px">'+(rank===1?'🏆':(rank<=3?'🎉':'🏁'))+'</div><h2>Quiz finished</h2><div style="font-size:16px;margin:6px 0 16px">You scored <b>'+my.s+'</b> points · rank <b>#'+(rank||'–')+'</b> of '+sc.length+'</div></div>'+board(sc,uid,10)+'<div style="text-align:center;margin-top:14px"><button class="btn btn-primary" onclick="qzLeave()">Done</button></div>'));
};
window.qzJoin=async function(){
  var code=val('qzCode').toUpperCase(), u=me(); if(code.length<4){ toast('Enter the code from your teacher','⚠️'); return; }
  try{
    var ref=fbDb.collection('liveQuiz').doc(code), d=await ref.get(); if(!d.exists){ toast('Quiz not found — check the code','⚠️'); return; } if(d.data().state==='ended'){ toast('This quiz has already ended','⚠️'); return; }
    await ref.collection('players').doc(u.uid).set({name:u.name||'Student',when:ts()}).catch(function(e){ if(!/permission/i.test(e.message||'')) throw e; });
    var m=Z.my={code:code,s:d.data(),picked:{},left:0,seen:-1,rec:0,u1:null};
    m.u1=ref.onSnapshot(function(snap){ if(!snap.exists) return; var s=snap.data(), prevQ=m.seen; m.s=s;
      if(s.state==='question'&&s.qi!==m.seen){ m.seen=s.qi; m.rec=Date.now(); m.left=s.secs; startStudentTick(); }
      if(s.state==='ended'&&!m.xp){ m.xp=true; var rk=podium(s.scores).findIndex(function(r){ return r.u===u.uid; })+1; if(window.RWD&&RWD.addXP) RWD.addXP(20+(rk>=1&&rk<=3?30:0),'Live quiz'); }
      if(ROUTE.view==='quizjoin') render(); });
    toast('Joined ✅'); render();
  }catch(e){ toast(e.message||'Could not join','⚠️'); }
};
function startStudentTick(){
  stopTick(); var m=Z.my;
  Z.tick=setInterval(function(){ if(!Z.my||ROUTE.view!=='quizjoin'||Z.my.s.state!=='question'){ stopTick(); return; } var left=Math.max(0,Z.my.s.secs-(Date.now()-Z.my.rec)/1000); Z.my.left=left; var e=document.getElementById('qzT'), b=document.getElementById('qzBar'); if(e) e.textContent=Math.ceil(left); if(b) b.style.width=Math.round(left*100/Z.my.s.secs)+'%'; if(left<=0){ stopTick(); render(); } },250);
}
window.qzAnswer=function(i){
  var m=Z.my, u=me(); if(!m||m.picked[m.s.qi]!==undefined||m.left<=0) return; var qi=m.s.qi, ms=Date.now()-m.rec; m.picked[qi]=i; render();
  fbDb.collection('liveQuiz').doc(m.code).collection('answers').doc(qi+'_'+u.uid).set({qi:qi,uid:u.uid,name:u.name||'',o:i,ms:ms,when:ts()}).catch(function(){ toast('Could not send your answer','⚠️'); });
};
window.qzLeave=function(){ var m=Z.my; stopTick(); if(m&&m.u1){ try{ m.u1(); }catch(e){} } Z.my=null; render(); };
var _go=window.go; window.go=function(v,p){ if(ROUTE&&ROUTE.view==='quizjoin'&&v!=='quizjoin'&&Z.my){ stopTick(); if(Z.my.u1){ try{ Z.my.u1(); }catch(e){} } Z.my=null; } return _go(v,p); };
})();
