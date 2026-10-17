/* =========================================================================
   Dr. Shreyansh Academy — Rewards (rewards.js)
   XP · levels · badges · streak freezes · weekly league.
   All data lives in the student's own learnData document (free tier), and a
   tiny summary is mirrored to their profile so the league can rank everyone.
   ========================================================================= */
(function(){
'use strict';
var RWD=window.RWD={}, W={league:null,lbusy:false,mine:true};
var TITLES=['Beginner','Learner','Explorer','Achiever','Scholar','Expert','Master','Champion','Legend'];
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return window.__LRN_TODAY||ymd(new Date()); }
function weekKey(){ var x=new Date(today()+'T00:00:00'); x.setDate(x.getDate()-((x.getDay()+6)%7)); return ymd(x); }
function lvOf(xp){ return Math.floor(Math.sqrt(xp/50))+1; }
function titleOf(lv){ return TITLES[Math.min(TITLES.length-1,lv-1)]; }
function me(){ return DB.currentUser; }
function firstName(n){ var p=String(n||'Student').trim().split(/\s+/); return p[0]+(p[1]?' '+p[1][0]+'.':''); }
function totals(P){ var a=0,c=0,ch=0; Object.keys(P.ch||{}).forEach(function(k){ a+=P.ch[k].a; c+=P.ch[k].c; if(k!=='gen'&&P.ch[k].a>0) ch++; }); return {a:a,c:c,ch:ch}; }
function mastered(P){ var n=0; try{ MCQ.index.chapters.forEach(function(c){ var p=P.ch[c.k]; if(p&&p.a>=20&&p.c/p.a>=0.85) n++; }); }catch(e){} return n; }

var BADGES=[
 {id:'first10',ic:'🌱',n:'First steps',d:'Attempt 10 questions',f:function(x){ return x.t.a>=10; }},
 {id:'c100',ic:'💯',n:'Century',d:'100 correct answers',f:function(x){ return x.t.c>=100; }},
 {id:'c500',ic:'🚀',n:'High flyer',d:'500 correct answers',f:function(x){ return x.t.c>=500; }},
 {id:'c1000',ic:'👑',n:'Thousand club',d:'1,000 correct answers',f:function(x){ return x.t.c>=1000; }},
 {id:'s7',ic:'🔥',n:'Week warrior',d:'7-day practice streak',f:function(x){ return (x.P.streak&&x.P.streak.n)>=7; }},
 {id:'s30',ic:'🌋',n:'Unstoppable',d:'30-day practice streak',f:function(x){ return (x.P.streak&&x.P.streak.n)>=30; }},
 {id:'perfect',ic:'🎯',n:'Perfect round',d:'Finish a round of 8+ questions with zero mistakes',f:function(x){ return x.perfect; }},
 {id:'rev50',ic:'🔁',n:'Revision hero',d:'Clear 50 revision questions',f:function(x){ return x.D.gx.rc>=50; }},
 {id:'mock',ic:'📝',n:'Mock warrior',d:'Complete a full mock exam',f:function(x){ return x.D.gx.mk>=1; }},
 {id:'master',ic:'🏆',n:'Chapter master',d:'Master a chapter (85%+ over 20+ questions)',f:function(x){ return mastered(x.P)>=1; }},
 {id:'explore5',ic:'🧭',n:'Explorer',d:'Practise 5 different chapters',f:function(x){ return x.t.ch>=5; }},
 {id:'goal5',ic:'✅',n:'Goal getter',d:'Hit your daily goal on 5 days',f:function(x){ return x.D.gx.gd>=5; }},
 {id:'gen50',ic:'♾',n:'Numerical ninja',d:'Solve 50 infinite numericals',f:function(x){ return ((x.P.ch.gen||{}).a||0)>=50; }}
];

/* called by learn.js after every finished practice / mock */
RWD.onResult=function(x){
  var D=x.D, P=x.P, gx=D.gx=Object.assign({xp:0,wk:{w:'',xp:0},gd:0,rc:0,mk:0},D.gx||{}); D.bd=D.bd||{};
  var ans=x.items.filter(function(i){ return i.a!==null; }).length; if(!ans) return;
  var perfect=ans>=8&&x.w===0, gain=ans+x.c*2+x.cleared*5+(perfect?15:0), isMock=/mock/i.test(x.label);
  if(isMock){ gx.mk=(gx.mk||0)+1; gain+=50; }
  gx.rc=(gx.rc||0)+x.cleared;
  var goal=(P.goal&&P.goal.daily)||30, tn=(P.days&&P.days[today()])||0;
  if(tn>=goal&&gx.lg!==today()){ gx.lg=today(); gx.gd=(gx.gd||0)+1; gain+=20; }
  var oldLv=lvOf(gx.xp); gx.xp+=gain;
  var wk=weekKey(); if(!gx.wk||gx.wk.w!==wk) gx.wk={w:wk,xp:0}; gx.wk.xp+=gain;
  var ctx={D:D,P:P,t:totals(P),perfect:perfect}, got=[];
  BADGES.forEach(function(b){ if(!D.bd[b.id]&&b.f(ctx)){ D.bd[b.id]=Date.now(); got.push(b); } });
  if(window.toast){ toast('+'+gain+' XP','⭐'); if(lvOf(gx.xp)>oldLv) setTimeout(function(){ toast('🎉 Level up! You are now Level '+lvOf(gx.xp)+' — '+titleOf(lvOf(gx.xp)),'🎉'); },900);
    got.forEach(function(b,i){ setTimeout(function(){ toast('🏅 New badge: '+b.n,'🏅'); },1800+i*1500); }); }
  RWD.lastGain=gain; mirror(gx);
};
var mt=null;
function mirror(gx){
  var u=me(); if(!u||!u.uid||!window.FIREBASE_ENABLED) return; clearTimeout(mt);
  mt=setTimeout(function(){ fbDb.collection('users').doc(u.uid).update({gx:{xp:gx.xp,lv:lvOf(gx.xp),w:gx.wk.w,wxp:gx.wk.xp}}).catch(function(){}); },4000);
}
function loadLeague(){
  if(W.lbusy||W.league) return; W.lbusy=true;
  fbDb.collection('users').where('role','==','student').limit(300).get().then(function(s){
    var wk=weekKey(), rows=[]; s.forEach(function(d){ var u=d.data(); if(u.banned) return; var g=u.gx||{}; rows.push({id:d.id,n:firstName(u.name),b:u.batchId||'',x:g.w===wk?(g.wxp||0):0,lv:g.lv||1}); });
    W.league=rows; W.t=Date.now();
  }).catch(function(){ W.league=[]; }).then(function(){ W.lbusy=false; if(ROUTE.view==='learn') render(); });
}
window.rwdLeague=function(){ W.league=null; loadLeague(); };
window.rwdMine=function(v){ W.mine=v; render(); };

RWD.render=function(){
  var H=LRN.tabs, D=LRN.data(), P=MCQ.prog, gx=Object.assign({xp:0,wk:{w:'',xp:0},gd:0,rc:0,mk:0},D.gx||{}), xp=gx.xp, lv=lvOf(xp), lo=50*(lv-1)*(lv-1), hi=50*lv*lv, st=P.streak||{n:0}, bd=D.bd||{};
  var wk=gx.wk&&gx.wk.w===weekKey()?gx.wk.xp:0, u=me();
  var html=H.card('<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div style="width:74px;height:74px;border-radius:50%;background:linear-gradient(135deg,var(--gold-500),var(--navy-700));color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800">'+lv+'</div>'+
    '<div style="flex:1;min-width:220px"><div style="font-size:12px;color:var(--muted)">LEVEL '+lv+'</div><div style="font-size:20px;font-weight:700">'+titleOf(lv)+'</div><div style="margin:8px 0 4px">'+H.bar(Math.round((xp-lo)*100/(hi-lo)),'var(--gold-500)')+'</div><div style="font-size:12px;color:var(--muted)">'+xp+' XP · '+(hi-xp)+' XP to Level '+(lv+1)+'</div></div>'+
    '<div style="text-align:center"><div style="font-size:26px;font-weight:800">⭐ '+wk+'</div><div style="font-size:12px;color:var(--muted)">XP this week</div></div></div>');
  html+=H.card(H.h3('🔥 Streak')+'<div style="display:flex;gap:22px;flex-wrap:wrap;font-size:14px"><span><b style="font-size:22px">'+(st.n||0)+'</b> day'+((st.n||0)===1?'':'s')+'</span><span>🧊 Streak freezes: <b>'+(st.fz||0)+'</b> / 2</span></div><div style="font-size:12.5px;color:var(--muted);margin-top:8px;line-height:1.6">Miss one day and a freeze saves your streak automatically. You earn a freeze every 7 days of streak.</div>');
  html+=H.card(H.h3('🏅 Badges ('+Object.keys(bd).length+' / '+BADGES.length+')')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">'+BADGES.map(function(b){ var got=bd[b.id];
    return '<div style="padding:12px;border:1px solid var(--border);border-radius:11px;text-align:center;'+(got?'background:var(--paper-2)':'opacity:.5')+'"><div style="font-size:28px;'+(got?'':'filter:grayscale(1)')+'">'+b.ic+'</div><b style="font-size:13px">'+esc(b.n)+'</b><div style="font-size:11.5px;color:var(--muted);margin-top:3px;line-height:1.4">'+esc(b.d)+'</div></div>'; }).join('')+'</div>');
  html+=H.card(H.h3('🏆 Weekly league')+(W.league?(function(){
      var rows=W.league.filter(function(r){ return W.mine&&u.batchId?r.b===u.batchId:true; }).filter(function(r){ return r.x>0||r.id===u.uid; }).sort(function(a,b){ return b.x-a.x; });
      var my=rows.findIndex(function(r){ return r.id===u.uid; });
      return (u.batchId?'<div class="mcq-tabs"><button class="mcq-chip '+(W.mine?'on':'')+'" onclick="rwdMine(true)">My batch</button><button class="mcq-chip '+(!W.mine?'on':'')+'" onclick="rwdMine(false)">Everyone</button></div>':'')+
        (rows.length?'<table class="table-simple"><tbody>'+rows.slice(0,10).map(function(r,i){ return '<tr style="'+(r.id===u.uid?'background:var(--paper-2);font-weight:700':'')+'"><td style="width:44px">'+(i<3?['🥇','🥈','🥉'][i]:(i+1))+'</td><td>'+esc(r.n)+(r.id===u.uid?' (you)':'')+'</td><td>Lv '+r.lv+'</td><td style="text-align:right"><b>'+r.x+'</b> XP</td></tr>'; }).join('')+'</tbody></table>'+(my>=10?'<div style="font-size:13px;margin-top:8px">Your rank: <b>#'+(my+1)+'</b></div>':''):'<div style="font-size:13px;color:var(--muted)">No XP earned this week yet — practise to appear here.</div>')+
        '<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="rwdLeague()">↻ Refresh</button>'; })():'<button class="btn btn-outline btn-sm" onclick="rwdLeague()">Show this week\'s league</button>')+
    '<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.6">XP: +1 per question tried, +2 more for each correct answer, +5 for each revision cleared, +15 perfect round, +20 daily goal, +50 mock exam.</div>');
  return html;
};
RWD.badges=BADGES; RWD.level=lvOf;
})();
