"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SkillsTimeline } from "@/components/charts/SkillsTimeline";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import type { PortfolioPayload } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [reports, setReports] = useState<
    Array<{ id: string; token: string; created_at: string; report_name?: string | null }>
  >([]);
  const [generating, setGenerating] = useState(false);
  const didCountRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([
        api.get<PortfolioPayload>("/portfolio"),
        api.get<{
          reports: Array<{ id: string; token: string; created_at: string; report_name?: string | null }>;
        }>("/portfolio/reports")
      ]);
      setData(p.data);
      setReports(r.data.reports);
    } catch {
      setError("Failed to load portfolio.");
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

  useGSAP(
    () => {
      if (loading || didCountRef.current) return;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;
      didCountRef.current = true;

      const els = Array.from(document.querySelectorAll<HTMLElement>(".counter"));
      els.forEach((el) => {
        const target = parseInt(el.dataset.target ?? "0", 10);
        el.textContent = "0";
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 0.55,
          ease: "power2.out",
          onUpdate: function () {
            const current = Math.round(obj.val);
            el.textContent = current.toString();
          }
        });
      });

      return () => gsap.killTweensOf(".counter");
    },
    { dependencies: [loading] }
  );

  async function generateReport() {
    setGenerating(true);
    try {
      await api.post("/portfolio/report");
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function renameReport(reportId: string, currentName?: string | null) {
    const next = window.prompt("Rename report", currentName ?? "");
    if (!next || !next.trim()) return;
    try {
      await api.patch(`/portfolio/reports/${reportId}`, { reportName: next.trim() });
      await load();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Rename failed (backend must be running on http://localhost:4000).";
      window.alert(msg);
    }
  }

  async function deleteReport(reportId: string) {
    const ok = window.confirm("Delete this report permanently?");
    if (!ok) return;
    try {
      await api.delete(`/portfolio/reports/${reportId}`);
      await load();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Delete failed (backend must be running on http://localhost:4000).";
      window.alert(msg);
    }
  }

  const overall = useMemo(() => {
    if (!data?.skillScores?.length) return 0;
    return Math.round(data.skillScores.reduce((acc, s) => acc + s.score, 0) / data.skillScores.length);
  }, [data]);

  if (loading)
    return (
      <div className="page-content">
        <LoadingCards count={4} />
      </div>
    );
  if (error || !data)
    return (
      <div className="page-content">
        <ErrorState message={error ?? "Portfolio is not available yet."} onRetry={load} />
      </div>
    );

  return (
    <div className="page-content space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-medium tracking-[-1.5px]">Growth portfolio</h1>
        <button
          onClick={generateReport}
          disabled={generating}
          className="rounded-[8px] px-5 py-2 text-[13px] font-medium"
          style={{ background: "var(--green)", color: "#050505" }}
        >
          {generating ? "Generating..." : "Generate report"}
        </button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Problems solved", data.stats.problemsSolved],
          ["Concepts tracked", 12],
          ["Weeks active", data.stats.weeksActive],
          ["Overall score", overall]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}>
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="mt-2 text-[28px] font-medium tracking-[-0.8px] tabular-nums">
              <span className="counter" data-target={value as number}>
                0
              </span>
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}>
        <h2 className="text-[18px] font-medium tracking-[-0.3px]">Growth timeline</h2>
        <div className="mt-4 h-[300px]">
          <SkillsTimeline history={data.skillHistory} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {reports.length === 0 ? (
          <div
            className="rounded-xl p-5 lg:col-span-2"
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
                ↗
              </span>
            </div>
            <p className="mt-4 text-[16px] font-medium tracking-[-0.3px]">No shareable reports yet</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Generate a snapshot you can send to recruiters — skill bars, growth history, and stats in one link.
            </p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="mt-4 rounded-[10px] px-5 py-2 text-[13px] font-medium"
              style={{ background: "var(--green)", color: "#050505" }}
            >
              {generating ? "Generating..." : "Generate your first report"}
            </button>
          </div>
        ) : (
          reports.map((r) => {
            const url = `http://localhost:3000/report/${r.token}`;
            return (
              <article
                key={r.id}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
              >
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  {formatDate(r.created_at)}
                </p>
                <p className="mt-1 truncate text-[13px]" style={{ color: "var(--text-primary)" }}>
                  {r.report_name?.trim() || "Growth report"}
                </p>
                <p className="mt-2 truncate text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {url}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-[8px] px-3 py-1.5 text-[13px]"
                    style={{ border: "0.5px solid var(--bg-border)" }}
                    onClick={() => navigator.clipboard.writeText(url)}
                  >
                    Copy link
                  </button>
                  <button
                    className="rounded-[8px] px-3 py-1.5 text-[13px]"
                    style={{ border: "0.5px solid var(--bg-border)" }}
                    onClick={() => renameReport(r.id, r.report_name)}
                  >
                    Rename
                  </button>
                  <button
                    className="rounded-[8px] px-3 py-1.5 text-[13px]"
                    style={{ border: "0.5px solid rgba(239,68,68,0.35)", color: "rgba(239,68,68,0.9)" }}
                    onClick={() => deleteReport(r.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
        <button
          onClick={generateReport}
          className="rounded-xl p-4 text-left"
          style={{ border: "0.5px dashed var(--bg-border)", background: "transparent" }}
        >
          <p className="text-[18px] font-medium tracking-[-0.3px]">Generate new report</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Create a fresh shareable snapshot
          </p>
        </button>
      </section>
    </div>
  );
}
