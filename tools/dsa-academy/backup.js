/* =========================================================================
   Dr. Shreyansh Academy — Backup & Restore + Error Log screens (backup.js)
   -------------------------------------------------------------------------
   Everyone  : "Backup & Restore" -> download MY data as one .json file, and
               restore it later (progress, learning hub, lecture ticks).
               Also shows this phone's error list with a "Copy report" button.
   Admin     : institute backup (pick collections -> one .json download),
               and "Error Log" screen with every error students hit
               (grouped, with counts) + "Copy for Claude" button.
   Everything runs in the browser; nothing extra is stored on a server, so it
   stays inside the free Spark plan. Each downloaded document = 1 Firestore
   read (limit 50,000 / day), so the admin screen shows a warning first.
   ========================================================================= */
(function(){
'use strict';
var B=window.BKP={busy:'',msg:'',log:'',errs:null,errBusy:false,sel:{users:1,batches:1,schedule:1,resources:1,lectures:1,facultyTests:1,announcements:1,config:1}};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function user(){ try{ return DB.currentUser; }catch(e){ return null; } }
function fdb(){ try{ return (window.FIREBASE_ENABLED && typeof fbDb!=='undefined') ? fbDb : null; }catch(e){ return null; } }
function refresh(){ try{ if(ROUTE.view==='backup'||ROUTE.view==='errlog') render(); }catch(e){} }
function pad(n){ return (n<10?'0':'')+n; }
function stamp(){ var d=new Date(); return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes()); }
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function save(name,obj){
  var blob=new Blob([typeof obj==='string'?obj:JSON.stringify(obj)],{type:typeof obj==='string'?'text/plain':'application/json'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1500);
}
function plain(v){ // Firestore Timestamp -> ISO text, so the file is plain JSON
  if(v==null) return v;
  if(typeof v.toDate==='function'){ try{ return {__ts:v.toDate().toISOString()}; }catch(e){ return null; } }
  if(Array.isArray(v)) return v.map(plain);
  if(typeof v==='object'){ var o={}; Object.keys(v).forEach(function(k){ o[k]=plain(v[k]); }); return o; }
  return v;
}
function unplain(v){
  if(v==null) return v;
  if(Array.isArray(v)) return v.map(unplain);
  if(typeof v==='object'){ if(v.__ts) return firebase.firestore.Timestamp.fromDate(new Date(v.__ts)); var o={}; Object.keys(v).forEach(function(k){ o[k]=unplain(v[k]); }); return o; }
  return v;
}
function shell(body){ var u=user(); return '<div class="app-shell">'+sidebar(ROUTE.view==='errlog'?'errlog':'backup')+'<div class="main" style="max-width:940px">'+body+'</div></div>'; }
function head(t,s){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div></div>'; }
function card(h,st){ return '<div class="card" style="padding:18px 20px;margin-bottom:14px;'+(st||'')+'">'+h+'</div>'; }

/* ================= my data backup ================= */
var ALLOWED={ mcqProgress:['v','ch','wrong','mark','hist','streak','daily','days','goal','todo'], learnData:['v','srs','nb','seen','plan','td','mocks','gx','bd'], lectureWatch:['w'] };
B.exportMine=function(){
  var u=user(), d=fdb(); if(!u||!u.uid||!d){ toast('Login karke (Live mode me) hi backup hota hai','⚠️'); return; }
  B.busy='export'; refresh();
  var out={app:'DSA',v:1,exportedAt:new Date().toISOString(),who:{uid:u.uid,name:u.name,email:u.email,role:u.role},docs:{},lists:{}};
  var jobs=[];
  if(u.role==='student'){
    Object.keys(ALLOWED).forEach(function(c){ jobs.push(d.collection(c).doc(u.uid).get().then(function(s){ if(s.exists) out.docs[c]=plain(s.data()); })); });
    jobs.push(d.collection('testResults').where('email','==',u.email).get().then(function(s){ out.lists.testResults=s.docs.map(function(x){ return plain(x.data()); }); }));
    jobs.push(d.collection('doubts').where('email','==',u.email).get().then(function(s){ out.lists.doubts=s.docs.map(function(x){ return plain(x.data()); }); }));
    jobs.push(d.collection('classTestResults').where('uid','==',u.uid).get().then(function(s){ out.lists.classTestResults=s.docs.map(function(x){ return plain(x.data()); }); }));
    out.bookmarks=u.bookmarks||[];
  } else if(u.role==='parent'){
    jobs.push(d.collection('parentLinks').where('parentUid','==',u.uid).get().then(function(s){ out.lists.parentLinks=s.docs.map(function(x){ return plain(x.data()); }); }));
  }
  if(window.OFF&&OFF.queue&&OFF.queue.length) out.offlineQueue=OFF.queue;
  try{ out.settings={a11y:JSON.parse(lsGet('dsa_a11y')||'null')}; }catch(e){}
  Promise.all(jobs).then(function(){
    save('DSA-my-backup-'+(u.name||'user').replace(/[^A-Za-z0-9]+/g,'_')+'-'+stamp()+'.json',out);
    lsSet('dsa_last_backup',String(Date.now())); B.busy=''; B.msg='✅ Backup file download ho gayi. Use Google Drive / WhatsApp "Saved messages" me rakh lo.'; refresh();
  }).catch(function(e){ console.warn(e); B.busy=''; B.msg='⚠️ Backup nahi ban paya: '+(e&&e.message||'error'); refresh(); });
};
B.pickRestore=function(){ var f=document.getElementById('bkpFile'); if(f) f.click(); };
B.onFile=function(inp){
  var f=inp.files&&inp.files[0]; if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    try{
      var j=JSON.parse(r.result); if(!j||j.app!=='DSA'||!j.docs) throw new Error('Ye DSA backup file nahi lagti');
      var u=user(); B.pending=j; B.msg='';
      B.warn=(j.who&&j.who.uid&&u&&j.who.uid!==u.uid)?'⚠️ Ye backup kisi aur account ('+esc(j.who.name||j.who.email||'')+') ka hai.':'';
    }catch(e){ B.pending=null; B.msg='⚠️ '+e.message; }
    inp.value=''; refresh();
  };
  r.readAsText(f);
};
B.doRestore=function(){
  var j=B.pending, u=user(), d=fdb(); if(!j||!u||!d) return;
  if(u.role!=='student'){ toast('Restore sirf student account ke liye hai','⚠️'); return; }
  if(!confirm('Current progress hat kar backup wala data daalna hai? Ye undo nahi hoga.')) return;
  B.busy='restore'; refresh();
  var jobs=[], n=0;
  Object.keys(ALLOWED).forEach(function(c){
    var src=j.docs[c]; if(!src) return; var o={};
    ALLOWED[c].forEach(function(k){ if(src[k]!==undefined) o[k]=unplain(src[k]); });
    o.upd=firebase.firestore.FieldValue.serverTimestamp(); n++;
    jobs.push(d.collection(c).doc(u.uid).set(o));
  });
  Promise.all(jobs).then(function(){
    B.busy=''; B.pending=null; B.warn=''; B.msg='✅ '+n+' data set(s) restore ho gaye. App dobara khol lo.';
    if(window.MCQ){ MCQ.prog=null; MCQ.progP=null; } if(window.OFF&&u.uid) OFF.saveProg(u.uid,{},false);
    refresh();
  }).catch(function(e){ console.warn(e); B.busy=''; B.msg='⚠️ Restore nahi hua: '+(e&&e.message||'permission'); refresh(); });
};

/* ================= admin: institute backup ================= */
var COLS=[['users','👥 Users (students, parents, faculty)'],['parentLinks','👪 Parent links'],['testResults','🧪 Test results'],['classTestResults','📝 Class test results'],['facultyTests','📝 Teacher tests'],['attendance','✅ Attendance'],['doubts','💬 Doubts'],['batches','🎓 Batches'],['schedule','🗓 Timetable'],['resources','📂 Resources'],['lectures','🎬 Lectures'],['announcements','📣 Announcements'],['config','⚙️ Config (UPI/plans)'],['premiumRequests','💎 Premium requests'],['homework','📌 Homework'],['errorLogs','🐞 Error logs']];
function logln(t){ B.log+=t+'\n'; var el=document.getElementById('bkpLog'); if(el){ el.textContent=B.log; el.scrollTop=el.scrollHeight; } }
B.togCol=function(k){ if(B.sel[k]) delete B.sel[k]; else B.sel[k]=1; refresh(); };
B.exportAll=async function(){
  var d=fdb(); if(!d||user().role!=='admin') return;
  var keys=Object.keys(B.sel); if(!keys.length){ toast('Kam se kam ek collection chuno','⚠️'); return; }
  if(!confirm('Har document = 1 Firestore read (free limit 50,000/din). Aage badhein?')) return;
  B.busy='all'; B.log=''; refresh();
  var out={app:'DSA-institute',v:1,exportedAt:new Date().toISOString(),collections:{}}, total=0, CAP=6000;
  try{
    for(var i=0;i<keys.length;i++){
      var k=keys[i], rows=[], last=null;
      logln('⏳ '+k+' …');
      for(;;){
        var q=d.collection(k).orderBy(firebase.firestore.FieldPath.documentId()).limit(500); if(last) q=q.startAfter(last);
        var s=await q.get(); s.docs.forEach(function(x){ rows.push({id:x.id,data:plain(x.data())}); });
        if(s.size<500||rows.length>=CAP) break; last=s.docs[s.docs.length-1];
      }
      out.collections[k]=rows; total+=rows.length; logln('   ✓ '+k+': '+rows.length+(rows.length>=CAP?' (stopped at '+CAP+' — take this one separately)':''));
    }
    out.counts=Object.keys(out.collections).reduce(function(o,k){ o[k]=out.collections[k].length; return o; },{});
    save('DSA-institute-backup-'+stamp()+'.json',out); lsSet('dsa_last_backup',String(Date.now()));
    logln('✅ Done — '+total+' documents saved to the downloaded file.');
  }catch(e){ console.warn(e); logln('❌ '+(e&&e.message||e)); }
  B.busy=''; refresh();
};

/* ================= screens ================= */
window.renderBackup=function(){
  var u=user(); if(!u) return renderAuth();
  var last=+lsGet('dsa_last_backup')||0, errs=window.ERRLOG?ERRLOG.list():[];
  var h=head('🛟 Backup & Restore','Apna data ek file me save karo — phone kho jaye ya account me gadbad ho to wapas laa sakte ho');
  if(B.msg) h+=card(B.msg.indexOf('✅')===0?'<span style="color:var(--green-700)">'+esc(B.msg)+'</span>':esc(B.msg));
  var canLive=!!fdb()&&!!u.uid;
  h+=card('<b>📥 Mera backup</b><div style="font-size:13px;color:var(--muted);margin:6px 0 12px">'+(u.role==='student'?'Progress, Learning Hub, lecture ticks, test results, doubts — sab ek .json file me.':'Aapke account ki jaankari ek file me.')+
    '<br>Last backup: <b>'+(last?new Date(last).toLocaleDateString():'kabhi nahi')+'</b>'+(last&&Date.now()-last>30*864e5?' <span class="pill pill-gold">30+ din purana</span>':'')+'</div>'+
    '<button class="btn btn-primary btn-sm" '+((!canLive||B.busy)?'disabled':'')+' onclick="BKP.exportMine()">'+(B.busy==='export'?'Preparing…':'⬇ Download my backup')+'</button>'+(canLive?'':'<span style="font-size:12px;color:var(--muted);margin-left:10px">Live mode + login chahiye</span>'));
  if(u.role==='student'){
    h+=card('<b>♻️ Restore from backup</b><div style="font-size:13px;color:var(--muted);margin:6px 0 12px">Pehle download ki hui DSA backup file chuno. Progress, Learning Hub aur lecture ticks wapas aa jayenge.</div>'+
      '<input type="file" id="bkpFile" accept=".json,application/json" style="display:none" onchange="BKP.onFile(this)">'+
      '<button class="btn btn-outline btn-sm" '+((!canLive||B.busy)?'disabled':'')+' onclick="BKP.pickRestore()">📂 Choose backup file…</button>'+
      (B.pending?'<div style="margin-top:14px;padding:12px 14px;border:1px solid var(--border);border-radius:10px"><b>File ready:</b> '+esc((B.pending.who&&B.pending.who.name)||'')+' · '+esc((B.pending.exportedAt||'').slice(0,10))+' · '+Object.keys(B.pending.docs).length+' data sets'+(B.warn?'<div style="color:var(--red-600);margin-top:6px;font-size:13px">'+B.warn+'</div>':'')+
        '<div style="margin-top:10px"><button class="btn btn-gold btn-sm" '+(B.busy?'disabled':'')+' onclick="BKP.doRestore()">'+(B.busy==='restore'?'Restoring…':'Restore now')+'</button> <button class="btn btn-ghost btn-sm" onclick="BKP.pending=null;render()">Cancel</button></div></div>':''));
  }
  if(u.role==='admin'){
    h+=card('<b>🏫 Institute backup (admin)</b><div style="font-size:13px;color:var(--muted);margin:6px 0 10px">Collections chuno → ek hi .json file download. Isme students ka personal data hota hai — file ko sirf private Google Drive me rakho, kisi group me share mat karo. Question bank (mcqBank) ke liye apni CSV file hi backup hai.</div>'+
      '<div class="mcq-tabs" role="group" aria-label="Collections">'+COLS.map(function(c){ return '<button class="mcq-chip '+(B.sel[c[0]]?'on':'')+'" onclick="BKP.togCol(\''+c[0]+'\')">'+c[1]+'</button>'; }).join('')+'</div>'+
      '<button class="btn btn-primary btn-sm" '+(B.busy?'disabled':'')+' onclick="BKP.exportAll()">'+(B.busy==='all'?'Backing up…':'⬇ Download institute backup')+'</button>'+
      '<pre id="bkpLog" style="margin-top:12px;max-height:180px;overflow:auto;background:var(--paper-2);padding:10px 12px;border-radius:10px;font-size:12px;white-space:pre-wrap">'+esc(B.log)+'</pre>'+
      '<div style="font-size:12px;color:var(--faint);margin-top:8px">Restore of institute data is done by Claude from this file (safer than a button) — send the file when needed.</div>');
  }
  h+=card('<b>🐞 Is phone ki problem report</b><div style="font-size:13px;color:var(--muted);margin:6px 0 12px">'+(errs.length?errs.length+' error(s) is device par record hue. Agar app me kuch galat chal raha hai to report copy karke admin ko bhejo.':'Koi error record nahi hua. 👍')+'</div>'+
    '<button class="btn btn-outline btn-sm" '+(errs.length?'':'disabled')+' onclick="BKP.copyLocal()">📋 Copy report</button> <button class="btn btn-ghost btn-sm" '+(errs.length?'':'disabled')+' onclick="BKP.clearLocal()">Clear</button>');
  return shell(h);
};
B.copyLocal=function(){ copy(ERRLOG.text()); };
B.clearLocal=function(){ ERRLOG.clear(); toast('Cleared','🗑'); render(); };
function copy(t){
  function fallback(){ var a=document.createElement('textarea'); a.value=t; document.body.appendChild(a); a.select(); try{ document.execCommand('copy'); toast('Copied ✓','📋'); }catch(e){ toast('Copy nahi hua','⚠️'); } a.remove(); }
  try{ navigator.clipboard.writeText(t).then(function(){ toast('Copied ✓','📋'); },fallback); }catch(e){ fallback(); }
}

/* ================= error log (admin) ================= */
B.loadErrs=function(){
  var d=fdb(); if(!d||B.errBusy) return; B.errBusy=true;
  d.collection('errorLogs').orderBy('last','desc').limit(100).get().then(function(s){
    B.errs=s.docs.map(function(x){ return Object.assign({id:x.id},x.data()); });
  }).catch(function(e){ console.warn(e); B.errs=[]; B.errMsg='Error log load nahi hua (rules publish kiye?)'; }).then(function(){ B.errBusy=false; refresh(); });
};
B.delErr=function(id){ fdb().collection('errorLogs').doc(id).delete().then(function(){ B.errs=(B.errs||[]).filter(function(x){ return x.id!==id; }); refresh(); }).catch(function(){ toast('Delete nahi hua','⚠️'); }); };
B.delAll=function(){
  if(!confirm('Saare error records delete karein? (Jab sab fix ho jaye tab karo)')) return;
  var d=fdb(), ids=(B.errs||[]).map(function(x){ return x.id; }), b=d.batch(); ids.forEach(function(i){ b.delete(d.collection('errorLogs').doc(i)); });
  b.commit().then(function(){ B.errs=[]; refresh(); toast('Cleared','🗑'); }).catch(function(){ toast('Delete nahi hua','⚠️'); });
};
B.reload=function(){ B.errs=null; B.errBusy=false; render(); };
B.copyErrs=function(){
  var t='DSA app error log ('+new Date().toLocaleString()+')\n\n'+(B.errs||[]).map(function(x,i){
    return (i+1)+'. ['+x.kind+'] x'+(x.count||1)+' · screen: '+x.view+' · role: '+x.role+' · version: '+x.ver+'\n   '+x.msg+(x.src?'\n   at '+x.src+':'+x.line:'')+(x.stack?'\n   '+String(x.stack).replace(/\n/g,'\n   '):'');
  }).join('\n\n'); copy(t);
};
window.renderErrLog=function(){
  var u=user(); if(!u) return renderAuth();
  if(u.role!=='admin') return shell(head('🐞 Error Log','')+card('Sirf admin ke liye.'));
  if(!fdb()) return shell(head('🐞 Error Log','')+card('Live mode me chalta hai.'));
  if(B.errs===null){ B.loadErrs(); return shell(head('🐞 Error Log','')+card('<div style="text-align:center;color:var(--muted);padding:16px">⏳ Loading…</div>')); }
  var errs=B.errs, tot=errs.reduce(function(s,x){ return s+(x.count||1); },0);
  var h=head('🐞 Error Log','Students ke phones par jo errors aaye — same error ek hi line me count ke saath');
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn btn-outline btn-sm" onclick="BKP.reload()">⟳ Refresh</button><button class="btn btn-primary btn-sm" '+(errs.length?'':'disabled')+' onclick="BKP.copyErrs()">📋 Copy all (paste to Claude)</button><button class="btn btn-ghost btn-sm" '+(errs.length?'':'disabled')+' onclick="BKP.delAll()">🗑 Clear all</button></div>';
  if(B.errMsg) h+=card(esc(B.errMsg),'border-color:var(--red-500)');
  if(!errs.length) return shell(h+card('<div style="text-align:center;padding:24px;color:var(--muted)"><div style="font-size:32px">🎉</div>Koi error record nahi hai.</div>'));
  h+='<div style="font-size:13px;color:var(--muted);margin-bottom:10px">'+errs.length+' distinct errors · '+tot+' total hits (latest 100 shown)</div>';
  h+=errs.map(function(x){
    var t=x.last&&x.last.toDate?x.last.toDate().toLocaleString():'';
    return '<details class="mcq-rev bad"><summary><span class="pill pill-red">×'+(x.count||1)+'</span> <span class="pill pill-navy">'+esc(x.kind||'js')+'</span> '+esc(String(x.msg||'').slice(0,110))+'</summary>'+
      '<div style="margin-top:8px;font-size:12.5px;line-height:1.7"><b>Screen:</b> '+esc(x.view||'-')+' · <b>Role:</b> '+esc(x.role||'-')+' · <b>Version:</b> '+esc(x.ver||'-')+' · <b>Last:</b> '+esc(t)+'<br><b>File:</b> '+esc(x.src||'-')+':'+(x.line||0)+'<br><b>Device:</b> '+esc(x.ua||'')+
      (x.stack?'<pre style="white-space:pre-wrap;background:var(--paper-2);padding:8px 10px;border-radius:8px;font-size:11.5px;margin:8px 0">'+esc(x.stack)+'</pre>':'')+
      '<button class="btn btn-ghost btn-sm" onclick="BKP.delErr(\''+esc(x.id)+'\')">🗑 Mark fixed (delete)</button></div></details>';
  }).join('');
  return shell(h);
};
})();
