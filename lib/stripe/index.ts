/**
 * Stripe client — server-side only.
 *
 * Wraps the Stripe SDK behind a single module so it can be tested and swapped.
 * NEVER import this file from a client component.
 *
 * Usage:
 *   import { stripe } from "@/lib/stripe";
 */

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Pin the API version to avoid surprise breaking changes.
  // Update this deliberately and test when upgrading.
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

/**
 * Subscription tiers used across the app.
 * The `priceId` values come from Stripe Dashboard → Products → Prices.
 * Fill these in after creating products in Stripe.
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    priceId: null, // No Stripe price — this is the default tier
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? null,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
