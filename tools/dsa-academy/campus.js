/* =========================================================================
   Dr. Shreyansh Academy — Campus (campus.js)
   NEW screens only; no existing screen is modified.
     Step 1  Timetable + live-class links   (staff post, everyone views)
     Step 2  Resource Library (links to PDFs / videos / notes)
     Step 3  Attendance (faculty marks, student/parent/admin view)
   ========================================================================= */
(function(){
'use strict';
var C={tt:null,res:null,rf:'All',att:null,fa:null,pa:null,aa:null};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return ymd(new Date()); }
function pct(a,b){ return b>0?Math.round(a*100/b):0; }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function again(v){ if(ROUTE.view===v) render(); }
function me(){ return DB.currentUser; }
function isStaff(){ var u=me(); return !!u && (u.role==='admin' || (u.role==='faculty' && u.approved!==false)); }
function shell(a,b){ return '<div class="app-shell">'+sidebar(a)+'<div class="main" style="max-width:980px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(x||'')+'">'+i+'</div>'; }
function h3(t){ return '<h3 style="font-size:15px;margin:0 0 12px">'+t+'</h3>'; }
function guard(v){ if(!me()) return renderAuth(); if(!live()) return shell(v,note('⚡','This feature works in live mode. Connect Firebase first.')); return null; }
function safeUrl(u){ u=String(u||'').trim(); return /^https:\/\/[^\s<>"']+$/i.test(u)?u:''; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function subjects(){ return (typeof SUBJECTS!=='undefined'&&SUBJECTS.length)?SUBJECTS:['Physics','Chemistry','Biology']; }
function subjSel(id,sel,all){ return '<select id="'+id+'" class="mcq-sel">'+(all?'<option value="">All subjects</option>':'')+subjects().map(function(s){ return '<option '+(sel===s?'selected':'')+'>'+esc(s)+'</option>'; }).join('')+'</select>'; }
function inp(id,ph,type,extra){ return '<input id="'+id+'" type="'+(type||'text')+'" placeholder="'+ph+'" '+(extra||'')+' class="mcq-sel" style="padding:9px 11px">'; }
function lbl(t){ return '<div style="font-size:12px;color:var(--muted);margin:0 0 4px">'+t+'</div>'; }
function fmtDay(ds){ var d=new Date(ds+'T00:00:00'), t=today(); return (ds===t?'Today · ':(ds===ymd(new Date(Date.now()+864e5))?'Tomorrow · ':''))+d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}); }
function fmtTime(t){ if(!t) return ''; var p=t.split(':'), h=+p[0]; return ((h%12)||12)+':'+p[1]+' '+(h>=12?'PM':'AM'); }

/* ====================== STEP 1 — TIMETABLE + LIVE CLASS ==================== */
window.renderTimetable=function(){
  var g=guard('timetable'); if(g) return g;
  if(!C.tt){ if(!C.ttb){ C.ttb=true;
      fbDb.collection('schedule').where('date','>=',today()).orderBy('date').limit(80).get()
        .then(function(s){ C.tt=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); })
        .catch(function(){ C.tt=[]; }).then(function(){ C.ttb=false; again('timetable'); }); }
    return shell('timetable',head('🗓 Timetable','Upcoming classes')+note('⏳','Loading…')); }
  var by={}; C.tt.forEach(function(c){ (by[c.date]=by[c.date]||[]).push(c); });
  var days=Object.keys(by).sort(), u=me(), staff=isStaff();
  return shell('timetable',head('🗓 Timetable','Upcoming classes and live-class links')+
    (staff?card(h3('➕ Schedule a class')+'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">'+
      '<div>'+lbl('Date')+inp('ttDate','','date','value="'+today()+'" min="'+today()+'"')+'</div><div>'+lbl('Time')+inp('ttTime','','time','value="17:00"')+'</div>'+
      '<div>'+lbl('Subject')+subjSel('ttSub',u.subject||'')+'</div><div style="flex:1;min-width:160px">'+lbl('Topic / chapter')+inp('ttTopic','e.g. Thermodynamics – Part 2','text','maxlength="90" style="width:100%"')+'</div>'+
      '<div style="flex:1;min-width:200px">'+lbl('Live class link (Zoom / Meet / YouTube, https)')+inp('ttLink','https://…','url','style="width:100%"')+'</div>'+
      '<button class="btn btn-primary btn-sm" onclick="cTtAdd()">Add class</button></div>'):'')+
    (days.length?days.map(function(d){
      return card(h3(esc(fmtDay(d)))+by[d].sort(function(a,b){ return (a.time||'')<(b.time||'')?-1:1; }).map(function(c){
        var l=safeUrl(c.link), mine=staff&&(u.role==='admin'||c.byUid===u.uid);
        return '<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--border);flex-wrap:wrap"><div style="min-width:74px;font-weight:700;font-size:14px">'+esc(fmtTime(c.time))+'</div><div style="flex:1;min-width:150px"><b>'+esc(c.subject)+'</b> · '+esc(c.topic||'Class')+'<div style="font-size:12px;color:var(--muted)">'+esc(c.teacher||'')+'</div></div>'+
          (l?'<a class="btn btn-green btn-sm" href="'+esc(l)+'" target="_blank" rel="noopener">🎥 Join class</a>':'<span class="pill pill-navy">Offline / link soon</span>')+
          (mine?'<button class="btn btn-ghost btn-sm" onclick="cTtDel(\''+c.id+'\')">Delete</button>':'')+'</div>'; }).join(''));
    }).join(''):note('📭','No upcoming classes scheduled yet.')));
};
window.cTtAdd=function(){
  var d=val('ttDate'), t=val('ttTime'), top=val('ttTopic'), l=val('ttLink'), u=me();
  if(!d||!t){ toast('Choose date and time','⚠️'); return; }
  if(l&&!safeUrl(l)){ toast('Link must start with https://','⚠️'); return; }
  fbDb.collection('schedule').add({date:d,time:t,dur:60,subject:val('ttSub'),topic:top.slice(0,90),teacher:u.name||'',link:l,by:u.name||'',byUid:u.uid,when:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ toast('Class scheduled ✅'); C.tt=null; render(); }).catch(function(e){ toast(e.message,'⚠️'); });
};
window.cTtDel=function(id){ if(!confirm('Delete this class?')) return; fbDb.collection('schedule').doc(id).delete().then(function(){ C.tt=null; toast('Deleted'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };

/* ====================== STEP 2 — RESOURCE LIBRARY ========================== */
var RTYPES=['Notes (PDF)','Video','Formula sheet','Practice sheet','Link'];
window.renderResources=function(){
  var g=guard('resources'); if(g) return g;
  if(!C.res){ if(!C.resb){ C.resb=true;
      fbDb.collection('resources').orderBy('when','desc').limit(150).get()
        .then(function(s){ C.res=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); })
        .catch(function(){ C.res=[]; }).then(function(){ C.resb=false; again('resources'); }); }
    return shell('resources',head('📂 Resource Library','Notes, videos and sheets from your teachers')+note('⏳','Loading…')); }
  var u=me(), staff=isStaff(), f=C.rf, rows=C.res.filter(function(r){ return f==='All'||r.subject===f; });
  return shell('resources',head('📂 Resource Library','Notes, videos, formula sheets and practice sheets')+
    '<div class="mcq-tabs">'+['All'].concat(subjects()).map(function(s){ return '<button class="mcq-chip '+(f===s?'on':'')+'" onclick="cResF(\''+esc(s)+'\')">'+esc(s)+'</button>'; }).join('')+'</div>'+
    (staff?card(h3('➕ Add a resource')+'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end"><div>'+lbl('Subject')+subjSel('rsSub',u.subject||'')+'</div><div>'+lbl('Type')+'<select id="rsType" class="mcq-sel">'+RTYPES.map(function(t){ return '<option>'+t+'</option>'; }).join('')+'</select></div>'+
      '<div>'+lbl('Chapter (optional)')+inp('rsCh','e.g. Laws of Motion','text','maxlength="60"')+'</div><div style="flex:1;min-width:150px">'+lbl('Title')+inp('rsTitle','e.g. Kinematics formula sheet','text','maxlength="90" style="width:100%"')+'</div>'+
      '<div style="flex:1;min-width:200px">'+lbl('Link (Google Drive / YouTube / PDF — https)')+inp('rsUrl','https://…','url','style="width:100%"')+'</div><button class="btn btn-primary btn-sm" onclick="cResAdd()">Add</button></div>'+
      '<div style="font-size:12px;color:var(--muted);margin-top:8px">Tip: upload the file to Google Drive, set sharing to “Anyone with the link”, and paste the link here.</div>'):'')+
    (rows.length?rows.map(function(r){ var l=safeUrl(r.url), mine=staff&&(u.role==='admin'||r.byUid===u.uid);
      return '<div class="card" style="padding:12px 16px;margin-bottom:8px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="pill pill-navy">'+esc(r.type||'Link')+'</span><div style="flex:1;min-width:160px"><b>'+esc(r.title)+'</b><div style="font-size:12px;color:var(--muted)">'+esc(r.subject)+(r.chapter?' · '+esc(r.chapter):'')+' · '+esc(r.by||'')+'</div></div>'+
        (l?'<a class="btn btn-outline btn-sm" href="'+esc(l)+'" target="_blank" rel="noopener">Open →</a>':'')+(mine?'<button class="btn btn-ghost btn-sm" onclick="cResDel(\''+r.id+'\')">Delete</button>':'')+'</div>'; }).join(''):note('📭','No resources here yet.')));
};
window.cResF=function(s){ C.rf=s; render(); };
window.cResAdd=function(){
  var t=val('rsTitle'), l=val('rsUrl'), u=me();
  if(!t||!safeUrl(l)){ toast('Add a title and a valid https:// link','⚠️'); return; }
  fbDb.collection('resources').add({subject:val('rsSub'),chapter:val('rsCh').slice(0,60),title:t.slice(0,90),url:l,type:val('rsType'),by:u.name||'',byUid:u.uid,when:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ toast('Resource added ✅'); C.res=null; render(); }).catch(function(e){ toast(e.message,'⚠️'); });
};
window.cResDel=function(id){ if(!confirm('Delete this resource?')) return; fbDb.collection('resources').doc(id).delete().then(function(){ C.res=null; toast('Deleted'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };

/* ====================== STEP 3 — ATTENDANCE ================================ */
function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-'); }
function summarize(rows){ var P=0,t=0,by={}; rows.forEach(function(r){ t++; if(r.status==='P') P++; var b=by[r.subject]=by[r.subject]||{p:0,t:0}; b.t++; if(r.status==='P') b.p++; }); return {p:P,t:t,by:by}; }
function attView(rows,who){
  var s=summarize(rows), p=pct(s.p,s.t), col=p>=75?'var(--green-500)':(p>=60?'var(--gold-500)':'var(--red-500)');
  return '<div class="stat-row"><div class="card stat-box"><b style="color:'+col+'">'+(s.t?p+'%':'—')+'</b><span>Overall attendance</span></div><div class="card stat-box"><b>'+s.p+'</b><span>Classes attended</span></div><div class="card stat-box"><b>'+(s.t-s.p)+'</b><span>Classes missed</span></div><div class="card stat-box"><b>'+s.t+'</b><span>Classes recorded</span></div></div>'+
    (s.t&&p<75?card('<b style="color:var(--red-600)">⚠️ '+esc(who)+' attendance is below 75%.</b> Regular classes make a big difference in exam results.','background:var(--red-100);border-color:var(--red-500)'):'')+
    card(h3('Subject-wise')+(Object.keys(s.by).length?Object.keys(s.by).map(function(k){ var b=s.by[k], q=pct(b.p,b.t); return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><b>'+esc(k)+'</b><span>'+b.p+' / '+b.t+' ('+q+'%)</span></div><div style="height:8px;border-radius:5px;background:var(--paper-2);overflow:hidden"><i style="display:block;height:100%;width:'+q+'%;background:'+(q>=75?'var(--green-500)':'var(--gold-500)')+'"></i></div></div>'; }).join(''):'<div style="font-size:13px;color:var(--muted)">No attendance recorded yet.</div>'))+
    card(h3('Recent classes')+(rows.length?'<table class="table-simple"><tbody>'+rows.slice().sort(function(a,b){ return a.date<b.date?1:-1; }).slice(0,15).map(function(r){ return '<tr><td>'+esc(r.date)+'</td><td>'+esc(r.subject)+'</td><td><span class="pill '+(r.status==='P'?'pill-green':'pill-red')+'">'+(r.status==='P'?'Present':'Absent')+'</span></td></tr>'; }).join('')+'</tbody></table>':'<div style="font-size:13px;color:var(--muted)">Nothing yet.</div>'));
}
window.renderMyAttendance=function(){
  var g=guard('myattendance'); if(g) return g;
  if(!C.att){ if(!C.attb){ C.attb=true; fbDb.collection('attendance').where('email','==',me().email).get().then(function(s){ C.att=s.docs.map(function(d){ return d.data(); }); }).catch(function(){ C.att=[]; }).then(function(){ C.attb=false; again('myattendance'); }); }
    return shell('myattendance',head('✅ My Attendance','')+note('⏳','Loading…')); }
  return shell('myattendance',head('✅ My Attendance','Marked by your teachers after each class')+attView(C.att,'Your'));
};
window.renderParentAttendance=function(){
  var g=guard('parentattendance'); if(g) return g;
  var pa=C.pa=C.pa||{};
  if(!pa.links){ if(!pa.b){ pa.b=true; loadParentLinks().then(function(l){ pa.links=l.filter(function(x){ return x.status==='approved'; }); pa.b=false; again('parentattendance'); }); } return shell('parentattendance',head('✅ Attendance','')+note('⏳','Loading…')); }
  if(!pa.links.length) return shell('parentattendance',head('✅ Attendance','')+note('👪','Link and get approval for a child account first.'));
  var em=(ROUTE.params&&ROUTE.params.child)||pa.email||pa.links[0].childEmail;
  if(pa.email!==em||!pa.rows){ if(!pa.b2){ pa.email=em; pa.rows=null; pa.b2=true; fbDb.collection('attendance').where('email','==',em).get().then(function(s){ pa.rows=s.docs.map(function(d){ return d.data(); }); }).catch(function(){ pa.rows=[]; }).then(function(){ pa.b2=false; again('parentattendance'); }); }
    return shell('parentattendance',head('✅ Attendance','')+note('⏳','Loading…')); }
  return shell('parentattendance',head('✅ Attendance',esc(em))+(pa.links.length>1?'<div class="mcq-tabs">'+pa.links.map(function(l){ return '<button class="mcq-chip '+(l.childEmail===em?'on':'')+'" onclick="cPaPick(\''+esc(l.childEmail)+'\')">'+esc(l.childEmail)+'</button>'; }).join('')+'</div>':'')+attView(pa.rows,'Your child\'s'));
};
window.cPaPick=function(e){ C.pa.email=e; C.pa.rows=null; render(); };

/* faculty: mark attendance */
window.renderFacultyAttendance=function(){
  var g=guard('facultyattendance'); if(g) return g;
  var u=me(), fa=C.fa=C.fa||{date:today(),sub:u.subject||subjects()[0],absent:{}};
  if(!fa.students){ if(!fa.b){ fa.b=true; loadAllStudents().then(function(s){ fa.students=s.filter(function(x){ return !x.banned; }).sort(function(a,b){ return String(a.name).localeCompare(String(b.name)); }); fa.b=false; again('facultyattendance'); }); }
    return shell('facultyattendance',head('✅ Attendance','')+note('⏳','Loading students…')); }
  var abs=Object.keys(fa.absent).filter(function(k){ return fa.absent[k]; }).length;
  return shell('facultyattendance',head('✅ Mark Attendance','Everyone starts as present — tap to mark absent')+
    card('<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end"><div>'+lbl('Date')+inp('atDate','','date','value="'+esc(fa.date)+'" max="'+today()+'" onchange="cAtCtl()"')+'</div><div>'+lbl('Subject')+subjSel('atSub',fa.sub).replace('<select','<select onchange="cAtCtl()"')+'</div>'+
      '<button class="btn btn-primary btn-sm" onclick="cAtSave()">Save attendance ('+(fa.students.length-abs)+' present · '+abs+' absent)</button></div>')+
    (fa.students.length?'<div class="card" style="padding:8px 10px;max-height:520px;overflow:auto">'+fa.students.map(function(s){ var a=!!fa.absent[s.uid];
      return '<div class="mcq-row '+(a?'':'on')+'" onclick="cAtTog(\''+s.uid+'\')"><span class="nm">'+esc(s.name||s.email)+'</span><span class="pill '+(a?'pill-red':'pill-green')+'">'+(a?'Absent':'Present')+'</span></div>'; }).join('')+'</div>':note('👥','No students registered yet.')));
};
window.cAtCtl=function(){ var f=C.fa; f.date=val('atDate')||f.date; f.sub=val('atSub')||f.sub; };
window.cAtTog=function(uid){ cAtCtl(); C.fa.absent[uid]=!C.fa.absent[uid]; render(); };
window.cAtSave=async function(){
  cAtCtl(); var f=C.fa, u=me(); if(!f.date){ toast('Pick a date','⚠️'); return; }
  if(f.date>today()){ toast('Cannot mark attendance for a future date','⚠️'); return; }
  try{
    for(var i=0;i<f.students.length;i+=400){ var b=fbDb.batch();
      f.students.slice(i,i+400).forEach(function(s){ b.set(fbDb.collection('attendance').doc(f.date+'_'+slug(f.sub)+'_'+s.uid),{uid:s.uid,email:s.email,name:s.name||'',date:f.date,subject:f.sub,status:f.absent[s.uid]?'A':'P',by:u.name||'',when:firebase.firestore.FieldValue.serverTimestamp()}); });
      await b.commit(); }
    toast('Attendance saved for '+f.students.length+' students ✅'); f.absent={}; C.aa=null;
  }catch(e){ toast(e.message||'Could not save','⚠️'); }
};

/* admin: attendance overview */
window.renderAdminAttendance=function(){
  var g=guard('adminattendance'); if(g) return g;
  if(!C.aa){ if(!C.aab){ C.aab=true; Promise.all([loadAllStudents(),fbDb.collection('attendance').orderBy('date','desc').limit(3000).get().then(function(s){ return s.docs.map(function(d){ return d.data(); }); }).catch(function(){ return []; })])
      .then(function(a){ C.aa={st:a[0],rows:a[1]}; C.aab=false; again('adminattendance'); }); }
    return shell('adminattendance',head('✅ Attendance overview','')+note('⏳','Loading…')); }
  var by={}; C.aa.rows.forEach(function(r){ (by[r.email]=by[r.email]||[]).push(r); });
  var list=Object.keys(by).map(function(e){ var s=summarize(by[e]); var st=C.aa.st.filter(function(x){ return x.email===e; })[0]; return {n:(st&&st.name)||(by[e][0].name)||e,e:e,p:pct(s.p,s.t),t:s.t}; }).sort(function(a,b){ return a.p-b.p; });
  var low=list.filter(function(x){ return x.p<75&&x.t>=3; }), all=summarize(C.aa.rows);
  return shell('adminattendance',head('✅ Attendance overview','All students, latest 3000 records')+
    '<div class="stat-row"><div class="card stat-box"><b>'+pct(all.p,all.t)+'%</b><span>Overall attendance</span></div><div class="card stat-box"><b>'+list.length+'</b><span>Students tracked</span></div><div class="card stat-box" ><b style="color:var(--red-600)">'+low.length+'</b><span>Below 75%</span></div><div class="card stat-box"><b>'+all.t+'</b><span>Records</span></div></div>'+
    card(h3('Students needing attention (below 75%)')+(low.length?'<table class="table-simple"><thead><tr><th>Student</th><th>Attendance</th><th>Classes</th></tr></thead><tbody>'+low.map(function(x){ return '<tr><td>'+esc(x.n)+'</td><td><span class="pill pill-red">'+x.p+'%</span></td><td>'+x.t+'</td></tr>'; }).join('')+'</tbody></table>':'<div style="font-size:13px;color:var(--muted)">Nobody below 75% 🎉</div>')));
};

var _go=window.go; window.go=function(v,p){ if(v==='timetable') C.tt=null; if(v==='resources') C.res=null; if(v==='myattendance') C.att=null; if(v==='parentattendance'&&!(p&&p.child)&&C.pa) C.pa.rows=null; if(v==='facultyattendance'&&C.fa){ C.fa.students=null; } if(v==='adminattendance') C.aa=null; return _go(v,p); };
})();
