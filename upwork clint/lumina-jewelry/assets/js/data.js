/* ==========================================================================
   Lumina Jewelry — Catalogue data
   Single source of truth for products, reviews and taxonomy.
   Swap this file for a real API/Shopify Storefront response at go-live;
   every consumer reads through LUMINA.products / LUMINA.getProduct().
   ========================================================================== */
window.LUMINA = window.LUMINA || {};

(function (L) {
  'use strict';

  L.currency = { code: 'USD', symbol: '$' };

  L.categories = [
    { slug: 'rings', label: 'Rings' },
    { slug: 'necklaces', label: 'Necklaces' },
    { slug: 'earrings', label: 'Earrings' },
    { slug: 'bracelets', label: 'Bracelets' }
  ];

  L.collections = [
    { slug: 'aurora', label: 'Aurora', blurb: 'Brilliant-cut stones set in warm 18k gold.' },
    { slug: 'celeste', label: 'Celeste', blurb: 'Delicate, celestial pieces made for layering.' },
    { slug: 'eclat', label: 'Éclat', blurb: 'Sculptural gold, polished to a mirror finish.' },
    { slug: 'heritage', label: 'Heritage', blurb: 'Timeless heirlooms, reworked for today.' }
  ];

  L.metals = [
    { slug: 'yellow-gold', label: '18k Yellow Gold', hex: '#c9a227' },
    { slug: 'white-gold', label: '18k White Gold', hex: '#d9dbdd' },
    { slug: 'rose-gold', label: '18k Rose Gold', hex: '#dfa48a' }
  ];

  var img = function (n) { return 'assets/img/' + n + '.svg'; };

  /* Gallery sets — placeholder art per category.
     Replace each array with the product's real photography (same order). */
  L.galleries = {
    rings: [img('ring-1'), img('ring-2'), img('ring-3'), img('ring-5')],
    necklaces: [img('necklace-1'), img('necklace-2'), img('necklace-3'), img('necklace-5')],
    earrings: [img('earring-1'), img('earring-2'), img('earring-3'), img('earring-5')],
    bracelets: [img('bracelet-1'), img('bracelet-2'), img('bracelet-3'), img('bracelet-5')]
  };

  L.sizeSets = {
    rings: ['5', '6', '7', '8', '9'],
    necklaces: ['16"', '18"', '20"'],
    earrings: ['One size'],
    bracelets: ['S', 'M', 'L']
  };

  /* Fills in every derived field from a bare product record. Kept on L (and
     free of closure variables) so the admin panel can re-run it, and so an
     exported data.js can carry it across verbatim. */
  L.normalise = function (p) {
    var gal = L.galleries[p.category] || L.galleries.rings;
    return {
      id: p.id,
      handle: p.handle,
      name: p.name,
      category: p.category,
      collection: p.collection,
      price: p.price,
      compareAt: p.compareAt || null,
      rating: p.rating,
      reviews: p.reviews,
      badges: p.badges || [],
      tags: p.tags || [],
      stock: typeof p.stock === 'number' ? p.stock : 12,
      sku: 'LUM-' + String(p.id).padStart(4, '0'),
      image: p.image || gal[0],
      gallery: p.gallery || gal,
      metals: p.metals || ['yellow-gold', 'white-gold', 'rose-gold'],
      sizes: L.sizeSets[p.category] || L.sizeSets.rings,
      excerpt: p.excerpt,
      description: p.description,
      details: p.details,
      care: p.care || 'Store in the pouch provided. Remove before swimming, bathing or exercise. Polish gently with the enclosed cloth.',
      added: p.added,
      hidden: p.hidden === true
    };
  };

  var make = L.normalise;

  L.products = [
    /* — Rings ————————————————————————————————————————————————— */
    make({
      id: 1, handle: 'aurora-solitaire-ring', name: 'Aurora Solitaire Ring',
      category: 'rings', collection: 'aurora', price: 1890, rating: 4.9, reviews: 128,
      badges: ['bestseller'], tags: ['engagement', 'diamond', 'classic'], added: '2025-09-14',
      excerpt: 'A single brilliant-cut stone raised on a whisper-thin 18k band.',
      description: 'The piece our atelier is known for. A 0.75ct brilliant-cut stone sits in a six-prong basket that lifts it clear of the finger, so light reaches it from every angle. The band tapers to 1.8mm at the back — barely there, and comfortable enough to wear through a working day.',
      details: ['0.75ct brilliant-cut lab-grown diamond, VS1 clarity', 'Six-prong basket setting', '18k solid gold band, 1.8mm tapered', 'Hand-set and polished in our New York atelier', 'Free resizing within the first 12 months']
    }),
    make({
      id: 2, handle: 'celeste-pave-band', name: 'Celeste Pavé Band',
      category: 'rings', collection: 'celeste', price: 745, rating: 4.8, reviews: 74,
      badges: ['new'], tags: ['stacking', 'pave'], added: '2026-05-02',
      excerpt: 'Twenty-two pavé stones wrapped halfway around a slim gold band.',
      description: 'Made to stack, and quietly brilliant on its own. Twenty-two stones are bead-set by hand across the front half of the band, leaving the back smooth so it sits flush against a neighbouring ring.',
      details: ['22 pavé-set stones, 0.33ct total', '18k solid gold, 2.1mm width', 'Half-eternity setting', 'Comfort-fit interior', 'Stacks with the Aurora Solitaire and Heritage Twist']
    }),
    make({
      id: 3, handle: 'eclat-signet-ring', name: 'Éclat Signet Ring',
      category: 'rings', collection: 'eclat', price: 520, rating: 4.7, reviews: 46,
      tags: ['signet', 'engravable'], added: '2025-11-20',
      excerpt: 'A modern signet with a mirror-polished oval face, ready to engrave.',
      description: 'A signet stripped back to its essentials — no crest, no shoulders, just a clean oval face and a softly squared shank. Complimentary hand-engraving is available on any signet at checkout.',
      details: ['13 × 11mm mirror-polished face', '18k solid gold, 2.6mm shank', 'Complimentary monogram engraving', 'Weight approx. 6.4g in size 7', 'Made to order in 5–7 business days']
    }),
    make({
      id: 4, handle: 'heritage-twist-ring', name: 'Heritage Twist Ring',
      category: 'rings', collection: 'heritage', price: 385, compareAt: 460, rating: 4.6, reviews: 91,
      tags: ['everyday', 'twist'], added: '2025-08-03',
      excerpt: 'Two gold strands twisted by hand into one soft, rope-like band.',
      description: 'Two lengths of 18k gold wire, twisted by hand and fused into a single band. Because each is formed individually, no two are exactly alike — the twist falls a little differently every time.',
      details: ['Hand-twisted 18k solid gold', '3mm at the widest point', 'Lightly brushed finish', 'Each piece is subtly unique', 'Wears well alongside pavé bands']
    }),
    make({
      id: 5, handle: 'aurora-eternity-band', name: 'Aurora Eternity Band',
      category: 'rings', collection: 'aurora', price: 1420, rating: 4.9, reviews: 57,
      badges: ['new'], tags: ['eternity', 'diamond', 'wedding'], added: '2026-06-18',
      excerpt: 'A full circle of channel-set stones — brilliant from every angle.',
      description: 'Thirty-two stones run the full circumference of the band, held in a channel that protects the girdle of each stone while leaving the crown fully open to the light.',
      details: ['32 channel-set stones, 1.1ct total', '18k solid gold, 2.4mm width', 'Full-eternity setting', 'Not resizable — please order carefully', 'Complimentary sizing kit posted on request']
    }),

    /* — Necklaces ————————————————————————————————————————————— */
    make({
      id: 6, handle: 'aurora-drop-pendant', name: 'Aurora Drop Pendant',
      category: 'necklaces', collection: 'aurora', price: 1250, rating: 4.9, reviews: 112,
      badges: ['bestseller'], tags: ['pendant', 'diamond'], added: '2025-10-01',
      excerpt: 'A pear-cut stone suspended from a fine cable chain.',
      description: 'A pear-cut stone hangs from a hidden bail so it sits perfectly flat against the collarbone rather than tipping forward. The chain is fine enough to disappear, which is rather the point.',
      details: ['0.5ct pear-cut lab-grown diamond', 'Hidden bail, sits flush to the skin', '18k gold cable chain, 1.1mm', 'Adjustable 16" / 18" lobster clasp', 'Pendant measures 9 × 6mm']
    }),
    make({
      id: 7, handle: 'celeste-constellation-necklace', name: 'Celeste Constellation Necklace',
      category: 'necklaces', collection: 'celeste', price: 890, rating: 4.8, reviews: 68,
      badges: ['new'], tags: ['layering', 'stars'], added: '2026-05-22',
      excerpt: 'Five scattered stones set along a fine chain, like a night sky.',
      description: 'Five stones of graduating size are set directly into the chain at irregular intervals, so the piece reads as scattered light rather than a symmetrical row.',
      details: ['5 bezel-set stones, 0.28ct total', '18k solid gold chain, 1mm', 'Adjustable 16"–18"', 'Designed for layering with the Lariat', 'Lobster clasp with extender']
    }),
    make({
      id: 8, handle: 'eclat-herringbone-chain', name: 'Éclat Herringbone Chain',
      category: 'necklaces', collection: 'eclat', price: 640, rating: 4.7, reviews: 143,
      badges: ['bestseller'], tags: ['chain', 'statement'], added: '2025-07-11',
      excerpt: 'A liquid herringbone chain that lies completely flat.',
      description: 'Flat, dense and unusually fluid — a herringbone weave that catches light in a single unbroken sheet. Ours is milled slightly thicker than most, which is what stops it kinking.',
      details: ['4mm herringbone weave', '18k gold-filled over brass core', 'Reinforced spine to resist kinking', '16", 18" or 20"', 'Box clasp with safety catch']
    }),
    make({
      id: 9, handle: 'heritage-locket', name: 'Heritage Locket',
      category: 'necklaces', collection: 'heritage', price: 470, rating: 4.8, reviews: 39,
      tags: ['locket', 'gift', 'engravable'], added: '2025-12-05',
      excerpt: 'An oval locket with a brushed face and room for two photographs.',
      description: 'An oval locket cast from a 1940s original in our archive, with the sharp edges softened and the hinge rebuilt to modern tolerances. It holds two photographs and opens with a fingernail, not a struggle.',
      details: ['22 × 17mm oval, brushed finish', 'Holds two photographs', '18k gold vermeil over sterling silver', '18" rolo chain included', 'Engraving available on the reverse']
    }),
    make({
      id: 10, handle: 'celeste-lariat-necklace', name: 'Celeste Lariat Necklace',
      category: 'necklaces', collection: 'celeste', price: 720, rating: 4.6, reviews: 51,
      tags: ['lariat', 'layering'], added: '2025-09-28',
      excerpt: 'An open Y-drop that adjusts to any neckline.',
      description: 'No clasp — the chain slides through a small gold loop, so you set the drop where you want it. Wears short and close under a blouse, or long and open over a knit.',
      details: ['Adjustable slide, no clasp', '18k solid gold, 1mm box chain', 'Drop adjusts from 2" to 7"', 'Total length 22"', 'Layers with the Constellation']
    }),

    /* — Earrings —————————————————————————————————————————————— */
    make({
      id: 11, handle: 'aurora-teardrop-earrings', name: 'Aurora Teardrop Earrings',
      category: 'earrings', collection: 'aurora', price: 980, rating: 4.9, reviews: 87,
      badges: ['bestseller'], tags: ['drop', 'occasion'], added: '2025-10-19',
      excerpt: 'Faceted teardrops that swing freely from a hidden hinge.',
      description: 'The drops are hung from a hinge rather than a fixed post, so they move with you and catch the light constantly. At 3.1g the pair, they stay comfortable through a long evening.',
      details: ['0.6ct total, brilliant-cut', 'Free-swinging hinged drop', '18k solid gold posts and backs', 'Length 32mm, width 11mm', '3.1g per pair']
    }),
    make({
      id: 12, handle: 'celeste-halo-studs', name: 'Celeste Halo Studs',
      category: 'earrings', collection: 'celeste', price: 560, rating: 4.8, reviews: 96,
      badges: ['new'], tags: ['studs', 'everyday'], added: '2026-06-02',
      excerpt: 'A centre stone ringed by twelve pavé stones — the everyday stud, elevated.',
      description: 'A halo of twelve small stones around a bezel-set centre makes each stud read a full size larger than it is. Screw-backs, because these are the pair you will forget to take off.',
      details: ['12-stone halo, 0.42ct total per pair', 'Bezel-set 3mm centre stone', '18k solid gold, screw-back posts', '7mm diameter', 'Hypoallergenic, nickel-free']
    }),
    make({
      id: 13, handle: 'eclat-hoop-earrings', name: 'Éclat Hoop Earrings',
      category: 'earrings', collection: 'eclat', price: 420, rating: 4.7, reviews: 176,
      badges: ['bestseller'], tags: ['hoops', 'everyday'], added: '2025-06-24',
      excerpt: 'Chunky, hollow-formed hoops with a satisfying weighted click.',
      description: 'Hollow-formed so the scale reads bold without the weight — 25mm across, but under 2g each. The hinge closes with a click you can feel, which means they stay closed.',
      details: ['25mm outer diameter, 4mm tube', 'Hollow-formed for lightness', '18k gold vermeil over sterling silver', 'Click-hinge closure', '1.9g each']
    }),
    make({
      id: 14, handle: 'heritage-pearl-drops', name: 'Heritage Pearl Drops',
      category: 'earrings', collection: 'heritage', price: 340, compareAt: 410, rating: 4.6, reviews: 62,
      tags: ['pearl', 'bridal'], added: '2025-08-30',
      excerpt: 'Freshwater pearls on a slim gold hook.',
      description: 'Single freshwater pearls, matched by hand for lustre and shape, on a simple gold ear wire. A bridal standard that works just as well with a t-shirt.',
      details: ['8–9mm freshwater pearls, AAA grade', 'Hand-matched for lustre', '18k gold-filled ear wires', 'Length 38mm', 'Pearls vary subtly — no two pairs alike']
    }),
    make({
      id: 15, handle: 'eclat-ear-cuff', name: 'Éclat Ear Cuff',
      category: 'earrings', collection: 'eclat', price: 260, rating: 4.5, reviews: 34,
      badges: ['new'], tags: ['cuff', 'no-piercing'], added: '2026-06-27',
      excerpt: 'A sculpted cuff that needs no piercing at all.',
      description: 'A tapered band that grips the upper ear without a piercing. The inner edge is rounded and slightly flared so it holds firmly without pressure points.',
      details: ['No piercing required', 'Adjustable tapered band', '18k gold vermeil over sterling silver', 'Rounded inner edge for comfort', 'Sold individually']
    }),

    /* — Bracelets ————————————————————————————————————————————— */
    make({
      id: 16, handle: 'aurora-tennis-bracelet', name: 'Aurora Tennis Bracelet',
      category: 'bracelets', collection: 'aurora', price: 2450, rating: 5.0, reviews: 44,
      badges: ['bestseller'], tags: ['tennis', 'diamond', 'investment'], added: '2025-11-08',
      excerpt: 'Forty-two matched stones in a flexible gold line.',
      description: 'Forty-two stones, each individually set in its own four-prong box and linked so the line drapes rather than sits rigid. The clasp is doubled — a box catch plus a hidden safety figure-eight.',
      details: ['42 matched stones, 3.0ct total', 'Individually set four-prong boxes', '18k solid gold', 'Double clasp with hidden safety catch', '7" standard, other lengths made to order']
    }),
    make({
      id: 17, handle: 'celeste-chain-bracelet', name: 'Celeste Chain Bracelet',
      category: 'bracelets', collection: 'celeste', price: 680, rating: 4.7, reviews: 58,
      badges: ['new'], tags: ['chain', 'everyday'], added: '2026-05-15',
      excerpt: 'A fine paperclip chain with a single bezel-set stone.',
      description: 'An elongated paperclip link, kept deliberately fine, interrupted once by a bezel-set stone. Light enough to sleep in, smart enough not to look casual.',
      details: ['Elongated paperclip links, 2.4mm', 'Single bezel-set 3mm stone', '18k solid gold', '6.5"–7.5" adjustable', 'Lobster clasp']
    }),
    make({
      id: 18, handle: 'eclat-cuff', name: 'Éclat Cuff',
      category: 'bracelets', collection: 'eclat', price: 890, rating: 4.8, reviews: 41,
      tags: ['cuff', 'statement'], added: '2025-10-30',
      excerpt: 'A wide, mirror-polished cuff with an open back.',
      description: 'Formed over a mandrel from a single sheet of gold, then polished to a mirror. The open back lets it flex on and off without losing its shape.',
      details: ['14mm wide, mirror-polished', 'Formed from a single gold sheet', '18k gold vermeil over sterling silver', 'Open back, gently adjustable', 'Fits wrists 6"–7"']
    }),
    make({
      id: 19, handle: 'heritage-charm-bracelet', name: 'Heritage Charm Bracelet',
      category: 'bracelets', collection: 'heritage', price: 395, rating: 4.7, reviews: 77,
      tags: ['charm', 'gift', 'personalise'], added: '2025-07-29',
      excerpt: 'A sturdy curb chain, ready for a lifetime of charms.',
      description: 'The starting point for a collection. A solid curb chain with reinforced links, supplied with one charm of your choosing and room for a dozen more.',
      details: ['Solid curb chain, 4mm links', 'One charm included', '18k gold vermeil over sterling silver', '7" with 1" extender', 'Additional charms sold separately']
    }),
    make({
      id: 20, handle: 'heritage-bangle', name: 'Heritage Bangle',
      category: 'bracelets', collection: 'heritage', price: 540, rating: 4.6, reviews: 49,
      tags: ['bangle', 'stacking'], added: '2025-09-06',
      excerpt: 'A slim hinged bangle that opens with a hidden catch.',
      description: 'A slim round bangle on a concealed hinge, so it opens wide enough to slip over the hand and closes with no visible join. Made to be worn two or three at a time.',
      details: ['3mm round profile', 'Concealed hinge and push-catch', '18k solid gold', 'Inner diameter 60mm', 'Designed to stack']
    })
  ];

  /* Customer reviews, keyed by product handle. A generic set backs any
     product without bespoke reviews so the PDP is never empty. */
  L.reviews = {
    'aurora-solitaire-ring': [
      { name: 'Jessica M.', verified: true, rating: 5, date: '2026-06-12', title: 'Better than the photographs', body: 'I was nervous ordering a ring online at this price. It arrived in two days in a beautiful box and the stone is genuinely brilliant — it throws light across the room. The band is thinner than I expected in the best way.' },
      { name: 'Amara T.', verified: true, rating: 5, date: '2026-05-30', title: 'Wore it every day for six months', body: 'No scratches, no dulling, and I am not gentle with my hands. The free resizing was completely painless — posted it Monday, had it back Friday.' },
      { name: 'Nicole R.', verified: true, rating: 4, date: '2026-04-18', title: 'Beautiful, size up', body: 'Truly lovely and the customer service was excellent. Only note is that the comfort-fit runs slightly small — I went up a half size on their advice and it is perfect now.' }
    ],
    'eclat-hoop-earrings': [
      { name: 'Priya S.', verified: true, rating: 5, date: '2026-06-20', title: 'The only hoops I wear now', body: 'They look substantial but weigh nothing, which is the whole trick. I have had three people ask where they are from.' },
      { name: 'Danielle K.', verified: true, rating: 5, date: '2026-05-11', title: 'Great everyday pair', body: 'Six months in and the gold still looks new. The click closure is reassuring — I have never had one come loose.' },
      { name: 'Bea L.', verified: false, rating: 4, date: '2026-03-27', title: 'Slightly bigger than expected', body: 'My fault for not measuring — 25mm is bolder than I pictured. Gorgeous quality though, and I have grown into them.' }
    ],
    'aurora-tennis-bracelet': [
      { name: 'Helen W.', verified: true, rating: 5, date: '2026-06-28', title: 'An heirloom purchase', body: 'Bought for a milestone birthday and it exceeded every expectation. The drape is what sets it apart — it moves like fabric rather than sitting stiff on the wrist.' },
      { name: 'Sofia G.', verified: true, rating: 5, date: '2026-04-02', title: 'The safety catch matters', body: 'I have lost a tennis bracelet before, so the double clasp sold me. Faultless so far and the stones are beautifully matched.' }
    ],
    _default: [
      { name: 'Rachel P.', verified: true, rating: 5, date: '2026-06-15', title: 'Exactly as described', body: 'Arrived quickly, beautifully packaged, and the finish is genuinely lovely in person. I have already ordered a second piece.' },
      { name: 'Maya C.', verified: true, rating: 5, date: '2026-05-08', title: 'Lovely quality for the price', body: 'It feels far more expensive than it was. I have worn it constantly for a month with no dulling at all.' },
      { name: 'Erin D.', verified: true, rating: 4, date: '2026-03-21', title: 'Very happy', body: 'Delicate and well made. Took off one star only because I would have liked a slightly longer chain option.' }
    ]
  };

  L.testimonials = [
    { rating: 5, quote: 'I have bought from every big name in fine jewelry, and Lumina is the first that felt personal. The atelier emailed me photographs of my ring mid-setting.', name: 'Elena Rodriguez', meta: 'Aurora Solitaire Ring · Chicago, IL' },
    { rating: 5, quote: 'The packaging alone made me emotional, and then I opened it. Six months of daily wear and it still looks like the day it arrived.', name: 'Maya Chen', meta: 'Celeste Constellation Necklace · Seattle, WA' },
    { rating: 5, quote: 'I ordered on a Tuesday for an anniversary on the Friday and it made it with a day to spare. It has not left my wrist since.', name: 'Aisha Johnson', meta: 'Aurora Tennis Bracelet · Atlanta, GA' },
    { rating: 5, quote: 'Their sizing guide is the most accurate I have used, and the free resizing meant I ordered without any of the usual anxiety.', name: 'Sophie Laurent', meta: 'Heritage Twist Ring · Austin, TX' }
  ];

  /* — Helpers ————————————————————————————————————————————————— */

  /* Products the storefront may show. `L.products` always holds everything,
     including pieces the admin panel has hidden — only the admin reads that. */
  L.live = function () {
    return L.products.filter(function (p) { return !p.hidden; });
  };

  L.money = function (n) {
    return L.currency.symbol + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  L.getProduct = function (handle) {
    for (var i = 0; i < L.products.length; i++) {
      if (L.products[i].handle === handle) return L.products[i];
    }
    return null;
  };

  L.getReviews = function (handle) {
    return L.reviews[handle] || L.reviews._default;
  };

  L.labelFor = function (list, slug) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].slug === slug) return list[i].label;
    }
    return slug;
  };

  L.categoryLabel = function (slug) { return L.labelFor(L.categories, slug); };
  L.collectionLabel = function (slug) { return L.labelFor(L.collections, slug); };
  L.metal = function (slug) {
    for (var i = 0; i < L.metals.length; i++) { if (L.metals[i].slug === slug) return L.metals[i]; }
    return L.metals[0];
  };

  L.byBadge = function (badge, limit) {
    var out = L.live().filter(function (p) { return p.badges.indexOf(badge) > -1; });
    return limit ? out.slice(0, limit) : out;
  };

  L.newest = function (limit) {
    return L.live().sort(function (a, b) {
      return a.added < b.added ? 1 : -1;
    }).slice(0, limit || 8);
  };

  L.related = function (product, limit) {
    var same = L.live().filter(function (p) {
      return p.handle !== product.handle && (p.collection === product.collection || p.category === product.category);
    });
    return same.slice(0, limit || 4);
  };

  /* Star distribution for a product's aggregate rating.
     Returns counts for 1–5 stars that sum to `total` and centre on `rating`.
     Replace with real per-star counts once reviews come from a live service. */
  L.ratingBreakdown = function (rating, total) {
    var weights = [];
    for (var star = 1; star <= 5; star++) {
      weights.push(Math.pow(Math.max(0, 1 - Math.abs(star - rating) / 2), 3));
    }
    var sum = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
    var counts = weights.map(function (w) { return Math.round(w / sum * total); });
    var drift = total - counts.reduce(function (a, b) { return a + b; }, 0);
    counts[4] = Math.max(0, counts[4] + drift);
    return counts;
  };

  L.priceRange = function () {
    var min = Infinity, max = 0;
    L.live().forEach(function (p) {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    });
    if (min === Infinity) min = 0;
    return { min: Math.floor(min / 10) * 10, max: Math.ceil(max / 100) * 100 || 100 };
  };

  /* — Admin overrides ————————————————————————————————————————————
     The admin panel saves an edited catalogue to localStorage. When one is
     present it shadows the arrays above, so edits preview on the real
     storefront in that browser only. Exporting a fresh data.js from the admin
     panel is what makes a change permanent for every visitor. */
  L.STORAGE_CATALOGUE = 'lumina.admin.catalogue.v1';
  L.STORAGE_CONTENT = 'lumina.admin.content.v1';
  L.hasOverrides = false;

  /* Editable page copy (currently just the hero). The markup in index.html is
     the default and the single source of truth — this only holds unpublished
     edits, which main.js paints over the top. */
  L.content = null;
  try {
    L.content = JSON.parse(localStorage.getItem(L.STORAGE_CONTENT) || 'null');
    if (L.content) L.hasOverrides = true;
  } catch (e) { L.content = null; }

  (function applyOverrides() {
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(L.STORAGE_CATALOGUE) || 'null');
    } catch (e) { return; }
    if (!saved) return;

    if (Array.isArray(saved.products) && saved.products.length) {
      L.products = saved.products.map(function (p) { return L.normalise(p); });
      L.hasOverrides = true;
    }
    if (Array.isArray(saved.testimonials) && saved.testimonials.length) {
      L.testimonials = saved.testimonials;
      L.hasOverrides = true;
    }
    L.overridesSavedAt = saved.savedAt || null;
  })();
})(window.LUMINA);
