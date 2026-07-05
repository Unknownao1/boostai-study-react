/**
 * Checkout session creator.
 *
 * POST /api/checkout → creates a Stripe Checkout Session and returns the URL.
 *
 * The client redirects the user to this URL to complete payment.
 * After payment, Stripe redirects back to /dashboard?checkout=success.
 *
 * Requires an authenticated user (the middleware protects this route).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { tier?: string };
    const tier = (body.tier ?? "pro") as SubscriptionTier;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    if (!tierConfig || !tierConfig.priceId) {
      return NextResponse.json(
        { error: "Invalid or unconfigured subscription tier" },
        { status: 400 }
      );
    }

    const { origin } = new URL(request.url);

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: {
        userId: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
