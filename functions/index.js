/**
 * ════════════════════════════════════════════════════════════════
 *  KSpider AI — Firebase Cloud Function: ksAiProxy
 *  Project  : kspideraimain
 *  Region   : asia-south1 (Mumbai — lowest latency for India)
 *  Runtime  : Node.js 20
 *
 *  PURPOSE:
 *  Acts as a secure server-side proxy between kspiderai.in and
 *  AI providers (Anthropic Claude, Groq, Gemini). The API key
 *  is stored in Firebase Secret Manager / environment config —
 *  it is NEVER exposed to the browser.
 *
 *  SECURITY:
 *  • CORS locked to https://www.kspiderai.in only
 *  • Rate limiting: max 30 requests/IP/hour via Firestore counter
 *  • Request validation: messages array required, maxTokens capped
 *  • API key fetched from Firebase Secret Manager at runtime
 *  • No API key ever leaves the server
 *
 *  DEPLOY COMMAND (run from /functions folder):
 *  firebase deploy --only functions:ksAiProxy
 *
 *  SETUP STEPS (one-time, explained in README below):
 *  1. firebase functions:secrets:set ANTHROPIC_KEY
 *  2. firebase functions:secrets:set GROQ_KEY        (optional fallback)
 *  3. firebase functions:secrets:set GEMINI_KEY      (optional fallback)
 *  4. firebase deploy --only functions:ksAiProxy
 * ════════════════════════════════════════════════════════════════
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp }  = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));

initializeApp();
const db = getFirestore();

// ── Secrets (stored in Firebase Secret Manager, NOT in code) ──
const ANTHROPIC_KEY = defineSecret('ANTHROPIC_KEY');
const GROQ_KEY      = defineSecret('GROQ_KEY');
const GEMINI_KEY    = defineSecret('GEMINI_KEY');

// ── CORS allowed origins ──
const ALLOWED_ORIGINS = [
  'https://www.kspiderai.in',
  'https://kspiderai.in',
  'http://localhost:5500',   // local dev
  'http://127.0.0.1:5500',  // local dev
  'http://localhost:3000'    // local dev
];

// ── Rate limit config ──
const RATE_LIMIT_REQUESTS = 30;  // max requests
const RATE_LIMIT_WINDOW   = 3600; // per hour (seconds)

// ═══════════════════════════════════════════════════════════════
//  MAIN CLOUD FUNCTION
// ═══════════════════════════════════════════════════════════════
exports.ksAiProxy = onRequest(
  {
    region: 'asia-south1',
    secrets: [ANTHROPIC_KEY, GROQ_KEY, GEMINI_KEY],
    timeoutSeconds: 60,
    memory: '256MiB',
    minInstances: 0,
    maxInstances: 10,
  },
  async (req, res) => {

    // ── 1. CORS headers ──────────────────────────────────────
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Block all other origins
      res.setHeader('Access-Control-Allow-Origin', 'https://www.kspiderai.in');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only POST allowed
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    // ── 2. ORIGIN VALIDATION ─────────────────────────────────
    if (!ALLOWED_ORIGINS.includes(origin)) {
      console.warn('[ksAiProxy] Blocked origin:', origin);
      res.status(403).json({ ok: false, error: 'Origin not allowed' });
      return;
    }

    // ── 3. RATE LIMITING ─────────────────────────────────────
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
                 .toString().split(',')[0].trim();
    const safeIp  = ip.replace(/[.:]/g, '_');
    const nowSec  = Math.floor(Date.now() / 1000);
    const winStart = nowSec - RATE_LIMIT_WINDOW;
    const rlRef    = db.collection('ai_rate_limits').doc(safeIp);

    try {
      const rlDoc = await rlRef.get();
      if (rlDoc.exists) {
        const d = rlDoc.data();
        // Reset window if expired
        if (d.windowStart < winStart) {
          await rlRef.set({ count: 1, windowStart: nowSec });
        } else if (d.count >= RATE_LIMIT_REQUESTS) {
          const retryAfter = RATE_LIMIT_WINDOW - (nowSec - d.windowStart);
          res.setHeader('Retry-After', String(retryAfter));
          res.status(429).json({
            ok: false,
            error: `Rate limit reached. Maximum ${RATE_LIMIT_REQUESTS} requests per hour. Try again in ${Math.ceil(retryAfter/60)} minutes, or add your own free API key.`
          });
          return;
        } else {
          await rlRef.update({ count: FieldValue.increment(1) });
        }
      } else {
        await rlRef.set({ count: 1, windowStart: nowSec });
      }
    } catch (rlErr) {
      // Rate limit check failed — allow request but log it
      console.error('[ksAiProxy] Rate limit error (allowing):', rlErr.message);
    }

    // ── 4. REQUEST BODY VALIDATION ───────────────────────────
    const body = req.body;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ ok: false, error: 'messages array is required' });
      return;
    }

    // Sanitize inputs
    const messages  = body.messages.slice(-8).map(m => ({
      role:    (m.role === 'assistant') ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000)  // cap per-message length
    }));
    const system    = String(body.system   || '').slice(0, 1000);
    const maxTokens = Math.min(Math.max(parseInt(body.maxTokens) || 800, 100), 1500);
    const model     = body.model || 'claude-sonnet-4-20250514';

    // ── 5. CALL AI PROVIDER ──────────────────────────────────
    // Priority: Anthropic Claude → Groq → Gemini
    const anthropicKey = ANTHROPIC_KEY.value();
    const groqKey      = GROQ_KEY.value();
    const geminiKey    = GEMINI_KEY.value();

    let aiText = null;
    let lastError = null;

    // ── 5a. Try Anthropic Claude ──
    if (anthropicKey) {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system:     system || undefined,
            messages
          })
        });
        const claudeData = await claudeRes.json();
        if (claudeData?.content?.[0]?.text) {
          aiText = claudeData.content[0].text;
        } else if (claudeData?.error) {
          lastError = 'Claude: ' + (claudeData.error.message || JSON.stringify(claudeData.error));
        }
      } catch (e) {
        lastError = 'Claude network error: ' + e.message;
        console.error('[ksAiProxy] Claude error:', e.message);
      }
    }

    // ── 5b. Fallback to Groq ──
    if (!aiText && groqKey) {
      try {
        const groqMessages = [];
        if (system) groqMessages.push({ role: 'system', content: system });
        messages.forEach(m => groqMessages.push(m));

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + groqKey
          },
          body: JSON.stringify({
            model:      'llama3-70b-8192',
            messages:   groqMessages,
            max_tokens: maxTokens
          })
        });
        const groqData = await groqRes.json();
        if (groqData?.choices?.[0]?.message?.content) {
          aiText = groqData.choices[0].message.content;
        } else if (groqData?.error) {
          lastError = 'Groq: ' + (groqData.error.message || JSON.stringify(groqData.error));
        }
      } catch (e) {
        lastError = 'Groq network error: ' + e.message;
        console.error('[ksAiProxy] Groq error:', e.message);
      }
    }

    // ── 5c. Fallback to Gemini ──
    if (!aiText && geminiKey) {
      try {
        const gemParts = [];
        if (system) gemParts.push({ text: '[System: ' + system + ']\n\n' });
        messages.forEach(m => gemParts.push({ text: (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content }));

        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: gemParts }] })
          }
        );
        const gemData = await gemRes.json();
        if (gemData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = gemData.candidates[0].content.parts[0].text;
        } else if (gemData?.error) {
          lastError = 'Gemini: ' + (gemData.error.message || JSON.stringify(gemData.error));
        }
      } catch (e) {
        lastError = 'Gemini network error: ' + e.message;
        console.error('[ksAiProxy] Gemini error:', e.message);
      }
    }

    // ── 6. RESPOND ───────────────────────────────────────────
    if (aiText) {
      // Log usage to Firestore (non-blocking)
      db.collection('admin').doc('claude_usage').update({
        totalCalls: FieldValue.increment(1),
        lastCall:   new Date().toISOString(),
        lastModel:  model
      }).catch(() => {
        // Doc might not exist yet — create it
        db.collection('admin').doc('claude_usage').set({
          totalCalls: 1,
          todayCalls: 1,
          todayDate:  new Date().toISOString().split('T')[0],
          lastCall:   new Date().toISOString(),
          lastModel:  model
        }).catch(() => {});
      });

      res.status(200).json({ ok: true, text: aiText });
    } else {
      console.error('[ksAiProxy] All providers failed. Last error:', lastError);
      res.status(503).json({
        ok: false,
        error: lastError || 'All AI providers are currently unavailable. Please try again later or add your own free API key.'
      });
    }
  }
);
