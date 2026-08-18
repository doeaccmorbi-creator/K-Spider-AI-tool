/* =========================================================================
   PASTE YOUR FIREBASE CONFIG BELOW
   -------------------------------------------------------------------------
   Firebase Console → Project settings → Your apps → (</> web app) →
   copy the object that looks like the one below and replace FIREBASE_CONFIG.

   Until you do this, apiKey stays "YOUR_API_KEY_HERE" and the app keeps
   running in Demo Mode automatically — nothing breaks either way.
   ========================================================================= */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8pFQw65zAOergngSLd9bcYC3r7O7tzyE",
  authDomain: "dsacademy-42f59.firebaseapp.com",
  projectId: "dsacademy-42f59",
  storageBucket: "dsacademy-42f59.firebasestorage.app",
  messagingSenderId: "146035233759",
  appId: "1:146035233759:web:8f3e4c6d63625e90342a6a"
};

window.FIREBASE_ENABLED = false;
try{
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE" && typeof firebase !== 'undefined'){
    firebase.initializeApp(FIREBASE_CONFIG);
    window.fbAuth = firebase.auth();
    window.fbDb = firebase.firestore();
    window.FIREBASE_ENABLED = true;
    console.log("[DSA] Firebase connected — running in LIVE mode.");
  } else {
    console.log("[DSA] Firebase config not filled in yet — running in DEMO mode.");
  }
}catch(err){
  console.error("[DSA] Firebase init failed, falling back to Demo mode:", err);
  window.FIREBASE_ENABLED = false;
}
