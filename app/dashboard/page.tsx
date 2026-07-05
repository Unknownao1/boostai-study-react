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

  return <StudyDashboard user={{ id: user.id, email: user.email ?? "" }} />;
}
