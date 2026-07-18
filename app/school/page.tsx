import type { Metadata } from "next";
import { PersonaLanding } from "@/components/boostai/PersonaLanding";
import { schoolLanding } from "@/components/boostai/site-data";

export const metadata: Metadata = {
  title: "BoostAI for School",
  description:
    "Solve and generate GCSE, A-Level, IGCSE, and IB questions with step-by-step AI explanations and unlimited practice variations."
};

export default function SchoolPage() {
  return <PersonaLanding page={schoolLanding} />;
}
