/* =========================================================================
   Dr. Shreyansh Academy — Batches & Teacher Analytics (batches.js)
   Batches: Class 11 / 12 / Dropper / morning / evening… Students join with a
   short code (no admin work); timetable, tests and attendance can target a
   batch. Teacher Analytics turns existing data into decisions: who is at
   risk, which chapters to re-teach, and which test questions failed.
   Free-tier friendly: everything is cached for 5 minutes.
   ========================================================================= */
(function(){
'use strict';
var B={list:null,busy:false,open:'',st:null,stb:false,ta:null,tab:false,sel:'',test:''};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function me(){ return DB.currentUser; }
function isStaff(){ var u=me(); return !!u&&(u.role==='admin'||(u.role==='faculty'&&u.approved!==false)); }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function shell(a,b){ return '<div class="app-shell">'+sidebar(a)+'<div class="main" style="max-width:1000px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(x||'')+'">'+i+'</div>'; }
function h3(t){ return '<h3 style="font-size:15px;margin:0 0 12px">'+t+'</h3>'; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function daysSince(ds){ if(!ds) return 999; return Math.floor((new Date(today()+'T00:00:00')-new Date(ds+'T00:00:00'))/864e5); }
function csv(name,rows){ var t=rows.map(function(r){ return r.map(function(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n'); var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8;'})); a.download=name+'-'+today()+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast('Exported ✅'); }

/* ---------- shared helper used by timetable / tests / attendance ---------- */
var BT=window.BT={
  list:function(){ return B.list||[]; },
  ensure:function(){ if(B.list||B.busy||!live()) return; B.busy=true;
    fbDb.collection('batches').orderBy('when','desc').limit(60).get().then(function(s){ B.list=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); })
      .catch(function(){ B.list=[]; }).then(function(){ B.busy=false; render(); }); },
  select:function(id,sel,allLabel){ return '<select id="'+id+'" class="mcq-sel"><option value="">'+esc(allLabel||'All batches')+'</option>'+(B.list||[]).map(function(b){ return '<option value="'+esc(b.id)+'" '+(sel===b.id?'selected':'')+'>'+esc(b.name)+'</option>'; }).join('')+'</select>'; },
  name:function(id){ var b=(B.list||[]).filter(function(x){ return x.id===id; })[0]; return b?b.name:''; },
  mine:function(item){ var u=me(); return !item.batchId||u.role!=='student'||item.batchId===u.batchId; }
};

/* ---------- Batches page ---------- */
function loadStudents(cb){ if(B.st){ cb&&cb(); return; } if(B.stb) return; B.stb=true; loadAllStudents().then(function(s){ B.st=s; B.stb=false; cb&&cb(); render(); }); }
function code(){ var c='ABCDEFGHJKMNPQRSTUVWXYZ23456789',o='',i; for(i=0;i<6;i++) o+=c[Math.floor(Math.random()*c.length)]; return o; }
window.renderBatches=function(){
  if(!me()) return renderAuth();
  if(!live()) return shell('batches',note('⚡','Batches work in live mode. Connect Firebase first.'));
  BT.ensure(); if(!B.list) return shell('batches',head('🎓 Batches','')+note('⏳','Loading…'));
  var u=me();
  if(!isStaff()){
    var mine=B.list.filter(function(b){ return b.id===u.batchId; })[0];
    return shell('batches',head('🎓 My Batch','Join your class batch to get its timetable, tests and league')+
      (u.batchId?card('<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div style="font-size:34px">🎓</div><div style="flex:1;min-width:180px"><b style="font-size:17px">'+esc(u.batchName||(mine&&mine.name)||'Your batch')+'</b>'+(mine?'<div style="font-size:13px;color:var(--muted)">'+esc(mine.cls||'')+(mine.exam?' · '+esc(mine.exam):'')+(mine.time?' · '+esc(mine.time):'')+'</div>':'')+'</div><button class="btn btn-outline btn-sm" onclick="btLeave()">Leave batch</button></div>')
        :card(h3('Join a batch')+'<div style="font-size:13.5px;color:var(--muted);margin-bottom:10px">Ask your teacher for the 6-letter batch code.</div><div style="display:flex;gap:8px"><input id="btCode" class="mcq-sel" style="padding:10px 12px;text-transform:uppercase;letter-spacing:3px;width:160px" maxlength="6" placeholder="ABC123"><button class="btn btn-primary" onclick="btJoin()">Join</button></div>')));
  }
  loadStudents();
  return shell('batches',head('🎓 Batches','Create batches and share the code — students join themselves')+
    card(h3('➕ Create a batch')+'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end"><div style="flex:1;min-width:180px"><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Batch name</div><input id="bcName" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="50" placeholder="e.g. NEET 2027 · Morning"></div>'+
      '<div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Class</div><select id="bcCls" class="mcq-sel"><option>Class 11</option><option>Class 12</option><option>Dropper</option><option>Other</option></select></div>'+
      '<div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Exam</div><select id="bcExam" class="mcq-sel"><option>NEET</option><option>JEE</option><option>NEET + JEE</option><option>Boards / GUJCET</option></select></div>'+
      '<div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Timing (optional)</div><input id="bcTime" class="mcq-sel" style="padding:9px 11px;width:150px" maxlength="30" placeholder="7–9 AM"></div>'+
      '<button class="btn btn-primary btn-sm" onclick="btCreate()">Create</button></div>')+
    (B.list.length?B.list.map(function(b){
      var mem=(B.st||[]).filter(function(s){ return s.batchId===b.id; }), canDel=u.role==='admin'||b.byUid===u.uid, open=B.open===b.id;
      var wa='https://wa.me/?text='+encodeURIComponent('Join our batch "'+b.name+'" on the Dr. Shreyansh Academy app: open Batches → enter code '+b.code);
      return card('<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b style="font-size:15px">'+esc(b.name)+'</b><div style="font-size:12.5px;color:var(--muted)">'+esc(b.cls||'')+(b.exam?' · '+esc(b.exam):'')+(b.time?' · '+esc(b.time):'')+' · '+mem.length+' student'+(mem.length===1?'':'s')+'</div></div>'+
        '<span class="pill pill-gold" style="font-size:15px;letter-spacing:3px;padding:6px 12px">'+esc(b.code)+'</span><a class="btn btn-green btn-sm" target="_blank" rel="noopener" href="'+esc(wa)+'">Share on WhatsApp</a>'+
        '<button class="btn btn-outline btn-sm" onclick="btOpen(\''+b.id+'\')">'+(open?'Hide':'Members')+'</button>'+(canDel?'<button class="btn btn-ghost btn-sm" onclick="btDel(\''+b.id+'\')">Delete</button>':'')+'</div>'+
        (open?(mem.length?'<table class="table-simple" style="margin-top:12px"><thead><tr><th>Student</th><th>Qs (7d)</th><th>Accuracy</th><th>Last active</th></tr></thead><tbody>'+mem.map(function(s){ var m=s.mcqSummary||{}; return '<tr><td>'+esc(s.name||s.email)+'</td><td>'+(m.n7||0)+'</td><td>'+(m.a?pct(m.c,m.a)+'%':'—')+'</td><td>'+esc(m.last||'—')+'</td></tr>'; }).join('')+'</tbody></table>':'<div style="margin-top:12px;font-size:13px;color:var(--muted)">No students have joined yet.</div>'):''),'margin-bottom:10px'); }).join(''):note('🎓','No batches yet — create your first one above.')));
};
window.btOpen=function(id){ B.open=B.open===id?'':id; render(); };
window.btCreate=function(){
  var n=val('bcName'), u=me(); if(!n){ toast('Give the batch a name','⚠️'); return; }
  fbDb.collection('batches').add({name:n.slice(0,50),cls:val('bcCls'),exam:val('bcExam'),time:val('bcTime').slice(0,30),code:code(),by:u.name||'',byUid:u.uid,when:ts()})
    .then(function(){ B.list=null; toast('Batch created ✅'); render(); }).catch(function(e){ toast(e.message,'⚠️'); });
};
window.btDel=function(id){ if(!confirm('Delete this batch? Students stay, but lose the batch link.')) return; fbDb.collection('batches').doc(id).delete().then(function(){ B.list=null; toast('Deleted'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
window.btJoin=function(){
  var c=val('btCode').toUpperCase(), u=me(); if(c.length!==6){ toast('Enter the 6-letter code','⚠️'); return; }
  fbDb.collection('batches').where('code','==',c).limit(1).get().then(function(s){
    if(s.empty){ toast('Code not found — check with your teacher','⚠️'); return; }
    var b=s.docs[0]; return fbDb.collection('users').doc(u.uid).update({batchId:b.id,batchName:b.data().name}).then(function(){ u.batchId=b.id; u.batchName=b.data().name; toast('Joined '+b.data().name+' ✅'); render(); });
  }).catch(function(e){ toast(e.message||'Could not join','⚠️'); });
};
window.btLeave=function(){ var u=me(); if(!confirm('Leave this batch?')) return; fbDb.collection('users').doc(u.uid).update({batchId:'',batchName:''}).then(function(){ u.batchId=''; u.batchName=''; toast('Left the batch'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };

/* ---------- Teacher analytics ---------- */
function loadTA(){
  if(B.tab) return; B.tab=true; var u=me();
  var tq=u.role==='admin'?fbDb.collection('facultyTests').orderBy('when','desc').limit(30):fbDb.collection('facultyTests').where('byUid','==',u.uid).limit(30);
  Promise.all([loadAllStudents(),
    fbDb.collection('attendance').orderBy('date','desc').limit(3000).get().then(function(s){ return s.docs.map(function(d){ return d.data(); }); }).catch(function(){ return []; }),
    fbDb.collection('classTestResults').limit(2000).get().then(function(s){ return s.docs.map(function(d){ return d.data(); }); }).catch(function(){ return []; }),
    tq.get().then(function(s){ return s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); }).catch(function(){ return []; })])
  .then(function(a){ B.ta={st:a[0],att:a[1],res:a[2],tests:a[3],t:Date.now()}; B.tab=false; render(); });
}
function analyse(){
  var T=B.ta, st=T.st.filter(function(s){ return !s.banned&&(!B.sel||s.batchId===B.sel); }), attBy={}, resBy={};
  T.att.forEach(function(r){ var a=attBy[r.email]=attBy[r.email]||{p:0,t:0}; a.t++; if(r.status==='P') a.p++; });
  T.res.forEach(function(r){ var a=resBy[r.email]=resBy[r.email]||{s:0,n:0}; a.s+=pct(r.score,r.max); a.n++; });
  var rows=st.map(function(s){ var m=s.mcqSummary||{}, at=attBy[s.email], rs=resBy[s.email], fl=[];
    var attP=at&&at.t>=3?pct(at.p,at.t):null, tAvg=rs?Math.round(rs.s/rs.n):null, acc=m.a>=20?pct(m.c,m.a):null, idle=daysSince(m.last);
    if(idle>=7) fl.push('Inactive '+(idle>=999?'(never practised)':idle+'d')); if(attP!==null&&attP<75) fl.push('Attendance '+attP+'%'); if(tAvg!==null&&tAvg<40) fl.push('Tests avg '+tAvg+'%'); if(acc!==null&&acc<40) fl.push('MCQ accuracy '+acc+'%');
    return {s:s,n:s.name||s.email,e:s.email,b:s.batchName||'',att:attP,tAvg:tAvg,acc:acc,n7:m.n7||0,last:m.last||'',fl:fl,weak:m.weak||[]}; });
  return rows;
}
window.renderTAnalytics=function(){
  var v=ROUTE.view; if(!me()) return renderAuth();
  if(!live()) return shell(v,note('⚡','Analytics work in live mode.'));
  if(!isStaff()) return shell(v,note('🔒','Only teachers and admins can open Teacher Analytics.'));
  BT.ensure();
  if(!B.ta||Date.now()-B.ta.t>300000){ loadTA(); if(!B.ta) return shell(v,head('📊 Teacher Analytics','')+note('⏳','Crunching your class data…')); }
  var rows=analyse(), T=B.ta, risk=rows.filter(function(r){ return r.fl.length; }).sort(function(a,b){ return b.fl.length-a.fl.length; });
  var act=rows.filter(function(r){ return r.n7>0; }).length, attV=rows.filter(function(r){ return r.att!==null; }), tv=rows.filter(function(r){ return r.tAvg!==null; }), av=rows.filter(function(r){ return r.acc!==null; });
  var avg=function(a,k){ return a.length?Math.round(a.reduce(function(s,r){ return s+r[k]; },0)/a.length):null; };
  var wk={}; rows.forEach(function(r){ r.weak.forEach(function(w){ wk[w]=(wk[w]||0)+1; }); }); var wkl=Object.keys(wk).sort(function(a,b){ return wk[b]-wk[a]; }).slice(0,8);
  var test=T.tests.filter(function(t){ return t.id===B.test; })[0]||T.tests[0];
  return shell(v,head('📊 Teacher Analytics','Spot who needs help and what to re-teach')+
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px"><span style="font-size:13px;color:var(--muted)">Batch:</span>'+BT.select('taBatch',B.sel).replace('<select','<select onchange="taPick(this.value)"')+'<button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="taCsv()">⬇ Export CSV</button><button class="btn btn-ghost btn-sm" onclick="taRefresh()">↻ Refresh</button></div>'+
    '<div class="stat-row"><div class="card stat-box"><b>'+rows.length+'</b><span>Students</span></div><div class="card stat-box"><b>'+pct(act,rows.length)+'%</b><span>Practised in 7 days</span></div><div class="card stat-box"><b>'+(avg(attV,'att')===null?'—':avg(attV,'att')+'%')+'</b><span>Avg attendance</span></div><div class="card stat-box"><b>'+(avg(tv,'tAvg')===null?'—':avg(tv,'tAvg')+'%')+'</b><span>Class-test average</span></div><div class="card stat-box"><b>'+(avg(av,'acc')===null?'—':avg(av,'acc')+'%')+'</b><span>MCQ accuracy</span></div></div>'+
    card(h3('⚠️ Students who need attention ('+risk.length+')')+(risk.length?'<div style="max-height:360px;overflow:auto"><table class="table-simple"><thead><tr><th>Student</th><th>Batch</th><th>Why</th></tr></thead><tbody>'+risk.map(function(r){ return '<tr><td>'+esc(r.n)+'</td><td>'+esc(r.b||'—')+'</td><td>'+r.fl.map(function(f){ return '<span class="pill pill-red" style="margin:1px">'+esc(f)+'</span>'; }).join(' ')+'</td></tr>'; }).join('')+'</tbody></table></div>':'<div style="font-size:13px;color:var(--green-700)">🎉 Nobody is flagged — attendance, practice and tests all look healthy.</div>'))+
    card(h3('🔥 Chapters to re-teach (weakest across students)')+(wkl.length?wkl.map(function(w){ return '<div style="display:flex;gap:10px;align-items:center;font-size:13.5px;margin-bottom:6px"><span style="flex:1">'+esc(w)+'</span><div style="width:140px;height:8px;background:var(--paper-2);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:'+pct(wk[w],rows.length)+'%;background:var(--red-500)"></i></div><b style="width:90px;text-align:right">'+wk[w]+' student'+(wk[w]>1?'s':'')+'</b></div>'; }).join(''):'<div style="font-size:13px;color:var(--muted)">Appears once students practise 5+ questions per chapter.</div>'))+
    card(h3('🧪 Class-test item analysis')+(T.tests.length?'<select class="mcq-sel" style="margin-bottom:12px" onchange="taTest(this.value)">'+T.tests.map(function(t){ return '<option value="'+t.id+'" '+(test&&test.id===t.id?'selected':'')+'>'+esc(t.title)+'</option>'; }).join('')+'</select>'+itemTable(test,T):'<div style="font-size:13px;color:var(--muted)">Create a class test and the question-by-question analysis appears here.</div>')));
};
function itemTable(t,T){
  if(!t) return ''; var rs=T.res.filter(function(r){ return r.testId===t.id; });
  if(!rs.length) return '<div style="font-size:13px;color:var(--muted)">No student has attempted this test yet.</div>';
  var withAns=rs.filter(function(r){ return r.ans&&r.ans.length===t.qs.length; });
  if(!withAns.length) return '<div style="font-size:13px;color:var(--muted)">'+rs.length+' attempt'+(rs.length>1?'s':'')+' — question-level data is recorded for new attempts only.</div>';
  var rows=t.qs.map(function(q,i){ var cnt=[0,0,0,0],sk=0; withAns.forEach(function(r){ var a=r.ans[i]; if(a===null||a===undefined||a<0) sk++; else cnt[a]++; });
    var n=withAns.length, okp=pct(cnt[q.a],n), wrongBest=-1,max=0; cnt.forEach(function(c,k){ if(k!==q.a&&c>max){ max=c; wrongBest=k; } }); return {i:i,q:q,p:okp,skip:pct(sk,n),wb:wrongBest,wbp:pct(max,n)}; });
  return '<div style="font-size:12.5px;color:var(--muted);margin-bottom:8px">'+withAns.length+' attempts analysed · hardest questions first</div><div style="max-height:380px;overflow:auto"><table class="table-simple"><thead><tr><th>Q</th><th>Question</th><th>Correct</th><th>Most chosen wrong</th></tr></thead><tbody>'+rows.sort(function(a,b){ return a.p-b.p; }).map(function(r){
    return '<tr><td>'+(r.i+1)+'</td><td>'+esc(String(r.q.q).slice(0,90))+'</td><td><span class="pill '+(r.p<40?'pill-red':(r.p<70?'pill-gold':'pill-green'))+'">'+r.p+'%</span>'+(r.p<40?' <b style="color:var(--red-600);font-size:12px">Re-teach</b>':'')+'</td><td>'+(r.wb>=0&&r.wbp>0?String.fromCharCode(65+r.wb)+' ('+r.wbp+'%)':'—')+'</td></tr>'; }).join('')+'</tbody></table></div>';
}
window.taPick=function(v){ B.sel=v; render(); };
window.taTest=function(v){ B.test=v; render(); };
window.taRefresh=function(){ B.ta=null; render(); };
window.taCsv=function(){ if(!B.ta) return; csv('class-analytics',[['Name','Email','Batch','Attendance %','Class-test avg %','MCQ accuracy %','Qs (7d)','Last practice','Flags']].concat(analyse().map(function(r){ return [r.n,r.e,r.b,r.att===null?'':r.att,r.tAvg===null?'':r.tAvg,r.acc===null?'':r.acc,r.n7,r.last,r.fl.join('; ')]; }))); };

var _go=window.go; window.go=function(v,p){ if(v==='batches'){ B.list=null; B.st=null; } if(v==='tanalytics'||v==='admintanalytics'){ B.ta=null; } return _go(v,p); };
})();
