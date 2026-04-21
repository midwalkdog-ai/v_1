# Stripe Billing Setup Guide

Get PulseBoard charging real money in ~30 minutes.

---

## Prerequisites

- Stripe account (free at stripe.com)
- PulseBoard running locally or deployed
- `.env` file with `STRIPE_SECRET_KEY` set

---

## Step 1 — Get Your API Keys

1. Go to **[dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)**
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

> **Test vs Live:** Use `sk_test_` for development. Switch to `sk_live_` when ready to charge real cards.

---

## Step 2 — Create Products & Prices

1. Go to **[dashboard.stripe.com/products](https://dashboard.stripe.com/products)**
2. Click **"Add product"**

Create **3 products** (one for each plan):

### Product 1: Starter
- **Name:** PulseBoard Starter
- **Pricing:** Recurring, $49.00/month
- **Currency:** USD
- Click **"Save product"**
- Copy the **Price ID** (looks like `price_1OxxxxxxxxxxxxxxxxxxxxXX`)

### Product 2: Growth
- **Name:** PulseBoard Growth
- **Pricing:** Recurring, $99.00/month
- Copy the **Price ID**

### Product 3: Agency
- **Name:** PulseBoard Agency
- **Pricing:** Recurring, $199.00/month
- Copy the **Price ID**

Add all three to `.env`:

```env
STRIPE_PRICE_STARTER=price_1OxxxxxxxxxxxxxxxxxxxxXX
STRIPE_PRICE_GROWTH=price_1OxxxxxxxxxxxxxxxxxxxxXX
STRIPE_PRICE_AGENCY=price_1OxxxxxxxxxxxxxxxxxxxxXX
```

---

## Step 3 — Set Up Webhooks

Webhooks let Stripe notify PulseBoard when subscriptions change, payments succeed or fail, and trials end.

### For Local Development (Stripe CLI)

Install Stripe CLI:
```bash
# Mac
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin

# Windows — download from https://github.com/stripe/stripe-cli/releases
```

Log in and forward webhooks to your local server:
```bash
stripe login
stripe listen --forward-to localhost:4000/api/billing/webhook
```

Stripe CLI will output a webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

Add it to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

Leave the `stripe listen` command running while developing.

### For Production (Stripe Dashboard)

1. Go to **[dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)**
2. Click **"Add endpoint"**
3. Set **Endpoint URL** to:
   ```
   https://yourdomain.com/api/billing/webhook
   ```
4. Under **"Select events to listen to"**, add these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Click **"Add endpoint"**
6. Click the endpoint → **"Signing secret"** → Reveal → Copy
7. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 4 — Set App URL

```env
APP_URL=https://yourdomain.com
```

For local development:
```env
APP_URL=http://localhost:3000
```

This is used for Stripe Checkout redirect URLs after payment.

---

## Step 5 — Configure Stripe Customer Portal

The billing portal lets users manage their subscription, update payment methods, and view invoices — without you building any of that UI.

1. Go to **[dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)**
2. Enable **"Customer portal"**
3. Configure settings:
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view invoice history
   - **Return URL:** `https://yourdomain.com/billing`
4. Click **"Save"**

---

## Step 6 — Restart & Test

Restart PulseBoard:
```bash
# Docker
docker compose restart

# Local dev
# Stop and restart backend: Ctrl+C, then npm run dev
```

Test the full flow:
```bash
# 1. Log in to PulseBoard at http://localhost:3000
# 2. Navigate to Billing
# 3. Click "Start with Growth"
# 4. Use Stripe test card:
#    Card: 4242 4242 4242 4242
#    Expiry: any future date
#    CVC: any 3 digits
#    ZIP: any 5 digits
# 5. Complete checkout
# 6. You should be redirected back to /billing with an active subscription
```

---

## Test Cards

Stripe provides test card numbers that simulate different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment fails (insufficient funds) |
| `4000 0000 0000 0341` | Attaching card fails |

Use any future expiry date and any 3-digit CVC.

---

## Verify It's Working

### Check webhook delivery
Go to **Stripe Dashboard → Webhooks → your endpoint → Recent deliveries**

You should see successful deliveries for:
- `checkout.session.completed` ✅
- `customer.subscription.created` ✅

### Check database
```bash
# If running locally:
sqlite3 backend/data/pulseboard.db

# Or in Docker:
docker compose exec backend sqlite3 /app/data/pulseboard.db

sqlite> SELECT id, plan_name, status, current_period_end FROM subscriptions;
# Should show your test subscription
```

### Check user has stripe_customer_id
```sql
sqlite> SELECT id, email, stripe_customer_id FROM users;
# Should show a cus_xxxxx customer ID
```

---

## Go Live (Switch from Test to Production)

1. **Complete Stripe account activation** at dashboard.stripe.com/account
2. In **Stripe Dashboard**, click the toggle from **"Test mode"** to **"Live mode"**
3. Get your **live secret key** (`sk_live_xxxxx`)
4. Create the same 3 products in live mode and get new Price IDs
5. Create a new webhook endpoint for production
6. Update `.env` with live credentials:

```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_STARTER=price_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_GROWTH=price_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_AGENCY=price_live_xxxxxxxxxxxxxxxxxxxxx
```

7. Redeploy: `git push origin main` → GitHub Actions auto-deploys

---

## Understanding the Revenue Flow

```
User clicks "Start with Growth"
         ↓
POST /api/billing/checkout { plan: 'growth' }
         ↓
Stripe Checkout Session created (14-day trial)
         ↓
User enters card → Stripe handles payment
         ↓
Redirect to /billing/success
         ↓
Stripe sends webhook: checkout.session.completed
         ↓
Stripe sends webhook: customer.subscription.created
         ↓
PulseBoard writes subscription to DB
         ↓
User now has Growth plan limits (50 clients)
```

---

## Plan Limits Enforced

| Plan | Clients | Projects | Price |
|------|---------|---------|-------|
| Free | 3 | 5 | $0 |
| Starter | 10 | 50 | $49/mo |
| Growth | 50 | 500 | $99/mo |
| Agency | Unlimited | Unlimited | $199/mo |

When a free user tries to add a 4th client, the API returns:
```json
{
  "error": "Client limit reached for free plan (3 max).",
  "upgrade_required": true,
  "current_plan": "free",
  "current_count": 3,
  "limit": 3
}
```

Hook this into the frontend to show an upgrade prompt.

---

## Subscription States

| State | Meaning | Access |
|-------|---------|--------|
| `trialing` | 14-day free trial active | Full plan access |
| `active` | Paid and current | Full plan access |
| `past_due` | Payment failed, retrying | Grace period (3 days) |
| `canceled` | Canceled, period ended | Free tier |
| `free` | Never subscribed | 3 clients, 5 projects |

---

## Revenue Math

At PulseBoard's pricing:

| Customers | Plan | MRR | ARR |
|-----------|------|-----|-----|
| 10 | Starter ($49) | $490 | $5,880 |
| 20 | Growth ($99) | $1,980 | $23,760 |
| 10 | Agency ($199) | $1,990 | $23,880 |
| **Mix** | | **$4,460** | **$53,520** |

At 24–30x MRR sale multiple: **$107,000 – $134,000** valuation.

---

## Troubleshooting

### "Stripe price ID not configured"
Set `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_AGENCY` in `.env` and restart.

### "No billing account found" on Portal
User hasn't completed checkout yet. Direct them to subscribe first.

### Webhook signature verification failed
- Make sure `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret
- Ensure `/api/billing/webhook` uses raw body (not parsed JSON) — already handled in `index.js`
- In dev: use `stripe listen --forward-to localhost:4000/api/billing/webhook`

### Subscription not updating after checkout
- Check webhook delivery in Stripe Dashboard
- Check backend logs: `docker compose logs -f backend`
- Verify the webhook secret is correct

### "Cannot read property of undefined" on Billing page
Plans array is empty — Stripe price IDs not set. Set them in `.env`.

---

## Next Steps After Billing Is Live

1. **Add email notifications** (trial ending, payment failed, welcome)
   - Use Resend (resend.com) or SendGrid
   - Hook into webhook events `invoice.payment_failed` and `customer.subscription.trial_will_end`

2. **Add upgrade prompts in-app**
   - When `enforceClientLimit` returns 403, show an upgrade modal
   - Deep link to `/billing` with the recommended plan highlighted

3. **Analytics**
   - Track MRR in your own dashboard
   - Or use Stripe's built-in revenue analytics

4. **Coupons / discounts**
   - Create in Stripe Dashboard → Coupons
   - Pass `allow_promotion_codes: true` in the checkout session (already easy to add)

5. **Annual pricing** (20% discount)
   - Create annual price IDs in Stripe
   - Add a billing interval toggle to the Billing page

---

*See API.md for full billing endpoint documentation.*
