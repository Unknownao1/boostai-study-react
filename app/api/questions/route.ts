/**
 * GET /api/questions
 *
 * Returns the signed-in user's saved generated questions (Question Bank),
 * most recent first.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generated_questions")
    .select(
      "id, subject, level, topic, generated_prompt, reasoning, generated_answer, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load question bank:", error);
    return NextResponse.json(
      { error: "Could not load your question bank." },
      { status: 500 }
    );
  }

  return NextResponse.json({ questions: data });
}
