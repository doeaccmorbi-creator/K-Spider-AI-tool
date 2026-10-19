/* =========================================================================
   Dr. Shreyansh Academy — Premium (premium.js)
   Real, free-to-run premium: the student pays by UPI, submits the transaction
   ID, the admin verifies it in their own UPI app and activates Premium with an
   expiry date. No payment gateway, no server, no monthly cost.
   • Replaces the old demo "Plans" screen (which flipped the plan for free).
   • The student can no longer change their own plan — only the admin can.
   • Plan + expiry are read from the server on every login, so a student
     cannot fake Premium and an expired plan falls back to Free by itself.
   ========================================================================= */
(function(){
'use strict';
var PRM=window.PRM={}, P={cfg:null,cb:false,cAt:0,reqs:null,rb:false,synced:'',sel:''};
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function live(){ return !!window.FIREBASE_ENABLED && typeof fbDb!=='undefined'; }
function me(){ return DB.currentUser; }
function ts(){ return firebase.firestore.FieldValue.serverTimestamp(); }
function dleft(ms){ return Math.ceil((ms-Date.now())/864e5); }
function dstr(ms){ return new Date(ms).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function when(w){ var d=w&&w.toDate?w.toDate():null; return d?d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''; }

/* ---- server truth: plan + expiry (runs once per login) ---- */
PRM.sync=function(force){
  var u=me(); if(!u||u.role!=='student'||!live()||!u.uid) return;
  if(!force&&P.synced===u.uid) return; P.synced=u.uid;
  fbDb.collection('users').doc(u.uid).get().then(function(d){
    if(!d.exists) return; var x=d.data(), exp=x.planExpiry&&x.planExpiry.toMillis?x.planExpiry.toMillis():0, plan=x.plan||'free', expired=false;
    if(plan==='premium'&&exp&&exp<Date.now()){ plan='free'; expired=true; }
    var changed=u.plan!==plan||u.planExpiryMs!==exp||u.planExpired!==expired;
    u.plan=plan; u.planExpiryMs=exp; u.planExpired=expired;
    if(changed&&typeof render==='function') render();
  }).catch(function(){});
};
function loadCfg(){
  if(P.cb||(P.cfg&&Date.now()-P.cAt<300000)) return; P.cb=true;
  fbDb.collection('config').doc('premium').get().then(function(d){ P.cfg=d.exists?d.data():{}; }).catch(function(){ P.cfg=P.cfg||{}; })
    .then(function(){ P.cb=false; P.cAt=Date.now(); if(ROUTE.view==='plans') render(); });
}
function loadReqs(){
  if(P.rb||P.reqs) return; P.rb=true; var u=me();
  fbDb.collection('premiumRequests').where('uid','==',u.uid).get().then(function(s){ P.reqs=s.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }).sort(function(a,b){ var x=a.when&&a.when.toMillis?a.when.toMillis():0,y=b.when&&b.when.toMillis?b.when.toMillis():0; return y-x; }); })
    .catch(function(){ P.reqs=[]; }).then(function(){ P.rb=false; if(ROUTE.view==='plans') render(); });
}

/* ---- the Plans screen ---- */
var FREE=['All Master Notes with diagrams','All DPPs (1/2/3) per chapter','All Chapter Tests','Doubt-solving','Progress & weak-topic report','10 sample MCQs in every chapter','Infinite numericals, Rewards & Study Planner'];
var PREM=['Everything in Free','<b>Full question bank</b> — 16,500+ MCQs, all chapters','Test mode, filters, Daily Challenge, Weak-area practice','<b>NEET / JEE full mock exams</b> with coaching insights','Smart practice, spaced revision & analytics','Full Syllabus Mock Tests','Priority doubt replies'];
function li(a){ return a.map(function(x){ return '<li>'+x+'</li>'; }).join(''); }
window.renderPlans=function(){
  if(!me()) return renderAuth();
  var u=me(), isPrem=u.plan==='premium';
  if(!live()) return shell(demo());
  PRM.sync(); loadCfg(); loadReqs();
  var cfg=P.cfg||{}, plans=(cfg.plans||[]).filter(function(p){ return p&&p.price>0&&p.days>0; });
  if(!P.sel&&plans.length) P.sel=plans[0].id;
  var sel=plans.filter(function(p){ return p.id===P.sel; })[0], exp=u.planExpiryMs||0, pend=(P.reqs||[]).filter(function(r){ return r.status==='pending'; });
  var status=isPrem
    ? '<div class="card" style="padding:16px 20px;margin-bottom:16px;border-color:var(--gold-500)"><span class="pill pill-gold">★ PREMIUM ACTIVE</span> <span style="font-size:14px;margin-left:8px">'+(exp?'valid till <b>'+dstr(exp)+'</b> · '+Math.max(0,dleft(exp))+' day'+(dleft(exp)===1?'':'s')+' left':'No expiry date set')+'</span>'+(exp&&dleft(exp)<=7?'<div style="font-size:13px;color:var(--red-600);margin-top:6px">⚠️ Expiring soon — renew below to keep your access.</div>':'')+'</div>'
    : (u.planExpired?'<div class="card" style="padding:14px 18px;margin-bottom:16px;background:var(--red-100);border-color:var(--red-500);font-size:14px">⏳ Your Premium expired on <b>'+dstr(exp)+'</b>. Renew below to unlock everything again.</div>':'');
  return shell('<div class="main-head"><div><h2>💎 Plans</h2><p>Chapter notes, DPPs and Chapter Tests are free — forever</p></div></div>'+status+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-bottom:18px">'+
      '<div class="card" style="padding:22px"><span class="pill pill-navy" style="margin-bottom:10px">Free</span><h3 style="font-size:22px;margin-bottom:12px">₹0 <span style="font-size:13px;color:var(--muted)">forever</span></h3><ul style="font-size:13.5px;line-height:1.9;padding-left:18px;margin:0">'+li(FREE)+'</ul></div>'+
      '<div class="card" style="padding:22px;border-color:var(--gold-500)"><span class="pill pill-gold" style="margin-bottom:10px">Premium</span><h3 style="font-size:22px;margin-bottom:12px">'+(plans.length?'from ₹'+Math.min.apply(null,plans.map(function(p){ return p.price; })):'—')+'</h3><ul style="font-size:13.5px;line-height:1.9;padding-left:18px;margin:0">'+li(PREM)+'</ul></div></div>'+
    (P.cfg===null?'<div class="card" style="padding:24px;text-align:center;color:var(--muted)">Loading plans…</div>':
     (plans.length&&cfg.upi?buy(cfg,plans,sel,pend):'<div class="card" style="padding:22px;font-size:14px;line-height:1.7">💬 Premium enrolment is handled by the academy. Please contact the admin to activate Premium — it is switched on within a few hours of payment.</div>'))+
    history()+
    '<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="pmRefresh()">↻ Refresh my plan</button> <button class="btn btn-ghost btn-sm" onclick="pmRestore()">I already have Premium on another device</button></div>');
};
function shell(b){ return '<div class="app-shell">'+sidebar('plans')+'<div class="main" style="max-width:860px">'+b+'</div></div>'; }
function demo(){ return '<div class="main-head"><div><h2>💎 Plans</h2><p>Premium works in live mode. Connect Firebase first.</p></div></div>'; }
function buy(cfg,plans,sel,pend){
  var amt=sel?sel.price:0, link='upi://pay?pa='+encodeURIComponent(cfg.upi)+'&pn='+encodeURIComponent(cfg.payee||'Dr Shreyansh Academy')+'&am='+amt+'&cu=INR&tn='+encodeURIComponent('DSA Premium');
  return '<div class="card" style="padding:22px;margin-bottom:16px"><h3 style="font-size:16px;margin:0 0 14px">Get Premium in 3 steps</h3>'+
    '<div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">1 · CHOOSE A PLAN</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px">'+
    plans.map(function(p){ var on=p.id===P.sel; return '<div onclick="pmPick(\''+esc(p.id)+'\')" style="cursor:pointer;padding:12px;border:2px solid '+(on?'var(--gold-500)':'var(--border)')+';border-radius:11px;background:'+(on?'var(--paper-2)':'#fff')+'"><b>'+esc(p.name)+'</b><div style="font-size:20px;font-weight:700;margin:4px 0">₹'+p.price+'</div><div style="font-size:12px;color:var(--muted)">'+p.days+' days · ₹'+(Math.round(p.price*10/p.days)/10)+'/day</div></div>'; }).join('')+'</div>'+
    '<div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">2 · PAY ₹'+amt+' BY UPI</div><div style="padding:14px;border:1px dashed var(--border);border-radius:11px;margin-bottom:18px;font-size:14px;line-height:1.8">UPI ID: <b id="pmUpi">'+esc(cfg.upi)+'</b> <button class="btn btn-outline btn-sm" onclick="pmCopy()">Copy</button><br>Name: <b>'+esc(cfg.payee||'Dr Shreyansh Academy')+'</b><br><a class="btn btn-gold btn-sm" style="margin-top:8px" href="'+esc(link)+'">📱 Open my UPI app</a> <span style="font-size:12px;color:var(--muted)">(works on phones; on a computer pay from your phone)</span>'+(cfg.note?'<div style="font-size:12.5px;color:var(--muted);margin-top:8px">'+esc(cfg.note)+'</div>':'')+'</div>'+
    '<div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:8px">3 · SUBMIT YOUR TRANSACTION ID</div>'+
    (pend.length?'<div style="font-size:13.5px;color:var(--gold-700)">⏳ You already have a request waiting for verification — the admin will activate Premium shortly.</div>':
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="pmUtr" class="mcq-sel" style="padding:10px 12px;flex:1;min-width:220px;text-transform:uppercase" maxlength="22" placeholder="UPI reference / UTR (12 digits)"><button class="btn btn-primary" onclick="pmSubmit()">Submit for activation</button></div><div style="font-size:12px;color:var(--muted);margin-top:8px">Find it in your UPI app under “Transaction details” → “UPI Ref / UTR”. Each ID can be used only once.</div>')+'</div>';
}
function history(){
  if(!P.reqs||!P.reqs.length) return '';
  return '<div class="card" style="padding:18px 20px;margin-bottom:12px"><h3 style="font-size:15px;margin:0 0 10px">My requests</h3><table class="table-simple"><tbody>'+P.reqs.slice(0,8).map(function(r){
    var st=r.status==='approved'?'<span class="pill pill-green">Approved</span>':(r.status==='rejected'?'<span class="pill pill-red">Rejected</span>':'<span class="pill pill-gold">Pending</span>');
    return '<tr><td>'+esc(when(r.when))+'</td><td>'+esc(r.kind==='restore'?'Restore Premium':(r.planName||''))+(r.amount?' · ₹'+r.amount:'')+'</td><td style="font-size:12px;color:var(--muted)">'+esc(r.kind==='restore'?'':r.utr)+'</td><td>'+st+(r.status==='rejected'&&r.adminNote?'<div style="font-size:12px;color:var(--red-600)">'+esc(r.adminNote)+'</div>':'')+'</td></tr>'; }).join('')+'</tbody></table></div>';
}
window.pmPick=function(id){ P.sel=id; render(); };
window.pmCopy=function(){ var t=(P.cfg&&P.cfg.upi)||''; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){ toast('UPI ID copied ✅'); }).catch(function(){ toast('Copy it manually: '+t,'ℹ️'); }); };
window.pmRefresh=function(){ P.reqs=null; P.cfg=null; PRM.sync(true); render(); toast('Checking your plan…','↻'); };
window.pmSubmit=function(){
  var u=me(), el=document.getElementById('pmUtr'), utr=(el&&el.value||'').replace(/\s+/g,'').toUpperCase(), plans=(P.cfg&&P.cfg.plans)||[], p=plans.filter(function(x){ return x.id===P.sel; })[0];
  if(!p){ toast('Choose a plan first','⚠️'); return; }
  if(!/^[A-Z0-9]{8,22}$/.test(utr)){ toast('Enter the 8–22 character UPI reference / UTR','⚠️'); return; }
  fbDb.collection('premiumRequests').doc(utr).set({uid:u.uid,email:u.email||'',name:u.name||'',planId:p.id,planName:p.name,days:p.days,amount:p.price,utr:utr,status:'pending',kind:'new',when:ts()})
    .then(function(){ P.reqs=null; toast('Submitted ✅ — the admin will verify and activate Premium','✅'); render(); })
    .catch(function(e){ toast(/permission|insufficient/i.test(e.message||'')?'This transaction ID has already been submitted':(e.message||'Could not submit'),'⚠️'); });
};
window.pmRestore=function(){
  var u=me(); if(!confirm('Use this only if you already paid for Premium and it is not showing on this device.\nSend a restore request to the admin?')) return;
  var id='R'+Date.now().toString(36).toUpperCase()+String(u.uid).slice(0,3).toUpperCase();
  fbDb.collection('premiumRequests').doc(id).set({uid:u.uid,email:u.email||'',name:u.name||'',planId:'',planName:'Restore Premium',days:0,amount:0,utr:id,status:'pending',kind:'restore',when:ts()})
    .then(function(){ P.reqs=null; toast('Restore request sent ✅','✅'); render(); }).catch(function(e){ toast(e.message||'Could not send','⚠️'); });
};
/* old demo switch: the student can no longer change the plan */
window.setPlan=function(plan){ if(plan==='premium'){ go('plans'); } else { toast('Your plan is managed by the academy — contact the admin to change it.','ℹ️'); } };

var _go=window.go; window.go=function(v,p){ var r=_go(v,p); if(v==='plans'){ P.reqs=null; } try{ PRM.sync(); }catch(e){} return r; };
})();
