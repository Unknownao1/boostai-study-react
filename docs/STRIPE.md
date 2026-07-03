# Stripe Integration

Reference for the Stripe payments groundwork. This covers the initial setup for
subscriptions — the full pricing page and subscription management UI are not
built yet.

---

## Overview

Stripe is used for subscription-based feature gating:

```
User clicks "Upgrade" → Stripe Checkout → Payment → Webhook → Update subscription_tier in DB → Feature unlocked
```

**Key principle from ARCHITECTURE.md:** Feature gating is driven by
`subscription_tier` in the `profiles` table (set by Stripe webhooks), never by
client-side checks alone.

---

## Setup (Stripe Dashboard)

### 1. Create products

In [Stripe Dashboard](https://dashboard.stripe.com/) → Products → Add Product:

| Product | Price | Notes |
|---|---|---|
| **Pro** | Monthly recurring (e.g. £9.99/month) | Copy the Price ID → set as `STRIPE_PRO_PRICE_ID` env var |
| **Premium** | Monthly recurring (e.g. £19.99/month) | Copy the Price ID → set as `STRIPE_PREMIUM_PRICE_ID` env var |

### 2. Set up webhooks

Stripe Dashboard → Developers → Webhooks → Add Endpoint:

| Setting | Value |
|---|---|
| **Endpoint URL** | `https://boostai.study/api/webhooks/stripe` |
| **Events** | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

Copy the **Signing Secret** → set as `STRIPE_WEBHOOK_SECRET` env var.

### 3. Local testing with Stripe CLI

```bash
# Install: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret it prints → put in .env.local as STRIPE_WEBHOOK_SECRET

# In another terminal, trigger a test event:
stripe trigger checkout.session.completed
```

---

## Code architecture

| File | Purpose |
|---|---|
| `lib/stripe/index.ts` | Stripe client + subscription tier config |
| `app/api/webhooks/stripe/route.ts` | Webhook handler (signature verification + DB updates) |
| `app/api/checkout/route.ts` | Creates Stripe Checkout Sessions |

### Flow

1. **Client** calls `POST /api/checkout` with `{ tier: "pro" }`
2. **Server** creates a Stripe Checkout Session with the user's metadata
3. **Server** returns the checkout URL
4. **Client** redirects the user to Stripe's hosted checkout page
5. **Stripe** processes payment and sends a webhook to `/api/webhooks/stripe`
6. **Webhook handler** updates `profiles.subscription_tier` in Supabase
7. **Next page load** picks up the new tier from the database

---

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server only | `sk_test_...` (test) or `sk_live_...` (prod) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | `pk_test_...` (test) or `pk_live_...` (prod) |
| `STRIPE_WEBHOOK_SECRET` | Server only | `whsec_...` from webhook endpoint setup |
| `STRIPE_PRO_PRICE_ID` | Server only | Price ID from Stripe Dashboard |
| `STRIPE_PREMIUM_PRICE_ID` | Server only | Price ID from Stripe Dashboard |

> ⚠️ **Use TEST mode keys** for local and preview environments.
> Only use LIVE keys for production.

---

## Security notes

- **Webhook signature verification** is mandatory. The handler rejects requests
  without a valid `stripe-signature` header.
- **Secrets are server-side only.** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
  never reach the browser.
- **Feature gating is server-driven.** The `subscription_tier` in the database
  is the source of truth, set only by verified webhooks.
