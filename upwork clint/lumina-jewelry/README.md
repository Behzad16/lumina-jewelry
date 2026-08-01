# Lumina Jewelry — Website

A complete, responsive, high-converting storefront for a luxury jewelry brand.
Built as a **zero-dependency static site**: plain HTML, CSS and JavaScript, no build
step, no framework, no npm install. Open `index.html` in a browser and it runs.

---

## 1. What's here

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | Hero, trust strip, collections, best sellers / new arrivals / under $500 tabs, story, testimonial carousel, Instagram grid, newsletter |
| Shop | `shop.html` | Filter by category, collection, price, sale, new · sort · search · load more · shareable filtered URLs |
| Product detail | `product.html?p=<handle>` | Gallery, metal & size options, quantity, add to bag, wishlist, accordions, review summary + review form, related products |
| About | `about.html` | Story, stats, values, atelier process, team |
| Contact | `contact.html` | Validated contact form, studio details, hours, map link |
| FAQ | `faq.html` | 24 questions in 6 sections, accordion, deep-linkable |
| Privacy Policy | `privacy.html` | |
| Terms & Conditions | `terms.html` | |
| Not found | `404.html` | Branded, with best sellers |
| Admin panel | `admin.html` | Catalogue manager — see §11 |

Supporting files: `sitemap.xml`, `robots.txt`, `site.webmanifest`, `netlify.toml`,
`vercel.json`.

### File layout

```
lumina-jewelry/
├── index.html  shop.html  product.html
├── about.html  contact.html  faq.html
├── privacy.html  terms.html  404.html
├── admin.html
├── sitemap.xml  robots.txt  site.webmanifest
├── netlify.toml  vercel.json
└── assets/
    ├── css/styles.css      one stylesheet, sectioned and commented
    ├── css/admin.css       admin panel only
    ├── js/data.js          the product catalogue — the only file most edits touch
    ├── js/main.js          shared: header, drawers, cart, wishlist, search, forms, animation
    ├── js/shop.js          shop filtering / sorting / pagination
    ├── js/product.js       product detail page + structured data
    ├── js/admin.js         admin panel
    └── img/                36 SVG placeholders (see §4)
```

---

## 2. Running it locally

No tooling required — double-click `index.html`.

If you want it served over HTTP (recommended, and required if you add anything
that uses `fetch`), any static server will do:

```bash
npx serve .
```

---

## 3. Deploying

### Netlify (recommended)
Drag the `lumina-jewelry` folder onto <https://app.netlify.com/drop>, or connect
the repo — `netlify.toml` is already configured (no build command, security
headers, cache headers, pretty-URL redirects, 404 handling).

### Vercel
`vercel.json` is included. Import the repo, framework preset **Other**, leave the
build command empty and the output directory as the root.

### Any host
It is static — upload the folder to S3, Cloudflare Pages, or shared hosting as-is.

**After deploying:** search-and-replace `https://www.luminajewelry.com/` with the
real domain across the `.html` files, `sitemap.xml` and `robots.txt`. That string
appears in canonical tags, Open Graph URLs and structured data.

---

## 4. Images

`assets/img/` holds 36 hand-generated SVG placeholders — gold line art on
champagne, ivory, blush, stone and onyx backgrounds. They are deliberately
lightweight (about 1 KB each) and elegant, but they are **placeholders for real
product photography**.

To swap in real photos, keep the same filenames and aspect ratios:

| Files | Aspect | Used for |
|---|---|---|
| `ring-1…5`, `necklace-1…5`, `earring-1…5`, `bracelet-1…5` | 1:1 | Product cards and PDP galleries |
| `hero.svg` | ~16:10 | Home hero |
| `collection-aurora/celeste/eclat.svg` | 3:4 | Featured collection cards |
| `story-atelier.svg`, `story-craft.svg` | 4:5 | About / home story blocks |
| `team-1…3.svg` | 3:4 | Team portraits |
| `insta-1…6.svg` | 1:1 | Instagram grid |
| `og-cover.svg` | 1200×630 | Social sharing card |

If you switch to `.jpg`/`.webp`, update the paths in `assets/js/data.js`
(`L.galleries` object) and in the `<img src>` attributes of the HTML pages. Keep the
`width`/`height` attributes accurate — they prevent layout shift.

Product photography specifically: shoot square, on a light neutral background,
1600×1600 or larger. You don't need to resize before uploading — the admin panel
does it for you (§12).

---

## 5. Editing the catalogue

Everything about products lives in **`assets/js/data.js`**. Add a product by
copying an existing `make({...})` block:

```js
make({
  id: 21, handle: 'aurora-halo-ring', name: 'Aurora Halo Ring',
  category: 'rings',            // rings | necklaces | earrings | bracelets
  collection: 'aurora',         // aurora | celeste | eclat | heritage
  price: 1150, compareAt: null, // compareAt renders a strikethrough + save badge
  rating: 4.8, reviews: 41,
  badges: ['new'],              // 'new' and/or 'bestseller'
  tags: ['halo', 'engagement'], // searchable keywords
  added: '2026-07-15',          // drives "newest first" sorting
  excerpt: 'One line for search results and meta descriptions.',
  description: 'A paragraph for the product page.',
  details: ['Bullet one', 'Bullet two']
})
```

The new product then appears automatically in the shop, filters, search, sitemap
candidates and related-product logic. Remember to add its URL to `sitemap.xml`.

Other things you may want to change in `data.js`: `L.testimonials` (home page
carousel) and `L.reviews` (per-product reviews, keyed by handle).

Global settings elsewhere:
- Free-shipping threshold — `FREE_SHIPPING` at the top of `assets/js/main.js`
- Products per page on the shop — `PAGE_SIZE` at the top of `assets/js/shop.js`
- Colours, fonts, spacing — the `:root` custom properties in `assets/css/styles.css`

---

## 6. Forms

Both the contact form and the newsletter form are marked `data-demo`, which means
they validate fully and show a success message **without** submitting anywhere.
That keeps the demo self-contained.

To make the contact form live on Netlify, delete `data-demo` from the `<form>` tag
in `contact.html`. Everything else Netlify Forms needs (`data-netlify="true"`, the
hidden `form-name` input, and the honeypot) is already in place; submissions will
appear under **Forms** in the Netlify dashboard.

For any other host, point the form at your endpoint (Formspree, Basin, your own
API) with `action` and `method`, and remove `data-demo`.

The newsletter form should be wired to your email platform (Klaviyo, Mailchimp,
Omnisend) — replace the form element with the embed snippet they give you, or POST
to their API.

---

## 7. What is and isn't wired up

**Working, no back end needed:** product browsing, search, filtering, sorting,
cart (persisted in `localStorage`), wishlist (persisted), quantity editing,
free-shipping progress, review submission (stored locally), form validation,
all animations and responsive behaviour.

**Needs a service before launch:**
- **Checkout.** Stripe Checkout is wired up and ready — it needs your API key and
  one deploy to go live. See §14.
- **Contact / newsletter delivery** (see §6).
- **Analytics.** Nothing is loaded today. If you add GA4, Meta Pixel or similar,
  you also need a cookie consent banner — the privacy policy already promises that
  analytics and marketing cookies are only set after consent.
- **Legal review.** `privacy.html` and `terms.html` are thorough, well-structured
  drafts written for a US direct-to-consumer jewelry business. Have an attorney
  review them before taking real orders.

Placeholder details to replace throughout: the address (148 Greene Street),
phone (+1 212-555-0184), emails (`care@` / `privacy@luminajewelry.com`) and the
social media URLs.

---

## 8. Performance & SEO

- No frameworks, no jQuery, no CSS libraries. One stylesheet (47 KB) plus two or
  three small scripts per page — roughly 100 KB of text uncompressed, about 25 KB
  over the wire once your host gzips it. The only external request is Google
  Fonts, preconnected and loaded with `display=swap`.
- The 36 SVG placeholders total 52 KB for the whole site — around 1.4 KB each.
- All below-the-fold images are `loading="lazy"` with explicit dimensions; the
  hero is preloaded with `fetchpriority="high"`.
- Semantic HTML with one `<h1>` per page, descriptive `alt` text throughout.
- Unique title and meta description on every page, plus canonical URLs and Open
  Graph / Twitter cards.
- Structured data: `Organization` + `WebSite` (with SearchAction) on the home page,
  `BreadcrumbList` on shop and product, `Product` with offers and aggregate rating
  on every product page, `FAQPage` on the FAQ, `ContactPage`/`JewelryStore` on
  contact, `AboutPage` on about.
- `sitemap.xml` covers all pages, categories, collections and 20 products;
  `robots.txt` points at it and blocks low-value filter permutations.

To self-host the fonts (removes the last third-party request and shaves ~150ms),
download the two families, drop the `.woff2` files into `assets/fonts/`, and
replace the Google Fonts `<link>` with `@font-face` rules in `styles.css`.

---

## 9. Accessibility

Skip link, visible focus rings, full keyboard operation, focus trapping in
drawers, Escape to close, ARIA on tabs / accordions / drawers / toggles,
`aria-live` regions for cart and toast updates, labelled form fields with inline
error messages, and a `prefers-reduced-motion` block that disables all animation.

---

## 10. Porting to Shopify

The brief mentioned Shopify as a platform preference. This build is deliberately
structured so that port is mechanical rather than a rewrite:

| Static site | Shopify equivalent |
|---|---|
| Repeated `<header>` / `<footer>` markup | `sections/header.liquid`, `sections/footer.liquid` |
| `assets/js/data.js` | Shopify products — delete the file, the data comes from Liquid |
| `LUMINA.productCard()` | `snippets/product-card.liquid` |
| `shop.html` + `shop.js` | `templates/collection.liquid` with native `filter.v.price` / tag filters |
| `product.html` + `product.js` | `templates/product.liquid` (variants replace the metal/size swatches) |
| Cart drawer in `main.js` | `/cart.js` AJAX API — same drawer markup, different data source |
| Review form | Shopify Product Reviews, Judge.me or Okendo |
| `faq.html`, `about.html`, legal pages | Pages with `page.content` |

The CSS transfers unchanged — it has no dependency on where the markup comes from.

---

## 11. Admin panel

Open **`admin.html`**. Default passcode: **`lumina-admin`** — change it under
*Data & settings* the first time you sign in.

### Read this first: the passcode is not security

There is no server here, so the passcode check runs in the visitor's own browser
and `assets/js/admin.js` is a public file. Anyone determined can read the code and
bypass the gate. It stops casual snooping and nothing more.

Because the panel only edits a local copy of the catalogue, a bypass cannot damage
your live site — the worst case is that someone reads your product data, which is
already public. But **do not** treat it as a login, and never put anything
confidential behind it.

Pick one of these before going live:

1. **Don't deploy it (simplest and safest).** Run the panel locally against your
   working copy, export `data.js`, commit, deploy. `netlify.toml` has a
   commented-out redirect that 404s `/admin.html` in production — uncomment it.
2. **Cloudflare Access** — free for up to 50 users. Put your site behind Cloudflare,
   add an Access application for the `/admin.html` path, and require an email
   one-time PIN or your Google Workspace account.
3. **Netlify password protection / Netlify Identity** — password protection is a
   paid plan feature; Identity plus role-gating works on lower tiers.
4. **Vercel Deployment Protection** — password protection on Pro.

Either way `robots.txt` disallows the page and both host configs send
`X-Robots-Tag: noindex`, so it stays out of search results.

### What it does

| Section | Purpose |
|---|---|
| Dashboard | Live/hidden counts, stock value, average rating, low-stock list, latest reviews |
| Home page | Hero headline, eyebrow, paragraph and both buttons (§13) |
| Media | Every non-product photo on the site (§13) |
| Products | Add, edit, duplicate, hide/show and delete products; search and filter |
| Testimonials | Manage the home page carousel quotes |
| Reviews | See and delete reviews submitted through product pages |
| Subscribers | Newsletter signups, with CSV export |
| Data & settings | Publish, back up, restore, change passcode, discard changes |

### How publishing works

This is the part worth understanding. Edits save instantly to your browser's local
storage, and the storefront reads them — so **you can preview every change on the
real site** before anyone else sees it. While unpublished edits exist, a "Draft
preview" badge appears on the storefront so you never mistake it for the live state.

To publish for real visitors:

1. Go to **Data & settings → Publish changes**
2. Click **Download data.js**
3. Replace `assets/js/data.js` in the project with the downloaded file
4. Commit and redeploy

The generated file is a complete, working `data.js` — it carries over the helper
functions from the running code, so it stays in step with the rest of the site.

**Discard unpublished changes** in the danger zone reverts your browser to whatever
is in the deployed `data.js`. Anything you already published is untouched.

### Hidden products

Hiding a product removes it from the shop, search, home page and related products,
and its product page returns "we couldn't find that piece". New products start
hidden so you can write the copy before anyone sees them. Remember to remove a
deleted product's URL from `sitemap.xml`.

### Limits

Everything in the panel lives in one browser: edits, reviews and subscribers do not
sync between your laptop and your phone, and clearing site data wipes them. Take a
JSON backup from *Data & settings* before clearing anything.

Reviews and subscribers shown here are only the ones captured in demo mode. Once you
connect a real review service and email platform (§6, §7), those become the source
of truth and these lists stop being meaningful.

---

## 12. Uploading product photos

The product editor has a real photo picker: click **Choose a photo** or drag one
onto the drop zone, for both the main photo and the gallery. Select several at once
for the gallery.

### What happens to a photo you choose

There is no server to upload to, so the browser does the work:

1. The file is decoded and **resized so its longest side is 1200px**
2. It is **re-encoded as WebP** (or JPEG on browsers that can't write WebP) at
   quality 0.82
3. The result is stored with the product and appears across the site immediately

A 2.2 MB camera PNG typically comes out between 15 KB and 200 KB depending on the
subject. You do not need to resize or compress anything beforehand.

### Publishing photos

Uploaded photos start life embedded in the catalogue, which is fine for previewing
but not for a live site. Publish everything at once with **Data & settings →
Download site update (.zip)** — see §13. That archive contains the image files, a
rebuilt `data.js` that references them by path, and any changed HTML pages. Unzip
it over your project folder and deploy.

There's also a *Product photos only* button plus a **"Reference uploaded photos as
files"** checkbox if you'd rather handle `data.js` separately. Leave that box
ticked: with it on, the exported `data.js` points at `assets/img/…` instead of
embedding the images. In testing that took the file from 101 KB down to 40 KB with
only three photos — across a full catalogue it's the whole site's performance.

Unticking it keeps the images embedded in `data.js`. That works and skips the zip
step, but the file grows by roughly a third of the total photo size and blocks
rendering while it downloads. Only do that for a quick demo.

### Linking instead of uploading

Under each picker there's **"Or link to a file already in assets/img"** for photos
you've already put in the project. Linked images show a *linked* tag and are passed
through untouched.

### Storage limits

Uploaded photos live in `localStorage`, which browsers cap at about **5 MB**. Data &
settings shows a usage meter. That is roughly 30–50 compressed photos — comfortable
for editing a few products at a time, not for uploading an entire catalogue in one
sitting.

If you hit the limit a save will fail and you'll be told so. The fix is always the
same: publish what you have (zip → `assets/img/` → new `data.js` → deploy), then
**Discard unpublished changes** to clear the space. Once photos are real files in
`assets/img/`, they cost no browser storage at all.

### A note on structured data

Product JSON-LD only lists images that are real file paths — an embedded data URI
would be invalid to Google. So product photos only reach search results after you
publish them properly.

---

## 13. Editing site photos and the hero

Product photos live on each product (§12). **Every other photo on the site** is
managed in one place: **Media**.

### Media

A grid of all 16 site images, grouped by where they appear, each with a preview:

| Group | Images |
|---|---|
| Home page | Hero banner, three collection cards |
| Instagram grid | Six tiles |
| Home page & About | Story photo — the atelier |
| About page | Story photo at the bench, three team portraits |
| Every page | Social sharing card (the preview when your link is posted) |

Click **Choose photo** on any card. It is resized and compressed exactly like a
product photo — the hero at 2000px, collection and story shots at 1400px, portraits
at 1200px, Instagram tiles at 900px — and appears across the site immediately.
**Reset** puts the published photo back.

Images are keyed by their published path, so replacing one updates **every page
that uses it**. The atelier photo appears on both the home page and the About page;
replace it once and both change.

### Hero copy

**Home page** edits the text over the hero: eyebrow, both headline lines (the
second is the italic gold one), the paragraph, and both button labels and links.
Changes save as you type. `index.html` remains the source of truth — these are
unpublished edits painted over it, so the published copy is always what search
engines read.

### Publishing

One button: **Data & settings → Download site update (.zip)**. It contains only
what changed:

- new image files under `assets/img/`
- every HTML page that referenced a replaced image, rewritten to point at the new
  filename — including the hero's `<link rel="preload">` and the `og:image` meta tags
- `index.html` with your hero copy written in
- `assets/js/data.js` if the catalogue changed

Unzip it over your project folder keeping the folder structure, then deploy. Then
use **Discard unpublished changes** to clear the browser storage.

### Two things to know

**This needs http, not `file://`.** Rewriting the pages means reading them, and
browsers block that for local files. Open the panel through a local server or your
deployed site. You'll get a clear message rather than a silent failure if you don't.

**The favicon isn't in Media.** It's `assets/img/favicon.svg`, referenced from every
page's `<head>`. Replace the file directly — and keep it SVG or ICO, since browsers
won't take a WebP favicon.

---

## 14. Checkout (Stripe)

Checkout is built and tested. It needs your Stripe key and one deploy to go live.

### How it works

```
Browser                    Serverless function              Stripe
cart (handles + qty)  →    prices it from                →  hosted checkout page
                           lib/catalogue.js                  ↓
order-confirmed.html  ←──────────────────────────────────── customer pays
```

The browser **never sends prices**. It sends handles, quantities and the chosen
metal and size; the function looks up every price in `lib/catalogue.js` on the
server. A customer editing the page cannot change what they are charged — this is
tested, and a cart claiming `price: 1` for the $1,890 solitaire is still charged
$1,890.

Card details never touch this site. Customers pay on Stripe's own hosted page, so
you get PCI compliance, Apple Pay and Google Pay without handling card data.

### Files

| File | Purpose |
|---|---|
| `lib/checkout.js` | Builds the Stripe session; shared logic |
| `lib/catalogue.js` | Server-side price list — regenerated by the admin panel |
| `netlify/functions/create-checkout-session.js` | Netlify entry point |
| `api/create-checkout-session.js` | Vercel entry point |
| `order-confirmed.html` | Thank-you page; clears the bag |

There is no npm dependency — the function calls Stripe's REST API with `fetch`, so
the project still has no build step. The front end always calls
`/api/create-checkout-session`; Vercel serves that path natively and `netlify.toml`
rewrites it to the function.

### Going live

1. Create a Stripe account and finish the business details Stripe asks for.
2. Copy your **secret key** from the Stripe dashboard (Developers → API keys). Use
   the **test** key first — it starts `sk_test_`.
3. Add it to your host as an environment variable named `STRIPE_SECRET_KEY`:
   - **Netlify** — Site configuration → Environment variables
   - **Vercel** — Project → Settings → Environment variables
4. Optionally set `SITE_URL` to your canonical address (e.g.
   `https://www.luminajewelry.com`) so the success and cancel links are always
   right, even behind a proxy.
5. Redeploy. Buy something with Stripe's test card `4242 4242 4242 4242`, any
   future expiry and any CVC.
6. When you're happy, swap in the live key (`sk_live_`) and redeploy.

**Never put the secret key in the repo.** It belongs only in the host's environment
variables. If it ever leaks, roll it in the Stripe dashboard immediately. The site
needs no publishable key at all, because customers are redirected rather than
paying inline.

Until the key is set, the button says "Checkout is not connected yet" rather than
failing silently.

### Shipping

The function offers rates matching what the site promises: free express over $250,
otherwise $12, plus $28 overnight on every order. Change these in the `shipping`
block of `lib/checkout.js` — and keep `FREE_SHIPPING_CENTS` there in step with
`FREE_SHIPPING` at the top of `assets/js/main.js`.

**Worth knowing:** your cheapest piece is $260, above the $250 threshold, so every
possible order already ships free and the "$12 under $250" rate can never apply. The
progress bar in the cart is likewise always full. Either raise the threshold so it
means something, or drop the condition and simply say shipping is free.

### Keeping prices in sync

When you change a price in the admin panel, the site-update zip includes **both**
`assets/js/data.js` and `lib/catalogue.js`. Deploy both. If they drift, the
displayed price and the charged price disagree — the server always wins, and a
handle missing from `lib/catalogue.js` is rejected at checkout.

### What is still not built

Stripe handles payment, receipts and refunds. It does **not** do these for you:

- **Order notifications to you.** Add a Stripe webhook for
  `checkout.session.completed` to email the atelier, or just watch the Stripe
  dashboard at first.
- **Sales tax.** Not enabled. Turn on Stripe Tax and set
  `automatic_tax: { enabled: true }` in `lib/checkout.js`, or register and collect
  manually. Get advice on your nexus obligations.
- **Stock.** Nothing decrements the stock count in the admin panel after a sale.
  Adjust it manually, or move to a real commerce backend once volume justifies it.

---

*Built for Sarah Williams · Lumina Jewelry*
