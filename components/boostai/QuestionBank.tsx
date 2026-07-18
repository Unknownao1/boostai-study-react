"use client";

import { useEffect, useState } from "react";
import styles from "./askBoostAI.module.css";

interface SavedQuestion {
  id: string;
  subject: string;
  level: string | null;
  topic: string | null;
  generated_prompt: string;
  reasoning: string[];
  generated_answer: string;
  created_at: string;
}

export function QuestionBank() {
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/questions");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Could not load your question bank.");
        }

        if (!cancelled) {
          setQuestions(data.questions ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Question bank</span>
        <h2>Everything BoostAI has generated for you</h2>
        <p>Every question you&apos;ve generated is saved here, most recent first.</p>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && questions.length === 0 ? (
        <p>
          Nothing here yet — head to Ask BoostAI and generate your first set of
          questions.
        </p>
      ) : null}

      {questions.length > 0 ? (
        <div className={styles.results}>
          {questions.map((q) => (
            <article className={styles.resultCard} key={q.id}>
              <p className={styles.resultPrompt}>{q.generated_prompt}</p>

              {revealed.has(q.id) ? (
                <div className={styles.resultAnswer}>
                  <ol>
                    {q.reasoning.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <p className={styles.finalAnswer}>Answer: {q.generated_answer}</p>
                </div>
              ) : (
                <button
                  className={styles.revealButton}
                  type="button"
                  onClick={() => toggle(q.id)}
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
