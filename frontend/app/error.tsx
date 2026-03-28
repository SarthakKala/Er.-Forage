"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section
        className="w-full max-w-[560px] rounded-xl p-8 text-center"
        style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
      >
        <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>Er</span>
          <span style={{ color: "var(--green)" }}>.</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>Forge</span>
        </p>
        <h1 className="mt-6 text-[32px] font-medium tracking-[-1.5px]">Something went wrong</h1>
        <p className="mt-3 text-[15px]" style={{ color: "var(--text-secondary)" }}>
          Please try again. If this keeps happening, the backend may be unreachable.
        </p>
        <button
          onClick={() => reset()}
          className="mt-8 inline-flex rounded-[8px] px-5 py-2 text-[13px] font-medium"
          style={{ background: "var(--green)", color: "#050505" }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}

