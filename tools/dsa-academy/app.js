/* =========================================================================
   Dr. Shreyansh Academy — Platform
   ---------------------------------------------------------------------
   DEMO MODE vs LIVE MODE: if firebase-config.js has a real config, this
   runs on real Firebase Auth + Firestore ("Live Mode"). Otherwise it runs
   entirely in memory ("Demo Mode") so the product can be clicked through
   with zero setup. Every Firebase call is guarded by window.FIREBASE_ENABLED.
   ========================================================================= */

const DATA = window.DSA_DATA;
const SUBJECTS = ['Physics','Chemistry','Biology'];
const SUBJECT_META = {
  Physics:  {icon:'⚛️', color:'var(--navy-700)', bg:'var(--paper-2)'},
  Chemistry:{icon:'🧪', color:'var(--green-600)', bg:'var(--green-100)'},
  Biology:  {icon:'🧬', color:'var(--gold-600)', bg:'var(--gold-100)'}
};

function chaptersFor(subject){
  return Object.keys(DATA.titles[subject] || {}).map(Number).sort((a,b)=>a-b);
}
function totalQCount(subject, chapter){
  const secs = (DATA.questions[subject] && DATA.questions[subject][chapter]) || {};
  return Object.values(secs).reduce((a,b)=>a+b.length,0);
}
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}
function formatWhen(w){
  if(!w) return '—';
  if(typeof w === 'string') return w;
  if(w.toDate) return w.toDate().toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  return '—';
}

/* demo leaderboard seed so the feature is visible even with one real user */
const DEMO_LEADERBOARD = [
  {name:'Ishaan Verma', pct:92, subject:'Full Mock', when:'Yesterday'},
  {name:'Priya Nair', pct:88, subject:'Chemistry · Ch.2', when:'2 days ago'},
  {name:'Rohan Gupta', pct:85, subject:'Full Mock', when:'3 days ago'},
  {name:'Sara Khan', pct:81, subject:'Physics · Ch.4', when:'3 days ago'},
  {name:'Aditya Rao', pct:77, subject:'Biology · Ch.1', when:'4 days ago'},
];

/* ---------------- in-memory "backend" (swap for Firebase) -------------- */
const DB = {
  currentUser: null, // {role, name, email, uid, plan, bookmarks:[]}
  results: [],
  linkedChild: null,
  demoChild: {name:'Aarav Patel', email:'aarav.patel@student.dsa'},
  doubts: [],          // demo-mode doubts store
  leaderboardCache: null,
};

let ROUTE = {view:'landing', params:{}};

/* ============================== ROUTER ================================ */
function go(view, params={}){
  ROUTE = {view, params};
  if(view==='leaderboard') DB.leaderboardCache = DB.leaderboardCache; // no reset, loaded lazily
  render();
  window.scrollTo({top:0,behavior:'instant'});
}
function scrollToId(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth'});
}
function toast(msg, icon='✓'){
  const host = document.getElementById('toastHost');
  const t = document.createElement('div');
  t.className='toast';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  host.appendChild(t);
  setTimeout(()=>t.remove(), 2600);
}

/* ============================== RENDER ================================ */
function render(){
  const app = document.getElementById('app');
  const actions = document.getElementById('topbarActions');
  const publicNav = document.getElementById('publicNav');

  if(DB.currentUser){
    publicNav.classList.add('hidden');
    actions.innerHTML = `
      <span class="pill pill-navy" style="margin-right:4px">${DB.currentUser.role.toUpperCase()}</span>
      ${DB.currentUser.role==='student' ? `<span class="pill ${DB.currentUser.plan==='premium'?'pill-gold':'pill-navy'}" style="margin-right:4px">${DB.currentUser.plan==='premium'?'★ PREMIUM':'FREE'}</span>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="logout()">Log out</button>`;
  } else {
    publicNav.classList.remove('hidden');
    actions.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="go('auth',{role:'student'})">Log in</button>
      <button class="btn btn-primary btn-sm" onclick="go('auth',{role:'student',mode:'signup'})">Start free</button>`;
  }

  const routes = {
    landing: renderLanding,
    auth: renderAuth,
    student: renderStudentDashboard,
    subject: renderSubjectChapters,
    chapter: renderChapter,
    test: renderTest,
    result: renderResult,
    parent: renderParentDashboard,
    admin: renderAdminDashboard,
    adminstudent: renderAdminStudentDetail,
    myfees: renderMyFees,
    adminfaculty: renderAdminFaculty,
    adminfacultydetail: renderAdminFacultyDetail,
    adminparents: renderAdminParents,
    mock: renderMock,
    leaderboard: renderLeaderboard,
    progress: renderProgress,
    doubts: renderDoubts,
    admindoubts: renderAdminDoubts,
    bookmarks: renderBookmarks,
    plans: renderPlans,
    facultydoubts: renderFacultyDoubts,
    facultypending: renderFacultyPending,
    completeProfile: renderCompleteProfile,
    myprofile: renderMyProfile,
  };
  app.innerHTML = (routes[ROUTE.view] || renderLanding)();
  afterRender();
}

function afterRender(){
  if(ROUTE.view==='test' && ROUTE.params._justStarted){
    ROUTE.params._justStarted = false;
    startTimer();
  }
}

/* ============================== SIDEBAR / NAV ============================ */
const NAV = {
  student: [
    {id:'overview', ic:'🏠', label:'Dashboard', view:'student'},
    {id:'mock', ic:'🧪', label:'Full Mock Test', view:'mock'},
    {id:'leaderboard', ic:'🏆', label:'Leaderboard', view:'leaderboard'},
    {id:'progress', ic:'📈', label:'My Progress', view:'progress'},
    {id:'doubts', ic:'💬', label:'Ask a Doubt', view:'doubts'},
    {id:'bookmarks', ic:'⭐', label:'Bookmarks', view:'bookmarks'},
    {id:'plans', ic:'💎', label:'Plans', view:'plans'},
    {id:'myfees', ic:'💳', label:'My Fees', view:'myfees'},
    {id:'myprofile', ic:'👤', label:'My Profile', view:'myprofile'},
  ],
  parent: [
    {id:'overview', ic:'🏠', label:'Overview', view:'parent'},
  ],
  admin: [
    {id:'overview', ic:'🏠', label:'Overview', view:'admin'},
    {id:'admindoubts', ic:'💬', label:'Doubts inbox', view:'admindoubts'},
    {id:'adminfaculty', ic:'🎓', label:'Manage Faculty', view:'adminfaculty'},
    {id:'adminparents', ic:'👪', label:'Parent Accounts', view:'adminparents'},
  ],
  faculty: [
    {id:'facultydoubts', ic:'💬', label:'Doubts inbox', view:'facultydoubts'},
    {id:'myprofile', ic:'👤', label:'My Profile', view:'myprofile'},
  ],
};
function sidebar(activeId){
  const u = DB.currentUser;
  const initials = (u.name||'?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const items = NAV[u.role] || [];
  return `
  <div class="sidebar">
    <div class="side-user">
      <div class="side-avatar">${initials}</div>
      <div><b>${u.name}</b><span>${u.email}</span></div>
    </div>
    <div class="side-nav">
      ${items.map(x=>`<button class="side-link ${x.id===activeId?'active':''}" onclick="go('${x.view}')"><span class="ic">${x.ic}</span>${x.label}</button>`).join('')}
      <button class="side-link" onclick="go('landing')"><span class="ic">←</span>Back to site</button>
      <button class="side-link" onclick="logout()"><span class="ic">⎋</span>Log out</button>
    </div>
  </div>`;
}

/* ============================== LANDING ================================ */
function questionDeckCards(){
  return SUBJECTS.map(s=>{
    const q = DATA.questions[s][1]['DPP-1'][0];
    const meta = SUBJECT_META[s];
    return {subject:s, meta, q};
  });
}
function totalPlatformQuestions(){ let n=0; SUBJECTS.forEach(s=>chaptersFor(s).forEach(ch=>n+=totalQCount(s,ch))); return n; }
function totalPlatformChapters(){ let n=0; SUBJECTS.forEach(s=>n+=chaptersFor(s).length); return n; }

function renderLanding(){
  return `
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="container hero-grid">
      <div>
        <div class="hero-eyebrow"><span class="pill pill-green">● Built on real NCERT-mapped content</span></div>
        <h1>Dream it. <em>Study it.</em><br>Crack NEET &amp; JEE.</h1>
        <p class="lead">Chapter notes with diagrams, DPPs, full mock exams, doubt-solving and a live leaderboard — with a dedicated view for parents.</p>
        <div class="hero-cta">
          <button class="btn btn-gold" onclick="go('auth',{role:'student',mode:'signup'})">Start as a Student →</button>
          <button class="btn btn-outline" onclick="go('auth',{role:'parent'})">I'm a Parent</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><b>${totalPlatformChapters()}</b><span>Chapters live</span></div>
          <div class="hero-stat"><b>${totalPlatformQuestions()}</b><span>Questions ready</span></div>
          <div class="hero-stat"><b>0</b><span>Downloads allowed</span></div>
        </div>
      </div>
      <div class="deck-wrap" id="deckWrap"></div>
    </div>
  </section>

  <section class="section" id="subjects">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Class 11 · Live now</span>
        <h2>Full chapters unlocked — not just a trial</h2>
        <p>Every chapter has Master Notes with original diagrams, 3-level DPPs and a full Chapter Test, auto-graded with explanations.</p>
      </div>
      <div class="subject-grid">
        ${SUBJECTS.map(s=>{
          const meta = SUBJECT_META[s];
          const chapters = chaptersFor(s);
          const total = chapters.reduce((a,ch)=>a+totalQCount(s,ch),0);
          return `
          <div class="card subject-card" onclick="go('auth',{role:'student'})">
            <div class="subject-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div>
            <h3>${s}</h3>
            <p>${chapters.length} chapters · ${DATA.titles[s][chapters[0]]} → ${DATA.titles[s][chapters[chapters.length-1]]}</p>
            <div class="subject-meta">
              <span class="pill pill-navy">${total} MCQs</span>
              <span class="pill pill-green">${chapters.length} chapters unlocked</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="how" style="background:var(--paper-2)">
    <div class="container">
      <div class="section-head"><span class="eyebrow">The daily loop</span><h2>Same progression toppers actually use</h2></div>
      <div class="steps">
        <div class="card step"><div class="num">01</div><h4>Read Master Notes</h4><p>Protected on-screen reader with original diagrams.</p></div>
        <div class="card step"><div class="num">02</div><h4>DPP-1 → DPP-3</h4><p>Basic to advanced, difficulty ramps like a real prep cycle.</p></div>
        <div class="card step"><div class="num">03</div><h4>Chapter Test</h4><p>NEET-pattern marking (+4/−1), timed, auto-graded with explanations.</p></div>
        <div class="card step"><div class="num">04</div><h4>Full Mock Test</h4><p>Combined Physics + Chemistry + Biology exam, exactly like exam day.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="features">
    <div class="container">
      <div class="section-head"><span class="eyebrow">Everything a coaching institute needs</span><h2>One platform, three roles</h2></div>
      <div class="feat-grid">
        <div class="card feat"><div class="ic">🎓</div><h4>Student workspace</h4><p>Chapters, DPPs, tests, full mock exams, instant results with explanations.</p></div>
        <div class="card feat"><div class="ic">👪</div><h4>Parent view</h4><p>Read-only dashboard linked to their child's account — every attempt, score and trend.</p></div>
        <div class="card feat"><div class="ic">🛠️</div><h4>Admin control</h4><p>Students, content library, and a doubts inbox to answer directly.</p></div>
        <div class="card feat"><div class="ic">💬</div><h4>Doubt-solving</h4><p>Students post a doubt against any chapter; admin replies from a dedicated inbox.</p></div>
        <div class="card feat"><div class="ic">🏆</div><h4>Leaderboard</h4><p>Top scores across the academy, so students see where they stand.</p></div>
        <div class="card feat"><div class="ic">📈</div><h4>Weak-topic analytics</h4><p>Every wrong answer rolls up into a per-chapter weak-area report.</p></div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="brand"><img src="DSA_LOGO.png" alt="DSA"> Dr. Shreyansh Academy</div>
      <p style="margin-top:10px">Dream · Focus · Study · Success.</p>
      <div class="footer-cols"><span>© Dr. Shreyansh Academy</span><span>${window.FIREBASE_ENABLED ? '🟢 Live Mode' : '⚡ Demo Mode'}</span></div>
    </div>
  </footer>`;
}

let deckTimer=null, deckIndex=0;
function mountDeck(){
  const wrap = document.getElementById('deckWrap');
  if(!wrap) return;
  clearInterval(deckTimer);
  const cards = questionDeckCards();
  function paint(){
    const cur = cards[deckIndex % cards.length];
    wrap.innerHTML = `
      <div class="deck-card behind"></div>
      <div class="deck-card front" id="deckFront">
        <div class="deck-top">
          <span class="deck-subject" style="color:${cur.meta.color}">${cur.meta.icon} ${cur.subject} · Ch.1 DPP-1</span>
          <span class="deck-timer">⏱ Live</span>
        </div>
        <div class="deck-q">${cur.q.text}</div>
        <div class="deck-opts" id="deckOpts">
          ${cur.q.options.map((o,i)=>`<div class="deck-opt" data-i="${i}"><b>${String.fromCharCode(65+i)}</b><span>${o}</span></div>`).join('')}
        </div>
        <div class="deck-foot"><span>D1-Q1 · DPP-1 (Basic)</span><span>NEET pattern</span></div>
      </div>`;
    setTimeout(()=>{
      const opts = wrap.querySelectorAll('.deck-opt');
      if(opts[cur.q.correctIndex]) opts[cur.q.correctIndex].classList.add('correct');
    }, 900);
  }
  paint();
  deckTimer = setInterval(()=>{ deckIndex++; paint(); }, 3600);
}

/* ============================== AUTH =================================== */
function renderAuth(){
  const role = ROUTE.params.role || 'student';
  const mode = ROUTE.params.mode || 'login';
  const roleLabels = {student:'Student', parent:'Parent', admin:'Admin', faculty:'Faculty'};
  return `
  <div class="auth-wrap">
    <div class="card auth-card">
      <div style="text-align:center;margin-bottom:18px">
        <img src="DSA_LOGO.png" style="width:52px;height:52px;margin:0 auto 10px;border-radius:12px">
        <h2 style="font-size:20px">${mode==='signup'?'Create your account':'Welcome back'}</h2>
      </div>
      <div class="role-tabs">
        ${['student','parent','admin','faculty'].map(r=>`<button class="role-tab ${r===role?'active':''}" onclick="go('auth',{role:'${r}',mode:'${mode}'})">${roleLabels[r]}</button>`).join('')}
      </div>
      <form onsubmit="return handleAuth(event,'${role}')">
        ${mode==='signup'?`<div class="field"><label>Full name</label><input required id="authName" placeholder="Your name"></div>`:''}
        ${mode==='signup' && role==='student'?`<div class="field"><label>Class</label><select id="authClass"><option>11th</option><option>12th</option><option>Dropper</option></select></div>`:''}
        ${mode==='signup' && role==='parent'?`<div class="field"><label>Child's registered email</label><input required id="authChildEmail" placeholder="child@dsa.academy"></div>`:''}
        ${mode==='signup' && role==='faculty'?`<div class="field"><label>Subject you teach</label><select id="authSubject">${SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select></div>`:''}
        <div class="field"><label>Email</label><input required type="email" id="authEmail" placeholder="you@example.com" value="${ROUTE.params.prefillEmail || ''}"></div>
        <div class="field"><label>Password</label><input required type="password" id="authPass" placeholder="••••••••" minlength="6"></div>
        ${mode==='login' ? `<div style="text-align:right;margin:-6px 0 4px"><a onclick="sendPasswordReset()" style="font-size:12.5px;color:var(--green-600);font-weight:700;cursor:pointer">Forgot password?</a></div>` : ''}
        <button class="btn btn-primary btn-block" type="submit">${mode==='signup'?'Create account':'Log in'} →</button>
      </form>
      ${window.FIREBASE_ENABLED ? `
      <div style="display:flex;align-items:center;gap:10px;margin:16px 0 14px">
        <div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:11.5px;color:var(--faint)">OR</span><div style="flex:1;height:1px;background:var(--border)"></div>
      </div>
      <button type="button" class="btn btn-outline btn-block" onclick="signInWithGoogle('${role}')" style="gap:10px">
        <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.4-4.6 2.2-7.7 2.2-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C39.9 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
        Continue with Google
      </button>` : ''}
      <div class="auth-switch">
        ${mode==='signup'
          ? `Already have an account? <a onclick="go('auth',{role:'${role}',mode:'login'})">Log in</a>`
          : `New here? <a onclick="go('auth',{role:'${role}',mode:'signup'})">Create an account</a>`}
      </div>
      <div class="demo-note">${window.FIREBASE_ENABLED
        ? `🟢 <b>Live Mode:</b> Connected to Firebase — real accounts, real saved results.`
        : `⚡ <b>Demo Mode:</b> Firebase isn't connected yet, so any email + password works and takes you straight into the ${roleLabels[role]} dashboard.`}</div>
      ${ROUTE.params.prefillEmail ? `<div class="demo-note" style="margin-top:8px">🔗 Signed in via K Spider — enter your DSA admin password to continue.</div>` : ''}
    </div>
  </div>`;
}

function sendPasswordReset(){
  if(!window.FIREBASE_ENABLED){ toast('Connect Firebase to use password reset','⚠️'); return; }
  const email = (document.getElementById('authEmail').value||'').trim();
  if(!email){ toast('Enter your email above first, then click Forgot password','⚠️'); return; }
  fbAuth.sendPasswordResetEmail(email)
    .then(()=>toast(`Password reset link sent to ${email} 📧`))
    .catch(err=>toast(err.message,'⚠️'));
}

function handleAuth(e, role){
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  const mode = ROUTE.params.mode || 'login';
  const nameField = document.getElementById('authName');
  const name = nameField ? nameField.value.trim() : email.split('@')[0];
  const classField = document.getElementById('authClass');
  const cls = classField ? classField.value : null;
  const childEmailField = document.getElementById('authChildEmail');
  const childEmail = childEmailField ? childEmailField.value.trim() : null;
  const subjectField = document.getElementById('authSubject');
  const facultySubject = subjectField ? subjectField.value : null;

  if(!window.FIREBASE_ENABLED){
    DB.currentUser = {role, name: name || 'Student', email, uid: null, plan: 'free', bookmarks: [], subject: facultySubject, approved:true};
    toast(`Signed in as ${role} (demo)`);
    enterDashboard(role);
    return false;
  }

  const submitBtn = e.target.querySelector('button[type=submit]');
  if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Please wait…'; }

  const afterAuth = (userCred) => {
    const uid = userCred.user.uid;
    if(mode === 'signup'){
      const profile = {name, email, role, plan:'free', bookmarks:[], createdAt: firebase.firestore.FieldValue.serverTimestamp()};
      if(role==='student') profile.cls = cls;
      if(role==='parent') profile.childEmail = childEmail;
      if(role==='faculty'){ profile.subject = facultySubject; profile.approved = false; }
      return fbDb.collection('users').doc(uid).set(profile).then(()=>({...profile, uid}));
    }
    return fbDb.collection('users').doc(uid).get().then(doc=>{
      if(!doc.exists) throw new Error('No profile found for this account — please sign up first.');
      return {...doc.data(), uid};
    });
  };

  const authCall = mode==='signup'
    ? fbAuth.createUserWithEmailAndPassword(email, pass)
    : fbAuth.signInWithEmailAndPassword(email, pass);

  authCall
    .then(afterAuth)
    .then(profile=>{
      if(profile.banned){
        fbAuth.signOut();
        toast('This account has been suspended — contact your admin.', '🚫');
        return;
      }
      DB.currentUser = {
        role: profile.role || role, name: profile.name || name, email,
        uid: profile.uid, plan: profile.plan || 'free', bookmarks: profile.bookmarks || [],
        subject: profile.subject || null, approved: profile.approved !== false,
        feeTotal: profile.feeTotal||0, feePaid: profile.feePaid||0,
        feeDueDate: profile.feeDueDate||null, feeHistory: profile.feeHistory||[],
        adminNote: profile.adminNote||null,
        phone: profile.phone||'', dob: profile.dob||'', address: profile.address||'',
        parentName: profile.parentName||'', parentPhone: profile.parentPhone||'', previousSchool: profile.previousSchool||'',
        qualification: profile.qualification||'', experienceYears: profile.experienceYears||'', bio: profile.bio||''
      };
      toast(`Signed in as ${DB.currentUser.role}`);
      if(role==='student') loadStudentResults().then(()=>enterDashboard(role));
      else if(role==='parent'){ DB.linkedChild = profile.childEmail ? {name:profile.childEmail.split('@')[0], email:profile.childEmail} : null; loadParentResults().then(()=>enterDashboard(role)); }
      else if(role==='faculty' && !DB.currentUser.approved) go('facultypending');
      else enterDashboard(role);
    })
    .catch(err=>{ toast(err.message || 'Something went wrong, please try again', '⚠️'); })
    .finally(()=>{ if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = (mode==='signup'?'Create account':'Log in') + ' →'; } });

  return false;
}

function signInWithGoogle(role){
  if(!window.FIREBASE_ENABLED){ toast('Connect Firebase to use Google Sign-In','⚠️'); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(provider).then(result=>{
    const user = result.user;
    const uid = user.uid;
    return fbDb.collection('users').doc(uid).get().then(doc=>{
      if(doc.exists) return {profile: doc.data(), isNew:false};
      const profile = {
        name: user.displayName || 'User', email: user.email, role,
        plan:'free', bookmarks:[], createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if(role==='faculty') profile.approved = false;
      return fbDb.collection('users').doc(uid).set(profile).then(()=>({profile, isNew:true}));
    });
  }).then(({profile, isNew})=>{
    if(profile.banned){ fbAuth.signOut(); toast('This account has been suspended — contact your admin.', '🚫'); return; }
    DB.currentUser = {
      role: profile.role || role, name: profile.name, email: profile.email,
      uid: fbAuth.currentUser.uid, plan: profile.plan||'free', bookmarks: profile.bookmarks||[],
      subject: profile.subject||null, approved: profile.approved !== false,
      feeTotal: profile.feeTotal||0, feePaid: profile.feePaid||0,
      feeDueDate: profile.feeDueDate||null, feeHistory: profile.feeHistory||[],
      adminNote: profile.adminNote||null
    };
    toast(`Signed in as ${DB.currentUser.role}`);
    if(isNew && DB.currentUser.role==='faculty'){ go('completeProfile',{need:'subject'}); return; }
    if(isNew && DB.currentUser.role==='parent'){ go('completeProfile',{need:'childEmail'}); return; }
    if(DB.currentUser.role==='student') loadStudentResults().then(()=>enterDashboard(DB.currentUser.role));
    else if(DB.currentUser.role==='parent'){ DB.linkedChild = profile.childEmail ? {name:profile.childEmail.split('@')[0], email:profile.childEmail} : null; loadParentResults().then(()=>enterDashboard(DB.currentUser.role)); }
    else if(DB.currentUser.role==='faculty' && !DB.currentUser.approved) go('facultypending');
    else enterDashboard(DB.currentUser.role);
  }).catch(err=>{ if(err.code!=='auth/popup-closed-by-user') toast(err.message,'⚠️'); });
}

function renderCompleteProfile(){
  if(!DB.currentUser) return renderAuth();
  const need = ROUTE.params.need;
  return `
  <div class="auth-wrap">
    <div class="card auth-card">
      <div style="text-align:center;margin-bottom:18px">
        <img src="DSA_LOGO.png" style="width:52px;height:52px;margin:0 auto 10px;border-radius:12px">
        <h2 style="font-size:20px">Just one more thing</h2>
      </div>
      <form onsubmit="return submitCompleteProfile(event,'${need}')">
        ${need==='subject' ? `<div class="field"><label>Subject you teach</label><select id="completeSubject">${SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select></div>` : ''}
        ${need==='childEmail' ? `<div class="field"><label>Child's registered email</label><input required id="completeChildEmail" placeholder="child@dsa.academy"></div>` : ''}
        <button class="btn btn-primary btn-block" type="submit">Continue →</button>
      </form>
    </div>
  </div>`;
}
function submitCompleteProfile(e, need){
  e.preventDefault();
  const uid = DB.currentUser.uid;
  if(need==='subject'){
    const subject = document.getElementById('completeSubject').value;
    fbDb.collection('users').doc(uid).update({subject}).then(()=>{
      DB.currentUser.subject = subject;
      go('facultypending');
    }).catch(err=>toast(err.message,'⚠️'));
  } else if(need==='childEmail'){
    const childEmail = document.getElementById('completeChildEmail').value.trim();
    fbDb.collection('users').doc(uid).update({childEmail}).then(()=>{
      DB.linkedChild = {name:childEmail.split('@')[0], email:childEmail};
      loadParentResults().then(()=>enterDashboard('parent'));
    }).catch(err=>toast(err.message,'⚠️'));
  }
  return false;
}

function enterDashboard(role){
  if(role==='student') go('student');
  else if(role==='parent') go('parent');
  else if(role==='faculty') go('facultydoubts');
  else go('admin');
}
function loadStudentResults(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve();
  return fbDb.collection('testResults').where('email','==',DB.currentUser.email).get()
    .then(snap=>{ DB.results = snap.docs.map(d=>d.data()); })
    .catch(err=>console.error('[DSA] could not load results', err));
}
function loadParentResults(){
  if(!window.FIREBASE_ENABLED || !DB.linkedChild) return Promise.resolve();
  return fbDb.collection('testResults').where('email','==',DB.linkedChild.email).get()
    .then(snap=>{ DB.results = snap.docs.map(d=>d.data()); })
    .catch(err=>console.error('[DSA] could not load child results', err));
}
function logout(){
  if(window.FIREBASE_ENABLED && window.fbAuth) fbAuth.signOut();
  DB.currentUser = null; DB.results = []; DB.linkedChild = null; DB.leaderboardCache = null;
  go('landing');
}

/* ============================== STUDENT DASHBOARD ======================= */
function renderMyProfile(){
  if(!DB.currentUser) return renderAuth();
  const u = DB.currentUser;
  const isFaculty = u.role==='faculty';
  return `
  <div class="app-shell">
    ${sidebar('myprofile')}
    <div class="main" style="max-width:640px">
      <div class="main-head"><div><h2>👤 My Profile</h2><p>Keep your details up to date — admin can see this too</p></div></div>
      ${u.adminNote ? `<div class="card" style="padding:14px 18px;margin-bottom:18px;background:var(--gold-100);border-color:var(--gold-500)"><b>📢 Message from Admin:</b> ${u.adminNote}</div>` : ''}
      <div class="card" style="padding:24px">
        <form onsubmit="return saveMyProfile(event)">
          <div class="field"><label>Full name</label><input id="profName" value="${u.name||''}" required></div>
          <div class="field"><label>Email</label><input value="${u.email||''}" disabled style="background:var(--paper-2);color:var(--muted)"></div>
          <div class="field"><label>Phone number</label><input id="profPhone" value="${u.phone||''}" placeholder="10-digit mobile number"></div>
          ${isFaculty ? `
          <div class="field"><label>Subject you teach</label><input value="${u.subject||''}" disabled style="background:var(--paper-2);color:var(--muted)"></div>
          <div class="field"><label>Qualification</label><input id="profQualification" value="${u.qualification||''}" placeholder="e.g. M.Sc Physics, B.Ed"></div>
          <div class="field"><label>Years of experience</label><input id="profExperience" type="number" value="${u.experienceYears||''}" placeholder="e.g. 5"></div>
          <div class="field"><label>Short bio</label><input id="profBio" value="${u.bio||''}" placeholder="A line about your teaching style"></div>
          ` : `
          <div class="field"><label>Date of birth</label><input id="profDob" type="date" value="${u.dob||''}"></div>
          <div class="field"><label>Address</label><input id="profAddress" value="${u.address||''}" placeholder="City, State"></div>
          <div class="field"><label>Previous school</label><input id="profSchool" value="${u.previousSchool||''}" placeholder="Last attended school"></div>
          <div class="field"><label>Parent's name</label><input id="profParentName" value="${u.parentName||''}"></div>
          <div class="field"><label>Parent's phone</label><input id="profParentPhone" value="${u.parentPhone||''}" placeholder="10-digit mobile number"></div>
          `}
          <button class="btn btn-primary btn-block" type="submit">Save profile</button>
        </form>
      </div>
    </div>
  </div>`;
}
function saveMyProfile(e){
  e.preventDefault();
  const u = DB.currentUser;
  const updates = {
    name: document.getElementById('profName').value.trim(),
    phone: document.getElementById('profPhone').value.trim(),
  };
  if(u.role==='faculty'){
    updates.qualification = document.getElementById('profQualification').value.trim();
    updates.experienceYears = document.getElementById('profExperience').value;
    updates.bio = document.getElementById('profBio').value.trim();
  } else {
    updates.dob = document.getElementById('profDob').value;
    updates.address = document.getElementById('profAddress').value.trim();
    updates.previousSchool = document.getElementById('profSchool').value.trim();
    updates.parentName = document.getElementById('profParentName').value.trim();
    updates.parentPhone = document.getElementById('profParentPhone').value.trim();
  }
  if(!window.FIREBASE_ENABLED || !u.uid){
    Object.assign(DB.currentUser, updates);
    toast('Profile saved (demo)');
    render();
    return false;
  }
  fbDb.collection('users').doc(u.uid).update(updates).then(()=>{
    Object.assign(DB.currentUser, updates);
    toast('Profile saved ✅');
    render();
  }).catch(err=>toast(err.message,'⚠️'));
  return false;
}

function renderMyFees(){
  if(!DB.currentUser) return renderAuth();
  const u = DB.currentUser;
  const due = Math.max(0, (u.feeTotal||0) - (u.feePaid||0));
  const history = u.feeHistory || [];
  return `
  <div class="app-shell">
    ${sidebar('myfees')}
    <div class="main" style="max-width:820px">
      <div class="main-head"><div><h2>💳 My Fees</h2><p>Read-only — contact the academy admin for any changes</p></div></div>
      <div class="stat-row">
        <div class="card stat-box"><b>₹${u.feeTotal||0}</b><span>Total fees</span></div>
        <div class="card stat-box"><b>₹${u.feePaid||0}</b><span>Paid so far</span></div>
        <div class="card stat-box"><b style="color:${due>0?'var(--red-600)':'var(--green-600)'}">₹${due}</b><span>Remaining</span></div>
        <div class="card stat-box"><b>${u.feeDueDate||'—'}</b><span>Due date</span></div>
      </div>
      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Payment history</h3>
        ${history.length===0 ? `<div class="empty"><div class="ic">💳</div>No fee record yet — this fills in once the academy sets up your fee plan.</div>` : `
        <table class="table-simple"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Note</th></tr></thead><tbody>
        ${history.slice().reverse().map(h=>`<tr><td>${h.when}</td><td style="color:${h.amount<0?'var(--gold-600)':'var(--green-600)'}"><b>${h.amount<0?'-':''}₹${Math.abs(h.amount)}</b></td><td>${h.method}</td><td>${h.note||'—'}</td></tr>`).join('')}
        </tbody></table>`}
      </div>
    </div>
  </div>`;
}

function renderStudentDashboard(){
  if(!DB.currentUser) return renderAuth();
  const u = DB.currentUser;
  const myResults = DB.results;
  const avg = myResults.length ? Math.round(myResults.reduce((a,r)=>a+r.pct,0)/myResults.length) : null;

  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main">
      <div class="main-head">
        <div><h2>Welcome back, ${u.name.split(' ')[0]}</h2><p>Class 11 · Pick a subject to continue where you left off</p></div>
      </div>
      ${u.adminNote ? `<div class="card" style="padding:14px 18px;margin-bottom:18px;background:var(--gold-100);border-color:var(--gold-500)"><b>📢 Message from Admin:</b> ${u.adminNote}</div>` : ''}
      <div class="stat-row">
        <div class="card stat-box"><b>${myResults.length}</b><span>Tests attempted</span></div>
        <div class="card stat-box"><b>${avg===null?'—':avg+'%'}</b><span>Average score</span></div>
        <div class="card stat-box"><b>${totalPlatformChapters()}</b><span>Chapters unlocked</span></div>
        <div class="card stat-box"><b>${totalPlatformQuestions()}</b><span>Questions available</span></div>
      </div>

      <div class="subject-grid" style="margin-bottom:30px">
        ${SUBJECTS.map(s=>{
          const meta = SUBJECT_META[s];
          const chapters = chaptersFor(s);
          return `<div class="card subject-card" onclick="go('subject',{subject:'${s}'})">
            <div class="subject-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div>
            <h3>${s}</h3><p>${chapters.length} chapters ready</p>
            <div class="subject-meta"><span class="pill pill-green">Ch. ${chapters.join(', ')}</span></div>
          </div>`;
        }).join('')}
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="font-size:15px">🧪 Full Syllabus Mock Test</h3>
          <span class="pill pill-gold">Premium</span>
        </div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">45 questions across all three subjects, NEET pattern (+4/−1), one continuous exam.</p>
        <button class="btn btn-gold btn-sm" onclick="go('mock')">Go to Mock Test →</button>
      </div>

      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Recent attempts</h3>
        ${myResults.length===0 ? `<div class="empty"><div class="ic">🗒️</div>Nothing attempted yet — open a subject above and try a DPP.</div>` : `
        <table class="table-simple"><thead><tr><th>Test</th><th>Score</th><th>Accuracy</th><th>When</th></tr></thead><tbody>
        ${myResults.slice().reverse().map(r=>`<tr><td>${r.subject}${r.chapter?' · Ch.'+r.chapter:''} · ${r.section}</td><td>${r.score}/${r.max}</td><td>${r.pct}%</td><td>${formatWhen(r.when)}</td></tr>`).join('')}
        </tbody></table>`}
      </div>
    </div>
  </div>`;
}

/* ============================== SUBJECT → CHAPTER LIST =================== */
function renderSubjectChapters(){
  if(!DB.currentUser) return renderAuth();
  const subject = ROUTE.params.subject || 'Physics';
  const meta = SUBJECT_META[subject];
  const chapters = chaptersFor(subject);
  const myResults = DB.results.filter(r=>r.subject===subject);

  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main">
      <div class="main-head">
        <div>
          <span class="pill pill-navy" style="margin-bottom:8px;display:inline-flex">${meta.icon} ${subject}</span>
          <h2>${subject} — Chapters</h2>
          <p>${chapters.length} chapters unlocked for Class 11</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="go('student')">← All subjects</button>
      </div>
      ${chapters.map(ch=>{
        const done = myResults.filter(r=>Number(r.chapter)===ch && r.section==='Chapter Test').length>0;
        const key = subject+'-'+ch;
        const marked = (DB.currentUser.bookmarks||[]).includes(key);
        return `
        <div class="chapter-row">
          <div class="l" style="cursor:pointer" onclick="go('chapter',{subject:'${subject}',chapter:${ch}})">
            <div class="chapter-badge">${ch}</div>
            <div><h4>${DATA.titles[subject][ch]}</h4><span>${totalQCount(subject,ch)} questions · Notes + 3 DPPs + Chapter Test</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="toggleBookmark('${subject}',${ch})" title="Bookmark">${marked?'⭐':'☆'}</button>
            <span class="pill ${done?'pill-green':'pill-navy'}" style="cursor:pointer" onclick="go('chapter',{subject:'${subject}',chapter:${ch}})">${done?'Test attempted ✓':'Open →'}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ============================== CHAPTER VIEW ============================ */
function renderChapter(){
  if(!DB.currentUser) return renderAuth();
  const subject = ROUTE.params.subject || 'Physics';
  const chapter = Number(ROUTE.params.chapter || 1);
  const tab = ROUTE.params.tab || 'notes';
  const meta = SUBJECT_META[subject];
  const sections = DATA.questions[subject][chapter];
  const chapters = chaptersFor(subject);
  const idx = chapters.indexOf(chapter);
  const prevCh = idx>0 ? chapters[idx-1] : null;
  const nextCh = idx<chapters.length-1 ? chapters[idx+1] : null;

  const tabs = [
    {id:'notes', label:'Master Notes'},
    {id:'DPP-1', label:'DPP-1 · Basic'},
    {id:'DPP-2', label:'DPP-2 · Intermediate'},
    {id:'DPP-3', label:'DPP-3 · Advanced'},
    {id:'Chapter Test', label:'Chapter Test'},
  ];

  let body = '';
  if(tab==='notes'){
    body = renderNotesReader(subject, chapter);
  } else {
    const sec = sections[tab];
    body = `
      <div class="card" style="padding:26px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="font-size:17px">${tab}</h3>
          <span class="pill pill-navy">${sec.length} questions</span>
        </div>
        <p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">
          ${tab==='Chapter Test' ? 'Full chapter test · NEET pattern marking (+4 / −1) · Timed.' : "Practice set — attempt it as a timed run, palette on the right tracks what you've answered."}
        </p>
        <button class="btn btn-primary" onclick="startChapterTest('${subject}',${chapter},'${tab}')">Start ${tab} →</button>
      </div>`;
  }

  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main">
      <div class="main-head">
        <div>
          <span class="pill pill-navy" style="margin-bottom:8px;display:inline-flex">${meta.icon} ${subject} · Chapter ${chapter}</span>
          <h2>${DATA.titles[subject][chapter]}</h2>
          <p>${DATA.units[subject][chapter]}</p>
        </div>
        <div style="display:flex;gap:8px">
          ${prevCh?`<button class="btn btn-outline btn-sm" onclick="go('chapter',{subject:'${subject}',chapter:${prevCh}})">← Ch.${prevCh}</button>`:''}
          ${nextCh?`<button class="btn btn-outline btn-sm" onclick="go('chapter',{subject:'${subject}',chapter:${nextCh}})">Ch.${nextCh} →</button>`:''}
          <button class="btn btn-outline btn-sm" onclick="go('subject',{subject:'${subject}'})">All chapters</button>
        </div>
      </div>
      <div class="tabs">
        ${tabs.map(t=>`<button class="tab-btn ${t.id===tab?'active':''}" onclick="go('chapter',{subject:'${subject}',chapter:${chapter},tab:'${t.id}'})">${t.label}</button>`).join('')}
      </div>
      ${body}
    </div>
  </div>`;
}

function renderNotesReader(subject, chapter){
  const blocks = DATA.notes[subject][chapter];
  const u = DB.currentUser;
  const wm = Array.from({length:24}).map((_,i)=>{
    const top = (i%6)*18+2, left = Math.floor(i/6)*26+2;
    return `<span style="top:${top}%;left:${left}%">${u.email} · DSA</span>`;
  }).join('');
  const html = blocks.map(b=>{
    if(b.type==='h1') return `<h2>${b.text.replace(/^\s*\d+\s*/,'')}</h2>`;
    if(b.type==='h2') return `<h3>${b.text}</h3>`;
    if(b.type==='li') return `<li>${b.text}</li>`;
    if(b.type==='img') return `<div class="notes-img-wrap"><img src="${b.src}" alt="diagram" draggable="false" oncontextmenu="return false"></div>`;
    return `<p>${b.text}</p>`;
  }).join('');
  return `
    <div class="protect-banner">🔒 View-only reader — selection, copy, dragging, printing and downloading are disabled on this page.</div>
    <div class="card" style="position:relative;overflow:hidden">
      <div class="watermark-layer">${wm}</div>
      <div class="notes-reader" oncontextmenu="return false" onselectstart="return false">${html}</div>
    </div>`;
}

/* ============================== TEST ENGINE (chapter + mock share this) == */
let TEST_STATE = null;
let TEST_TIME_LEFT = 0;
let TEST_TIMER_HANDLE = null;

function startChapterTest(subject, chapter, section){
  const qs = DATA.questions[subject][chapter][section];
  const perQ = section==='Chapter Test' ? 60 : 45;
  TEST_STATE = {
    mode:'chapter', subject, chapter, section,
    questions: qs,
    answers: Array(qs.length).fill(null),
    marked: Array(qs.length).fill(false),
    current: 0, submitted: false,
  };
  TEST_TIME_LEFT = qs.length * perQ;
  go('test', {_justStarted:true});
}

function buildMockQuestions(){
  let all = [];
  SUBJECTS.forEach(s=>{
    let pool = [];
    chaptersFor(s).forEach(ch=>{
      const ct = (DATA.questions[s][ch] && DATA.questions[s][ch]['Chapter Test']) || [];
      ct.forEach(q=>pool.push(Object.assign({}, q, {subject:s, chapter:ch})));
    });
    shuffle(pool);
    all = all.concat(pool.slice(0,15));
  });
  return shuffle(all);
}
function startMockTest(){
  const qs = buildMockQuestions();
  TEST_STATE = {
    mode:'mock', subject:'Full Mock', chapter:null, section:'Full Syllabus Mock Test',
    questions: qs,
    answers: Array(qs.length).fill(null),
    marked: Array(qs.length).fill(false),
    current: 0, submitted: false,
  };
  TEST_TIME_LEFT = qs.length * 60;
  go('test', {_justStarted:true});
}

function renderTest(){
  if(!DB.currentUser) return renderAuth();
  if(!TEST_STATE) return renderStudentDashboard();
  const qs = TEST_STATE.questions;
  const i = TEST_STATE.current;
  const q = qs[i];
  const chosen = TEST_STATE.answers[i];
  const headerLabel = TEST_STATE.mode==='mock' ? 'Full Syllabus Mock Test' : `${TEST_STATE.subject} · Ch.${TEST_STATE.chapter} · ${TEST_STATE.section}`;
  const qMeta = TEST_STATE.mode==='mock' ? `<span class="pill pill-navy" style="margin-bottom:8px;display:inline-block">${q.subject} · Ch.${q.chapter}</span><br>` : '';

  return `
  <div class="app-shell">
    ${sidebar(TEST_STATE.mode==='mock'?'mock':'overview')}
    <div class="main" style="max-width:1040px">
      <div class="card test-head">
        <h3>${headerLabel}</h3>
        <div class="test-timer" id="testTimer">⏱ --:--</div>
      </div>
      <div class="test-shell">
        <div>
          <div class="card q-card">
            <div class="q-tag">Question ${i+1} of ${qs.length}</div>
            ${qMeta}
            <div class="q-text">${q.text}</div>
            <div class="opt-list">
              ${q.options.map((o,oi)=>`
                <div class="opt-row ${chosen===oi?'selected':''}" onclick="selectAnswer(${oi})">
                  <span class="opt-letter">${String.fromCharCode(65+oi)}</span><span>${o}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="q-nav">
            <button class="btn btn-outline btn-sm" ${i===0?'disabled':''} onclick="navQuestion(-1)">← Previous</button>
            <button class="btn btn-ghost btn-sm" onclick="toggleMark()">${TEST_STATE.marked[i]?'★ Marked':'☆ Mark for review'}</button>
            ${i===qs.length-1
              ? `<button class="btn btn-gold btn-sm" onclick="submitTest()">Submit test ✓</button>`
              : `<button class="btn btn-primary btn-sm" onclick="navQuestion(1)">Next →</button>`}
          </div>
        </div>
        <div class="card palette">
          <h5>Question palette</h5>
          <div class="palette-grid">
            ${qs.map((_,qi)=>`<div class="pnum ${TEST_STATE.answers[qi]!==null?'answered':''} ${TEST_STATE.marked[qi]?'marked':''} ${qi===i?'current':''}" onclick="jumpQuestion(${qi})">${qi+1}</div>`).join('')}
          </div>
          <div class="palette-legend">
            <div><span class="dot" style="background:var(--green-600)"></span>Answered</div>
            <div><span class="dot" style="background:var(--gold-500)"></span>Marked for review</div>
            <div><span class="dot" style="background:#fff;border:1.5px solid var(--border)"></span>Not answered</div>
          </div>
          <button class="btn btn-outline btn-block btn-sm" onclick="submitTest()">Submit now</button>
        </div>
      </div>
    </div>
  </div>`;
}

function selectAnswer(oi){ TEST_STATE.answers[TEST_STATE.current] = oi; render(); }
function navQuestion(delta){ TEST_STATE.current = Math.max(0, TEST_STATE.current + delta); render(); }
function jumpQuestion(qi){ TEST_STATE.current = qi; render(); }
function toggleMark(){ TEST_STATE.marked[TEST_STATE.current] = !TEST_STATE.marked[TEST_STATE.current]; render(); }

function startTimer(){
  clearInterval(TEST_TIMER_HANDLE);
  TEST_TIMER_HANDLE = setInterval(()=>{
    TEST_TIME_LEFT--;
    const el = document.getElementById('testTimer');
    if(!el){ clearInterval(TEST_TIMER_HANDLE); return; }
    const m = Math.floor(TEST_TIME_LEFT/60), s = TEST_TIME_LEFT%60;
    el.textContent = `⏱ ${m}:${String(s).padStart(2,'0')}`;
    if(TEST_TIME_LEFT<=60) el.classList.add('low');
    if(TEST_TIME_LEFT<=0){ clearInterval(TEST_TIMER_HANDLE); submitTest(); }
  },1000);
}

function submitTest(){
  clearInterval(TEST_TIMER_HANDLE);
  const qs = TEST_STATE.questions;
  let correct=0, wrong=0, unattempted=0;
  const bySubject = {};
  qs.forEach((q,i)=>{
    const a = TEST_STATE.answers[i];
    const subj = q.subject || TEST_STATE.subject;
    bySubject[subj] = bySubject[subj] || {correct:0,wrong:0,unattempted:0,total:0};
    bySubject[subj].total++;
    if(a===null){ unattempted++; bySubject[subj].unattempted++; }
    else if(a===q.correctIndex){ correct++; bySubject[subj].correct++; }
    else { wrong++; bySubject[subj].wrong++; }
  });
  const isNEET = TEST_STATE.mode==='mock' || TEST_STATE.section==='Chapter Test';
  const score = isNEET ? (correct*4 - wrong*1) : correct;
  const max = isNEET ? qs.length*4 : qs.length;
  const pct = Math.max(0, Math.round((score/max)*100));

  const result = {
    mode: TEST_STATE.mode,
    subject: TEST_STATE.subject, chapter: TEST_STATE.chapter, section: TEST_STATE.section,
    email: DB.currentUser.email, name: DB.currentUser.name,
    correct, wrong, unattempted, total: qs.length, score, max, pct,
    bySubject, when: 'Just now'
  };
  DB.results.push(result);
  TEST_STATE.submitted = true;
  TEST_STATE.result = result;
  DB.leaderboardCache = null; // force refresh next visit

  if(window.FIREBASE_ENABLED){
    fbDb.collection('testResults').add(Object.assign({}, result, {when: firebase.firestore.FieldValue.serverTimestamp()}))
      .catch(err=>console.error('[DSA] could not save result', err));
  }
  go('result', {});
}

function renderResult(){
  if(!TEST_STATE || !TEST_STATE.submitted) return renderStudentDashboard();
  const qs = TEST_STATE.questions;
  const r = TEST_STATE.result;
  const headerLabel = TEST_STATE.mode==='mock' ? 'Full Syllabus Mock Test' : `${TEST_STATE.subject} · Ch.${TEST_STATE.chapter} · ${TEST_STATE.section}`;
  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main" style="max-width:900px">
      <div class="card result-hero">
        <span class="eyebrow">${headerLabel} · Result</span>
        <div class="score-ring" style="--pct:${r.pct}"><div class="score-ring-inner"><b>${r.pct}%</b><span>score</span></div></div>
        <h2 style="font-size:20px">${r.score} / ${r.max} marks</h2>
        <p style="color:var(--muted);font-size:13.5px;margin-top:6px">${r.correct} correct · ${r.wrong} wrong · ${r.unattempted} unattempted</p>
      </div>
      ${r.mode==='mock' ? `
      <div class="result-stats">
        ${Object.keys(r.bySubject).map(s=>{
          const b = r.bySubject[s];
          const p = Math.round((b.correct/b.total)*100);
          return `<div class="card"><b>${p}%</b><span>${s}</span></div>`;
        }).join('')}
      </div>` : `
      <div class="result-stats">
        <div class="card"><b>${r.correct}</b><span>Correct</span></div>
        <div class="card"><b>${r.wrong}</b><span>Wrong</span></div>
        <div class="card"><b>${r.unattempted}</b><span>Skipped</span></div>
        <div class="card"><b>${r.total}</b><span>Total Qs</span></div>
      </div>`}
      <div class="card" style="padding:22px">
        <h3 style="font-size:15px;margin-bottom:16px">Answer review</h3>
        ${qs.map((q,i)=>{
          const a = TEST_STATE.answers[i];
          return `
          <div style="margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid var(--border)">
            <div class="q-tag">Question ${i+1}${q.subject?' · '+q.subject+' Ch.'+q.chapter:''}</div>
            <div class="q-text" style="font-size:14.5px">${q.text}</div>
            ${q.options.map((o,oi)=>{
              let cls='opt-row';
              if(oi===q.correctIndex) cls+=' correct';
              else if(oi===a) cls+=' wrong';
              return `<div class="${cls}"><span class="opt-letter">${String.fromCharCode(65+oi)}</span><span>${o}</span></div>`;
            }).join('')}
            <div class="explain-box">💡 ${q.explanation||'—'}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:10px;margin-top:6px">
        <button class="btn btn-primary" onclick="go('student')">Dashboard</button>
        <button class="btn btn-outline" onclick="go('leaderboard')">View leaderboard</button>
      </div>
    </div>
  </div>`;
}

/* ============================== FULL MOCK TEST LANDING =================== */
function renderMock(){
  if(!DB.currentUser) return renderAuth();
  const isPremium = DB.currentUser.plan === 'premium';
  return `
  <div class="app-shell">
    ${sidebar('mock')}
    <div class="main" style="max-width:720px">
      <div class="main-head"><div><h2>Full Syllabus Mock Test</h2><p>One combined exam — Physics, Chemistry and Biology together</p></div></div>
      <div class="card" style="padding:30px">
        <div class="stat-row" style="margin-bottom:20px">
          <div class="card stat-box"><b>45</b><span>Questions</span></div>
          <div class="card stat-box"><b>45</b><span>Minutes</span></div>
          <div class="card stat-box"><b>+4/−1</b><span>NEET marking</span></div>
          <div class="card stat-box"><b>3</b><span>Subjects mixed</span></div>
        </div>
        <p style="font-size:13.5px;color:var(--muted);margin-bottom:20px">Pulls 15 questions from each subject's Chapter Test bank across every unlocked chapter, shuffled into one continuous NEET-pattern paper — the same experience as exam day.</p>
        ${isPremium
          ? `<button class="btn btn-gold btn-block" onclick="startMockTest()">Start Full Mock Test →</button>`
          : `<div class="pill pill-gold" style="margin-bottom:12px">★ Premium feature</div>
             <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Full mock tests are part of the Premium plan. Chapter-wise DPPs and Chapter Tests stay free, always.</p>
             <button class="btn btn-gold btn-block" onclick="go('plans')">Unlock with Premium →</button>`}
      </div>
    </div>
  </div>`;
}

/* ============================== LEADERBOARD ============================== */
function loadLeaderboard(){
  if(!window.FIREBASE_ENABLED){
    const mine = DB.results.map(r=>({name:DB.currentUser.name, pct:r.pct, subject: r.mode==='mock'?'Full Mock':`${r.subject} · Ch.${r.chapter}`, when: formatWhen(r.when)}));
    return Promise.resolve(DEMO_LEADERBOARD.concat(mine).sort((a,b)=>b.pct-a.pct).slice(0,15));
  }
  return fbDb.collection('testResults').orderBy('pct','desc').limit(15).get()
    .then(snap=>snap.docs.map(d=>{
      const x = d.data();
      return {name:x.name, pct:x.pct, subject: x.mode==='mock'?'Full Mock':`${x.subject} · Ch.${x.chapter}`, when: formatWhen(x.when)};
    }))
    .catch(()=>DEMO_LEADERBOARD);
}
function renderLeaderboard(){
  if(!DB.currentUser) return renderAuth();
  if(!DB.leaderboardCache){
    loadLeaderboard().then(rows=>{ DB.leaderboardCache = rows; if(ROUTE.view==='leaderboard') render(); });
    return `<div class="app-shell">${sidebar('leaderboard')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading leaderboard…</div></div></div>`;
  }
  const rows = DB.leaderboardCache;
  return `
  <div class="app-shell">
    ${sidebar('leaderboard')}
    <div class="main">
      <div class="main-head"><div><h2>🏆 Leaderboard</h2><p>${window.FIREBASE_ENABLED ? 'Top scores across the academy' : 'Demo leaderboard — connect Firebase for real cross-student ranking'}</p></div></div>
      <div class="card" style="padding:10px 0">
        <table class="table-simple"><thead><tr><th>#</th><th>Name</th><th>Test</th><th>Score</th><th>When</th></tr></thead><tbody>
        ${rows.map((r,i)=>`<tr><td style="font-family:var(--font-mono)">${i+1}</td><td style="display:flex;align-items:center;gap:8px"><span class="avatar-sm">${(r.name||'?')[0]}</span>${r.name}</td><td>${r.subject}</td><td><b>${r.pct}%</b></td><td>${r.when}</td></tr>`).join('')}
        </tbody></table>
      </div>
      ${!window.FIREBASE_ENABLED ? `<div class="demo-note" style="margin-top:16px">🏆 Live Mode ranks every real student by their actual Firestore results — this demo blends a few sample names with your own attempts so the feature is visible now.</div>`:''}
    </div>
  </div>`;
}

/* ============================== PROGRESS / WEAK TOPICS ==================== */
function renderProgress(){
  if(!DB.currentUser) return renderAuth();
  const results = DB.results;
  const weak = {};
  results.forEach(r=>{
    const key = r.mode==='mock' ? null : `${r.subject} · Ch.${r.chapter}`;
    if(key){ weak[key] = weak[key] || {wrong:0,total:0}; weak[key].wrong += r.wrong; weak[key].total += r.total; }
    if(r.bySubject){
      Object.keys(r.bySubject).forEach(s=>{
        // mock breakdown doesn't carry chapter, skip chapter-level attribution for mock
      });
    }
  });
  const weakList = Object.keys(weak).map(k=>({label:k, wrong:weak[k].wrong, total:weak[k].total, rate: Math.round((weak[k].wrong/weak[k].total)*100)}))
    .sort((a,b)=>b.rate-a.rate).slice(0,5);

  const bySubjectAvg = {};
  SUBJECTS.forEach(s=>{
    const rs = results.filter(r=>r.subject===s);
    bySubjectAvg[s] = rs.length ? Math.round(rs.reduce((a,r)=>a+r.pct,0)/rs.length) : null;
  });

  const distinctDays = window.FIREBASE_ENABLED
    ? new Set(results.map(r=>formatWhen(r.when).split(',')[0])).size
    : null;

  return `
  <div class="app-shell">
    ${sidebar('progress')}
    <div class="main">
      <div class="main-head"><div><h2>📈 My Progress</h2><p>Weak-topic report generated from your actual test attempts</p></div></div>

      <div class="stat-row">
        ${SUBJECTS.map(s=>`<div class="card stat-box"><b>${bySubjectAvg[s]===null?'—':bySubjectAvg[s]+'%'}</b><span>${s} average</span></div>`).join('')}
        <div class="card stat-box"><b>${distinctDays===null?'—':distinctDays}</b><span>Active days${window.FIREBASE_ENABLED?'':' (Live Mode only)'}</span></div>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Weakest chapters</h3>
        ${weakList.length===0 ? `<div class="empty"><div class="ic">✅</div>No weak areas flagged yet — attempt a few DPPs and this fills in automatically.</div>` : `
        <table class="table-simple"><thead><tr><th>Chapter</th><th>Wrong / Total</th><th>Error rate</th></tr></thead><tbody>
        ${weakList.map(w=>`<tr><td>${w.label}</td><td>${w.wrong} / ${w.total}</td><td><b style="color:${w.rate>50?'var(--red-600)':'var(--gold-600)'}">${w.rate}%</b></td></tr>`).join('')}
        </tbody></table>`}
      </div>

      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">🔔 Daily study reminder</h3>
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Turns on browser notifications reminding you to open a DPP. Works while this tab/app is installed — true reminders even when the app is fully closed need one more step on our end (noted below).</p>
        <button class="btn btn-outline btn-sm" onclick="enableDailyReminder()">Enable reminder</button>
      </div>
    </div>
  </div>`;
}

function enableDailyReminder(){
  if(!('Notification' in window)){ toast('Notifications are not supported in this browser', '⚠️'); return; }
  Notification.requestPermission().then(perm=>{
    if(perm==='granted'){
      new Notification('Dr. Shreyansh Academy', {body:"Reminders are on — we'll nudge you to keep your streak going!"});
      toast('Daily reminder enabled');
    } else {
      toast('Notification permission was not granted', '⚠️');
    }
  });
}

/* ============================== DOUBTS (STUDENT) ========================== */
function loadDoubts(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve(DB.doubts.filter(d=>d.email===DB.currentUser.email));
  return fbDb.collection('doubts').where('email','==',DB.currentUser.email).get()
    .then(snap=>snap.docs.map(d=>Object.assign({id:d.id}, d.data())))
    .catch(()=>[]);
}
function renderDoubts(){
  if(!DB.currentUser) return renderAuth();
  if(!DB._doubtsCache){
    loadDoubts().then(rows=>{ DB._doubtsCache = rows; if(ROUTE.view==='doubts') render(); });
    return `<div class="app-shell">${sidebar('doubts')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading your doubts…</div></div></div>`;
  }
  const rows = DB._doubtsCache;
  const subject = ROUTE.params.subject || 'Physics';
  const chapters = chaptersFor(subject);

  return `
  <div class="app-shell">
    ${sidebar('doubts')}
    <div class="main">
      <div class="main-head"><div><h2>💬 Ask a Doubt</h2><p>Post a question against any chapter — an admin/teacher will reply here</p></div></div>
      <div class="card" style="padding:22px;margin-bottom:20px">
        <form onsubmit="return submitDoubt(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Subject</label>
              <select id="doubtSubject" onchange="go('doubts',{subject:this.value})">
                ${SUBJECTS.map(s=>`<option ${s===subject?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="field"><label>Chapter</label>
              <select id="doubtChapter">${chapters.map(ch=>`<option value="${ch}">Ch.${ch} — ${DATA.titles[subject][ch]}</option>`).join('')}</select>
            </div>
          </div>
          <div class="field"><label>Your question</label>
            <input required id="doubtText" placeholder="Type your doubt here...">
          </div>
          <button class="btn btn-primary btn-sm" type="submit">Post doubt →</button>
        </form>
      </div>
      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Your doubts</h3>
        ${rows.length===0 ? `<div class="empty"><div class="ic">💬</div>No doubts posted yet.</div>` : rows.slice().reverse().map(d=>`
          <div style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span class="pill pill-navy">${d.subject} · Ch.${d.chapter}</span>
              <span class="pill ${d.status==='answered'?'pill-green':'pill-gold'}">${d.status==='answered'?'Answered':'Pending'}</span>
            </div>
            <p style="font-size:14px;margin-bottom:6px"><b>Q:</b> ${d.question}</p>
            ${d.aiAnswer ? `<div style="font-size:13px;color:var(--navy-800);background:var(--gold-100);padding:10px 12px;border-radius:9px;margin-bottom:8px"><b>🤖 Instant AI answer</b> <span style="color:var(--faint);font-weight:400">(unverified — your faculty will confirm below)</span><br>${d.aiAnswer}</div>` : ''}
            ${d.answer ? `<p style="font-size:13.5px;color:var(--navy-800);background:var(--paper-2);padding:10px 12px;border-radius:9px">💡 <b>Faculty:</b> ${d.answer}</p>` : `<p style="font-size:12.5px;color:var(--faint)">Waiting for a faculty reply…</p>`}
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}
function submitDoubt(e){
  e.preventDefault();
  const subject = document.getElementById('doubtSubject').value;
  const chapter = Number(document.getElementById('doubtChapter').value);
  const question = document.getElementById('doubtText').value.trim();
  if(!question) return false;
  const doubt = {email:DB.currentUser.email, name:DB.currentUser.name, subject, chapter, question, answer:null, aiAnswer:null, status:'pending', when:'Just now'};

  if(window.FIREBASE_ENABLED){
    fbDb.collection('doubts').add(Object.assign({}, doubt, {when: firebase.firestore.FieldValue.serverTimestamp()}))
      .then(ref=>{
        const localDoubt = Object.assign({id:ref.id}, doubt);
        DB._doubtsCache.push(localDoubt);
        render();
        notifyFacultyOfNewDoubt(doubt);
        fetchAIAnswer(subject, chapter, question).then(aiText=>{
          if(!aiText) return;
          fbDb.collection('doubts').doc(ref.id).update({aiAnswer: aiText}).catch(()=>{});
          localDoubt.aiAnswer = aiText;
          if(ROUTE.view==='doubts') render();
        });
      })
      .catch(err=>toast(err.message,'⚠️'));
  } else {
    doubt.id = 'demo-'+Date.now();
    DB.doubts.push(doubt);
    DB._doubtsCache = DB.doubts.filter(d=>d.email===DB.currentUser.email);
    render();
    notifyFacultyOfNewDoubt(doubt);
    fetchAIAnswer(subject, chapter, question).then(aiText=>{
      if(!aiText) return;
      doubt.aiAnswer = aiText;
      if(ROUTE.view==='doubts') render();
    });
  }
  toast('Doubt posted — getting an instant AI answer, and notifying the subject faculty');
  return false;
}

/* ============================== EMAIL NOTIFICATIONS (EmailJS) =============
   No backend needed — EmailJS sends mail straight from the browser using a
   public key + template. Wire your credentials in emailjs-config.js; until
   then these calls are safely no-ops (checked via window.EMAILJS_ENABLED).
   ========================================================================= */
/* ============================== AI DOUBT ASSISTANT =========================
   Instant, unverified AI answer while the human faculty reply is pending —
   uses the same KSpider AI proxy the rest of the platform already relies
   on, so no new API key or backend is needed here.
   ========================================================================= */
function fetchAIAnswer(subject, chapter, question){
  const chapterTitle = (DATA.titles[subject] && DATA.titles[subject][chapter]) || '';
  const prompt = `You are a NEET/JEE tutor helping a Class 11 student. Subject: ${subject}, Chapter ${chapter} (${chapterTitle}). The student's doubt: "${question}". Give a clear, exam-focused answer in simple language, under 130 words. No preamble, start straight with the explanation.`;
  return fetch('https://ks-api-proxy.kspiderai.workers.dev/v1/messages', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{role:'user', content: prompt}]
    })
  })
    .then(res=>res.json())
    .then(data=>{
      const blocks = (data && data.content) || [];
      const text = blocks.map(b=>b.text).filter(Boolean).join('\n').trim();
      return text || null;
    })
    .catch(err=>{ console.warn('[DSA] AI doubt answer failed', err); return null; });
}

function notifyFacultyOfNewDoubt(doubt){
  if(!window.EMAILJS_ENABLED || !window.FIREBASE_ENABLED) return;
  fbDb.collection('users').where('role','==','faculty').where('subject','==',doubt.subject).get()
    .then(snap=>{
      snap.forEach(docSnap=>{
        const faculty = docSnap.data();
        if(!faculty.email) return;
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateDoubtPosted, {
          to_email: faculty.email,
          faculty_name: faculty.name || 'Faculty',
          student_name: doubt.name,
          subject: doubt.subject,
          chapter: doubt.chapter,
          question: doubt.question
        }).catch(err=>console.warn('[DSA] faculty email notify failed', err));
      });
    }).catch(err=>console.warn('[DSA] could not look up faculty for notify', err));
}
function notifyStudentOfReply(doubt){
  if(!window.EMAILJS_ENABLED) return;
  emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateDoubtAnswered, {
    to_email: doubt.email,
    student_name: doubt.name,
    subject: doubt.subject,
    chapter: doubt.chapter,
    question: doubt.question,
    answer: doubt.answer
  }).catch(err=>console.warn('[DSA] student email notify failed', err));
}

/* ============================== DOUBTS (ADMIN INBOX) ====================== */
function loadAllDoubts(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve(DB.doubts.slice());
  return fbDb.collection('doubts').orderBy('when','desc').limit(50).get()
    .then(snap=>snap.docs.map(d=>Object.assign({id:d.id}, d.data())))
    .catch(()=>[]);
}
function renderAdminDoubts(){
  if(!DB.currentUser) return renderAuth();
  if(!DB._adminDoubtsCache){
    loadAllDoubts().then(rows=>{ DB._adminDoubtsCache = rows; if(ROUTE.view==='admindoubts') render(); });
    return `<div class="app-shell">${sidebar('admindoubts')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading doubts inbox…</div></div></div>`;
  }
  const rows = DB._adminDoubtsCache;
  const pending = rows.filter(d=>d.status!=='answered');
  const answered = rows.filter(d=>d.status==='answered');
  return `
  <div class="app-shell">
    ${sidebar('admindoubts')}
    <div class="main">
      <div class="main-head"><div><h2>💬 Doubts inbox</h2><p>${pending.length} pending · ${answered.length} answered · all subjects</p></div></div>
      ${renderDoubtCards(rows, 'admin')}
    </div>
  </div>`;
}

/* ============================== DOUBTS (FACULTY, SUBJECT-SCOPED) ========== */
function loadFacultyDoubts(subject){
  if(!window.FIREBASE_ENABLED) return Promise.resolve(DB.doubts.filter(d=>d.subject===subject));
  return fbDb.collection('doubts').where('subject','==',subject).orderBy('when','desc').limit(50).get()
    .then(snap=>snap.docs.map(d=>Object.assign({id:d.id}, d.data())))
    .catch(()=>[]);
}
/* ============================== FACULTY APPROVAL (ADMIN) ================== */
function loadPendingFaculty(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve([]);
  return fbDb.collection('users').where('role','==','faculty').where('approved','==',false).get()
    .then(snap=>{ DB._adminLoadError=null; return snap.docs.map(d=>Object.assign({uid:d.id}, d.data())); })
    .catch(err=>{ console.error('[DSA] loadPendingFaculty failed:', err); DB._adminLoadError = err.message; return []; });
}
function approveFaculty(uid){
  fbDb.collection('users').doc(uid).update({approved:true})
    .then(()=>{
      DB._pendingFacultyCache = (DB._pendingFacultyCache||[]).filter(f=>f.uid!==uid);
      toast('Faculty approved ✅');
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}
function deactivateFaculty(uid){
  fbDb.collection('users').doc(uid).update({approved:false})
    .then(()=>{
      const f = (DB._allFacultyCache||[]).find(x=>x.uid===uid);
      if(f) f.approved = false;
      toast('Faculty deactivated');
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}
function reactivateFaculty(uid){
  fbDb.collection('users').doc(uid).update({approved:true})
    .then(()=>{
      const f = (DB._allFacultyCache||[]).find(x=>x.uid===uid);
      if(f) f.approved = true;
      toast('Faculty reactivated ✅');
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}
function loadAllFaculty(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve([]);
  return fbDb.collection('users').where('role','==','faculty').get()
    .then(snap=>{ DB._adminLoadError=null; return snap.docs.map(d=>Object.assign({uid:d.id}, d.data())); })
    .catch(err=>{ console.error('[DSA] loadAllFaculty failed:', err); DB._adminLoadError = err.message; return []; });
}
function renderAdminFaculty(){
  if(!DB.currentUser) return renderAuth();
  if(!DB._allFacultyCache){
    loadAllFaculty().then(rows=>{ DB._allFacultyCache = rows; if(ROUTE.view==='adminfaculty') render(); });
    return `<div class="app-shell">${sidebar('adminfaculty')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading faculty…</div></div></div>`;
  }
  const rows = DB._allFacultyCache;
  return `
  <div class="app-shell">
    ${sidebar('adminfaculty')}
    <div class="main">
      <div class="main-head"><div><h2>🎓 Manage Faculty</h2><p>${rows.length} faculty account${rows.length===1?'':'s'} across all subjects</p></div></div>
      <div class="card" style="padding:20px">
        ${!window.FIREBASE_ENABLED ? `<div class="empty"><div class="ic">🔌</div>Connect Firebase (Live Mode) to manage real faculty accounts.</div>` :
          rows.length===0 ? `<div class="empty"><div class="ic">📭</div>No faculty have signed up yet.</div>` : `
        <table class="table-simple"><thead><tr><th>Name</th><th>Subject</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map(f=>`<tr>
          <td style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="go('adminfacultydetail',{uid:'${f.uid}'})"><span class="avatar-sm">${(f.name||'?')[0]}</span>${f.name}<span style="color:var(--faint);font-size:12px">${f.email}</span></td>
          <td><span class="pill pill-navy">${(SUBJECT_META[f.subject]&&SUBJECT_META[f.subject].icon)||''} ${f.subject||'—'}</span></td>
          <td><span class="pill ${f.approved?'pill-green':'pill-gold'}">${f.approved?'Active':'Pending / Deactivated'}</span></td>
          <td style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="go('adminfacultydetail',{uid:'${f.uid}'})">View →</button>
            ${f.approved
              ? `<button class="btn btn-ghost btn-sm" style="color:var(--red-600)" onclick="deactivateFaculty('${f.uid}')">Deactivate</button>`
              : `<button class="btn btn-green btn-sm" onclick="reactivateFaculty('${f.uid}')">Approve →</button>`}
          </td>
        </tr>`).join('')}
        </tbody></table>`}
      </div>
    </div>
  </div>`;
}

function renderAdminFacultyDetail(){
  if(!DB.currentUser) return renderAuth();
  const uid = ROUTE.params.uid;
  if(!DB._facultyDetailCache || DB._facultyDetailCache.uid !== uid){
    DB._facultyDetailCache = null;
    fbDb.collection('users').doc(uid).get().then(doc=>{
      if(doc.exists) DB._facultyDetailCache = Object.assign({uid}, doc.data());
      render();
    }).catch(err=>toast(err.message,'⚠️'));
    return `<div class="app-shell">${sidebar('adminfaculty')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading faculty record…</div></div></div>`;
  }
  const f = DB._facultyDetailCache;
  if(!f) return `<div class="app-shell">${sidebar('adminfaculty')}<div class="main"><div class="empty"><div class="ic">❓</div>Faculty not found.</div></div></div>`;
  return `
  <div class="app-shell">
    ${sidebar('adminfaculty')}
    <div class="main">
      <div class="main-head">
        <div><h2>${f.name}</h2><p>${f.email} · ${f.subject||'—'}</p></div>
        <button class="btn btn-outline btn-sm" onclick="go('adminfaculty')">← All faculty</button>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:15px">Account status</h3>
          <span class="pill ${f.approved?'pill-green':'pill-gold'}">${f.approved?'✅ Active':'⏳ Pending / Deactivated'}</span>
        </div>
        ${f.approved
          ? `<button class="btn btn-outline btn-sm" style="border-color:var(--red-500);color:var(--red-600)" onclick="deactivateFaculty('${uid}')">Deactivate</button>`
          : `<button class="btn btn-green btn-sm" onclick="reactivateFaculty('${uid}')">Approve →</button>`}
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Profile details</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="field"><label>Phone</label><input id="adminFacPhone" value="${f.phone||''}" placeholder="Phone number"></div>
          <div class="field"><label>Subject</label><select id="adminFacSubject">${SUBJECTS.map(s=>`<option ${s===f.subject?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Qualification</label><input id="adminFacQualification" value="${f.qualification||''}"></div>
          <div class="field"><label>Years of experience</label><input id="adminFacExperience" type="number" value="${f.experienceYears||''}"></div>
        </div>
        <div class="field"><label>Bio</label><input id="adminFacBio" value="${f.bio||''}"></div>
        <button class="btn btn-outline btn-sm" onclick="saveAdminFacultyProfile('${uid}')">Save profile details</button>
      </div>

      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">📢 Direct instruction / message</h3>
        <p style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Shown to this faculty member on their dashboard.</p>
        <textarea id="adminFacNote" rows="3" style="width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;margin-bottom:12px" placeholder="e.g. Please clear pending doubts by tonight.">${f.adminNote||''}</textarea>
        <button class="btn btn-primary btn-sm" onclick="saveAdminFacultyNote('${uid}')">Send message</button>
      </div>
    </div>
  </div>`;
}
function saveAdminFacultyProfile(uid){
  const updates = {
    phone: document.getElementById('adminFacPhone').value.trim(),
    subject: document.getElementById('adminFacSubject').value,
    qualification: document.getElementById('adminFacQualification').value.trim(),
    experienceYears: document.getElementById('adminFacExperience').value,
    bio: document.getElementById('adminFacBio').value.trim(),
  };
  fbDb.collection('users').doc(uid).update(updates).then(()=>{
    Object.assign(DB._facultyDetailCache, updates);
    toast('Profile updated ✅');
    render();
  }).catch(err=>toast(err.message,'⚠️'));
}
function saveAdminFacultyNote(uid){
  const adminNote = document.getElementById('adminFacNote').value.trim();
  fbDb.collection('users').doc(uid).update({adminNote}).then(()=>{
    DB._facultyDetailCache.adminNote = adminNote;
    toast('Message sent ✅');
    render();
  }).catch(err=>toast(err.message,'⚠️'));
}

/* ============================== PARENT ACCOUNTS (ADMIN) ==================== */
function loadAllParents(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve([]);
  return fbDb.collection('users').where('role','==','parent').get()
    .then(snap=>{ DB._adminLoadError=null; return snap.docs.map(d=>Object.assign({uid:d.id}, d.data())); })
    .catch(err=>{ console.error('[DSA] loadAllParents failed:', err); DB._adminLoadError = err.message; return []; });
}
function renderAdminParents(){
  if(!DB.currentUser) return renderAuth();
  if(!DB._allParentsCache){
    loadAllParents().then(rows=>{ DB._allParentsCache = rows; if(ROUTE.view==='adminparents') render(); });
    return `<div class="app-shell">${sidebar('adminparents')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading parent accounts…</div></div></div>`;
  }
  const rows = DB._allParentsCache;
  return `
  <div class="app-shell">
    ${sidebar('adminparents')}
    <div class="main">
      <div class="main-head"><div><h2>👪 Parent Accounts</h2><p>${rows.length} parent account${rows.length===1?'':'s'} registered</p></div></div>
      <div class="card" style="padding:20px">
        ${!window.FIREBASE_ENABLED ? `<div class="empty"><div class="ic">🔌</div>Connect Firebase (Live Mode) to see real parent accounts.</div>` :
          rows.length===0 ? `<div class="empty"><div class="ic">📭</div>No parents have signed up yet.</div>` : `
        <table class="table-simple"><thead><tr><th>Parent</th><th>Linked child email</th></tr></thead><tbody>
        ${rows.map(p=>`<tr>
          <td style="display:flex;align-items:center;gap:10px"><span class="avatar-sm">${(p.name||'?')[0]}</span>${p.name}<span style="color:var(--faint);font-size:12px">${p.email}</span></td>
          <td>${p.childEmail || '<span style="color:var(--faint)">not set</span>'}</td>
        </tr>`).join('')}
        </tbody></table>`}
      </div>
    </div>
  </div>`;
}

/* ============================== STUDENTS TABLE: SEARCH + EXPORT ============= */
function filterStudentsTable(){
  const q = (document.getElementById('studentSearch').value||'').toLowerCase();
  const cls = document.getElementById('studentClassFilter').value;
  const status = document.getElementById('studentStatusFilter').value;
  document.querySelectorAll('#studentsTableBody tr').forEach(row=>{
    const matchesQ = !q || row.dataset.name.includes(q) || row.dataset.email.includes(q);
    const matchesCls = !cls || row.dataset.cls === cls;
    const matchesStatus = !status || row.dataset.status === status;
    row.style.display = (matchesQ && matchesCls && matchesStatus) ? '' : 'none';
  });
}
function exportStudentsCSV(){
  const students = DB._studentsCache || [];
  if(students.length===0){ toast('No students to export','⚠️'); return; }
  const header = ['Name','Email','Class','Plan','Fee Total','Fee Paid','Fee Due','Due Date','Status'];
  const rows = students.map(s=>{
    const due = Math.max(0,(s.feeTotal||0)-(s.feePaid||0));
    return [s.name, s.email, s.cls||'', s.plan||'free', s.feeTotal||0, s.feePaid||0, due, s.feeDueDate||'', s.banned?'Banned':'Active'];
  });
  const csv = [header].concat(rows).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dsa-students-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Students exported ✅');
}

/* ============================== STUDENT MANAGEMENT (ADMIN) ================
   Real registered students, individual full record, fee/payment ledger,
   and access control (ban/unban). Fees are recorded manually by admin —
   there is no live payment gateway wired up (see the Plans page note);
   this is a ledger for whatever fee collection process you already run
   (cash, UPI, bank transfer, etc.), not an automatic charge.
   ========================================================================= */
function loadAllStudents(){
  if(!window.FIREBASE_ENABLED) return Promise.resolve([]);
  return fbDb.collection('users').where('role','==','student').get()
    .then(snap=>{ DB._adminLoadError=null; return snap.docs.map(d=>Object.assign({uid:d.id}, d.data())); })
    .catch(err=>{ console.error('[DSA] loadAllStudents failed:', err); DB._adminLoadError = err.message; return []; });
}
function loadStudentFullRecord(uid){
  return fbDb.collection('users').doc(uid).get().then(doc=>{
    if(!doc.exists) return null;
    const student = Object.assign({uid}, doc.data());
    return Promise.all([
      fbDb.collection('testResults').where('email','==',student.email).get().then(s=>s.docs.map(d=>d.data())),
      fbDb.collection('doubts').where('email','==',student.email).get().then(s=>s.docs.map(d=>Object.assign({id:d.id},d.data())))
    ]).then(([results, doubts])=>{
      student._results = results;
      student._doubts = doubts;
      return student;
    });
  });
}
function banStudent(uid, banned){
  fbDb.collection('users').doc(uid).update({banned})
    .then(()=>{
      toast(banned ? 'Student banned 🚫' : 'Student access restored ✅');
      if(DB._studentDetailCache && DB._studentDetailCache.uid===uid) DB._studentDetailCache.banned = banned;
      if(DB._studentsCache){ const s = DB._studentsCache.find(x=>x.uid===uid); if(s) s.banned = banned; }
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}
function recordPayment(uid){
  const amountInput = document.getElementById('payAmount');
  const methodInput = document.getElementById('payMethod');
  const noteInput = document.getElementById('payNote');
  const amount = Number(amountInput.value);
  if(!amount || amount<=0){ toast('Enter a valid amount','⚠️'); return; }
  const entry = {amount, method: methodInput.value, note: (noteInput.value||'').trim(), when: new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})};
  const student = DB._studentDetailCache;
  const newPaid = (student.feePaid||0) + amount;
  const newHistory = (student.feeHistory||[]).concat([entry]);
  fbDb.collection('users').doc(uid).update({feePaid: newPaid, feeHistory: newHistory})
    .then(()=>{
      student.feePaid = newPaid;
      student.feeHistory = newHistory;
      toast('Payment recorded ✅');
      amountInput.value=''; noteInput.value='';
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}
function saveFeePlan(uid){
  const totalInput = document.getElementById('feeTotal');
  const dueInput = document.getElementById('feeDueDate');
  const total = Number(totalInput.value)||0;
  const dueDate = dueInput.value || null;
  fbDb.collection('users').doc(uid).update({feeTotal: total, feeDueDate: dueDate})
    .then(()=>{
      DB._studentDetailCache.feeTotal = total;
      DB._studentDetailCache.feeDueDate = dueDate;
      toast('Fee plan saved ✅');
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}
function refundStudent(uid){
  const amountInput = document.getElementById('refundAmount');
  const amount = Number(amountInput.value);
  if(!amount || amount<=0){ toast('Enter a valid refund amount','⚠️'); return; }
  const student = DB._studentDetailCache;
  const newPaid = Math.max(0, (student.feePaid||0) - amount);
  const entry = {amount:-amount, method:'refund', note:'Refund issued', when: new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})};
  const newHistory = (student.feeHistory||[]).concat([entry]);
  fbDb.collection('users').doc(uid).update({feePaid: newPaid, feeHistory: newHistory})
    .then(()=>{
      student.feePaid = newPaid;
      student.feeHistory = newHistory;
      toast('Refund recorded ✅');
      amountInput.value='';
      render();
    }).catch(err=>toast(err.message,'⚠️'));
}

function saveAdminStudentProfile(uid){
  const updates = {
    phone: document.getElementById('adminStuPhone').value.trim(),
    cls: document.getElementById('adminStuCls').value.trim(),
    dob: document.getElementById('adminStuDob').value,
    previousSchool: document.getElementById('adminStuSchool').value.trim(),
    address: document.getElementById('adminStuAddress').value.trim(),
    parentName: document.getElementById('adminStuParentName').value.trim(),
    parentPhone: document.getElementById('adminStuParentPhone').value.trim(),
  };
  fbDb.collection('users').doc(uid).update(updates).then(()=>{
    Object.assign(DB._studentDetailCache, updates);
    const s = (DB._studentsCache||[]).find(x=>x.uid===uid); if(s) Object.assign(s, updates);
    toast('Profile updated ✅');
    render();
  }).catch(err=>toast(err.message,'⚠️'));
}
function saveAdminStudentNote(uid){
  const adminNote = document.getElementById('adminStuNote').value.trim();
  fbDb.collection('users').doc(uid).update({adminNote}).then(()=>{
    DB._studentDetailCache.adminNote = adminNote;
    toast('Message sent ✅');
    render();
  }).catch(err=>toast(err.message,'⚠️'));
}

function renderAdminStudentDetail(){
  if(!DB.currentUser) return renderAuth();
  const uid = ROUTE.params.uid;
  if(!DB._studentDetailCache || DB._studentDetailCache.uid !== uid){
    DB._studentDetailCache = null;
    loadStudentFullRecord(uid).then(student=>{ DB._studentDetailCache = student; render(); });
    return `<div class="app-shell">${sidebar('overview')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading student record…</div></div></div>`;
  }
  const s = DB._studentDetailCache;
  if(!s) return `<div class="app-shell">${sidebar('overview')}<div class="main"><div class="empty"><div class="ic">❓</div>Student not found.</div></div></div>`;

  const due = Math.max(0, (s.feeTotal||0) - (s.feePaid||0));
  const avg = s._results.length ? Math.round(s._results.reduce((a,r)=>a+r.pct,0)/s._results.length) : null;
  const bySubject = {};
  SUBJECTS.forEach(sub=>{
    const rs = s._results.filter(r=>r.subject===sub);
    bySubject[sub] = rs.length ? Math.round(rs.reduce((a,r)=>a+r.pct,0)/rs.length) : null;
  });

  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main">
      <div class="main-head">
        <div><h2>${s.name}</h2><p>${s.email} · Class ${s.cls||'—'}</p></div>
        <button class="btn btn-outline btn-sm" onclick="go('admin')">← All students</button>
      </div>

      <div class="stat-row">
        <div class="card stat-box"><b>${s._results.length}</b><span>Tests attempted</span></div>
        <div class="card stat-box"><b>${avg===null?'—':avg+'%'}</b><span>Average score</span></div>
        <div class="card stat-box"><b>${s._doubts.length}</b><span>Doubts posted</span></div>
        <div class="card stat-box"><b>${due>0?'₹'+due:'₹0'}</b><span>Fees due</span></div>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Profile details</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="field"><label>Phone</label><input id="adminStuPhone" value="${s.phone||''}" placeholder="Phone number"></div>
          <div class="field"><label>Class</label><input id="adminStuCls" value="${s.cls||''}" placeholder="11th / 12th / Dropper"></div>
          <div class="field"><label>Date of birth</label><input id="adminStuDob" type="date" value="${s.dob||''}"></div>
          <div class="field"><label>Previous school</label><input id="adminStuSchool" value="${s.previousSchool||''}"></div>
          <div class="field"><label>Address</label><input id="adminStuAddress" value="${s.address||''}"></div>
          <div class="field"><label>Parent's name</label><input id="adminStuParentName" value="${s.parentName||''}"></div>
          <div class="field"><label>Parent's phone</label><input id="adminStuParentPhone" value="${s.parentPhone||''}"></div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="saveAdminStudentProfile('${uid}')">Save profile details</button>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">📢 Direct instruction / message</h3>
        <p style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Shown to this student at the top of their "My Profile" page.</p>
        <textarea id="adminStuNote" rows="3" style="width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;margin-bottom:12px" placeholder="e.g. Please submit your fee payment proof by Friday.">${s.adminNote||''}</textarea>
        <button class="btn btn-primary btn-sm" onclick="saveAdminStudentNote('${uid}')">Send message</button>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:15px">Account status</h3>
          <span class="pill ${s.banned?'pill-red':'pill-green'}">${s.banned?'🚫 Banned':'✅ Active'}</span>
        </div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">${s.banned ? 'This student cannot log in or access any content right now.' : 'This student has normal access to the platform.'}</p>
        ${s.banned
          ? `<button class="btn btn-green btn-sm" onclick="banStudent('${uid}',false)">Restore access</button>`
          : `<button class="btn btn-outline btn-sm" style="border-color:var(--red-500);color:var(--red-600)" onclick="banStudent('${uid}',true)">Ban this student</button>`}
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Subject-wise performance</h3>
        <div class="result-stats" style="margin:0">
          ${SUBJECTS.map(sub=>`<div class="card"><b>${bySubject[sub]===null?'—':bySubject[sub]+'%'}</b><span>${sub}</span></div>`).join('')}
        </div>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">💳 Fees &amp; payments</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div class="field"><label>Total fees (₹)</label><input type="number" id="feeTotal" value="${s.feeTotal||''}" placeholder="e.g. 25000"></div>
          <div class="field"><label>Due date</label><input type="date" id="feeDueDate" value="${s.feeDueDate||''}"></div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-bottom:20px" onclick="saveFeePlan('${uid}')">Save fee plan</button>

        <div class="stat-row" style="margin-bottom:18px">
          <div class="card stat-box"><b>₹${s.feeTotal||0}</b><span>Total</span></div>
          <div class="card stat-box"><b>₹${s.feePaid||0}</b><span>Paid</span></div>
          <div class="card stat-box"><b style="color:${due>0?'var(--red-600)':'var(--green-600)'}">₹${due}</b><span>Remaining</span></div>
          <div class="card stat-box"><b>${s.feeDueDate||'—'}</b><span>Due date</span></div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          <input type="number" id="payAmount" placeholder="Amount ₹" style="width:110px;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
          <select id="payMethod" style="padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Other</option></select>
          <input id="payNote" placeholder="Note (optional)" style="flex:1;min-width:140px;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
          <button class="btn btn-green btn-sm" onclick="recordPayment('${uid}')">Record payment</button>
        </div>

        <div style="display:flex;gap:10px;align-items:center;margin-bottom:20px;padding-top:14px;border-top:1px dashed var(--border)">
          <input type="number" id="refundAmount" placeholder="Refund amount ₹" style="width:150px;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
          <button class="btn btn-outline btn-sm" style="border-color:var(--gold-500);color:var(--gold-600)" onclick="refundStudent('${uid}')">Issue refund</button>
        </div>

        <h4 style="font-size:13px;margin-bottom:10px;color:var(--muted)">Payment history</h4>
        ${(s.feeHistory||[]).length===0 ? `<p style="font-size:13px;color:var(--faint)">No payments recorded yet.</p>` : `
        <table class="table-simple"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Note</th></tr></thead><tbody>
        ${s.feeHistory.slice().reverse().map(h=>`<tr><td>${h.when}</td><td style="color:${h.amount<0?'var(--gold-600)':'var(--green-600)'}"><b>${h.amount<0?'-':''}₹${Math.abs(h.amount)}</b></td><td>${h.method}</td><td>${h.note||'—'}</td></tr>`).join('')}
        </tbody></table>`}
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Test history</h3>
        ${s._results.length===0 ? `<p style="font-size:13px;color:var(--muted)">No attempts yet.</p>` : `
        <table class="table-simple"><thead><tr><th>Test</th><th>Score</th><th>Accuracy</th></tr></thead><tbody>
        ${s._results.slice().reverse().map(r=>`<tr><td>${r.subject}${r.chapter?' · Ch.'+r.chapter:''} · ${r.section}</td><td>${r.score}/${r.max}</td><td>${r.pct}%</td></tr>`).join('')}
        </tbody></table>`}
      </div>

      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Doubts posted</h3>
        ${s._doubts.length===0 ? `<p style="font-size:13px;color:var(--muted)">No doubts posted yet.</p>` : s._doubts.map(d=>`
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span class="pill pill-navy">${d.subject} · Ch.${d.chapter}</span>
              <span class="pill ${d.status==='answered'?'pill-green':'pill-gold'}">${d.status==='answered'?'Answered':'Pending'}</span>
            </div>
            <p style="font-size:13.5px">${d.question}</p>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function renderFacultyPending(){
  if(!DB.currentUser) return renderAuth();
  return `
  <div class="auth-wrap">
    <div class="card auth-card" style="text-align:center">
      <div style="font-size:38px;margin-bottom:10px">⏳</div>
      <h2 style="font-size:19px;margin-bottom:10px">Waiting for admin approval</h2>
      <p style="font-size:13.5px;color:var(--muted);margin-bottom:18px">Your faculty account for <b>${DB.currentUser.subject}</b> has been created but needs to be approved by a DSA admin before you can see or reply to doubts. This usually only takes a short while — check back soon.</p>
      <button class="btn btn-outline btn-block" onclick="logout()">Log out</button>
    </div>
  </div>`;
}
function renderFacultyDoubts(){
  if(!DB.currentUser) return renderAuth();
  if(!DB.currentUser.approved) return renderFacultyPending();
  const subject = DB.currentUser.subject;
  if(!subject){
    return `<div class="app-shell">${sidebar('facultydoubts')}<div class="main"><div class="empty"><div class="ic">⚠️</div>No subject set on your faculty account — please contact the admin.</div></div></div>`;
  }
  if(!DB._facultyDoubtsCache){
    loadFacultyDoubts(subject).then(rows=>{ DB._facultyDoubtsCache = rows; if(ROUTE.view==='facultydoubts') render(); });
    return `<div class="app-shell">${sidebar('facultydoubts')}<div class="main"><div class="empty"><div class="ic">⏳</div>Loading your doubts inbox…</div></div></div>`;
  }
  const rows = DB._facultyDoubtsCache;
  const pending = rows.filter(d=>d.status!=='answered');
  const answered = rows.filter(d=>d.status==='answered');
  return `
  <div class="app-shell">
    ${sidebar('facultydoubts')}
    <div class="main">
      <div class="main-head"><div><h2>${SUBJECT_META[subject].icon} ${subject} — Doubts inbox</h2><p>${pending.length} pending · ${answered.length} answered</p></div></div>
      ${DB.currentUser.adminNote ? `<div class="card" style="padding:14px 18px;margin-bottom:18px;background:var(--gold-100);border-color:var(--gold-500)"><b>📢 Message from Admin:</b> ${DB.currentUser.adminNote}</div>` : ''}
      ${renderDoubtCards(rows, 'faculty')}
    </div>
  </div>`;
}

function renderDoubtCards(rows, mode){
  if(rows.length===0) return `<div class="card"><div class="empty"><div class="ic">📭</div>No doubts here yet.</div></div>`;
  return rows.slice().reverse().map(d=>{
    const waText = encodeURIComponent(`New doubt on Dr. Shreyansh Academy\nSubject: ${d.subject} · Ch.${d.chapter}\nStudent: ${d.name}\nQ: ${d.question}${d.answer?`\nA: ${d.answer}`:''}`);
    return `
    <div class="card" style="padding:18px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px"><span class="avatar-sm">${(d.name||'?')[0]}</span><b style="font-size:13.5px">${d.name}</b><span class="pill pill-navy">${d.subject} · Ch.${d.chapter}</span></div>
        <div style="display:flex;align-items:center;gap:6px">
          <a href="https://wa.me/?text=${waText}" target="_blank" title="Forward this doubt via WhatsApp" style="text-decoration:none;font-size:16px">📱</a>
          <span class="pill ${d.status==='answered'?'pill-green':'pill-gold'}">${d.status==='answered'?'Answered':'Pending'}</span>
        </div>
      </div>
      <p style="font-size:14px;margin-bottom:10px"><b>Q:</b> ${d.question}</p>
      ${d.aiAnswer ? `<div style="font-size:13px;color:var(--navy-800);background:var(--gold-100);padding:10px 12px;border-radius:9px;margin-bottom:8px"><b>🤖 Instant AI answer</b> <span style="color:var(--faint);font-weight:400">(unverified — human reply below confirms it)</span><br>${d.aiAnswer}</div>` : ''}
      ${d.answer ? `<p style="font-size:13.5px;color:var(--navy-800);background:var(--paper-2);padding:10px 12px;border-radius:9px;margin-bottom:8px">💡 <b>Faculty:</b> ${d.answer}</p>` : ''}
      <div style="display:flex;gap:8px">
        <input id="reply-${d.id}" placeholder="${d.answer?'Update reply...':'Type a reply...'}" style="flex:1;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
        <button class="btn btn-primary btn-sm" onclick="answerDoubt('${d.id}','${mode}')">Send</button>
      </div>
    </div>`;
  }).join('');
}

function answerDoubt(id, mode){
  const input = document.getElementById('reply-'+id);
  const answer = input.value.trim();
  if(!answer) return;
  const cacheKey = mode==='faculty' ? '_facultyDoubtsCache' : '_adminDoubtsCache';
  const cache = DB[cacheKey] || [];
  const doubt = cache.find(x=>x.id===id);

  if(window.FIREBASE_ENABLED){
    fbDb.collection('doubts').doc(id).update({answer, status:'answered'})
      .then(()=>{
        if(doubt){ doubt.answer=answer; doubt.status='answered'; notifyStudentOfReply(doubt); }
        render();
      }).catch(err=>toast(err.message,'⚠️'));
  } else {
    const d = DB.doubts.find(x=>x.id===id);
    if(d){ d.answer=answer; d.status='answered'; notifyStudentOfReply(d); }
    DB._adminDoubtsCache = DB.doubts.slice();
    DB._facultyDoubtsCache = DB.doubts.filter(x=>x.subject===DB.currentUser.subject);
    render();
  }
  toast('Reply sent');
}

/* ============================== BOOKMARKS ================================= */
function toggleBookmark(subject, chapter){
  const key = subject+'-'+chapter;
  DB.currentUser.bookmarks = DB.currentUser.bookmarks || [];
  const idx = DB.currentUser.bookmarks.indexOf(key);
  if(idx>=0) DB.currentUser.bookmarks.splice(idx,1);
  else DB.currentUser.bookmarks.push(key);

  if(window.FIREBASE_ENABLED && DB.currentUser.uid){
    fbDb.collection('users').doc(DB.currentUser.uid).update({
      bookmarks: idx>=0
        ? firebase.firestore.FieldValue.arrayRemove(key)
        : firebase.firestore.FieldValue.arrayUnion(key)
    }).catch(err=>console.error('[DSA] bookmark sync failed', err));
  }
  toast(idx>=0 ? 'Bookmark removed' : 'Chapter bookmarked ⭐');
  render();
}
function renderBookmarks(){
  if(!DB.currentUser) return renderAuth();
  const bms = DB.currentUser.bookmarks || [];
  const items = bms.map(key=>{
    const [subject, chapterStr] = key.split('-');
    const chapter = Number(chapterStr);
    return {subject, chapter, title: DATA.titles[subject] ? DATA.titles[subject][chapter] : null};
  }).filter(x=>x.title);

  return `
  <div class="app-shell">
    ${sidebar('bookmarks')}
    <div class="main">
      <div class="main-head"><div><h2>⭐ Bookmarks</h2><p>Chapters you've starred for quick access</p></div></div>
      ${items.length===0 ? `<div class="card"><div class="empty"><div class="ic">⭐</div>No bookmarks yet — star a chapter from its subject page.</div></div>` : items.map(it=>`
        <div class="chapter-row" onclick="go('chapter',{subject:'${it.subject}',chapter:${it.chapter}})" style="cursor:pointer">
          <div class="l"><div class="chapter-badge">${SUBJECT_META[it.subject].icon}</div><div><h4>${it.subject} — Ch.${it.chapter}</h4><span>${it.title}</span></div></div>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();toggleBookmark('${it.subject}',${it.chapter})">Remove</button>
        </div>`).join('')}
    </div>
  </div>`;
}

/* ============================== PLANS / PREMIUM ============================ */
function renderPlans(){
  if(!DB.currentUser) return renderAuth();
  const isPremium = DB.currentUser.plan==='premium';
  return `
  <div class="app-shell">
    ${sidebar('plans')}
    <div class="main" style="max-width:820px">
      <div class="main-head"><div><h2>💎 Plans</h2><p>Chapter notes, DPPs and Chapter Tests are free — forever</p></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        <div class="card" style="padding:24px">
          <span class="pill pill-navy" style="margin-bottom:12px">Free</span>
          <h3 style="font-size:22px;margin-bottom:6px">₹0</h3>
          <p style="font-size:12.5px;color:var(--muted);margin-bottom:18px">Forever</p>
          <ul style="font-size:13.5px;color:var(--navy-800);line-height:2;padding-left:18px;margin-bottom:18px">
            <li>All Master Notes with diagrams</li>
            <li>All DPPs (1/2/3) per chapter</li>
            <li>All Chapter Tests</li>
            <li>Doubt-solving</li>
            <li>Progress &amp; weak-topic report</li>
          </ul>
          <button class="btn btn-outline btn-block btn-sm" disabled>${isPremium?'':'Current plan'}</button>
        </div>
        <div class="card" style="padding:24px;border-color:var(--gold-500)">
          <span class="pill pill-gold" style="margin-bottom:12px">Premium</span>
          <h3 style="font-size:22px;margin-bottom:6px">₹499<span style="font-size:13px;color:var(--muted)">/month</span></h3>
          <p style="font-size:12.5px;color:var(--muted);margin-bottom:18px">Cancel anytime</p>
          <ul style="font-size:13.5px;color:var(--navy-800);line-height:2;padding-left:18px;margin-bottom:18px">
            <li>Everything in Free</li>
            <li><b>Full Syllabus Mock Tests</b></li>
            <li>Leaderboard eligibility badge</li>
            <li>Priority doubt replies</li>
          </ul>
          ${isPremium
            ? `<button class="btn btn-gold btn-block btn-sm" onclick="setPlan('free')">You're Premium — switch to Free</button>`
            : `<button class="btn btn-gold btn-block btn-sm" onclick="setPlan('premium')">Upgrade to Premium →</button>`}
        </div>
      </div>
      <div class="demo-note" style="margin-top:18px">💳 <b>No real payment is wired up yet</b> — this button flips your plan instantly for demo purposes. Taking real money needs a Razorpay (or similar) account plus a small Cloud Function to verify payment signatures server-side before marking a user premium — tell me when you're ready and I'll wire that in.</div>
    </div>
  </div>`;
}
function setPlan(plan){
  DB.currentUser.plan = plan;
  if(window.FIREBASE_ENABLED && DB.currentUser.uid){
    fbDb.collection('users').doc(DB.currentUser.uid).update({plan}).catch(err=>console.error('[DSA] plan sync failed', err));
  }
  toast(plan==='premium' ? 'Upgraded to Premium (demo)' : 'Switched to Free');
  render();
}

/* ============================== PARENT DASHBOARD ========================= */
function renderParentDashboard(){
  if(!DB.currentUser) return renderAuth();
  const child = window.FIREBASE_ENABLED && DB.linkedChild ? DB.linkedChild : DB.demoChild;
  const childResults = DB.results;
  const avg = childResults.length ? Math.round(childResults.reduce((a,r)=>a+r.pct,0)/childResults.length) : null;
  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main">
      <div class="main-head"><div><h2>Tracking ${child.name}</h2><p>Read-only view · Class 11 · ${child.email}</p></div></div>
      <div class="stat-row">
        <div class="card stat-box"><b>${childResults.length}</b><span>Tests attempted</span></div>
        <div class="card stat-box"><b>${avg===null?'—':avg+'%'}</b><span>Average score</span></div>
        <div class="card stat-box"><b>${totalPlatformChapters()}</b><span>Chapters available</span></div>
        <div class="card stat-box"><b>${SUBJECTS.length}</b><span>Subjects enrolled</span></div>
      </div>
      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Test history</h3>
        ${childResults.length===0 ? `<div class="empty"><div class="ic">📭</div>No attempts yet.</div>` : `
        <table class="table-simple"><thead><tr><th>Test</th><th>Score</th><th>Accuracy</th><th>When</th></tr></thead><tbody>
        ${childResults.slice().reverse().map(r=>`<tr><td>${r.subject}${r.chapter?' · Ch.'+r.chapter:''} · ${r.section}</td><td>${r.score}/${r.max}</td><td>${r.pct}%</td><td>${formatWhen(r.when)}</td></tr>`).join('')}
        </tbody></table>`}
      </div>
      <div class="demo-note" style="margin-top:16px">👪 A parent account is linked to their child's UID in Firestore, so this table reads live from the same <code>testResults</code> collection the student dashboard uses.</div>
    </div>
  </div>`;
}

/* ============================== ADMIN DASHBOARD =========================== */
function renderAdminDashboard(){
  if(!DB.currentUser) return renderAuth();
  if(!DB._pendingFacultyCache){
    loadPendingFaculty().then(rows=>{ DB._pendingFacultyCache = rows; if(ROUTE.view==='admin') render(); });
  }
  if(!DB._studentsCache){
    loadAllStudents().then(rows=>{ DB._studentsCache = rows; if(ROUTE.view==='admin') render(); });
  }
  const pendingFaculty = DB._pendingFacultyCache || [];
  const students = DB._studentsCache || [];
  const totalCollected = students.reduce((a,s)=>a+(s.feePaid||0),0);
  const totalDue = students.reduce((a,s)=>a+Math.max(0,(s.feeTotal||0)-(s.feePaid||0)),0);
  const premiumCount = students.filter(s=>s.plan==='premium').length;
  return `
  <div class="app-shell">
    ${sidebar('overview')}
    <div class="main">
      <div class="main-head"><div><h2>Admin control panel</h2><p>Students, content, doubts and test performance</p></div></div>
      ${DB._adminLoadError ? `<div class="card" style="padding:14px 18px;margin-bottom:18px;background:var(--red-100);border-color:var(--red-500)"><b style="color:var(--red-600)">⚠️ Couldn't load some admin data:</b> <span style="font-size:13px">${DB._adminLoadError}</span><div style="font-size:12px;color:var(--muted);margin-top:6px">This is almost always a Firestore rules or account-role issue — check that your own account was created via the <b>Admin</b> tab, and that firestore.rules is published.</div></div>` : ''}
      <div class="stat-row">
        <div class="card stat-box"><b>${students.length}</b><span>Registered students</span></div>
        <div class="card stat-box"><b>${SUBJECTS.length}</b><span>Subjects live</span></div>
        <div class="card stat-box"><b>${totalPlatformChapters()}</b><span>Chapters published</span></div>
        <div class="card stat-box"><b>${DB.results.length}</b><span>Attempts this session</span></div>
      </div>
      <div class="stat-row">
        <div class="card stat-box"><b>${premiumCount}</b><span>Premium students</span></div>
        <div class="card stat-box"><b style="color:var(--green-600)">₹${totalCollected}</b><span>Fees collected</span></div>
        <div class="card stat-box"><b style="color:${totalDue>0?'var(--red-600)':'var(--green-600)'}">₹${totalDue}</b><span>Fees pending</span></div>
        <div class="card stat-box"><b>${DB._pendingFacultyCache?DB._pendingFacultyCache.length:0}</b><span>Faculty awaiting approval</span></div>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:15px">🎓 Faculty approvals ${pendingFaculty.length>0?`<span class="pill pill-gold" style="margin-left:6px">${pendingFaculty.length} pending</span>`:''}</h3>
        </div>
        ${pendingFaculty.length===0 ? `<p style="font-size:13px;color:var(--muted)">No pending faculty signups right now.</p>` : pendingFaculty.map(f=>`
          <div class="chapter-row">
            <div class="l"><div class="chapter-badge">${(SUBJECT_META[f.subject]&&SUBJECT_META[f.subject].icon)||'🎓'}</div><div><h4>${f.name}</h4><span>${f.email} · wants to teach ${f.subject}</span></div></div>
            <button class="btn btn-green btn-sm" onclick="approveFaculty('${f.uid}')">Approve →</button>
          </div>`).join('')}
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:15px">Doubts inbox</h3>
          <button class="btn btn-outline btn-sm" onclick="go('admindoubts')">Open inbox →</button>
        </div>
        <p style="font-size:13px;color:var(--muted)">Students can post chapter-specific doubts; reply to them from the dedicated inbox.</p>
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <h3 style="font-size:15px">Students ${students.length>0?`<span class="pill pill-navy" style="margin-left:6px">${students.length} registered</span>`:''}</h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="exportStudentsCSV()">⬇ Export CSV</button>
            <button class="btn btn-outline btn-sm" onclick="DB._studentsCache=null;render();">🔄 Refresh</button>
          </div>
        </div>
        ${!window.FIREBASE_ENABLED ? `<div class="empty"><div class="ic">🔌</div>Connect Firebase (Live Mode) to see real registered students here.</div>` :
          students.length===0 ? `<div class="empty"><div class="ic">📭</div>No students have signed up yet.</div>` : `
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
          <input id="studentSearch" oninput="filterStudentsTable()" placeholder="Search by name or email…" style="flex:1;min-width:180px;padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
          <select id="studentClassFilter" onchange="filterStudentsTable()" style="padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
            <option value="">All classes</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
            <option value="Dropper">Dropper</option>
          </select>
          <select id="studentStatusFilter" onchange="filterStudentsTable()" style="padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:13.5px">
            <option value="">All status</option>
            <option value="active">Active only</option>
            <option value="banned">Banned only</option>
          </select>
        </div>
        <table class="table-simple"><thead><tr><th>Name</th><th>Class</th><th>Plan</th><th>Fees due</th><th>Status</th><th></th></tr></thead><tbody id="studentsTableBody">
        ${students.map(s=>{
          const due = Math.max(0, (s.feeTotal||0) - (s.feePaid||0));
          return `<tr data-name="${(s.name||'').toLowerCase()}" data-email="${(s.email||'').toLowerCase()}" data-cls="${s.cls||''}" data-status="${s.banned?'banned':'active'}">
            <td style="display:flex;align-items:center;gap:10px"><span class="avatar-sm">${(s.name||'?')[0]}</span>${s.name}<span style="color:var(--faint);font-size:12px">${s.email}</span></td>
            <td>${s.cls||'—'}</td>
            <td><span class="pill ${s.plan==='premium'?'pill-gold':'pill-navy'}">${s.plan==='premium'?'★ Premium':'Free'}</span></td>
            <td>${due>0?`<b style="color:var(--red-600)">₹${due}</b>`:'₹0'}</td>
            <td><span class="pill ${s.banned?'pill-red':'pill-green'}">${s.banned?'Banned':'Active'}</span></td>
            <td><button class="btn btn-ghost btn-sm" onclick="go('adminstudent',{uid:'${s.uid}'})">View →</button></td>
          </tr>`;
        }).join('')}
        </tbody></table>`}
      </div>

      <div class="card" style="padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;margin-bottom:14px">Content library</h3>
        ${SUBJECTS.map(s=>chaptersFor(s).map(ch=>`
          <div class="chapter-row">
            <div class="l"><div class="chapter-badge">${SUBJECT_META[s].icon}</div><div><h4>${s} — Chapter ${ch}: ${DATA.titles[s][ch]}</h4><span>${totalQCount(s,ch)} questions · Notes + diagrams + 3 DPPs + Chapter Test</span></div></div>
            <span class="pill pill-green">Published</span>
          </div>`).join('')).join('')}
      </div>
      <div class="demo-note">🛠️ Send more chapters whenever you're ready — each one gets processed through the same pipeline and published the same way.</div>
    </div>
  </div>`;
}

/* ============================== KSPIDER SSO BRIDGE ========================
   When this tool is opened from www.kspiderai.in (launchTool sets a short-
   lived sessionStorage token + KSpider stores the logged-in user's profile
   in localStorage 'ks_u'), a verified STUDENT is signed straight into their
   DSA dashboard — no second signup. This only fires for students; admin
   access always still requires the real DSA admin password (security).
   ========================================================================= */
function getKSpiderUser(){
  try{
    const raw = localStorage.getItem('ks_u');
    if(!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && parsed.v) ? parsed.v : null;
  }catch(e){ return null; }
}
function tryKspiderSSO(){
  if(!window.FIREBASE_ENABLED) return false;
  try{
    const ksUser = getKSpiderUser();
    const toolId = sessionStorage.getItem('ks_tool_id');
    const exp = Number(sessionStorage.getItem('ks_tool_exp') || 0);
    if(!ksUser || !ksUser.verified || !ksUser.email) return false;
    if(toolId !== 'dr-shreyansh-academy') return false;
    if(!exp || Date.now() > exp) return false; // token expired (3-min window)

    fbAuth.signInAnonymously().then(cred=>{
      const uid = cred.user.uid;
      return fbDb.collection('users').doc(uid).get().then(doc=>{
        if(doc.exists) return doc.data();
        const profile = {
          name: ksUser.name || 'Student', email: ksUser.email, role:'student',
          plan:'free', bookmarks:[], viaKSpider:true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        return fbDb.collection('users').doc(uid).set(profile).then(()=>profile);
      }).then(profile=>{
        if(profile.banned){
          fbAuth.signOut();
          toast('This account has been suspended — contact your admin.', '🚫');
          return null;
        }
        DB.currentUser = {
          role:'student', name:profile.name, email:profile.email,
          uid, plan: profile.plan||'free', bookmarks: profile.bookmarks||[],
          feeTotal: profile.feeTotal||0, feePaid: profile.feePaid||0,
          feeDueDate: profile.feeDueDate||null, feeHistory: profile.feeHistory||[],
          adminNote: profile.adminNote||null
        };
        return loadStudentResults();
      }).then(()=>{
        if(!DB.currentUser) return;
        go('student');
        toast(`Welcome from K Spider, ${DB.currentUser.name.split(' ')[0]}! 👋`);
      });
    }).catch(err=>console.warn('[DSA] KSpider SSO failed', err));

    return true; // SSO attempt started (async) — normal render still happens below
  }catch(e){ return false; }
}

/* Admin arriving from KSpider Admin panel (?ks_admin=1): prefill the email +
   default to the Admin tab, but a real DSA admin password is still required. */
function maybePrefillAdminFromKSpider(){
  try{
    const params = new URLSearchParams(window.location.search);
    if(params.get('ks_admin') !== '1') return;
    const ksUser = getKSpiderUser();
    if(ksUser && ksUser.email){
      ROUTE = {view:'auth', params:{role:'admin', prefillEmail: ksUser.email}};
    } else {
      ROUTE = {view:'auth', params:{role:'admin'}};
    }
  }catch(e){}
}

/* ============================== INIT ===================================== */
/* ============================== PWA (INSTALL + OFFLINE SHELL) ============= */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(err=>console.warn('[DSA] SW register failed', err));
  });
}
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  _deferredInstallPrompt = e;
  const btn = document.getElementById('installAppBtn');
  if(btn) btn.classList.remove('hidden');
});
function installApp(){
  if(!_deferredInstallPrompt) return;
  _deferredInstallPrompt.prompt();
  _deferredInstallPrompt.userChoice.then(()=>{ _deferredInstallPrompt = null; });
}
window.addEventListener('appinstalled', ()=>toast('DSA installed — find it on your home screen 🎉'));

maybePrefillAdminFromKSpider();
render();
if(ROUTE.view==='landing') setTimeout(mountDeck, 30);
tryKspiderSSO();

const _origGo = go;
window.go = function(view, params){
  clearInterval(deckTimer);
  _origGo(view, params);
  if(view==='landing') setTimeout(mountDeck, 30);
};

document.addEventListener('keydown', function(e){
  const onNotes = document.querySelector('.notes-reader');
  if(!onNotes) return;
  const blocked = (e.ctrlKey||e.metaKey) && ['p','s','c','u'].includes(e.key.toLowerCase());
  if(blocked){ e.preventDefault(); toast('Downloading & printing is disabled for chapter content','🔒'); }
});
