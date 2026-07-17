# MaterialIQ — Chrome Web Store submission kit

Everything you paste into the Chrome Web Store Developer Dashboard lives here.
Upload artifact: **`MaterialIQ-chrome-store-v1.0.0.zip`** (repo root).

---

## 1. Store listing tab

**Item name**
```
MaterialIQ: is it worth the price?
```

**Summary** (short description, max 132 chars)
```
See if a product is worth its price, judged on material quality, construction, and comparable pricing. No hype, just the numbers.
```

**Category:** Shopping

**Language:** English (United States)

**Detailed description** (paste as-is)
```
Ever stared at a $60 t-shirt and wondered if it's actually any good, or just marked up?

MaterialIQ reads the product page you're on and gives you a straight answer: a value
score built from what the garment is actually made of, how it's constructed, and how
its price compares to similar products.

HOW IT WORKS
- Open a product page on a supported store.
- MaterialIQ reads the material composition, price, and construction details already
  on the page.
- You get a clear score, a plain-English verdict, and a cost-per-wear estimate, right
  in the popup or Chrome's side panel.

WHY IT'S DIFFERENT
- The score is rules-based and transparent. The same product always gets the same
  score, and you can read the exact methodology in the extension's options page.
- No hype, no sponsored rankings, no "best of" fluff. It works for you, the shopper.
- It runs on your device. By default, nothing about what you browse is sent anywhere.

WHAT IT LOOKS AT
- Fiber content and material quality (natural vs. synthetic, blends, weight).
- Construction signals available on the page.
- Price versus comparable products.
- Cost-per-wear, so a higher price isn't automatically a worse deal.

PRIVACY FIRST
MaterialIQ does its scoring locally in your browser. It does not track you, show ads,
or sell your data. An optional AI review-summary feature is off by default; if you turn
it on, only the product URL and publicly visible review text are sent to generate a
summary. Full details: [YOUR PRIVACY POLICY URL]

Best results today on Uniqlo, H&M, and Amazon product pages, with a general fallback on
other stores that publish standard product data.
```
> Replace `[YOUR PRIVACY POLICY URL]` with the live link (see section 4).

---

## 2. Graphics assets you still need to upload

| Asset | Required? | Size | Status |
|---|---|---|---|
| Store icon | Yes | 128×128 PNG | DONE — `dist/icons/icon-128.png` |
| Screenshots | Yes (≥1, up to 5) | 1280×800 or 640×400 PNG/JPG | **TODO — you must capture these** |
| Small promo tile | Optional | 440×280 | Optional |
| Marquee promo tile | Optional | 1400×560 | Optional |

**Screenshots are the one hard blocker left.** Fastest way to get them:
1. `npm run build`, then in Chrome go to `chrome://extensions`, enable Developer mode,
   "Load unpacked", select the `dist/` folder.
2. Open a Uniqlo / H&M / Amazon t-shirt product page.
3. Open the MaterialIQ popup and side panel showing a real score.
4. Screenshot at 1280×800 (macOS: Cmd+Shift+4, or resize window). Aim for 3–5 shots:
   the score card, the cost-per-wear detail, the "better options" list, and the
   methodology/options page.

(If you want, I can drive Chrome to capture these for you — just say so and load the
unpacked extension first.)

---

## 3. Privacy tab — this is where broad permissions get approved or bounced

### Single purpose (paste)
```
MaterialIQ has one purpose: to evaluate a retail product the user is currently viewing
and show a transparent value score based on its material composition, construction, and
comparable pricing.
```

### Permission justifications
Paste each of these into its matching field.

**activeTab**
```
Used to read the product details (title, price, material composition) of the page the
user is actively viewing so the extension can score that product. Only accessed when the
user is on a product page.
```

**scripting**
```
Used to inject the content script that reads on-page product data and renders the score
inline. It only reads public product information already visible on the page.
```

**storage**
```
Used to save the user's own settings locally (for example, whether the optional AI review
summary feature is enabled). No browsing data is stored or transmitted.
```

**sidePanel**
```
Used to display the product's value score in Chrome's side panel so the user can keep it
open while browsing a product.
```

**Host permission `*://*/*` (broad access) — reviewers WILL ask about this**
```
MaterialIQ works across online stores, so it needs to run on retail product pages
wherever the user shops. It has calibrated support for Uniqlo, H&M, and Amazon, and a
general fallback that reads standard structured product data (schema.org / Open Graph)
on other retail sites. The content script only reads publicly visible product fields
(title, price, material composition, and shown reviews) to compute a value score. It does
not read passwords, form inputs, payment fields, or any content unrelated to product
scoring, and by default it transmits nothing off the device.
```
> Note: broad host access lengthens review. If approval stalls, the drop-in alternative
> is to scope `host_permissions` and `content_scripts.matches` in `src/manifest.ts` to
> `*://*.uniqlo.com/*`, `*://*.hm.com/*`, `*://*.amazon.com/*` and resubmit — the code
> already picks adapters by hostname, so nothing else changes.

**Remote code:** Answer **"No, I am not using remote code."** All logic is bundled in the
package; the optional summary feature calls your own API but executes no remote code.

### Data usage disclosures (check these)
- Does your item collect user data? **Yes** (product page content is read to function).
- Data types: **"Website content"** (the product page data it reads).
- Personally identifiable info, health, financial, authentication, location, web history,
  personal communications: **None of these.**
- Certify: data is **not** sold to third parties; **not** used for purposes unrelated to
  the item's single purpose; **not** used for creditworthiness/lending.

### Privacy policy URL (required)
```
https://[YOUR-RAILWAY-DOMAIN]/privacy.html
```
See section 4.

---

## 4. Privacy policy — already built, just deploy + grab the URL

A branded policy page now lives at `web/public/privacy.html` and builds to
`web/dist/privacy.html`. Your Railway server already serves `web/dist` statically, so
after your next deploy it will be live at:
```
https://<your-railway-domain>/privacy.html
```
Steps:
1. Commit + push (Railway auto-deploys), or redeploy.
2. Open the URL in a browser to confirm it loads.
3. Paste that URL into (a) the Privacy tab's policy field and (b) the `[YOUR PRIVACY
   POLICY URL]` slot in the detailed description above.

---

## 5. Final pre-submit checklist
- [ ] Deploy web so `/privacy.html` is live; copy the real URL.
- [ ] Capture 1–5 screenshots (1280×800).
- [ ] Dashboard → Upload new package → `MaterialIQ-chrome-store-v1.0.0.zip`.
- [ ] Paste name, summary, description, category.
- [ ] Upload icon (auto from manifest) + screenshots.
- [ ] Fill single purpose + all permission justifications (section 3).
- [ ] Set data-usage disclosures + privacy policy URL.
- [ ] Submit for review.

Deferred on purpose (not needed for this launch): AI review summaries stay off by
default, and Skimlinks affiliate monetization is not wired into this build.
