/* ==========================================================================
   Lumina Jewelry — Product detail page
   Reads ?p=<handle>, renders the product, reviews and related pieces,
   and injects Product structured data for search engines.
   ========================================================================== */
(function (L) {
  'use strict';

  var $ = L.$, $$ = L.$$, esc = L.esc;
  var SITE = 'https://www.luminajewelry.com/';

  var product = null;
  var views = [];   // gallery images, always led by the main photo
  var chosen = { metal: null, size: null, qty: 1 };

  /* — Local (demo) reviews ————————————————————————————————————— */
  function localReviews(handle) {
    try {
      return JSON.parse(localStorage.getItem('lumina.reviews.' + handle) || '[]');
    } catch (e) { return []; }
  }

  function saveLocalReview(handle, review) {
    var all = localReviews(handle);
    all.unshift(review);
    try { localStorage.setItem('lumina.reviews.' + handle, JSON.stringify(all)); } catch (e) {}
  }

  function allReviews() {
    return localReviews(product.handle).concat(L.getReviews(product.handle));
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* — Not found ——————————————————————————————————————————————— */
  function renderNotFound() {
    $('#pdp-root').innerHTML =
      '<div class="wrap pdp-notfound">' +
        '<h1>We couldn’t find that piece</h1>' +
        '<p>It may have sold out or moved. Browse the full collection instead — there are twenty pieces waiting.</p>' +
        '<a class="btn" href="shop.html">Shop all jewelry</a>' +
      '</div>';
    document.title = 'Piece not found | Lumina Jewelry';
  }

  /* — Main render ————————————————————————————————————————————— */
  function renderProduct() {
    chosen.metal = product.metals[0];
    chosen.size = product.sizes[0];

    // The main photo always leads, then any gallery views that aren't it.
    views = [product.image].concat((product.gallery || []).filter(function (src) {
      return src !== product.image;
    }));

    var price = '<strong>' + L.money(product.price) + '</strong>';
    if (product.compareAt) {
      price += '<del>' + L.money(product.compareAt) + '</del>' +
        '<span class="badge badge--gold">Save ' + L.money(product.compareAt - product.price) + '</span>';
    }

    var thumbs = views.map(function (src, i) {
      return '<button class="gallery__thumb" type="button" data-thumb="' + i + '" ' +
        'aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-label="View image ' + (i + 1) + '">' +
        '<img src="' + src + '" alt="" width="82" height="82" loading="lazy" decoding="async">' +
        '</button>';
    }).join('');

    var metalSwatches = product.metals.map(function (slug, i) {
      var m = L.metal(slug);
      return '<button class="swatch swatch--metal" type="button" data-metal="' + slug + '" ' +
        'aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
        '<i style="background:' + m.hex + '" aria-hidden="true"></i>' + esc(m.label) + '</button>';
    }).join('');

    var sizeSwatches = product.sizes.map(function (s, i) {
      return '<button class="swatch" type="button" data-size="' + esc(s) + '" ' +
        'aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + esc(s) + '</button>';
    }).join('');

    var stockLine = product.stock > 4
      ? 'In stock — ships within 24 hours'
      : (product.stock > 0 ? 'Only ' + product.stock + ' left — made to order after that' : 'Made to order · 3 weeks');

    $('#pdp-root').innerHTML =
      '<div class="wrap">' +
        '<nav class="crumbs" aria-label="Breadcrumb">' +
          '<a href="index.html">Home</a><span>/</span>' +
          '<a href="shop.html?category=' + product.category + '">' + esc(L.categoryLabel(product.category)) + '</a>' +
          '<span>/</span><span>' + esc(product.name) + '</span>' +
        '</nav>' +

        '<div class="pdp">' +
          '<div class="gallery">' +
            '<div class="gallery__thumbs" id="gallery-thumbs">' + thumbs + '</div>' +
            '<figure class="gallery__main" style="margin:0">' +
              '<img id="gallery-main" src="' + views[0] + '" alt="' + esc(product.name) +
                ' — ' + esc(L.categoryLabel(product.category)) + ' in 18k gold" width="1000" height="1000" fetchpriority="high" decoding="async">' +
            '</figure>' +
          '</div>' +

          '<div>' +
            '<span class="eyebrow">' + esc(L.collectionLabel(product.collection)) + ' Collection</span>' +
            '<h1 class="pdp__title">' + esc(product.name) + '</h1>' +

            '<div class="pdp__meta">' +
              L.starsHtml(product.rating, true) +
              '<a href="#reviews-section">' + product.rating.toFixed(1) + ' · ' + product.reviews + ' reviews</a>' +
              '<span>·</span><span>SKU ' + esc(product.sku) + '</span>' +
            '</div>' +

            '<div class="pdp__price">' + price + '</div>' +
            '<p class="pdp__desc">' + esc(product.description) + '</p>' +

            '<div class="opt-group">' +
              '<div class="opt-group__label">Metal <span id="metal-out">' + esc(L.metal(chosen.metal).label) + '</span></div>' +
              '<div class="swatches" id="metal-swatches">' + metalSwatches + '</div>' +
            '</div>' +

            '<div class="opt-group">' +
              '<div class="opt-group__label">Size <span id="size-out">' + esc(chosen.size) + '</span>' +
                '<a href="faq.html#sizing" style="margin-left:auto;font-size:.74rem;letter-spacing:.06em;text-transform:none;border-bottom:1px solid var(--line-strong)">Size guide</a>' +
              '</div>' +
              '<div class="swatches" id="size-swatches">' + sizeSwatches + '</div>' +
            '</div>' +

            '<div class="pdp__actions">' +
              '<div class="qty">' +
                '<button type="button" id="qty-down" aria-label="Decrease quantity">' + L.icon('minus') + '</button>' +
                '<span id="qty-out">1</span>' +
                '<button type="button" id="qty-up" aria-label="Increase quantity">' + L.icon('plus') + '</button>' +
              '</div>' +
              '<button class="btn" type="button" id="pdp-add">Add to bag — ' + L.money(product.price) + '</button>' +
              '<button class="wish-btn' + (L.Store.inWishlist(product.handle) ? ' is-active' : '') + '" type="button" ' +
                'data-wish="' + esc(product.handle) + '" aria-label="Add to wishlist" ' +
                'aria-pressed="' + (L.Store.inWishlist(product.handle) ? 'true' : 'false') + '">' + L.icon('heart') + '</button>' +
            '</div>' +

            '<ul class="assurances">' +
              '<li>' + L.icon('check') + '<span>' + stockLine + '</span></li>' +
              '<li>' + L.icon('truck') + '<span>Complimentary express shipping on US orders over $250</span></li>' +
              '<li>' + L.icon('shield') + '<span>Lifetime warranty and free repairs</span></li>' +
              '<li>' + L.icon('gift') + '<span>Arrives in a hand-tied gift box</span></li>' +
            '</ul>' +

            '<div class="accordion">' +
              '<div class="accordion__item">' +
                '<button class="accordion__btn" type="button" aria-expanded="true" aria-controls="acc-details">' +
                  'Details &amp; specification<i aria-hidden="true"></i></button>' +
                '<div class="accordion__panel" id="acc-details"><div><ul>' +
                  product.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') +
                '</ul></div></div>' +
              '</div>' +
              '<div class="accordion__item">' +
                '<button class="accordion__btn" type="button" aria-expanded="false" aria-controls="acc-care">' +
                  'Care instructions<i aria-hidden="true"></i></button>' +
                '<div class="accordion__panel" id="acc-care"><div><p>' + esc(product.care) + '</p>' +
                  '<p>Gold vermeil pieces should be kept away from perfume and chlorine. Solid gold can be cleaned with warm water and a soft brush.</p>' +
                '</div></div>' +
              '</div>' +
              '<div class="accordion__item">' +
                '<button class="accordion__btn" type="button" aria-expanded="false" aria-controls="acc-ship">' +
                  'Shipping &amp; returns<i aria-hidden="true"></i></button>' +
                '<div class="accordion__panel" id="acc-ship"><div>' +
                  '<p>Free express shipping on US orders over $250 (2–3 business days). Orders under $250 ship at a flat $12. International delivery is available to 40 countries at checkout.</p>' +
                  '<p>Return anything unworn within 30 days for a full refund. Engraved and made-to-order pieces are final sale. <a href="faq.html#returns">Read the full policy</a>.</p>' +
                '</div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    bindProduct();
    L.initAccordions();
  }

  function bindProduct() {
    var main = $('#gallery-main');

    $('#gallery-thumbs').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-thumb]');
      if (!btn) return;
      var i = parseInt(btn.getAttribute('data-thumb'), 10);
      main.src = views[i];
      $$('[data-thumb]').forEach(function (b) {
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
    });

    $('#metal-swatches').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-metal]');
      if (!btn) return;
      chosen.metal = btn.getAttribute('data-metal');
      $$('[data-metal]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      $('#metal-out').textContent = L.metal(chosen.metal).label;
    });

    $('#size-swatches').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-size]');
      if (!btn) return;
      chosen.size = btn.getAttribute('data-size');
      $$('[data-size]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      $('#size-out').textContent = chosen.size;
    });

    function setQty(n) {
      chosen.qty = Math.max(1, Math.min(10, n));
      $('#qty-out').textContent = chosen.qty;
      $('#pdp-add').textContent = 'Add to bag — ' + L.money(product.price * chosen.qty);
    }
    $('#qty-up').addEventListener('click', function () { setQty(chosen.qty + 1); });
    $('#qty-down').addEventListener('click', function () { setQty(chosen.qty - 1); });

    $('#pdp-add').addEventListener('click', function () {
      L.Store.add(product.handle, chosen.qty, chosen.metal, chosen.size);
      L.toast(product.name + ' added to your bag');
      L.openPanel($('#cart-drawer'));
    });
  }

  /* — Reviews ————————————————————————————————————————————————— */
  function renderReviews() {
    var list = allReviews();
    var mine = localReviews(product.handle);
    var section = $('#reviews-section');
    section.hidden = false;

    // Start from the product's aggregate rating, then fold in anything
    // submitted through the form on this device.
    var counts = L.ratingBreakdown(product.rating, product.reviews);
    mine.forEach(function (r) { counts[r.rating - 1]++; });

    var total = product.reviews + mine.length;
    var avg = (product.rating * product.reviews +
      mine.reduce(function (n, r) { return n + r.rating; }, 0)) / total;

    $('#review-score').innerHTML =
      '<strong>' + avg.toFixed(1) + '</strong>' +
      L.starsHtml(avg) +
      '<p>Based on ' + total + ' verified reviews</p>';

    $('#review-bars').innerHTML = [5, 4, 3, 2, 1].map(function (star) {
      var n = counts[star - 1];
      var pct = total ? Math.round((n / total) * 100) : 0;
      return '<div class="bar-row">' +
        '<span>' + star + ' star' + (star > 1 ? 's' : '') + '</span>' +
        '<span class="bar"><i style="width:' + pct + '%"></i></span>' +
        '<span>' + pct + '%</span>' +
      '</div>';
    }).join('');

    $('#review-list').innerHTML = list.map(function (r) {
      return '<li class="review">' +
        '<div class="review__top">' +
          '<div class="review__who">' + esc(r.name) +
            (r.verified ? '<span>Verified buyer</span>' : '') + '</div>' +
          '<span class="review__date">' + esc(formatDate(r.date)) + '</span>' +
        '</div>' +
        L.starsHtml(r.rating, true) +
        '<h4>' + esc(r.title) + '</h4>' +
        '<p>' + esc(r.body) + '</p>' +
      '</li>';
    }).join('');
  }

  function bindReviewForm() {
    var form = $('#review-form');
    if (!form) return;
    form.addEventListener('lumina:submitted', function (e) {
      var d = e.detail || {};
      saveLocalReview(product.handle, {
        name: d.name || 'Anonymous',
        verified: false,
        rating: parseInt(d.rating, 10) || 5,
        date: new Date().toISOString().slice(0, 10),
        title: d.title || 'Review',
        body: d.body || ''
      });
      renderReviews();
      L.toast('Thank you — your review has been submitted.');
    });
  }

  /* — Related ————————————————————————————————————————————————— */
  function renderRelated() {
    var related = L.related(product, 4);
    if (!related.length) return;
    $('#related-section').hidden = false;
    L.renderGrid($('#related-grid'), related);
  }

  /* — SEO ————————————————————————————————————————————————————— */
  function applySeo() {
    var title = product.name + ' — ' + L.categoryLabel(product.category).replace(/s$/, '') + ' | Lumina Jewelry';
    var desc = product.excerpt + ' ' + L.money(product.price) + '. Handmade in New York, free US shipping over $250.';
    var url = SITE + 'product.html?p=' + product.handle;

    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', product.name + ' | Lumina Jewelry');
    setMeta('property', 'og:description', product.excerpt);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', SITE + product.image);
    setMeta('name', 'twitter:title', product.name + ' | Lumina Jewelry');
    setMeta('name', 'twitter:description', product.excerpt);
    setMeta('name', 'twitter:image', SITE + product.image);

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    var ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: product.name,
          image: views.filter(function (src) { return src.indexOf('data:') !== 0; })
            .map(function (g) { return SITE + g; }),
          description: product.description,
          sku: product.sku,
          brand: { '@type': 'Brand', name: 'Lumina Jewelry' },
          category: L.categoryLabel(product.category),
          material: '18k gold',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews,
            bestRating: 5,
            worstRating: 1
          },
          offers: {
            '@type': 'Offer',
            url: url,
            priceCurrency: 'USD',
            price: product.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/PreOrder',
            seller: { '@type': 'Organization', name: 'Lumina Jewelry' }
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
            { '@type': 'ListItem', position: 2, name: L.categoryLabel(product.category), item: SITE + 'shop.html?category=' + product.category },
            { '@type': 'ListItem', position: 3, name: product.name, item: url }
          ]
        }
      ]
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  }

  function setMeta(attr, key, value) {
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  /* — Init ———————————————————————————————————————————————————— */
  function init() {
    var handle = new URLSearchParams(window.location.search).get('p');
    product = handle ? L.getProduct(handle) : null;

    if (!product || product.hidden) { product = null; renderNotFound(); return; }

    renderProduct();
    renderReviews();
    bindReviewForm();
    renderRelated();
    applySeo();

    document.dispatchEvent(new CustomEvent('lumina:rendered'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.LUMINA);
