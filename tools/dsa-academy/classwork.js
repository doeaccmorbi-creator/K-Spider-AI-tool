/* =========================================================================
   Dr. Shreyansh Academy — Classwork (classwork.js)
   NEW screens only; no existing screen is modified.
     Step 4  Fee reminders        (admin: remind student + linked parents)
     Step 5  Class tests          (faculty/admin create from bank or by typing;
                                   students attempt once; faculty see results;
                                   parents see their child's scores)
   ========================================================================= */
(function(){
'use strict';
var W={fees:null,ff:'due',tests:null,my:null,pt:null,res:{},fb:{mode:'bank',exam:'',subj:'',sel:{},n:20},ft:null};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function again(v){ if(ROUTE.view===v) render(); }
function me(){ return DB.currentUser; }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function shell(a,b){ return '<div class="app-shell">'+sidebar(a)+'<div class="main" style="max-width:980px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(x||'')+'">'+i+'</div>'; }
function h3(t){ return '<h3 style="font-size:15px;margin:0 0 12px">'+t+'</h3>'; }
function guard(v){ if(!me()) return renderAuth(); if(!live()) return shell(v,note('⚡','This feature works in live mode. Connect Firebase first.')); return null; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function lbl(t){ return '<div style="font-size:12px;color:var(--muted);margin:0 0 4px">'+t+'</div>'; }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t; } return a; }
function csv(name,rows){
  var t=rows.map(function(r){ return r.map(function(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8;'})); a.download=name+'-'+today()+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast('Exported ✅');
}
function waLink(phone,text){ var d=String(phone||'').replace(/\D/g,''); if(d.length===10) d='91'+d; if(d.length<11) return ''; return 'https://wa.me/'+d+'?text='+encodeURIComponent(text); }
function ago(ms){ if(!ms) return ''; var d=Math.floor((Date.now()-ms)/864e5); return d<=0?'today':d+'d ago'; }

/* ============================ STEP 4 — FEE REMINDERS (admin) =============== */
function dueInfo(s){
  var due=Math.max(0,(s.feeTotal||0)-(s.feePaid||0)), dd=s.feeDueDate||'', days=dd?Math.floor((new Date(dd+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5):null;
  return {due:due,dd:dd,days:days,st:due<=0?'paid':(days!==null&&days<0?'overdue':(days!==null&&days<=7?'soon':'later'))};
}
function feeMsg(i){ return '₹'+i.due+' fee is '+(i.st==='overdue'?'overdue by '+(-i.days)+' day'+(-i.days>1?'s':'')+' (due '+i.dd+')':(i.dd?'due on '+i.dd:'pending'))+'. Please pay at the academy office or contact us. — Dr. Shreyansh Academy'; }
window.renderAdminFees=function(){
  var g=guard('adminfees'); if(g) return g;
  if(!W.fees){ if(!W.fb1){ W.fb1=true;
      Promise.all([loadAllStudents(),fbDb.collection('parentLinks').where('status','==','approved').get().then(function(s){ var m={}; s.docs.forEach(function(d){ var x=d.data(); (m[x.childEmail]=m[x.childEmail]||[]).push(x.parentEmail); }); return m; }).catch(function(){ return {}; })])
        .then(function(a){ W.fees={st:a[0],par:a[1]}; W.fb1=false; again('adminfees'); }); }
    return shell('adminfees',head('💰 Fee Reminders','')+note('⏳','Loading…')); }
  var rows=W.fees.st.map(function(s){ return {s:s,i:dueInfo(s)}; }).filter(function(r){ return r.i.due>0&&!r.s.banned; });
  var f=W.ff, show=rows.filter(function(r){ return f==='all'||(f==='overdue'?r.i.st==='overdue':r.i.st==='overdue'||r.i.st==='soon'); })
    .sort(function(a,b){ return (a.i.days===null?999:a.i.days)-(b.i.days===null?999:b.i.days); });
  var tot=rows.reduce(function(a,r){ return a+r.i.due; },0), od=rows.filter(function(r){ return r.i.st==='overdue'; });
  var odAmt=od.reduce(function(a,r){ return a+r.i.due; },0);
  return shell('adminfees',head('💰 Fee Reminders','Remind students and their linked parents in one tap')+
    '<div class="stat-row"><div class="card stat-box"><b>₹'+tot.toLocaleString('en-IN')+'</b><span>Total pending</span></div><div class="card stat-box"><b style="color:var(--red-600)">'+od.length+'</b><span>Overdue students</span></div><div class="card stat-box"><b>₹'+odAmt.toLocaleString('en-IN')+'</b><span>Overdue amount</span></div><div class="card stat-box"><b>'+rows.length+'</b><span>Students with dues</span></div></div>'+
    '<div class="mcq-tabs">'+[['due','Overdue + due in 7 days'],['overdue','Overdue only'],['all','All pending']].map(function(t){ return '<button class="mcq-chip '+(f===t[0]?'on':'')+'" onclick="cwFeeF(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+
      '<button class="btn btn-gold btn-sm" style="margin-left:auto" onclick="cwFeeAll()">🔔 Remind all shown</button><button class="btn btn-outline btn-sm" onclick="cwFeeCsv()">⬇ CSV</button></div>'+
    (show.length?'<div class="card" style="padding:6px 6px 2px"><table class="table-simple"><thead><tr><th>Student</th><th>Due</th><th>Due date</th><th>Status</th><th></th></tr></thead><tbody>'+show.map(function(r){
      var s=r.s,i=r.i, wa=waLink(s.parentPhone||s.phone,'Dear parent/student of '+(s.name||'')+', '+feeMsg(i));
      return '<tr><td>'+esc(s.name||s.email)+(s.lastFeeReminder?'<div style="font-size:11px;color:var(--muted)">reminded '+ago(s.lastFeeReminder)+'</div>':'')+'</td><td>₹'+i.due+'</td><td>'+esc(i.dd||'—')+'</td><td><span class="pill '+(i.st==='overdue'?'pill-red':(i.st==='soon'?'pill-gold':'pill-navy'))+'">'+(i.st==='overdue'?'Overdue '+(-i.days)+'d':(i.st==='soon'?'In '+i.days+'d':'Pending'))+'</span></td><td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="cwFeeOne(\''+s.uid+'\')">🔔 Remind</button>'+(wa?' <a class="btn btn-green btn-sm" target="_blank" rel="noopener" href="'+esc(wa)+'">WhatsApp</a>':'')+'</td></tr>'; }).join('')+'</tbody></table></div>':note('🎉','No students match this filter.')));
};
window.cwFeeF=function(f){ W.ff=f; render(); };
function shownFees(){
  var f=W.ff; return W.fees.st.map(function(s){ return {s:s,i:dueInfo(s)}; }).filter(function(r){ return r.i.due>0&&!r.s.banned&&(f==='all'||(f==='overdue'?r.i.st==='overdue':r.i.st==='overdue'||r.i.st==='soon')); });
}
async function sendFee(list){
  var b=fbDb.batch(), n=0, ops=0, by=me().name||'Admin', all=[];
  function flush(){ var x=b; b=fbDb.batch(); ops=0; return x.commit(); }
  for(var k=0;k<list.length;k++){ var r=list[k], to=[r.s.email].concat(W.fees.par[r.s.email]||[]).filter(Boolean);
    to.forEach(function(em){ b.set(fbDb.collection('notifications').doc(),{toEmail:em,title:'Fee reminder',msg:(em===r.s.email?'':'For '+(r.s.name||'your child')+': ')+feeMsg(r.i),kind:'fee',by:by,when:ts(),read:false}); ops++; n++; });
    b.update(fbDb.collection('users').doc(r.s.uid),{lastFeeReminder:Date.now()}); r.s.lastFeeReminder=Date.now(); ops++;
    if(ops>=400){ await flush(); } }
  if(ops) await b.commit(); return n;
}
window.cwFeeOne=function(uid){ var r=shownFees().filter(function(x){ return x.s.uid===uid; })[0]; if(!r) return;
  sendFee([r]).then(function(n){ toast('Reminder sent ('+n+' notification'+(n>1?'s':'')+') ✅'); render(); }).catch(function(e){ toast(e.message||'Failed','⚠️'); }); };
window.cwFeeAll=function(){
  var l=shownFees().filter(function(r){ return !r.s.lastFeeReminder||Date.now()-r.s.lastFeeReminder>3*864e5; });
  if(!l.length){ toast('Everyone shown was already reminded in the last 3 days','ℹ️'); return; }
  if(!confirm('Send a fee reminder to '+l.length+' student(s) and their linked parents?')) return;
  sendFee(l).then(function(n){ toast(n+' reminders sent ✅'); render(); }).catch(function(e){ toast(e.message||'Failed','⚠️'); });
};
window.cwFeeCsv=function(){ csv('fee-dues',[['Name','Email','Due ₹','Due date','Status','Phone','Parent phone']].concat(shownFees().map(function(r){ return [r.s.name,r.s.email,r.i.due,r.i.dd,r.i.st,r.s.phone||'',r.s.parentPhone||'']; }))); };

/* ============================ STEP 5 — CLASS TESTS ========================= */
function parseQs(text){
  var out=[],errs=[];
  String(text).replace(/\r/g,'').split(/\n\s*\n/).forEach(function(b,bi){
    var lines=b.split('\n').map(function(l){ return l.trim(); }).filter(Boolean); if(!lines.length) return;
    var q={q:'',o:['','','',''],a:-1,e:''}, cur='q', m;
    lines.forEach(function(l){
      if((m=l.match(/^(?:Q\s*\d*\s*[:.)]|\d+\s*[.)])\s*(.*)$/i))){ q.q=m[1]; cur='q'; }
      else if((m=l.match(/^\(?([A-D])\s*[:.)]\s*(.*)$/i))){ q.o['ABCD'.indexOf(m[1].toUpperCase())]=m[2]; cur='o'; }
      else if((m=l.match(/^(?:Ans(?:wer)?|Correct)\s*[:=\-]?\s*\(?([A-D])\)?\b/i))){ q.a='ABCD'.indexOf(m[1].toUpperCase()); }
      else if((m=l.match(/^(?:Exp(?:lanation)?|Sol(?:ution)?)\s*[:=\-]?\s*(.*)$/i))){ q.e=m[1]; cur='e'; }
      else if(cur==='q') q.q+=' '+l; else if(cur==='e') q.e+=' '+l;
    });
    if(!q.q||q.o.some(function(o){ return !o; })||q.a<0) errs.push('Question '+(bi+1)+' is incomplete (needs Q, A–D options and Ans)');
    else { q.i='T'+(out.length+1); out.push(q); }
  });
  return {qs:out,errs:errs};
}
window.cwParse=parseQs;
window.renderFacultyTests=function(){
  var v=ROUTE.view, g=guard(v); if(g) return g;
  var u=me(); if(u.role==='faculty'&&u.approved===false) return shell(v,note('⏳','Your account is waiting for admin approval.'));
  var fb=W.fb;
  if(!W.ft){ if(!W.ftb){ W.ftb=true;
      var q=u.role==='admin'?fbDb.collection('facultyTests').orderBy('when','desc').limit(40):fbDb.collection('facultyTests').where('byUid','==',u.uid).limit(40);
      q.get().then(function(s){ W.ft=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }).sort(function(a,b){ var x=a.when&&a.when.toMillis?a.when.toMillis():0,y=b.when&&b.when.toMillis?b.when.toMillis():0; return y-x; }); })
        .catch(function(){ W.ft=[]; }).then(function(){ W.ftb=false; again(v); });
      if(window.MCQ&&MCQ.loadIndex) MCQ.loadIndex().then(function(){ again(v); }); }
    return shell(v,head('📝 Class Tests','')+note('⏳','Loading…')); }
  var idx=window.MCQ&&MCQ.index, exams=[], subs=[], chs=[];
  if(idx){ idx.chapters.forEach(function(c){ if(exams.indexOf(c.e)<0) exams.push(c.e); });
    if(!fb.exam||exams.indexOf(fb.exam)<0) fb.exam=exams[0]||''; idx.chapters.forEach(function(c){ if(c.e===fb.exam&&subs.indexOf(c.s)<0) subs.push(c.s); });
    if(!fb.subj||subs.indexOf(fb.subj)<0) fb.subj=subs[0]||''; chs=idx.chapters.filter(function(c){ return c.e===fb.exam&&c.s===fb.subj; }); }
  var bankHtml=!idx?'<div style="font-size:13px;color:var(--muted)">The question bank is not synced yet — use “Type questions” instead.</div>':
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px"><div>'+lbl('Exam')+'<select class="mcq-sel" onchange="cwFb(\'exam\',this.value)">'+exams.map(function(e){ return '<option '+(e===fb.exam?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div><div>'+lbl('Subject')+'<select class="mcq-sel" onchange="cwFb(\'subj\',this.value)">'+subs.map(function(s){ return '<option '+(s===fb.subj?'selected':'')+'>'+esc(s)+'</option>'; }).join('')+'</select></div><div>'+lbl('Questions')+'<select class="mcq-sel" onchange="cwFb(\'n\',+this.value)">'+[10,20,30,40,50].map(function(n){ return '<option '+(fb.n===n?'selected':'')+'>'+n+'</option>'; }).join('')+'</select></div></div>'+
    '<div style="max-height:220px;overflow:auto;margin-bottom:8px">'+chs.map(function(c){ return '<div class="mcq-row '+(fb.sel[c.k]?'on':'')+'" onclick="cwFbCh(\''+esc(c.k)+'\')"><input type="checkbox" '+(fb.sel[c.k]?'checked':'')+'><span class="nm">'+esc(c.c)+'</span><small>'+c.n+' Q</small></div>'; }).join('')+'</div>';
  return shell(v,head('📝 Class Tests','Create a test for your students — they attempt it once, you see every score')+
    card(h3('➕ Create a class test')+
      '<div class="mcq-tabs"><button class="mcq-chip '+(fb.mode==='bank'?'on':'')+'" onclick="cwFb(\'mode\',\'bank\')">From question bank</button><button class="mcq-chip '+(fb.mode==='type'?'on':'')+'" onclick="cwFb(\'mode\',\'type\')">Type / paste my own questions</button></div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div style="flex:1;min-width:200px">'+lbl('Test title')+'<input id="cwTitle" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="80" placeholder="e.g. Kinematics weekly test"></div><div>'+lbl('Subject label')+'<input id="cwSubj" class="mcq-sel" style="padding:9px 11px" maxlength="30" value="'+esc(fb.mode==='bank'?fb.subj:(u.subject||''))+'"></div><div>'+lbl('Time (minutes)')+'<input id="cwMins" type="number" min="5" max="180" class="mcq-sel" style="width:90px;padding:9px 11px" value="'+Math.max(10,fb.n)+'"></div></div>'+
      (fb.mode==='bank'?bankHtml:'<textarea id="cwText" rows="9" class="mcq-sel" style="width:100%;font-family:monospace;font-size:12.5px" placeholder="Q: What is the SI unit of force?\nA: Joule\nB: Newton\nC: Watt\nD: Pascal\nAns: B\nExp: Force = mass × acceleration, so the unit is the newton.\n\n(leave one blank line between questions)"></textarea>')+
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:12px 0"><input type="checkbox" id="cwNotify" checked> Notify all students</label>'+
      '<button class="btn btn-primary" onclick="cwCreate()" '+(W.cb?'disabled':'')+'>'+(W.cb?'Creating…':'Create test')+'</button>')+
    h3('Your tests')+(W.ft.length?W.ft.map(function(t){ var r=W.res[t.id];
      return card('<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:180px"><b>'+esc(t.title)+'</b><div style="font-size:12px;color:var(--muted)">'+esc(t.subject)+' · '+t.count+' questions · '+t.mins+' min'+(u.role==='admin'?' · '+esc(t.by):'')+'</div></div><span class="pill '+(t.active?'pill-green':'pill-navy')+'">'+(t.active?'Live':'Closed')+'</span>'+
        '<button class="btn btn-outline btn-sm" onclick="cwResults(\''+t.id+'\')">Results</button><button class="btn btn-outline btn-sm" onclick="cwToggle(\''+t.id+'\')">'+(t.active?'Close':'Re-open')+'</button><button class="btn btn-ghost btn-sm" onclick="cwDelTest(\''+t.id+'\')">Delete</button></div>'+
        (r?(r.length?'<div style="margin-top:10px;font-size:13px">Attempts: <b>'+r.length+'</b> · Average: <b>'+Math.round(r.reduce(function(a,x){ return a+x.score; },0)/r.length)+'</b> / '+r[0].max+'<table class="table-simple" style="margin-top:8px"><thead><tr><th>Student</th><th>Score</th><th>Right/Wrong</th></tr></thead><tbody>'+r.slice().sort(function(a,b){ return b.score-a.score; }).map(function(x){ return '<tr><td>'+esc(x.name||x.email)+'</td><td><b>'+x.score+'</b> / '+x.max+'</td><td>'+x.correct+' / '+x.wrong+'</td></tr>'; }).join('')+'</tbody></table><button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="cwResCsv(\''+t.id+'\')">⬇ CSV</button></div>':'<div style="margin-top:10px;font-size:13px;color:var(--muted)">No attempts yet.</div>'):''),'margin-bottom:10px'); }).join(''):note('📝','No tests created yet.')));
};
window.cwFb=function(k,v){ var c=val('cwTitle'); W.fb[k]=v; if(k==='exam'||k==='subj') W.fb.sel={}; render(); var e=document.getElementById('cwTitle'); if(e&&c) e.value=c; };
window.cwFbCh=function(k){ var c=val('cwTitle'); W.fb.sel[k]=!W.fb.sel[k]; render(); var e=document.getElementById('cwTitle'); if(e&&c) e.value=c; };
window.cwCreate=async function(){
  var u=me(), title=val('cwTitle'), mins=Math.max(5,Math.min(180,+val('cwMins')||20)), subj=val('cwSubj')||'General', qs=[], fb=W.fb;
  if(!title){ toast('Give the test a title','⚠️'); return; }
  try{
    if(fb.mode==='type'){ var p=parseQs(val('cwText')); if(p.errs.length){ toast(p.errs[0],'⚠️'); return; } qs=p.qs; }
    else { var keys=Object.keys(fb.sel).filter(function(k){ return fb.sel[k]; }); if(!keys.length){ toast('Select at least one chapter','⚠️'); return; }
      W.cb=true; render(); var all=[].concat.apply([],await Promise.all(keys.map(function(k){ return MCQ.loadChapter(k); })));
      qs=shuffle(all).slice(0,fb.n).map(function(x,i){ return {i:'B'+(i+1),q:x.q,o:x.o,a:x.a,e:x.e||''}; }); }
    if(!qs.length){ W.cb=false; toast('No questions found','⚠️'); render(); return; }
    if(qs.length>60){ qs=qs.slice(0,60); }
    if(JSON.stringify(qs).length>600000){ W.cb=false; toast('Test is too large','⚠️'); render(); return; }
    W.cb=true; render();
    var ref=await fbDb.collection('facultyTests').add({title:title.slice(0,80),subject:subj.slice(0,30),mins:mins,count:qs.length,qs:qs.map(function(x){ return {i:x.i,q:x.q,o:x.o,a:x.a,e:x.e||''}; }),by:u.name||'',byUid:u.uid,active:true,when:ts()});
    var notify=document.getElementById('cwNotify'); 
    if(!notify||notify.checked!==false){ var st=await loadAllStudents(), b=fbDb.batch(), n=0;
      for(var i=0;i<st.length;i++){ b.set(fbDb.collection('notifications').doc(),{toEmail:st[i].email,title:'New class test',msg:title+' ('+subj+', '+qs.length+' questions, '+mins+' min) is live in Class Tests.',kind:'test',by:u.name||'',when:ts(),read:false}); n++;
        if(n%400===0){ await b.commit(); b=fbDb.batch(); } }
      if(n%400) await b.commit(); }
    W.cb=false; W.ft=null; W.fb.sel={}; toast('Test created ✅ ('+qs.length+' questions)'); render();
  }catch(e){ W.cb=false; toast(e.message||'Could not create test','⚠️'); render(); }
};
window.cwResults=function(id){ if(W.res[id]){ delete W.res[id]; render(); return; }
  fbDb.collection('classTestResults').where('testId','==',id).get().then(function(s){ W.res[id]=s.docs.map(function(d){ return d.data(); }); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
window.cwResCsv=function(id){ var r=W.res[id]||[], t=(W.ft||[]).filter(function(x){ return x.id===id; })[0]; csv('test-'+(t?t.title.replace(/\W+/g,'-'):'results'),[['Name','Email','Score','Max','Correct','Wrong','Skipped','Seconds']].concat(r.map(function(x){ return [x.name,x.email,x.score,x.max,x.correct,x.wrong,x.skipped,x.secs]; }))); };
window.cwToggle=function(id){ var t=W.ft.filter(function(x){ return x.id===id; })[0]; if(!t) return; fbDb.collection('facultyTests').doc(id).update({active:!t.active}).then(function(){ t.active=!t.active; render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
window.cwDelTest=function(id){ if(!confirm('Delete this test? Student scores stay saved.')) return; fbDb.collection('facultyTests').doc(id).delete().then(function(){ W.ft=null; toast('Deleted'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };

/* student: take tests */
window.renderClassTests=function(){
  var g=guard('classtests'); if(g) return g;
  var u=me();
  if(!W.tests||!W.my){ if(!W.tb){ W.tb=true;
      Promise.all([fbDb.collection('facultyTests').where('active','==',true).limit(30).get().then(function(s){ return s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); }).catch(function(){ return []; }),
        fbDb.collection('classTestResults').where('uid','==',u.uid).get().then(function(s){ var m={}; s.docs.forEach(function(d){ m[d.data().testId]=d.data(); }); return m; }).catch(function(){ return {}; })])
        .then(function(a){ W.tests=a[0].sort(function(x,y){ var p=x.when&&x.when.toMillis?x.when.toMillis():0,q=y.when&&y.when.toMillis?y.when.toMillis():0; return q-p; }); W.my=a[1]; W.tb=false; again('classtests'); }); }
    return shell('classtests',head('📝 Class Tests','')+note('⏳','Loading…')); }
  return shell('classtests',head('📝 Class Tests','Tests set by your teachers — one attempt each, timed, +4 / −1')+
    (W.tests.length?W.tests.map(function(t){ var r=W.my[t.id];
      return card('<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:180px"><b style="font-size:15px">'+esc(t.title)+'</b><div style="font-size:12.5px;color:var(--muted)">'+esc(t.subject)+' · '+t.count+' questions · '+t.mins+' min · by '+esc(t.by||'teacher')+'</div></div>'+
        (r?'<div style="text-align:right"><b style="font-size:18px">'+r.score+' / '+r.max+'</b><div style="font-size:12px;color:var(--muted)">'+pct(r.correct,r.correct+r.wrong+r.skipped)+'% correct · attempted</div></div>':'<button class="btn btn-primary btn-sm" onclick="cwStart(\''+t.id+'\')">Start test →</button>')+'</div>','margin-bottom:10px'); }).join(''):note('📭','No class tests are live right now.')));
};
window.cwStart=function(id){
  var t=W.tests.filter(function(x){ return x.id===id; })[0]; if(!t||W.my[id]) return;
  if(!confirm('Start “'+t.title+'”?\nYou have '+t.mins+' minutes and only one attempt.')) return;
  mcqRunTest(t.qs,t.title,{testId:id,mins:t.mins,onDone:function(r){
    var u=me(); fbDb.collection('classTestResults').doc(id+'_'+u.uid).set({testId:id,uid:u.uid,email:u.email||'',name:u.name||'',title:t.title,score:r.score,max:r.max,correct:r.c,wrong:r.w,skipped:r.sk,secs:r.secs,when:ts()})
      .then(function(){ W.my=null; toast('Result saved ✅'); }).catch(function(){ toast('Could not save your result — tell your teacher','⚠️'); });
  }});
};

/* parent: child's class-test scores */
window.renderParentTests=function(){
  var g=guard('parenttests'); if(g) return g;
  var pt=W.pt=W.pt||{};
  if(!pt.links){ if(!pt.b){ pt.b=true; loadParentLinks().then(function(l){ pt.links=l.filter(function(x){ return x.status==='approved'; }); pt.b=false; again('parenttests'); }); } return shell('parenttests',head('📝 Class Tests','')+note('⏳','Loading…')); }
  if(!pt.links.length) return shell('parenttests',head('📝 Class Tests','')+note('👪','Link and get approval for a child account first.'));
  var em=(ROUTE.params&&ROUTE.params.child)||pt.email||pt.links[0].childEmail;
  if(pt.email!==em||!pt.rows){ if(!pt.b2){ pt.email=em; pt.rows=null; pt.b2=true; fbDb.collection('classTestResults').where('email','==',em).get().then(function(s){ pt.rows=s.docs.map(function(d){ return d.data(); }); }).catch(function(){ pt.rows=[]; }).then(function(){ pt.b2=false; again('parenttests'); }); }
    return shell('parenttests',head('📝 Class Tests','')+note('⏳','Loading…')); }
  var avg=pt.rows.length?Math.round(pt.rows.reduce(function(a,r){ return a+pct(r.score,r.max); },0)/pt.rows.length):null;
  return shell('parenttests',head('📝 Class Tests',esc(em))+(pt.links.length>1?'<div class="mcq-tabs">'+pt.links.map(function(l){ return '<button class="mcq-chip '+(l.childEmail===em?'on':'')+'" onclick="cwPtPick(\''+esc(l.childEmail)+'\')">'+esc(l.childEmail)+'</button>'; }).join('')+'</div>':'')+
    '<div class="stat-row"><div class="card stat-box"><b>'+pt.rows.length+'</b><span>Tests attempted</span></div><div class="card stat-box"><b>'+(avg===null?'—':avg+'%')+'</b><span>Average score</span></div></div>'+
    (pt.rows.length?'<div class="card" style="padding:6px 6px 2px"><table class="table-simple"><thead><tr><th>Test</th><th>Score</th><th>Right / Wrong</th></tr></thead><tbody>'+pt.rows.map(function(r){ return '<tr><td>'+esc(r.title)+'</td><td><b>'+r.score+'</b> / '+r.max+'</td><td>'+r.correct+' / '+r.wrong+'</td></tr>'; }).join('')+'</tbody></table></div>':note('📭','No class tests attempted yet.')));
};
window.cwPtPick=function(e){ W.pt.email=e; W.pt.rows=null; render(); };

var _go=window.go; window.go=function(v,p){ if(v==='adminfees') W.fees=null; if(v==='facultytests'||v==='admintests') W.ft=null; if(v==='classtests'){ W.tests=null; W.my=null; } if(v==='parenttests'&&!(p&&p.child)&&W.pt) W.pt.rows=null; return _go(v,p); };
})();
