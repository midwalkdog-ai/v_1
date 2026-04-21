const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const {
  sendWelcomeEmail,
  sendTrialEndingEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
  sendPaymentSucceededEmail,
} = require('../services/email');

const router = express.Router();

// ─── PRICING TIERS ────────────────────────────────────────────────────────────
// Map your Stripe Price IDs here after creating them in the Stripe dashboard
// stripe.com/docs/billing/prices-guide
const PLANS = {
  starter: {
    name: 'Starter',
    price_id: process.env.STRIPE_PRICE_STARTER,   // e.g. price_xxxxx
    amount: 4900,   // $49/mo in cents
    features: ['Up to 10 clients', '5 projects per client', 'Basic analytics', 'Email alerts'],
    client_limit: 10,
  },
  growth: {
    name: 'Growth',
    price_id: process.env.STRIPE_PRICE_GROWTH,    // e.g. price_xxxxx
    amount: 9900,   // $99/mo
    features: ['Up to 50 clients', 'Unlimited projects', 'Full analytics', 'Priority support'],
    client_limit: 50,
  },
  agency: {
    name: 'Agency',
    price_id: process.env.STRIPE_PRICE_AGENCY,    // e.g. price_xxxxx
    amount: 19900,  // $199/mo
    features: ['Unlimited clients', 'Unlimited projects', 'White-label ready', 'Dedicated support'],
    client_limit: 999999,
  },
};

// ─── GET PLANS (public) ────────────────────────────────────────────────────────
// GET /api/billing/plans
router.get('/plans', (req, res) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    amount: plan.amount,
    amount_formatted: `$${(plan.amount / 100).toFixed(0)}/mo`,
    features: plan.features,
    client_limit: plan.client_limit,
    price_id: plan.price_id,
  }));
  res.json(plans);
});

// ─── GET CURRENT SUBSCRIPTION STATUS ──────────────────────────────────────────
// GET /api/billing/status
router.get('/status', auth, (req, res) => {
  const sub = db.prepare(`
    SELECT s.*, u.email, u.name
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC LIMIT 1
  `).get(req.user.id);

  if (!sub) {
    return res.json({
      status: 'free',
      plan: null,
      trial_ends_at: null,
      current_period_end: null,
      cancel_at_period_end: false,
      client_limit: 3, // Free tier: 3 clients
    });
  }

  const plan = Object.values(PLANS).find(p => p.price_id === sub.price_id) || {};

  res.json({
    status: sub.status,
    plan: sub.plan_name,
    stripe_subscription_id: sub.stripe_subscription_id,
    current_period_end: sub.current_period_end,
    cancel_at_period_end: sub.cancel_at_period_end === 1,
    trial_ends_at: sub.trial_ends_at,
    client_limit: plan.client_limit || 3,
  });
});

// ─── CREATE CHECKOUT SESSION ───────────────────────────────────────────────────
// POST /api/billing/checkout
// Body: { plan: 'starter' | 'growth' | 'agency' }
router.post('/checkout', auth, async (req, res) => {
  const { plan } = req.body;

  if (!PLANS[plan]) {
    return res.status(400).json({ error: `Invalid plan. Choose: ${Object.keys(PLANS).join(', ')}` });
  }

  if (!PLANS[plan].price_id) {
    return res.status(500).json({ error: `Stripe price ID not configured for plan: ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} in .env` });
  }

  try {
    // Get or create Stripe customer
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { user_id: req.user.id },
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].price_id, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: { user_id: req.user.id, plan },
      },
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing`,
      metadata: { user_id: req.user.id, plan },
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE BILLING PORTAL SESSION ────────────────────────────────────────────
// POST /api/billing/portal
// Returns a Stripe Customer Portal URL (manage subscription, cancel, update card)
router.post('/portal', auth, async (req, res) => {
  const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.user.id);

  if (!user?.stripe_customer_id) {
    return res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/billing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CANCEL SUBSCRIPTION ──────────────────────────────────────────────────────
// POST /api/billing/cancel
// Cancels at end of current billing period (not immediate)
router.post('/cancel', auth, async (req, res) => {
  const sub = db.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);

  if (!sub?.stripe_subscription_id) {
    return res.status(400).json({ error: 'No active subscription found.' });
  }

  try {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    db.prepare(`
      UPDATE subscriptions SET cancel_at_period_end = 1 WHERE stripe_subscription_id = ?
    `).run(sub.stripe_subscription_id);

    res.json({ success: true, message: 'Subscription will cancel at end of billing period.' });
  } catch (err) {
    console.error('Stripe cancel error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── RESUME CANCELLED SUBSCRIPTION ────────────────────────────────────────────
// POST /api/billing/resume
router.post('/resume', auth, async (req, res) => {
  const sub = db.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ? AND cancel_at_period_end = 1
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);

  if (!sub?.stripe_subscription_id) {
    return res.status(400).json({ error: 'No pending cancellation found.' });
  }

  try {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    db.prepare(`
      UPDATE subscriptions SET cancel_at_period_end = 0 WHERE stripe_subscription_id = ?
    `).run(sub.stripe_subscription_id);

    res.json({ success: true, message: 'Subscription resumed.' });
  } catch (err) {
    console.error('Stripe resume error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── STRIPE WEBHOOKS ──────────────────────────────────────────────────────────
// POST /api/billing/webhook
// IMPORTANT: This route uses raw body (not parsed JSON) — must be registered
// BEFORE express.json() in index.js. See index.js for correct setup.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
  }

  let event;
  try {
    event = endpointSecret
      ? stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
      : JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  console.log(`📦 Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {

      // ── Subscription created (including trials) ──────────────────────────
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const planKey = subscription.metadata?.plan || 'starter';
        const plan = PLANS[planKey];

        const existing = db.prepare('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?').get(subscription.id);
        if (!existing) {
          db.prepare(`
            INSERT INTO subscriptions (
              id, user_id, stripe_subscription_id, stripe_customer_id,
              plan_name, price_id, status, current_period_start, current_period_end,
              trial_ends_at, cancel_at_period_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            require('uuid').v4(),
            userId,
            subscription.id,
            subscription.customer,
            plan?.name || planKey,
            subscription.items.data[0]?.price?.id || '',
            subscription.status,
            new Date(subscription.current_period_start * 1000).toISOString(),
            new Date(subscription.current_period_end * 1000).toISOString(),
            subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            subscription.cancel_at_period_end ? 1 : 0
          );
        }
        break;
      }

      // ── Subscription updated (plan changes, status changes) ───────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        db.prepare(`
          UPDATE subscriptions SET
            status = ?,
            current_period_start = ?,
            current_period_end = ?,
            cancel_at_period_end = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
        `).run(
          subscription.status,
          new Date(subscription.current_period_start * 1000).toISOString(),
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.cancel_at_period_end ? 1 : 0,
          subscription.id
        );
        break;
      }

      // ── Subscription cancelled / expired ─────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        db.prepare(`
          UPDATE subscriptions SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
        `).run(subscription.id);

        // Log activity for the user
        const sub = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?').get(subscription.id);
        if (sub) {
          db.prepare(`
            INSERT INTO activities (id, user_id, type, title) VALUES (?, ?, ?, ?)
          `).run(require('uuid').v4(), sub.user_id, 'subscription_canceled', 'Subscription canceled');
        }
        break;
      }

      // ── Checkout completed (subscription + trial starts here) ─────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.user_id;
        if (userId && session.customer) {
          db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(session.customer, userId);
        }
        break;
      }

      // ── Payment succeeded ─────────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          db.prepare(`
            UPDATE subscriptions SET status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE stripe_subscription_id = ?
          `).run(invoice.subscription);

          const sub = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?').get(invoice.subscription);
          if (sub) {
            db.prepare(`
              INSERT INTO activities (id, user_id, type, title) VALUES (?, ?, ?, ?)
            `).run(
              require('uuid').v4(),
              sub.user_id,
              'payment_succeeded',
              `Payment received: $${(invoice.amount_paid / 100).toFixed(2)}`
            );
            // Send receipt email
            const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(sub.user_id);
            const subRow = db.prepare('SELECT current_period_end FROM subscriptions WHERE stripe_subscription_id = ?').get(invoice.subscription);
            if (user) sendPaymentSucceededEmail({
              to: user.email, name: user.name,
              amount: invoice.amount_paid,
              nextBillingDate: subRow?.current_period_end,
            });
          }
        }
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          db.prepare(`
            UPDATE subscriptions SET status = 'past_due', updated_at = CURRENT_TIMESTAMP
            WHERE stripe_subscription_id = ?
          `).run(invoice.subscription);

          const sub = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?').get(invoice.subscription);
          if (sub) {
            db.prepare(`
              INSERT INTO alerts (id, user_id, severity, message) VALUES (?, ?, ?, ?)
            `).run(
              require('uuid').v4(),
              sub.user_id,
              'critical',
              `Payment failed for your PulseBoard subscription. Please update your payment method.`
            );
            // Send failure email
            const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(sub.user_id);
            if (user) sendPaymentFailedEmail({ to: user.email, name: user.name, amount: invoice.amount_due });
          }
        }
        break;
      }

      // ── Trial ending soon (3 days before) ─────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        const sub = db.prepare('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?').get(subscription.id);
        if (sub) {
          db.prepare(`
            INSERT INTO alerts (id, user_id, severity, message) VALUES (?, ?, ?, ?)
          `).run(
            require('uuid').v4(),
            sub.user_id,
            'warning',
            `Your free trial ends in 3 days. Add a payment method to keep access.`
          );
          // Send trial ending email
          const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(sub.user_id);
          const subRow = db.prepare('SELECT trial_ends_at, plan_name FROM subscriptions WHERE stripe_subscription_id = ?').get(subscription.id);
          if (user) sendTrialEndingEmail({
            to: user.email, name: user.name,
            trialEndDate: subRow?.trial_ends_at,
            plan: subRow?.plan_name,
          });
        }
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err.message);
    // Return 200 anyway — Stripe will retry on 4xx/5xx
  }

  res.json({ received: true });
});

module.exports = router;
