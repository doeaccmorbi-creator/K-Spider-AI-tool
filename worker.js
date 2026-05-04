/**
 * ════════════════════════════════════════════════════════════
 *  K SPIDER AI — VOXAI PRO SECURE API PROXY
 *  Cloudflare Worker — worker.js
 *  Deploy: https://dash.cloudflare.com → Workers → Create
 *  
 *  HOW TO DEPLOY:
 *  1. Go to https://dash.cloudflare.com
 *  2. Click "Workers & Pages" → "Create Application" → "Create Worker"
 *  3. Paste this entire file
 *  4. Click "Save & Deploy"
 *  5. Go to "Settings" → "Variables" → Add:
 *     Variable name: ANTHROPIC_API_KEY
 *     Value: sk-ant-your-actual-key-here  ← Your Anthropic API key
 *  6. Copy your worker URL (e.g. https://voxai-proxy.yourname.workers.dev)
 *  7. In VOXAI Pro HTML, replace PROXY_URL with your worker URL
 *
 *  SUPPORTS: Anthropic Claude + Groq AI (FREE Llama 3.3 70B)
 *  FEATURES:
 *  ✅ API key hidden server-side (never exposed to browser)
 *  ✅ CORS handled properly for all domains
 *  ✅ Rate limiting per IP (100 req/hour free tier)
 *  ✅ Request validation & sanitization
 *  ✅ Supports all Claude models
 *  ✅ Works on Cloudflare Free Plan (100k req/day free)
 *  ✅ Zero cost for normal usage
 *
 *  Created by Gaurang Raval & Khush Raval — K Spider AI
 *  www.kspiderai.in | youtube.com/@KSpider4Kreation
 * ════════════════════════════════════════════════════════════
 */

// ── Rate limit store (in-memory per Worker instance) ──
const rateLimitMap = new Map();
const RATE_LIMIT = 100;        // requests per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

// ── Allowed origins (add your domain here) ──
const ALLOWED_ORIGINS = [
  'https://www.kspiderai.in',
  'https://kspiderai.in',
  'https://claude.ai',
  'http://localhost',
  'http://127.0.0.1',
  // Add your hosting domain:
  // 'https://yourdomain.com',
];

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return origin;
  // Allow all localhost/file for development
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127')) return origin;
  return ALLOWED_ORIGINS[0]; // default to kspiderai.in
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-ks-tool, anthropic-version',
    'Access-Control-Max-Age': '86400',
  };
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + RATE_WINDOW };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_WINDOW;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return { allowed: entry.count <= RATE_LIMIT, remaining: RATE_LIMIT - entry.count, reset: entry.reset };
}

export default {
  async fetch(request, env, ctx) {
    // ── CORS Preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // ── Only POST to /v1/messages ──
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.endsWith('/v1/messages')) {
      return new Response(JSON.stringify({ error: { message: 'Invalid endpoint' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
      });
    }

    // ── Rate Limiting ──
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 'unknown';
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ 
        error: { message: 'Rate limit exceeded. Try again in an hour.' } 
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.reset),
          ...corsHeaders(request)
        }
      });
    }

    // ── Parse & Validate body ──
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: { message: 'Invalid JSON body' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
      });
    }

    // ── Security: enforce safe model & token limits ──
    const ALLOWED_MODELS = [
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514', 
      'claude-haiku-4-5-20251001',
    ];
    if (!ALLOWED_MODELS.includes(body.model)) {
      body.model = 'claude-sonnet-4-20250514'; // default safe model
    }
    if (!body.max_tokens || body.max_tokens > 4000) {
      body.max_tokens = 1500; // cap at 1500 for free usage
    }
    // Remove any injected api_key from body
    delete body.api_key;

    // ── Get API key from environment variable ──
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: { message: 'Server configuration error. Contact admin.' } 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
      });
    }

    // ── Detect provider from body or header ──
    const useGroq = request.headers.get('x-provider') === 'groq';
    const GROQ_KEY = env.GROQ_API_KEY || '';

    // ── Forward to correct provider ──
    try {
      let upstreamURL, upstreamHeaders, upstreamBody;

      if(useGroq && GROQ_KEY) {
        // Convert Anthropic format → OpenAI/Groq format
        const groqMessages = [];
        if(body.system) groqMessages.push({role:'system',content:body.system});
        if(body.messages) groqMessages.push(...body.messages);
        upstreamURL = 'https://api.groq.com/openai/v1/chat/completions';
        upstreamHeaders = {'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY};
        upstreamBody = {model:'llama-3.3-70b-versatile',max_tokens:body.max_tokens||800,messages:groqMessages};
      } else {
        upstreamURL = 'https://api.anthropic.com/v1/messages';
        upstreamHeaders = {'Content-Type':'application/json','anthropic-version':'2023-06-01','x-api-key':apiKey};
        upstreamBody = body;
      }

      const anthropicRes = await fetch(upstreamURL, {
        method: 'POST',
        headers: upstreamHeaders,
        body: JSON.stringify(upstreamBody),
      });

      const rawData = await anthropicRes.json();

      // Normalize Groq response to Anthropic format
      let data = rawData;
      if(useGroq && rawData.choices) {
        data = {content:[{type:'text',text:rawData.choices[0]?.message?.content||''}],model:rawData.model,usage:rawData.usage};
      }

      return new Response(JSON.stringify(data), {
        status: anthropicRes.status,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rl.remaining),
          ...corsHeaders(request)
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ 
        error: { message: 'Upstream API error: ' + err.message } 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
      });
    }
  }
};
