"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import type { Submission } from "@/lib/types";
import { formatDateTime, parseAiAnalysis } from "@/lib/utils";

type Filter = "all" | "accepted" | "failed" | "tle";

export default function SubmissionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<{ submissions: Submission[] }>("/submissions?page=1&pageSize=100");
      setSubmissions(r.data.submissions);
    } catch {
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    gsap.killTweensOf(".page-content");
    gsap.fromTo(".page-content", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    return () => gsap.killTweensOf(".page-content");
  }, []);

  useGSAP(() => {
    if (!panelOpen) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const el = panelRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { x: "100%", opacity: 0 },
      { x: "0%", opacity: 1, duration: 0.4, ease: "power3.out" }
    );
    return () => gsap.killTweensOf(el);
  }, [panelOpen]);

  function openPanel(s: Submission) {
    setSelected(s);
    setPanelOpen(true);
  }

  function closePanel() {
    const el = panelRef.current;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !el) {
      setPanelOpen(false);
      setSelected(null);
      return;
    }
    gsap.killTweensOf(el);
    gsap.to(el, {
      x: "100%",
      opacity: 0,
      duration: 0.3,
      ease: "power3.in",
      onComplete: () => {
        setPanelOpen(false);
        setSelected(null);
      }
    });
  }

  const filtered = useMemo(() => {
    if (filter === "all") return submissions;
    if (filter === "accepted") return submissions.filter((s) => s.result === "accepted");
    if (filter === "tle") return submissions.filter((s) => s.result === "tle");
    return submissions.filter((s) => s.result === "wrong" || s.result === "error");
  }, [submissions, filter]);

  if (loading)
    return (
      <div className="page-content">
        <LoadingCards count={4} />
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  const analysis = parseAiAnalysis(selected?.ai_analysis ?? null);

  return (
    <div className="page-content">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[32px] font-medium tracking-[-1.5px]">Submissions</h1>
        <div className="flex gap-2">
          {(["all", "accepted", "failed", "tle"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-[6px] px-3 py-1.5 text-[13px]"
              style={{
                border: "0.5px solid var(--bg-border)",
                background: filter === f ? "var(--green-dim)" : "transparent",
                color: filter === f ? "var(--green)" : "var(--text-secondary)"
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl" style={{ border: "0.5px solid var(--bg-border)", background: "var(--bg-surface)" }}>
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => openPanel(s)}
            className="grid w-full grid-cols-[2fr_100px_100px_180px_140px] items-center gap-3 border-b px-4 py-3 text-left text-[13px]"
            style={{ borderColor: "var(--bg-border)" }}
          >
            <span>{s.problem_title}</span>
            <span style={{ color: "var(--text-secondary)" }}>{s.difficulty}</span>
            <span style={{ color: "var(--text-secondary)" }}>{s.result}</span>
            <span style={{ color: "var(--text-secondary)" }}>{(s.concept_tags ?? []).slice(0, 2).join(", ")}</span>
            <span style={{ color: "var(--text-muted)" }}>{formatDateTime(s.submitted_at)}</span>
          </button>
        ))}
      </div>

      {panelOpen && selected ? (
        <aside
          ref={(node) => {
            panelRef.current = node;
          }}
          className="detail-panel fixed bottom-0 right-0 top-0 z-[60] w-[480px] overflow-y-auto p-6"
          style={{ background: "var(--bg-surface)", borderLeft: "0.5px solid var(--bg-border)" }}
        >
          <button onClick={closePanel} className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Close
          </button>
          <h2 className="mt-4 text-[28px] font-medium tracking-[-0.8px]">{selected.problem_title}</h2>
          <pre className="mt-4 max-h-[320px] overflow-auto rounded-lg p-4 text-[12px]" style={{ background: "var(--bg-base)", border: "0.5px solid var(--bg-border)" }}>
            {selected.submitted_code ?? "// No code available"}
          </pre>
          <div className="mt-4 h-[3px] w-full rounded bg-[rgba(62,207,142,0.2)]">
            <div className="h-full w-full rounded bg-[#3ECF8E]" />
          </div>
          <div className="mt-6 space-y-3 text-[14px]">
            <p><span className="font-medium">Concept:</span> {(analysis?.concept_tags ?? selected.concept_tags).join(", ")}</p>
            <p><span className="font-medium">Skill gap:</span> {analysis?.skill_gap ?? "N/A"}</p>
            <p><span className="font-medium">Root cause:</span> {analysis?.root_cause ?? "N/A"}</p>
            <p style={{ color: "var(--text-secondary)" }}>{analysis?.post_solve_analysis ?? "Analysis pending..."}</p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
