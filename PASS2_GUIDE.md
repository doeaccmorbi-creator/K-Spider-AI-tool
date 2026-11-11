# Pass 2 — upload, vendor requests, Net Protector aur Firestore rules

## 1. Pass 2 upload (26 files)
Pass 1 me debugger trap, F12/right-click block aur DevTools lock hataye the.
Pass 2 me bachi hui ek aur malware-jaisi harkat hatayi: **clipboard overwrite**.
- Copy karne par user ke clipboard me "K Spider AI Tool - kspiderai.in" likh dena
- PrintScreen dabane par clipboard overwrite karna

Ye "clipboard hijacking" jaisa behaviour hai, isliye scanners ko shak hota hai.
Baaki sab same (copy/select protection, login, tools, payment).

Upload: `kspider-security-fix-pass2.zip` extract -> GitHub **Add file -> Upload files** -> folder structure ke saath drag -> Commit.
Test: dono passes ke baad browser me Chromium test kiya: debugger pause 2 -> 0, JS errors 0, page content same.
228 scripts ka syntax check pass.

Deploy ke baad apni site par **Ctrl+U** dabao aur `debugger` search karo. Ab kuch nahi milna chahiye.

## 2. Vendors ko bhejne wala text (PEHLE WALA TEXT GALAT THA, ye use karo)
Pichhle README me "Razorpay" likha tha. Live site par asal me **manual UPI payment** hai, isliye wo line mat bhejna.

> Our website https://kspiderai.in is a legitimate free AI tools platform for Indian users, run by
> Gaurang Raval and Khush Raval (K Spider for Kreation, Gujarat, India). It is hosted on GitHub Pages;
> sign-in is Google Sign-In only. Paid plans are processed manually via UPI, and our refund policy,
> privacy policy and terms are published at https://kspiderai.in/legal/index.html. The site was
> flagged as phishing, most likely because of an anti-debugging / anti-inspection script and a
> clipboard handler, both of which we have now fully removed. Please re-scan and reclassify the
> domain as safe. Contact: kspider221206@gmail.com

Jaha form me screenshot maange, Net Protector wali block-page ka screenshot lagao.

## 3. Kahan bhejna hai
- **BitDefender:** unka "submitting sample files and websites for analysis" page (support.bitdefender.com / bitdefender.com par search karo).
- **ESET:** unki FAQ ke hisaab se email bhejo, subject me `Domain whitelist kspiderai.in`, body me full URL aur block ka screenshot.
- **Fortinet:** FortiGuard Web Filter lookup par `kspiderai.in` dalo -> "Submit Review Request".
- **Sophos, Webroot, Forcepoint, alphaMountain, G-Data, VIPRE, Mimecast, CyRadar, Lionic, Seclookup, Chong Lua Dao:**
  har ek ki site par "URL reclassification / false positive / URL review" form dhundo.
- Har vendor ko **ek hi baar** bhejo. Baar-baar bhejne se review slow hota hai.
- Review me 1-7 din lag sakte hain. Jab tak koi vendor flag kare, uska maamla pending hai.

## 4. Net Protector (NPAV) ko kaise bhejein
Mujhe unka koi public "false positive" form nahi mila. Ye raasta hai:
1. npav.net par **Help / Support** page kholo aur **ticket submit** karo.
2. Ya email: `help@npav.net` (ye address directory sites par mila hai, bhejne se pehle npav.net ke Help page par confirm kar lena).
3. Ya NPAV ke customer support WhatsApp/phone par (number npav.net par dekho).
4. Message: upar wala English text + "Net Protector Web Protection blocked http://kspiderai.in/ with 'Malware Domain has been detected'. Please whitelist / re-evaluate the domain." + block-page screenshot.
5. Tab tak apne PC par Net Protector me kspiderai.in ko Exclusion/Whitelist me daal do.

## 5. Abhi bhi kyu flag ho sakta hai (maine ye content nahi badla)
Live homepage padhne par ye cheezein fraud-classifiers ko shak de sakti hain:
- Manual UPI payment (`9099928877@pthdfc`) + UTR collect karna
- Homepage par login/register overlay ("Continue with Google")
- "How to Earn Money", Franchise commission, "GAME CHANGER", "jackpot" jaisi tez marketing language
- Cut-price dikhana (₹5,999 -> ₹2,999)

Ye tumhare business features/copy hain, isliye bina puche nahi badle. Agar reclassification ke baad bhi 2-3 vendor flag karte rahein,
to batana, main sirf wording soften karne wala safe patch bana dunga.

## 6. Firestore rules (v8.11) — mera review
**Maine rules file me kuch nahi badla**, kyunki tumhari site/tools ke 15+ pages `/users` aur `/admin` ko seedha browser se padhte hain.
Bina Firebase Rules Playground/emulator test ke koi bhi tightening kisi tool ko tod sakti hai.

### CRITICAL
**`/admin/api_keys` publicly readable hai.** Rule `match /admin/{docId} { allow read: if true; }` hai, aur admin panel me
Groq/Gemini/Claude/OpenAI ki asli API keys isi document me save hoti hain. Tools (35 files Anthropic ko, 30 files Groq ko seedha browser se call karte hain)
ye keys browser me padhte hain. Matlab koi bhi (Firebase config repo me public hai) ye keys Firestore se padh sakta hai.
- Abhi ke liye (feature tode bina): har provider dashboard me **monthly spend limit + usage alert** lagao. Gemini key ko Google Cloud me **HTTP referrer = kspiderai.in** tak restrict karo.
- Keys abhi rotate karna safe hai: tools keys runtime par admin panel se padhte hain, to naya key admin panel me daalo, code badalne ki zaroorat nahi.
- Asli fix: AI calls ko Cloudflare Worker proxy se karwana (repo me `worker.js` aur 23 files me proxy reference pehle se hai), phir `api_keys` ko admin-only karna. Ye alag, tested project hai, bol do to main plan bana dunga.

### HIGH
`isOwner()` me `|| true` laga hai. Isse:
- `/users/{koi bhi}` (naam, email, mobile, city, plan) koi bhi padh sakta hai, aur non-locked fields badal sakta hai.
- `/user_api_keys/*` koi bhi padh/likh sakta hai.
- `/students`, `/instituteRequests`, `/rto_agent_requests` (phone numbers wale forms) bhi public read hain.
Ye DPDPA ke hisaab se risk hai. Tightening ke liye pehle har tool ka login flow test karna hoga ("Phase B", jo tumhari file me bhi likha hai).

### Ek safe fix (sirf is repo ke code ke hisaab se)
`user_api_keys` collection ko is repo me sirf `admin.html` use karta hai. Rules me ye block:

```
match /user_api_keys/{safeEmailId} {
  allow read:   if isAdmin() || isOwner(safeEmailId);
  ...
}
```
ko is se replace kar do:

```
match /user_api_keys/{safeEmailId} {
  allow read, write: if isAdmin();
}
```
Is se admin panel waise hi chalega, par bahar ke log users ki API keys nahi padh paayenge.
Publish karne ke baad admin panel me "User API Keys" section ek baar kholke check kar lena.

### Achhi cheezein
Plan/payment fields user khud nahi badal sakta, `isAdmin()` me `email_verified` check hai, `/otp_store` admin-only hai, `/payments` sirf pending request banne deta hai.

### Chhoti baat
Repo ki `firestore.rules` file purani (v7.4) hai, jabki tumhari deployed file v8.11 hai. Repo me v8.11 wali file daal do taaki dono match karein.
