/* ==========================================================================
   Lumina Jewelry — Admin panel
   A browser-only content manager for a static site. It edits a working copy
   of the catalogue in localStorage (which the storefront previews), and
   exports a fresh assets/js/data.js that you commit to publish for everyone.

   The passcode gate is a speed bump, not security — this file is public.
   See README §11 for real host-level protection.

   Sections: 1 Setup · 2 Icons · 3 Auth · 4 Persistence · 5 Router
             6 Dashboard · 7 Products · 8 Testimonials · 9 Reviews
             10 Subscribers · 11 Data & settings · 12 Editor · 13 Boot
   ========================================================================== */
(function (L) {
  'use strict';

  /* 1 · Setup ------------------------------------------------------------- */
  var $ = L.$, $$ = L.$$, esc = L.esc;

  var KEY_PASS = 'lumina.admin.pass.v1';
  var KEY_SESSION = 'lumina.admin.session';
  var KEY_NEWS = 'lumina.newsletter.v1';
  var DEFAULT_PASS = 'lumina-admin';
  var LOW_STOCK = 5;

  var state = {
    products: [],
    testimonials: [],
    view: 'dashboard',
    filter: { q: '', category: '', status: '' },
    editing: null
  };

  /* Unpublished page content: replaced media, keyed by published path, plus
     hero copy. Mirrors L.content, which the storefront reads. */
  var contentDraft = { media: {}, hero: {} };

  var VIEWS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'homepage', label: 'Home page', icon: 'home' },
    { id: 'media', label: 'Media', icon: 'image', tally: function () { return mediaChanged().length || null; } },
    { id: 'products', label: 'Products', icon: 'box', tally: function () { return state.products.length; } },
    { id: 'testimonials', label: 'Testimonials', icon: 'quote', tally: function () { return state.testimonials.length; } },
    { id: 'reviews', label: 'Reviews', icon: 'star', tally: function () { return allLocalReviews().length; } },
    { id: 'subscribers', label: 'Subscribers', icon: 'mail', tally: function () { return subscribers().length; } },
    { id: 'data', label: 'Data & settings', icon: 'database' }
  ];

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  /* Strips diacritics before slugifying so "Éclat Cuff" becomes "eclat-cuff"
     rather than "clat-cuff". */
  var COMBINING = new RegExp('[\\u0300-\\u036f]', 'g');

  function slugify(s) {
    var text = String(s);
    if (text.normalize) text = text.normalize('NFD').replace(COMBINING, '');
    return text.toLowerCase().trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function money(n) { return L.money(n); }

  function dateLabel(v) {
    var d = new Date(v);
    if (isNaN(d)) return String(v || '—');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* 2 · Icons ------------------------------------------------------------- */
  var ICONS = {
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    box: '<path d="M5 8h14l1 12H4Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    quote: '<path d="M9 7c-2.2 0-4 1.8-4 4s1.8 4 4 4c0 2-1.4 3.4-3 4"/><path d="M19 7c-2.2 0-4 1.8-4 4s1.8 4 4 4c0 2-1.4 3.4-3 4"/>',
    star: '<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.6l1.1-6L3.4 9.4l6-.8Z"/>',
    mail: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
    database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z"/><path d="m14.5 6.5 3 3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4V4h11v1"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7v13h12V7"/><path d="M10 11v5M14 11v5"/>',
    eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M4 4l16 16"/><path d="M9.7 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.1"/><path d="M6.5 6.7C3.9 8.3 2 12 2 12s3.6 6 10 6c1.6 0 3-.4 4.3-1M9.5 6.3A9.6 9.6 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.5"/>',
    download: '<path d="M12 4v11"/><path d="m7.5 11.5 4.5 4.5 4.5-4.5"/><path d="M4 19h16"/>',
    upload: '<path d="M12 20V9"/><path d="m7.5 12.5 4.5-4.5 4.5 4.5"/><path d="M4 5h16"/>',
    check: '<path d="m4 12 5.5 5.5L20 7"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    tag: '<path d="M3 11V4h7l10 10-7 7Z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m4 17 4.5-4.5 3 3L15 11l5 5"/>',
    x: '<path d="M5 5l14 14M19 5 5 19"/>',
    zip: '<path d="M5 4h14v16H5z"/><path d="M10 4v3M12 6v3M10 9v3M12 11v3M10 14v3h2v-3"/>',
    home: '<path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M9.5 20v-6h5v6"/>'
  };

  function ic(name, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (extra ? ' ' + extra : '') + '>' + (ICONS[name] || '') + '</svg>';
  }

  /* 3 · Auth -------------------------------------------------------------- */
  function hash(text) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      var bytes = new TextEncoder().encode('lumina::' + text);
      return window.crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      });
    }
    // file:// and plain http have no SubtleCrypto — fall back to a simple digest.
    // Equally non-secret either way; this only avoids storing the passcode in clear.
    var h = 5381, s = 'lumina::' + text;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return Promise.resolve('fnv' + h.toString(16));
  }

  function storedHash() { return localStorage.getItem(KEY_PASS); }

  function checkPass(entered) {
    return hash(entered).then(function (h) {
      var saved = storedHash();
      if (saved) return h === saved;
      return hash(DEFAULT_PASS).then(function (def) { return h === def; });
    });
  }

  function initGate() {
    var gate = $('#gate');
    var form = $('#gate-form');
    var input = $('#gate-pass');
    var err = $('#gate-error');

    if (sessionStorage.getItem(KEY_SESSION) === 'open') return unlock();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value;
      if (!value) {
        err.textContent = 'Enter the passcode to continue.';
        err.classList.add('is-on');
        return;
      }
      checkPass(value).then(function (ok) {
        if (!ok) {
          err.textContent = 'That passcode is not right. Try again.';
          err.classList.add('is-on');
          input.value = '';
          input.focus();
          return;
        }
        sessionStorage.setItem(KEY_SESSION, 'open');
        unlock();
      });
    });

    input.focus();
  }

  function unlock() {
    $('#gate').hidden = true;
    $('#admin-shell').hidden = false;
    boot();
  }

  function lock() {
    sessionStorage.removeItem(KEY_SESSION);
    window.location.reload();
  }

  /* 4 · Persistence ------------------------------------------------------- */
  function persist() {
    var payload = {
      products: state.products,
      testimonials: state.testimonials,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(L.STORAGE_CATALOGUE, JSON.stringify(payload));
    } catch (e) {
      // Almost always the ~5 MB localStorage quota, hit by uploaded photos.
      L.toast('Storage is full — this change is not saved and will be lost on reload.');
      L.toast('Publish your photos from Data & settings, then discard local changes to free space.');
      return false;
    }
    L.products = state.products.map(function (p) { return L.normalise(p); });
    L.testimonials = state.testimonials;
    L.hasOverrides = true;
    updateChrome();
    return true;
  }

  function persistContent() {
    var empty = !Object.keys(contentDraft.media || {}).length &&
                !Object.keys(contentDraft.hero || {}).length;
    try {
      if (empty) localStorage.removeItem(L.STORAGE_CONTENT);
      else localStorage.setItem(L.STORAGE_CONTENT, JSON.stringify(contentDraft));
    } catch (e) {
      L.toast('Storage is full — this photo is not saved and will be lost on reload.');
      L.toast('Publish what you have from Data & settings, then discard local changes.');
      return false;
    }
    L.content = empty ? null : contentDraft;
    if (!empty) L.hasOverrides = true;
    updateChrome();
    return true;
  }

  function clearOverrides() {
    localStorage.removeItem(L.STORAGE_CATALOGUE);
    localStorage.removeItem(L.STORAGE_CONTENT);
    window.location.reload();
  }

  function updateChrome() {
    var pending = !!localStorage.getItem(L.STORAGE_CATALOGUE) ||
                  !!localStorage.getItem(L.STORAGE_CONTENT);
    $('#dirty-dot').classList.toggle('is-on', pending);
    renderNav();
  }

  /* Stored data the storefront writes ------------------------------------- */
  function subscribers() {
    var list = read(KEY_NEWS, []);
    return Array.isArray(list) ? list : (list && list.email ? [list] : []);
  }

  function allLocalReviews() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf('lumina.reviews.') !== 0) continue;
      var handle = key.slice('lumina.reviews.'.length);
      var list = read(key, []);
      if (!Array.isArray(list)) continue;
      list.forEach(function (r, idx) {
        out.push({ handle: handle, index: idx, review: r });
      });
    }
    return out.sort(function (a, b) { return a.review.date < b.review.date ? 1 : -1; });
  }

  /* 5 · Router ------------------------------------------------------------ */
  function renderNav() {
    $('#admin-nav').innerHTML = VIEWS.map(function (v) {
      var n = v.tally ? v.tally() : null;
      return '<a href="#/' + v.id + '"' + (state.view === v.id ? ' aria-current="true"' : '') + '>' +
        ic(v.icon) + '<span>' + esc(v.label) + '</span>' +
        (n !== null ? '<span class="tally">' + n + '</span>' : '') +
        '</a>';
    }).join('');
  }

  function go() {
    var id = (window.location.hash.replace('#/', '') || 'dashboard');
    if (!VIEWS.some(function (v) { return v.id === id; })) id = 'dashboard';
    state.view = id;

    VIEWS.forEach(function (v) {
      $('#view-' + v.id).hidden = v.id !== id;
    });

    renderNav();
    closeSidebar();

    var render = {
      dashboard: renderDashboard, homepage: renderHomepage, media: renderMedia,
      products: renderProducts, testimonials: renderTestimonials, reviews: renderReviews,
      subscribers: renderSubscribers, data: renderData
    }[id];
    if (render) render();
    window.scrollTo(0, 0);
  }

  function closeSidebar() {
    $('#admin-side').classList.remove('is-open');
    var s = $('.scrim');
    if (s && !$('#editor').classList.contains('is-open')) s.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  /* 6 · Dashboard --------------------------------------------------------- */
  function renderDashboard() {
    var live = state.products.filter(function (p) { return !p.hidden; });
    var hidden = state.products.length - live.length;
    var value = live.reduce(function (n, p) { return n + (p.price * (p.stock || 0)); }, 0);
    var avg = live.length
      ? live.reduce(function (n, p) { return n + p.rating; }, 0) / live.length : 0;
    var low = live.filter(function (p) { return (p.stock || 0) < LOW_STOCK; });
    var reviews = allLocalReviews();
    var subs = subscribers();
    var saved = localStorage.getItem(L.STORAGE_CATALOGUE);

    var html =
      '<div class="view-head"><div>' +
        '<h1>Dashboard</h1>' +
        '<p>An overview of the catalogue and everything the storefront has collected.</p>' +
      '</div></div>';

    if (saved) {
      html += '<div class="notice">' + ic('alert') + '<div>' +
        '<p><strong>You have unpublished changes.</strong> They are saved in this browser and ' +
        'visible when you preview the site, but visitors still see the deployed catalogue.</p>' +
        '<p>Publish them by exporting a new <code>data.js</code> from ' +
        '<a href="#/data" style="border-bottom:1px solid currentColor">Data &amp; settings</a> ' +
        'and deploying it.</p>' +
      '</div></div>';
    }

    html += '<div class="tiles">' +
      tile('box', 'Live products', live.length, hidden ? hidden + ' hidden' : 'All visible') +
      tile('coin', 'Stock value', money(value), 'Retail, live products only') +
      tile('star', 'Average rating', avg.toFixed(2), live.length + ' products rated') +
      tile('alert', 'Low stock', low.length, 'Fewer than ' + LOW_STOCK + ' in stock', low.length > 0) +
      tile('mail', 'Subscribers', subs.length, 'Captured on this device') +
      tile('quote', 'Local reviews', reviews.length, 'Submitted via the site') +
    '</div>';

    html += '<div class="panel"><div class="panel__head">' +
      '<div><h2>Low stock</h2><p>Products with fewer than ' + LOW_STOCK + ' units left.</p></div>' +
      '<a class="btn btn--ghost btn--sm" href="#/products">Manage products</a>' +
      '</div><div class="panel__body--flush">';

    if (!low.length) {
      html += '<div class="empty-row"><h3>Nothing running low</h3><p>Every live product has ' + LOW_STOCK + ' or more in stock.</p></div>';
    } else {
      html += '<div class="table-scroll"><table class="admin-table"><thead><tr>' +
        '<th>Product</th><th>Collection</th><th class="num">Price</th><th class="num">Stock</th><th></th>' +
        '</tr></thead><tbody>' +
        low.sort(function (a, b) { return (a.stock || 0) - (b.stock || 0); }).map(function (p) {
          return '<tr>' +
            '<td>' + productCell(p) + '</td>' +
            '<td>' + esc(L.collectionLabel(p.collection)) + '</td>' +
            '<td class="num">' + money(p.price) + '</td>' +
            '<td class="num"><span class="pill pill--low">' + (p.stock || 0) + ' left</span></td>' +
            '<td class="num"><button class="btn btn--ghost btn--sm" type="button" data-edit="' + esc(p.handle) + '">Edit</button></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }
    html += '</div></div>';

    html += '<div class="panel"><div class="panel__head">' +
      '<div><h2>Latest reviews</h2><p>The five most recent reviews submitted through the site.</p></div>' +
      '<a class="btn btn--ghost btn--sm" href="#/reviews">All reviews</a>' +
      '</div><div class="panel__body--flush">';

    if (!reviews.length) {
      html += '<div class="empty-row"><h3>No reviews yet</h3><p>Reviews written on a product page will appear here.</p></div>';
    } else {
      html += '<div class="table-scroll"><table class="admin-table"><thead><tr>' +
        '<th>Product</th><th>Reviewer</th><th>Rating</th><th>Review</th><th class="num">Date</th>' +
        '</tr></thead><tbody>' +
        reviews.slice(0, 5).map(function (r) {
          var p = L.getProduct(r.handle);
          return '<tr>' +
            '<td>' + esc(p ? p.name : r.handle) + '</td>' +
            '<td>' + esc(r.review.name) + '</td>' +
            '<td>' + L.starsHtml(r.review.rating, true) + '</td>' +
            '<td>' + esc(r.review.title) + '</td>' +
            '<td class="num">' + dateLabel(r.review.date) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }
    html += '</div></div>';

    $('#view-dashboard').innerHTML = html;
  }

  function tile(icon, label, value, note, warn) {
    return '<div class="tile' + (warn ? ' tile--warn' : '') + '">' +
      '<div class="tile__label">' + ic(icon) + esc(label) + '</div>' +
      '<div class="tile__value">' + esc(String(value)) + '</div>' +
      '<div class="tile__note">' + esc(note) + '</div>' +
    '</div>';
  }

  function productCell(p) {
    return '<span class="cell-product">' +
      '<img src="' + esc(p.image) + '" alt="" width="46" height="46" loading="lazy">' +
      '<span><b>' + esc(p.name) + '</b><span>' + esc(p.sku || '') + ' · ' + esc(L.categoryLabel(p.category)) + '</span></span>' +
    '</span>';
  }

  /* 6b · Home page -------------------------------------------------------- */
  /* index.html is the source of truth for hero copy; these fields hold
     unpublished edits that main.js paints over it. */
  var HERO_FIELDS = [
    { key: 'eyebrow', label: 'Eyebrow', hint: 'The small gold line above the headline.' },
    { key: 'title1', label: 'Headline — first line' },
    { key: 'title2', label: 'Headline — second line', hint: 'Rendered in italic gold.' },
    { key: 'text', label: 'Supporting paragraph', type: 'textarea' },
    { key: 'cta1Label', label: 'Primary button — label' },
    { key: 'cta1Href', label: 'Primary button — link' },
    { key: 'cta2Label', label: 'Secondary button — label' },
    { key: 'cta2Href', label: 'Secondary button — link' }
  ];

  var heroDefaults = null;   // read from index.html the first time we need it

  function loadHeroDefaults() {
    if (heroDefaults) return Promise.resolve(heroDefaults);
    return fetch('index.html').then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var pick = function (key) {
        var el = doc.querySelector('[data-hero="' + key + '"]');
        return el ? el.textContent.trim() : '';
      };
      var link = function (key) {
        var el = doc.querySelector('[data-hero="' + key + '"]');
        return el ? el.getAttribute('href') : '';
      };
      heroDefaults = {
        eyebrow: pick('eyebrow'), title1: pick('title1'), title2: pick('title2'), text: pick('text'),
        cta1Label: pick('cta1'), cta1Href: link('cta1'),
        cta2Label: pick('cta2'), cta2Href: link('cta2')
      };
      return heroDefaults;
    });
  }

  function heroValue(key) {
    if (contentDraft.hero && contentDraft.hero[key] !== undefined) return contentDraft.hero[key];
    return (heroDefaults && heroDefaults[key]) || '';
  }

  function renderHomepage() {
    var view = $('#view-homepage');

    view.innerHTML = '<div class="view-head"><div><h1>Home page</h1>' +
      '<p>Reading the current copy from index.html…</p></div></div>';

    loadHeroDefaults().then(function () {
      var edited = Object.keys(contentDraft.hero || {}).length;

      var html = '<div class="view-head">' +
        '<div><h1>Home page</h1><p>The hero — the first thing every visitor sees. ' +
        (edited ? '<strong>Edited</strong> and waiting to be published.' : 'Currently as published.') + '</p></div>' +
        (edited ? '<button class="btn btn--ghost btn--sm btn--danger" type="button" id="hero-reset">Reset to published</button>' : '') +
      '</div>';

      html += '<div class="panel"><div class="panel__head">' +
        '<div><h2>Hero photo</h2><p>Managed in the media library alongside every other site image.</p></div>' +
        '<a class="btn btn--ghost btn--sm" href="#/media">Open Media</a>' +
        '</div><div class="panel__body">' +
        '<div class="hero-preview"><img src="' + esc(mediaSrc('assets/img/hero.svg')) + '" alt="Current hero image"></div>' +
        '</div></div>';

      html += '<div class="panel"><div class="panel__head"><div><h2>Hero copy</h2>' +
        '<p>Changes save as you type and preview instantly on the site.</p></div></div>' +
        '<div class="panel__body">' +
        HERO_FIELDS.map(function (f) {
          return field('hero-' + f.key, f.label, heroValue(f.key), {
            type: f.type, rows: 3, hint: f.hint, placeholder: (heroDefaults && heroDefaults[f.key]) || ''
          });
        }).join('') +
        '</div></div>';

      view.innerHTML = html;
    }).catch(function () {
      view.innerHTML = '<div class="view-head"><div><h1>Home page</h1></div></div>' +
        '<div class="notice notice--danger">' + ic('alert') + '<div>' +
        '<p><strong>Could not read index.html.</strong> Editing hero copy needs the admin ' +
        'panel to be served over http, not opened as a file. Run a local server ' +
        '(<code>npx serve .</code>) or use your deployed site.</p></div></div>';
    });
  }

  /* 7 · Products ---------------------------------------------------------- */
  function visibleProducts() {
    var f = state.filter;
    return state.products.filter(function (p) {
      if (f.category && p.category !== f.category) return false;
      if (f.status === 'live' && p.hidden) return false;
      if (f.status === 'hidden' && !p.hidden) return false;
      if (f.status === 'low' && (p.stock || 0) >= LOW_STOCK) return false;
      if (f.q) {
        var hay = [p.name, p.handle, p.sku, L.categoryLabel(p.category), L.collectionLabel(p.collection)]
          .concat(p.tags || []).join(' ').toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  function renderProducts() {
    var list = visibleProducts();

    var html =
      '<div class="view-head">' +
        '<div><h1>Products</h1><p>' + state.products.length + ' pieces in the catalogue. Changes save as you go.</p></div>' +
        '<button class="btn btn--sm" type="button" id="add-product">' + ic('plus') + ' Add product</button>' +
      '</div>' +

      '<div class="panel"><div class="admin-toolbar">' +
        '<div class="grow"><label class="visually-hidden" for="p-search">Search products</label>' +
        '<input type="search" id="p-search" placeholder="Search by name, SKU or tag…" value="' + esc(state.filter.q) + '"></div>' +
        '<label class="visually-hidden" for="p-cat">Category</label>' +
        '<select id="p-cat"><option value="">All categories</option>' +
          L.categories.map(function (c) {
            return '<option value="' + c.slug + '"' + (state.filter.category === c.slug ? ' selected' : '') + '>' + esc(c.label) + '</option>';
          }).join('') +
        '</select>' +
        '<label class="visually-hidden" for="p-status">Status</label>' +
        '<select id="p-status">' +
          ['', 'live', 'hidden', 'low'].map(function (v) {
            var label = { '': 'Any status', live: 'Live only', hidden: 'Hidden only', low: 'Low stock' }[v];
            return '<option value="' + v + '"' + (state.filter.status === v ? ' selected' : '') + '>' + label + '</option>';
          }).join('') +
        '</select>' +
      '</div><div class="panel__body--flush">';

    if (!list.length) {
      html += '<div class="empty-row"><h3>No products match</h3>' +
        '<p>Try a different search or clear the filters.</p>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="p-reset">Clear filters</button></div>';
    } else {
      html += '<div class="table-scroll"><table class="admin-table"><thead><tr>' +
        '<th>Product</th><th>Collection</th><th class="num">Price</th><th class="num">Stock</th>' +
        '<th>Badges</th><th>Status</th><th class="num">Actions</th>' +
        '</tr></thead><tbody>' +
        list.map(function (p) {
          var badges = (p.badges || []).map(function (b) {
            return '<span class="pill ' + (b === 'new' ? 'pill--gold' : 'pill--ink') + '">' + esc(b) + '</span>';
          }).join(' ');
          if (p.compareAt) badges += ' <span class="pill">sale</span>';

          return '<tr>' +
            '<td>' + productCell(p) + '</td>' +
            '<td>' + esc(L.collectionLabel(p.collection)) + '</td>' +
            '<td class="num">' + money(p.price) +
              (p.compareAt ? '<br><small style="color:var(--silver);text-decoration:line-through">' + money(p.compareAt) + '</small>' : '') +
            '</td>' +
            '<td class="num">' + ((p.stock || 0) < LOW_STOCK
              ? '<span class="pill pill--low">' + (p.stock || 0) + '</span>'
              : (p.stock || 0)) + '</td>' +
            '<td>' + (badges || '<span style="color:var(--line-strong)">—</span>') + '</td>' +
            '<td><span class="pill ' + (p.hidden ? 'pill--hidden' : 'pill--live') + '">' +
              (p.hidden ? 'Hidden' : 'Live') + '</span></td>' +
            '<td><div class="row-actions">' +
              '<button class="mini" type="button" data-edit="' + esc(p.handle) + '" title="Edit" aria-label="Edit ' + esc(p.name) + '">' + ic('pencil') + '</button>' +
              '<button class="mini" type="button" data-toggle="' + esc(p.handle) + '" title="' + (p.hidden ? 'Show on site' : 'Hide from site') + '" aria-label="' + (p.hidden ? 'Show' : 'Hide') + ' ' + esc(p.name) + '">' + ic(p.hidden ? 'eyeOff' : 'eye') + '</button>' +
              '<button class="mini" type="button" data-dupe="' + esc(p.handle) + '" title="Duplicate" aria-label="Duplicate ' + esc(p.name) + '">' + ic('copy') + '</button>' +
              '<button class="mini mini--danger" type="button" data-del="' + esc(p.handle) + '" title="Delete" aria-label="Delete ' + esc(p.name) + '">' + ic('trash') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }
    html += '</div></div>';

    $('#view-products').innerHTML = html;
  }

  function findProduct(handle) {
    for (var i = 0; i < state.products.length; i++) {
      if (state.products[i].handle === handle) return state.products[i];
    }
    return null;
  }

  function nextId() {
    return state.products.reduce(function (n, p) { return Math.max(n, p.id || 0); }, 0) + 1;
  }

  function uniqueHandle(base, ignoreHandle) {
    var handle = base, n = 2;
    while (state.products.some(function (p) { return p.handle === handle && p.handle !== ignoreHandle; })) {
      handle = base + '-' + n++;
    }
    return handle;
  }

  function blankProduct() {
    return L.normalise({
      id: nextId(),
      handle: '',
      name: '',
      category: 'rings',
      collection: 'aurora',
      price: 0,
      compareAt: null,
      rating: 5,
      reviews: 0,
      badges: ['new'],
      tags: [],
      stock: 10,
      excerpt: '',
      description: '',
      details: [''],
      added: new Date().toISOString().slice(0, 10),
      hidden: true
    });
  }

  /* 8 · Testimonials ------------------------------------------------------ */
  function renderTestimonials() {
    var html =
      '<div class="view-head">' +
        '<div><h1>Testimonials</h1><p>The quotes in the carousel on the home page.</p></div>' +
        '<button class="btn btn--sm" type="button" id="add-testimonial">' + ic('plus') + ' Add testimonial</button>' +
      '</div><div class="panel"><div class="panel__body--flush">';

    if (!state.testimonials.length) {
      html += '<div class="empty-row"><h3>No testimonials</h3><p>Add one and it appears in the home page carousel.</p></div>';
    } else {
      html += '<div class="table-scroll"><table class="admin-table"><thead><tr>' +
        '<th>Quote</th><th>Name</th><th>Attribution</th><th>Rating</th><th class="num">Actions</th>' +
        '</tr></thead><tbody>' +
        state.testimonials.map(function (t, i) {
          return '<tr>' +
            '<td style="max-width:420px">' + esc(t.quote.length > 130 ? t.quote.slice(0, 130) + '…' : t.quote) + '</td>' +
            '<td>' + esc(t.name) + '</td>' +
            '<td style="color:var(--silver)">' + esc(t.meta) + '</td>' +
            '<td>' + L.starsHtml(t.rating, true) + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="mini" type="button" data-edit-t="' + i + '" title="Edit" aria-label="Edit testimonial from ' + esc(t.name) + '">' + ic('pencil') + '</button>' +
              '<button class="mini mini--danger" type="button" data-del-t="' + i + '" title="Delete" aria-label="Delete testimonial from ' + esc(t.name) + '">' + ic('trash') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }
    html += '</div></div>';
    $('#view-testimonials').innerHTML = html;
  }

  /* 9 · Reviews ----------------------------------------------------------- */
  function renderReviews() {
    var reviews = allLocalReviews();

    var html =
      '<div class="view-head">' +
        '<div><h1>Reviews</h1><p>Reviews written through the product pages.</p></div>' +
        (reviews.length ? '<button class="btn btn--ghost btn--sm btn--danger" type="button" id="clear-reviews">Delete all</button>' : '') +
      '</div>';

    html += '<div class="notice">' + ic('alert') + '<div>' +
      '<p>These reviews live in <strong>this browser only</strong> — they are not shared between ' +
      'devices and no one else can see them. Connect a review service (Judge.me, Okendo, or ' +
      'Shopify Product Reviews) to collect them for real; see README §7.</p>' +
    '</div></div>';

    html += '<div class="panel"><div class="panel__body--flush">';
    if (!reviews.length) {
      html += '<div class="empty-row"><h3>No reviews yet</h3>' +
        '<p>Submit one from a product page and it will show up here.</p>' +
        '<a class="btn btn--ghost btn--sm" href="product.html?p=' + esc(state.products.length ? state.products[0].handle : '') + '" target="_blank" rel="noopener">Open a product page</a></div>';
    } else {
      html += '<div class="table-scroll"><table class="admin-table"><thead><tr>' +
        '<th>Product</th><th>Reviewer</th><th>Rating</th><th>Review</th><th class="num">Date</th><th class="num">Actions</th>' +
        '</tr></thead><tbody>' +
        reviews.map(function (r) {
          var p = L.getProduct(r.handle);
          return '<tr>' +
            '<td>' + (p
              ? '<a href="product.html?p=' + esc(p.handle) + '" target="_blank" rel="noopener" style="border-bottom:1px solid var(--line-strong)">' + esc(p.name) + '</a>'
              : esc(r.handle)) + '</td>' +
            '<td>' + esc(r.review.name) + '</td>' +
            '<td>' + L.starsHtml(r.review.rating, true) + '</td>' +
            '<td style="max-width:380px"><b style="font-weight:400">' + esc(r.review.title) + '</b>' +
              '<br><span style="color:var(--graphite);font-size:.84rem">' +
              esc(r.review.body.length > 120 ? r.review.body.slice(0, 120) + '…' : r.review.body) + '</span></td>' +
            '<td class="num">' + dateLabel(r.review.date) + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="mini mini--danger" type="button" data-del-r="' + esc(r.handle) + '|' + r.index + '" title="Delete" aria-label="Delete review">' + ic('trash') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }
    html += '</div></div>';

    $('#view-reviews').innerHTML = html;
  }

  /* 10 · Subscribers ------------------------------------------------------ */
  function renderSubscribers() {
    var subs = subscribers();

    var html =
      '<div class="view-head">' +
        '<div><h1>Subscribers</h1><p>Emails captured by the newsletter form.</p></div>' +
        (subs.length ? '<div style="display:flex;gap:10px">' +
          '<button class="btn btn--ghost btn--sm" type="button" id="export-csv">' + ic('download') + ' Export CSV</button>' +
          '<button class="btn btn--ghost btn--sm btn--danger" type="button" id="clear-subs">Delete all</button>' +
        '</div>' : '') +
      '</div>';

    html += '<div class="notice">' + ic('alert') + '<div>' +
      '<p>The newsletter form is in demo mode, so signups are stored in <strong>this browser only</strong>. ' +
      'Connect Klaviyo, Mailchimp or Omnisend to collect them properly — README §6.</p>' +
    '</div></div>';

    html += '<div class="panel"><div class="panel__body--flush">';
    if (!subs.length) {
      html += '<div class="empty-row"><h3>No subscribers yet</h3><p>Signups from the home page form will be listed here.</p></div>';
    } else {
      html += '<div class="table-scroll"><table class="admin-table"><thead><tr>' +
        '<th>Email</th><th>Signed up</th><th>From page</th><th class="num">Actions</th>' +
        '</tr></thead><tbody>' +
        subs.slice().reverse().map(function (s, i) {
          var realIndex = subs.length - 1 - i;
          return '<tr>' +
            '<td><a href="mailto:' + esc(s.email) + '" style="border-bottom:1px solid var(--line-strong)">' + esc(s.email) + '</a></td>' +
            '<td>' + dateLabel(s.at) + '</td>' +
            '<td style="color:var(--silver)">' + esc(s.source || '—') + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="mini mini--danger" type="button" data-del-s="' + realIndex + '" title="Remove" aria-label="Remove subscriber">' + ic('trash') + '</button>' +
            '</div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    }
    html += '</div></div>';

    $('#view-subscribers').innerHTML = html;
  }

  /* 11 · Data & settings -------------------------------------------------- */
  function renderData() {
    var saved = localStorage.getItem(L.STORAGE_CATALOGUE);
    var savedAt = saved ? (read(L.STORAGE_CATALOGUE, {}).savedAt || null) : null;

    var html =
      '<div class="view-head"><div><h1>Data &amp; settings</h1>' +
      '<p>Publish your changes, back them up, and manage access.</p></div></div>';

    /* Publish */
    var photos = uploadedCount();
    var used = storageUsed();

    html += '<div class="panel"><div class="panel__head">' +
      '<div><h2>Publish changes</h2><p>' +
        (saved ? 'Last edited ' + dateLabel(savedAt) + ' — not yet published.' : 'No unpublished changes.') +
      '</p></div></div><div class="panel__body">' +
      '<div class="notice">' + ic('alert') + '<div>' +
        '<p><strong>How publishing works.</strong> Your edits live in this browser. To make them ' +
        'live for everyone, put the files below into the project and redeploy.</p>' +
        (photos
          ? '<p><strong>You have ' + photos + ' uploaded photo' + (photos === 1 ? '' : 's') + '.</strong> ' +
            'Download the ZIP first and unzip it into <code>assets/img/</code>, then download ' +
            '<code>data.js</code> — it will reference those files by name instead of embedding them.</p>'
          : '') +
      '</div></div>';

    var replaced = mediaChanged().length;
    var heroCount = Object.keys(contentDraft.hero || {}).length;

    html += '<p style="font-size:.88rem;color:var(--graphite);margin-bottom:6px">Waiting to publish:</p>' +
      '<ul style="margin:0 0 22px;padding-left:18px;font-size:.9rem;color:var(--graphite)">' +
        '<li>' + (saved ? 'Catalogue changes' : 'No catalogue changes') + '</li>' +
        '<li>' + (photos ? photos + ' uploaded product photo' + (photos === 1 ? '' : 's') : 'No product photo uploads') + '</li>' +
        '<li>' + (replaced ? replaced + ' replaced site photo' + (replaced === 1 ? '' : 's') : 'No site photo replacements') + '</li>' +
        '<li>' + (heroCount ? 'Hero copy edits' : 'No hero copy edits') + '</li>' +
      '</ul>';

    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">' +
      '<button class="btn btn--sm" type="button" id="dl-bundle">' + ic('zip') + ' Download site update (.zip)</button>' +
      '</div>' +
      '<p class="field__hint" style="margin-bottom:24px">Everything that changed, in one archive. ' +
      'Unzip it over your project folder, keeping the folder structure, then deploy.</p>';

    html += '<div class="fieldset-title">Individual files</div>';

    if (photos) {
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">' +
        '<button class="btn btn--ghost btn--sm" type="button" id="dl-images">' + ic('zip') + ' Product photos only (' + photos + ')</button>' +
        '</div>' +
        '<label class="check" style="margin-bottom:18px">' +
          '<input type="checkbox" id="use-paths" checked>' +
          '<i aria-hidden="true"></i>' +
          '<span>Reference uploaded photos as files in <code>assets/img/</code> (recommended)</span>' +
        '</label>';
    }

    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">' +
        '<button class="btn btn--ghost btn--sm" type="button" id="dl-datajs">' + ic('download') + ' Download data.js</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="copy-datajs">Copy to clipboard</button>' +
      '</div>' +
      '<label class="visually-hidden" for="datajs-out">Generated data.js</label>' +
      '<textarea class="code-out" id="datajs-out" readonly spellcheck="false"></textarea>' +
      '</div></div>';

    /* Storage */
    html += '<div class="panel"><div class="panel__head">' +
      '<div><h2>Browser storage</h2><p>Uploaded photos are held here until you publish them.</p></div>' +
      '</div><div class="panel__body">' +
      '<div class="meter"><i style="width:' + Math.min(100, used.percent) + '%"' +
        (used.percent > 75 ? ' class="is-high"' : '') + '></i></div>' +
      '<p style="font-size:.86rem;color:var(--graphite)">' +
        '<strong style="font-weight:400">' + kb(used.bytes) + '</strong> of roughly 5 MB used' +
        (photos ? ' · ' + photos + ' photo' + (photos === 1 ? '' : 's') + ' stored' : '') + '.</p>' +
      (used.percent > 75
        ? '<div class="notice notice--danger" style="margin-top:16px">' + ic('alert') + '<div>' +
          '<p>Storage is nearly full. Publish your photos (download the ZIP, unzip into ' +
          '<code>assets/img/</code>, deploy the new <code>data.js</code>), then use ' +
          '<em>Discard unpublished changes</em> to free the space.</p></div></div>'
        : '') +
      '</div></div>';

    /* Backup */
    html += '<div class="panel"><div class="panel__head">' +
      '<div><h2>Backup &amp; restore</h2><p>A JSON snapshot of products and testimonials.</p></div>' +
      '</div><div class="panel__body">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
        '<button class="btn btn--ghost btn--sm" type="button" id="dl-json">' + ic('download') + ' Download backup</button>' +
        '<label class="btn btn--ghost btn--sm" for="import-json" style="cursor:pointer">' + ic('upload') + ' Restore from backup</label>' +
        '<input type="file" id="import-json" accept="application/json,.json" hidden>' +
      '</div>' +
      '<p class="field__hint" style="margin-top:14px">Restoring replaces the current catalogue. Download a backup first if you are unsure.</p>' +
      '</div></div>';

    /* Passcode */
    html += '<div class="panel"><div class="panel__head">' +
      '<div><h2>Admin passcode</h2><p>' +
        (storedHash() ? 'A custom passcode is set.' : 'Still using the default passcode — change it.') +
      '</p></div></div><div class="panel__body">' +
      '<div class="notice notice--danger">' + ic('lock') + '<div>' +
        '<p><strong>This gate is not real security.</strong> The check runs in the visitor\'s ' +
        'browser, so anyone who reads this page\'s JavaScript can bypass it. It only stops ' +
        'casual snooping.</p>' +
        '<p>To protect this page properly, put it behind your host\'s access control — Netlify ' +
        'Identity with role-gating, Cloudflare Access, or HTTP basic auth. README §11 has the steps.</p>' +
      '</div></div>' +
      '<div class="field-grid">' +
        '<div class="field"><label for="new-pass">New passcode</label>' +
        '<input type="password" id="new-pass" autocomplete="new-password" placeholder="At least 8 characters"></div>' +
        '<div class="field"><label for="new-pass2">Confirm passcode</label>' +
        '<input type="password" id="new-pass2" autocomplete="new-password" placeholder="Repeat it"></div>' +
      '</div>' +
      '<button class="btn btn--sm" type="button" id="save-pass">Update passcode</button>' +
      '</div></div>';

    /* Danger zone */
    html += '<div class="panel danger-zone"><div class="panel__head">' +
      '<div><h2>Discard local changes</h2><p>Revert to the catalogue as shipped in data.js.</p></div>' +
      '</div><div class="panel__body">' +
      '<p style="color:var(--graphite);margin-bottom:18px">This deletes every unpublished edit stored ' +
      'in this browser and reloads the panel. Anything you have already exported and deployed is unaffected.</p>' +
      '<button class="btn btn--sm btn--danger" type="button" id="reset-all"' + (saved ? '' : ' disabled') + '>' +
      'Discard unpublished changes</button>' +
      '</div></div>';

    $('#view-data').innerHTML = html;
    refreshDataJs();
  }

  function refreshDataJs() {
    var box = $('#datajs-out');
    if (!box) return;
    var toggle = $('#use-paths');
    box.value = buildDataJs(toggle ? toggle.checked : false);
  }

  /* Rough gauge of how much of the ~5 MB localStorage budget we are using. */
  function storageUsed() {
    var bytes = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        bytes += (key.length + (localStorage.getItem(key) || '').length) * 2;
      }
    } catch (e) { /* storage blocked */ }
    return { bytes: bytes, percent: Math.round((bytes / (5 * 1024 * 1024)) * 100) };
  }

  /* — Turning uploaded photos back into files ————————————————————
     Walks the catalogue, gives every uploaded (data URI) photo a filename
     derived from its product handle, and returns both the file list and a
     lookup so the exported data.js can reference paths instead of blobs. */
  function imageManifest() {
    var files = [];
    var map = {};          // data URI -> assets/img/<name>
    var used = {};

    state.products.forEach(function (p) {
      var sources = [p.image].concat(p.gallery || []);
      var n = 0;

      sources.forEach(function (src) {
        if (!isData(src) || map[src]) return;
        n++;
        var ext = (src.slice(11, src.indexOf(';')) || 'jpeg').replace('jpeg', 'jpg');
        var base = (p.handle || 'product') + (n > 1 ? '-' + n : '');
        var name = base + '.' + ext;
        while (used[name]) { n++; name = (p.handle || 'product') + '-' + n + '.' + ext; }
        used[name] = true;

        map[src] = 'assets/img/' + name;
        files.push({ name: name, bytes: dataUriToBytes(src) });
      });
    });

    return { files: files, map: map };
  }

  function dataUriToBytes(uri) {
    var binary = atob(uri.slice(uri.indexOf(',') + 1));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function uploadedCount() {
    var seen = {}, n = 0;
    state.products.forEach(function (p) {
      [p.image].concat(p.gallery || []).forEach(function (src) {
        if (isData(src) && !seen[src]) { seen[src] = 1; n++; }
      });
    });
    return n;
  }

  /* Minimal store-only ZIP writer — the photos are already compressed, so
     there is nothing to gain from deflate and this needs no dependencies. */
  function crc32(bytes) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Int32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c;
      }
    }
    var crc = -1;
    for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ -1) >>> 0;
  }

  function zipFiles(files) {
    var encoder = new TextEncoder();
    var parts = [], central = [], offset = 0;

    files.forEach(function (f) {
      var nameBytes = encoder.encode(f.name);
      var sum = crc32(f.bytes);
      var size = f.bytes.length;

      var local = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);          // stored, no compression
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, sum, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      local.set(nameBytes, 30);

      parts.push(local, f.bytes);

      var dir = new Uint8Array(46 + nameBytes.length);
      var dv = new DataView(dir.buffer);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 20, true);
      dv.setUint16(8, 0, true);
      dv.setUint16(10, 0, true);
      dv.setUint16(12, 0, true);
      dv.setUint16(14, 0, true);
      dv.setUint32(16, sum, true);
      dv.setUint32(20, size, true);
      dv.setUint32(24, size, true);
      dv.setUint16(28, nameBytes.length, true);
      dv.setUint32(42, offset, true);
      dir.set(nameBytes, 46);
      central.push(dir);

      offset += local.length + size;
    });

    var centralSize = central.reduce(function (n, c) { return n + c.length; }, 0);
    var end = new Uint8Array(22);
    var ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
  }

  /* — Publishing media and page copy ————————————————————————————
     Replaced photos get a real filename, the HTML pages that reference the old
     path are rewritten to point at it, and hero copy edits are written into
     index.html. Everything lands in one zip you unpack at the project root. */

  var SITE_PAGES = ['index.html', 'shop.html', 'product.html', 'about.html',
    'contact.html', 'faq.html', 'privacy.html', 'terms.html', '404.html'];

  function mediaManifest() {
    var files = [], map = {};
    Object.keys(contentDraft.media || {}).forEach(function (path) {
      var src = contentDraft.media[path];
      if (!isData(src)) { map[path] = src; return; }        // already a linked path
      var ext = (src.slice(11, src.indexOf(';')) || 'jpeg').replace('jpeg', 'jpg');
      var base = path.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
      var name = 'assets/img/' + base + '.' + ext;
      map[path] = name;
      files.push({ name: name, bytes: dataUriToBytes(src) });
    });
    return { files: files, map: map };
  }

  function heroEdits() {
    return Object.keys(contentDraft.hero || {}).filter(function (k) {
      return !heroDefaults || contentDraft.hero[k] !== heroDefaults[k];
    });
  }

  /* Applies media paths and hero copy to one page's HTML source. */
  function rewritePage(name, html, map) {
    var before = html;

    Object.keys(map).forEach(function (oldPath) {
      if (map[oldPath] && map[oldPath] !== oldPath) {
        html = html.split(oldPath).join(map[oldPath]);
      }
    });

    if (name === 'index.html' && heroEdits().length) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var touched = false;

      ['eyebrow', 'title1', 'title2', 'text'].forEach(function (key) {
        if (contentDraft.hero[key] === undefined) return;
        var el = doc.querySelector('[data-hero="' + key + '"]');
        if (el) { el.textContent = contentDraft.hero[key]; touched = true; }
      });

      [['cta1', 'cta1Label', 'cta1Href'], ['cta2', 'cta2Label', 'cta2Href']].forEach(function (set) {
        var el = doc.querySelector('[data-hero="' + set[0] + '"]');
        if (!el) return;
        if (contentDraft.hero[set[1]] !== undefined) { el.textContent = contentDraft.hero[set[1]]; touched = true; }
        if (contentDraft.hero[set[2]] !== undefined) { el.setAttribute('href', contentDraft.hero[set[2]]); touched = true; }
      });

      if (touched) html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';
    }

    return html === before ? null : html;
  }

  /* Fetches every page that needs changing and returns them rewritten. */
  function buildPageUpdates(map) {
    var needed = SITE_PAGES.filter(function (name) { return true; });
    return Promise.all(needed.map(function (name) {
      return fetch(name)
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (html) {
          if (!html) return null;
          var out = rewritePage(name, html, map);
          return out ? { name: name, text: out } : null;
        })
        .catch(function () { return null; });
    })).then(function (results) { return results.filter(Boolean); });
  }

  /* Rebuilds a complete, deployable assets/js/data.js from the current state.
     Helper functions are serialised from the live objects so the generated
     file always matches the behaviour of the running code. */
  function buildDataJs(useFilePaths) {
    var map = useFilePaths ? imageManifest().map : {};
    var products = state.products;

    if (useFilePaths) {
      products = state.products.map(function (p) {
        var copy = clone(p);
        if (map[p.image]) copy.image = map[p.image];
        copy.gallery = (p.gallery || []).map(function (src) { return map[src] || src; });
        return copy;
      });
    }

    var j = function (v) { return JSON.stringify(v, null, 2).replace(/\n/g, '\n  '); };
    var fn = function (name) { return '  L.' + name + ' = ' + L[name].toString().replace(/\n/g, '\n  ') + ';'; };

    var helpers = ['normalise', 'live', 'money', 'getProduct', 'getReviews', 'labelFor',
      'categoryLabel', 'collectionLabel', 'metal', 'byBadge', 'newest', 'related',
      'ratingBreakdown', 'priceRange'];

    return [
      '/* ==========================================================================',
      '   Lumina Jewelry — Catalogue data',
      '   Generated by the admin panel on ' + new Date().toISOString().slice(0, 10) + '.',
      '   Replace assets/js/data.js with this file and redeploy to publish.',
      '   ========================================================================== */',
      'window.LUMINA = window.LUMINA || {};',
      '',
      '(function (L) {',
      "  'use strict';",
      '',
      '  L.currency = ' + j(L.currency) + ';',
      '  L.categories = ' + j(L.categories) + ';',
      '  L.collections = ' + j(L.collections) + ';',
      '  L.metals = ' + j(L.metals) + ';',
      '  L.galleries = ' + j(L.galleries) + ';',
      '  L.sizeSets = ' + j(L.sizeSets) + ';',
      '',
      helpers.map(fn).join('\n\n'),
      '',
      '  L.products = (' + j(products) + ').map(function (p) { return L.normalise(p); });',
      '',
      '  L.reviews = ' + j(L.reviews) + ';',
      '',
      '  L.testimonials = ' + j(state.testimonials) + ';',
      '',
      '  /* Admin overrides — an edited catalogue saved by the admin panel shadows',
      '     the arrays above in that browser only. */',
      "  L.STORAGE_CATALOGUE = 'lumina.admin.catalogue.v1';",
      '  L.hasOverrides = false;',
      '',
      '  (function applyOverrides() {',
      '    var saved;',
      '    try {',
      "      saved = JSON.parse(localStorage.getItem(L.STORAGE_CATALOGUE) || 'null');",
      '    } catch (e) { return; }',
      '    if (!saved) return;',
      '',
      '    if (Array.isArray(saved.products) && saved.products.length) {',
      '      L.products = saved.products.map(function (p) { return L.normalise(p); });',
      '      L.hasOverrides = true;',
      '    }',
      '    if (Array.isArray(saved.testimonials) && saved.testimonials.length) {',
      '      L.testimonials = saved.testimonials;',
      '      L.hasOverrides = true;',
      '    }',
      '    L.overridesSavedAt = saved.savedAt || null;',
      '  })();',
      '})(window.LUMINA);',
      ''
    ].join('\n');
  }

  /* The checkout function prices orders from its own copy of the catalogue,
     so it has to be republished whenever prices change. */
  function buildCatalogueJs() {
    var map = {};
    state.products.forEach(function (p) {
      map[p.handle] = { name: p.name, price: p.price };
    });

    return [
      '/* ==========================================================================',
      '   Lumina Jewelry — Server-side price list',
      '   The checkout function prices every order from THIS file, never from the',
      '   browser, so a tampered cart cannot change what a customer is charged.',
      '',
      '   Generated by the admin panel on ' + new Date().toISOString().slice(0, 10) + '.',
      '   Keep it in step with assets/js/data.js; if a handle is missing here,',
      '   checkout rejects the order.',
      '   ========================================================================== */',
      'module.exports = ' + JSON.stringify(map, null, 2) + ';',
      ''
    ].join('\n');
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* 12 · Images ----------------------------------------------------------- */
  /* There is no server to upload to, so a chosen photo is decoded, resized and
     re-encoded in the browser, then held as a data URI. That makes it visible
     across the storefront straight away. At publish time `Download images`
     turns those data URIs back into real files and the exported data.js
     references them by path — see README §12. */

  var MAX_EDGE = 1200;         // longest side, px
  var QUALITY = 0.82;
  var WARN_BYTES = 400 * 1024; // per image, before we grumble

  var bestFormat = null;
  function pickFormat() {
    if (bestFormat) return bestFormat;
    var c = document.createElement('canvas');
    c.width = c.height = 1;
    var webp = c.toDataURL('image/webp', 0.8);
    // Browsers that cannot encode WebP silently hand back a PNG instead.
    bestFormat = webp.indexOf('data:image/webp') === 0
      ? { mime: 'image/webp', ext: 'webp' }
      : { mime: 'image/jpeg', ext: 'jpg' };
    return bestFormat;
  }

  function isData(src) { return typeof src === 'string' && src.indexOf('data:') === 0; }

  function dataBytes(uri) {
    var comma = uri.indexOf(',');
    if (comma === -1) return 0;
    return Math.round((uri.length - comma - 1) * 0.75);
  }

  function kb(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function processImage(file, maxEdge) {
    maxEdge = maxEdge || MAX_EDGE;
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No file chosen.'));
      if (file.type.indexOf('image/') !== 0) return reject(new Error('“' + file.name + '” is not an image.'));

      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read “' + file.name + '”.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('“' + file.name + '” could not be decoded.')); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) return reject(new Error('“' + file.name + '” has no dimensions.'));

          var scale = Math.min(1, maxEdge / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));

          var canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';           // flatten transparency — JPEG has none
          ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, 0, 0, cw, ch);

          var fmt = pickFormat();
          var url = canvas.toDataURL(fmt.mime, QUALITY);
          resolve({ src: url, width: cw, height: ch, bytes: dataBytes(url), name: file.name });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* Working image state for the open editor */
  var editorImages = { main: '', gallery: [] };

  function imageMeta(src) {
    if (!src) return '';
    if (!isData(src)) return '<b>Linked file</b> · ' + esc(src);
    return '<b>Uploaded</b> · ' + kb(dataBytes(src)) +
      (dataBytes(src) > WARN_BYTES ? ' · large' : '');
  }

  /* One picker slot — used by the product main photo and the hero image. */
  function renderSinglePicker(name, alt, pathInputId, placeholder) {
    var box = $('#picker-' + name);
    if (!box) return;
    var spec = PICKERS[name];
    var src = spec.get();

    box.innerHTML = src
      ? '<div class="picker__preview">' +
          '<img src="' + esc(src) + '" alt="' + esc(alt) + '">' +
          '<div class="picker__bar">' +
            '<span class="meta">' + imageMeta(src) + '</span>' +
            '<label class="btn btn--ghost btn--sm">Replace' +
              '<input type="file" accept="image/*" data-img="' + name + '" hidden></label>' +
            '<button class="btn btn--ghost btn--sm" type="button" data-img-clear="' + name + '">Remove</button>' +
          '</div>' +
        '</div>'
      : '<label class="picker__drop" data-drop="' + name + '">' +
          ic('image') +
          '<b>Choose a photo, or drag one here</b>' +
          '<span>JPG, PNG or WebP · resized to ' + spec.maxEdge + 'px and compressed automatically</span>' +
          '<input type="file" accept="image/*" data-img="' + name + '">' +
        '</label>';

    box.insertAdjacentHTML('beforeend',
      '<div class="picker__busy" id="busy-' + name + '"><i></i> Processing…</div>' +
      '<button class="path-toggle" type="button" data-path-toggle="' + name + '">Or link to a file already in assets/img</button>' +
      '<div class="field" id="path-' + name + '" hidden style="margin-top:12px">' +
        '<label for="' + pathInputId + '">Image path</label>' +
        '<input type="text" id="' + pathInputId + '" value="' + (isData(src) ? '' : esc(src || '')) + '" placeholder="' + esc(placeholder) + '">' +
      '</div>');
  }

  function renderMainPicker() {
    renderSinglePicker('main', 'Main product photo preview', 'f-image', 'assets/img/ring-1.svg');
  }

  function renderGalleryPicker() {
    var box = $('#picker-gallery');
    if (!box) return;

    box.innerHTML =
      '<div class="picker__grid">' +
        editorImages.gallery.map(function (src, i) {
          return '<div class="picker__tile">' +
            '<img src="' + esc(src) + '" alt="Gallery photo ' + (i + 1) + '">' +
            '<button type="button" data-gal-del="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + ic('x') + '</button>' +
            (isData(src) ? '' : '<span class="tag">linked</span>') +
          '</div>';
        }).join('') +
        '<label class="picker__tile is-add">' + ic('plus') +
          '<input type="file" accept="image/*" multiple data-img="gallery">' +
        '</label>' +
      '</div>' +
      '<div class="picker__busy" id="busy-gallery"><i></i> Processing…</div>' +
      '<button class="path-toggle" type="button" data-path-toggle="gallery">Or add one by path</button>' +
      '<div class="field" id="path-gallery" hidden style="margin-top:12px">' +
        '<label for="gal-path">Image path</label>' +
        '<div style="display:flex;gap:8px">' +
          '<input type="text" id="gal-path" placeholder="assets/img/ring-2.svg">' +
          '<button class="btn btn--ghost btn--sm" type="button" id="gal-path-add">Add</button>' +
        '</div>' +
      '</div>';
  }

  function busy(which, on) {
    var el = $('#busy-' + which);
    if (el) el.classList.toggle('is-on', on);
  }

  /* Every picker on the page, and where its result goes. */
  var PICKERS = {
    main: {
      maxEdge: 1200, multiple: false,
      get: function () { return editorImages.main; },
      set: function (v) { editorImages.main = v; },
      render: function () { renderMainPicker(); }
    },
    gallery: {
      maxEdge: 1200, multiple: true,
      add: function (v) { editorImages.gallery.push(v); },
      render: function () { renderGalleryPicker(); }
    }
  };

  function takeFiles(which, fileList) {
    var spec = PICKERS[which];
    if (!spec) return;
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    busy(which, true);

    var jobs = (spec.multiple ? files : files.slice(0, 1)).map(function (f) {
      return processImage(f, spec.maxEdge).catch(function (err) { L.toast(err.message); return null; });
    });

    Promise.all(jobs).then(function (results) {
      var ok = results.filter(Boolean);
      busy(which, false);
      if (!ok.length) return;

      if (spec.multiple) ok.forEach(function (r) { spec.add(r.src); });
      else spec.set(ok[0].src);
      spec.render();

      var heavy = ok.filter(function (r) { return r.bytes > WARN_BYTES; });
      L.toast(ok.length === 1
        ? 'Photo added — ' + ok[0].width + '×' + ok[0].height + ', ' + kb(ok[0].bytes)
        : ok.length + ' photos added');
      if (heavy.length) {
        L.toast(heavy.length + ' photo' + (heavy.length > 1 ? 's are' : ' is') + ' still large. Crop tighter before uploading if storage runs short.');
      }
    });
  }

  /* 13 · Media library ---------------------------------------------------- */
  /* Every non-product image on the site, keyed by its published path. One
     replacement updates every page that references that path. */

  var MEDIA = [
    { path: 'assets/img/hero.svg', label: 'Hero banner', group: 'Home page', ratio: '16 : 10', edge: 2000,
      note: 'The biggest image on the site. Detail on the right reads best — the headline sits over the left.' },
    { path: 'assets/img/collection-aurora.svg', label: 'Collection card — Aurora', group: 'Home page', ratio: '3 : 4', edge: 1400 },
    { path: 'assets/img/collection-celeste.svg', label: 'Collection card — Celeste', group: 'Home page', ratio: '3 : 4', edge: 1400 },
    { path: 'assets/img/collection-eclat.svg', label: 'Collection card — Éclat', group: 'Home page', ratio: '3 : 4', edge: 1400 },
    { path: 'assets/img/insta-1.svg', label: 'Instagram tile 1', group: 'Instagram grid', ratio: '1 : 1', edge: 900 },
    { path: 'assets/img/insta-2.svg', label: 'Instagram tile 2', group: 'Instagram grid', ratio: '1 : 1', edge: 900 },
    { path: 'assets/img/insta-3.svg', label: 'Instagram tile 3', group: 'Instagram grid', ratio: '1 : 1', edge: 900 },
    { path: 'assets/img/insta-4.svg', label: 'Instagram tile 4', group: 'Instagram grid', ratio: '1 : 1', edge: 900 },
    { path: 'assets/img/insta-5.svg', label: 'Instagram tile 5', group: 'Instagram grid', ratio: '1 : 1', edge: 900 },
    { path: 'assets/img/insta-6.svg', label: 'Instagram tile 6', group: 'Instagram grid', ratio: '1 : 1', edge: 900 },
    { path: 'assets/img/story-atelier.svg', label: 'Story photo — the atelier', group: 'Home page & About', ratio: '4 : 5', edge: 1400,
      note: 'Used on both the home page and the About page.' },
    { path: 'assets/img/story-craft.svg', label: 'Story photo — at the bench', group: 'About page', ratio: '4 : 5', edge: 1400 },
    { path: 'assets/img/team-1.svg', label: 'Team portrait — Sarah Williams', group: 'About page', ratio: '3 : 4', edge: 1200 },
    { path: 'assets/img/team-2.svg', label: 'Team portrait — Marguerite Oyelaran', group: 'About page', ratio: '3 : 4', edge: 1200 },
    { path: 'assets/img/team-3.svg', label: 'Team portrait — Dominique Reyes', group: 'About page', ratio: '3 : 4', edge: 1200 },
    { path: 'assets/img/og-cover.svg', label: 'Social sharing card', group: 'Every page', ratio: '1200 × 630', edge: 1200,
      note: 'Shown when a link to your site is posted on social media or messaging apps.' }
  ];

  function mediaSpec(path) {
    for (var i = 0; i < MEDIA.length; i++) if (MEDIA[i].path === path) return MEDIA[i];
    return null;
  }

  function mediaSrc(path) {
    return (contentDraft.media && contentDraft.media[path]) || path;
  }

  function mediaChanged() {
    return Object.keys(contentDraft.media || {}).filter(function (k) { return contentDraft.media[k]; });
  }

  function renderMedia() {
    var changed = mediaChanged().length;
    var groups = [];
    MEDIA.forEach(function (m) { if (groups.indexOf(m.group) === -1) groups.push(m.group); });

    var html =
      '<div class="view-head">' +
        '<div><h1>Media</h1><p>Every photo on the site apart from product shots. ' +
        (changed ? '<strong>' + changed + ' replaced</strong> and waiting to be published.' : 'None replaced yet.') +
        '</p></div>' +
        (changed ? '<button class="btn btn--ghost btn--sm btn--danger" type="button" id="media-reset-all">Reset all</button>' : '') +
      '</div>';

    html += '<div class="notice">' + ic('alert') + '<div>' +
      '<p>Choose a photo and it appears across the site straight away so you can preview it. ' +
      'Publish from <a href="#/data" style="border-bottom:1px solid currentColor">Data &amp; settings</a> ' +
      'to make it live for visitors.</p>' +
    '</div></div>';

    groups.forEach(function (group) {
      html += '<div class="panel"><div class="panel__head"><div><h2>' + esc(group) + '</h2></div></div>' +
        '<div class="panel__body"><div class="media-grid">' +
        MEDIA.filter(function (m) { return m.group === group; }).map(function (m) {
          var replaced = !!(contentDraft.media && contentDraft.media[m.path]);
          return '<div class="media-card' + (replaced ? ' is-replaced' : '') + '">' +
            '<div class="media-card__shot">' +
              '<img src="' + esc(mediaSrc(m.path)) + '" alt="' + esc(m.label) + '" loading="lazy">' +
              (replaced ? '<span class="media-card__flag">Replaced</span>' : '') +
            '</div>' +
            '<div class="media-card__body">' +
              '<strong>' + esc(m.label) + '</strong>' +
              '<span class="media-card__meta">' + esc(m.ratio) + ' · ' +
                (replaced ? kb(dataBytes(contentDraft.media[m.path])) : esc(m.path.split('/').pop())) + '</span>' +
              (m.note ? '<span class="media-card__note">' + esc(m.note) + '</span>' : '') +
              '<div class="media-card__actions">' +
                '<label class="btn btn--ghost btn--sm">' + (replaced ? 'Replace again' : 'Choose photo') +
                  '<input type="file" accept="image/*" data-media="' + esc(m.path) + '" hidden></label>' +
                (replaced ? '<button class="btn btn--ghost btn--sm" type="button" data-media-reset="' + esc(m.path) + '">Reset</button>' : '') +
              '</div>' +
              '<div class="picker__busy" id="busy-media-' + esc(m.path.replace(/[^a-z0-9]/gi, '')) + '"><i></i> Processing…</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div></div></div>';
    });

    $('#view-media').innerHTML = html;
  }

  function takeMedia(path, file) {
    var spec = mediaSpec(path);
    if (!spec || !file) return;
    var busyId = 'busy-media-' + path.replace(/[^a-z0-9]/gi, '');
    var el = document.getElementById(busyId);
    if (el) el.classList.add('is-on');

    processImage(file, spec.edge).then(function (result) {
      contentDraft.media = contentDraft.media || {};
      contentDraft.media[path] = result.src;
      persistContent();
      renderMedia();
      L.toast(spec.label + ' replaced — ' + result.width + '×' + result.height + ', ' + kb(result.bytes));
    }).catch(function (err) {
      if (el) el.classList.remove('is-on');
      L.toast(err.message);
    });
  }

  /* 14 · Editor ----------------------------------------------------------- */
  function openEditor(title, sub, body, onSave) {
    $('#editor-title').textContent = title;
    $('#editor-sub').textContent = sub || '';
    $('#editor-body').innerHTML = body;
    $('#editor').classList.add('is-open');
    $('#editor').removeAttribute('aria-hidden');
    var scrim = $('.scrim');
    if (scrim) scrim.classList.add('is-open');
    document.body.classList.add('is-locked');
    state.editing = onSave;
    var first = $('#editor-body input, #editor-body select, #editor-body textarea');
    if (first) setTimeout(function () { first.focus(); }, 140);
  }

  function closeEditor() {
    $('#editor').classList.remove('is-open');
    $('#editor').setAttribute('aria-hidden', 'true');
    var scrim = $('.scrim');
    if (scrim) scrim.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    state.editing = null;
  }

  function field(id, label, value, opts) {
    opts = opts || {};
    var input;
    if (opts.type === 'textarea') {
      input = '<textarea id="' + id + '"' + (opts.rows ? ' rows="' + opts.rows + '"' : '') +
        (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + '>' + esc(value || '') + '</textarea>';
    } else if (opts.type === 'select') {
      input = '<select id="' + id + '">' + opts.options.map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(value) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('') + '</select>';
    } else {
      input = '<input type="' + (opts.type || 'text') + '" id="' + id + '" value="' + esc(value === null || value === undefined ? '' : value) + '"' +
        (opts.step ? ' step="' + opts.step + '"' : '') +
        (opts.min !== undefined ? ' min="' + opts.min + '"' : '') +
        (opts.max !== undefined ? ' max="' + opts.max + '"' : '') +
        (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + '>';
    }
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + input +
      (opts.hint ? '<p class="field__hint">' + opts.hint + '</p>' : '') + '</div>';
  }

  function repeater(id, label, values, placeholder) {
    return '<div class="field"><label>' + esc(label) + '</label>' +
      '<div class="repeater" id="' + id + '">' +
        (values.length ? values : ['']).map(function (v) { return repeaterRow(v, placeholder); }).join('') +
      '</div>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-rep-add="' + id + '" style="margin-top:10px">Add line</button>' +
    '</div>';
  }

  function repeaterRow(value, placeholder) {
    return '<div class="repeater__row">' +
      '<input type="text" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '">' +
      '<button class="mini mini--danger" type="button" data-rep-del aria-label="Remove line">' + ic('trash') + '</button>' +
    '</div>';
  }

  function repeaterValues(id) {
    return $$('#' + id + ' input').map(function (i) { return i.value.trim(); })
      .filter(function (v) { return v; });
  }

  function editProduct(handle) {
    var isNew = !handle;
    var p = isNew ? blankProduct() : findProduct(handle);
    if (!p) return;

    var body =
      '<div class="fieldset-title">Basics</div>' +
      field('f-name', 'Product name', p.name, { placeholder: 'Aurora Halo Ring' }) +
      field('f-handle', 'URL handle', p.handle, {
        placeholder: 'aurora-halo-ring',
        hint: 'Used in the address bar: <code>product.html?p=…</code>. Leave blank to generate it from the name.'
      }) +
      '<div class="field-grid">' +
        field('f-category', 'Category', p.category, {
          type: 'select',
          options: L.categories.map(function (c) { return { value: c.slug, label: c.label }; })
        }) +
        field('f-collection', 'Collection', p.collection, {
          type: 'select',
          options: L.collections.map(function (c) { return { value: c.slug, label: c.label }; })
        }) +
      '</div>' +

      '<div class="fieldset-title">Pricing &amp; stock</div>' +
      '<div class="field-grid--3 field-grid">' +
        field('f-price', 'Price (USD)', p.price, { type: 'number', min: 0, step: '1' }) +
        field('f-compare', 'Compare-at price', p.compareAt || '', { type: 'number', min: 0, step: '1', hint: 'Optional. Shows a strikethrough and a save badge.' }) +
        field('f-stock', 'Stock', p.stock, { type: 'number', min: 0, step: '1' }) +
      '</div>' +

      '<div class="fieldset-title">Merchandising</div>' +
      '<div class="field"><label>Badges</label><div class="chip-row">' +
        [['new', 'New'], ['bestseller', 'Best Seller']].map(function (b) {
          return '<label class="chip-check"><input type="checkbox" value="' + b[0] + '" data-badge' +
            ((p.badges || []).indexOf(b[0]) > -1 ? ' checked' : '') + '><span>' + b[1] + '</span></label>';
        }).join('') +
      '</div></div>' +
      field('f-tags', 'Search tags', (p.tags || []).join(', '), {
        placeholder: 'halo, engagement, diamond',
        hint: 'Comma separated. These are matched by the site search.'
      }) +
      '<div class="field-grid">' +
        field('f-rating', 'Rating', p.rating, { type: 'number', min: 0, max: 5, step: '0.1' }) +
        field('f-reviews', 'Review count', p.reviews, { type: 'number', min: 0, step: '1' }) +
      '</div>' +
      field('f-added', 'Date added', (p.added || '').slice(0, 10), {
        type: 'date', hint: 'Drives the “Newest first” sort and the New Arrivals tab.'
      }) +

      '<div class="fieldset-title">Copy</div>' +
      field('f-excerpt', 'Short description', p.excerpt, {
        type: 'textarea', rows: 2,
        placeholder: 'One line, used in search results and meta descriptions.'
      }) +
      field('f-description', 'Full description', p.description, { type: 'textarea', rows: 5 }) +
      repeater('f-details', 'Specification bullets', p.details || [], 'e.g. 18k solid gold, 2.1mm width') +
      field('f-care', 'Care instructions', p.care, { type: 'textarea', rows: 3 }) +

      '<div class="fieldset-title">Photos</div>' +
      '<div class="field"><label>Main photo</label>' +
        '<div class="picker" id="picker-main"></div>' +
        '<p class="field__hint">Used on product cards and as the first gallery image. Square photos work best.</p>' +
      '</div>' +
      '<div class="field"><label>Gallery</label>' +
        '<div class="picker" id="picker-gallery"></div>' +
        '<p class="field__hint">The other views shown as thumbnails on the product page.</p>' +
      '</div>' +

      '<div class="fieldset-title">Visibility</div>' +
      '<div class="toggle-row">' +
        '<div><strong>Show on the storefront</strong><span>Hidden products disappear from the shop, search and sitemap.</span></div>' +
        '<label class="switch"><input type="checkbox" id="f-visible"' + (p.hidden ? '' : ' checked') + '><i></i>' +
        '<span class="visually-hidden">Show on the storefront</span></label>' +
      '</div>';

    editorImages.main = p.image || '';
    editorImages.gallery = (p.gallery || []).slice();

    openEditor(isNew ? 'New product' : 'Edit product', isNew ? 'It starts hidden — make it visible when you are ready.' : p.sku, body, function () {
      var name = $('#f-name').value.trim();
      if (!name) { L.toast('Give the product a name.'); $('#f-name').focus(); return false; }

      var price = parseFloat($('#f-price').value);
      if (isNaN(price) || price < 0) { L.toast('Enter a valid price.'); $('#f-price').focus(); return false; }

      var wanted = slugify($('#f-handle').value.trim() || name);
      var handleValue = uniqueHandle(wanted, isNew ? null : p.handle);
      var compare = parseFloat($('#f-compare').value);

      var updated = L.normalise({
        id: p.id,
        handle: handleValue,
        name: name,
        category: $('#f-category').value,
        collection: $('#f-collection').value,
        price: Math.round(price),
        compareAt: isNaN(compare) || compare <= 0 ? null : Math.round(compare),
        rating: Math.min(5, Math.max(0, parseFloat($('#f-rating').value) || 0)),
        reviews: Math.max(0, parseInt($('#f-reviews').value, 10) || 0),
        badges: $$('[data-badge]').filter(function (i) { return i.checked; }).map(function (i) { return i.value; }),
        tags: $('#f-tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
        stock: Math.max(0, parseInt($('#f-stock').value, 10) || 0),
        excerpt: $('#f-excerpt').value.trim(),
        description: $('#f-description').value.trim(),
        details: repeaterValues('f-details'),
        care: $('#f-care').value.trim(),
        added: $('#f-added').value || p.added,
        image: editorImages.main || ($('#f-image') ? $('#f-image').value.trim() : '') || undefined,
        gallery: editorImages.gallery.length ? editorImages.gallery.slice() : undefined,
        hidden: !$('#f-visible').checked
      });

      if (isNew) state.products.push(updated);
      else state.products[state.products.indexOf(p)] = updated;

      persist();
      renderProducts();
      L.toast(isNew ? name + ' added to the catalogue' : name + ' updated');
      return true;
    });

    renderMainPicker();
    renderGalleryPicker();
  }

  function editTestimonial(index) {
    var isNew = index === null;
    var t = isNew ? { quote: '', name: '', meta: '', rating: 5 } : state.testimonials[index];
    if (!t) return;

    var body =
      field('t-quote', 'Quote', t.quote, {
        type: 'textarea', rows: 5,
        placeholder: 'What the customer said — quotation marks are added automatically.'
      }) +
      field('t-name', 'Customer name', t.name, { placeholder: 'Elena Rodriguez' }) +
      field('t-meta', 'Attribution', t.meta, {
        placeholder: 'Aurora Solitaire Ring · Chicago, IL',
        hint: 'Shown under the name — usually the product and city.'
      }) +
      field('t-rating', 'Rating', t.rating, { type: 'number', min: 1, max: 5, step: '1' });

    openEditor(isNew ? 'New testimonial' : 'Edit testimonial', 'Appears in the home page carousel', body, function () {
      var quote = $('#t-quote').value.trim();
      var name = $('#t-name').value.trim();
      if (!quote || !name) { L.toast('A quote and a name are both required.'); return false; }

      var updated = {
        quote: quote,
        name: name,
        meta: $('#t-meta').value.trim(),
        rating: Math.min(5, Math.max(1, parseInt($('#t-rating').value, 10) || 5))
      };

      if (isNew) state.testimonials.push(updated);
      else state.testimonials[index] = updated;

      persist();
      renderTestimonials();
      L.toast(isNew ? 'Testimonial added' : 'Testimonial updated');
      return true;
    });
  }

  /* 13 · Boot ------------------------------------------------------------- */
  function bindGlobal() {
    $('#admin-burger').addEventListener('click', function () {
      $('#admin-side').classList.add('is-open');
      var s = $('.scrim');
      if (s) s.classList.add('is-open');
      document.body.classList.add('is-locked');
    });

    $('#sign-out').addEventListener('click', function (e) { e.preventDefault(); lock(); });
    $('#go-export').addEventListener('click', function () { window.location.hash = '#/data'; });

    $('#editor-close').addEventListener('click', closeEditor);
    $('#editor-cancel').addEventListener('click', closeEditor);
    $('#editor-save').addEventListener('click', function () {
      if (state.editing && state.editing() !== false) closeEditor();
    });

    var scrim = $('.scrim');
    if (scrim) scrim.addEventListener('click', function () { closeEditor(); closeSidebar(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeEditor(); closeSidebar(); }
    });

    window.addEventListener('hashchange', go);

    /* Delegated actions across every view */
    document.addEventListener('click', function (e) {
      var t = e.target;

      var edit = t.closest('[data-edit]');
      if (edit) return editProduct(edit.getAttribute('data-edit'));

      var toggle = t.closest('[data-toggle]');
      if (toggle) {
        var tp = findProduct(toggle.getAttribute('data-toggle'));
        if (tp) {
          tp.hidden = !tp.hidden;
          persist();
          renderProducts();
          L.toast(tp.name + (tp.hidden ? ' hidden from the storefront' : ' is now live'));
        }
        return;
      }

      var dupe = t.closest('[data-dupe]');
      if (dupe) {
        var src = findProduct(dupe.getAttribute('data-dupe'));
        if (src) {
          var copy = clone(src);
          copy.id = nextId();
          copy.name = src.name + ' (copy)';
          copy.handle = uniqueHandle(slugify(copy.name));
          copy.hidden = true;
          copy.reviews = 0;
          state.products.splice(state.products.indexOf(src) + 1, 0, L.normalise(copy));
          persist();
          renderProducts();
          L.toast('Duplicated as a hidden draft');
        }
        return;
      }

      var del = t.closest('[data-del]');
      if (del) {
        var dp = findProduct(del.getAttribute('data-del'));
        if (dp && window.confirm('Delete “' + dp.name + '” from the catalogue?\n\nThis cannot be undone from here, but it only affects your unpublished copy.')) {
          state.products.splice(state.products.indexOf(dp), 1);
          persist();
          renderProducts();
          L.toast(dp.name + ' deleted');
        }
        return;
      }

      var mediaReset = t.closest('[data-media-reset]');
      if (mediaReset) {
        var slot = mediaReset.getAttribute('data-media-reset');
        delete contentDraft.media[slot];
        persistContent();
        renderMedia();
        L.toast('Reset to the published photo');
        return;
      }

      if (t.closest('#media-reset-all')) {
        if (window.confirm('Reset every replaced photo back to the published version?')) {
          contentDraft.media = {};
          persistContent();
          renderMedia();
          L.toast('All photos reset');
        }
        return;
      }

      if (t.closest('#hero-reset')) {
        if (window.confirm('Discard your hero copy edits?')) {
          contentDraft.hero = {};
          persistContent();
          renderHomepage();
          L.toast('Hero copy reset');
        }
        return;
      }

      if (t.closest('#add-product')) return editProduct(null);
      if (t.closest('#add-testimonial')) return editTestimonial(null);

      var editT = t.closest('[data-edit-t]');
      if (editT) return editTestimonial(parseInt(editT.getAttribute('data-edit-t'), 10));

      var delT = t.closest('[data-del-t]');
      if (delT) {
        var ti = parseInt(delT.getAttribute('data-del-t'), 10);
        if (window.confirm('Delete this testimonial?')) {
          state.testimonials.splice(ti, 1);
          persist();
          renderTestimonials();
          L.toast('Testimonial deleted');
        }
        return;
      }

      var delR = t.closest('[data-del-r]');
      if (delR) {
        var parts = delR.getAttribute('data-del-r').split('|');
        var key = 'lumina.reviews.' + parts[0];
        var list = read(key, []);
        list.splice(parseInt(parts[1], 10), 1);
        if (list.length) localStorage.setItem(key, JSON.stringify(list));
        else localStorage.removeItem(key);
        renderReviews();
        updateChrome();
        L.toast('Review deleted');
        return;
      }

      if (t.closest('#clear-reviews')) {
        if (window.confirm('Delete every locally stored review?')) {
          Object.keys(localStorage).forEach(function (k) {
            if (k.indexOf('lumina.reviews.') === 0) localStorage.removeItem(k);
          });
          renderReviews();
          updateChrome();
          L.toast('All reviews deleted');
        }
        return;
      }

      var delS = t.closest('[data-del-s]');
      if (delS) {
        var subs = subscribers();
        subs.splice(parseInt(delS.getAttribute('data-del-s'), 10), 1);
        localStorage.setItem(KEY_NEWS, JSON.stringify(subs));
        renderSubscribers();
        updateChrome();
        L.toast('Subscriber removed');
        return;
      }

      if (t.closest('#clear-subs')) {
        if (window.confirm('Delete every stored subscriber?')) {
          localStorage.removeItem(KEY_NEWS);
          renderSubscribers();
          updateChrome();
          L.toast('Subscriber list cleared');
        }
        return;
      }

      if (t.closest('#export-csv')) {
        var rows = [['email', 'signed_up', 'source']].concat(subscribers().map(function (s) {
          return [s.email, new Date(s.at).toISOString(), s.source || ''];
        }));
        var csv = rows.map(function (r) {
          return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\r\n');
        download('lumina-subscribers.csv', csv, 'text/csv');
        return;
      }

      if (t.closest('#dl-bundle')) {
        var btn = t.closest('#dl-bundle');
        btn.disabled = true;
        var original = btn.innerHTML;
        btn.innerHTML = 'Building…';

        var media = mediaManifest();
        var products = imageManifest();
        var entries = media.files.concat(products.files);
        var encoder = new TextEncoder();

        buildPageUpdates(media.map).then(function (pages) {
          pages.forEach(function (p) {
            entries.push({ name: p.name, bytes: encoder.encode(p.text) });
          });

          if (localStorage.getItem(L.STORAGE_CATALOGUE)) {
            entries.push({ name: 'assets/js/data.js', bytes: encoder.encode(buildDataJs(true)) });
            // Prices changed, so the checkout function's copy must change too.
            entries.push({ name: 'lib/catalogue.js', bytes: encoder.encode(buildCatalogueJs()) });
          }

          btn.disabled = false;
          btn.innerHTML = original;

          if (!entries.length) { L.toast('Nothing to publish yet.'); return; }

          var blob = zipFiles(entries);
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'lumina-site-update.zip';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

          L.toast(entries.length + ' file' + (entries.length === 1 ? '' : 's') + ' zipped — unzip over your project folder');
        }).catch(function () {
          btn.disabled = false;
          btn.innerHTML = original;
          L.toast('Could not read the site pages — serve the admin over http, not file://.');
        });
        return;
      }

      if (t.closest('#dl-images')) {
        var manifest = imageManifest();
        if (!manifest.files.length) { L.toast('No uploaded photos to export.'); return; }
        var blob = zipFiles(manifest.files);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'lumina-images.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        L.toast(manifest.files.length + ' photos zipped — unzip into assets/img/');
        return;
      }

      if (t.closest('#dl-datajs')) {
        var toggle = $('#use-paths');
        download('data.js', buildDataJs(toggle ? toggle.checked : false), 'application/javascript');
        return;
      }

      if (t.closest('#copy-datajs')) {
        var out = $('#datajs-out');
        out.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        if (navigator.clipboard && !ok) {
          navigator.clipboard.writeText(out.value).then(function () { L.toast('data.js copied to clipboard'); });
        } else {
          L.toast(ok ? 'data.js copied to clipboard' : 'Select the text and copy manually.');
        }
        return;
      }

      if (t.closest('#dl-json')) {
        download('lumina-backup-' + new Date().toISOString().slice(0, 10) + '.json',
          JSON.stringify({ products: state.products, testimonials: state.testimonials, savedAt: new Date().toISOString() }, null, 2),
          'application/json');
        return;
      }

      if (t.closest('#save-pass')) {
        var a = $('#new-pass').value, b = $('#new-pass2').value;
        if (a.length < 8) { L.toast('Use at least 8 characters.'); return; }
        if (a !== b) { L.toast('The two passcodes do not match.'); return; }
        hash(a).then(function (h) {
          localStorage.setItem(KEY_PASS, h);
          $('#new-pass').value = '';
          $('#new-pass2').value = '';
          renderData();
          L.toast('Passcode updated');
        });
        return;
      }

      if (t.closest('#reset-all')) {
        if (window.confirm('Discard all unpublished changes and reload?')) clearOverrides();
        return;
      }

      if (t.closest('#p-reset')) {
        state.filter = { q: '', category: '', status: '' };
        renderProducts();
        return;
      }

      var imgClear = t.closest('[data-img-clear]');
      if (imgClear) {
        var spec = PICKERS[imgClear.getAttribute('data-img-clear')];
        if (spec) { spec.set(''); spec.render(); }
        return;
      }

      var galDel = t.closest('[data-gal-del]');
      if (galDel) {
        editorImages.gallery.splice(parseInt(galDel.getAttribute('data-gal-del'), 10), 1);
        renderGalleryPicker();
        return;
      }

      var pathToggle = t.closest('[data-path-toggle]');
      if (pathToggle) {
        var panel = $('#path-' + pathToggle.getAttribute('data-path-toggle'));
        if (panel) {
          panel.hidden = !panel.hidden;
          if (!panel.hidden) panel.querySelector('input').focus();
        }
        return;
      }

      if (t.closest('#gal-path-add')) {
        var pathInput = $('#gal-path');
        var value = pathInput.value.trim();
        if (value) {
          editorImages.gallery.push(value);
          renderGalleryPicker();
          L.toast('Linked photo added');
        }
        return;
      }

      var repAdd = t.closest('[data-rep-add]');
      if (repAdd) {
        var box = document.getElementById(repAdd.getAttribute('data-rep-add'));
        box.insertAdjacentHTML('beforeend', repeaterRow(''));
        box.lastElementChild.querySelector('input').focus();
        return;
      }

      var repDel = t.closest('[data-rep-del]');
      if (repDel) {
        var row = repDel.closest('.repeater__row');
        var parent = row.parentElement;
        row.remove();
        if (!parent.children.length) parent.insertAdjacentHTML('beforeend', repeaterRow(''));
        return;
      }
    });

    /* Filters */
    document.addEventListener('input', function (e) {
      if (e.target.id === 'p-search') {
        state.filter.q = e.target.value;
        var pos = e.target.selectionStart;
        renderProducts();
        var again = $('#p-search');
        if (again) { again.focus(); again.setSelectionRange(pos, pos); }
      }
    });

    /* Photo pickers */
    document.addEventListener('change', function (e) {
      var picker = e.target.getAttribute && e.target.getAttribute('data-img');
      if (picker) {
        takeFiles(picker, e.target.files);
        e.target.value = '';   // let the same file be chosen again
        return;
      }

      var slot = e.target.getAttribute && e.target.getAttribute('data-media');
      if (slot) {
        takeMedia(slot, e.target.files && e.target.files[0]);
        e.target.value = '';
      }
    });

    /* Hero copy — save as you type */
    document.addEventListener('input', function (e) {
      var id = e.target.id || '';
      if (id.indexOf('hero-') !== 0) return;
      var key = id.slice(5);
      if (!HERO_FIELDS.some(function (f) { return f.key === key; })) return;

      contentDraft.hero = contentDraft.hero || {};
      var value = e.target.value;
      if (heroDefaults && value === heroDefaults[key]) delete contentDraft.hero[key];
      else contentDraft.hero[key] = value;
      persistContent();
    });

    ['dragenter', 'dragover'].forEach(function (evt) {
      document.addEventListener(evt, function (e) {
        var drop = e.target.closest && e.target.closest('[data-drop]');
        if (!drop) return;
        e.preventDefault();
        drop.classList.add('is-over');
      });
    });

    document.addEventListener('dragleave', function (e) {
      var drop = e.target.closest && e.target.closest('[data-drop]');
      if (drop) drop.classList.remove('is-over');
    });

    document.addEventListener('drop', function (e) {
      var drop = e.target.closest && e.target.closest('[data-drop]');
      if (!drop) return;
      e.preventDefault();
      drop.classList.remove('is-over');
      takeFiles(drop.getAttribute('data-drop'), e.dataTransfer && e.dataTransfer.files);
    });

    document.addEventListener('change', function (e) {
      if (e.target.id === 'p-cat') { state.filter.category = e.target.value; renderProducts(); }
      if (e.target.id === 'p-status') { state.filter.status = e.target.value; renderProducts(); }
      if (e.target.id === 'use-paths') refreshDataJs();

      if (e.target.id === 'import-json') {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var data;
          try { data = JSON.parse(reader.result); } catch (err) { data = null; }
          if (!data || !Array.isArray(data.products)) {
            L.toast('That file is not a Lumina backup.');
            return;
          }
          if (!window.confirm('Replace the current catalogue with this backup?\n\n' +
            data.products.length + ' products, ' + (data.testimonials || []).length + ' testimonials.')) return;
          state.products = data.products.map(function (p) { return L.normalise(p); });
          if (Array.isArray(data.testimonials)) state.testimonials = data.testimonials;
          persist();
          renderData();
          L.toast('Backup restored');
        };
        reader.readAsText(file);
      }
    });
  }

  function boot() {
    state.products = clone(L.products);
    state.testimonials = clone(L.testimonials);
    contentDraft = L.content ? clone(L.content) : { media: {}, hero: {} };
    contentDraft.media = contentDraft.media || {};
    contentDraft.hero = contentDraft.hero || {};

    bindGlobal();
    updateChrome();
    go();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGate);
  else initGate();
})(window.LUMINA);
