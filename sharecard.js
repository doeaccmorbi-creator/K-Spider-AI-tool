/* =========================================================================
   Dr. Shreyansh Academy — Share Card (sharecard.js)
   Result ka PNG card banata hai (canvas, 100% device par, koi server/cost nahi)
   aur WhatsApp / Instagram / kisi bhi app me share karne deta hai.
   Naam sirf pehla naam + initial. Email/phone kabhi nahi.
   ========================================================================= */
(function(){
'use strict';
var SC=window.SHARECARD={};
function nm(){ try{ var n=(DB.currentUser&&DB.currentUser.name)||'Student'; var p=n.trim().split(/\s+/); return p[0]+(p[1]?' '+p[1][0]+'.':''); }catch(e){ return 'Student'; } }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function fit(c,t,max){ while(c.measureText(t).width>max && t.length>4) t=t.slice(0,-2); return t; }
SC.draw=function(r){
  var cv=document.createElement('canvas'); cv.width=1080; cv.height=1080; var c=cv.getContext('2d');
  var g=c.createLinearGradient(0,0,1080,1080); g.addColorStop(0,'#0b1f3a'); g.addColorStop(1,'#14532d'); c.fillStyle=g; c.fillRect(0,0,1080,1080);
  c.fillStyle='rgba(255,255,255,.06)'; c.beginPath(); c.arc(920,160,260,0,7); c.fill(); c.beginPath(); c.arc(120,980,200,0,7); c.fill();
  c.textAlign='left'; c.fillStyle='#f5c542'; c.font='700 40px sans-serif'; c.fillText('Dr. Shreyansh Academy',70,110);
  c.fillStyle='rgba(255,255,255,.7)'; c.font='500 28px sans-serif'; c.fillText('NEET / JEE Practice',70,155);
  var ans=r.c+r.w, acc=ans?Math.round(r.c*100/ans):0;
  c.fillStyle='#fff'; c.font='600 38px sans-serif'; c.fillText(nm()+' ne practice complete kiya 🎯',70,280);
  c.font='500 30px sans-serif'; c.fillStyle='rgba(255,255,255,.8)'; c.fillText(fit(c,r.label||'MCQ Practice',940),70,330);
  rr(c,70,380,940,330,36); c.fillStyle='rgba(255,255,255,.1)'; c.fill();
  c.textAlign='center'; c.fillStyle='#f5c542'; c.font='800 190px sans-serif'; c.fillText(acc+'%',540,570);
  c.fillStyle='#fff'; c.font='600 36px sans-serif'; c.fillText('Accuracy',540,625);
  c.font='500 32px sans-serif'; c.fillStyle='rgba(255,255,255,.85)'; c.fillText('✔ '+r.c+' sahi   ✘ '+r.w+' galat   ⏭ '+r.sk+' skip',540,680);
  var y=770, st=[['Score',r.score+'/'+r.max],['Time',Math.floor((r.secs||0)/60)+'m '+((r.secs||0)%60)+'s']];
  st.forEach(function(s,i){ var x=70+i*480; rr(c,x,y,460,130,28); c.fillStyle='rgba(255,255,255,.1)'; c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.font='500 28px sans-serif'; c.textAlign='left'; c.fillText(s[0],x+30,y+48); c.fillStyle='#fff'; c.font='700 50px sans-serif'; c.fillText(s[1],x+30,y+104); });
  c.textAlign='center'; c.fillStyle='#f5c542'; c.font='700 34px sans-serif'; c.fillText('Tum bhi try karo → www.kspiderai.in',540,1005);
  return cv;
};
SC.share=function(){
  var r=window.MCQ&&MCQ.res; if(!r){ toast('Pehle practice complete karo','ℹ️'); return; }
  var cv=SC.draw(r), ans=r.c+r.w, acc=ans?Math.round(r.c*100/ans):0;
  var text='Maine Dr. Shreyansh Academy pe '+acc+'% accuracy score ki! 🎯 Tum bhi try karo: https://www.kspiderai.in';
  cv.toBlob(function(b){
    if(!b){ toast('Card nahi ban paya','⚠️'); return; }
    var f; try{ f=new File([b],'my-result.png',{type:'image/png'}); }catch(e){}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){ navigator.share({files:[f],text:text}).catch(function(){}); return; }
    var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='my-result.png'; document.body.appendChild(a); a.click(); a.remove();
    toast('Card download ho gaya — ab WhatsApp me bhej do','📤');
    setTimeout(function(){ window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank'); },600);
  },'image/png');
};
window.shareCard=SC.share;
})();
