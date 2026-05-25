# KS TradeMind — Complete Deployment Guide
## By KSpider4Kreation | kspiderai.in

---

## 📁 FILE STRUCTURE — Kaunsa File Kahan Jaayega

```
Your GitHub Repository (kspiderai.in)
├── index.html                  ← KS TradeMind main tool (upload at root)
├── admin.html                  ← Admin panel (upload at root)
├── firestore.rules             ← Firebase Console mein paste karo
│
├── functions/                  ← Firebase Cloud Functions folder
│   ├── index.js                ← ksAiProxy function code
│   └── package.json            ← Dependencies
│
└── KS_TRADEMIND_DEPLOY_GUIDE.md ← Ye guide
```

---

## 🚀 STEP 1 — GitHub Pages Setup (index.html + admin.html)

### A) Agar GitHub Pages pehle se setup hai:
1. Apna GitHub repository open karo (jo kspiderai.in ke liye use ho raha hai)
2. `index.html` file drag & drop karo — "Commit changes" click karo
3. `admin.html` file drag & drop karo — "Commit changes" click karo
4. 2-3 minutes wait karo
5. `https://www.kspiderai.in` visit karo — KS TradeMind live hoga!

### B) Agar GitHub Pages setup nahi hai:
1. GitHub.com pe login karo
2. New repository banao: `username.github.io` ya apna custom domain repo
3. Settings → Pages → Source: "Deploy from branch" → main → / (root)
4. `index.html` aur `admin.html` upload karo
5. Custom domain set karo: `www.kspiderai.in`

---

## 🔥 STEP 2 — Firebase Firestore Rules Update

1. Firebase Console kholo: https://console.firebase.google.com
2. Project: **kspideraimain** select karo
3. Left sidebar → **Firestore Database**
4. Top tabs mein → **Rules** click karo
5. Purana sab content select karke DELETE karo
6. `firestore.rules` file ka pura content copy karo aur paste karo
7. **Publish** button click karo
8. ✅ Done!

---

## ⚡ STEP 3 — Firebase Cloud Function Deploy (AI Secure Proxy)

> Ye step AI Assistant ke liye zaroori hai. Bina is step ke AI kaam nahi karega (users apni key add kar sakte hain as fallback).

### Prerequisites (ek baar install karo):
```bash
# Node.js install karo: https://nodejs.org (LTS version)
# Phir terminal mein ye commands run karo:

npm install -g firebase-tools
firebase login
# Browser mein Google account se login karo
```

### Function Deploy:
```bash
# Step 1: Project select karo
firebase use kspideraimain

# Step 2: Functions folder mein jao
cd functions
npm install
cd ..

# Step 3: API Keys securely add karo (Secret Manager mein)
firebase functions:secrets:set ANTHROPIC_KEY
# Prompt aayega: "Enter a value for ANTHROPIC_KEY:"
# Apni Claude API key paste karo: sk-ant-api03-xxxxx
# Enter dabao

firebase functions:secrets:set GROQ_KEY
# Groq free key paste karo: gsk_xxxxx
# (Get free key from: console.groq.com/keys)

firebase functions:secrets:set GEMINI_KEY
# Gemini free key paste karo: AIzaxxxxx
# (Get free key from: aistudio.google.com/app/apikey)

# Step 4: Deploy karo
firebase deploy --only functions:ksAiProxy

# Success message aayega:
# ✔ functions[asia-south1-ksAiProxy]: Successful create operation.
# Function URL: https://asia-south1-kspideraimain.cloudfunctions.net/ksAiProxy
```

> ✅ Function URL pehle se index.html mein hardcoded hai — kuch change karne ki zaroorat nahi!

---

## 🔑 STEP 4 — Admin Panel API Keys Add Karo

1. `https://www.kspiderai.in/admin.html` open karo
2. Admin password se login karo
3. Left sidebar → **API Keys** section
4. **Inbuilt Anthropic Claude System** card mein:
   - Model select karo: `claude-sonnet-4` (recommended)
   - Test key field mein apni key paste karo
   - **🚀 Test** button click karo — green response aana chahiye
5. Main API Keys section mein bhi keys save karo
6. **💾 Save All Keys** click karo
7. ✅ Site ke sab tools ab Claude AI use karenge!

---

## 🌐 STEP 5 — Custom Domain Verify Karo

1. `https://www.kspiderai.in` visit karo
2. Check karo:
   - ✅ KS TradeMind title dikh raha hai
   - ✅ Ticker tape scroll ho rahi hai
   - ✅ NIFTY chart load ho raha hai
   - ✅ 🧠 AI button (bottom right) kaam kar raha hai
   - ✅ Stock Scanner section dikh raha hai
   - ✅ Signal cards update ho rahe hain

---

## 📊 STEP 6 — Google Analytics Verify

1. Google Analytics: https://analytics.google.com
2. Property: G-PLBHWMHEC1
3. Real-time → Overview mein apna visit dikh raha hoga
4. ✅ Analytics live hai!

---

## 💰 FREE API Keys Kahan Se Milegi

| Provider | Free Tier | Link |
|----------|-----------|------|
| **Groq** | Unlimited free (rate limited) | console.groq.com/keys |
| **Google Gemini** | 1500 requests/day free | aistudio.google.com/app/apikey |
| **Anthropic Claude** | $5 free credits on signup | console.anthropic.com |

> 💡 Groq + Gemini dono free hain. Claude ke liye $5 credit milta hai signup pe jo kaafi hai.

---

## 🔄 Future Updates Kaise Karein

```bash
# Koi bhi file update karo:
# 1. GitHub pe file edit karo / upload karo
# 2. Commit karo
# 3. GitHub Pages automatically 2-3 min mein update ho jaata hai

# Cloud Function update karne ke liye:
firebase deploy --only functions:ksAiProxy

# Firestore rules update:
# Firebase Console → Firestore → Rules → Paste → Publish
```

---

## 🚨 Common Problems & Solutions

| Problem | Solution |
|---------|----------|
| Chart load nahi ho raha | Ad blocker disable karo ya Chrome incognito mein try karo |
| AI button kaam nahi kar raha | Step 3 (Cloud Function deploy) complete karo |
| Admin login nahi ho raha | Firebase Auth check karo — admin@kspiderai.in account verify karo |
| Stock Scanner "Simulated" dikh raha hai | Normal hai — TradingView screener API kabhi kabhi block karta hai, real data bhi aata hai |
| Firestore permission error | Step 2 (Rules update) dobara karo |

---

## 📞 Support

- **YouTube:** youtube.com/@KSpider4Kreation
- **Website:** kspiderai.in
- **Created by:** Gaurang Raval & Khush Raval

---
*KS TradeMind v1.0 | KSpider4Kreation © 2025*
