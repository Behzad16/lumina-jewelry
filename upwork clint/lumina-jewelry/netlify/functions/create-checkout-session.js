/* Netlify entry point for Stripe Checkout.
   Reached from the browser at /api/create-checkout-session — netlify.toml
   rewrites that path here so the front end uses one URL on both hosts. */
'use strict';

var checkout = require('../../lib/checkout');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Allow': 'POST' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method', message: 'Use POST.' });
  }

  var payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { error: 'bad_json', message: 'Could not read the request.' });
  }

  var headers = event.headers || {};
  var proto = headers['x-forwarded-proto'] || 'https';
  var host = headers['x-forwarded-host'] || headers.host || '';

  var result = await checkout.createCheckoutSession({
    cart: payload.cart,
    origin: host ? proto + '://' + host : ''
  });

  return json(result.status, result.body);
};

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}
