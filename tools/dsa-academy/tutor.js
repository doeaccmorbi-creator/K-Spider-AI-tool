/* =========================================================================
   Dr. Shreyansh Academy — Smart Tutor (tutor.js)
   A free, no-API-key tutor that coaches instead of just revealing answers:
     1. Concept   — which chapter / formula this is, jump to the lecture
     2. Narrow    — what other students chose (real data) + exam strategy
     3. Answer    — correct option with the written explanation
     4. Explain   — optional plain-language AI explanation through the same
                    free KSpider proxy the doubt assistant already uses
                    (limited per day; the tutor still works if it is offline)
   ========================================================================= */
(function(){
'use strict';
var TU={step:1,src:null,ai:{},busy:false}, DAILY_AI=12;
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function L(i){ return String.fromCharCode(65+i); }
var TIPS={Physics:'Check the units / dimensions of every option and estimate the order of magnitude — usually two options die immediately.',
  Chemistry:'Spot the keyword (most / least / except) and use periodic trends to eliminate. For numericals, check the unit conversion first.',
  Biology:'Words like “only”, “always”, “never” are usually wrong. Recall the exact NCERT line, then eliminate.',
  Maths:'Plug a simple value (x = 1, n = 2) into every option — wrong ones fail instantly.'};
function subjOf(s){ var ch=window.MCQ&&MCQ.chapByKey&&MCQ.chapByKey(s.k); return (ch&&ch.s)||s.sub||''; }
window.tutorOpen=function(src){ TU.src=src; TU.step=1; draw(); if(src.k&&src.k!=='gen'&&window.LRN&&LRN.loadStats) LRN.loadStats(src.k).then(function(){ if(TU.src===src&&TU.step>=2) draw(); }); };
window.tutorClose=function(){ var el=document.getElementById('tutorModal'); if(el) el.remove(); TU.src=null; };
window.tutorNext=function(){ TU.step=Math.min(4,TU.step+1); draw(); };
window.tutorSession=function(){ var s=MCQ.sess; if(!s) return; var q=s.qs[s.i]; tutorOpen({q:q.q,o:q.o,a:q.a,e:q.e,m:q.m,k:q.k,i:q.i,topic:q.topic,sub:q.sub,w:s.ans[s.i]}); };
function draw(){
  var s=TU.src; if(!s) return;
  var el=document.getElementById('tutorModal');
  if(!el){ el=document.createElement('div'); el.id='tutorModal'; el.style.cssText='position:fixed;inset:0;background:rgba(10,20,40,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px'; el.onclick=function(e){ if(e.target===el) tutorClose(); }; document.body.appendChild(el); }
  var ch=window.MCQ&&MCQ.chapByKey?MCQ.chapByKey(s.k):null, sub=subjOf(s), st=TU.step, body='';
  body+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:16px">🎓 Smart Tutor</b><button class="btn btn-ghost btn-sm" onclick="tutorClose()">✕</button></div>'+
    '<div style="font-size:14.5px;line-height:1.55;margin-bottom:10px">'+esc(s.q)+'</div>'+(window.mcqImg?mcqImg(s):'')+
    s.o.map(function(o,i){ return '<div style="font-size:13px;padding:2px 0">'+L(i)+'. '+esc(o)+'</div>'; }).join('');
  /* step 1 */
  body+='<div class="explain-box" style="margin-top:14px"><b>💡 Hint 1 — What is this about?</b><div style="margin-top:6px;font-size:13.5px;line-height:1.6">'+
    (ch?'Chapter: <b>'+esc(ch.c)+'</b> ('+esc(ch.s)+')':(s.topic?'Question type: <b>'+esc(s.topic)+'</b>':'Think about which chapter and formula this question belongs to.'))+'. Before looking at the options, write down the concept or formula you need.'+
    (ch&&window.lecForChapter?'<div style="margin-top:8px"><button class="btn btn-outline btn-sm" onclick="tutorClose();lecForChapter(\''+esc(ch.s)+'\',\''+encodeURIComponent(ch.c)+'\')">🎬 Watch the lecture on this chapter</button></div>':'')+'</div></div>';
  /* step 2 */
  if(st>=2){
    var os=window.LRN&&LRN.optStats?LRN.optStats(s.k,s.i):null, bars='';
    if(os){ var tot=os.p.reduce(function(a,b){ return a+b; },0)||1; bars='<div style="margin:8px 0 4px;font-size:12.5px;color:var(--muted)">What '+os.a+' students chose:</div>'+os.p.map(function(n,i){ var p=Math.round(n*100/tot); return '<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;margin-bottom:3px"><span style="width:16px">'+L(i)+'</span><div style="flex:1;height:8px;background:var(--paper-2);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:'+p+'%;background:var(--navy-600)"></i></div><b style="width:36px;text-align:right">'+p+'%</b></div>'; }).join('')+'<div style="font-size:12px;color:var(--muted)">If one option is very popular, ask yourself why it is tempting — it may be a trap.</div>'; }
    body+='<div class="explain-box" style="margin-top:10px"><b>💡 Hint 2 — Narrow it down</b><div style="margin-top:6px;font-size:13.5px;line-height:1.6">'+esc(s.k==='gen'?'Write the formula, substitute with units, then compare. Wrong options here are common slips: a forgotten square, a missed unit conversion, or the wrong formula.':(TIPS[sub]||'Eliminate the options you are sure are wrong, then compare the rest.'))+'</div>'+bars+'</div>';
  }
  /* step 3 */
  if(st>=3){
    body+='<div class="explain-box" style="margin-top:10px;border-left-color:var(--green-500)"><b>✅ Answer & explanation</b><div style="margin-top:6px;font-size:13.5px;line-height:1.6">Correct option: <b>'+L(s.a)+'. '+esc(s.o[s.a])+'</b>'+(s.w!==undefined&&s.w!==null&&s.w!==s.a?' · you chose '+L(s.w):'')+'<div style="margin-top:6px">'+(s.e?esc(s.e):'No written explanation is saved for this question yet.')+'</div>'+
      '<div style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="tutorClose();go(\'doubts\')">💬 Still confused? Ask a teacher</button></div></div></div>';
  }
  /* step 4 */
  var id=s.k+'~'+s.i, ai=TU.ai[id];
  if(st>=4){ body+='<div class="explain-box" style="margin-top:10px"><b>🤖 Explained simply</b><div style="margin-top:6px;font-size:13.5px;line-height:1.7">'+(TU.busy?'Thinking…':(ai?ai:'Press the button below.'))+'</div></div>'; }
  body+='<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">'+
    (st<3?'<button class="btn btn-primary btn-sm" onclick="tutorNext()">'+(st===1?'Give me hint 2':'Show answer & explanation')+' →</button>':'')+
    (st>=3&&!ai&&!TU.busy?'<button class="btn btn-gold btn-sm" onclick="tutorAI()">🤖 Explain it simply (AI)</button>':'')+
    '<button class="btn btn-outline btn-sm" onclick="tutorClose()">Close</button></div>';
  el.innerHTML='<div class="card" style="max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:20px 22px">'+body+'</div>';
}
function aiQuota(){ var k='dsa_ai_'+new Date().toISOString().slice(0,10), n=+(localStorage.getItem(k)||0); return {k:k,n:n}; }
window.tutorAI=function(){
  var s=TU.src, id=s.k+'~'+s.i, q=aiQuota();
  if(q.n>=DAILY_AI){ TU.ai[id]='You have used today\'s '+DAILY_AI+' free AI explanations. The hints and written explanation above are always available.'; TU.step=4; draw(); return; }
  TU.step=4; TU.busy=true; draw(); localStorage.setItem(q.k,q.n+1);
  var lang=(window.I18N&&I18N.lang)||'en', langTxt=lang==='hi'?'Reply in simple Hindi (Devanagari) with English technical terms.':(lang==='gu'?'Reply in simple Gujarati with English technical terms.':'Reply in simple English.');
  var prompt='You are a friendly NEET/JEE tutor. Explain step by step why option '+L(s.a)+' is correct for this question, and mention the common trap. '+langTxt+' Maximum 130 words, no markdown.\nQuestion: '+s.q+'\nOptions: '+s.o.map(function(o,i){ return L(i)+') '+o; }).join('  ')+'\nCorrect option: '+L(s.a)+') '+s.o[s.a]+(s.e?'\nGiven explanation: '+s.e:'');
  var done=function(t){ TU.busy=false; TU.ai[id]=t; if(TU.src===s) draw(); };
  var ctl=new AbortController(), to=setTimeout(function(){ ctl.abort(); },20000);
  fetch('https://ks-api-proxy.kspiderai.workers.dev/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:350,messages:[{role:'user',content:prompt}]})})
    .then(function(r){ return r.json(); }).then(function(d){ clearTimeout(to); var t=((d&&d.content)||[]).map(function(b){ return b.text; }).filter(Boolean).join('\n').trim();
      done(t?esc(t).replace(/\n/g,'<br>')+'<div style="font-size:11.5px;color:var(--muted);margin-top:8px">AI can make mistakes — check with your teacher if unsure.</div>':'The AI helper could not answer right now. Your hints and the written explanation above still work.'); })
    .catch(function(){ clearTimeout(to); done('The AI helper is busy or offline right now. Your hints and the written explanation above still work.'); });
};
})();
