import type { Metadata } from "next";
import { AuthLogin } from "@/components/boostai/AuthLogin";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create an account to access BoostAI Study.",
};

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;

  const redirectTo =
    typeof params.redirectTo === "string" ? params.redirectTo : "/dashboard";

  const errorMessage =
    typeof params.error === "string"
      ? "Something went wrong during sign in. Please try again."
      : undefined;

  return (
    <main className="auth-page-wrapper">
      <AuthLogin redirectTo={redirectTo} errorMessage={errorMessage} />
    </main>
  );
}
