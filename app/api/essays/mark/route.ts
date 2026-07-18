/**
 * POST /api/essays/mark
 *
 * Marks a student's essay against a given exam question, examiner-style.
 * We deliberately don't store essay text — see migration 003 — only a
 * usage count for free-tier limiting.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markEssay } from "@/lib/openai";
import { FREE_TIER_ESSAY_LIMIT } from "@/lib/limits";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, essay_marks_used")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";

  if (tier === "free" && (profile?.essay_marks_used ?? 0) >= FREE_TIER_ESSAY_LIMIT) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message: `You've used all ${FREE_TIER_ESSAY_LIMIT} free essay marks this month. Upgrade to Pro for unlimited marking.`,
      },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { subject, level, question, essay } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (
    typeof subject !== "string" ||
    typeof question !== "string" ||
    typeof essay !== "string" ||
    !subject.trim() ||
    !question.trim() ||
    !essay.trim()
  ) {
    return NextResponse.json(
      { error: "subject, question, and essay are required" },
      { status: 400 }
    );
  }

  if (essay.trim().split(/\s+/).length < 30) {
    return NextResponse.json(
      { error: "Essay looks too short to mark meaningfully (30 words minimum)." },
      { status: 400 }
    );
  }

  if (essay.length > 20000 || question.length > 2000) {
    return NextResponse.json(
      { error: "That's too long for us to mark in one go. Try splitting it up." },
      { status: 400 }
    );
  }

  try {
    const result = await markEssay({
      subject,
      level: typeof level === "string" ? level : "",
      question,
      essay,
    });

    const { error: incrementError } = await supabase.rpc(
      "increment_essay_marks",
      { p_user_id: user.id }
    );

    if (incrementError) {
      console.error("Failed to increment essay mark usage:", incrementError);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Essay marking failed:", err);
    return NextResponse.json(
      { error: "Marking failed. Please try again." },
      { status: 502 }
    );
  }
}
