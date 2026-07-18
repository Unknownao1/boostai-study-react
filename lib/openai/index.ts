/**
 * OpenAI integration.
 *
 * Server-only — never import this from a client component. Every AI call
 * in the app should go through here so there's one place to change models,
 * prompts, or providers.
 *
 * Usage:
 *   import { generateSimilarQuestions } from "@/lib/openai";
 */

import { serverEnv } from "@/lib/env";

export interface GeneratedQuestion {
  prompt: string;
  reasoning: string[];
  answer: string;
}

interface GenerateSimilarInput {
  subject: string;
  level: string;
  topic: string;
  originalPrompt: string;
  originalAnswer: string;
  count?: number;
}

const OPENAI_MODEL = "gpt-5";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an exam question writer for UK school and university
students (GCSE, A-Level, IB, and first-year university courses). Given a worked
example question, you generate new questions that test the exact same concept and
difficulty level, but with different numbers, contexts, or wording — never a copy
of the original.

Rules:
- Keep the same subject, level, and mark allocation difficulty as the original.
- Each generated question must have a genuinely different answer (change the
  numbers or scenario, don't just reword).
- "reasoning" is a short step-by-step working, matching mark-scheme style
  (terse, numbered logical steps — not prose explanation).
- "answer" is the final numeric or short-form answer only.
- Respond with ONLY a JSON object of the form:
  {"questions": [{"prompt": "...", "reasoning": ["...", "..."], "answer": "..."}]}
- No markdown, no commentary, no text outside the JSON object.`;

interface MarkEssayInput {
  subject: string;
  level: string;
  question: string;
  essay: string;
}

export interface EssayMarkResult {
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

const ESSAY_SYSTEM_PROMPT = `You are an experienced UK exam marker for GCSE, A-Level,
and IB essay-based subjects (English, History, Economics, Business, Psychology, etc).
Given an exam question and a student's essay answer, mark it the way a real examiner
would: against what the question is actually asking, not generic writing quality.

Rules:
- "grade" is a short estimate like "Grade 7 / A*" or "Band 4 / high marks" —
  whatever grading convention fits the level given.
- "summary" is 2-3 sentences on the overall standard of the response.
- "strengths" and "improvements" are each 3-5 short, specific, actionable bullet
  points — reference what the student actually wrote, not generic advice.
- Be honest and specific. Do not inflate the grade to be encouraging.
- Respond with ONLY a JSON object of the form:
  {"grade": "...", "summary": "...", "strengths": ["..."], "improvements": ["..."]}
- No markdown, no commentary, no text outside the JSON object.`;

export async function markEssay(input: MarkEssayInput): Promise<EssayMarkResult> {
  const userPrompt = `Subject: ${input.subject}
Level: ${input.level || "unspecified"}

Question: ${input.question}

Student's essay:
${input.essay}

Mark this essay as described in your instructions.`;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: ESSAY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned no content");
  }

  let parsed: Partial<EssayMarkResult>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned malformed JSON");
  }

  if (
    !parsed.grade ||
    !parsed.summary ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.improvements)
  ) {
    throw new Error("OpenAI response was missing required fields");
  }

  return parsed as EssayMarkResult;
}

export async function generateSimilarQuestions(
  input: GenerateSimilarInput
): Promise<GeneratedQuestion[]> {
  const count = input.count ?? 3;

  const userPrompt = `Subject: ${input.subject}
Level: ${input.level || "unspecified"}
Topic: ${input.topic || "unspecified"}

Original question: ${input.originalPrompt}
Original answer: ${input.originalAnswer}

Generate ${count} new questions that test the same concept at the same
difficulty. Return them as the JSON object described in your instructions.`;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned no content");
  }

  let parsed: { questions?: GeneratedQuestion[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned malformed JSON");
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("OpenAI response did not contain a questions array");
  }

  return parsed.questions;
}
