/* =========================================================================
   Dr. Shreyansh Academy — Infinite Numericals (gen.js)
   Formula-driven questions: every question, its four options and its worked
   solution are computed by code, so the answer key is always correct and the
   supply never runs out. Runs entirely in the browser — no server, no cost.
   A question is fully described by "<generator>.<seed>.<level>" so it can be
   rebuilt later (spaced revision) without storing anything.
   ========================================================================= */
(function(){
'use strict';
var G=window.GEN={}, LV=['Easy','Medium','Hard'];

/* ---------- tiny helpers ---------- */
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function ri(r,a,b){ return a+Math.floor(r()*(b-a+1)); }
function pick(r,a){ return a[Math.floor(r()*a.length)]; }
function shuf(r,a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t; } return a; }
function fn(x,d){
  if(!isFinite(x)) return 'NaN';
  var ax=Math.abs(x);
  if(ax!==0&&(ax>=1e5||ax<1e-3)){ var e=x.toExponential(2).split('e'), m=String(+e[0]), p=+e[1]; return m+' × 10'+sup(p); }
  var s=d!==undefined?x.toFixed(d):String(+x.toPrecision(3)); if(s.indexOf('.')>=0) s=s.replace(/0+$/,'').replace(/\.$/,''); return s==='-0'?'0':s;
}
function sup(n){ var m={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}; return String(n).split('').map(function(c){ return m[c]; }).join(''); }
/* spec: {q, a, w:[wrong values], u:unit, d:decimals, e:explanation} -> question or null */
function build(r,s){
  var f=function(x){ return typeof x==='number'?fn(x,s.d)+(s.u?' '+s.u:''):String(x); };
  var correct=f(s.a), seen={}, wr=[]; seen[correct]=1;
  (s.w||[]).forEach(function(x){ if(typeof x==='number'&&!isFinite(x)) return; var t=f(x); if(!seen[t]){ seen[t]=1; wr.push(t); } });
  var k=0, fs=[2,0.5,1.5,0.75,3,0.25,1.25,0.8,4,0.6];
  while(wr.length<3&&typeof s.a==='number'&&k<fs.length){ var t2=f(s.a*fs[k++]); if(!seen[t2]){ seen[t2]=1; wr.push(t2); } }
  if(wr.length<3||!isFinite(typeof s.a==='number'?s.a:1)) return null;
  var o=shuf(r,[correct].concat(wr.slice(0,3)));
  return {q:s.q,o:o,a:o.indexOf(correct),e:s.e};
}
var GR=10; // g in m/s²
var MM={H:1,C:12,N:14,O:16,Na:23,Mg:24,S:32,Cl:35.5,K:39,Ca:40};

/* ---------- generators: (r, level 0..2) -> spec ---------- */
var GENS=[
/* ================= PHYSICS ================= */
{id:'kin1',s:'Physics',t:'Kinematics – v = u + at',m:function(r,l){ var u=ri(r,0,10*(l+1)),a=ri(r,2,4+3*l),t=ri(r,3,6+2*l),v=u+a*t;
 return {q:'A car starts with a velocity of '+u+' m/s and accelerates uniformly at '+a+' m/s². Its velocity after '+t+' s is:',a:v,u:'m/s',w:[u+a*t/2,a*t,u-a*t,u+a*t*t],e:'v = u + at = '+u+' + ('+a+')('+t+') = '+v+' m/s.'}; }},
{id:'kin2',s:'Physics',t:'Kinematics – s = ut + ½at²',m:function(r,l){ var u=ri(r,0,8*(l+1)),a=ri(r,2,6),t=ri(r,2,5+l),s=u*t+a*t*t/2;
 return {q:'A body moving with an initial speed of '+u+' m/s has a uniform acceleration of '+a+' m/s². The distance covered in '+t+' s is:',a:s,u:'m',w:[u*t+a*t*t,a*t*t/2,u*t+a*t/2,(u+a*t)*t],e:'s = ut + ½at² = ('+u+')('+t+') + ½('+a+')('+t+')² = '+s+' m.'}; }},
{id:'free',s:'Physics',t:'Free fall',m:function(r,l){ var t=ri(r,2,4+l*2),h=GR*t*t/2;
 return {q:'A stone is dropped from the top of a tower '+h+' m high (take g = 10 m/s²). The time taken to reach the ground is:',a:t,u:'s',w:[h/GR,Math.sqrt(h/GR),2*t,h/(2*GR)],e:'h = ½gt² ⇒ t = √(2h/g) = √(2×'+h+'/10) = '+t+' s.'}; }},
{id:'proj',s:'Physics',t:'Projectile – horizontal range',m:function(r,l){ var th=pick(r,[30,45,60]),u=pick(r,[10,20,30,40,50].slice(0,3+l*2)),sn={30:Math.sin(Math.PI/3),45:1,60:Math.sin(2*Math.PI/3)}[th],R=u*u*sn/GR,sn1={30:0.5,45:Math.SQRT1_2,60:Math.sqrt(3)/2}[th];
 return {q:'A projectile is fired at '+u+' m/s at an angle of '+th+'° with the horizontal (g = 10 m/s²). Its horizontal range is:',a:R,u:'m',d:1,w:[u*u*sn1/GR,u*u*sn/(2*GR),u*u*sn*2/GR,u*u/GR*(th===45?0.5:1)],e:'R = u² sin2θ / g = ('+u+')² × sin'+(2*th)+'° / 10 = '+fn(R,1)+' m.'}; }},
{id:'nl2',s:'Physics',t:"Newton's 2nd law",m:function(r,l){ var m=ri(r,2,8),F1=ri(r,20,40+10*l),F2=ri(r,5,18),a=(F1-F2)/m;
 return {q:'A '+m+' kg block on a smooth surface is pulled by a force of '+F1+' N to the right and a force of '+F2+' N to the left. Its acceleration is:',a:a,u:'m/s²',d:2,w:[(F1+F2)/m,F1/m,(F1-F2)*m,F2/m],e:'Net force = '+F1+' − '+F2+' = '+(F1-F2)+' N, so a = F/m = '+(F1-F2)+'/'+m+' = '+fn(a,2)+' m/s².'}; }},
{id:'fric',s:'Physics',t:'Friction',m:function(r,l){ var mu=pick(r,[0.2,0.25,0.3,0.4,0.5]),m=ri(r,2,10+5*l),f=mu*m*GR;
 return {q:'A block of mass '+m+' kg rests on a horizontal surface with coefficient of static friction '+mu+' (g = 10 m/s²). The maximum static friction force is:',a:f,u:'N',d:1,w:[mu*m,m*GR,mu*GR,f*2],e:'f_max = μN = μmg = '+mu+' × '+m+' × 10 = '+fn(f,1)+' N.'}; }},
{id:'work',s:'Physics',t:'Work done by a force',m:function(r,l){ var F=ri(r,10,50),d=ri(r,2,10),th=pick(r,[30,60]),c=th===60?0.5:Math.sqrt(3)/2,W=F*d*c;
 return {q:'A force of '+F+' N acts at '+th+'° to the displacement and moves a body through '+d+' m. The work done is:',a:W,u:'J',d:1,w:[F*d,F*d*(th===60?Math.sqrt(3)/2:0.5),F*d/2*0+F*d*2*c,F*d*c*c],e:'W = Fd cosθ = '+F+' × '+d+' × cos'+th+'° = '+fn(W,1)+' J.'}; }},
{id:'power',s:'Physics',t:'Power',m:function(r,l){ var F=ri(r,100,500),v=ri(r,2,20),P=F*v;
 return {q:'An engine exerts a constant force of '+F+' N on a vehicle moving at a steady speed of '+v+' m/s. The power delivered is:',a:P,u:'W',w:[F/v,F*v*v,F+v,F*v/2],e:'P = Fv = '+F+' × '+v+' = '+P+' W.'}; }},
{id:'shm',s:'Physics',t:'SHM – spring period',m:function(r,l){ var m=pick(r,[0.5,1,2,4,8]),k=pick(r,[50,100,200,400]),T=2*Math.PI*Math.sqrt(m/k);
 return {q:'A mass of '+m+' kg attached to a spring of force constant '+k+' N/m oscillates horizontally. Its time period is (take π = 3.14):',a:2*3.14*Math.sqrt(m/k),u:'s',d:2,w:[2*3.14*Math.sqrt(k/m),3.14*Math.sqrt(m/k),Math.sqrt(m/k),2*3.14*(m/k)],e:'T = 2π√(m/k) = 2 × 3.14 × √('+m+'/'+k+') = '+fn(2*3.14*Math.sqrt(m/k),2)+' s.'}; }},
{id:'par',s:'Physics',t:'Resistors – parallel combination',m:function(r,l){ var a=pick(r,[3,4,6,12,20,30]),b=pick(r,[6,12,15,20,60]); if(a===b) b=a*2; var R=a*b/(a+b);
 return {q:'Two resistors of '+a+' Ω and '+b+' Ω are connected in parallel. The equivalent resistance is:',a:R,u:'Ω',d:2,w:[a+b,(a+b)/(a*b),Math.abs(a-b),(a+b)/2],e:'1/R = 1/'+a+' + 1/'+b+' ⇒ R = ab/(a+b) = '+a+'×'+b+'/'+(a+b)+' = '+fn(R,2)+' Ω.'}; }},
{id:'coul',s:'Physics',t:"Coulomb's law",m:function(r,l){ var q1=ri(r,1,9),q2=ri(r,1,9),d=pick(r,[10,20,30,50]),F=9e9*q1*1e-6*q2*1e-6/Math.pow(d/100,2);
 return {q:'Two point charges of '+q1+' μC and '+q2+' μC are placed '+d+' cm apart in air (k = 9×10⁹ N·m²/C²). The force between them is:',a:F,u:'N',w:[9e9*q1*1e-6*q2*1e-6/(d/100),9e9*q1*1e-6*q2*1e-6/Math.pow(d,2),F*100,F/100],e:'F = kq₁q₂/r² = 9×10⁹ × '+q1+'×10⁻⁶ × '+q2+'×10⁻⁶ / ('+(d/100)+')² = '+fn(F)+' N.'}; }},
{id:'lens',s:'Physics',t:'Lens formula',m:function(r,l){ var f=pick(r,[10,15,20,12,30]),d=f+pick(r,[10,15,20,30]),v=f*d/(d-f);
 return {q:'An object is placed '+d+' cm in front of a convex lens of focal length '+f+' cm. The image distance from the lens is:',a:v,u:'cm',d:1,w:[f*d/(d+f),d-f,f*d/(f+0.0001)*0+d+f,v/2],e:'1/v − 1/u = 1/f with u = −'+d+' ⇒ 1/v = 1/'+f+' − 1/'+d+' ⇒ v = '+fn(v,1)+' cm (real image, other side).'}; }},
{id:'heat',s:'Physics',t:'Calorimetry – Q = mcΔT',m:function(r,l){ var m=ri(r,2,10)*100,T=ri(r,10,60),c=pick(r,[0.4,0.5,0.9,1]),Q=m*c*T;
 return {q:'How much heat is needed to raise the temperature of '+m+' g of a metal (specific heat '+c+' cal/g°C) by '+T+' °C?',a:Q,u:'cal',w:[m*c,m*T,m*T/c,c*T],e:'Q = mcΔT = '+m+' × '+c+' × '+T+' = '+fn(Q)+' cal.'}; }},
{id:'pe',s:'Physics',t:'Photoelectric effect',m:function(r,l){ var lam=pick(r,[200,250,310,400]),phi=pick(r,[2,2.5,3,4.1]),E=1240/lam,K=E-phi; if(K<=0.05) return null;
 return {q:'Light of wavelength '+lam+' nm falls on a metal of work function '+phi+' eV (hc = 1240 eV·nm). The maximum kinetic energy of the emitted electrons is:',a:K,u:'eV',d:2,w:[E+phi,phi-E,E,K*2],e:'E = 1240/λ = 1240/'+lam+' = '+fn(E,2)+' eV; K_max = E − φ = '+fn(E,2)+' − '+phi+' = '+fn(K,2)+' eV.'}; }},
{id:'debro',s:'Physics',t:'de Broglie wavelength',m:function(r,l){ var V=pick(r,[25,100,150,400,900]),lam=12.27/Math.sqrt(V);
 return {q:'An electron is accelerated from rest through a potential difference of '+V+' V. Its de Broglie wavelength is (use λ = 12.27/√V Å):',a:lam,u:'Å',d:2,w:[12.27/V,12.27*Math.sqrt(V),12.27/(2*Math.sqrt(V)),lam*2],e:'λ = 12.27/√V = 12.27/√'+V+' = '+fn(lam,2)+' Å.'}; }},
{id:'halfl',s:'Physics',t:'Radioactive decay',m:function(r,l){ var n=ri(r,2,5),N0=pick(r,[320,640,800,1600,3200]),T=ri(r,2,20),N=N0/Math.pow(2,n);
 return {q:'A radioactive sample has half-life '+T+' days and initially contains '+N0+' atoms. How many atoms remain after '+(n*T)+' days?',a:N,w:[N0/n,N0-N0/n/2,N0/(2*n),N0/Math.pow(2,n+1)],e:(n*T)+' days = '+n+' half-lives ⇒ N = N₀/2ⁿ = '+N0+'/'+Math.pow(2,n)+' = '+fn(N)+'.'}; }},
{id:'grav',s:'Physics',t:'Gravitation – g at height',m:function(r,l){ var k=pick(r,[1,2,0.5]),g=10/Math.pow(1+k,2);
 return {q:'The acceleration due to gravity on Earth\'s surface is 10 m/s². At a height equal to '+(k===1?'the radius':k+' times the radius')+' of the Earth above the surface, it is:',a:g,u:'m/s²',d:2,w:[10/(1+k),10/Math.pow(k,2),10*k,10/(2*(1+k))],e:'g′ = g[R/(R+h)]² = 10/(1+'+k+')² = '+fn(g,2)+' m/s².'}; }},
/* ================= CHEMISTRY ================= */
{id:'mole',s:'Chemistry',t:'Mole concept',m:function(r,l){ var c=pick(r,[['NaCl',58.5],['H₂O',18],['CO₂',44],['CaCO₃',100],['H₂SO₄',98],['NaOH',40],['NH₃',17]]),n=pick(r,[0.5,1,2,3,0.25]),mass=c[1]*n;
 return {q:'The number of moles in '+fn(mass)+' g of '+c[0]+' (molar mass = '+c[1]+' g/mol) is:',a:n,u:'mol',w:[c[1]/mass,mass*c[1],mass/c[1]*2,mass/(c[1]*2)],e:'n = mass / molar mass = '+fn(mass)+' / '+c[1]+' = '+n+' mol.'}; }},
{id:'molar',s:'Chemistry',t:'Molarity',m:function(r,l){ var c=pick(r,[['NaOH',40],['KOH',56],['HCl',36.5],['NaCl',58.5]]),n=pick(r,[0.1,0.2,0.5,1]),V=pick(r,[250,500,200,100]),mass=c[1]*n,M=n/(V/1000);
 return {q:fn(mass)+' g of '+c[0]+' (M = '+c[1]+' g/mol) is dissolved in water to make '+V+' mL of solution. The molarity is:',a:M,u:'M',d:2,w:[n/V,n*V/1000,M/10,M*10],e:'n = '+fn(mass)+'/'+c[1]+' = '+n+' mol; M = n/V(L) = '+n+'/'+(V/1000)+' = '+fn(M,2)+' M.'}; }},
{id:'dil',s:'Chemistry',t:'Dilution',m:function(r,l){ var M1=pick(r,[2,4,6,10]),V1=pick(r,[50,100,200]),V2=V1*pick(r,[2,4,5]),M2=M1*V1/V2;
 return {q:V1+' mL of a '+M1+' M solution is diluted with water to '+V2+' mL. The new molarity is:',a:M2,u:'M',d:2,w:[M1*V2/V1,M1/V1*V2/V1,M1+V2/V1,M1*V1],e:'M₁V₁ = M₂V₂ ⇒ M₂ = '+M1+'×'+V1+'/'+V2+' = '+fn(M2,2)+' M.'}; }},
{id:'ph',s:'Chemistry',t:'pH of strong acid / base',m:function(r,l){ var a=pick(r,[1,2,5]),b=pick(r,[2,3,4,5]),acid=r()<0.5,c=a*Math.pow(10,-b),lg={1:0,2:0.3,5:0.7}[a],ph=b-lg,ans=acid?ph:14-ph;
 return {q:'What is the '+(acid?'pH':'pH')+' of a '+fn(c)+' M solution of a strong '+(acid?'monobasic acid':'monobasic base (e.g. NaOH)')+' at 25 °C? (log 2 = 0.3, log 5 = 0.7)',a:ans,d:1,w:[acid?14-ph:ph,b+lg,b,ph/2],e:(acid?'[H⁺] = '+fn(c)+' ⇒ pH = −log('+a+'×10⁻'+b+') = '+b+' − '+lg+' = '+fn(ph,1)+'.':'[OH⁻] = '+fn(c)+' ⇒ pOH = '+b+' − '+lg+' = '+fn(ph,1)+' ⇒ pH = 14 − '+fn(ph,1)+' = '+fn(14-ph,1)+'.')}; }},
{id:'gas',s:'Chemistry',t:'Ideal gas equation',m:function(r,l){ var n=pick(r,[0.5,1,2,3]),T=pick(r,[273,300,350,400]),P=pick(r,[1,2,0.5,4]),V=n*0.0821*T/P;
 return {q:'The volume occupied by '+n+' mol of an ideal gas at '+T+' K and '+P+' atm is (R = 0.0821 L·atm/mol·K):',a:V,u:'L',d:1,w:[n*0.0821*(T-273)/P,n*0.0821*T*P,n*T/(0.0821*P),V/2],e:'PV = nRT ⇒ V = nRT/P = '+n+'×0.0821×'+T+'/'+P+' = '+fn(V,1)+' L.'}; }},
{id:'pc',s:'Chemistry',t:'Percentage composition',m:function(r,l){ var f=pick(r,[{n:'H₂O',a:{H:2,O:1},el:'O'},{n:'CO₂',a:{C:1,O:2},el:'C'},{n:'NaOH',a:{Na:1,O:1,H:1},el:'Na'},{n:'CaCO₃',a:{Ca:1,C:1,O:3},el:'Ca'},{n:'H₂SO₄',a:{H:2,S:1,O:4},el:'S'},{n:'NH₃',a:{N:1,H:3},el:'N'}]),M=0,k;
 for(k in f.a) M+=MM[k]*f.a[k]; var p=MM[f.el]*f.a[f.el]/M*100, atoms=0,tot=0; for(k in f.a){ tot+=f.a[k]; } 
 return {q:'The percentage by mass of '+f.el+' in '+f.n+' is: (H = 1, C = 12, N = 14, O = 16, Na = 23, S = 32, Ca = 40)',a:p,u:'%',d:1,w:[f.a[f.el]/tot*100,100-p,MM[f.el]/M*100,p/2],e:'Molar mass of '+f.n+' = '+fn(M,1)+'; mass of '+f.el+' = '+(MM[f.el]*f.a[f.el])+' ⇒ % = '+fn(p,1)+'.'}; }},
{id:'stoi',s:'Chemistry',t:'Stoichiometry – limiting reagent',m:function(r,l){ var nN=ri(r,1,4),nH=ri(r,2,9),prod=Math.min(2*nN,2*nH/3);
 return {q:'In N₂ + 3H₂ → 2NH₃, '+nN+' mol of N₂ reacts with '+nH+' mol of H₂. The maximum moles of NH₃ formed is:',a:prod,u:'mol',d:2,w:[2*nN,2*nH/3===prod?2*nN:2*nH/3+0.01,nN+nH,nH/3],e:'N₂ would give '+(2*nN)+' mol NH₃; H₂ would give '+fn(2*nH/3,2)+' mol. The smaller (limiting) is '+fn(prod,2)+' mol.'}; }},
{id:'atom',s:'Chemistry',t:'Atomic structure',m:function(r,l){ var e=pick(r,[['Na',11,23,1],['Mg',12,24,2],['Al',13,27,3],['Cl',17,35,-1],['O',8,16,-2],['Ca',20,40,2],['Fe',26,56,3]]),Z=e[1],A=e[2],q=e[3],ne=Z-q;
 return {q:'How many electrons are present in the ion '+e[0]+(q>0?(q>1?q:'')+'⁺':(q<-1?-q:'')+'⁻')+' (atomic number '+Z+', mass number '+A+')?',a:ne,w:[Z+q,A-Z,A-ne,Z],e:'Neutral atom has '+Z+' electrons; the ion has charge '+(q>0?'+':'')+q+', so electrons = '+Z+' − ('+q+') = '+ne+'.'}; }},
{id:'gibbs',s:'Chemistry',t:'Thermodynamics – ΔG',m:function(r,l){ var H=ri(r,-100,-20),S=ri(r,-150,200),T=pick(r,[300,400,500]),G=H-T*S/1000;
 return {q:'For a reaction ΔH = '+H+' kJ/mol and ΔS = '+S+' J/mol·K. The value of ΔG at '+T+' K is:',a:G,u:'kJ/mol',d:1,w:[H-T*S,H+T*S/1000,H*T/1000-S,-G],e:'ΔG = ΔH − TΔS = '+H+' − '+T+'×('+S+'/1000) = '+fn(G,1)+' kJ/mol.'}; }},
{id:'kin',s:'Chemistry',t:'First-order kinetics',m:function(r,l){ var th=ri(r,5,30),n=ri(r,2,4),f=Math.pow(0.5,n);
 return {q:'A first-order reaction has a half-life of '+th+' minutes. The fraction of the reactant remaining after '+(n*th)+' minutes is:',a:f,d:4,w:[1/n,0.5/n,1-f,Math.pow(0.5,n+1)],e:(n*th)+' min = '+n+' half-lives ⇒ fraction = (½)^'+n+' = '+fn(f,4)+'.'}; }},
{id:'farad',s:'Chemistry',t:"Electrolysis – Faraday's law",m:function(r,l){ var c=pick(r,[['Cu²⁺',63.5,2],['Ag⁺',108,1],['Zn²⁺',65,2],['Al³⁺',27,3]]),I=pick(r,[2,5,10]),t=pick(r,[10,20,30,60]),m=c[1]*I*t*60/(c[2]*96500);
 return {q:'A current of '+I+' A is passed for '+t+' minutes through a solution of '+c[0]+' (molar mass '+c[1]+' g/mol). The mass deposited is (F = 96500 C):',a:m,u:'g',d:2,w:[c[1]*I*t/(c[2]*96500),m*c[2],m/60,c[1]*I*t*60/96500],e:'Q = It = '+I+' × '+(t*60)+' = '+(I*t*60)+' C; m = (M/nF)Q = ('+c[1]+'/('+c[2]+'×96500)) × '+(I*t*60)+' = '+fn(m,2)+' g.'}; }},
{id:'boyle',s:'Chemistry',t:"Boyle's law",m:function(r,l){ var P1=pick(r,[1,2,4]),V1=pick(r,[10,20,5,8]),P2=P1*pick(r,[2,4,5]),V2=P1*V1/P2;
 return {q:'A gas occupies '+V1+' L at '+P1+' atm. At constant temperature, its volume at '+P2+' atm is:',a:V2,u:'L',d:2,w:[V1*P2/P1,V1+P2-P1,V1*P1*P2,V1-P2],e:'P₁V₁ = P₂V₂ ⇒ V₂ = '+P1+'×'+V1+'/'+P2+' = '+fn(V2,2)+' L.'}; }},
/* ================= MATHS ================= */
{id:'ap',s:'Maths',t:'Arithmetic progression',m:function(r,l){ var a=ri(r,1,12),d=ri(r,2,7),n=ri(r,8,20+5*l),S=n*(2*a+(n-1)*d)/2,tn=a+(n-1)*d;
 if(r()<0.5) return {q:'In an A.P. the first term is '+a+' and the common difference is '+d+'. The '+n+'th term is:',a:tn,w:[a+n*d,a*n*d,a+(n-2)*d,tn+d],e:'Tₙ = a + (n−1)d = '+a+' + '+(n-1)+'×'+d+' = '+tn+'.'};
 return {q:'The sum of the first '+n+' terms of the A.P. '+a+', '+(a+d)+', '+(a+2*d)+', … is:',a:S,w:[n*(a+(n-1)*d),n*(2*a+n*d)/2,n/2*(a+n*d),S+n],e:'Sₙ = n/2 [2a + (n−1)d] = '+n+'/2 [2×'+a+' + '+(n-1)+'×'+d+'] = '+S+'.'}; }},
{id:'gp',s:'Maths',t:'Geometric progression',m:function(r,l){ var a=ri(r,1,5),q=ri(r,2,3),n=ri(r,4,6+l),S=a*(Math.pow(q,n)-1)/(q-1),tn=a*Math.pow(q,n-1);
 if(r()<0.5) return {q:'The '+n+'th term of the G.P. '+a+', '+(a*q)+', '+(a*q*q)+', … is:',a:tn,w:[a*Math.pow(q,n),a*q*(n-1),a+(n-1)*q,tn*q],e:'Tₙ = arⁿ⁻¹ = '+a+'×'+q+'^'+(n-1)+' = '+tn+'.'};
 return {q:'The sum of the first '+n+' terms of the G.P. '+a+', '+(a*q)+', '+(a*q*q)+', … is:',a:S,w:[a*(Math.pow(q,n)-1),S+a,a*Math.pow(q,n),(Math.pow(q,n)-1)/(q-1)],e:'Sₙ = a(rⁿ−1)/(r−1) = '+a+'('+Math.pow(q,n)+'−1)/'+(q-1)+' = '+S+'.'}; }},
{id:'quad',s:'Maths',t:'Quadratic – roots',m:function(r,l){ var p=ri(r,2,9),q=ri(r,1,12),s=p*p-2*q;
 return {q:'If α and β are the roots of x² − '+p+'x + '+q+' = 0, then α² + β² equals:',a:s,w:[p*p+2*q,p*p,p-2*q,q*q-2*p],e:'α+β = '+p+', αβ = '+q+' ⇒ α²+β² = (α+β)² − 2αβ = '+(p*p)+' − '+(2*q)+' = '+s+'.'}; }},
{id:'perm',s:'Maths',t:'Permutations – arrangements of letters',m:function(r,l){ var w=pick(r,['BANANA','LETTER','APPLE','LEVEL','MOTHER','DADDY','BOOKS','SUCCESS']),cnt={},i,n=w.length,res=1,den=1; for(i=0;i<n;i++){ cnt[w[i]]=(cnt[w[i]]||0)+1; res*=(i+1); } for(var k in cnt) { for(i=2;i<=cnt[k];i++) den*=i; } var a=res/den;
 return {q:'The number of distinct arrangements of the letters of the word "'+w+'" is:',a:a,w:[res,res/2,a*2,res-a],e:w+' has '+n+' letters'+(den>1?' with repeats, so arrangements = '+n+'!/('+Object.keys(cnt).filter(function(k){ return cnt[k]>1; }).map(function(k){ return cnt[k]+'!'; }).join('·')+') = '+a:' all different, so '+n+'! = '+a)+'.'}; }},
{id:'comb',s:'Maths',t:'Combinations',m:function(r,l){ var n=ri(r,6,12+l*2),k=ri(r,2,4),C=1,i; for(i=0;i<k;i++) C=C*(n-i)/(i+1); var P=1; for(i=0;i<k;i++) P*=(n-i);
 return {q:'In how many ways can a committee of '+k+' members be chosen from '+n+' people?',a:C,w:[P,C*k,Math.pow(n,k)/k,C+n],e:'ⁿCᵣ = '+n+'C'+k+' = '+C+'.'}; }},
{id:'prob',s:'Maths',t:'Probability – dice',m:function(r,l){ var s=ri(r,4,10),c=0,x,y; for(x=1;x<=6;x++) for(y=1;y<=6;y++) if(x+y===s) c++;
 return {q:'Two fair dice are thrown together. The probability that the sum of the numbers is '+s+' is:',a:c+'/36',w:[(c+1)+'/36',c+'/12',(c-1<1?c+2:c-1)+'/36',c+'/6'],e:'Favourable outcomes for sum '+s+' = '+c+' out of 36, so P = '+c+'/36.'}; }},
{id:'deriv',s:'Maths',t:'Differentiation',m:function(r,l){ var a=ri(r,1,5),b=ri(r,1,6),c=ri(r,1,9),x=ri(r,1,3),v=3*a*x*x+2*b*x+c;
 return {q:'If f(x) = '+a+'x³ + '+b+'x² + '+c+'x, then f′('+x+') equals:',a:v,w:[a*x*x*x+b*x*x+c*x,3*a*x+2*b+c,a*x*x+b*x+c,v+x],e:'f′(x) = '+(3*a)+'x² + '+(2*b)+'x + '+c+' ⇒ f′('+x+') = '+(3*a*x*x)+' + '+(2*b*x)+' + '+c+' = '+v+'.'}; }},
{id:'integ',s:'Maths',t:'Definite integration',m:function(r,l){ var a=ri(r,1,6)*3,b=ri(r,1,4)*2,k=ri(r,1,3)*2,v=a*k*k*k/3+b*k*k/2;
 return {q:'The value of ∫₀^'+k+' ('+a+'x² + '+b+'x) dx is:',a:v,w:[a*k*k*k+b*k*k,a*k*k+b*k,v+k,a*k*k*k/3],e:'∫('+a+'x² + '+b+'x)dx = '+(a/3)+'x³ + '+(b/2)+'x² ⇒ at '+k+': '+(a/3)+'×'+(k*k*k)+' + '+(b/2)+'×'+(k*k)+' = '+v+'.'}; }},
{id:'dist',s:'Maths',t:'Straight line – distance from a point',m:function(r,l){ var mlt=ri(r,1,3),a=3*mlt,b=4*mlt,x=ri(r,-5,8),y=ri(r,-5,8),c=ri(r,-20,20),d=Math.abs(a*x+b*y+c)/Math.sqrt(a*a+b*b);
 return {q:'The perpendicular distance of the point ('+x+', '+y+') from the line '+a+'x + '+b+'y '+(c<0?'− '+(-c):'+ '+c)+' = 0 is:',a:d,d:2,w:[Math.abs(a*x+b*y+c),Math.abs(a*x+b*y+c)/(a+b),(a*x+b*y+c)/Math.sqrt(a*a+b*b)+0.5,d*2],e:'d = |ax₁+by₁+c|/√(a²+b²) = |'+(a*x+b*y+c)+'|/'+(5*mlt)+' = '+fn(d,2)+'.'}; }},
{id:'binom',s:'Maths',t:'Binomial theorem – coefficient',m:function(r,l){ var n=ri(r,6,12),k=ri(r,2,4),C=1,i; for(i=0;i<k;i++) C=C*(n-i)/(i+1);
 return {q:'The coefficient of x'+(k===2?'²':(k===3?'³':'⁴'))+' in the expansion of (1 + x)^'+n+' is:',a:C,w:[n*k,C+n,Math.pow(n,k),C*2],e:'Coefficient of xʳ in (1+x)ⁿ is ⁿCᵣ = '+n+'C'+k+' = '+C+'.'}; }},
{id:'det',s:'Maths',t:'Determinants',m:function(r,l){ var a=ri(r,1,9),b=ri(r,1,9),c=ri(r,1,9),d=ri(r,1,9),D=a*d-b*c;
 return {q:'The value of the determinant |'+a+'  '+b+'; '+c+'  '+d+'| is:',a:D,w:[a*d+b*c,a*b-c*d,a+d-b-c,-D],e:'|a b; c d| = ad − bc = '+a+'×'+d+' − '+b+'×'+c+' = '+D+'.'}; }},
{id:'cplx',s:'Maths',t:'Complex numbers',m:function(r,l){ var t=pick(r,[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15]]),sg=r()<0.5?'+':'−';
 return {q:'The modulus of the complex number '+t[0]+' '+sg+' '+t[1]+'i is:',a:t[2],w:[t[0]+t[1],t[0]*t[0]+t[1]*t[1],Math.abs(t[1]-t[0]),(t[0]+t[1])/2],e:'|a+bi| = √(a²+b²) = √('+(t[0]*t[0])+'+'+(t[1]*t[1])+') = '+t[2]+'.'}; }}
];
var BY={}; GENS.forEach(function(g){ BY[g.id]=g; });

/* ---------- public API ---------- */
G.levels=LV;
G.subjects=function(){ return ['Physics','Chemistry','Maths']; };
G.topics=function(subj){ return GENS.filter(function(g){ return g.s===subj; }).map(function(g){ return {id:g.id,t:g.t}; }); };
G.make=function(id,seed,lv){
  var g=BY[id]; if(!g) return null;
  for(var tries=0;tries<8;tries++){
    var r=rng(seed+tries*7919), spec=null; try{ spec=g.m(r,lv); }catch(e){ spec=null; }
    if(!spec) continue; var q=build(r,spec); if(q){ q.i=id+'.'+(seed+tries*7919)+'.'+lv; q.k='gen'; q.t='Numerical · '+LV[lv]; q.sub=g.s; q.topic=g.t; return q; }
  }
  return null;
};
G.rebuild=function(qid){ var p=String(qid).split('.'); return p.length===3?G.make(p[0],+p[1],+p[2]):null; };
G.session=function(subj,topicIds,n,lv){
  var ids=(topicIds&&topicIds.length)?topicIds:G.topics(subj).map(function(t){ return t.id; }), out=[], seen={}, base=Math.floor(Math.random()*1e9), i=0;
  while(out.length<n&&i<n*6){ var id=ids[i%ids.length], q=G.make(id,base+i*104729,lv); i++; if(q&&!seen[q.q]){ seen[q.q]=1; out.push(q); } }
  return out.sort(function(){ return Math.random()-0.5; });
};
G.count=GENS.length;
})();
