# K Spider AI — SEO + Features Update (19 tools + index + advertise)  ·  2026-10-19

## Where each file goes (GitHub repo `K-Spider-AI-tool`)
| Delivered file | Upload to (repo path) | Cloudflare e-mails restored | alt text added | hidden H1 added |
|---|---|---|---|---|
| `ai-business-consultant.html` | `tools/ai-business-consultant.html` | 6 | 0 | — |
| `brahminconnect.html` | `tools/brahminconnect.html` | 0 | 2 | — |
| `brahmin-vivaah.html` | `tools/brahmin-vivaah.html` | 0 | 1 | — |
| `DSA.html` | `tools/DSA.html` | 3 | 0 | — |
| `gujarat-form-assistant.html` | `tools/kspider_gujarat_govt_form_assistant.html`  ⚠ RENAME on upload | 0 | 0 | — |
| `image-master-pro.html` | `tools/image-master-pro.html` | 13 | 0 | — |
| `KnowledgeSpider.html` | `tools/KnowledgeSpider.html` | 3 | 0 | yes |
| `KSpider_AI_Prompt_Engine.html` | `tools/KSpider_AI_Prompt_Engine_v3_Final.html`  ⚠ RENAME on upload | 7 | 0 | yes |
| `KSpider_Doctor_AI_ALL_DEVICES.html` | `tools/KSpider_Doctor_AI.html`  ⚠ RENAME on upload | 7 | 1 | — |
| `KSpider_JOB.html` | `tools/KSpider_Job_Placement.html`  ⚠ RENAME on upload | 0 | 1 | — |
| `kspider_pharma_marketing_tool.html` | `tools/kspider_pharma_marketing_tool.html` | 0 | 0 | yes |
| `KSpider_Studio_Tool.html` | `tools/KSpider_Studio_Tool.html` | 0 | 0 | yes |
| `kspider_Universal_Business_Pro.html` | `tools/kspider_Universal_Business_Pro.html` | 0 | 0 | yes |
| `kspiderai-400tools.html` | `tools/kspiderai-400tools.html` | 20 | 0 | — |
| `KSpiderAllFileConverterTool.html` | `tools/KSpiderAllFileConverterTool.html` | 0 | 0 | — |
| `kspider-cybershield.html` | `tools/kspider-cybershield.html` | 6 | 0 | — |
| `KSpider-File-Analyzer-Tool.html` | `tools/KSpider-File-Analyzer-Tool.html` | 1 | 0 | — |
| `kspider-free-video-generator.html` | `tools/kspider-free-video-generator.html` | 3 | 0 | — |
| `k-spider-India-f-book.html` | `tools/k-spider-India-f-book.html` | 2 | 2 | — |
| `index.html` | repo root (replaces current index) | — | — | — |
| `advertise.html` | repo root | 4 | 0 | — |
| `sitemap.xml` | repo root (replaces old) | | | |
| `robots.txt` | repo root (merge if one already exists) | | | |

## What changed in every tool page (head + 3 small body additions only)
* Unique title (max 62 chars) and meta description (max 160 chars) written from the tool's real features; misleading claims removed from meta (e.g. "Earn Rs 5,000/placement", "10,000+ doctors", "#1").
* One canonical per page = the live URL used by the index (`https://kspiderai.in/` + tool path), robots (max-snippet / max-image-preview), clean hreflang (en-IN or gu-IN + x-default), complete Open Graph + Twitter tags.
* JSON-LD regenerated: WebApplication (featureList, offers, inLanguage, valid schema.org category), BreadcrumbList, Organization. Existing FAQPage / Person / Course blocks kept (host normalised). No fabricated ratings.
* Body: alt text for static images that had none; a visually-hidden H1 only on pages that had no H1 (Knowledge Spider, Prompt Engine, Pharma, Studio, Universal); a noscript feature summary. Nothing else.
* Cloudflare "e-mail protection" artifacts (`[email protected]`, data-cfemail, email-decode.min.js) turned back into plain mailto links on 12 pages — those pages had been saved from the live site, not from source. Always edit the repo copy, not a saved page.
* html lang: brahmin-vivaah -> gu, pharma and file-analyzer -> en-IN (their text is mostly Gujarati / Latin-script Hinglish).
* Safety check on every file: all scripts byte-identical, body identical apart from the additions above, head tags exactly once, JSON-LD valid.

## index.html (built on your newest `index_13b785.html`; compact/animated layer kept)
* SEO: canonical / og / twitter / JSON-LD hosts -> `https://kspiderai.in` (the live site redirects www -> non-www), duplicate hreflang cleaned, keywords year 2026, og:updated_time.
* Removed fabricated `aggregateRating` (4.9 / 500 ratings) from SoftwareApplication + WebApplication JSON-LD — fake review markup risks a Google manual action.
* ItemList JSON-LD rebuilt from the real tool list (35 tools, correct URLs; several old URLs pointed to paths that do not exist).
* Crawlable links: tool cards (free + premium) and 12 footer links carry the real tool URL in href (click behaviour unchanged, still gated by launchTool). New visible directory "Every K Spider AI Tool & What It Does" (35 cards) before the Legal section.
* Features: desc / feats / tags of the 19 uploaded tools updated from the tool pages; privacy claims corrected where a tool uses the AI proxy (Image Master, File Analyzer, Converter) or Firebase (Social AI).
* Stale text fixed: OTP instructions, "verified your email", "25 individual tools", income amount "Rs 1,000-10,000/month per client", "100% FREE Forever" in share text, "No login needed to try" (3 languages), Terms line requiring a mobile number.

## Needs your decision (not changed)
1. Gujarat form count: the page says 159+ / 105+ / 55+ in different places; the code has 55 fully-guided forms plus a longer list. SEO text uses no number; the index name still says 159+.
2. DSA: `tools/DSA.html` (landing, now SEO-complete) and `tools/dsa-academy/index.html` (app) both exist — make one of them canonical.
3. Doctor AI: the uploaded file was mapped to `KSpider_Doctor_AI.html` (kspider-doctor-ai-v3). If it is really `Update_kspider_Doctor_AI.html` (Elite Pro Max), tell me.
4. Income / "Paise Kamao" sections inside tool pages, "10K+ Monthly Users" on advertise.html, "India's #1" lines: unverifiable claims still in the page bodies.
5. The default OG image `assets/og-image.png` must exist; tool-specific 1200x630 images would improve link previews.
6. Step B: only `gujarat-form-assistant` really calls `ksAICall` (admin/api_keys). The other 14 tools carry that helper as dead code. Deploy worker v2 first, then apply the drop-in to Gujarat, then lock `admin/api_keys` and rotate the keys.
7. Other Firebase projects found inside tools (jobplacementsocial, k-spider-social-media): their Firestore / RTDB rules must be audited. Social AI says "100% private, local storage" but its code uses Firestore.
8. About 15 tools are not uploaded yet; their index text is unchanged until the next batch.
