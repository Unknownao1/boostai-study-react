/**
 * POST /api/questions/generate
 *
 * The core "Generate Similar" loop. Takes a worked question + answer and
 * returns new AI-generated questions testing the same concept.
 *
 * Requires a signed-in user. All OpenAI calls happen here, server-side —
 * the client never talks to OpenAI directly.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSimilarQuestions } from "@/lib/openai";
import { FREE_TIER_QUESTION_LIMIT } from "@/lib/limits";

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
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";

  if (tier === "free") {
    const { count } = await supabase
      .from("generated_questions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= FREE_TIER_QUESTION_LIMIT) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: `You've used all ${FREE_TIER_QUESTION_LIMIT} free questions. Upgrade to Pro for unlimited generation.`,
        },
        { status: 403 }
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { subject, level, topic, prompt, answer, count } =
    (body ?? {}) as Record<string, unknown>;

  if (
    typeof subject !== "string" ||
    typeof prompt !== "string" ||
    typeof answer !== "string" ||
    !subject.trim() ||
    !prompt.trim() ||
    !answer.trim()
  ) {
    return NextResponse.json(
      { error: "subject, prompt, and answer are required" },
      { status: 400 }
    );
  }

  if (prompt.length > 2000 || answer.length > 1000 || subject.length > 200) {
    return NextResponse.json(
      { error: "Input is too long. Keep the question under 2000 characters." },
      { status: 400 }
    );
  }

  const safeCount =
    typeof count === "number" && Number.isFinite(count)
      ? Math.min(Math.max(Math.round(count), 1), 5)
      : 3;

  try {
    const questions = await generateSimilarQuestions({
      subject,
      level: typeof level === "string" ? level : "",
      topic: typeof topic === "string" ? topic : "",
      originalPrompt: prompt,
      originalAnswer: answer,
      count: safeCount,
    });

    const rows = questions.map((q) => ({
      user_id: user.id,
      subject,
      level: typeof level === "string" ? level : null,
      topic: typeof topic === "string" ? topic : null,
      original_prompt: prompt,
      original_answer: answer,
      generated_prompt: q.prompt,
      reasoning: q.reasoning,
      generated_answer: q.answer,
    }));

    const { error: insertError } = await supabase
      .from("generated_questions")
      .insert(rows);

    if (insertError) {
      // Don't fail the request just because saving failed — the person
      // still gets their questions, they just won't show up in the bank.
      console.error("Failed to save generated questions:", insertError);
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Question generation failed:", err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 502 }
    );
  }
}
