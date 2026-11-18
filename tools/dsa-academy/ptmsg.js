/* =========================================================================
   Dr. Shreyansh Academy — Parent ↔ Teacher Messaging (ptmsg.js)
   -------------------------------------------------------------------------
   * A parent can message any approved teacher (or the Office/admin) about
     ONE of his/her approved children. Only parent + that teacher (+ admin)
     can read the chat — enforced by Firestore rules, not just the screen.
   * Parent -> sidebar "Message Teachers". Teacher/Admin -> "Parent Messages".
   * Live chat (onSnapshot only on the open conversation), unread counters,
     reply alert in the parent's Notice Board. Text only, 1000 chars, no files
     (so it stays inside the free Spark plan).
   Data: linkOk/{parentUid_childUid}, ptThreads/{parentUid_staff_childUid},
         ptThreads/{id}/msgs/{auto}
   ========================================================================= */
(function(){
'use strict';
var P=window.PT={threads:null,busy:false,err:'',active:null,msgs:[],unsub:null,tick:null,kids:null,faculty:null,comp:null,sending:false};

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function user(){ try{ return DB.currentUser; }catch(e){ return null; } }
function fdb(){ try{ return (window.FIREBASE_ENABLED && typeof fbDb!=='undefined') ? fbDb : null; }catch(e){ return null; } }
function FV(){ return firebase.firestore.FieldValue; }
function refresh(){ try{ if(ROUTE.view==='pt') render(); }catch(e){} }
function when(t){ try{ var d=t&&t.toDate?t.toDate():(t?new Date(t):null); if(!d) return ''; var n=new Date(); return (d.toDateString()===n.toDateString()?'':d.toLocaleDateString([], {day:'numeric',month:'short'})+' ')+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
function role(){ var u=user(); return u&&u.role; }
function isParent(){ return role()==='parent'; }
function mine(){ var u=user(); return isParent()?'p':'s'; }

(function(){
  if(document.getElementById('pt-css')) return;
  var st=document.createElement('style'); st.id='pt-css';
  st.textContent=
  '.pt-wrap{display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start}'+
  '.pt-th{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:var(--card);cursor:pointer;width:100%;text-align:left;color:var(--ink)}'+
  '.pt-th.on{border-color:var(--navy-600);background:var(--paper-2)}.pt-th b{font-size:13.5px;display:block}.pt-th small{color:var(--muted);font-size:12px;display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}'+
  '.pt-dot{min-width:20px;height:20px;border-radius:99px;background:var(--red-500);color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}'+
  '.pt-chat{display:flex;flex-direction:column;height:min(70vh,560px)}.pt-log{flex:1;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px}'+
  '.pt-m{max-width:78%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;background:var(--paper-2);color:var(--ink);align-self:flex-start}'+
  '.pt-m.me{align-self:flex-end;background:var(--navy-700);color:#fff}.pt-m small{display:block;font-size:11px;opacity:.75;margin-top:3px}'+
  '.pt-send{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border)}.pt-send textarea{flex:1;resize:none;height:44px;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font:inherit;font-size:14px;background:var(--card);color:var(--ink)}'+
  '@media(max-width:800px){.pt-wrap{grid-template-columns:1fr}.pt-chat{height:70vh}}';
  document.head.appendChild(st);
})();

/* ---------- data ---------- */
function myStaffKey(){ var u=user(); return u.role==='admin'?'office':u.uid; }
P.loadThreads=function(){
  var d=fdb(), u=user(); if(!d||!u||!u.uid) return;
  if(P.busy) return; P.busy=true; P.err='';
  var q=isParent()?d.collection('ptThreads').where('parentUid','==',u.uid):d.collection('ptThreads').where('staffId','==',myStaffKey());
  q.get().then(function(s){
    P.threads=s.docs.map(function(x){ return Object.assign({id:x.id},x.data()); }).sort(function(a,b){ var A=a.lastTs&&a.lastTs.toMillis?a.lastTs.toMillis():0, B=b.lastTs&&b.lastTs.toMillis?b.lastTs.toMillis():0; return B-A; });
  }).catch(function(e){ console.warn('[PT] threads',e); P.err='Messages load nahi hue. Internet check karke Refresh dabao.'; P.threads=P.threads||[]; })
  .then(function(){ P.busy=false; refresh(); });
};
function unreadOf(t){ return isParent()?(t.unreadP||0):(t.unreadS||0); }
P.totalUnread=function(){ return (P.threads||[]).reduce(function(s,t){ return s+unreadOf(t); },0); };

function loadKids(){
  var u=user(), d=fdb(); if(!d||P.kids||P.kidsBusy) return; P.kidsBusy=true;
  d.collection('parentLinks').where('parentUid','==',u.uid).get().then(function(s){
    var links=s.docs.map(function(x){ return Object.assign({id:x.id},x.data()); }).filter(function(l){ return l.status==='approved'; });
    return Promise.all(links.map(function(l){
      return d.collection('users').where('email','==',l.childEmail).limit(1).get().then(function(r){
        if(r.empty) return null; var c=r.docs[0]; return {uid:c.id,name:c.data().name||l.childEmail,email:l.childEmail,linkId:l.id};
      }).catch(function(){ return null; });
    }));
  }).then(function(a){ P.kids=a.filter(Boolean); }).catch(function(){ P.kids=[]; }).then(function(){ P.kidsBusy=false; refresh(); });
}
function loadFaculty(){
  var d=fdb(); if(!d||P.faculty||P.facBusy) return; P.facBusy=true;
  d.collection('users').where('role','==','faculty').get().then(function(s){
    P.faculty=s.docs.map(function(x){ var v=x.data(); return {uid:x.id,name:v.name||'Teacher',subject:v.subject||'',approved:v.approved===true}; }).filter(function(f){ return f.approved; });
  }).catch(function(){ P.faculty=[]; }).then(function(){ P.facBusy=false; refresh(); });
}
function ensureLinkOk(kid){ // proof (checked by the rules) that this child really approved this parent
  var d=fdb(), u=user(), id=u.uid+'_'+kid.uid, ref=d.collection('linkOk').doc(id);
  return ref.get().then(function(s){ if(s.exists) return; return ref.set({parentUid:u.uid,childUid:kid.uid,childEmail:kid.email,linkId:kid.linkId}); });
}

/* ---------- open / listen ---------- */
function stopListen(){ if(P.unsub){ try{ P.unsub(); }catch(e){} P.unsub=null; } if(P.tick){ clearInterval(P.tick); P.tick=null; } }
P.open=function(id){
  var d=fdb(); if(!d) return;
  stopListen(); if(P.active!==id) P.draft=''; P.active=id; P.msgs=[]; refresh();
  P.unsub=d.collection('ptThreads').doc(id).collection('msgs').orderBy('ts','asc').limitToLast(150).onSnapshot(function(s){
    P.msgs=s.docs.map(function(x){ return Object.assign({id:x.id},x.data()); });
    refresh(); setTimeout(function(){ var l=document.getElementById('ptLog'); if(l) l.scrollTop=l.scrollHeight; },30);
    markRead(id);
  },function(e){ console.warn('[PT] listen',e); P.err='Chat open nahi ho paya.'; refresh(); });
  P.tick=setInterval(function(){ try{ if(ROUTE.view!=='pt'){ stopListen(); } }catch(e){} },2500);
};
function markRead(id){
  var t=(P.threads||[]).filter(function(x){ return x.id===id; })[0]; if(!t) return;
  var k=isParent()?'unreadP':'unreadS'; if(!(t[k]>0)) return;
  t[k]=0; fdb().collection('ptThreads').doc(id).update(function(){ var o={}; o[k]=0; return o; }()).catch(function(){});
}
P.back=function(){ stopListen(); P.active=null; P.comp=null; P.loadedOnce=false; P.threads=null; render(); };
P.refresh=function(){ P.threads=null; P.busy=false; render(); };

/* ---------- sending ---------- */
P.send=function(){
  var ta=document.getElementById('ptText'); if(!ta) return; var text=ta.value.trim();
  var t=(P.threads||[]).filter(function(x){ return x.id===P.active; })[0];
  if(!text||!t||P.sending) return; if(text.length>1000){ toast('Message 1000 characters se chhota rakho','⚠️'); return; }
  var d=fdb(), u=user(), side=mine(); P.sending=true;
  var tr=d.collection('ptThreads').doc(t.id);
  tr.collection('msgs').add({from:u.uid,side:side,name:u.name||'',text:text,ts:FV().serverTimestamp()}).then(function(){
    var upd={last:text.slice(0,80),lastBy:side,lastTs:FV().serverTimestamp()};
    upd[side==='p'?'unreadS':'unreadP']=FV().increment(1);
    return tr.update(upd);
  }).then(function(){
    ta.value=''; P.draft=''; P.sending=false;
    if(side==='s'&&t.parentEmail){ // alert in the parent's Notice Board (staff may create notifications)
      d.collection('notifications').add({toEmail:t.parentEmail,title:'💬 New message from '+(u.name||'teacher'),msg:text.slice(0,120),kind:'message',by:u.name||'',when:FV().serverTimestamp(),read:false}).catch(function(){});
    }
  }).catch(function(e){ P.sending=false; console.warn('[PT] send',e); toast('Message nahi gaya — dobara try karo','⚠️'); });
};
P.keydown=function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); P.send(); } };

/* ---------- compose (parent) ---------- */
P.newMsg=function(){ P.comp={kid:'',staff:'',text:''}; P.kids=null; P.faculty=null; stopListen(); P.active=null; render(); };
P.compSet=function(k,v){ P.comp[k]=v; };
P.compSend=function(){
  var c=P.comp, d=fdb(), u=user(); if(!c) return;
  c.text=(document.getElementById('ptNew').value||'').trim();
  var kid=(P.kids||[]).filter(function(k){ return k.uid===c.kid; })[0], staff=c.staff;
  if(!kid||!staff||!c.text){ toast('Bachcha, teacher aur message teeno chuno','⚠️'); return; }
  if(c.text.length>1000){ toast('Message 1000 characters se chhota rakho','⚠️'); return; }
  var fac=(P.faculty||[]).filter(function(f){ return f.uid===staff; })[0];
  var id=u.uid+'_'+staff+'_'+kid.uid, tr=d.collection('ptThreads').doc(id), side='p';
  c.busy=true; render();
  ensureLinkOk(kid).then(function(){ return tr.get(); }).then(function(s){
    if(s.exists) return;
    return tr.set({parentUid:u.uid,parentName:u.name||'',parentEmail:u.email||'',staffId:staff,staffName:staff==='office'?'Office':(fac?fac.name:'Teacher'),staffRole:staff==='office'?'admin':'faculty',staffSubject:fac?fac.subject:'',
      childUid:kid.uid,childName:kid.name,last:'',lastBy:'p',lastTs:FV().serverTimestamp(),unreadP:0,unreadS:0,created:FV().serverTimestamp()});
  }).then(function(){
    return tr.collection('msgs').add({from:u.uid,side:'p',name:u.name||'',text:c.text,ts:FV().serverTimestamp()});
  }).then(function(){
    return tr.update({last:c.text.slice(0,80),lastBy:'p',lastTs:FV().serverTimestamp(),unreadS:FV().increment(1)});
  }).then(function(){
    P.comp=null; P.threads=null; P.busy=false; toast('Message bhej diya ✓','✉️'); render(); setTimeout(function(){ P.open(id); },600);
  }).catch(function(e){ console.warn('[PT] new',e); c.busy=false; toast('Message nahi gaya. Link verify/permission check karo.','⚠️'); render(); });
};

/* ---------- screens ---------- */
function shell(body){ var r=role(); var id='pt'; return '<div class="app-shell">'+sidebar(id)+'<div class="main" style="max-width:1050px">'+body+'</div></div>'; }
function head(t,s,extra){ return '<div class="main-head"><div><h2>'+t+'</h2><p>'+s+'</p></div><div>'+(extra||'')+'</div></div>'; }
function card(h,st){ return '<div class="card" style="padding:18px 20px;margin-bottom:14px;'+(st||'')+'">'+h+'</div>'; }
function title(){ return isParent()?'✉️ Message Teachers':'💬 Parent Messages'; }

window.renderPT=function(){
  var u=user(); if(!u) return renderAuth();
  if(!fdb()) return shell(head(title(),'')+card('Messaging Live mode me chalta hai (Firebase connect hona chahiye).'));
  if(isParent() && P.comp) return shell(scrCompose());
  if(P.threads===null){ P.loadThreads(); return shell(head(title(),'')+card('<div style="text-align:center;color:var(--muted);padding:16px">⏳ Loading…</div>')); }
  return shell(scrList());
};
function scrCompose(){
  var c=P.comp; loadKids(); loadFaculty();
  if(!P.kids||!P.faculty) return head('✉️ New message','')+card('<div style="text-align:center;color:var(--muted);padding:16px">⏳ Loading teachers…</div>');
  if(!P.kids.length) return head('✉️ New message','')+card('Pehle apne bachche ka link approve karwao (Overview → Link your child). Uske baad yahan se message kar sakte ho.')+'<button class="btn btn-outline btn-sm" onclick="PT.back()">← Back</button>';
  if(!c.kid&&P.kids.length===1) c.kid=P.kids[0].uid;
  return head('✉️ New message','Teacher aur office ko seedha likho')+
  card('<div class="field"><label>Kis bachche ke baare me?</label><select id="ptKid" onchange="PT.compSet(\'kid\',this.value)"><option value="">— chuno —</option>'+P.kids.map(function(k){ return '<option value="'+esc(k.uid)+'" '+(c.kid===k.uid?'selected':'')+'>'+esc(k.name)+'</option>'; }).join('')+'</select></div>'+
    '<div class="field"><label>Kisko bhejna hai?</label><select id="ptStaff" onchange="PT.compSet(\'staff\',this.value)"><option value="">— chuno —</option><option value="office" '+(c.staff==='office'?'selected':'')+'>🏫 Office (Admin)</option>'+P.faculty.map(function(f){ return '<option value="'+esc(f.uid)+'" '+(c.staff===f.uid?'selected':'')+'>'+esc(f.name)+(f.subject?' — '+esc(f.subject):'')+'</option>'; }).join('')+'</select></div>'+
    '<div class="field"><label>Message</label><textarea id="ptNew" rows="5" maxlength="1000" style="width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:10px;font:inherit;font-size:14px;background:var(--card);color:var(--ink)" placeholder="Apna sawaal ya baat likho…" oninput="PT.compSet(\'text\',this.value)">'+esc(c.text||'')+'</textarea></div>'+
    '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Ye chat sirf aap, wo teacher aur school admin dekh sakte hain. Kripya sammaan ke saath likhein.</div>'+
    '<div style="display:flex;gap:8px"><button class="btn btn-primary" '+(c.busy?'disabled':'')+' onclick="PT.compSend()">'+(c.busy?'Sending…':'Send →')+'</button><button class="btn btn-ghost" onclick="PT.back()">Cancel</button></div>');
}
function scrList(){
  var ts=P.threads||[], act=ts.filter(function(t){ return t.id===P.active; })[0];
  var h=head(title(),isParent()?'Apne bachche ke teachers se baat karo':'Parents ke messages — reply yahin se',
    '<button class="btn btn-ghost btn-sm" onclick="PT.refresh()">⟳ Refresh</button>'+(isParent()?' <button class="btn btn-primary btn-sm" onclick="PT.newMsg()">✉️ New message</button>':''));
  if(P.err) h+=card(esc(P.err),'border-color:var(--red-500)');
  if(!ts.length){
    return h+card('<div style="text-align:center;padding:24px;color:var(--muted)"><div style="font-size:32px">💬</div>'+(isParent()?'Abhi koi baat-cheet nahi hai. "New message" se teacher ko likho.':'Abhi koi message nahi aaya.')+'</div>');
  }
  var left=ts.map(function(t){
    var n=unreadOf(t), who=isParent()?(esc(t.staffName)+(t.staffSubject?' · '+esc(t.staffSubject):'')):(esc(t.parentName)+' <small style="display:inline;color:var(--muted)">(parent)</small>');
    return '<button class="pt-th '+(t.id===P.active?'on':'')+'" onclick="PT.open(\''+esc(t.id)+'\')"><div style="flex:1;min-width:0"><b>'+who+'</b><small>re: '+esc(t.childName||'')+'</small><small>'+esc(t.last||'')+'</small></div>'+(n?'<span class="pt-dot" aria-label="'+n+' unread">'+n+'</span>':'')+'</button>';
  }).join('');
  var right;
  if(act){
    var u=user();
    right='<div class="card pt-chat"><div style="padding:12px 16px;border-bottom:1px solid var(--border)"><b>'+(isParent()?esc(act.staffName):esc(act.parentName))+'</b><div style="font-size:12px;color:var(--muted)">Bachcha: '+esc(act.childName||'')+'</div></div>'+
      '<div class="pt-log" id="ptLog" role="log" aria-live="polite">'+(P.msgs.length?P.msgs.map(function(m){ return '<div class="pt-m '+(m.from===u.uid?'me':'')+'">'+esc(m.text)+'<small>'+esc(m.from===u.uid?'You':m.name)+' · '+when(m.ts)+'</small></div>'; }).join(''):'<div style="color:var(--muted);text-align:center;margin:auto">Loading…</div>')+'</div>'+
      '<div class="pt-send"><textarea id="ptText" maxlength="1000" placeholder="Message likho… (Enter = send)" aria-label="Message" oninput="PT.draft=this.value" onkeydown="PT.keydown(event)">'+esc(P.draft||'')+'</textarea><button class="btn btn-primary" onclick="PT.send()">Send</button></div></div>';
  } else right='<div class="card" style="padding:40px;text-align:center;color:var(--muted)">Left se conversation chuno</div>';
  return h+'<div class="pt-wrap"><div>'+left+'</div><div>'+right+'</div></div>';
}
})();
