/**
 * Stripe webhook handler.
 *
 * Receives events from Stripe (checkout completed, subscription updated/deleted)
 * and updates the user's subscription tier in Supabase.
 *
 * Setup:
 * 1. In Stripe Dashboard → Webhooks → Add endpoint
 * 2. URL: https://boostai.study/api/webhooks/stripe
 * 3. Events: checkout.session.completed, customer.subscription.updated,
 *            customer.subscription.deleted
 * 4. Copy the signing secret to STRIPE_WEBHOOK_SECRET env var
 *
 * For local testing: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Use a service-role client here because webhooks run without a user session
// and need to update any user's profile.
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  // Idempotency: Stripe retries webhooks, so skip anything we've already
  // processed. subscription_events.stripe_event_id has a unique constraint.
  const { error: logError } = await supabase
    .from("subscription_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data.object,
    });

  if (logError) {
    if (logError.code === "23505") {
      // Unique violation — we've already handled this event.
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to log webhook event:", logError);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.userId && session.customer) {
          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: session.customer as string,
              subscription_tier: session.metadata.tier ?? "pro",
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.metadata.userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const tier = subscription.status === "active" ? "pro" : "free";

        await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        // Unhandled event type — log it but don't fail
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
