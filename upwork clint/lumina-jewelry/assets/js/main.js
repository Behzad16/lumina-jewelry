/* ==========================================================================
   Lumina Jewelry — Shared behaviour
   Loaded on every page, after data.js.
   Sections: 1 Utilities · 2 Icons · 3 Product card · 4 Store (cart/wishlist)
             5 Header & drawers · 6 Search · 7 Cart UI · 8 Wishlist UI
             9 Forms · 10 Reveal · 11 Carousel · 12 Tabs · 13 Accordion · 14 Boot
   ========================================================================== */
(function (L) {
  'use strict';

  /* 1 · Utilities --------------------------------------------------------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var FREE_SHIPPING = 250;                              // must match lib/checkout.js
  var CHECKOUT_ENDPOINT = '/api/create-checkout-session';
  var STORAGE = { cart: 'lumina.cart.v1', wish: 'lumina.wishlist.v1', news: 'lumina.newsletter.v1' };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode — session only */ }
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 180);
    };
  }

  L.$ = $; L.$$ = $$; L.esc = esc;

  /* 2 · Icons ------------------------------------------------------------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart: '<path d="M12 20.5 4.2 12.9a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l1.1 1.1 1.1-1.1a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7Z"/>',
    bag: '<path d="M5 8h14l1 12H4Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M5 5l14 14M19 5 5 19"/>',
    star: '<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.6l1.1-6L3.4 9.4l6-.8Z" fill="currentColor" stroke="none"/>',
    check: '<path d="m4 12 5.5 5.5L20 7"/>',
    truck: '<path d="M2 7h11v9H2z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    gift: '<path d="M3 10h18v10H3z"/><path d="M3 7h18v3H3zM12 7v13"/><path d="M12 7S9.5 3 7.5 4.2 9 7 12 7Zm0 0s2.5-4 4.5-2.8S15 7 12 7Z"/>',
    sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="m6.5 6.5 3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3"/>',
    mail: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L21 15v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.2 2 2 0 0 1 6 3Z"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14.5 8.5H17V5.2h-2.6c-2.3 0-3.9 1.6-3.9 4v2H8v3.3h2.5V21h3.4v-6.5h2.4l.5-3.3h-2.9V9.6c0-.7.3-1.1 1.1-1.1Z"/>',
    pinterest: '<path d="M12 3a8.5 8.5 0 0 0-3.1 16.4c-.1-.8-.1-2 .1-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.8 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-2.3 3.1-5 0-2.1-1.4-3.6-3.9-3.6a4.5 4.5 0 0 0-4.7 4.5c0 .9.3 1.5.8 2 .1.1.1.2.1.4l-.2.8c0 .2-.2.3-.4.2-1.2-.5-1.8-1.9-1.8-3.4 0-2.5 2.1-5.5 6.3-5.5 3.4 0 5.6 2.4 5.6 5 0 3.4-1.9 6-4.7 6-1 0-1.9-.5-2.2-1.1l-.6 2.4c-.2.8-.7 1.7-1 2.3A8.5 8.5 0 1 0 12 3Z" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M14 3v11.4a3 3 0 1 1-2.6-3v3.4"/><path d="M14 3c.4 2.3 2 3.8 4.4 4v3.2c-1.7 0-3.2-.5-4.4-1.5"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>'
  };

  L.icon = function (name, cls) {
    var body = ICONS[name] || '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  };

  L.starsHtml = function (rating, small) {
    var out = '<span class="stars' + (small ? ' stars--sm' : '') + '" role="img" aria-label="' +
      rating + ' out of 5 stars">';
    for (var i = 0; i < 5; i++) {
      out += '<svg viewBox="0 0 24 24" style="opacity:' + (i < Math.round(rating) ? 1 : .25) +
        '" aria-hidden="true">' + ICONS.star + '</svg>';
    }
    return out + '</span>';
  };

  /* 3 · Product card ------------------------------------------------------ */
  L.productCard = function (p, opts) {
    opts = opts || {};
    var href = (opts.base || '') + 'product.html?p=' + encodeURIComponent(p.handle);
    var wished = Store.inWishlist(p.handle);

    var badges = p.badges.map(function (b) {
      if (b === 'new') return '<span class="badge badge--gold">New</span>';
      if (b === 'bestseller') return '<span class="badge badge--ink">Best Seller</span>';
      return '<span class="badge">' + esc(b) + '</span>';
    });
    if (p.compareAt) badges.push('<span class="badge">Save ' + L.money(p.compareAt - p.price) + '</span>');

    var price = '<span>' + L.money(p.price) + '</span>';
    if (p.compareAt) price += '<del>' + L.money(p.compareAt) + '</del>';

    return '' +
      '<article class="card">' +
        '<div class="card__media">' +
          '<a href="' + href + '" aria-label="' + esc(p.name) + '">' +
            '<img src="' + (opts.base || '') + p.image + '" alt="' + esc(p.name) +
            ' — ' + esc(L.categoryLabel(p.category)) + '" width="1000" height="1000" loading="lazy" decoding="async">' +
          '</a>' +
          (badges.length ? '<div class="card__badges">' + badges.join('') + '</div>' : '') +
          '<button class="card__wish' + (wished ? ' is-active' : '') + '" type="button" data-wish="' + esc(p.handle) + '" ' +
            'aria-pressed="' + (wished ? 'true' : 'false') + '" aria-label="Add ' + esc(p.name) + ' to wishlist">' +
            L.icon('heart') +
          '</button>' +
          '<div class="card__quick">' +
            '<button class="btn btn--sm" type="button" data-add="' + esc(p.handle) + '">Add to bag</button>' +
          '</div>' +
        '</div>' +
        '<div class="card__body">' +
          '<span class="card__cat">' + esc(L.collectionLabel(p.collection)) + '</span>' +
          '<h3 class="card__name"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
          '<span class="card__rating">' + L.starsHtml(p.rating, true) + '<span>' + p.rating.toFixed(1) +
            ' (' + p.reviews + ')</span></span>' +
          '<span class="card__price">' + price + '</span>' +
        '</div>' +
      '</article>';
  };

  L.renderGrid = function (el, list, opts) {
    if (!el) return;
    el.innerHTML = list.map(function (p) { return L.productCard(p, opts); }).join('');
  };

  /* 4 · Store — cart & wishlist ------------------------------------------- */
  var Store = {
    cart: read(STORAGE.cart, []),
    wish: read(STORAGE.wish, []),

    key: function (handle, metal, size) { return handle + '::' + (metal || '') + '::' + (size || ''); },

    save: function () {
      write(STORAGE.cart, this.cart);
      write(STORAGE.wish, this.wish);
      this.sync();
    },

    add: function (handle, qty, metal, size) {
      var p = L.getProduct(handle);
      if (!p) return null;
      metal = metal || p.metals[0];
      size = size || p.sizes[0];
      var k = this.key(handle, metal, size);
      var found = null;
      for (var i = 0; i < this.cart.length; i++) {
        if (this.key(this.cart[i].handle, this.cart[i].metal, this.cart[i].size) === k) { found = this.cart[i]; break; }
      }
      if (found) found.qty += (qty || 1);
      else this.cart.push({ handle: handle, qty: qty || 1, metal: metal, size: size });
      this.save();
      return p;
    },

    setQty: function (index, qty) {
      if (!this.cart[index]) return;
      if (qty <= 0) this.cart.splice(index, 1);
      else this.cart[index].qty = Math.min(qty, 20);
      this.save();
    },

    remove: function (index) { this.cart.splice(index, 1); this.save(); },

    count: function () {
      return this.cart.reduce(function (n, l) { return n + l.qty; }, 0);
    },

    subtotal: function () {
      return this.cart.reduce(function (n, l) {
        var p = L.getProduct(l.handle);
        return n + (p ? p.price * l.qty : 0);
      }, 0);
    },

    inWishlist: function (handle) { return this.wish.indexOf(handle) > -1; },

    toggleWishlist: function (handle) {
      var i = this.wish.indexOf(handle);
      if (i > -1) this.wish.splice(i, 1);
      else this.wish.push(handle);
      this.save();
      return this.wish.indexOf(handle) > -1;
    },

    sync: function () {
      badge('cart-count', this.count());
      badge('wish-count', this.wish.length);
      renderCart();
      renderWishlist();
      // keep every wishlist button on the page in step
      $$('[data-wish]').forEach(function (btn) {
        var on = Store.inWishlist(btn.getAttribute('data-wish'));
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  };

  L.Store = Store;

  function badge(id, n) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = n > 99 ? '99+' : n;
    el.classList.toggle('is-visible', n > 0);
  }

  /* Toasts */
  function toast(message) {
    var stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = L.icon('check') + '<span>' + esc(message) + '</span>';
    stack.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 350);
    }, 2800);
  }
  L.toast = toast;

  /* 5 · Header & drawers -------------------------------------------------- */
  var openLayer = null;

  function lock(on) { document.body.classList.toggle('is-locked', on); }

  function openPanel(el) {
    if (!el) return;
    closePanel();
    el.classList.add('is-open');
    el.removeAttribute('aria-hidden');
    var scrim = $('.scrim');
    if (scrim) scrim.classList.add('is-open');
    lock(true);
    openLayer = el;
    var focusable = el.querySelector('input, button, a[href]');
    if (focusable) setTimeout(function () { focusable.focus(); }, 120);
  }

  function closePanel() {
    if (!openLayer) return;
    openLayer.classList.remove('is-open');
    openLayer.setAttribute('aria-hidden', 'true');
    openLayer = null;
    var scrim = $('.scrim');
    if (scrim) scrim.classList.remove('is-open');
    lock(false);
  }

  L.openPanel = openPanel;
  L.closePanel = closePanel;

  function initHeader() {
    var header = $('.header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (!$('.scrim')) {
      var scrim = document.createElement('div');
      scrim.className = 'scrim';
      scrim.setAttribute('hidden', '');
      scrim.removeAttribute('hidden');
      document.body.appendChild(scrim);
      scrim.addEventListener('click', closePanel);
    }

    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-open]');
      if (opener) {
        e.preventDefault();
        openPanel($('#' + opener.getAttribute('data-open')));
        return;
      }
      if (e.target.closest('[data-close]')) {
        e.preventDefault();
        closePanel();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
      // keep focus inside an open drawer
      if (e.key === 'Tab' && openLayer) {
        var items = $$('a[href], button:not([disabled]), input, select, textarea', openLayer)
          .filter(function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // delegated add-to-bag / wishlist for every rendered card
    document.addEventListener('click', function (e) {
      var addBtn = e.target.closest('[data-add]');
      if (addBtn) {
        e.preventDefault();
        var p = Store.add(addBtn.getAttribute('data-add'), 1);
        if (p) { toast(p.name + ' added to your bag'); openPanel($('#cart-drawer')); }
        return;
      }
      var wishBtn = e.target.closest('[data-wish]');
      if (wishBtn) {
        e.preventDefault();
        var handle = wishBtn.getAttribute('data-wish');
        var on = Store.toggleWishlist(handle);
        var prod = L.getProduct(handle);
        toast(prod ? (on ? prod.name + ' saved to your wishlist' : prod.name + ' removed from your wishlist') : 'Wishlist updated');
      }
    });
  }

  /* 6 · Search ------------------------------------------------------------ */
  function searchProducts(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) return [];
    var terms = q.split(/\s+/);
    return L.live().filter(function (p) {
      var hay = [p.name, L.categoryLabel(p.category), L.collectionLabel(p.collection), p.excerpt]
        .concat(p.tags).join(' ').toLowerCase();
      return terms.every(function (t) { return hay.indexOf(t) > -1; });
    }).slice(0, 8);
  }
  L.searchProducts = searchProducts;

  function initSearch() {
    var panel = $('#search-panel');
    if (!panel) return;
    var input = $('#search-input', panel);
    var results = $('#search-results', panel);
    var empty = $('#search-empty', panel);

    function run() {
      var q = input.value;
      var hits = searchProducts(q);
      if (q.trim().length < 2) {
        results.innerHTML = '';
        empty.textContent = 'Start typing to search the collection.';
        empty.hidden = false;
        return;
      }
      if (!hits.length) {
        results.innerHTML = '';
        empty.innerHTML = 'No pieces match “' + esc(q) + '”. Try a category, or ' +
          '<a href="shop.html" style="border-bottom:1px solid currentColor">browse everything</a>.';
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      results.innerHTML = hits.map(function (p) { return L.productCard(p); }).join('');
      Store.sync();
    }

    input.addEventListener('input', debounce(run, 160));
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.location.href = 'shop.html?q=' + encodeURIComponent(input.value.trim());
      }
    });

    $$('[data-term]', panel).forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.getAttribute('data-term');
        input.focus();
        run();
      });
    });
  }

  /* 7 · Cart UI ----------------------------------------------------------- */
  function renderCart() {
    var body = $('#cart-lines');
    var foot = $('#cart-foot');
    if (!body) return;

    if (!Store.cart.length) {
      body.innerHTML = '<div class="cart-empty">' + L.icon('bag') +
        '<p>Your bag is empty.</p>' +
        '<a class="btn btn--ghost btn--sm" href="shop.html">Browse the collection</a></div>';
      if (foot) foot.hidden = true;
      return;
    }

    body.innerHTML = '<ul class="line-list">' + Store.cart.map(function (line, i) {
      var p = L.getProduct(line.handle);
      if (!p) return '';
      var metal = L.metal(line.metal);
      return '<li class="line">' +
        '<a class="line__media" href="product.html?p=' + encodeURIComponent(p.handle) + '">' +
          '<img src="' + p.image + '" alt="' + esc(p.name) + '" width="84" height="84" loading="lazy">' +
        '</a>' +
        '<div>' +
          '<a class="line__name" href="product.html?p=' + encodeURIComponent(p.handle) + '">' + esc(p.name) + '</a>' +
          '<div class="line__meta">' + esc(metal.label) + ' · ' + esc(line.size) + '</div>' +
          '<div class="line__price">' + L.money(p.price * line.qty) + '</div>' +
          '<div class="qty">' +
            '<button type="button" data-qty="' + i + '" data-step="-1" aria-label="Decrease quantity">' + L.icon('minus') + '</button>' +
            '<span>' + line.qty + '</span>' +
            '<button type="button" data-qty="' + i + '" data-step="1" aria-label="Increase quantity">' + L.icon('plus') + '</button>' +
          '</div>' +
        '</div>' +
        '<button class="line__remove" type="button" data-remove="' + i + '">Remove</button>' +
      '</li>';
    }).join('') + '</ul>';

    if (foot) {
      foot.hidden = false;
      var sub = Store.subtotal();
      var remaining = Math.max(0, FREE_SHIPPING - sub);
      var pct = Math.min(100, (sub / FREE_SHIPPING) * 100);
      $('#cart-subtotal').textContent = L.money(sub);
      $('#cart-ship-bar').style.width = pct + '%';
      $('#cart-ship-note').textContent = remaining > 0
        ? 'You are ' + L.money(remaining) + ' away from complimentary shipping.'
        : 'Complimentary express shipping unlocked.';
    }
  }

  function initCart() {
    var drawer = $('#cart-drawer');
    if (!drawer) return;

    drawer.addEventListener('click', function (e) {
      var q = e.target.closest('[data-qty]');
      if (q) {
        var i = parseInt(q.getAttribute('data-qty'), 10);
        var step = parseInt(q.getAttribute('data-step'), 10);
        Store.setQty(i, (Store.cart[i] ? Store.cart[i].qty : 0) + step);
        return;
      }
      var r = e.target.closest('[data-remove]');
      if (r) Store.remove(parseInt(r.getAttribute('data-remove'), 10));
    });

    var checkout = $('#cart-checkout');
    if (checkout) checkout.addEventListener('click', startCheckout);
  }

  /* Hands the bag to the serverless function, which prices it against the
     server-side catalogue and returns a Stripe Checkout URL. Nothing about
     the price is trusted from here. */
  function startCheckout(e) {
    e.preventDefault();
    var btn = e.currentTarget;
    if (btn.disabled) return;

    if (!Store.cart.length) { toast('Your bag is empty.'); return; }

    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Taking you to checkout…';

    var restore = function () { btn.disabled = false; btn.textContent = label; };

    fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: Store.cart.map(function (line) {
          return { handle: line.handle, qty: line.qty, metal: line.metal, size: line.size };
        })
      })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.url) {
          window.location.href = result.data.url;   // leaves the site for Stripe
          return;
        }
        restore();
        if (result.data.error === 'not_configured') {
          toast('Checkout is not connected yet — see README §14.');
        } else {
          toast(result.data.message || 'We could not start checkout. Please try again.');
        }
      })
      .catch(function () {
        restore();
        toast('Could not reach checkout. Check your connection and try again.');
      });
  }

  /* 8 · Wishlist UI ------------------------------------------------------- */
  function renderWishlist() {
    var body = $('#wish-lines');
    if (!body) return;

    if (!Store.wish.length) {
      body.innerHTML = '<div class="cart-empty">' + L.icon('heart') +
        '<p>Your wishlist is empty.</p>' +
        '<a class="btn btn--ghost btn--sm" href="shop.html">Find something you love</a></div>';
      return;
    }

    body.innerHTML = '<ul class="line-list">' + Store.wish.map(function (handle) {
      var p = L.getProduct(handle);
      if (!p) return '';
      return '<li class="line">' +
        '<a class="line__media" href="product.html?p=' + encodeURIComponent(p.handle) + '">' +
          '<img src="' + p.image + '" alt="' + esc(p.name) + '" width="84" height="84" loading="lazy">' +
        '</a>' +
        '<div>' +
          '<a class="line__name" href="product.html?p=' + encodeURIComponent(p.handle) + '">' + esc(p.name) + '</a>' +
          '<div class="line__meta">' + esc(L.collectionLabel(p.collection)) + '</div>' +
          '<div class="line__price">' + L.money(p.price) + '</div>' +
          '<button class="btn btn--ghost btn--sm" type="button" style="margin-top:10px" data-add="' + esc(p.handle) + '">Add to bag</button>' +
        '</div>' +
        '<button class="line__remove" type="button" data-wish="' + esc(p.handle) + '">Remove</button>' +
      '</li>';
    }).join('') + '</ul>';
  }

  /* 9 · Forms ------------------------------------------------------------- */
  function fieldError(input, message) {
    var field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('has-error', !!message);
    var err = $('.field__error', field);
    if (err && message) err.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate(input) {
    var val = input.value.trim();
    var type = input.type;
    if (input.required && !val) { fieldError(input, 'This field is required.'); return false; }
    if (val && type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(val)) {
      fieldError(input, 'Please enter a valid email address.'); return false;
    }
    if (val && type === 'tel' && !/^[\d\s()+.-]{7,}$/.test(val)) {
      fieldError(input, 'Please enter a valid phone number.'); return false;
    }
    if (input.minLength > 0 && val.length && val.length < input.minLength) {
      fieldError(input, 'Please use at least ' + input.minLength + ' characters.'); return false;
    }
    fieldError(input, '');
    return true;
  }

  function initForms() {
    $$('form[data-validate]').forEach(function (form) {
      var inputs = $$('input, textarea, select', form).filter(function (i) { return i.type !== 'hidden' && i.type !== 'checkbox'; });

      inputs.forEach(function (input) {
        input.addEventListener('blur', function () { validate(input); });
        input.addEventListener('input', function () {
          if (input.closest('.field') && input.closest('.field').classList.contains('has-error')) validate(input);
        });
      });

      form.addEventListener('submit', function (e) {
        var ok = true;
        inputs.forEach(function (input) { if (!validate(input)) ok = false; });

        var consent = $('input[type="checkbox"][required]', form);
        if (consent && !consent.checked) {
          ok = false;
          consent.focus();
          toast('Please accept the privacy policy to continue.');
        }

        if (!ok) {
          e.preventDefault();
          var firstBad = $('.has-error input, .has-error textarea, .has-error select', form);
          if (firstBad) firstBad.focus();
          return;
        }

        // No back end in this build — show the success state instead of navigating.
        // On Netlify, remove data-demo to let Netlify Forms capture the submission.
        if (form.hasAttribute('data-demo')) {
          e.preventDefault();
          var msg = $('.form-msg', form);
          if (msg) {
            msg.classList.add('is-visible');
            msg.setAttribute('role', 'status');
          }
          if (form.hasAttribute('data-newsletter')) {
            var email = $('input[type="email"]', form).value.trim();
            var list = read(STORAGE.news, []);
            if (!Array.isArray(list)) list = [];
            var already = list.some(function (s) { return s.email.toLowerCase() === email.toLowerCase(); });
            if (!already) list.push({ email: email, at: Date.now(), source: document.title });
            write(STORAGE.news, list);
          }

          // hand the collected values to any page script before we clear the form
          var payload = {};
          $$('input, textarea, select', form).forEach(function (i) {
            var name = i.name || i.id;
            if (!name) return;
            if (i.type === 'checkbox') payload[name] = i.checked;
            else if (i.type === 'radio') { if (i.checked) payload[name] = i.value; }
            else payload[name] = i.value.trim();
          });
          form.dispatchEvent(new CustomEvent('lumina:submitted', { detail: payload, bubbles: true }));

          form.reset();
          inputs.forEach(function (i) { fieldError(i, ''); });
        }
      });
    });
  }

  /* 10 · Scroll reveal ---------------------------------------------------- */
  function initReveal() {
    var items = $$('.reveal').filter(function (el) { return !el.classList.contains('is-in'); });
    if (!items.length) return;

    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

    items.forEach(function (el, i) {
      var parent = el.parentElement;
      var siblings = parent ? Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); }) : [];
      var idx = siblings.indexOf(el);
      el.style.setProperty('--delay', Math.min(idx > -1 ? idx : i, 6) * 80 + 'ms');
      io.observe(el);
    });
  }
  L.initReveal = initReveal;

  /* 11 · Testimonial carousel --------------------------------------------- */
  function initCarousel() {
    var root = $('[data-carousel]');
    if (!root) return;
    var slides = $$('.testimonial', root);
    var dots = $$('[data-dot]', root);
    if (slides.length < 2) return;

    var index = 0, timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function go(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', i === index ? 'true' : 'false'); });
    }

    function start() {
      if (reduced) return;
      stop();
      timer = setInterval(function () { go(index + 1); }, 6500);
    }
    function stop() { if (timer) clearInterval(timer); }

    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { go(i); start(); });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);

    go(0);
    start();
  }

  /* 12 · Tabs ------------------------------------------------------------- */
  function initTabs() {
    $$('[data-tabs]').forEach(function (group) {
      var tabs = $$('[role="tab"]', group);
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) {
            var on = t === tab;
            t.setAttribute('aria-selected', on ? 'true' : 'false');
            var panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !on;
          });
        });
      });
    });
  }

  /* 13 · Accordion -------------------------------------------------------- */
  function initAccordions() {
    $$('.accordion__btn').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      if (btn.getAttribute('aria-expanded') === 'true') panel.style.maxHeight = panel.scrollHeight + 'px';

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
      });
    });

    window.addEventListener('resize', debounce(function () {
      $$('.accordion__btn[aria-expanded="true"]').forEach(function (btn) {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
      });
    }, 200));
  }
  L.initAccordions = initAccordions;

  /* Paints unpublished hero edits over the markup in index.html. The HTML is
     always the published default, so with no overrides this does nothing. */
  /* Swaps in any site image the admin panel has replaced but not yet published.
     Keyed by the image's published path, so one replacement updates every page
     that references it. */
  function applyMedia() {
    var media = L.content && L.content.media;
    if (!media) return;

    Object.keys(media).forEach(function (path) {
      if (!media[path]) return;
      $$('img').forEach(function (img) {
        if (img.getAttribute('src') === path) img.src = media[path];
      });
    });
  }

  function applyHero() {
    var hero = L.content && L.content.hero;
    if (!hero) return;

    ['eyebrow', 'title1', 'title2', 'text'].forEach(function (key) {
      var el = $('[data-hero="' + key + '"]');
      if (el && typeof hero[key] === 'string' && hero[key]) el.textContent = hero[key];
    });

    [['cta1', 'cta1Label', 'cta1Href'], ['cta2', 'cta2Label', 'cta2Href']].forEach(function (set) {
      var el = $('[data-hero="' + set[0] + '"]');
      if (!el) return;
      if (hero[set[1]]) el.textContent = hero[set[1]];
      if (hero[set[2]]) el.href = hero[set[2]];
      el.hidden = !hero[set[1]];
    });
  }

  /* Draft banner — shown only when the admin panel has unpublished edits
     saved in this browser, so nobody mistakes a local preview for the live site. */
  function draftBadge() {
    if (!L.hasOverrides || document.body.hasAttribute('data-admin')) return;
    var el = document.createElement('a');
    el.className = 'draft-badge';
    el.href = 'admin.html';
    el.innerHTML = L.icon('sparkle') + '<span>Draft preview — unpublished admin edits</span>';
    document.body.appendChild(el);
  }

  /* 14 · Boot ------------------------------------------------------------- */
  function boot() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    initHeader();
    initSearch();
    initCart();
    initForms();
    initCarousel();
    initTabs();
    initAccordions();
    applyMedia();
    applyHero();
    initReveal();
    draftBadge();
    Store.sync();

    // page scripts render their own markup, then ask for a re-sync
    document.addEventListener('lumina:rendered', function () {
      Store.sync();
      initReveal();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.LUMINA);
