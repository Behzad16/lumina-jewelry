/* ==========================================================================
   Lumina Jewelry — Shop page
   Filtering, sorting, search and pagination, all driven from the URL so
   any filtered view can be linked to or shared.
   ========================================================================== */
(function (L) {
  'use strict';

  var $ = L.$, $$ = L.$$, esc = L.esc;
  var PAGE_SIZE = 8;
  var range = L.priceRange();

  var state = {
    categories: [],
    collections: [],
    maxPrice: range.max,
    q: '',
    sort: 'featured',
    sale: false,
    onlyNew: false,
    shown: PAGE_SIZE
  };

  /* — URL <-> state ——————————————————————————————————————————— */
  function readUrl() {
    var p = new URLSearchParams(window.location.search);
    if (p.get('category')) state.categories = p.get('category').split(',').filter(Boolean);
    if (p.get('collection')) state.collections = p.get('collection').split(',').filter(Boolean);
    if (p.get('max')) state.maxPrice = Math.min(range.max, parseInt(p.get('max'), 10) || range.max);
    if (p.get('q')) state.q = p.get('q');
    if (p.get('sort')) state.sort = p.get('sort');
    if (p.get('sale') === '1') state.sale = true;
    if (p.get('new') === '1') state.onlyNew = true;
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (state.categories.length) p.set('category', state.categories.join(','));
    if (state.collections.length) p.set('collection', state.collections.join(','));
    if (state.maxPrice < range.max) p.set('max', state.maxPrice);
    if (state.q) p.set('q', state.q);
    if (state.sort !== 'featured') p.set('sort', state.sort);
    if (state.sale) p.set('sale', '1');
    if (state.onlyNew) p.set('new', '1');
    var qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  /* — Filtering ——————————————————————————————————————————————— */
  function matches(p, ignore) {
    if (ignore !== 'category' && state.categories.length && state.categories.indexOf(p.category) === -1) return false;
    if (ignore !== 'collection' && state.collections.length && state.collections.indexOf(p.collection) === -1) return false;
    if (p.price > state.maxPrice) return false;
    if (state.sale && !p.compareAt) return false;
    if (state.onlyNew && p.badges.indexOf('new') === -1) return false;
    if (state.q) {
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      var hay = [p.name, L.categoryLabel(p.category), L.collectionLabel(p.collection), p.excerpt]
        .concat(p.tags).join(' ').toLowerCase();
      if (!terms.every(function (t) { return hay.indexOf(t) > -1; })) return false;
    }
    return true;
  }

  function filtered() {
    var out = L.live().filter(function (p) { return matches(p); });

    switch (state.sort) {
      case 'price-asc': out.sort(function (a, b) { return a.price - b.price; }); break;
      case 'price-desc': out.sort(function (a, b) { return b.price - a.price; }); break;
      case 'rating': out.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; }); break;
      case 'new': out.sort(function (a, b) { return a.added < b.added ? 1 : -1; }); break;
      default:
        // Featured: best sellers first, then new, then by review volume
        out.sort(function (a, b) {
          var score = function (p) {
            return (p.badges.indexOf('bestseller') > -1 ? 2 : 0) + (p.badges.indexOf('new') > -1 ? 1 : 0);
          };
          return score(b) - score(a) || b.reviews - a.reviews;
        });
    }
    return out;
  }

  /* — Filter controls ————————————————————————————————————————— */
  function countFor(kind, slug) {
    return L.live().filter(function (p) {
      return p[kind === 'category' ? 'category' : 'collection'] === slug && matches(p, kind);
    }).length;
  }

  function buildFilters() {
    $('#filter-category').innerHTML = L.categories.map(function (c) {
      return '<label class="check">' +
        '<input type="checkbox" name="category" value="' + c.slug + '"' +
        (state.categories.indexOf(c.slug) > -1 ? ' checked' : '') + '>' +
        '<i aria-hidden="true"></i><span>' + esc(c.label) + '</span>' +
        '<span class="count" data-count="category:' + c.slug + '">' + countFor('category', c.slug) + '</span>' +
        '</label>';
    }).join('');

    $('#filter-collection').innerHTML = L.collections.map(function (c) {
      return '<label class="check">' +
        '<input type="checkbox" name="collection" value="' + c.slug + '"' +
        (state.collections.indexOf(c.slug) > -1 ? ' checked' : '') + '>' +
        '<i aria-hidden="true"></i><span>' + esc(c.label) + '</span>' +
        '<span class="count" data-count="collection:' + c.slug + '">' + countFor('collection', c.slug) + '</span>' +
        '</label>';
    }).join('');

    var slider = $('#filter-price');
    slider.max = range.max;
    slider.min = 0;
    slider.value = state.maxPrice;
    $('#price-out').textContent = L.money(state.maxPrice);

    $('#filter-sale').checked = state.sale;
    $('#filter-new').checked = state.onlyNew;
    $('#sort').value = state.sort;
  }

  function refreshCounts() {
    $$('[data-count]').forEach(function (el) {
      var parts = el.getAttribute('data-count').split(':');
      el.textContent = countFor(parts[0], parts[1]);
    });
  }

  /* — Active filter chips ————————————————————————————————————— */
  function renderChips() {
    var chips = [];

    state.categories.forEach(function (slug) {
      chips.push(chip('category', slug, L.categoryLabel(slug)));
    });
    state.collections.forEach(function (slug) {
      chips.push(chip('collection', slug, L.collectionLabel(slug)));
    });
    if (state.q) chips.push(chip('q', '', 'Search: “' + esc(state.q) + '”'));
    if (state.maxPrice < range.max) chips.push(chip('max', '', 'Under ' + L.money(state.maxPrice)));
    if (state.sale) chips.push(chip('sale', '', 'On sale'));
    if (state.onlyNew) chips.push(chip('new', '', 'New arrivals'));

    if (chips.length > 1) {
      chips.push('<button class="chip chip--clear" type="button" data-clear="all">Clear all</button>');
    }
    $('#active-chips').innerHTML = chips.join('');
  }

  function chip(kind, slug, label) {
    return '<button class="chip" type="button" data-clear="' + kind + '" data-value="' + esc(slug) + '">' +
      label + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>' +
      '<span class="visually-hidden">Remove filter</span></button>';
  }

  /* — Heading ————————————————————————————————————————————————— */
  function renderHeading() {
    var title = 'Shop all jewelry';
    var intro = 'Twenty pieces, four collections, one atelier. Every item is solid 18k gold or gold vermeil, set and finished by hand in New York.';
    var crumb = 'Shop All';

    if (state.q) {
      title = 'Search results';
      intro = 'Showing pieces matching “' + state.q + '”.';
      crumb = 'Search';
    } else if (state.categories.length === 1 && !state.collections.length) {
      var cat = L.categoryLabel(state.categories[0]);
      title = cat;
      crumb = cat;
      intro = 'Every ' + cat.toLowerCase().replace(/s$/, '') + ' in the Lumina collection, handmade in solid 18k gold or gold vermeil.';
    } else if (state.collections.length === 1 && !state.categories.length) {
      var col = null;
      L.collections.forEach(function (c) { if (c.slug === state.collections[0]) col = c; });
      if (col) { title = 'The ' + col.label + ' Collection'; crumb = col.label; intro = col.blurb; }
    }

    $('#shop-title').textContent = title;
    $('#shop-intro').textContent = intro;
    $('#crumb-current').textContent = crumb;
    document.title = title + ' | Lumina Jewelry';
  }

  /* — Render —————————————————————————————————————————————————— */
  function render() {
    var list = filtered();
    var page = list.slice(0, state.shown);

    var grid = $('#shop-grid');
    var empty = $('#shop-empty');
    var more = $('#load-more-wrap');

    grid.innerHTML = page.map(function (p) { return L.productCard(p); }).join('');
    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    more.hidden = list.length <= state.shown;

    $('#shop-count').innerHTML = list.length
      ? 'Showing <strong>' + page.length + '</strong> of <strong>' + list.length + '</strong> pieces'
      : 'No pieces found';

    renderChips();
    refreshCounts();
    renderHeading();
    writeUrl();

    document.dispatchEvent(new CustomEvent('lumina:rendered'));
  }

  /* — Events —————————————————————————————————————————————————— */
  function reset() {
    state.categories = [];
    state.collections = [];
    state.maxPrice = range.max;
    state.q = '';
    state.sale = false;
    state.onlyNew = false;
    state.shown = PAGE_SIZE;
    buildFilters();
    render();
  }

  function bind() {
    var form = $('#filter-form');

    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'category' || t.name === 'collection') {
        var key = t.name === 'category' ? 'categories' : 'collections';
        var i = state[key].indexOf(t.value);
        if (t.checked && i === -1) state[key].push(t.value);
        else if (!t.checked && i > -1) state[key].splice(i, 1);
      } else if (t.id === 'filter-sale') {
        state.sale = t.checked;
      } else if (t.id === 'filter-new') {
        state.onlyNew = t.checked;
      }
      state.shown = PAGE_SIZE;
      render();
    });

    var slider = $('#filter-price');
    slider.addEventListener('input', function () {
      state.maxPrice = parseInt(slider.value, 10);
      $('#price-out').textContent = L.money(state.maxPrice);
    });
    slider.addEventListener('change', function () {
      state.shown = PAGE_SIZE;
      render();
    });

    $('#sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      render();
    });

    $('#load-more').addEventListener('click', function () {
      state.shown += PAGE_SIZE;
      render();
    });

    $('#filter-reset').addEventListener('click', reset);
    $('#empty-reset').addEventListener('click', reset);

    $('#active-chips').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-clear]');
      if (!btn) return;
      var kind = btn.getAttribute('data-clear');
      var value = btn.getAttribute('data-value');

      if (kind === 'all') return reset();
      if (kind === 'category') state.categories = state.categories.filter(function (s) { return s !== value; });
      if (kind === 'collection') state.collections = state.collections.filter(function (s) { return s !== value; });
      if (kind === 'q') state.q = '';
      if (kind === 'max') state.maxPrice = range.max;
      if (kind === 'sale') state.sale = false;
      if (kind === 'new') state.onlyNew = false;

      state.shown = PAGE_SIZE;
      buildFilters();
      render();
    });

    /* Mobile filter panel */
    var panel = $('#filters');
    var scrim = $('.scrim');

    function openFilters() {
      panel.classList.add('is-open');
      if (scrim) scrim.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
    function closeFilters() {
      panel.classList.remove('is-open');
      if (scrim) scrim.classList.remove('is-open');
      document.body.classList.remove('is-locked');
    }

    $('#filter-open').addEventListener('click', openFilters);
    $('#filters-close').addEventListener('click', closeFilters);
    if (scrim) scrim.addEventListener('click', closeFilters);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeFilters();
    });
  }

  /* — Init ———————————————————————————————————————————————————— */
  function init() {
    readUrl();
    buildFilters();
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.LUMINA);
