import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudyDashboard } from "@/components/boostai/StudyDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If the middleware didn't catch this (e.g. during a race), redirect manually
  if (!user) {
    redirect("/auth?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const { count: questionsUsed } = await supabase
    .from("generated_questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <StudyDashboard
      user={{ id: user.id, email: user.email ?? "" }}
      subscriptionTier={profile?.subscription_tier ?? "free"}
      questionsUsed={questionsUsed ?? 0}
    />
  );
}
