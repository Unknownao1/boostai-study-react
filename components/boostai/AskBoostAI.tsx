"use client";

import { useState } from "react";
import styles from "./askBoostAI.module.css";

interface GeneratedQuestion {
  prompt: string;
  reasoning: string[];
  answer: string;
}

const LEVELS = ["GCSE", "A-Level", "IB", "University"];

export function AskBoostAI() {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedQuestion[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [limitReached, setLimitReached] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const canSubmit = subject.trim() && prompt.trim() && answer.trim() && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setLimitReached(false);
    setResults([]);
    setRevealedAnswers(new Set());

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, level, topic, prompt, answer, count: 3 }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === "limit_reached") {
        setLimitReached(true);
        setError(data.message);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResults(data.questions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro" }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setUpgrading(false);
    }
  }

  function toggleAnswer(index: number) {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Ask BoostAI</span>
        <h2>Paste a question you&apos;ve already worked through</h2>
        <p>
          BoostAI will generate new questions testing the same concept, so you can
          practise until it actually sticks.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Topic (optional)</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratics"
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>Question</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste the question exactly as it appears on the paper..."
            rows={3}
            maxLength={2000}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Your answer</span>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="What's the final answer?"
            rows={2}
            maxLength={1000}
            required
          />
        </label>

        <button className={styles.submit} type="submit" disabled={!canSubmit}>
          {loading ? "Generating…" : "Generate similar questions"}
        </button>

        {error ? (
          <div className={styles.errorBlock}>
            <p className={styles.error}>{error}</p>
            {limitReached ? (
              <button
                type="button"
                className={styles.upgradeButton}
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            ) : null}
          </div>
        ) : null}
      </form>

      {results.length > 0 ? (
        <div className={styles.results}>
          {results.map((q, index) => (
            <article className={styles.resultCard} key={index}>
              <p className={styles.resultPrompt}>{q.prompt}</p>

              {revealedAnswers.has(index) ? (
                <div className={styles.resultAnswer}>
                  <ol>
                    {q.reasoning.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <p className={styles.finalAnswer}>Answer: {q.answer}</p>
                </div>
              ) : (
                <button
                  className={styles.revealButton}
                  type="button"
                  onClick={() => toggleAnswer(index)}
                >
                  Show working
                </button>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
