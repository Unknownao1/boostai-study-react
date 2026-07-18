import type { Metadata } from "next";
import { PersonaLanding } from "@/components/boostai/PersonaLanding";
import { universityLanding } from "@/components/boostai/site-data";

export const metadata: Metadata = {
  title: "BoostAI for University",
  description:
    "Turn dense lectures, readings, and past papers into revision prompts, worked answers, and next-step study plans."
};

export default function UniPage() {
  return <PersonaLanding page={universityLanding} />;
}
