/**
 * Subscription limits.
 *
 * Kept separate from lib/stripe so it can be imported by API routes without
 * pulling in the Stripe SDK (e.g. the generate route only needs the number).
 */

export const FREE_TIER_QUESTION_LIMIT = 15;
export const FREE_TIER_ESSAY_LIMIT = 5;
