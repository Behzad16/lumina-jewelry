/* Vercel entry point for Stripe Checkout.
   Vercel serves this file at /api/create-checkout-session automatically. */
'use strict';

var checkout = require('../lib/checkout');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method', message: 'Use POST.' });
  }

  var payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (err) { payload = null; }
  }
  if (!payload) {
    return res.status(400).json({ error: 'bad_json', message: 'Could not read the request.' });
  }

  var proto = req.headers['x-forwarded-proto'] || 'https';
  var host = req.headers['x-forwarded-host'] || req.headers.host || '';

  var result = await checkout.createCheckoutSession({
    cart: payload.cart,
    origin: host ? proto + '://' + host : ''
  });

  return res.status(result.status).json(result.body);
};
