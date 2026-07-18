"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        fontFamily: "sans-serif",
        color: "#1f2937",
      }}
    >
      <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong</h1>
      <p style={{ color: "#667085", maxWidth: 420, margin: 0 }}>
        That&apos;s on us, not you. Try again — if it keeps happening, head
        back to the homepage and let us know what you were doing.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#2f68ff",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid rgba(31,41,55,0.16)",
            color: "#1f2937",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
