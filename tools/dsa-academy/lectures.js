/* =========================================================================
   Dr. Shreyansh Academy — Video Lectures (lectures.js)
   Admin / faculty add recorded or LIVE YouTube links (one or many) for any
   subject · chapter · topic. Students watch inside the platform, mark parts
   as watched, jump to practice MCQs. Parents can watch too. No video is
   stored on our servers — only the links.
   NEW screens only; no existing screen is modified.
   ========================================================================= */
(function(){
'use strict';
var L={list:null,f:'All',q:'',open:null,part:0,watch:null,form:false,busy:false};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function again(){ if(ROUTE.view==='lectures') render(); }
function me(){ return DB.currentUser; }
function isStaff(){ var u=me(); return !!u && (u.role==='admin'||(u.role==='faculty'&&u.approved!==false)); }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function shell(b){ return '<div class="app-shell">'+sidebar('lectures')+'<div class="main" style="max-width:1040px">'+b+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function note(ic,m){ return '<div class="card" style="padding:34px;text-align:center"><div style="font-size:32px;margin-bottom:8px">'+ic+'</div><div style="font-size:14px;color:var(--muted);line-height:1.6">'+m+'</div></div>'; }
function card(i,x){ return '<div class="card" style="padding:18px 20px;margin-bottom:16px;'+(x||'')+'">'+i+'</div>'; }
function val(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function lbl(t){ return '<div style="font-size:12px;color:var(--muted);margin:0 0 4px">'+t+'</div>'; }
function subjects(){ var s=(typeof SUBJECTS!=='undefined'?SUBJECTS.slice():['Physics','Chemistry','Biology']); if(s.indexOf('Maths')<0) s.push('Maths'); return s; }
function pad(n){ return (n<10?'0':'')+n; }
function when(w){ var d=w&&w.toDate?w.toDate():null; return d?d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]:''; }

/* ---------- link understanding: YouTube video / live / playlist, Google Drive ---------- */
function embedInfo(u){
  u=String(u||'').trim(); var x; try{ x=new URL(u); }catch(e){ return {ok:false}; }
  if(x.protocol!=='https:') return {ok:false};
  var h=x.hostname.replace(/^www\./,'').replace(/^m\./,''), id='', list=x.searchParams.get('list')||'';
  if(h==='youtu.be') id=x.pathname.slice(1).split('/')[0];
  else if(h==='youtube.com'||h==='youtube-nocookie.com'){
    if(x.pathname==='/watch') id=x.searchParams.get('v')||'';
    else { var m=x.pathname.match(/^\/(?:embed|live|shorts|v)\/([\w-]{11})/); if(m) id=m[1]; }
  } else if(h==='drive.google.com'){
    var d=x.pathname.match(/\/file\/d\/([\w-]+)/);
    if(d) return {ok:true,kind:'drive',src:'https://drive.google.com/file/d/'+d[1]+'/preview',url:u};
    return {ok:true,kind:'link',url:u};
  } else return {ok:true,kind:'link',url:u};
  var validId=/^[\w-]{11}$/.test(id), validList=/^[\w-]{10,}$/.test(list);
  if(validId) return {ok:true,kind:'yt',src:'https://www.youtube-nocookie.com/embed/'+id+'?rel=0&modestbranding=1'+(validList?'&list='+list:''),url:u};
  if(validList) return {ok:true,kind:'yt',src:'https://www.youtube-nocookie.com/embed/videoseries?list='+list+'&rel=0',url:u};
  return {ok:true,kind:'link',url:u};
}
window.lecEmbed=embedInfo;
function parseLinks(text){
  var out=[],errs=[];
  String(text).split('\n').forEach(function(line,i){
    line=line.trim(); if(!line) return;
    var lab='',u=line, p=line.indexOf('|'); if(p>0){ lab=line.slice(0,p).trim(); u=line.slice(p+1).trim(); }
    var info=embedInfo(u); if(!info.ok){ errs.push('Line '+(i+1)+': link must start with https://'); return; }
    out.push({t:(lab||('Part '+(out.length+1))).slice(0,60),u:u});
  });
  if(out.length>20) errs.push('Maximum 20 links per lecture');
  return {v:out.slice(0,20),errs:errs};
}
window.lecParse=parseLinks;

/* ---------- data ---------- */
function load(){
  if(L.list||L.busy) return; L.busy=true;
  var u=me(), ps=[fbDb.collection('lectures').orderBy('when','desc').limit(200).get().then(function(s){ return s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); }).catch(function(){ return []; })];
  if(u.role==='student') ps.push(fbDb.collection('lectureWatch').doc(u.uid).get().then(function(d){ return d.exists?(d.data().w||{}):{}; }).catch(function(){ return {}; }));
  Promise.all(ps).then(function(r){ L.list=r[0]; L.watch=r[1]||null; L.busy=false; again(); });
}
function watchedCount(l){ if(!L.watch) return 0; var n=0; (l.videos||[]).forEach(function(v,i){ if(L.watch[l.id+'_'+i]) n++; }); return n; }
function chaptersHint(){
  var set={}; try{ Object.keys(DATA.titles).forEach(function(s){ Object.keys(DATA.titles[s]).forEach(function(c){ set[DATA.titles[s][c]]=1; }); }); }catch(e){}
  try{ if(window.MCQ&&MCQ.index) MCQ.index.chapters.forEach(function(c){ set[c.c]=1; }); }catch(e){}
  (L.list||[]).forEach(function(l){ if(l.chapter) set[l.chapter]=1; });
  return Object.keys(set).sort();
}

/* ---------- screens ---------- */
window.renderLectures=function(){
  if(!me()) return renderAuth();
  if(!live()) return shell(note('⚡','Video Lectures work in live mode. Connect Firebase first.'));
  if(!L.list){ load(); return shell(head('🎬 Video Lectures','Recorded and live classes')+note('⏳','Loading…')); }
  var cur=L.open?L.list.filter(function(x){ return x.id===L.open; })[0]:null;
  if(L.open&&!cur){ L.open=null; }
  return cur?player(cur):lister();
};
function lister(){
  var u=me(), staff=isStaff(), q=L.q.toLowerCase();
  var rows=L.list.filter(function(l){ return (L.f==='All'||l.subject===L.f)&&(!q||((l.title||'')+' '+(l.chapter||'')+' '+(l.topic||'')).toLowerCase().indexOf(q)>=0); })
    .sort(function(a,b){ return (b.live?1:0)-(a.live?1:0); });
  var liveN=L.list.filter(function(l){ return l.live; }).length;
  return shell(head('🎬 Video Lectures',staff?'Add recorded or live lecture links — students watch right here':'Watch recorded and live classes, chapter by chapter')+
    (liveN?'<div class="card" style="padding:12px 16px;margin-bottom:14px;background:var(--red-100);border-color:var(--red-500);font-size:14px">🔴 <b>'+liveN+' live class'+(liveN>1?'es':'')+' going on now</b> — tap a card marked LIVE to join.</div>':'')+
    (staff?'<div style="margin-bottom:14px"><button class="btn btn-primary btn-sm" onclick="lecForm()">'+(L.form?'✕ Close form':'➕ Add lecture')+'</button></div>'+(L.form?addForm():''):'')+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center"><div class="mcq-tabs" style="margin:0">'+['All'].concat(subjects()).map(function(s){ return '<button class="mcq-chip '+(L.f===s?'on':'')+'" onclick="lecF(\''+esc(s)+'\')">'+esc(s)+'</button>'; }).join('')+'</div>'+
      '<input class="mcq-sel" style="flex:1;min-width:180px;padding:9px 12px" placeholder="🔍 Search chapter, topic or title…" value="'+esc(L.q)+'" oninput="lecQ(this.value)"></div>'+
    '<div id="lecGrid">'+grid(rows)+'</div>');
}
function grid(rows){
  var u=me();
  if(!rows.length) return note('🎬',L.list.length?'No lectures match your filter.':'No lectures added yet.');
  return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px">'+rows.map(function(l){
    var n=(l.videos||[]).length, w=watchedCount(l), first=embedInfo((l.videos&&l.videos[0]||{}).u), tag=l.live?'<span class="pill pill-red">🔴 LIVE</span>':(u.role==='student'&&w>=n&&n?'<span class="pill pill-green">✓ Watched</span>':'<span class="pill pill-navy">Recorded</span>');
    return '<div class="card" style="padding:0;overflow:hidden;cursor:pointer" onclick="lecOpen(\''+l.id+'\')"><div style="height:92px;background:linear-gradient(135deg,var(--navy-800),var(--navy-600));display:flex;align-items:center;justify-content:center;font-size:34px;color:#fff">'+(l.live?'🔴':'▶')+'</div>'+
      '<div style="padding:12px 14px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:start;margin-bottom:6px"><span class="pill pill-gold">'+esc(l.subject)+'</span>'+tag+'</div>'+
      '<b style="font-size:14.5px;line-height:1.35">'+esc(l.title)+'</b><div style="font-size:12.5px;color:var(--muted);margin-top:4px">'+esc(l.chapter||'')+(l.topic?' · '+esc(l.topic):'')+'</div>'+
      '<div style="font-size:12px;color:var(--muted);margin-top:8px;display:flex;justify-content:space-between"><span>'+n+' part'+(n>1?'s':'')+(u.role==='student'&&n?' · '+w+'/'+n+' watched':'')+'</span><span>'+esc(l.by||'')+' · '+esc(when(l.when))+'</span></div></div></div>';
  }).join('')+'</div>';
}
function addForm(){
  var u=me(), hint=chaptersHint();
  return card('<b style="font-size:15px">Add a lecture</b>'+
    '<datalist id="lecChList">'+hint.map(function(c){ return '<option value="'+esc(c)+'">'; }).join('')+'</datalist>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0"><div>'+lbl('Subject')+'<select id="lcSub" class="mcq-sel">'+subjects().map(function(s){ return '<option '+(u.subject===s?'selected':'')+'>'+esc(s)+'</option>'; }).join('')+'</select></div>'+
      '<div style="flex:1;min-width:180px">'+lbl('Chapter')+'<input id="lcCh" list="lecChList" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="80" placeholder="e.g. Laws of Motion"></div>'+
      '<div style="flex:1;min-width:160px">'+lbl('Topic (optional)')+'<input id="lcTopic" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="80" placeholder="e.g. Friction"></div></div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div style="flex:1;min-width:220px">'+lbl('Lecture title')+'<input id="lcTitle" class="mcq-sel" style="width:100%;padding:9px 11px" maxlength="100" placeholder="e.g. Friction — full concept + PYQs"></div>'+
      '<label style="display:flex;gap:8px;align-items:center;font-size:13.5px;margin-top:20px"><input type="checkbox" id="lcLive"> 🔴 This is a LIVE class right now</label></div>'+
    lbl('YouTube / Google Drive links — one per line. Optional label: <code>Part 1 | https://youtu.be/…</code>')+
    '<textarea id="lcLinks" rows="5" class="mcq-sel" style="width:100%;font-family:monospace;font-size:12.5px" placeholder="Part 1 | https://youtu.be/xxxxxxxxxxx\nPart 2 | https://www.youtube.com/watch?v=yyyyyyyyyyy\nhttps://www.youtube.com/live/zzzzzzzzzzz"></textarea>'+
    '<div style="font-size:12px;color:var(--muted);margin:6px 0 10px">Live streams, premieres, single videos and whole playlists all work. Set the video to <b>Unlisted</b> on YouTube if you do not want it public.</div>'+
    '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:12px"><input type="checkbox" id="lcNotify" checked> Notify all students</label>'+
    '<button class="btn btn-primary" onclick="lecAdd()" '+(L.busy?'disabled':'')+'>Publish lecture</button>');
}
function player(l){
  var u=me(), staff=isStaff(), vs=l.videos||[], i=Math.min(L.part,Math.max(0,vs.length-1)), cur=vs[i]||{}, info=embedInfo(cur.u);
  var mine=staff&&(u.role==='admin'||l.byUid===u.uid), isStu=u.role==='student', done=isStu&&L.watch&&L.watch[l.id+'_'+i];
  return shell('<div style="margin-bottom:10px"><button class="btn btn-ghost btn-sm" onclick="lecBack()">← All lectures</button></div>'+
    '<div style="display:grid;grid-template-columns:minmax(0,2.2fr) minmax(240px,1fr);gap:16px;align-items:start">'+
    '<div><div style="position:relative;padding-top:56.25%;background:#000;border-radius:12px;overflow:hidden">'+
      (info.src?'<iframe src="'+esc(info.src)+'" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="'+esc(l.title)+'"></iframe>'
        :'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:12px;padding:20px;text-align:center">This link opens in a new tab<a class="btn btn-gold" href="'+esc(info.url||'#')+'" target="_blank" rel="noopener">Open link →</a></div>')+'</div>'+
    '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+(l.live?'<span class="pill pill-red">🔴 LIVE</span>':'')+'<span class="pill pill-gold">'+esc(l.subject)+'</span>'+
      (info.url?'<a class="btn btn-outline btn-sm" style="margin-left:auto" href="'+esc(info.url)+'" target="_blank" rel="noopener">Open on YouTube ↗</a>':'')+'</div>'+
    '<h3 style="margin:10px 0 2px;font-size:18px">'+esc(l.title)+'</h3><div style="font-size:13px;color:var(--muted)">'+esc(l.chapter||'')+(l.topic?' · '+esc(l.topic):'')+' · '+esc(l.by||'')+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">'+
      (isStu?'<button class="btn '+(done?'btn-outline':'btn-primary')+' btn-sm" onclick="lecWatch(\''+l.id+'\','+i+')">'+(done?'✓ Watched — undo':'Mark this part as watched')+'</button>':'')+
      (l.chapter&&u.role!=='faculty'&&u.role!=='admin'?'<button class="btn btn-gold btn-sm" onclick="(window.mcqFromNotes||function(){})(\''+esc(l.subject)+'\',\''+encodeURIComponent(l.chapter)+'\')">📚 Practice MCQs on this chapter</button>':'')+
      (isStu?'<button class="btn btn-outline btn-sm" onclick="go(\'doubts\')">💬 Ask a doubt</button>':'')+'</div>'+
    (mine?card('<b style="font-size:13.5px">Manage this lecture</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-outline btn-sm" onclick="lecToggleLive(\''+l.id+'\')">'+(l.live?'⏹ Live ended — mark as recorded':'🔴 Mark as LIVE')+'</button><button class="btn btn-outline btn-sm" onclick="lecAddLink(\''+l.id+'\')">➕ Add another link</button><button class="btn btn-ghost btn-sm" onclick="lecDel(\''+l.id+'\')">🗑 Delete lecture</button></div>','margin-top:14px'):'')+'</div>'+
    '<div class="card" style="padding:14px 16px"><b style="font-size:14px">Parts ('+vs.length+')</b><div style="margin-top:8px">'+vs.map(function(v,k){
      var w=isStu&&L.watch&&L.watch[l.id+'_'+k];
      return '<div class="mcq-row '+(k===i?'on':'')+'" onclick="lecPart('+k+')"><span class="nm">'+(w?'✓ ':'')+esc(v.t||('Part '+(k+1)))+'</span><small>▶</small></div>'; }).join('')+'</div></div></div>');
}
/* ---------- actions ---------- */
window.lecF=function(s){ L.f=s; render(); };
window.lecQ=function(v){ L.q=v; var rows=L.list.filter(function(l){ var q=v.toLowerCase(); return (L.f==='All'||l.subject===L.f)&&(!q||((l.title||'')+' '+(l.chapter||'')+' '+(l.topic||'')).toLowerCase().indexOf(q)>=0); }).sort(function(a,b){ return (b.live?1:0)-(a.live?1:0); }); var g=document.getElementById('lecGrid'); if(g) g.innerHTML=grid(rows); };
window.lecForm=function(){ L.form=!L.form; render(); };
window.lecOpen=function(id){ L.open=id; L.part=0; render(); window.scrollTo({top:0,behavior:'instant'}); };
window.lecBack=function(){ L.open=null; render(); };
window.lecPart=function(k){ L.part=k; render(); };
window.lecWatch=function(id,i){
  var u=me(), key=id+'_'+i; L.watch=L.watch||{};
  if(L.watch[key]) delete L.watch[key]; else { if(Object.keys(L.watch).length>=800){ toast('Watch history is full','⚠️'); return; } L.watch[key]=1; }
  fbDb.collection('lectureWatch').doc(u.uid).set({w:L.watch,upd:ts()}).catch(function(){ toast('Could not save progress','⚠️'); }); render();
};
window.lecAdd=async function(){
  var u=me(), title=val('lcTitle'), ch=val('lcCh'), topic=val('lcTopic'), sub=val('lcSub'), p=parseLinks(val('lcLinks'));
  if(p.errs.length){ toast(p.errs[0],'⚠️'); return; }
  if(!p.v.length){ toast('Add at least one link','⚠️'); return; }
  if(!ch&&!topic&&!title){ toast('Add a chapter, topic or title','⚠️'); return; }
  title=title||topic||ch; var isLive=!!(document.getElementById('lcLive')||{}).checked, notify=(document.getElementById('lcNotify')||{}).checked!==false;
  L.busy=true; render();
  try{
    await fbDb.collection('lectures').add({title:title.slice(0,100),subject:sub,chapter:ch.slice(0,80),topic:topic.slice(0,80),videos:p.v,live:isLive,by:u.name||'',byUid:u.uid,when:ts()});
    if(notify){ var st=await loadAllStudents(), b=fbDb.batch(), n=0;
      for(var i=0;i<st.length;i++){ if(!st[i].email||st[i].banned) continue;
        b.set(fbDb.collection('notifications').doc(),{toEmail:st[i].email,title:isLive?'🔴 Live class now':'New video lecture',msg:title+' ('+sub+(ch?' · '+ch:'')+') is now in Video Lectures.',kind:'lecture',by:u.name||'',when:ts(),read:false}); n++;
        if(n%400===0){ await b.commit(); b=fbDb.batch(); } }
      if(n%400) await b.commit(); }
    L.busy=false; L.list=null; L.form=false; toast('Lecture published ✅'); render();
  }catch(e){ L.busy=false; toast(e.message||'Could not publish','⚠️'); render(); }
};
window.lecToggleLive=function(id){ var l=L.list.filter(function(x){ return x.id===id; })[0]; if(!l) return; fbDb.collection('lectures').doc(id).update({live:!l.live}).then(function(){ l.live=!l.live; toast(l.live?'Marked LIVE':'Marked as recorded'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
window.lecAddLink=function(id){
  var l=L.list.filter(function(x){ return x.id===id; })[0]; if(!l) return;
  var t=prompt('Paste the new link.\nOptional label first, e.g.  Part 3 | https://youtu.be/xxxxxxxxxxx'); if(!t) return;
  var p=parseLinks(t); if(p.errs.length||!p.v.length){ toast(p.errs[0]||'Invalid link','⚠️'); return; }
  var vids=(l.videos||[]).concat([{t:(t.indexOf('|')>0?p.v[0].t:'Part '+((l.videos||[]).length+1)),u:p.v[0].u}]).slice(0,20);
  fbDb.collection('lectures').doc(id).update({videos:vids}).then(function(){ l.videos=vids; toast('Link added ✅'); render(); }).catch(function(e){ toast(e.message,'⚠️'); });
};
window.lecDel=function(id){ if(!confirm('Delete this lecture for everyone?')) return; fbDb.collection('lectures').doc(id).delete().then(function(){ L.open=null; L.list=null; toast('Deleted'); render(); }).catch(function(e){ toast(e.message,'⚠️'); }); };
/* from the notes screen: open lectures filtered to that chapter */
window.lecForChapter=function(subject,enc){ var t=''; try{ t=decodeURIComponent(enc); }catch(e){ t=enc; } L.f=subject; L.q=t; window._lecKeep=true; go('lectures'); };
var _go=window.go; window.go=function(v,p){ if(v==='lectures'){ L.list=null; L.open=null; if(!window._lecKeep){ L.q=''; L.f='All'; } window._lecKeep=false; } return _go(v,p); };
})();
