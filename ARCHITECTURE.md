# K Spider AI Tool — Platform Architecture v2.0
# Developer Guide & Admin Reference
# By: Gaurang Raval & Khush Raval | www.kspiderai.in

===========================================================================
  PLATFORM OVERVIEW
===========================================================================

Platform Name  : K Spider AI Tool
Brand          : K Spider for Kreation
Website        : www.kspiderai.in
YouTube        : https://www.youtube.com/@KSpider4Kreaction
Email          : kspider221206@gmail.com
Developers     : Gaurang Raval (Father) & Khush Raval (Son)
Version        : 2.0.0
Goal           : Host 100+ Free AI Tools — Step by Step

===========================================================================
  FILE STRUCTURE
===========================================================================

kspider/
├── index.html              ← Main homepage (modular, loads from JSON)
├── tools.config.json       ← MASTER TOOL REGISTRY ← ADD NEW TOOLS HERE
├── sitemap.xml             ← SEO sitemap
├── robots.txt              ← SEO robots
├── ARCHITECTURE.md         ← This file
│
├── assets/
│   ├── css/
│   │   └── design-system.css    ← Global CSS design tokens & components
│   ├── js/
│   │   └── platform.js          ← Core platform engine (KSpider object)
│   └── icons/                   ← Tool icons (optional)
│
├── tools/
│   ├── whatsapp-bulk-sender.html  ← Tool 1 (LIVE)
│   ├── resume-builder.html        ← Tool 2 (LIVE)
│   └── [new-tool].html            ← Drop new tools here!
│
├── legal/
│   └── index.html               ← All legal pages (combined)
│
└── admin/                       ← FUTURE: Admin dashboard (server-side)
    └── [future login system]

===========================================================================
  HOW TO ADD A NEW TOOL (Simple 3-Step Process)
===========================================================================

STEP 1: Create the tool HTML file
  → Copy template from tools/_template.html
  → Save as tools/[tool-name].html
  → Include KSpider platform.js
  → Use KSpider.Share, KSpider.Auth, KSpider.Lang modules

STEP 2: Add entry to tools.config.json
  Add this object to the "tools" array:
  {
    "id":          "tool-slug",
    "name":        "Tool Display Name",
    "description": "Short description for card",
    "category":    "marketing | career | health | education | finance | creative | social | legal | music | tech",
    "icon":        "🛠️",
    "badge":       "LIVE | SOON",
    "badge_color": "green | amber",
    "file":        "tools/tool-slug.html",
    "features":    ["Feature 1", "Feature 2", "Feature 3"],
    "premium":     false,
    "languages":   true,
    "share":       true,
    "download":    true,
    "status":      "live | coming_soon",
    "added":       "2025-01-01",
    "tags":        ["tag1", "tag2"]
  }

STEP 3: Deploy
  → Push to GitHub / upload to hosting
  → Tool auto-appears on homepage immediately!
  → No other files need modification.

===========================================================================
  SECURITY IMPLEMENTATION
===========================================================================

✅ Input Sanitization      — KSpider.Security.sanitize() on all user input
✅ XSS Protection          — HTML entity encoding before rendering
✅ Rate Limiting           — KSpider.Security.rateLimit() per action key
✅ Secure localStorage     — Structured wrapper with app key validation
✅ Length Guards           — All inputs capped (name: 100, desc: 2000, etc.)
✅ Email Validation        — Regex pattern check
✅ Mobile Validation       — Indian 10-digit (6-9 prefix) validation
✅ Form Anti-spam          — Double-submission prevention (_submitting flag)
✅ Consent Requirements    — GDPR + IT Act checkboxes mandatory

RECOMMENDED SERVER HEADERS (set on your web server / GitHub Pages config):
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

===========================================================================
  PREMIUM SYSTEM (PLACEHOLDER — READY FOR INTEGRATION)
===========================================================================

Current state: Free for all. Premium gate UI built. Payment placeholder active.

To enable Razorpay:
1. Create Razorpay account → Get Key ID
2. In platform.js → Premium.initPayment() → Uncomment Razorpay SDK calls
3. Create backend serverless function (Vercel/Netlify) for order creation
4. Verify payment → Set user.premium = true, user.premiumExpiry = date

Plans defined in: KSpider.Premium.PLANS array (platform.js)

===========================================================================
  FUTURE: LOGIN SYSTEM
===========================================================================

Phase 1 (Current): localStorage-based registration (no server)
Phase 2 (Ready):   Firebase Auth / Supabase (free tier)
  - Email/Password login
  - Google OAuth
  - OTP via Firebase
  - User profile sync to Firestore

Phase 3 (Scale):   Custom backend (Node.js / Python FastAPI)

===========================================================================
  MULTI-LANGUAGE SUPPORT
===========================================================================

Supported languages: 17 (See KSpider.Lang.SUPPORTED in platform.js)
How it works:
  - User selects language during registration or in tool
  - KSpider.Lang.getCurrent() returns selected code
  - KSpider.Lang.getLangInstruction(code) returns Claude prompt instruction
  - Include this in every Claude API prompt to get response in user's language
  - All inputs accept UTF-8 (Hindi, Gujarati, Arabic, Chinese, etc.)

===========================================================================
  BRANDING RULES (MANDATORY)
===========================================================================

Every tool output MUST include:
"Powered by K Spider AI Tool — www.kspiderai.in — https://www.youtube.com/@KSpider4Kreaction"

WhatsApp share MUST include:
"I am [User Name]" + AI promotional line + Branding footer

Download files MUST include branding in footer.
Copy function MUST append branding line.

KSpider.Share module handles all of this automatically.

===========================================================================
  SEO CHECKLIST
===========================================================================

✅ Title tags per page
✅ Meta descriptions
✅ Canonical URLs
✅ Open Graph tags
✅ Twitter Cards
✅ JSON-LD Structured Data (Organization, WebSite, SoftwareApplication)
✅ Semantic HTML (header, main, nav, section, footer, aria labels)
✅ robots.txt
✅ sitemap.xml
✅ Language attribute (lang="en")
✅ Lazy loading ready (IntersectionObserver)

===========================================================================
  FRANCHISE MODEL SUMMARY
===========================================================================

Structure: Limited license franchise
Contact:   kspider221206@gmail.com
Territory: India (Tier 2/3 cities priority)
Revenue:   Premium subscriptions + local advertising
Support:   YouTube tutorials + email support
Legal:     See legal/index.html#franchise-terms

===========================================================================
  LEGAL COMPLIANCE SUMMARY
===========================================================================

✅ Privacy Policy (GDPR + Indian PDPB)
✅ Terms & Conditions
✅ General Disclaimer (India + Global)
✅ AI Limitation Disclaimer
✅ No Financial/Legal/Medical Advice Disclaimer
✅ Earnings Disclaimer
✅ Copyright Policy
✅ Refund Policy (for premium)
✅ Franchise Terms
✅ Mandatory consent checkboxes on registration
✅ Indian IT Act 2000 compliance notice

===========================================================================
  CONTACT & SUPPORT
===========================================================================

Email   : kspider221206@gmail.com
Website : www.kspiderai.in
YouTube : https://www.youtube.com/@KSpider4Kreaction
Founders: Gaurang Raval & Khush Raval

Powered by K Spider AI Tool — www.kspiderai.in — https://www.youtube.com/@KSpider4Kreaction
===========================================================================
