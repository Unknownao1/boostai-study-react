"use client";

import { useState } from "react";
import styles from "./askBoostAI.module.css";

interface EssayMarkResult {
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

const LEVELS = ["GCSE", "A-Level", "IB", "University"];

export function EssayMarker() {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [result, setResult] = useState<EssayMarkResult | null>(null);

  const canSubmit =
    subject.trim() && question.trim() && essay.trim().length > 50 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setLimitReached(false);
    setResult(null);

    try {
      const res = await fetch("/api/essays/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, level, question, essay }),
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

      setResult(data);
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

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Essay marker</span>
        <h2>Get your essay marked like an examiner would</h2>
        <p>
          Paste the question and your answer. BoostAI marks it against what
          the question is actually asking — not just general writing quality.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. History"
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
        </div>

        <label className={styles.field}>
          <span>Question</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Paste the exam question exactly as it was set..."
            rows={2}
            maxLength={2000}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Your essay</span>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Paste your full answer..."
            rows={10}
            maxLength={20000}
            required
          />
        </label>

        <button className={styles.submit} type="submit" disabled={!canSubmit}>
          {loading ? "Marking…" : "Mark my essay"}
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

      {result ? (
        <div className={styles.results}>
          <article className={styles.resultCard}>
            <p className={styles.finalAnswer}>{result.grade}</p>
            <p className={styles.resultPrompt}>{result.summary}</p>
          </article>

          <article className={styles.resultCard}>
            <p className={styles.resultPrompt}>Strengths</p>
            <ol>
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </article>

          <article className={styles.resultCard}>
            <p className={styles.resultPrompt}>To improve</p>
            <ol>
              {result.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </article>
        </div>
      ) : null}
    </section>
  );
}
