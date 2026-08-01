/* ==========================================================================
   Lumina Jewelry — Stripe Checkout session builder
   Shared by the Netlify and Vercel entry points.

   Talks to the Stripe REST API with plain fetch, so the project stays
   dependency-free — there is no npm install and no build step anywhere.

   SECURITY: the browser sends only handles, quantities and chosen options.
   Every price comes from lib/catalogue.js on the server. A tampered cart
   cannot change what a customer is charged.
   ========================================================================== */
'use strict';

var catalogue = require('./catalogue');

var CURRENCY = 'usd';
var FREE_SHIPPING_CENTS = 25000;   // $250 — must match FREE_SHIPPING in main.js
var MAX_LINES = 40;
var MAX_QTY = 20;

var SHIP_TO = [
  'US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE',
  'LU', 'AT', 'CH', 'DK', 'SE', 'NO', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'RO',
  'BG', 'GR', 'HR', 'SI', 'EE', 'LV', 'LT', 'JP', 'SG', 'HK', 'AE', 'ZA', 'MX', 'BR'
];

/* Stripe's API is form-encoded, and nested params use bracket notation:
   line_items[0][price_data][currency]=usd */
function toForm(value, prefix, out) {
  out = out || [];
  Object.keys(value).forEach(function (key) {
    var item = value[key];
    if (item === undefined || item === null) return;
    var name = prefix ? prefix + '[' + key + ']' : key;

    if (Array.isArray(item)) {
      item.forEach(function (entry, i) {
        if (entry !== null && typeof entry === 'object') toForm(entry, name + '[' + i + ']', out);
        else out.push(encodeURIComponent(name + '[' + i + ']') + '=' + encodeURIComponent(entry));
      });
    } else if (typeof item === 'object') {
      toForm(item, name, out);
    } else {
      out.push(encodeURIComponent(name) + '=' + encodeURIComponent(item));
    }
  });
  return out;
}

function shippingRate(label, cents, minDays, maxDays) {
  return {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: cents, currency: CURRENCY },
      display_name: label,
      delivery_estimate: {
        minimum: { unit: 'business_day', value: minDays },
        maximum: { unit: 'business_day', value: maxDays }
      }
    }
  };
}

/* Builds the priced line items, or throws a message safe to show a customer. */
function buildLineItems(cart) {
  if (!Array.isArray(cart) || !cart.length) throw new Error('Your bag is empty.');
  if (cart.length > MAX_LINES) throw new Error('That is too many items for one order.');

  return cart.map(function (line) {
    var product = catalogue[String(line && line.handle)];
    if (!product) throw new Error('One of the items in your bag is no longer available.');

    var qty = parseInt(line.qty, 10);
    if (!isFinite(qty) || qty < 1) qty = 1;
    qty = Math.min(qty, MAX_QTY);

    // Options are shown for reference only; they never affect the price.
    var options = [line.metal, line.size]
      .filter(function (v) { return typeof v === 'string' && v; })
      .map(function (v) { return String(v).slice(0, 40); })
      .join(' · ');

    return {
      quantity: qty,
      price_data: {
        currency: CURRENCY,
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: options || undefined,
          metadata: { handle: String(line.handle).slice(0, 60) }
        }
      }
    };
  });
}

function subtotalCents(lineItems) {
  return lineItems.reduce(function (sum, li) {
    return sum + li.price_data.unit_amount * li.quantity;
  }, 0);
}

/* Returns { status, body } — the entry points just forward it. */
async function createCheckoutSession(input) {
  var key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return {
      status: 503,
      body: {
        error: 'not_configured',
        message: 'Checkout is not connected yet. Add STRIPE_SECRET_KEY to your site environment variables.'
      }
    };
  }

  var lineItems;
  try {
    lineItems = buildLineItems(input.cart);
  } catch (err) {
    return { status: 400, body: { error: 'invalid_cart', message: err.message } };
  }

  var subtotal = subtotalCents(lineItems);

  // Mirrors the promise made on the site: free express over $250.
  var shipping = subtotal >= FREE_SHIPPING_CENTS
    ? [shippingRate('Complimentary express shipping', 0, 2, 3),
       shippingRate('Overnight', 2800, 1, 1)]
    : [shippingRate('Express shipping', 1200, 2, 3),
       shippingRate('Overnight', 2800, 1, 1)];

  var origin = (process.env.SITE_URL || input.origin || '').replace(/\/+$/, '');
  if (!/^https?:\/\//.test(origin)) {
    return { status: 400, body: { error: 'bad_origin', message: 'Could not determine the site address.' } };
  }

  var params = {
    mode: 'payment',
    line_items: lineItems,
    shipping_options: shipping,
    shipping_address_collection: { allowed_countries: SHIP_TO },
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    allow_promotion_codes: true,
    success_url: origin + '/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/shop.html',
    metadata: { source: 'lumina-web', items: String(lineItems.length) }
  };

  var response;
  try {
    response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-06-20'
      },
      body: toForm(params).join('&')
    });
  } catch (err) {
    return { status: 502, body: { error: 'network', message: 'Could not reach the payment provider. Please try again.' } };
  }

  var data;
  try { data = await response.json(); } catch (err) { data = null; }

  if (!response.ok || !data || !data.url) {
    // Log the real reason for us; show the customer something calm.
    console.error('Stripe session failed', response.status, data && data.error);
    return {
      status: 502,
      body: { error: 'stripe_error', message: 'We could not start checkout just now. Please try again in a moment.' }
    };
  }

  return { status: 200, body: { url: data.url, id: data.id } };
}

module.exports = { createCheckoutSession: createCheckoutSession, toForm: toForm };
