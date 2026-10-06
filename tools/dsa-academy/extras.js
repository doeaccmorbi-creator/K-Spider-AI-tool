/* =========================================================================
   Dr. Shreyansh Academy — Extras (extras.js)
   Adds NEW screens for every role. Existing screens are not modified.
     Student : 🎯 Study Planner (goal, exam countdown, daily target, planner,
               focus timer, weekly activity, weekly top practisers)
     Parent  : 📄 Weekly Report (tests + MCQ practice + fees, alerts, share)
     Faculty : 🔎 Class Insights (doubt hot-spots, student activity, export)
     Admin   : 📚 MCQ Insights (usage, retention, reported questions, export)
     Everyone: 🔔 Notice Board (all announcements, admin can post/delete)
   ========================================================================= */
(function(){
'use strict';
var X={notices:null,noticeAt:0,lb:null,pomo:{mode:'focus',left:1500,run:false,tid:null},pr:null,fi:null,am:null};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function again(view){ if(ROUTE.view===view) render(); }
function shell(active,body){ return '<div class="app-shell">'+sidebar(active)+'<div class="main" style="max-width:980px">'+body+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,msg){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+msg+'</div></div>'; }
function bar(p,col){ return '<div style="height:8px;border-radius:5px;background:var(--paper-2);overflow:hidden"><i style="display:block;height:100%;width:'+Math.min(100,p)+'%;background:'+(col||'var(--green-500)')+'"></i></div>'; }
function card(inner,extra){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(extra||'')+'">'+inner+'</div>'; }
function h3(t){ return '<h3 style="font-size:15px;margin:0 0 12px">'+t+'</h3>'; }
function daysSince(ds){ if(!ds) return 999; return Math.floor((new Date(today()+'T00:00:00')-new Date(ds+'T00:00:00'))/864e5); }
function csv(name,rows){
  var t=rows.map(function(r){ return r.map(function(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8;'}));
  a.download=name+'-'+today()+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast('Exported ✅');
}
function firstName(n){ var p=String(n||'Student').trim().split(/\s+/); return p[0]+(p[1]?' '+p[1][0]+'.':''); }
function reqLive(view,sb){ return !live()?shell(sb,note('⚡','This feature works in live mode. Connect Firebase first.')):null; }

/* ============================ NOTICE BOARD (all roles) ==================== */
window.renderNotices=function(){
  if(!DB.currentUser) return renderAuth();
  var bad=reqLive('notices','notices'); if(bad) return bad;
  if(!X.notices || Date.now()-X.noticeAt>60000){
    if(!X.nbusy){ X.nbusy=true;
      fbDb.collection('announcements').orderBy('when','desc').limit(30).get()
        .then(function(s){ X.notices=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); })
        .catch(function(){ X.notices=X.notices||[]; })
        .then(function(){ X.nbusy=false; X.noticeAt=Date.now(); again('notices'); });
    }
    if(!X.notices) return shell('notices',head('🔔 Notice Board','Announcements from the academy')+note('⏳','Loading…'));
  }
  var adm=DB.currentUser.role==='admin';
  return shell('notices',head('🔔 Notice Board','Every announcement from the academy, newest first')+
    (adm?card('<b style="font-size:14px">Post a new announcement</b><div style="display:flex;gap:8px;margin-top:10px"><input id="xNoticeIn" placeholder="Type announcement for everyone…" style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:14px"><button class="btn btn-primary btn-sm" onclick="xNoticePost()">Post</button></div>'):'')+
    (X.notices.length?X.notices.map(function(a,i){
      return '<div class="card" style="padding:14px 18px;margin-bottom:10px;border-left:4px solid '+(i===0?'var(--gold-500)':'var(--navy-700)')+'"><div style="font-size:14px;line-height:1.55">'+esc(a.message)+'</div><div style="font-size:12px;color:var(--muted);margin-top:6px;display:flex;gap:10px;align-items:center">'+esc(formatWhen(a.when))+(a.by?' · '+esc(a.by):'')+(adm?'<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="xNoticeDel(\''+a.id+'\')">Delete</button>':'')+'</div></div>';
    }).join(''):note('📭','No announcements yet.')));
};
window.xNoticePost=function(){
  var el=document.getElementById('xNoticeIn'), t=el&&el.value.trim(); if(!t){ toast('Type a message first','⚠️'); return; }
  fbDb.collection('announcements').add({message:t,when:firebase.firestore.FieldValue.serverTimestamp(),by:DB.currentUser.name})
    .then(function(){ toast('Posted to everyone ✅'); DB._latestAnnouncement=undefined; X.notices=null; render(); }).catch(function(e){ toast(e.message,'⚠️'); });
};
window.xNoticeDel=function(id){
  if(!confirm('Delete this announcement for everyone?')) return;
  fbDb.collection('announcements').doc(id).delete().then(function(){ toast('Deleted'); DB._latestAnnouncement=undefined; X.notices=null; render(); }).catch(function(e){ toast(e.message,'⚠️'); });
};

/* ============================ STUDENT: STUDY PLANNER ====================== */
function ringBar(label,done,goal){ var p=pct(done,goal); return '<div style="font-size:13px;margin-bottom:6px;display:flex;justify-content:space-between"><b>'+label+'</b><span>'+done+' / '+goal+'</span></div>'+bar(p,p>=100?'var(--green-500)':'var(--gold-500)'); }
function mmss(s){ s=Math.max(0,s); return pad(Math.floor(s/60))+':'+pad(s%60); }
window.renderStudyHub=function(){
  if(!DB.currentUser) return renderAuth();
  var bad=reqLive('studyhub','studyhub'); if(bad) return bad;
  if(!window.MCQ) return shell('studyhub',note('⚠️','Practice module not loaded. Refresh the page.'));
  var P=MCQ.prog;
  if(!P){ MCQ.loadProg().then(function(){ again('studyhub'); }); return shell('studyhub',head('🎯 Study Planner','Goals, daily target and focus timer')+note('⏳','Loading…')); }
  var g=P.goal||{}, daily=g.daily||30, tn=(P.days&&P.days[today()])||0, st=P.streak||{}, streak=(st.last===today()||daysSince(st.last)===1)?st.n:0;
  var left=null; if(g.date){ left=Math.ceil((new Date(g.date+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5); }
  var week=[],i,mx=1; for(i=6;i>=0;i--){ var d=new Date(Date.now()-i*864e5), n=(P.days&&P.days[ymd(d)])||0; mx=Math.max(mx,n); week.push({l:d.toLocaleDateString('en-IN',{weekday:'short'}),n:n}); }
  var tot=0,cor=0; Object.keys(P.ch||{}).forEach(function(k){ tot+=P.ch[k].a; cor+=P.ch[k].c; });
  var todo=P.todo||[], pomoN=+(localStorage.getItem('dsa_pomo_'+today())||0), pm=X.pomo;
  var needPerDay=(left!==null&&left>0&&g.target)?Math.ceil(g.target/left):null;
  return shell('studyhub',head('🎯 Study Planner','Set your goal, hit your daily target and stay consistent')+
  '<div class="stat-row">'+
    '<div class="card stat-box"><b>🔥 '+streak+'</b><span>Day streak</span></div>'+
    '<div class="card stat-box"><b>'+tn+' / '+daily+'</b><span>Questions today</span></div>'+
    '<div class="card stat-box"><b>'+(left===null?'—':(left>0?left:(left===0?'Today!':'Done')))+'</b><span>'+(g.exam?esc(g.exam)+' · days left':'Days to exam')+'</span></div>'+
    '<div class="card stat-box"><b>'+pct(cor,tot)+'%</b><span>MCQ accuracy ('+tot+')</span></div></div>'+
  card(ringBar('Today\'s goal',tn,daily)+(tn>=daily?'<div style="margin-top:8px;font-size:13px;color:var(--green-700);font-weight:600">🎉 Daily goal complete — great job!</div>':'<div style="margin-top:8px;font-size:12.5px;color:var(--muted)">'+(daily-tn)+' more questions to reach today\'s goal. <a href="#" onclick="go(\'mcq\');return false" style="color:var(--navy-700);font-weight:600">Practice now →</a></div>'))+
  card(h3('📅 My exam goal')+'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">'+
    '<div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Exam</div><select id="xGoalExam" class="mcq-sel">'+['NEET','JEE Main','JEE Advanced','Class test / School exam'].map(function(e){ return '<option '+(g.exam===e?'selected':'')+'>'+e+'</option>'; }).join('')+'</select></div>'+
    '<div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Exam date</div><input id="xGoalDate" type="date" class="mcq-sel" value="'+esc(g.date||'')+'"></div>'+
    '<div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Daily question goal</div><select id="xGoalDaily" class="mcq-sel">'+[10,20,30,50,75,100].map(function(n){ return '<option value="'+n+'" '+(daily===n?'selected':'')+'>'+n+' / day</option>'; }).join('')+'</select></div>'+
    '<button class="btn btn-primary btn-sm" onclick="xGoalSave()">Save goal</button></div>'+
    (needPerDay?'<div style="font-size:12.5px;color:var(--muted);margin-top:10px">To finish your target by the exam date you need about '+needPerDay+' questions per day.</div>':''))+
  card(h3('📊 Last 7 days')+'<div style="display:flex;gap:8px;align-items:end;height:110px">'+week.map(function(w){ return '<div style="flex:1;text-align:center;font-size:11px;color:var(--muted)"><div style="height:'+Math.max(4,Math.round(w.n*80/mx))+'px;background:'+(w.n>=daily?'var(--green-500)':'var(--navy-600)')+';border-radius:5px 5px 0 0;margin-bottom:4px"></div>'+w.n+'<br>'+w.l+'</div>'; }).join('')+'</div>')+
  card(h3('✅ My planner')+'<div style="display:flex;gap:8px;margin-bottom:10px"><input id="xTodoIn" maxlength="80" placeholder="Add a task, e.g. Revise Thermodynamics" style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:14px" onkeydown="if(event.key===\'Enter\')xTodoAdd()"><button class="btn btn-primary btn-sm" onclick="xTodoAdd()">Add</button></div>'+
    (todo.length?todo.map(function(t,ix){ return '<div style="display:flex;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid var(--border);font-size:14px"><input type="checkbox" '+(t.d?'checked':'')+' onchange="xTodoTog('+ix+')"><span style="flex:1;'+(t.d?'text-decoration:line-through;color:var(--faint)':'')+'">'+esc(t.t)+'</span><button class="btn btn-ghost btn-sm" onclick="xTodoDel('+ix+')">✕</button></div>'; }).join(''):'<div style="font-size:13px;color:var(--muted)">No tasks yet — plan your day above.</div>'))+
  card(h3('⏱ Focus timer (Pomodoro)')+'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div id="xPomoT" style="font-size:34px;font-weight:700;font-family:var(--font-display);min-width:100px">'+mmss(pm.left)+'</div>'+
    '<span class="pill '+(pm.mode==='focus'?'pill-navy':'pill-green')+'">'+(pm.mode==='focus'?'Focus 25 min':'Break 5 min')+'</span>'+
    '<button class="btn btn-primary btn-sm" onclick="xPomo(\''+(pm.run?'pause':'start')+'\')">'+(pm.run?'Pause':'Start')+'</button><button class="btn btn-outline btn-sm" onclick="xPomo(\'reset\')">Reset</button>'+
    '<span style="font-size:12.5px;color:var(--muted)">Focus sessions today: '+pomoN+'</span></div>')+
  card(h3('🏆 This week\'s top practisers')+(X.lb?(X.lb.length?'<table class="table-simple"><tbody>'+X.lb.map(function(r,ix){ return '<tr><td style="width:40px">'+(ix+1)+'</td><td>'+esc(r.n)+'</td><td style="text-align:right"><b>'+r.v+'</b> questions</td></tr>'; }).join('')+'</tbody></table>':'<div style="font-size:13px;color:var(--muted)">No practice recorded this week yet — be the first!</div>'):'<button class="btn btn-outline btn-sm" onclick="xLoadLb()">Show leaderboard</button>')));
};
function saveP(){ MCQ.save(); }
window.xGoalSave=function(){
  var P=MCQ.prog; P.goal={exam:document.getElementById('xGoalExam').value,date:document.getElementById('xGoalDate').value,daily:+document.getElementById('xGoalDaily').value};
  saveP(); toast('Goal saved ✅'); render();
};
window.xTodoAdd=function(){ var el=document.getElementById('xTodoIn'), t=el&&el.value.trim(); if(!t) return; var P=MCQ.prog; P.todo=P.todo||[]; if(P.todo.length>=30){ toast('Planner is full — clear a task first','⚠️'); return; } P.todo.push({t:t.slice(0,80),d:false}); saveP(); render(); };
window.xTodoTog=function(i){ var t=MCQ.prog.todo[i]; if(t){ t.d=!t.d; saveP(); render(); } };
window.xTodoDel=function(i){ MCQ.prog.todo.splice(i,1); saveP(); render(); };
window.xLoadLb=function(){
  fbDb.collection('users').where('role','==','student').limit(300).get().then(function(s){
    var rows=[]; s.forEach(function(d){ var u=d.data(), m=u.mcqSummary; if(m&&m.n7>0&&!u.banned) rows.push({n:firstName(u.name),v:m.n7}); });
    rows.sort(function(a,b){ return b.v-a.v; }); X.lb=rows.slice(0,10); again('studyhub');
  }).catch(function(){ toast('Could not load leaderboard','⚠️'); });
};
window.xPomo=function(a){
  var p=X.pomo;
  if(a==='start'){ if(p.tid) clearInterval(p.tid); p.run=true; p.tid=setInterval(function(){
      if(ROUTE.view!=='studyhub'){ clearInterval(p.tid); p.tid=null; p.run=false; return; }
      p.left--; var el=document.getElementById('xPomoT'); if(el) el.textContent=mmss(p.left);
      if(p.left<=0){ clearInterval(p.tid); p.tid=null; p.run=false;
        if(p.mode==='focus'){ var k='dsa_pomo_'+today(); localStorage.setItem(k,(+(localStorage.getItem(k)||0))+1); p.mode='break'; p.left=300; toast('Focus session done — take a 5 min break','☕'); }
        else { p.mode='focus'; p.left=1500; toast('Break over — back to focus','🎯'); }
        try{ navigator.vibrate&&navigator.vibrate(300); }catch(e){} render(); } },1000); render(); }
  else if(a==='pause'){ clearInterval(p.tid); p.tid=null; p.run=false; render(); }
  else { clearInterval(p.tid); p.tid=null; p.run=false; p.mode='focus'; p.left=1500; render(); }
};

/* ============================ PARENT: WEEKLY REPORT ======================= */
function ms(w){ return w&&w.toDate?w.toDate().getTime():0; }
function buildReport(d){
  var p=d.profile||{}, m=p.mcqSummary||{}, wk=Date.now()-7*864e5, rs=d.results||[];
  var wr=rs.filter(function(r){ return ms(r.when)>=wk; }), avgAll=rs.length?Math.round(rs.reduce(function(a,r){ return a+(r.pct||0); },0)/rs.length):null;
  var avgWk=wr.length?Math.round(wr.reduce(function(a,r){ return a+(r.pct||0); },0)/wr.length):null;
  var due=Math.max(0,(p.feeTotal||0)-(p.feePaid||0)), open=(d.doubts||[]).filter(function(x){ return x.status!=='answered'; }).length;
  var idle=Math.min(daysSince(m.last), wr.length?0:999);
  var alerts=[]; if(!m.last&&!rs.length) alerts.push('No practice or tests recorded yet.'); else if(idle>=3) alerts.push('No practice or test in the last '+(idle>=999?'7+':idle)+' days.');
  if(avgWk!==null&&avgWk<40) alerts.push('This week\'s test average is below 40%.');
  if(due>0) alerts.push('Fees due: ₹'+due+(p.feeDueDate?' (by '+p.feeDueDate+')':'')+'.');
  var lines=['📘 Weekly report — '+(p.name||d.childEmail),
    'Tests this week: '+wr.length+(avgWk!==null?' (avg '+avgWk+'%)':''),
    'Overall test average: '+(avgAll===null?'—':avgAll+'%'),
    'MCQ practice this week: '+(m.n7||0)+' questions · overall accuracy '+pct(m.c||0,m.a||0)+'% · streak '+(m.streak||0)+' days',
    (m.weak&&m.weak.length?'Needs revision: '+m.weak.join(', '):'Needs revision: not enough data yet'),
    'Doubts open: '+open, 'Fees due: ₹'+due, '— Dr. Shreyansh Academy'];
  return {m:m,wr:wr,avgWk:avgWk,avgAll:avgAll,due:due,open:open,alerts:alerts,text:lines.join('\n'),name:p.name||d.childEmail};
}
window.renderParentReport=function(){
  if(!DB.currentUser) return renderAuth();
  var bad=reqLive('parentreport','parentreport'); if(bad) return bad;
  var pr=X.pr=X.pr||{};
  if(!pr.links){ if(!pr.busy){ pr.busy=true; loadParentLinks().then(function(l){ pr.links=l.filter(function(x){ return x.status==='approved'; }); pr.busy=false; again('parentreport'); }); }
    return shell('parentreport',head('📄 Weekly Report','')+note('⏳','Loading…')); }
  if(!pr.links.length) return shell('parentreport',head('📄 Weekly Report','')+note('👪','Link and get approval for a child account first.')+'<div style="text-align:center;margin-top:12px"><button class="btn btn-primary btn-sm" onclick="go(\'parentaddchild\')">Link a child →</button></div>');
  var em=(ROUTE.params&&ROUTE.params.child)||pr.email||pr.links[0].childEmail;
  if(pr.email!==em||!pr.data){ if(!pr.busy2){ pr.email=em; pr.data=null; pr.busy2=true; loadChildData(em).then(function(d){ pr.data=d; pr.busy2=false; again('parentreport'); }).catch(function(){ pr.busy2=false; }); }
    return shell('parentreport',head('📄 Weekly Report','')+note('⏳','Preparing report…')); }
  var r=buildReport(pr.data), m=r.m;
  return shell('parentreport',head('📄 Weekly Report',esc(r.name)+' · last 7 days')+
    (pr.links.length>1?'<div class="mcq-tabs">'+pr.links.map(function(l){ return '<button class="mcq-chip '+(l.childEmail===em?'on':'')+'" onclick="xPrPick(\''+esc(l.childEmail)+'\')">'+esc(l.childEmail)+'</button>'; }).join('')+'</div>':'')+
    (r.alerts.length?card('<b style="color:var(--red-600)">⚠️ Needs attention</b><ul style="margin:8px 0 0 18px;font-size:13.5px;line-height:1.7">'+r.alerts.map(function(a){ return '<li>'+esc(a)+'</li>'; }).join('')+'</ul>','background:var(--red-100);border-color:var(--red-500)'):card('<b style="color:var(--green-700)">✅ All good this week — no concerns.</b>'))+
    '<div class="stat-row"><div class="card stat-box"><b>'+r.wr.length+'</b><span>Tests this week</span></div><div class="card stat-box"><b>'+(r.avgWk===null?'—':r.avgWk+'%')+'</b><span>Week test average</span></div><div class="card stat-box"><b>'+(m.n7||0)+'</b><span>MCQs practised (7d)</span></div><div class="card stat-box"><b>🔥 '+(m.streak||0)+'</b><span>Practice streak</span></div></div>'+
    card(h3('MCQ practice')+'<div style="font-size:13.5px;line-height:1.8">Accuracy: <b>'+pct(m.c||0,m.a||0)+'%</b> over '+(m.a||0)+' questions · Last practised: <b>'+(m.last?esc(m.last):'never')+'</b><br>Topics to revise: <b>'+(m.weak&&m.weak.length?esc(m.weak.join(', ')):'not enough data yet')+'</b></div>')+
    card(h3('Share this report')+'<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:var(--paper-2);padding:12px;border-radius:9px;margin:0 0 12px">'+esc(r.text)+'</pre><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-green btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(r.text)+'">Share on WhatsApp</a><button class="btn btn-outline btn-sm" onclick="xCopy()">Copy text</button><button class="btn btn-outline btn-sm" onclick="window.print()">Print</button></div>'));
};
window.xPrPick=function(e){ X.pr.email=e; X.pr.data=null; render(); };
window.xCopy=function(){ var r=buildReport(X.pr.data); (navigator.clipboard?navigator.clipboard.writeText(r.text):Promise.reject()).then(function(){ toast('Copied ✅'); }).catch(function(){ toast('Copy not supported here','⚠️'); }); };

/* ============================ FACULTY: CLASS INSIGHTS ===================== */
window.renderFacultyInsights=function(){
  if(!DB.currentUser) return renderAuth();
  var bad=reqLive('facultyinsights','facultyinsights'); if(bad) return bad;
  var u=DB.currentUser; if(u.approved===false) return shell('facultyinsights',note('⏳','Your account is waiting for admin approval.'));
  var fi=X.fi;
  if(!fi){ if(!X.fbusy){ X.fbusy=true; Promise.all([loadFacultyDoubts(u.subject),loadAllStudents()]).then(function(a){ X.fi={doubts:a[0],students:a[1]}; X.fbusy=false; again('facultyinsights'); }).catch(function(){ X.fbusy=false; X.fi={doubts:[],students:[]}; again('facultyinsights'); }); }
    return shell('facultyinsights',head('🔎 Class Insights','')+note('⏳','Loading…')); }
  var by={}; fi.doubts.forEach(function(d){ var k=d.chapter?'Ch.'+d.chapter:'General'; by[k]=by[k]||{n:0,p:0}; by[k].n++; if(d.status!=='answered') by[k].p++; });
  var hot=Object.keys(by).map(function(k){ return {k:k,n:by[k].n,p:by[k].p}; }).sort(function(a,b){ return b.n-a.n; }).slice(0,6);
  var pend=fi.doubts.filter(function(d){ return d.status!=='answered'; }).length;
  var rows=fi.students.map(function(s){ var m=s.mcqSummary||{}; return {n:s.name||s.email,e:s.email,n7:m.n7||0,acc:pct(m.c||0,m.a||0),a:m.a||0,last:m.last||'',idle:daysSince(m.last)}; }).sort(function(a,b){ return b.n7-a.n7; });
  var inactive=rows.filter(function(r){ return r.idle>=7; }).length;
  return shell('facultyinsights',head('🔎 Class Insights',esc(u.subject||'')+' · doubts and student practice activity')+
    '<div class="stat-row"><div class="card stat-box"><b>'+pend+'</b><span>Doubts pending</span></div><div class="card stat-box"><b>'+fi.doubts.length+'</b><span>Recent doubts</span></div><div class="card stat-box"><b>'+rows.filter(function(r){ return r.n7>0; }).length+'</b><span>Students active (7d)</span></div><div class="card stat-box"><b>'+inactive+'</b><span>Inactive 7+ days</span></div></div>'+
    card(h3('🔥 Doubt hot-spots — chapters to re-teach')+(hot.length?'<table class="table-simple"><thead><tr><th>Chapter</th><th>Doubts</th><th>Pending</th></tr></thead><tbody>'+hot.map(function(h){ return '<tr><td>'+esc(h.k)+'</td><td>'+h.n+'</td><td>'+h.p+'</td></tr>'; }).join('')+'</tbody></table>':'<div style="font-size:13px;color:var(--muted)">No doubts yet.</div>'))+
    card('<div style="display:flex;align-items:center;margin-bottom:12px">'+h3('Student MCQ practice').replace('margin:0 0 12px','margin:0')+'<button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="xFacExport()">⬇ Export CSV</button></div>'+
      (rows.length?'<div style="max-height:420px;overflow:auto"><table class="table-simple"><thead><tr><th>Student</th><th>Qs (7d)</th><th>Accuracy</th><th>Last active</th></tr></thead><tbody>'+rows.map(function(r){ return '<tr><td>'+esc(r.n)+'</td><td>'+r.n7+'</td><td>'+(r.a?r.acc+'%':'—')+'</td><td>'+(r.last?esc(r.last):'<span class="pill pill-red">never</span>')+'</td></tr>'; }).join('')+'</tbody></table></div>':'<div style="font-size:13px;color:var(--muted)">No students found.</div>')));
};
window.xFacExport=function(){ var fi=X.fi; if(!fi) return; csv('class-practice',[['Name','Email','Questions (7d)','Attempted','Accuracy %','Last active']].concat(fi.students.map(function(s){ var m=s.mcqSummary||{}; return [s.name,s.email,m.n7||0,m.a||0,pct(m.c||0,m.a||0),m.last||'']; }))); };

/* ============================ ADMIN: MCQ INSIGHTS ========================= */
window.renderAdminMcq=function(){
  if(!DB.currentUser) return renderAuth();
  var bad=reqLive('adminmcq','adminmcq'); if(bad) return bad;
  var am=X.am;
  if(!am){ if(!X.abusy){ X.abusy=true;
      Promise.all([loadAllStudents(),fbDb.collection('mcqReports').orderBy('when','desc').limit(30).get().then(function(s){ return s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); }).catch(function(){ return []; })])
        .then(function(a){ X.am={students:a[0],reports:a[1]}; X.abusy=false; again('adminmcq'); }); }
    return shell('adminmcq',head('📚 MCQ Insights','')+note('⏳','Loading…')); }
  var st=am.students, pr=st.filter(function(s){ return s.mcqSummary&&s.mcqSummary.a>0; }), ac=pr.filter(function(s){ return s.mcqSummary.n7>0; });
  var A=0,C=0; pr.forEach(function(s){ A+=s.mcqSummary.a; C+=s.mcqSummary.c; });
  var premIdle=st.filter(function(s){ return s.plan==='premium'&&!(s.mcqSummary&&s.mcqSummary.n7>0); });
  var top=pr.slice().sort(function(a,b){ return b.mcqSummary.a-a.mcqSummary.a; }).slice(0,10);
  return shell('adminmcq',head('📚 MCQ Insights','How students are using the Practice Hub')+
    '<div class="stat-row"><div class="card stat-box"><b>'+pr.length+' / '+st.length+'</b><span>Students who practised</span></div><div class="card stat-box"><b>'+ac.length+'</b><span>Active in last 7 days</span></div><div class="card stat-box"><b>'+A.toLocaleString('en-IN')+'</b><span>Questions attempted</span></div><div class="card stat-box"><b>'+pct(C,A)+'%</b><span>Average accuracy</span></div></div>'+
    card(h3('💎 Premium students not practising this week ('+premIdle.length+')')+(premIdle.length?'<div style="font-size:13px;line-height:1.8;max-height:160px;overflow:auto">'+premIdle.slice(0,40).map(function(s){ return esc(s.name||s.email); }).join(' · ')+'</div><div style="font-size:12px;color:var(--muted);margin-top:8px">Good people to nudge — they pay but are not using the bank.</div>':'<div style="font-size:13px;color:var(--muted)">Everyone with Premium practised this week 🎉</div>'))+
    card(h3('Top practisers')+(top.length?'<table class="table-simple"><thead><tr><th>Student</th><th>Plan</th><th>Attempted</th><th>Accuracy</th><th>Streak</th></tr></thead><tbody>'+top.map(function(s){ var m=s.mcqSummary; return '<tr><td>'+esc(s.name||s.email)+'</td><td>'+esc(s.plan||'free')+'</td><td>'+m.a+'</td><td>'+pct(m.c,m.a)+'%</td><td>'+(m.streak||0)+'</td></tr>'; }).join('')+'</tbody></table>':'<div style="font-size:13px;color:var(--muted)">No practice data yet.</div>')+'<button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="xAdmExport()">⬇ Export all students\' practice (CSV)</button>')+
    card(h3('🚩 Reported questions ('+am.reports.length+')')+(am.reports.length?am.reports.map(function(r){ return '<div style="padding:9px 0;border-bottom:1px solid var(--border);font-size:13px"><b>'+esc(r.reason)+'</b> · <span style="color:var(--muted)">'+esc(r.qid)+' · '+esc(formatWhen(r.when))+'</span><div style="margin-top:3px">'+esc(r.q)+'</div><button class="btn btn-ghost btn-sm" style="margin-top:4px" onclick="xRepDel(\''+r.id+'\')">Mark as fixed / dismiss</button></div>'; }).join(''):'<div style="font-size:13px;color:var(--muted)">No reports. Students can flag any question with the 🚩 button.</div>')));
};
window.xRepDel=function(id){ fbDb.collection('mcqReports').doc(id).delete().then(function(){ X.am=null; toast('Dismissed'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
window.xAdmExport=function(){ var am=X.am; if(!am) return; csv('mcq-practice',[['Name','Email','Plan','Attempted','Correct','Accuracy %','Qs 7d','Streak','Last active']].concat(am.students.map(function(s){ var m=s.mcqSummary||{}; return [s.name,s.email,s.plan||'free',m.a||0,m.c||0,pct(m.c||0,m.a||0),m.n7||0,m.streak||0,m.last||'']; }))); };

/* refresh cached data when the user changes screen */
var _go=window.go; window.go=function(v,p){ if(v==='notices') X.notices=null; if(v==='adminmcq') X.am=null; if(v==='facultyinsights') X.fi=null; if(v==='parentreport'&&!(p&&p.child)){ if(X.pr){ X.pr.data=null; } } return _go(v,p); };
})();
