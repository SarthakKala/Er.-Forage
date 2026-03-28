"use client";

import { useEffect, useMemo, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import type { Assignment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<{ assignments: Assignment[] }>("/assignments/current");
      setAssignments(r.data.assignments);
    } catch {
      setError("Failed to load assignments.");
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

  const concept = useMemo(() => assignments[0]?.concept_target ?? "No target yet", [assignments]);

  if (loading)
    return (
      <div className="page-content">
        <LoadingCards count={3} />
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  return (
    <div className="page-content">
      <h1 className="text-[32px] font-medium tracking-[-1.5px]">This week&apos;s assignment</h1>
      <p className="mt-2 text-[15px]" style={{ color: "var(--green)" }}>
        Targeting: {concept}
      </p>

      <div className="mt-6 space-y-3">
        {assignments.length === 0 ? (
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: "rgba(62,207,142,0.10)",
                border: "0.5px solid rgba(62,207,142,0.25)"
              }}
            >
              <span className="text-[16px]" style={{ color: "var(--green)" }}>
                ✓
              </span>
            </div>
            <p className="mt-4 text-[16px] font-medium tracking-[-0.3px]">No pending assignments</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Run a sync to generate this week’s targeted practice from your biggest skill gap.
            </p>
            <button
              onClick={load}
              className="mt-4 rounded-[10px] px-5 py-2 text-[13px] font-medium"
              style={{ background: "var(--green)", color: "#050505" }}
            >
              Refresh
            </button>
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl p-4"
              style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
            >
              <div>
                <p className="text-[15px]">{a.problem_title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.08em]">
                  <span style={{ color: "var(--green)" }}>{a.concept_target}</span>
                  <span style={{ color: "var(--text-muted)" }}>{formatDate(a.assigned_at)}</span>
                  {a.status === "completed" ? <span style={{ color: "var(--green)" }}>✓ completed</span> : null}
                </div>
              </div>
              <a
                href={a.platform_url}
                target="_blank"
                rel="noreferrer"
                className="text-[13px]"
                style={{ color: "var(--green)" }}
              >
                Solve on LeetCode →
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
