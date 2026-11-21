/* =========================================================================
   Dr. Shreyansh Academy — Add Questions (qbank.js)
   Faculty (and the admin) add MCQs straight into the question bank:
     • one at a time, or paste many in a simple format
     • optional figure/diagram image (link) and tags
     • duplicate check against the chapter before sending
     • the admin reviews and publishes from  kspiderai.in/admin → DSA Admin → 🏗 Question Bank
   No CSV, no re-sync, no cost. Questions go live the moment they are approved.
   ========================================================================= */
(function(){
'use strict';
var Q={tab:'one',exam:'',subj:'',ch:'',f:{},mine:null,mb:false,bulk:'',prev:null,busy:false};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function me(){ return DB.currentUser; }
function isStaff(){ var u=me(); return !!u&&(u.role==='admin'||(u.role==='faculty'&&u.approved!==false)); }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function slug(s){ return String(s).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function norm(s){ return String(s).toLowerCase().replace(/[^a-z0-9]/g,''); }
function shell(b){ return '<div class="app-shell">'+sidebar('qauthor')+'<div class="main" style="max-width:900px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(x||'')+'">'+i+'</div>'; }
function lbl(t){ return '<div style="font-size:12px;color:var(--muted);margin:10px 0 4px">'+t+'</div>'; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
var TAGS=['','High-Yield','Quick-Fire','Diagram-Based','Assertion-Reason','Numerical','Advanced','Conceptual','2026 Expected'];

/* ---- shared helpers (also useful from other modules) ---- */
function normImg(u){
  u=String(u||'').trim(); if(!u) return {ok:true,v:''};
  var d=u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)||u.match(/drive\.google\.com\/open\?id=([\w-]+)/);
  if(d) u='https://lh3.googleusercontent.com/d/'+d[1];
  if(!/^https:\/\/[^\s<>"']{4,300}$/.test(u)) return {ok:false};
  return {ok:true,v:u};
}
function check(q){
  var errs=[]; if(!q.q||q.q.length<12) errs.push('Question is too short');
  if(q.q&&q.q.length>600) errs.push('Question is longer than 600 characters');
  if(!q.o||q.o.length!==4||q.o.some(function(x){ return !x; })) errs.push('All four options are required');
  else { var s={}; q.o.forEach(function(x){ s[x.toLowerCase()]=1; }); if(Object.keys(s).length<4) errs.push('Two options are the same'); if(q.o.some(function(x){ return x.length>240; })) errs.push('An option is too long'); }
  if(!(q.a>=0&&q.a<4)) errs.push('Choose the correct option');
  if(q.e&&q.e.length>600) errs.push('Explanation is longer than 600 characters');
  return errs;
}
window.QB={slug:slug,norm:norm,normImg:normImg,check:check,tags:TAGS};

/* ---- bulk text format:  Q: / A: B: C: D: / Ans: / Exp: / Img: / Tag: ---- */
function parseMany(text){
  var out=[],errs=[];
  String(text).replace(/\r/g,'').split(/\n\s*\n/).forEach(function(b,bi){
    var lines=b.split('\n').map(function(l){ return l.trim(); }).filter(Boolean); if(!lines.length) return;
    var q={q:'',o:['','','',''],a:-1,e:'',img:'',tag:''}, cur='q', m;
    lines.forEach(function(l){
      if((m=l.match(/^(?:Q\s*\d*\s*[:.)]|\d+\s*[.)])\s*(.*)$/i))){ q.q=m[1]; cur='q'; }
      else if((m=l.match(/^\(?([A-D])\s*[:.)]\s*(.*)$/i))){ q.o['ABCD'.indexOf(m[1].toUpperCase())]=m[2]; cur='o'; }
      else if((m=l.match(/^(?:Ans(?:wer)?|Correct)\s*[:=\-]?\s*\(?([A-D])\)?\b/i))){ q.a='ABCD'.indexOf(m[1].toUpperCase()); }
      else if((m=l.match(/^(?:Exp(?:lanation)?|Sol(?:ution)?)\s*[:=\-]?\s*(.*)$/i))){ q.e=m[1]; cur='e'; }
      else if((m=l.match(/^(?:Img|Image|Figure)\s*[:=]\s*(\S+)/i))){ q.img=m[1]; }
      else if((m=l.match(/^Tag\s*[:=]\s*(.+)$/i))){ q.tag=m[1].trim(); }
      else if(cur==='q') q.q+=' '+l; else if(cur==='e') q.e+=' '+l;
    });
    var e=check(q), im=normImg(q.img); if(!im.ok) e.push('Image link must start with https://'); q.img=im.v;
    if(q.tag&&TAGS.indexOf(q.tag)<0) q.tag='';
    if(e.length) errs.push('Question '+(bi+1)+': '+e[0]); else out.push(q);
  });
  return {qs:out,errs:errs};
}
window.QB.parseMany=parseMany;

/* ---- screen ---- */
function chapters(){ return (window.MCQ&&MCQ.index)?MCQ.index.chapters:[]; }
function sel(){
  var chs=chapters(), exams=[],subs=[],list=[];
  chs.forEach(function(c){ if(exams.indexOf(c.e)<0) exams.push(c.e); });
  if(!Q.exam||exams.indexOf(Q.exam)<0) Q.exam=exams[0]||'NEET';
  chs.forEach(function(c){ if(c.e===Q.exam&&subs.indexOf(c.s)<0) subs.push(c.s); });
  if(!Q.subj||subs.indexOf(Q.subj)<0) Q.subj=subs[0]||'Physics';
  list=chs.filter(function(c){ return c.e===Q.exam&&c.s===Q.subj; }).sort(function(a,b){ return a.c<b.c?-1:1; });
  return {exams:exams.length?exams:['NEET','JEE','JEE Advanced'],subs:subs.length?subs:['Physics','Chemistry','Biology','Maths'],list:list};
}
function selectors(s){
  var cur=s.list.filter(function(c){ return c.c===Q.ch; })[0];
  return '<div style="display:flex;gap:10px;flex-wrap:wrap"><div>'+lbl('Exam')+'<select class="mcq-sel" onchange="qaSel(\'exam\',this.value)">'+s.exams.map(function(e){ return '<option '+(e===Q.exam?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div>'+
    '<div>'+lbl('Subject')+'<select class="mcq-sel" onchange="qaSel(\'subj\',this.value)">'+s.subs.map(function(e){ return '<option '+(e===Q.subj?'selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select></div>'+
    '<div style="flex:1;min-width:220px">'+lbl('Chapter')+'<select class="mcq-sel" style="width:100%" onchange="qaSel(\'ch\',this.value)"><option value="">— choose a chapter —</option>'+s.list.map(function(c){ return '<option value="'+esc(c.c)+'" '+(c.c===Q.ch?'selected':'')+'>'+esc(c.c)+' ('+c.n+')</option>'; }).join('')+'<option value="__new" '+(Q.ch==='__new'?'selected':'')+'>➕ New chapter…</option></select></div></div>'+
    (Q.ch==='__new'?'<div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:220px">'+lbl('New chapter name')+'<input id="qaNewCh" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="80" value="'+esc(Q.f.newCh||'')+'" placeholder="e.g. Wave Optics"></div><div>'+lbl('Class')+'<select id="qaCls" class="mcq-sel"><option value="">—</option><option '+(Q.f.cls==='11'?'selected':'')+'>11</option><option '+(Q.f.cls==='12'?'selected':'')+'>12</option><option '+(Q.f.cls==='11 & 12'?'selected':'')+'>11 &amp; 12</option></select></div></div>':'')+
    (cur?'<div style="font-size:12.5px;color:'+(cur.n<25?'var(--red-600)':'var(--muted)')+';margin-top:8px">This chapter has <b>'+cur.n+'</b> question'+(cur.n===1?'':'s')+(cur.n<40?' — help us reach 40 💪':' ✓')+'</div>':'');
}
function target(){
  var ch=Q.ch==='__new'?(Q.f.newCh||val('qaNewCh')).trim():Q.ch;
  return ch?{exam:Q.exam,subject:Q.subj,chapter:ch,cls:Q.ch==='__new'?(val('qaCls')||Q.f.cls||''):((chapters().filter(function(c){ return c.e===Q.exam&&c.s===Q.subj&&c.c===ch; })[0]||{}).cl||'')}:null;
}
window.renderQAuthor=function(){
  if(!me()) return renderAuth();
  if(!live()) return shell(note('⚡','Adding questions works in live mode. Connect Firebase first.'));
  if(!isStaff()) return shell(note('🔒','Only approved teachers and the admin can add questions.'));
  if(window.MCQ&&!MCQ.index&&!Q.ib){ Q.ib=true; MCQ.loadIndex().then(function(){ Q.ib=false; if(ROUTE.view==='qauthor') render(); }); }
  var s=sel(), f=Q.f;
  var tabs='<div class="mcq-tabs">'+[['one','✍️ Add one question'],['many','📋 Paste many'],['mine','📨 My submissions']].map(function(t){ return '<button class="mcq-chip '+(Q.tab===t[0]?'on':'')+'" onclick="qaTab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+'</div>';
  var body='';
  if(Q.tab==='mine') body=mineHtml();
  else body=card('<b style="font-size:15px">Where does it belong?</b>'+selectors(s))+(Q.tab==='one'?oneForm(f):manyForm());
  return shell(head('➕ Add Questions','Your questions go to the admin for a quick review, then appear in the bank for every student')+tabs+body);
};
function oneForm(f){
  return card('<b style="font-size:15px">The question</b>'+lbl('Question')+'<textarea id="qaQ" rows="3" maxlength="600" class="mcq-sel" style="width:100%" placeholder="Type the full question…">'+esc(f.q||'')+'</textarea>'+
    ['A','B','C','D'].map(function(L,i){ return lbl('Option '+L)+'<input id="qaO'+i+'" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="240" value="'+esc((f.o||[])[i]||'')+'">'; }).join('')+
    '<div style="display:flex;gap:12px;flex-wrap:wrap"><div>'+lbl('Correct option')+'<select id="qaAns" class="mcq-sel"><option value="">—</option>'+['A','B','C','D'].map(function(L,i){ return '<option value="'+i+'" '+(String(f.a)===String(i)?'selected':'')+'>'+L+'</option>'; }).join('')+'</select></div>'+
      '<div>'+lbl('Type (optional)')+'<select id="qaTag" class="mcq-sel">'+TAGS.map(function(t){ return '<option '+(f.tag===t?'selected':'')+' value="'+esc(t)+'">'+(t||'—')+'</option>'; }).join('')+'</select></div>'+
      '<div>'+lbl('Year (optional)')+'<input id="qaYear" class="mcq-sel" style="width:90px;padding:9px 11px" maxlength="4" value="'+esc(f.year||'')+'" placeholder="2023"></div></div>'+
    lbl('Explanation — please add one, it helps students learn')+'<textarea id="qaExp" rows="3" maxlength="600" class="mcq-sel" style="width:100%" placeholder="Why is the answer correct? Mention the common trap.">'+esc(f.e||'')+'</textarea>'+
    lbl('Figure / diagram link (optional, https)')+'<input id="qaImg" class="mcq-sel" style="width:100%;padding:9px 11px" value="'+esc(f.img||'')+'" placeholder="https://kspiderai.in/tools/dsa-academy/qimg/figure1.png">'+
    '<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.6">Tip: upload the picture to the <code>qimg</code> folder next to index.html on GitHub and paste its link here. Google Drive “Anyone with the link” image links also work.</div>'+
    '<button class="btn btn-primary" style="margin-top:14px" onclick="qaSubmitOne()" '+(Q.busy?'disabled':'')+'>'+(Q.busy?'Sending…':'Send for review →')+'</button>');
}
function manyForm(){
  return card('<b style="font-size:15px">Paste your questions</b><div style="font-size:12.5px;color:var(--muted);margin:6px 0 10px;line-height:1.6">One blank line between questions. Lines: <code>Q:</code> <code>A:</code> <code>B:</code> <code>C:</code> <code>D:</code> <code>Ans:</code> and optional <code>Exp:</code> <code>Img:</code> <code>Tag:</code>. Up to 40 at a time.</div>'+
    '<textarea id="qaBulk" rows="12" class="mcq-sel" style="width:100%;font-family:monospace;font-size:12.5px" oninput="qaBulkIn(this.value)" placeholder="Q: A body is thrown vertically upward with 20 m/s. Maximum height (g = 10)?\nA: 10 m\nB: 20 m\nC: 30 m\nD: 40 m\nAns: B\nExp: h = u²/2g = 400/20 = 20 m.\nTag: Numerical\n\nQ: …">'+esc(Q.bulk)+'</textarea>'+
    (Q.prev?'<div style="margin-top:10px;font-size:13.5px"><b style="color:var(--green-700)">'+Q.prev.qs.length+' ready</b>'+(Q.prev.errs.length?' · <b style="color:var(--red-600)">'+Q.prev.errs.length+' need fixing</b><ul style="margin:6px 0 0 18px;font-size:12.5px;color:var(--red-600)">'+Q.prev.errs.slice(0,6).map(function(e){ return '<li>'+esc(e)+'</li>'; }).join('')+'</ul>':'')+'</div>':'')+
    '<button class="btn btn-primary" style="margin-top:12px" onclick="qaSubmitMany()" '+(Q.busy?'disabled':'')+'>'+(Q.busy?'Sending…':'Send all for review →')+'</button>');
}
window.qaTab=function(t){ keep(); Q.tab=t; if(t==='mine') Q.mine=null; render(); };
window.qaSel=function(k,v){ keep(); Q[k]=v; if(k==='exam'||k==='subj') Q.ch=''; render(); };
window.qaBulkIn=function(v){ Q.bulk=v; Q.prev=v.trim()?parseMany(v):null; var el=document.activeElement; var pos=el&&el.selectionStart; render(); var t=document.getElementById('qaBulk'); if(t){ t.focus(); try{ t.setSelectionRange(pos,pos); }catch(e){} } };
function keep(){
  var g=function(id){ var e=document.getElementById(id); return e?e.value:undefined; };
  if(document.getElementById('qaQ')) Q.f={q:g('qaQ'),o:[g('qaO0'),g('qaO1'),g('qaO2'),g('qaO3')],a:g('qaAns'),e:g('qaExp'),img:g('qaImg'),tag:g('qaTag'),year:g('qaYear'),newCh:g('qaNewCh')||Q.f.newCh,cls:g('qaCls')||Q.f.cls};
  else if(document.getElementById('qaNewCh')) { Q.f.newCh=g('qaNewCh'); Q.f.cls=g('qaCls'); }
}
function base(t,u,q){ return {exam:t.exam,subject:t.subject,chapter:t.chapter.slice(0,80),cls:t.cls||'',tag:q.tag||'',year:q.year||'',q:q.q,o:q.o,a:q.a,e:q.e||'',img:q.img||'',by:u.name||'',byUid:u.uid,byEmail:u.email||'',status:'pending',when:ts()}; }
function dupCheck(t){
  if(Q.ch==='__new'||!window.MCQ||!MCQ.loadChapter) return Promise.resolve({});
  var ch=chapters().filter(function(c){ return c.e===t.exam&&c.s===t.subject&&c.c===t.chapter; })[0]; if(!ch) return Promise.resolve({});
  return MCQ.loadChapter(ch.k).then(function(qs){ var s={}; qs.forEach(function(x){ s[norm(x.q)]=1; }); return s; }).catch(function(){ return {}; });
}
window.qaSubmitOne=async function(){
  keep(); var u=me(), t=target(), f=Q.f;
  if(!t){ toast('Choose or name the chapter first','⚠️'); return; }
  var im=normImg(f.img), q={q:String(f.q||'').trim(),o:(f.o||[]).map(function(x){ return String(x||'').trim(); }),a:f.a===''||f.a===undefined?-1:+f.a,e:String(f.e||'').trim(),img:im.v,tag:f.tag||'',year:/^\d{4}$/.test(String(f.year||'').trim())?String(f.year).trim():''};
  var errs=check(q); if(!im.ok) errs.push('Image link must start with https://'); if(errs.length){ toast(errs[0],'⚠️'); return; }
  Q.busy=true; render();
  try{
    var dup=await dupCheck(t); if(dup[norm(q.q)]){ Q.busy=false; toast('This question is already in the chapter','⚠️'); render(); return; }
    await fbDb.collection('questionDrafts').add(base(t,u,q));
    Q.busy=false; Q.f={}; Q.mine=null; toast('Sent for review ✅ — thank you!','✅'); render();
  }catch(e){ Q.busy=false; toast(e.message||'Could not send','⚠️'); render(); }
};
window.qaSubmitMany=async function(){
  var u=me(), t=target(); if(!t){ toast('Choose or name the chapter first','⚠️'); return; }
  var p=parseMany(Q.bulk); if(!p.qs.length){ toast('No valid questions found','⚠️'); return; }
  var qs=p.qs.slice(0,40); Q.busy=true; render();
  try{
    var dup=await dupCheck(t), seen={}, ok=[], skipped=0;
    qs.forEach(function(q){ var n=norm(q.q); if(dup[n]||seen[n]){ skipped++; return; } seen[n]=1; ok.push(q); });
    var b=fbDb.batch(); ok.forEach(function(q){ b.set(fbDb.collection('questionDrafts').doc(),base(t,u,q)); }); if(ok.length) await b.commit();
    Q.busy=false; Q.bulk=''; Q.prev=null; Q.mine=null; toast('Sent '+ok.length+' for review ✅'+(skipped?' · '+skipped+' duplicate(s) skipped':'')+(p.errs.length?' · '+p.errs.length+' need fixing':''),'✅'); render();
  }catch(e){ Q.busy=false; toast(e.message||'Could not send','⚠️'); render(); }
};
function mineHtml(){
  var u=me();
  if(!Q.mine){ if(!Q.mb){ Q.mb=true; fbDb.collection('questionDrafts').where('byUid','==',u.uid).get().then(function(s){ Q.mine=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }).sort(function(a,b){ var x=a.when&&a.when.toMillis?a.when.toMillis():0,y=b.when&&b.when.toMillis?b.when.toMillis():0; return y-x; }); }).catch(function(){ Q.mine=[]; }).then(function(){ Q.mb=false; if(ROUTE.view==='qauthor') render(); }); } return note('⏳','Loading…'); }
  var n={pending:0,approved:0,rejected:0}; Q.mine.forEach(function(d){ n[d.status]=(n[d.status]||0)+1; });
  return '<div class="stat-row"><div class="card stat-box"><b>'+Q.mine.length+'</b><span>Submitted</span></div><div class="card stat-box"><b style="color:var(--green-700)">'+n.approved+'</b><span>Published</span></div><div class="card stat-box"><b>'+n.pending+'</b><span>Waiting</span></div><div class="card stat-box"><b style="color:var(--red-600)">'+n.rejected+'</b><span>Sent back</span></div></div>'+
    (Q.mine.length?Q.mine.slice(0,60).map(function(d){ var pill=d.status==='approved'?'<span class="pill pill-green">Published</span>':(d.status==='rejected'?'<span class="pill pill-red">Sent back</span>':'<span class="pill pill-gold">Waiting</span>');
      return card('<div style="display:flex;gap:10px;align-items:start;flex-wrap:wrap"><div style="flex:1;min-width:220px"><div style="font-size:12px;color:var(--muted)">'+esc(d.exam)+' · '+esc(d.subject)+' · '+esc(d.chapter)+'</div><div style="font-size:14px;margin-top:3px">'+esc(String(d.q).slice(0,140))+(d.q.length>140?'…':'')+'</div>'+(d.status==='rejected'&&d.note?'<div style="font-size:12.5px;color:var(--red-600);margin-top:4px">Admin: '+esc(d.note)+'</div>':'')+'</div>'+pill+(d.status==='pending'?'<button class="btn btn-ghost btn-sm" onclick="qaWithdraw(\''+d.id+'\')">Withdraw</button>':'')+'</div>','margin-bottom:8px;padding:12px 16px'); }).join(''):note('📨','Nothing submitted yet.'));
}
window.qaWithdraw=function(id){ if(!confirm('Withdraw this question?')) return; fbDb.collection('questionDrafts').doc(id).delete().then(function(){ Q.mine=null; toast('Withdrawn'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
var _go=window.go; window.go=function(v,p){ if(v==='qauthor'){ Q.mine=null; } return _go(v,p); };
})();
