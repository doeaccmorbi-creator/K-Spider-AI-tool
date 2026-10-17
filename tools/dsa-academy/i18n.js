/* =========================================================================
   Dr. Shreyansh Academy — Languages (i18n.js)
   English · हिन्दी · ગુજરાતી  — works with zero cost and no translation API.
   A built-in dictionary swaps the app's interface text (menus, headings,
   buttons, labels) after every screen draw. Question text, teacher-written
   content and anything not in the dictionary stay as they are.
   To add or fix a word: edit the DICT list below — one line per phrase.
   ========================================================================= */
(function(){
'use strict';
var DICT=[
/* ---- navigation ---- */
['Dashboard','डैशबोर्ड','ડેશબોર્ડ'],['Full Mock Test','पूर्ण मॉक टेस्ट','ફુલ મોક ટેસ્ટ'],['MCQ Practice Hub','MCQ प्रैक्टिस हब','MCQ પ્રેક્ટિસ હબ'],['Learning Hub','लर्निंग हब','લર્નિંગ હબ'],
['Study Planner','स्टडी प्लानर','સ્ટડી પ્લાનર'],['Video Lectures','वीडियो लेक्चर','વિડિયો લેક્ચર'],['Timetable','समय-सारणी','સમયપત્રક'],['Resource Library','संसाधन पुस्तकालय','સંસાધન લાઇબ્રેરી'],
['My Attendance','मेरी उपस्थिति','મારી હાજરી'],['Class Tests','क्लास टेस्ट','ક્લાસ ટેસ્ટ'],['Leaderboard','लीडरबोर्ड','લીડરબોર્ડ'],['My Progress','मेरी प्रगति','મારી પ્રગતિ'],
['Ask a Doubt','शंका पूछें','શંકા પૂછો'],['Bookmarks','बुकमार्क','બુકમાર્ક'],['Notice Board','सूचना पट्ट','નોટિસ બોર્ડ'],['Plans','प्लान','પ્લાન'],['My Fees','मेरी फीस','મારી ફી'],
['My Profile','मेरी प्रोफ़ाइल','મારી પ્રોફાઇલ'],['Back to site','साइट पर वापस','સાઇટ પર પાછા'],['Log out','लॉग आउट','લૉગ આઉટ'],['Batches','बैच','બેચ'],['My Batch','मेरा बैच','મારો બેચ'],
['Overview','अवलोकन','ઝાંખી'],['Weekly Report','साप्ताहिक रिपोर्ट','સાપ્તાહિક રિપોર્ટ'],['Attendance','उपस्थिति','હાજરી'],['Doubts inbox','शंका इनबॉक्स','શંકા ઇનબૉક્સ'],
['Student Performance','छात्र प्रदर्शन','વિદ્યાર્થી પ્રદર્શન'],['Class Insights','क्लास इनसाइट्स','ક્લાસ ઇનસાઇટ્સ'],['Mark Attendance','उपस्थिति दर्ज करें','હાજરી નોંધો'],['Teacher Analytics','शिक्षक एनालिटिक्स','શિક્ષક એનાલિટિક્સ'],
['Analytics','एनालिटिक्स','એનાલિટિક્સ'],['Manage Faculty','शिक्षक प्रबंधन','શિક્ષક વ્યવસ્થાપન'],['Parent Accounts','अभिभावक खाते','વાલી ખાતા'],['MCQ Insights','MCQ इनसाइट्स','MCQ ઇનસાઇટ્સ'],['Fee Reminders','फीस रिमाइंडर','ફી રિમાઇન્ડર'],
['STUDENT','छात्र','વિદ્યાર્થી'],['FACULTY','शिक्षक','શિક્ષક'],['PARENT','अभिभावक','વાલી'],['ADMIN','एडमिन','એડમિન'],['PREMIUM','प्रीमियम','પ્રીમિયમ'],['FREE','मुफ़्त','મફત'],['Premium','प्रीमियम','પ્રીમિયમ'],
/* ---- common words / buttons ---- */
['Start','शुरू करें','શરૂ કરો'],['Next','आगे','આગળ'],['Previous','पिछला','પાછળ'],['Submit test','टेस्ट जमा करें','ટેસ્ટ સબમિટ કરો'],['Finish','समाप्त','પૂર્ણ'],['Save','सहेजें','સાચવો'],['Cancel','रद्द करें','રદ કરો'],
['Delete','हटाएँ','કાઢી નાખો'],['Close','बंद करें','બંધ કરો'],['Loading','लोड हो रहा है','લોડ થઈ રહ્યું છે'],['Retry','फिर कोशिश करें','ફરી પ્રયાસ કરો'],['Refresh','रीफ़्रेश','રિફ્રેશ'],['Open','खोलें','ખોલો'],
['All','सभी','બધા'],['Back','वापस','પાછા'],['Add','जोड़ें','ઉમેરો'],['Create','बनाएँ','બનાવો'],['Search','खोजें','શોધો'],['Practice more','और अभ्यास करें','વધુ પ્રેક્ટિસ કરો'],['Hub home','हब होम','હબ હોમ'],
['Review','समीक्षा','સમીક્ષા'],['Skipped','छोड़ा गया','છોડેલા'],['Score','स्कोर','સ્કોર'],['Accuracy','सटीकता','ચોકસાઈ'],['Time','समय','સમય'],['Right / Wrong / Skipped','सही / गलत / छोड़े','સાચા / ખોટા / છોડેલા'],
['Yes','हाँ','હા'],['No','नहीं','ના'],['Export','एक्सपोर्ट','એક્સપોર્ટ'],['Email','ईमेल','ઇમેઇલ'],['Name','नाम','નામ'],['Student','छात्र','વિદ્યાર્થી'],['Subject','विषय','વિષય'],['Chapter','अध्याय','પ્રકરણ'],['Topic','टॉपिक','ટોપિક'],
['Date','तारीख','તારીખ'],['Status','स्थिति','સ્થિતિ'],['Plan','प्लान','પ્લાન'],['Physics','भौतिक विज्ञान','ભૌતિક વિજ્ઞાન'],['Chemistry','रसायन विज्ञान','રસાયણ વિજ્ઞાન'],['Biology','जीव विज्ञान','જીવ વિજ્ઞાન'],['Maths','गणित','ગણિત'],
/* ---- MCQ practice hub ---- */
['Daily Challenge','दैनिक चुनौती','દૈનિક પડકાર'],['Weak Areas','कमज़ोर क्षेत्र','નબળા વિસ્તારો'],['Revision','पुनरावृत्ति','પુનરાવર્તન'],['Bookmarked','बुकमार्क किए हुए','બુકમાર્ક કરેલા'],['Mode','मोड','મોડ'],
['Learn (instant answer + explanation)','सीखें (तुरंत उत्तर + व्याख्या)','શીખો (તરત જવાબ + સમજૂતી)'],['Test (+4 / −1, timed)','टेस्ट (+4 / −1, समय सीमा)','ટેસ્ટ (+4 / −1, સમયમર્યાદા)'],['Number of questions','प्रश्नों की संख्या','પ્રશ્નોની સંખ્યા'],
['Question type','प्रश्न का प्रकार','પ્રશ્નનો પ્રકાર'],['Chapters','अध्याय','પ્રકરણો'],['Select all','सभी चुनें','બધા પસંદ કરો'],['Clear','साफ़ करें','સાફ કરો'],['Unlock Premium','प्रीमियम अनलॉक करें','પ્રીમિયમ અનલૉક કરો'],
['Question palette','प्रश्न पैलेट','પ્રશ્ન પેલેટ'],['Quit practice','अभ्यास छोड़ें','પ્રેક્ટિસ છોડો'],['Mark for review','समीक्षा के लिए चिह्नित करें','સમીક્ષા માટે ચિહ્નિત કરો'],['Bookmark','बुकमार्क','બુકમાર્ક'],['Report','रिपोर्ट','રિપોર્ટ'],
['Tutor','ट्यूटर','ટ્યુટર'],['Practice complete','अभ्यास पूरा हुआ','પ્રેક્ટિસ પૂર્ણ'],['Not started yet','अभी शुरू नहीं हुआ','હજી શરૂ નથી કર્યું'],['Coaching insights','कोचिंग इनसाइट्स','કોચિંગ ઇનસાઇટ્સ'],
['Not started','शुरू नहीं हुआ','શરૂ નથી થયું'],['Started','शुरू हुआ','શરૂ થયું'],['Needs work','सुधार चाहिए','સુધારાની જરૂર'],['Improving','सुधर रहा है','સુધરી રહ્યું છે'],['Strong','मज़बूत','મજબૂત'],['Mastered','महारत हासिल','નિપુણ'],
/* ---- learning hub ---- */
['Today','आज','આજે'],['Notebook','नोटबुक','નોટબુક'],['Mastery map','महारत मानचित्र','નિપુણતા નકશો'],['Mock exams','मॉक परीक्षा','મોક પરીક્ષા'],['Numericals','न्यूमेरिकल','ન્યુમેરિકલ'],['Rewards','पुरस्कार','પુરસ્કાર'],
['Your plan for today','आज की आपकी योजना','આજનું તમારું આયોજન'],['Revise what you got wrong','जो गलत हुआ उसे दोहराएँ','જે ખોટું પડ્યું તે ફરી કરો'],['Start revision','पुनरावृत्ति शुरू करें','પુનરાવર્તન શરૂ કરો'],
['Daily goal','दैनिक लक्ष्य','દૈનિક લક્ષ્ય'],['Spaced revision','अंतराल पुनरावृत्ति','અંતરાલ પુનરાવર્તન'],['Your mistake pattern','आपकी गलतियों का पैटर्न','તમારી ભૂલોની પેટર્ન'],['Concept','अवधारणा','ખ્યાલ'],
['Calculation','गणना','ગણતરી'],['Silly mistake','लापरवाही की गलती','બેદરકારીની ભૂલ'],['Time pressure','समय का दबाव','સમયનું દબાણ'],['Guess','अंदाज़ा','અંદાજ'],['Got it — remove','समझ गया — हटाएँ','સમજાઈ ગયું — દૂર કરો'],
['Start mock','मॉक शुरू करें','મોક શરૂ કરો'],['Your mock history','आपका मॉक इतिहास','તમારો મોક ઇતિહાસ'],['Infinite numericals','अनंत न्यूमेरिकल','અનંત ન્યુમેરિકલ'],['Smart practice','स्मार्ट अभ्यास','સ્માર્ટ પ્રેક્ટિસ'],
['Easy','आसान','સરળ'],['Medium','मध्यम','મધ્યમ'],['Hard','कठिन','અઘરું'],['LEVEL','स्तर','લેવલ'],['Streak','स्ट्रीक','સ્ટ્રીક'],['Badges','बैज','બેજ'],['Weekly league','साप्ताहिक लीग','સાપ્તાહિક લીગ'],
['Show this week\'s league','इस हफ़्ते की लीग दिखाएँ','આ અઠવાડિયાની લીગ બતાવો'],['My batch','मेरा बैच','મારો બેચ'],['Everyone','सभी','બધા'],['Revision due today','आज की पुनरावृत्ति','આજનું પુનરાવર્તન'],
['In mistake notebook','गलती नोटबुक में','ભૂલ નોટબુકમાં'],['Syllabus started','पाठ्यक्रम शुरू','અભ્યાસક્રમ શરૂ'],['Today\'s goal','आज का लक्ष्य','આજનું લક્ષ્ય'],
/* ---- study planner ---- */
['My exam goal','मेरा परीक्षा लक्ष्य','મારો પરીક્ષા લક્ષ્ય'],['Exam','परीक्षा','પરીક્ષા'],['Exam date','परीक्षा की तारीख','પરીક્ષાની તારીખ'],['Daily question goal','दैनिक प्रश्न लक्ष्य','દૈનિક પ્રશ્ન લક્ષ્ય'],['Save goal','लक्ष्य सहेजें','લક્ષ્ય સાચવો'],
['Last 7 days','पिछले 7 दिन','છેલ્લા 7 દિવસ'],['My planner','मेरा प्लानर','મારું પ્લાનર'],['Focus timer (Pomodoro)','फ़ोकस टाइमर (पोमोडोरो)','ફોકસ ટાઇમર (પોમોડોરો)'],['Pause','रोकें','થોભાવો'],['Reset','रीसेट','રીસેટ'],
['Focus 25 min','फ़ोकस 25 मिनट','ફોકસ 25 મિનિટ'],['Break 5 min','ब्रेक 5 मिनट','બ્રેક 5 મિનિટ'],['Show leaderboard','लीडरबोर्ड दिखाएँ','લીડરબોર્ડ બતાવો'],['Day streak','दिन की स्ट्रीक','દિવસની સ્ટ્રીક'],
['Questions today','आज के प्रश्न','આજના પ્રશ્નો'],['Days to exam','परीक्षा में दिन','પરીક્ષામાં દિવસો'],
/* ---- lectures / timetable / resources / attendance ---- */
['Add lecture','लेक्चर जोड़ें','લેક્ચર ઉમેરો'],['Publish lecture','लेक्चर प्रकाशित करें','લેક્ચર પ્રકાશિત કરો'],['All lectures','सभी लेक्चर','બધા લેક્ચર'],['Recorded','रिकॉर्डेड','રેકોર્ડેડ'],['Watched','देखा हुआ','જોયેલ'],
['Mark this part as watched','इस भाग को देखा हुआ चिह्नित करें','આ ભાગને જોયેલ તરીકે ચિહ્નિત કરો'],['Practice MCQs on this chapter','इस अध्याय के MCQ का अभ्यास करें','આ પ્રકરણના MCQ ની પ્રેક્ટિસ કરો'],['Ask a doubt','शंका पूछें','શંકા પૂછો'],['Parts','भाग','ભાગ'],
['Watch lectures','लेक्चर देखें','લેક્ચર જુઓ'],['Practice MCQs','MCQ अभ्यास','MCQ પ્રેક્ટિસ'],['Join class','क्लास जॉइन करें','ક્લાસ જોડાઓ'],['Add class','क्लास जोड़ें','ક્લાસ ઉમેરો'],['Schedule a class','क्लास निर्धारित करें','ક્લાસ નક્કી કરો'],
['No upcoming classes scheduled yet.','अभी कोई आगामी क्लास निर्धारित नहीं है।','હજી કોઈ આગામી ક્લાસ નક્કી નથી.'],['No class today','आज कोई क्लास नहीं','આજે કોઈ ક્લાસ નથી'],['Add a resource','संसाधन जोड़ें','સંસાધન ઉમેરો'],
['Notes (PDF)','नोट्स (PDF)','નોટ્સ (PDF)'],['Video','वीडियो','વિડિયો'],['Formula sheet','फ़ॉर्मूला शीट','ફૉર્મ્યુલા શીટ'],['Practice sheet','अभ्यास शीट','પ્રેક્ટિસ શીટ'],['Present','उपस्थित','હાજર'],['Absent','अनुपस्थित','ગેરહાજર'],
['Overall attendance','कुल उपस्थिति','કુલ હાજરી'],['Classes attended','उपस्थित कक्षाएँ','હાજર રહેલા ક્લાસ'],['Classes missed','छूटी कक्षाएँ','ચૂકી ગયેલા ક્લાસ'],['Classes recorded','दर्ज कक्षाएँ','નોંધાયેલા ક્લાસ'],['Subject-wise','विषयवार','વિષયવાર'],
['Recent classes','हाल की कक्षाएँ','તાજેતરના ક્લાસ'],['Save attendance','उपस्थिति सहेजें','હાજરી સાચવો'],['Start test','टेस्ट शुरू करें','ટેસ્ટ શરૂ કરો'],['Results','परिणाम','પરિણામ'],['Create test','टेस्ट बनाएँ','ટેસ્ટ બનાવો'],
/* ---- notices / glance / batches / parents ---- */
['For you','आपके लिए','તમારા માટે'],['Mark all read','सभी पढ़ा हुआ चिह्नित करें','બધું વાંચેલ તરીકે ચિહ્નિત કરો'],['All caught up','सब अद्यतन है','બધું અપ-ટુ-ડેટ'],['Notifications','सूचनाएँ','સૂચનાઓ'],
['Fees due','बकाया फीस','બાકી ફી'],['Video lectures','वीडियो लेक्चर','વિડિયો લેક્ચર'],['Spaced revision due','अंतराल पुनरावृत्ति देय','અંતરાલ પુનરાવર્તન બાકી'],['Weekly report','साप्ताहिक रिपोर्ट','સાપ્તાહિક રિપોર્ટ'],
['Class tests','क्लास टेस्ट','ક્લાસ ટેસ્ટ'],['None pending','कोई लंबित नहीं','કોઈ બાકી નથી'],['Watch','देखें','જુઓ'],['View','देखें','જુઓ'],['Mark','दर्ज करें','નોંધો'],['Loading today\'s summary…','आज का सारांश लोड हो रहा है…','આજનો સારાંશ લોડ થઈ રહ્યો છે…'],
['Join a batch','बैच से जुड़ें','બેચમાં જોડાઓ'],['Leave batch','बैच छोड़ें','બેચ છોડો'],['Create a batch','बैच बनाएँ','બેચ બનાવો'],['Members','सदस्य','સભ્યો'],['Share on WhatsApp','व्हाट्सऐप पर शेयर करें','વોટ્સએપ પર શેર કરો'],
['Needs attention','ध्यान देने योग्य','ધ્યાન આપવા જેવું'],['Tests this week','इस सप्ताह के टेस्ट','આ અઠવાડિયાના ટેસ્ટ'],['Copy text','टेक्स्ट कॉपी करें','ટેક્સ્ટ કૉપિ કરો'],['Print','प्रिंट करें','પ્રિન્ટ કરો'],
['Students','छात्र','વિદ્યાર્થીઓ'],['Avg attendance','औसत उपस्थिति','સરેરાશ હાજરી'],['Class-test average','क्लास-टेस्ट औसत','ક્લાસ-ટેસ્ટ સરેરાશ'],['Export CSV','CSV एक्सपोर्ट','CSV એક્સપોર્ટ'],
/* ---- tutor ---- */
['Smart Tutor','स्मार्ट ट्यूटर','સ્માર્ટ ટ્યુટર'],['Hint 1 — What is this about?','संकेत 1 — यह किस बारे में है?','સંકેત 1 — આ શેના વિશે છે?'],['Hint 2 — Narrow it down','संकेत 2 — विकल्प कम करें','સંકેત 2 — વિકલ્પો ઘટાડો'],
['Answer & explanation','उत्तर और व्याख्या','જવાબ અને સમજૂતી'],['Explained simply','सरल भाषा में समझाया','સરળ ભાષામાં સમજાવ્યું']
];
var PATS=[
 [/^Question (\d+) of (\d+)(.*)$/,'प्रश्न $1 / $2$3','પ્રશ્ન $1 / $2$3'],
 [/^(\d+) chapters? · ([\d,]+) questions?$/,'$1 अध्याय · $2 प्रश्न','$1 પ્રકરણ · $2 પ્રશ્નો'],
 [/^(\d+)% accuracy · (\d+) attempted$/,'$1% सटीकता · $2 हल किए','$1% ચોકસાઈ · $2 પ્રયાસ'],
 [/^(\d+) live now$/,'$1 अभी लाइव','$1 હમણાં લાઇવ'],[/^(\d+) waiting$/,'$1 प्रतीक्षा में','$1 બાકી'],[/^(\d+) to revise$/,'$1 दोहराने हैं','$1 ફરી કરવાના'],
 [/^(\d+) class(?:es)? today$/,'आज $1 क्लास','આજે $1 ક્લાસ'],[/^(\d+) new$/,'$1 नई','$1 નવી'],[/^Level (\d+)$/,'स्तर $1','લેવલ $1'],[/^LEVEL (\d+)$/,'स्तर $1','લેવલ $1'],
 [/^([\d,]+) XP$/,'$1 XP','$1 XP'],[/^(\d+) days?$/,'$1 दिन','$1 દિવસ'],[/^(\d+) questions? are due now.*$/,'$1 प्रश्न अभी दोहराने हैं','$1 પ્રશ્નો હવે ફરી કરવાના છે'],
 [/^Streak freezes: (\d+) \/ (\d+)$/,'स्ट्रीक फ़्रीज़: $1 / $2','સ્ટ્રીક ફ્રીઝ: $1 / $2'],[/^(\d+) students?$/,'$1 छात्र','$1 વિદ્યાર્થી'],[/^(\d+) parts?$/,'$1 भाग','$1 ભાગ'],
 [/^Parts \((\d+)\)$/,'भाग ($1)','ભાગ ($1)'],[/^Badges \((\d+) \/ (\d+)\)$/,'बैज ($1 / $2)','બેજ ($1 / $2)'],[/^Revision \((\d+)\)$/,'पुनरावृत्ति ($1)','પુનરાવર્તન ($1)'],[/^Notebook \((\d+)\)$/,'नोटबुक ($1)','નોટબુક ($1)']
];
var MAP={hi:{},gu:{}}; DICT.forEach(function(d){ MAP.hi[d[0]]=d[1]; MAP.gu[d[0]]=d[2]; });
var LABEL={en:'English',hi:'हिन्दी',gu:'ગુજરાતી'}, lang='en', busy=false, timer=null;
try{ lang=localStorage.getItem('dsa_lang')||'en'; }catch(e){}
if(!LABEL[lang]) lang='en';
var I=window.I18N={lang:lang,dict:DICT,pats:PATS};

function conv(t){
  var m=t.match(/^([^A-Za-z0-9]*)([\s\S]*?)([\s:.…→←?!]*)$/); if(!m||!m[2]) return t;
  var core=m[2], r=MAP[lang][core];
  if(r===undefined){ for(var i=0;i<PATS.length;i++){ var p=PATS[i]; if(p[0].test(core)){ r=core.replace(p[0],lang==='hi'?p[1]:p[2]); break; } } }
  return r===undefined?t:m[1]+r+m[3];
}
I.tr=function(s){ return lang==='en'?s:conv(s); };
var SKIP=/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE|OPTION)$/;
function run(){
  if(busy) return; busy=true;
  try{
    ensureSwitch();
    if(lang!=='en'){
      var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null), n, list=[];
      while((n=w.nextNode())) list.push(n);
      list.forEach(function(n){ var p=n.parentNode; if(!p||SKIP.test(p.nodeName)||(p.closest&&p.closest('.q-text,.opt-row,#xLang,[data-notr]'))) return;
        var t=n.nodeValue; if(!t||t.length>90||!/[A-Za-z]/.test(t)) return; var r=conv(t); if(r!==t) n.nodeValue=r; });
      document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function(e){ var o=e.getAttribute('data-ph')||e.getAttribute('placeholder'); if(!e.getAttribute('data-ph')) e.setAttribute('data-ph',o); var r=conv(o); if(r!==o) e.setAttribute('placeholder',r); });
    }
  }catch(e){ console.warn('[i18n]',e); }
  busy=false;
}
function ensureSwitch(){
  var host=document.getElementById('topbarActions'); if(!host||document.getElementById('xLang')) return;
  var s=document.createElement('select'); s.id='xLang'; s.title='Language'; s.setAttribute('data-notr','1');
  s.style.cssText='padding:5px 8px;border:1px solid var(--border);border-radius:8px;font-size:12.5px;background:#fff;color:var(--ink);margin-right:8px;cursor:pointer';
  s.innerHTML=Object.keys(LABEL).map(function(k){ return '<option value="'+k+'"'+(k===lang?' selected':'')+'>'+LABEL[k]+'</option>'; }).join('');
  s.onchange=function(){ I.set(s.value); };
  host.insertBefore(s,host.firstChild);
}
I.set=function(l){
  if(!LABEL[l]) return; var was=lang; lang=l; I.lang=l; try{ localStorage.setItem('dsa_lang',l); }catch(e){}
  document.documentElement.lang=l==='en'?'en':l;
  if(was!=='en'||l==='en'){ if(typeof render==='function'&&document.getElementById('app')) render(); } // redraw in English first, then translate
  var sw=document.getElementById('xLang'); if(sw) sw.value=l; setTimeout(run,30);
};
function schedule(){ clearTimeout(timer); timer=setTimeout(run,60); }
function boot(){
  document.documentElement.lang=lang==='en'?'en':lang;
  try{ new MutationObserver(function(){ if(!busy) schedule(); }).observe(document.body,{childList:true,subtree:true}); }catch(e){}
  run();
}
if(document.body) boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
