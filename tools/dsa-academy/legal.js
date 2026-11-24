/* =========================================================================
   Dr. Shreyansh Academy — Legal pages, consent and data-deletion (legal.js)
   -------------------------------------------------------------------------
   * Privacy Policy, Terms of Use, Refund & Cancellation, Disclaimer/Copyright,
     Contact + Grievance Officer — English and Hindi, readable WITHOUT login.
   * Consent: checkbox at sign-up (+ "under 18, parent agrees"), and a one-time
     "Accept" pop-up for every existing / Google / K Spider user.
   * "My data": student can delete his own progress and send an erasure request;
     admin processes requests (Admin -> Data Requests).
   >>> EDIT ONLY THE BLOCK "LEGAL_CFG" BELOW to change names / e-mail / refund days.
   ========================================================================= */
(function(){
'use strict';
var LEGAL_CFG={
  site:'www.kspiderai.in', app:'Dr. Shreyansh Academy (DSA)', org:'KSpiderAI (K Spider AI)',
  owner:'Gaurang M Raval', place:'Gujarat, India',
  email:'kspider221206@gmail.com',      // <-- apni SUPPORT e-mail yahan likho
  whatsapp:'',                          // <-- optional: '91XXXXXXXXXX'
  refundDays:7, refundUsedMaxPct:20, deleteDays:30, ackHours:48, resolveDays:15,
  version:'2026-11', updated:'23 November 2026'
};
var L=window.LEGAL={cfg:LEGAL_CFG};
var C=LEGAL_CFG, VER=C.version;
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){} return null; }
var S={tab:'privacy',lang:(window.I18N&&I18N.lang==='hi')?'hi':'en'};

/* ------------------------------ TEXTS ------------------------------ */
function contactLine(hi){
  return (hi?'संपर्क: ':'Contact: ')+esc(C.email)+(C.whatsapp?' · WhatsApp +'+esc(C.whatsapp):'');
}
var T={
 privacy:{
  en:{h:'Privacy Policy',b:[
   ['Who we are','"'+C.app+'" is an online NEET/JEE practice platform run by '+C.org+', '+C.place+' ("we"). This policy explains what personal data we handle and why. Last updated: '+C.updated+'.'],
   ['Data we collect','• Account: name, e-mail, role (student / parent / faculty), class.<br>• Learning: test and practice results, progress, mistakes, attendance, homework, doubts you post, bookmarks.<br>• Parent link: the child e-mail a parent enters and the child\'s approval.<br>• Payments: plan, amount and UPI transaction ID you submit (we never see your UPI PIN or bank login).<br>• Technical: anonymous error reports (message, screen name, browser type — no e-mail or password) to fix bugs.<br>• On your device: settings, offline question packs and drafts are stored in your browser (localStorage / IndexedDB).'],
   ['Why we use it','To run your account, show results and reports, let parents/teachers see the progress you approved, verify Premium payments, answer doubts, send in-app notifications, keep the service secure, and improve it. We do <b>not</b> sell your data and we do <b>not</b> show advertisements or do behavioural tracking of students.'],
   ['Who can see it','You; your parent <i>only after you approve the link</i>; your teachers/office staff of the academy; the admin. The public leaderboard shows only your first name and best score/XP.'],
   ['Service providers','Google Firebase (login, database), Cloudflare (hosting/AI relay) and an AI model provider (only the question text you ask the AI helper is sent — not your name or e-mail). These providers may store data on servers outside India.'],
   ['Children (under 18)','Many students are under 18. If you are under 18, a parent or guardian must agree to this policy before you use the app. We do not target advertising or track the behaviour of children. A parent/guardian may contact us to see, correct or delete the child\'s data.'],
   ['How long we keep it','While your account is active. After a deletion request we delete or anonymise your data within '+C.deleteDays+' days, except payment records we must keep for accounting/tax law.'],
   ['Your rights','You may ask to access, correct or delete your data, withdraw consent, or complain. Use <b>Privacy & Terms → My data</b> inside the app, or contact us below.'],
   ['Security','Access rules in the database, login required, admin-only controls, and error logs without personal data. No system is 100% secure; if a breach affects you we will inform you without delay.'],
   ['Changes & contact','We may update this policy; the date above will change and we will ask for fresh consent when needed. '+contactLine(false)]]},
  hi:{h:'गोपनीयता नीति (Privacy Policy)',b:[
   ['हम कौन हैं','"'+C.app+'" '+C.org+', '+C.place+' द्वारा चलाया जाने वाला NEET/JEE अभ्यास प्लेटफ़ॉर्म है। यह नीति बताती है कि हम कौन-सा व्यक्तिगत डेटा क्यों रखते हैं। अंतिम अपडेट: '+C.updated+'।'],
   ['हम कौन-सा डेटा लेते हैं','• खाता: नाम, ईमेल, भूमिका (स्टूडेंट/पैरेंट/फैकल्टी), कक्षा।<br>• पढ़ाई: टेस्ट/अभ्यास के परिणाम, प्रगति, गलतियाँ, उपस्थिति, होमवर्क, आपके डाउट, बुकमार्क।<br>• पैरेंट लिंक: पैरेंट द्वारा दिया गया बच्चे का ईमेल और बच्चे की मंज़ूरी।<br>• भुगतान: प्लान, राशि और UPI ट्रांज़ैक्शन ID (आपका UPI PIN या बैंक लॉगिन हम कभी नहीं देखते)।<br>• तकनीकी: बग सुधारने के लिए बिना ईमेल/पासवर्ड की गुमनाम एरर रिपोर्ट।<br>• आपके डिवाइस पर: सेटिंग, ऑफ़लाइन प्रश्न-पैक और ड्राफ़्ट ब्राउज़र में रहते हैं।'],
   ['उपयोग का कारण','खाता चलाने, परिणाम/रिपोर्ट दिखाने, आपकी मंज़ूरी के बाद पैरेंट/शिक्षक को प्रगति दिखाने, Premium भुगतान जाँचने, डाउट के उत्तर देने, नोटिफ़िकेशन भेजने, सुरक्षा और सुधार के लिए। हम आपका डेटा <b>बेचते नहीं</b> हैं और स्टूडेंट्स को <b>विज्ञापन नहीं</b> दिखाते, न ही उनकी आदतों की ट्रैकिंग करते हैं।'],
   ['कौन देख सकता है','आप; आपके पैरेंट <i>केवल आपकी मंज़ूरी के बाद</i>; संस्था के शिक्षक/ऑफ़िस स्टाफ़; एडमिन। सार्वजनिक लीडरबोर्ड में सिर्फ़ पहला नाम और बेस्ट स्कोर/XP दिखता है।'],
   ['सेवा प्रदाता','Google Firebase (लॉगिन, डेटाबेस), Cloudflare (होस्टिंग/AI रिले) और AI मॉडल प्रदाता (AI सहायक से पूछा गया केवल प्रश्न भेजा जाता है — नाम/ईमेल नहीं)। इनके सर्वर भारत के बाहर भी हो सकते हैं।'],
   ['बच्चे (18 वर्ष से कम)','अनेक स्टूडेंट 18 से कम उम्र के हैं। यदि आप 18 से कम हैं तो ऐप उपयोग से पहले माता-पिता/अभिभावक की सहमति ज़रूरी है। हम बच्चों को लक्षित विज्ञापन या व्यवहार-ट्रैकिंग नहीं करते। अभिभावक बच्चे का डेटा देखने/सुधारने/हटाने के लिए हमसे संपर्क कर सकते हैं।'],
   ['कितने समय रखते हैं','जब तक खाता चालू है। हटाने के अनुरोध के बाद '+C.deleteDays+' दिन में डेटा हटाया/गुमनाम किया जाता है — सिवाय भुगतान रिकॉर्ड के, जो कर/लेखा कानून के लिए रखने पड़ते हैं।'],
   ['आपके अधिकार','आप अपना डेटा देखने, सुधारने, हटाने, सहमति वापस लेने या शिकायत करने का अनुरोध कर सकते हैं: ऐप में <b>Privacy & Terms → मेरा डेटा</b> या नीचे का संपर्क।'],
   ['सुरक्षा','डेटाबेस में एक्सेस नियम, लॉगिन अनिवार्य, एडमिन-केवल नियंत्रण, और बिना व्यक्तिगत डेटा के एरर लॉग। कोई सिस्टम 100% सुरक्षित नहीं होता; आपके डेटा में सेंध लगी तो हम बिना देरी आपको सूचित करेंगे।'],
   ['बदलाव और संपर्क','नीति बदल सकती है; ऊपर की तारीख़ बदलेगी और ज़रूरत पर नई सहमति माँगी जाएगी। '+contactLine(true)]]}},
 terms:{
  en:{h:'Terms of Use',b:[
   ['Acceptance','By creating an account or using '+C.app+' you agree to these Terms and to the Privacy Policy. If you are under 18, your parent/guardian must also agree.'],
   ['The service','Practice questions, mock/class tests, lectures, planner and related tools for NEET/JEE preparation. Some features need a Premium plan. Features may change or be paused for maintenance.'],
   ['Your account','Give correct details, keep your password safe and do not share your login. One account is for one person. You are responsible for activity on your account.'],
   ['Acceptable use','Do not copy, resell, screen-record for distribution, scrape or share questions, books or lectures; do not cheat in tests, attack or overload the service, upload unlawful content or harass others. We may suspend accounts that break these rules.'],
   ['Premium plans','Premium gives access for the number of days shown on the plan, starting when we verify your UPI payment (normally within 24 hours). Plans do not renew automatically. Premium is for you only and cannot be transferred or shared. Prices may change for future purchases. See the Refund policy.'],
   ['Content & results','Questions, explanations and books are for practice. We try to be accurate but errors can occur — use "Report wrong question". AI answers can be wrong. We do not guarantee any exam score, rank or admission.'],
   ['Intellectual property','All content, design and software belong to '+C.org+' or its licensors. You get a personal, non-transferable licence to use it for your own study.'],
   ['Limitation of liability','To the extent permitted by law, we are not liable for indirect or consequential loss, or for interruptions beyond our control (internet, third-party services). Our total liability for any claim is limited to the amount you paid in the last 12 months.'],
   ['Law & disputes','Indian law applies. Please first write to us to resolve a problem; courts in Gujarat, India have jurisdiction, subject to your rights under consumer law.'],
   ['Contact',contactLine(false)]]},
  hi:{h:'उपयोग की शर्तें (Terms of Use)',b:[
   ['स्वीकृति','खाता बनाकर या '+C.app+' का उपयोग करके आप इन शर्तों और गोपनीयता नीति से सहमत होते हैं। 18 से कम उम्र में माता-पिता/अभिभावक की सहमति भी ज़रूरी है।'],
   ['सेवा','NEET/JEE तैयारी के लिए अभ्यास प्रश्न, मॉक/क्लास टेस्ट, लेक्चर, प्लानर आदि। कुछ सुविधाएँ Premium में हैं। सुविधाएँ बदल सकती हैं या रखरखाव में बंद हो सकती हैं।'],
   ['आपका खाता','सही जानकारी दें, पासवर्ड सुरक्षित रखें, लॉगिन साझा न करें। एक खाता = एक व्यक्ति। खाते की गतिविधि की ज़िम्मेदारी आपकी है।'],
   ['उचित उपयोग','प्रश्न, किताबें या लेक्चर कॉपी, बेचना, रिकॉर्ड करके बाँटना, स्क्रैप करना या साझा करना मना है; टेस्ट में नकल, सेवा पर हमला/ओवरलोड, गैरकानूनी सामग्री या दूसरों को परेशान करना मना है। नियम तोड़ने पर खाता बंद किया जा सकता है।'],
   ['Premium प्लान','Premium प्लान पर दिखाई गई दिनों की अवधि तक चलता है और हमारे द्वारा UPI भुगतान जाँचने के बाद (सामान्यतः 24 घंटे में) शुरू होता है। प्लान अपने-आप रिन्यू नहीं होता। यह केवल आपके लिए है, किसी को दिया/बाँटा नहीं जा सकता। भविष्य की खरीद पर कीमत बदल सकती है। रिफ़ंड नीति देखें।'],
   ['सामग्री और परिणाम','प्रश्न, व्याख्या और किताबें अभ्यास के लिए हैं। हम सटीक रखने की कोशिश करते हैं, फिर भी गलती संभव है — "Report wrong question" का उपयोग करें। AI के उत्तर गलत हो सकते हैं। हम किसी स्कोर, रैंक या प्रवेश की गारंटी नहीं देते।'],
   ['बौद्धिक संपदा','सभी सामग्री, डिज़ाइन और सॉफ़्टवेयर '+C.org+' या उसके लाइसेंसदाताओं का है। आपको केवल अपनी पढ़ाई के लिए व्यक्तिगत, अहस्तांतरणीय अनुमति मिलती है।'],
   ['दायित्व की सीमा','कानून की अनुमति तक, हम अप्रत्यक्ष नुकसान या हमारे नियंत्रण से बाहर रुकावटों (इंटरनेट, तृतीय-पक्ष सेवाएँ) के लिए ज़िम्मेदार नहीं हैं। किसी भी दावे में हमारी कुल देयता पिछले 12 महीनों में आपके दिए गए शुल्क तक सीमित है।'],
   ['कानून और विवाद','भारतीय कानून लागू होगा। पहले हमें लिखें; उपभोक्ता कानून के आपके अधिकारों के अधीन, गुजरात, भारत के न्यायालयों का क्षेत्राधिकार होगा।'],
   ['संपर्क',contactLine(true)]]}},
 refund:{
  en:{h:'Refund & Cancellation Policy',b:[
   ['Nature of purchase','Premium is a digital service activated after we verify your UPI payment. There is no automatic renewal, so there is nothing to cancel; access ends on the expiry date and the account returns to Free.'],
   ['When you get a refund','• Duplicate or wrong-amount payment — full refund of the extra amount.<br>• Payment made but Premium not activated within 72 hours and we cannot fix it — full refund.<br>• Serious technical problem that stops you from using Premium and we cannot fix it — refund for the unused period.<br>• Change of mind — refund within <b>'+C.refundDays+' days</b> of activation if you have used less than <b>'+C.refundUsedMaxPct+'%</b> of Premium content/features (decided by us on usage records).'],
   ['When we do not refund','After '+C.refundDays+' days, after heavy use, if your account was suspended for breaking the Terms, or for lack of exam results.'],
   ['How to ask','Write to '+esc(C.email)+' (from your registered e-mail) with your name, UTR/transaction ID and reason. We acknowledge within '+C.ackHours+' hours.'],
   ['How we pay','Approved refunds are paid to the same UPI/bank account within 7 working days. Premium is removed from the account when a refund is paid.']]},
  hi:{h:'रिफ़ंड और रद्दीकरण नीति',b:[
   ['खरीद का स्वरूप','Premium एक डिजिटल सेवा है जो UPI भुगतान जाँचने के बाद चालू होती है। ऑटो-रिन्यू नहीं है, इसलिए रद्द करने जैसा कुछ नहीं; समाप्ति तिथि पर पहुँच बंद होकर खाता Free हो जाता है।'],
   ['रिफ़ंड कब मिलेगा','• दोहरा या गलत राशि का भुगतान — अतिरिक्त राशि का पूरा रिफ़ंड।<br>• भुगतान हुआ पर 72 घंटे में Premium चालू नहीं हुआ और हम ठीक नहीं कर पाए — पूरा रिफ़ंड।<br>• गंभीर तकनीकी समस्या जिससे Premium उपयोग नहीं हो सका और हम ठीक नहीं कर पाए — बचे हुए समय का रिफ़ंड।<br>• मन बदलने पर — चालू होने के <b>'+C.refundDays+' दिन</b> में, यदि आपने Premium के <b>'+C.refundUsedMaxPct+'%</b> से कम सामग्री/सुविधाएँ उपयोग की हों (उपयोग-रिकॉर्ड के आधार पर हमारा निर्णय)।'],
   ['रिफ़ंड कब नहीं',''+C.refundDays+' दिन के बाद, अधिक उपयोग के बाद, शर्तें तोड़ने पर खाता बंद होने पर, या परीक्षा परिणाम न आने पर।'],
   ['कैसे माँगें','अपने पंजीकृत ईमेल से '+esc(C.email)+' पर नाम, UTR/ट्रांज़ैक्शन ID और कारण लिखें। हम '+C.ackHours+' घंटे में पावती देंगे।'],
   ['भुगतान कैसे','स्वीकृत रिफ़ंड 7 कार्य-दिवस में उसी UPI/बैंक खाते में भेजा जाता है। रिफ़ंड होते ही खाते से Premium हटा दिया जाता है।']]}},
 disclaimer:{
  en:{h:'Disclaimer & Copyright',b:[
   ['Not an official body','"'+C.app+'" is a private coaching/practice platform. It is <b>not affiliated with, endorsed by or connected to</b> the National Testing Agency, NEET, JEE, CBSE, NCERT or any government body. Exam names are used only to describe the kind of preparation.'],
   ['No guarantee','Practice questions and AI help are for learning. We do not promise any marks, rank or selection. Always cross-check important facts with your textbook and teacher.'],
   ['Questions & sources','Some questions are original, some are practice / memory-based style questions or adapted from public exam patterns. Labels such as year or "PYQ" describe the style/topic and do not claim an official paper.'],
   ['Copyright','© '+new Date().getFullYear()+' '+C.org+'. All rights reserved. Do not copy, upload elsewhere or sell our questions, books or videos.'],
   ['Report content / takedown','If you believe something here infringes your rights, or a question is wrong, use "Report wrong question" or write to '+esc(C.email)+' with the details and the link. We review and act within '+C.resolveDays+' days.']]},
  hi:{h:'अस्वीकरण और कॉपीराइट',b:[
   ['आधिकारिक संस्था नहीं','"'+C.app+'" एक निजी कोचिंग/अभ्यास प्लेटफ़ॉर्म है। यह NTA, NEET, JEE, CBSE, NCERT या किसी सरकारी संस्था से <b>जुड़ा, मान्यता-प्राप्त या समर्थित नहीं</b> है। परीक्षाओं के नाम केवल तैयारी का प्रकार बताने के लिए हैं।'],
   ['कोई गारंटी नहीं','अभ्यास प्रश्न और AI सहायता सीखने के लिए हैं। हम किसी अंक, रैंक या चयन का वादा नहीं करते। महत्वपूर्ण तथ्य अपनी पाठ्यपुस्तक और शिक्षक से जाँच लें।'],
   ['प्रश्न और स्रोत','कुछ प्रश्न मौलिक हैं, कुछ अभ्यास/स्मृति-आधारित शैली के या सार्वजनिक परीक्षा-पैटर्न से अनुकूलित हैं। वर्ष या "PYQ" जैसे लेबल शैली/विषय बताते हैं, आधिकारिक पेपर का दावा नहीं।'],
   ['कॉपीराइट','© '+new Date().getFullYear()+' '+C.org+'। सर्वाधिकार सुरक्षित। हमारे प्रश्न, किताबें या वीडियो को कॉपी, कहीं और अपलोड या बेचना मना है।'],
   ['सामग्री की शिकायत / हटाना','यदि आपको लगे कि यहाँ कुछ आपके अधिकारों का उल्लंघन करता है या कोई प्रश्न गलत है, तो "Report wrong question" का उपयोग करें या विवरण और लिंक के साथ '+esc(C.email)+' पर लिखें। हम '+C.resolveDays+' दिन में समीक्षा कर कार्रवाई करेंगे।']]}},
 contact:{
  en:{h:'Contact & Grievance Officer',b:[
   ['Who to write to','<b>Grievance Officer:</b> '+esc(C.owner)+'<br><b>Organisation:</b> '+esc(C.org)+'<br><b>Place:</b> '+esc(C.place)+'<br><b>E-mail:</b> '+esc(C.email)+(C.whatsapp?'<br><b>WhatsApp:</b> +'+esc(C.whatsapp):'')+'<br><b>Website:</b> '+esc(C.site)],
   ['How fast','We acknowledge every complaint within '+C.ackHours+' hours and aim to resolve it within '+C.resolveDays+' days.'],
   ['What to include','Your registered e-mail, a short description, screenshots, and for payments the UTR / transaction ID.']]},
  hi:{h:'संपर्क और शिकायत अधिकारी',b:[
   ['किसे लिखें','<b>शिकायत अधिकारी:</b> '+esc(C.owner)+'<br><b>संस्था:</b> '+esc(C.org)+'<br><b>स्थान:</b> '+esc(C.place)+'<br><b>ईमेल:</b> '+esc(C.email)+(C.whatsapp?'<br><b>WhatsApp:</b> +'+esc(C.whatsapp):'')+'<br><b>वेबसाइट:</b> '+esc(C.site)],
   ['कितनी जल्दी','हम हर शिकायत की '+C.ackHours+' घंटे में पावती देते हैं और '+C.resolveDays+' दिन में समाधान का प्रयास करते हैं।'],
   ['क्या लिखें','पंजीकृत ईमेल, संक्षिप्त विवरण, स्क्रीनशॉट और भुगतान के लिए UTR/ट्रांज़ैक्शन ID।']]}}
};
var TABS=[['privacy','🔒','Privacy','गोपनीयता'],['terms','📜','Terms','शर्तें'],['refund','💸','Refund','रिफ़ंड'],['disclaimer','⚠️','Disclaimer','अस्वीकरण'],['contact','☎️','Contact','संपर्क'],['mydata','🗂','My data','मेरा डेटा']];

/* ------------------------------ PAGE ------------------------------ */
function body(){
  var hi=S.lang==='hi';
  if(S.tab==='mydata') return myData(hi);
  var t=(T[S.tab]||T.privacy)[hi?'hi':'en'];
  return '<h2 style="font-size:22px;margin-bottom:6px">'+t.h+'</h2><div style="font-size:12px;color:var(--muted);margin-bottom:14px">v'+VER+' · '+esc(C.updated)+'</div>'+
    t.b.map(function(s,i){ return '<div style="margin:14px 0"><div style="font-weight:800;font-size:15px;margin-bottom:4px">'+(i+1)+'. '+s[0]+'</div><div style="font-size:14px;line-height:1.7;color:var(--text)">'+s[1]+'</div></div>'; }).join('');
}
function myData(hi){
  var u=(typeof DB!=='undefined'&&DB.currentUser);
  if(!u||!u.uid) return '<h2 style="font-size:22px">'+(hi?'मेरा डेटा':'My data')+'</h2><p style="margin-top:10px;font-size:14px">'+(hi?'अपना डेटा देखने/हटाने के लिए पहले लॉगिन करें, या '+esc(C.email)+' पर लिखें।':'Please log in to manage your data, or write to '+esc(C.email)+'.')+'</p>';
  return '<h2 style="font-size:22px;margin-bottom:10px">'+(hi?'मेरा डेटा':'My data')+'</h2>'+
   '<div class="card" style="padding:16px;margin-bottom:12px"><b>'+(hi?'डेटा की कॉपी':'Download my data')+'</b><p style="font-size:13.5px;margin:6px 0 10px">'+(hi?'अपनी प्रगति और सेटिंग की फ़ाइल डाउनलोड करें।':'Download a file of your progress and settings.')+'</p><button class="btn btn-outline btn-sm" onclick="go(\'backup\')">⬇️ '+(hi?'Backup & Restore खोलें':'Open Backup & Restore')+'</button></div>'+
   '<div class="card" style="padding:16px;margin-bottom:12px"><b>'+(hi?'सहमति':'Consent')+'</b><p style="font-size:13.5px;margin:6px 0">'+(ls('dsa_consent_'+u.uid)===VER?(hi?'✅ आपने वर्तमान शर्तों/नीति (v'+VER+') को स्वीकार किया है।':'✅ You accepted the current Terms & Privacy Policy (v'+VER+').'):(hi?'अभी स्वीकृति दर्ज नहीं है।':'No acceptance recorded yet.'))+'</p></div>'+
   '<div class="card" style="padding:16px;border:1.5px solid #fca5a5"><b style="color:#b91c1c">'+(hi?'मेरा डेटा और खाता हटाएँ':'Delete my data & account')+'</b><p style="font-size:13.5px;margin:6px 0 10px">'+(hi?'आपकी प्रगति, लीडरबोर्ड कार्ड और इस डिवाइस के ऑफ़लाइन पैक तुरंत हट जाएँगे। बाकी रिकॉर्ड (टेस्ट परिणाम, प्रोफ़ाइल) एडमिन '+C.deleteDays+' दिन में हटाएगा। भुगतान रिकॉर्ड कानूनन रखे जा सकते हैं। यह वापस नहीं हो सकता।':'Your progress, leaderboard card and offline packs on this device are removed immediately. The admin removes the rest (results, profile) within '+C.deleteDays+' days. Payment records may be kept as required by law. This cannot be undone.')+'</p><button class="btn btn-sm" style="background:#dc2626;color:#fff" onclick="LEGAL.requestDelete()">🗑 '+(hi?'हटाने का अनुरोध भेजें':'Send deletion request')+'</button></div>';
}
window.renderLegal=function(){
  var p=(typeof ROUTE!=='undefined'&&ROUTE.params)||{}; if(p.tab&&p.tab!==S._last){ S.tab=p.tab; S._last=p.tab; }
  var inApp=!!((typeof DB!=='undefined'&&DB.currentUser));
  var bar='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;align-items:center">'+TABS.map(function(t){ return '<button class="btn btn-sm '+(S.tab===t[0]?'btn-primary':'btn-outline')+'" onclick="LEGAL.tab(\''+t[0]+'\')">'+t[1]+' '+(S.lang==='hi'?t[3]:t[2])+'</button>'; }).join('')+
    '<span style="flex:1"></span><button class="btn btn-sm btn-outline" onclick="LEGAL.lang()">'+(S.lang==='hi'?'English':'हिंदी')+'</button></div>';
  var inner='<div style="max-width:820px;margin:0 auto">'+bar+'<div class="card" style="padding:22px">'+body()+'</div>'+(inApp?'':'<div style="text-align:center;margin-top:16px"><button class="btn btn-outline" onclick="go(\'landing\')">← '+(S.lang==='hi'?'वापस':'Back')+'</button></div>')+'</div>';
  if(inApp&&typeof sidebar==='function') return '<div class="app-shell">'+sidebar('legal')+'<div class="main">'+inner+'</div></div>';
  return '<div class="container" style="padding:28px 16px">'+inner+'</div>';
};
L.tab=function(t){ S.tab=t; S._last=t; render(); };
L.lang=function(){ S.lang=S.lang==='hi'?'en':'hi'; render(); };
L.open=function(t){ S.tab=t; S._last=t; go('legal',{tab:t}); };

/* --------------------------- DELETE REQUEST --------------------------- */
L.requestDelete=function(){
  var u=DB.currentUser; if(!u||!u.uid||!window.FIREBASE_ENABLED){ toast('Please log in first','⚠️'); return; }
  if(!confirm('Delete your progress now and ask the admin to remove the rest of your data?\nThis cannot be undone.')) return;
  var uid=u.uid, db=fbDb, F=firebase.firestore.FieldValue;
  var del=['mcqProgress','learnData','lectureWatch','lb'].map(function(c){ return db.collection(c).doc(uid).delete().catch(function(){}); });
  Promise.all(del).then(function(){
    return db.collection('deleteRequests').doc(uid).set({uid:uid,email:u.email||'',name:u.name||'',role:u.role||'',status:'pending',when:F.serverTimestamp()});
  }).then(function(){
    try{ indexedDB.deleteDatabase('dsa-offline'); }catch(e){}
    try{ Object.keys(localStorage).forEach(function(k){ if(/^dsa_|^dsa-/.test(k)) localStorage.removeItem(k); }); }catch(e){}
    toast('Request sent. You will be logged out.','✅');
    setTimeout(function(){ try{ fbAuth.signOut(); }catch(e){} DB.currentUser=null; go('landing'); },1200);
  }).catch(function(e){ toast('Could not send request ('+((e&&e.code)||'error')+'). E-mail '+C.email,'⚠️'); });
};

/* ------------------------ ADMIN: DATA REQUESTS ------------------------ */
var A={rows:null,busy:false};
window.renderDelReq=function(){
  if(A.rows===null) loadReq();
  var rows=A.rows||[];
  return '<div class="app-shell">'+sidebar('delreq')+'<div class="main"><h2 style="font-size:22px;margin-bottom:6px">🗑 Data deletion requests</h2><p style="font-size:13.5px;color:var(--muted);margin-bottom:14px">Student / parent ne "Delete my data" dabaya. "Erase now" us e-mail ke test results, doubts, attendance, homework, class-test results aur profile hata deta hai. Last step: Firebase Console → Authentication → us e-mail ka user delete karo. '+C.deleteDays+' din ke andar karo.</p>'+
   (A.rows===null?'<div class="card" style="padding:20px">Loading…</div>':!rows.length?'<div class="card" style="padding:20px">No requests 🎉</div>':rows.map(function(r){
     return '<div class="card" style="padding:14px;margin-bottom:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div style="flex:1;min-width:200px"><b>'+esc(r.name)+'</b> <span class="pill pill-navy">'+esc(r.role)+'</span><br><span style="font-size:12.5px;color:var(--muted)">'+esc(r.email)+' · '+esc(r.when)+'</span></div>'+
       (r.status==='done'?'<span class="pill pill-green">✔ done</span>':'<button class="btn btn-sm" style="background:#dc2626;color:#fff" onclick="LEGAL.erase(\''+esc(r.uid)+'\')">Erase now</button>')+'</div>'; }).join(''))+'</div></div>';
};
function loadReq(){
  if(!window.FIREBASE_ENABLED){ A.rows=[]; return; }
  fbDb.collection('deleteRequests').limit(100).get().then(function(s){
    A.rows=s.docs.map(function(d){ var x=d.data(); x.uid=x.uid||d.id; x.when=x.when&&x.when.toDate?x.when.toDate().toLocaleDateString('en-IN'):''; return x; }).sort(function(a,b){ return (a.status==='done')-(b.status==='done'); }); render();
  }).catch(function(e){ A.rows=[]; toast('Could not load ('+((e&&e.code)||'error')+') — publish the latest rules','⚠️'); render(); });
}
L.erase=function(uid){
  var r=(A.rows||[]).filter(function(x){ return x.uid===uid; })[0]; if(!r||A.busy) return;
  if(!confirm('Permanently erase all data of '+r.email+' ?\nThis cannot be undone.')) return;
  A.busy=true; var db=fbDb, em=r.email, n=0;
  function wipe(c,field){ return db.collection(c).where(field,'==',em).limit(500).get().then(function(s){ var b=db.batch(); s.docs.forEach(function(d){ b.delete(d.ref); n++; }); return s.size?b.commit():null; }); }
  Promise.all([wipe('testResults','email'),wipe('doubts','email'),wipe('classTestResults','email'),wipe('homeworkDone','email'),wipe('attendance','email'),wipe('users','email'),wipe('notifications','toEmail')])
   .then(function(){ return db.collection('deleteRequests').doc(uid).update({status:'done'}); })
   .then(function(){ A.busy=false; r.status='done'; toast('Erased '+n+' records. Now delete the user in Firebase Authentication.','✅'); render(); })
   .catch(function(e){ A.busy=false; toast('Failed ('+((e&&e.code)||'error')+') — publish the latest rules first','⚠️'); });
};

/* ------------------------------ CONSENT ------------------------------ */
L.ver=VER;
L.signupBoxes=function(){
  return '<div style="margin:6px 0 12px;font-size:12.5px;line-height:1.5">'+
   '<label style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px"><input type="checkbox" id="authTerms" required style="margin-top:3px"> <span>I accept the <a onclick="LEGAL.open(\'terms\')" style="color:var(--green-600);font-weight:700;cursor:pointer">Terms</a>, <a onclick="LEGAL.open(\'privacy\')" style="color:var(--green-600);font-weight:700;cursor:pointer">Privacy Policy</a> and <a onclick="LEGAL.open(\'refund\')" style="color:var(--green-600);font-weight:700;cursor:pointer">Refund Policy</a>.</span></label>'+
   '<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="authMinor" style="margin-top:3px"> <span>I am under 18 and my parent / guardian has agreed to my use of this app.</span></label></div>';
};
L.consentFields=function(){ var m=document.getElementById('authMinor'); return {v:VER,at:Date.now(),minor:!!(m&&m.checked)}; };
L.termsOk=function(){ var t=document.getElementById('authTerms'); return !t||t.checked; };
L.mark=function(uid){ ls('dsa_consent_'+uid,VER); };

var G={checking:false,shown:false,uid:null};
function gate(){
  var u=(typeof DB!=='undefined'&&DB.currentUser); if(!u||!u.uid||!window.FIREBASE_ENABLED||G.checking||G.shown) return;
  if(ls('dsa_consent_'+u.uid)===VER) return;
  if(typeof ROUTE!=='undefined'&&ROUTE.view==='legal') return;
  G.checking=true;
  fbDb.collection('users').doc(u.uid).get().then(function(d){
    G.checking=false; var c=d.exists&&d.data().consent;
    if(c&&c.v===VER){ L.mark(u.uid); return; }
    showGate(u);
  }).catch(function(){ G.checking=false; });
}
function showGate(u){
  if(G.shown) return; G.shown=true;
  var o=document.createElement('div'); o.id='consentGate';
  o.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,.78);display:flex;align-items:center;justify-content:center;padding:16px';
  o.innerHTML='<div role="dialog" aria-modal="true" aria-label="Terms and privacy" style="background:var(--card,#fff);color:var(--text,#111);max-width:460px;width:100%;border-radius:16px;padding:22px;max-height:90vh;overflow:auto"><div style="font-size:20px;font-weight:800;margin-bottom:6px">📜 Terms & Privacy</div><p style="font-size:13.5px;line-height:1.6;margin-bottom:10px">We have added a Privacy Policy, Terms of Use and Refund Policy. Please read and accept to continue. / कृपया नई शर्तें पढ़कर स्वीकार करें।</p><p style="font-size:13px;margin-bottom:10px"><a onclick="LEGAL.open(\'terms\')" style="color:var(--green-600);font-weight:700;cursor:pointer">Terms</a> · <a onclick="LEGAL.open(\'privacy\')" style="color:var(--green-600);font-weight:700;cursor:pointer">Privacy</a> · <a onclick="LEGAL.open(\'refund\')" style="color:var(--green-600);font-weight:700;cursor:pointer">Refund</a></p>'+
   '<label style="display:flex;gap:8px;font-size:13px;margin-bottom:6px"><input type="checkbox" id="cgOk" style="margin-top:3px"> <span>I accept the Terms, Privacy Policy and Refund Policy.</span></label>'+
   '<label style="display:flex;gap:8px;font-size:13px;margin-bottom:14px"><input type="checkbox" id="cgMinor" style="margin-top:3px"> <span>I am under 18 and my parent / guardian has agreed.</span></label>'+
   '<div style="display:flex;gap:8px"><button class="btn btn-primary" id="cgBtn" style="flex:1">Accept & continue</button><button class="btn btn-outline" id="cgOut">Log out</button></div></div>';
  document.body.appendChild(o);
  o.querySelector('#cgBtn').onclick=function(){
    if(!o.querySelector('#cgOk').checked){ toast('Please tick the box to continue','⚠️'); return; }
    var c={v:VER,at:Date.now(),minor:!!o.querySelector('#cgMinor').checked};
    fbDb.collection('users').doc(u.uid).update({consent:c}).then(function(){ L.mark(u.uid); o.remove(); G.shown=false; toast('Thank you ✅'); })
      .catch(function(e){ toast('Could not save ('+((e&&e.code)||'error')+')','⚠️'); });
  };
  o.querySelector('#cgOut').onclick=function(){ o.remove(); G.shown=false; try{ logout(); }catch(e){} };
}
setInterval(gate,2500); setTimeout(gate,1200);
})();
