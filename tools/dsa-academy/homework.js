/* =========================================================================
   Dr. Shreyansh Academy — Homework (homework.js)
   Teachers assign a chapter-wise practice set with a due date (to everyone or
   to one batch). Students do it as normal practice — so it also feeds their
   revision list, notebook and XP — and completion is tracked automatically.
   Teachers see who is done / pending, average score, and can remind the rest.
   Questions are copied into the assignment, so free and Premium students get
   the same set.  Free-tier friendly: one small document per assignment.
   ========================================================================= */
(function(){
'use strict';
var H={list:null,done:null,b:false,f:{ch:{},count:20,exam:'',subj:''},cb:false,open:'',det:{},st:null,sb:false,ps:null};
var HW=window.HW={};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function me(){ return DB.currentUser; }
function isStaff(){ var u=me(); return !!u&&(u.role==='admin'||(u.role==='faculty'&&u.approved!==false)); }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function shell(a,b){ return '<div class="app-shell">'+sidebar(a)+'<div class="main" style="max-width:940px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:16px 20px;margin-bottom:12px;'+(x||'')+'">'+i+'</div>'; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function lbl(t){ return '<div style="font-size:12px;color:var(--muted);margin:10px 0 4px">'+t+'</div>'; }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t; } return a; }
function daysTo(ds){ return Math.round((new Date(ds+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5); }
function dueTxt(ds){ var d=daysTo(ds); return d<0?'Overdue by '+(-d)+' day'+(-d>1?'s':''):(d===0?'Due today':(d===1?'Due tomorrow':'Due in '+d+' days')); }
function csv(name,rows){ var t=rows.map(function(r){ return r.map(function(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }).join(','); }).join('\n'); var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8;'})); a.download=name+'-'+today()+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast('Exported ✅'); }

/* ---- data ---- */
function mineOk(h){ var u=me(); return !window.BT||u.role!=='student'?true:BT.mine(h); }
function load(cb){
  if((H.list&&H.done)||H.b) return; H.b=true; var u=me();
  var ps=[fbDb.collection('homework').orderBy('when','desc').limit(60).get().then(function(s){ return s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); }).catch(function(){ return []; })];
  ps.push(u.role==='student'?fbDb.collection('homeworkDone').where('uid','==',u.uid).get().then(function(s){ var m={}; s.docs.forEach(function(d){ m[d.data().hwId]=d.data(); }); return m; }).catch(function(){ return {}; }):Promise.resolve({}));
  Promise.all(ps).then(function(r){ H.list=r[0]; H.done=r[1]; H.b=false; cb&&cb(); if(['homework','parenthomework'].indexOf(ROUTE.view)>=0) render(); });
}
HW.load=function(){ return new Promise(function(res){ if(H.list&&H.done){ res(); return; } load(res); }); };
HW.pending=function(){ if(!H.list||!H.done) return 0; return H.list.filter(function(h){ return mineOk(h)&&!H.done[h.id]&&daysTo(h.due)>=-30; }).length; };

/* ---- screen ---- */
window.renderHomework=function(){
  if(!me()) return renderAuth();
  if(!live()) return shell('homework',note('⚡','Homework works in live mode. Connect Firebase first.'));
  if(window.BT) BT.ensure();
  if(!H.list||!H.done){ load(); return shell('homework',head('📌 Homework','')+note('⏳','Loading…')); }
  return isStaff()?staffView():studentView();
};
function studentView(){
  var rows=H.list.filter(mineOk).sort(function(a,b){ var da=H.done[a.id]?1:0,db=H.done[b.id]?1:0; return da-db||(a.due<b.due?-1:1); });
  var pend=rows.filter(function(h){ return !H.done[h.id]; }).length;
  return shell('homework',head('📌 Homework',pend?pend+' pending — finish before the due date':'You are all caught up 🎉')+
    (rows.length?rows.map(function(h){
      var d=H.done[h.id], dd=daysTo(h.due), tag=d?'<span class="pill pill-green">✓ Done · '+pct(d.c,d.n)+'%</span>':(dd<0?'<span class="pill pill-red">'+dueTxt(h.due)+'</span>':(dd<=1?'<span class="pill pill-gold">'+dueTxt(h.due)+'</span>':'<span class="pill pill-navy">'+dueTxt(h.due)+'</span>'));
      return card('<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b style="font-size:15px">'+esc(h.title)+'</b><div style="font-size:12.5px;color:var(--muted);margin-top:2px">'+esc(h.subject)+' · '+esc((h.chs||[]).join(', '))+' · '+h.count+' questions · by '+esc(h.by||'teacher')+(h.batchName?' · 🎓 '+esc(h.batchName):'')+'</div>'+(h.note?'<div style="font-size:13px;margin-top:6px">'+esc(h.note)+'</div>':'')+'</div>'+tag+
        '<button class="btn '+(d?'btn-outline':'btn-primary')+' btn-sm" onclick="hwStart(\''+h.id+'\')">'+(d?'Practise again':'Start →')+'</button></div>'); }).join(''):note('📌','No homework assigned yet.')));
}
window.hwStart=function(id){
  var h=H.list.filter(function(x){ return x.id===id; })[0]; if(!h||!window.MCQ) return; var u=me();
  Promise.all([MCQ.loadIndex(),MCQ.loadProg()]).then(function(){
    var qs=h.qs.map(function(q){ return {i:q.i,k:q.k,q:q.q,o:q.o,a:q.a,e:q.e||'',m:q.m||''}; });
    MCQ.begin(qs,'Homework · '+h.title,{mode:'learn',timer:false,hw:{onDone:function(r){
      var ans=r.c+r.w, n=qs.length;
      if(ans<Math.ceil(n*0.8)){ toast('Attempt at least '+Math.ceil(n*0.8)+' of '+n+' questions to complete this homework','ℹ️'); return; }
      if(H.done[h.id]){ return; }
      var rec={hwId:h.id,uid:u.uid,email:u.email||'',name:u.name||'',n:n,a:ans,c:r.c,secs:r.secs,late:daysTo(h.due)<0,when:ts()};
      fbDb.collection('homeworkDone').doc(h.id+'_'+u.uid).set(rec).then(function(){ H.done[h.id]=rec; toast('Homework completed ✅ '+pct(r.c,n)+'%','✅'); }).catch(function(){ toast('Could not save completion — tell your teacher','⚠️'); });
    }}}); go('mcq');
  });
};

/* ---- staff ---- */
function chapters(){ return (window.MCQ&&MCQ.index)?MCQ.index.chapters:[]; }
function staffView(){
  var u=me(), f=H.f, chs=chapters(), exams=[],subs=[];
  if(window.MCQ&&!MCQ.index&&!H.ib){ H.ib=true; MCQ.loadIndex().then(function(){ H.ib=false; if(ROUTE.view==='homework') render(); }); }
  chs.forEach(function(c){ if(exams.indexOf(c.e)<0) exams.push(c.e); }); if(!f.exam||exams.indexOf(f.exam)<0) f.exam=exams[0]||'';
  chs.forEach(function(c){ if(c.e===f.exam&&subs.indexOf(c.s)<0) subs.push(c.s); }); if(!f.subj||subs.indexOf(f.subj)<0) f.subj=subs[0]||'';
  var list=chs.filter(function(c){ return c.e===f.exam&&c.s===f.subj; }).sort(function(a,b){ return a.c<b.c?-1:1; }), nsel=Object.keys(f.ch).filter(function(k){ return f.ch[k]; }).length;
  var mine=H.list.filter(function(h){ return u.role==='admin'||h.byUid===u.uid; });
  var ld=window.BT&&BT.list().length?'':'';
  if(!H.st&&!H.sb){ H.sb=true; loadAllStudents().then(function(s){ H.st=s.filter(function(x){ return !x.banned; }); H.sb=false; if(ROUTE.view==='homework') render(); }); }
  return shell('homework',head('📌 Homework','Assign chapter practice with a due date and see who finished')+
    card('<b style="font-size:15px">➕ Assign homework</b>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:220px">'+lbl('Title')+'<input id="hwTitle" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="80" placeholder="e.g. Optics — worksheet 1"></div>'+
      '<div>'+lbl('Due date')+'<input id="hwDue" type="date" class="mcq-sel" style="padding:9px 11px" min="'+today()+'" value="'+ymd(new Date(Date.now()+3*864e5))+'"></div>'+
      '<div>'+lbl('Questions')+'<select id="hwCount" class="mcq-sel">'+[10,15,20,30].map(function(n){ return '<option '+(f.count===n?'selected':'')+'>'+n+'</option>'; }).join('')+'</select></div>'+(window.BT?'<div>'+lbl('For')+BT.select('hwBatch','','Everyone')+'</div>':'')+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><div>'+lbl('Exam')+'<select class="mcq-sel" onchange="hwSel(\'exam\',this.value)">'+exams.map(function(e){ return '<option '+(e===f.exam?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div><div>'+lbl('Subject')+'<select class="mcq-sel" onchange="hwSel(\'subj\',this.value)">'+subs.map(function(e){ return '<option '+(e===f.subj?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div></div>'+
      lbl('Chapters (up to 3) — '+nsel+' chosen')+'<div style="max-height:200px;overflow:auto">'+list.map(function(c){ return '<div class="mcq-row '+(f.ch[c.k]?'on':'')+'" onclick="hwCh(\''+esc(c.k)+'\')"><input type="checkbox" '+(f.ch[c.k]?'checked':'')+'><span class="nm">'+esc(c.c)+'</span><small>'+c.n+' Q</small></div>'; }).join('')+'</div>'+
      lbl('Note for students (optional)')+'<input id="hwNote" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="140" placeholder="e.g. Revise lens formula first">'+
      '<button class="btn btn-primary" style="margin-top:12px" onclick="hwCreate()" '+(H.cb?'disabled':'')+'>'+(H.cb?'Creating…':'Assign homework →')+'</button>')+
    '<h3 style="font-size:15px;margin:18px 0 10px">Assigned homework</h3>'+
    (mine.length?mine.map(function(h){ return hwCard(h); }).join(''):note('📌','Nothing assigned yet.')));
}
function targets(h){ return (H.st||[]).filter(function(s){ return !h.batchId||s.batchId===h.batchId; }); }
function hwCard(h){
  var dn=H.det[h.id], tg=targets(h), open=H.open===h.id, dd=daysTo(h.due);
  return card('<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>'+esc(h.title)+'</b><div style="font-size:12.5px;color:var(--muted)">'+esc(h.subject)+' · '+esc((h.chs||[]).join(', '))+' · '+h.count+' Q · '+esc(dueTxt(h.due))+(h.batchName?' · 🎓 '+esc(h.batchName):' · everyone')+'</div></div>'+
    (dn?'<span class="pill '+(dn.length>=tg.length&&tg.length?'pill-green':'pill-gold')+'">'+dn.length+' / '+tg.length+' done</span>':'')+
    '<button class="btn btn-outline btn-sm" onclick="hwOpen(\''+h.id+'\')">'+(open?'Hide':'Progress')+'</button><button class="btn btn-ghost btn-sm" onclick="hwDel(\''+h.id+'\')">Delete</button></div>'+
    (open?(dn?progress(h,dn,tg):'<div style="margin-top:10px;font-size:13px;color:var(--muted)">Loading…</div>'):''),'padding:14px 18px');
}
function progress(h,dn,tg){
  var by={}; dn.forEach(function(d){ by[d.uid]=d; }); var pend=tg.filter(function(s){ return !by[s.uid]; }), avg=dn.length?Math.round(dn.reduce(function(a,d){ return a+pct(d.c,d.n); },0)/dn.length):null;
  return '<div style="margin-top:12px;display:flex;gap:18px;flex-wrap:wrap;font-size:13.5px"><span>Done: <b>'+dn.length+'</b></span><span>Pending: <b style="color:'+(pend.length?'var(--red-600)':'var(--green-700)')+'">'+pend.length+'</b></span><span>Average score: <b>'+(avg===null?'—':avg+'%')+'</b></span><span>Late: <b>'+dn.filter(function(d){ return d.late; }).length+'</b></span></div>'+
    '<div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap">'+(pend.length?'<button class="btn btn-gold btn-sm" onclick="hwRemind(\''+h.id+'\')">🔔 Remind '+pend.length+' pending</button>':'')+'<button class="btn btn-outline btn-sm" onclick="hwCsv(\''+h.id+'\')">⬇ CSV</button></div>'+
    '<div style="max-height:260px;overflow:auto"><table class="table-simple"><thead><tr><th>Student</th><th>Status</th><th>Score</th></tr></thead><tbody>'+
    dn.map(function(d){ return '<tr><td>'+esc(d.name||d.email)+'</td><td><span class="pill '+(d.late?'pill-gold':'pill-green')+'">'+(d.late?'Done (late)':'Done')+'</span></td><td><b>'+pct(d.c,d.n)+'%</b> ('+d.c+'/'+d.n+')</td></tr>'; }).join('')+
    pend.map(function(s){ return '<tr><td>'+esc(s.name||s.email)+'</td><td><span class="pill pill-red">Pending</span></td><td>—</td></tr>'; }).join('')+'</tbody></table></div>';
}
window.hwSel=function(k,v){ H.f[k]=v; if(k==='exam'||k==='subj') H.f.ch={}; H.f.count=+val('hwCount')||H.f.count; keepForm(); render(); restoreForm(); };
var KEEP={};
function keepForm(){ ['hwTitle','hwDue','hwNote','hwBatch'].forEach(function(id){ var e=document.getElementById(id); if(e) KEEP[id]=e.value; }); }
function restoreForm(){ Object.keys(KEEP).forEach(function(id){ var e=document.getElementById(id); if(e&&KEEP[id]!==undefined) e.value=KEEP[id]; }); }
window.hwCh=function(k){ keepForm(); var n=Object.keys(H.f.ch).filter(function(x){ return H.f.ch[x]; }).length; if(!H.f.ch[k]&&n>=3){ toast('Choose up to 3 chapters','⚠️'); return; } H.f.ch[k]=!H.f.ch[k]; H.f.count=+val('hwCount')||H.f.count; render(); restoreForm(); };
window.hwCreate=async function(){
  var u=me(), f=H.f, title=val('hwTitle'), due=val('hwDue'), count=+val('hwCount')||20, bid=val('hwBatch'), noteT=val('hwNote'), keys=Object.keys(f.ch).filter(function(k){ return f.ch[k]; });
  if(!title){ toast('Give the homework a title','⚠️'); return; } if(!keys.length){ toast('Choose at least one chapter','⚠️'); return; } if(!due||due<today()){ toast('Pick a due date from today onwards','⚠️'); return; }
  H.cb=true; render();
  try{
    var names=[], per=Math.ceil(count/keys.length), qs=[];
    for(var i=0;i<keys.length;i++){ var ch=MCQ.chapByKey(keys[i]); names.push(ch?ch.c:keys[i]); var pool=await MCQ.loadChapter(keys[i]); qs=qs.concat(shuffle(pool).slice(0,per).map(function(q){ return {i:q.i,k:keys[i],q:q.q,o:q.o,a:q.a,e:q.e||'',m:q.m||''}; })); }
    qs=shuffle(qs).slice(0,count); if(!qs.length){ H.cb=false; toast('No questions found in those chapters','⚠️'); render(); return; }
    if(JSON.stringify(qs).length>400000){ H.cb=false; toast('Homework is too large — choose fewer questions','⚠️'); render(); return; }
    var bn=window.BT?BT.name(bid):'';
    await fbDb.collection('homework').add({title:title.slice(0,80),exam:f.exam,subject:f.subj,chs:names.slice(0,3),count:qs.length,due:due,batchId:bid,batchName:bn,note:noteT.slice(0,140),qs:qs,by:u.name||'',byUid:u.uid,when:ts()});
    var st=(H.st||(await loadAllStudents())).filter(function(s){ return !s.banned&&s.email&&(!bid||s.batchId===bid); }), b=fbDb.batch(), n=0;
    for(var j=0;j<st.length;j++){ b.set(fbDb.collection('notifications').doc(),{toEmail:st[j].email,title:'📌 New homework',msg:title+' ('+f.subj+', '+qs.length+' questions) — due '+due+'.',kind:'homework',by:u.name||'',when:ts(),read:false}); n++; if(n%400===0){ await b.commit(); b=fbDb.batch(); } }
    if(n%400) await b.commit();
    H.cb=false; H.list=null; H.f.ch={}; KEEP={}; toast('Homework assigned ✅ — '+n+' students notified'); render();
  }catch(e){ H.cb=false; toast(e.message||'Could not assign','⚠️'); render(); }
};
window.hwOpen=function(id){ H.open=H.open===id?'':id; if(H.open&&!H.det[id]){ fbDb.collection('homeworkDone').where('hwId','==',id).get().then(function(s){ H.det[id]=s.docs.map(function(d){ return d.data(); }); render(); }).catch(function(){ H.det[id]=[]; render(); }); } render(); };
window.hwRemind=async function(id){
  var h=H.list.filter(function(x){ return x.id===id; })[0], dn=H.det[id]||[], by={}; dn.forEach(function(d){ by[d.uid]=1; });
  var pend=targets(h).filter(function(s){ return !by[s.uid]&&s.email; }); if(!pend.length) return; if(!confirm('Send a reminder to '+pend.length+' student(s)?')) return;
  try{ var b=fbDb.batch(), n=0, u=me(); for(var i=0;i<pend.length;i++){ b.set(fbDb.collection('notifications').doc(),{toEmail:pend[i].email,title:'⏰ Homework reminder',msg:h.title+' — '+dueTxt(h.due).toLowerCase()+'. Open Homework to finish it.',kind:'homework',by:u.name||'',when:ts(),read:false}); n++; if(n%400===0){ await b.commit(); b=fbDb.batch(); } } if(n%400) await b.commit(); toast('Reminder sent to '+pend.length+' ✅'); }catch(e){ toast(e.message,'⚠️'); }
};
window.hwCsv=function(id){ var h=H.list.filter(function(x){ return x.id===id; })[0], dn=H.det[id]||[], by={}; dn.forEach(function(d){ by[d.uid]=d; }); csv('homework-'+String(h.title).replace(/\W+/g,'-'),[['Student','Email','Status','Correct','Questions','Score %','Late']].concat(targets(h).map(function(s){ var d=by[s.uid]; return [s.name||'',s.email||'',d?'Done':'Pending',d?d.c:'',d?d.n:'',d?pct(d.c,d.n):'',d?(d.late?'Yes':'No'):'']; }))); };
window.hwDel=function(id){ if(!confirm('Delete this homework? Student completion records stay saved.')) return; fbDb.collection('homework').doc(id).delete().then(function(){ H.list=null; toast('Deleted'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };

/* ---- parent: child's homework ---- */
window.renderParentHomework=function(){
  if(!me()) return renderAuth(); if(!live()) return shell('parenthomework',note('⚡','Works in live mode.'));
  var P=H.ps=H.ps||{};
  if(!P.links){ if(!P.b){ P.b=true; loadParentLinks().then(function(l){ P.links=l.filter(function(x){ return x.status==='approved'; }); P.b=false; if(ROUTE.view==='parenthomework') render(); }); } return shell('parenthomework',head('📌 Homework','')+note('⏳','Loading…')); }
  if(!P.links.length) return shell('parenthomework',head('📌 Homework','')+note('👪','Link and get approval for a child account first.'));
  var em=(ROUTE.params&&ROUTE.params.child)||P.email||P.links[0].childEmail;
  if(P.email!==em||!P.data){ if(!P.b2){ P.email=em; P.data=null; P.b2=true;
      Promise.all([loadChildData(em),fbDb.collection('homework').orderBy('when','desc').limit(40).get().then(function(s){ return s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); }),fbDb.collection('homeworkDone').where('email','==',em).get().then(function(s){ var m={}; s.docs.forEach(function(d){ m[d.data().hwId]=d.data(); }); return m; })])
        .then(function(r){ P.data={profile:(r[0]||{}).profile||{},list:r[1],done:r[2]}; P.b2=false; if(ROUTE.view==='parenthomework') render(); }).catch(function(){ P.b2=false; P.data={profile:{},list:[],done:{}}; render(); }); }
    return shell('parenthomework',head('📌 Homework','')+note('⏳','Loading…')); }
  var D=P.data, bid=D.profile.batchId||'', rows=D.list.filter(function(h){ return !h.batchId||h.batchId===bid; }), pend=rows.filter(function(h){ return !D.done[h.id]; });
  return shell('parenthomework',head('📌 Homework',esc(em))+(P.links.length>1?'<div class="mcq-tabs">'+P.links.map(function(l){ return '<button class="mcq-chip '+(l.childEmail===em?'on':'')+'" onclick="hwPick(\''+esc(l.childEmail)+'\')">'+esc(l.childEmail)+'</button>'; }).join('')+'</div>':'')+
    '<div class="stat-row"><div class="card stat-box"><b>'+rows.length+'</b><span>Assigned</span></div><div class="card stat-box"><b style="color:var(--green-700)">'+(rows.length-pend.length)+'</b><span>Completed</span></div><div class="card stat-box"><b style="color:'+(pend.length?'var(--red-600)':'var(--green-700)')+'">'+pend.length+'</b><span>Pending</span></div></div>'+
    (rows.length?rows.map(function(h){ var d=D.done[h.id]; return card('<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>'+esc(h.title)+'</b><div style="font-size:12.5px;color:var(--muted)">'+esc(h.subject)+' · '+esc(dueTxt(h.due))+'</div></div>'+(d?'<span class="pill pill-green">Done · '+pct(d.c,d.n)+'%'+(d.late?' (late)':'')+'</span>':'<span class="pill '+(daysTo(h.due)<0?'pill-red':'pill-gold')+'">Pending</span>')+'</div>','padding:12px 16px;margin-bottom:8px'); }).join(''):note('📌','No homework yet.')));
};
window.hwPick=function(e){ H.ps.email=e; H.ps.data=null; render(); };

var _go=window.go; window.go=function(v,p){ if(v==='homework'){ H.list=null; H.det={}; H.open=''; } if(v==='parenthomework'&&!(p&&p.child)&&H.ps) H.ps.data=null; return _go(v,p); };
})();
