"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SkillsTimeline } from "@/components/charts/SkillsTimeline";
import { SkillBar } from "@/components/ui/SkillBar";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import type { Assignment, SkillHistory, SkillPoint, Submission } from "@/lib/types";
import { formatDateTime, orderSkillScores, parseAiAnalysis } from "@/lib/utils";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [skills, setSkills] = useState<SkillPoint[]>([]);
  const [history, setHistory] = useState<SkillHistory[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const empty = submissions.length === 0;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, sk, hist, asg] = await Promise.all([
        api.get<{ submissions: Submission[] }>("/submissions?page=1&pageSize=20"),
        api.get<{ skills: SkillPoint[] }>("/skills"),
        api.get<{ concepts: SkillHistory[] }>("/skills/history"),
        api.get<{ assignments: Assignment[] }>("/assignments/current")
      ]);
      setSubmissions(subs.data.submissions);
      setSkills(sk.data.skills);
      setHistory(hist.data.concepts);
      setAssignments(asg.data.assignments);
    } catch {
      setError("Failed to load dashboard data.");
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

  const didAnimateRef = useRef(false);
  useGSAP(() => {
    if (loading || error || empty) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || didAnimateRef.current) return;
    didAnimateRef.current = true;

    const cardCleanup = () => gsap.killTweensOf(".dashboard-card, .scan-bar, .analysis-row");

    gsap.fromTo(
      ".dashboard-card",
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.1
      }
    );

    gsap.fromTo(
      ".scan-bar",
      { width: "0%" },
      { width: "100%", duration: 0.55, ease: "power2.inOut", delay: 0.15 }
    );

    gsap.fromTo(
      ".analysis-row",
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.1, ease: "power2.out", delay: 0.1 }
    );

    return cardCleanup;
  }, [loading, error, submissions.length]);

  const latest = submissions[0];
  const recent = submissions.slice(0, 5);
  const latestAnalysis = parseAiAnalysis(latest?.ai_analysis ?? null);

  const topSkills = useMemo(() => orderSkillScores(skills).slice(0, 12), [skills]);
  const avgSkill = useMemo(() => {
    if (skills.length === 0) return null;
    return Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length);
  }, [skills]);

  if (loading)
    return (
      <div className="page-content">
        <LoadingCards count={5} />
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  if (empty) {
    return (
      <div className="page-content flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: "rgba(62,207,142,0.10)",
              border: "0.5px solid rgba(62,207,142,0.25)"
            }}
          >
            <span className="text-[18px]" style={{ color: "var(--green)" }}>
              E
            </span>
          </div>
          <h1 className="mt-6 text-[32px] font-medium tracking-[-1.5px]">Connect LeetCode</h1>
          <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Sync real submissions to unlock AI analysis, skill tracking, and weekly assignments.
          </p>
          <a
            href="/onboarding"
            className="mt-6 inline-flex rounded-[10px] px-5 py-2 text-[13px] font-medium"
            style={{ background: "var(--green)", color: "#050505" }}
          >
            Start onboarding
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content space-y-6 lg:space-y-8">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        <article className="dashboard-card glass-panel min-h-[320px] rounded-[14px] p-5 lg:col-span-7 lg:min-h-[380px]">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">Latest submission</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {latest.problem_title} · {latest.result}
          </p>
          <pre className="mt-4 max-h-[200px] overflow-auto rounded-[10px] border border-white/[0.06] bg-[rgba(5,5,5,0.45)] p-4 text-[12px] backdrop-blur-sm">
            {latest.submitted_code ?? "// No code captured"}
          </pre>
          <div className="mt-4 h-[3px] rounded bg-[rgba(62,207,142,0.2)]">
            <div className="scan-bar h-full rounded bg-[#3ECF8E]" style={{ width: "0%" }} />
          </div>

          <div className="mt-4 space-y-3 text-[13px]">
            <div className="analysis-row" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Concept:</span>{" "}
              {(latestAnalysis?.concept_tags ?? []).join(", ") || "—"}
            </div>
            <div className="analysis-row" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Skill gap:</span>{" "}
              <span style={{ color: "var(--green)" }}>{latestAnalysis?.skill_gap ?? "—"}</span>
            </div>
            <div className="analysis-row" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Root cause:</span>{" "}
              {latestAnalysis?.root_cause ?? "—"}
            </div>
            <div className="analysis-row" style={{ color: "var(--text-secondary)" }}>
              {latestAnalysis?.post_solve_analysis ?? "Analysis pending..."}
            </div>
          </div>
        </article>

        <article className="dashboard-card glass-panel-accent flex min-h-[280px] flex-col justify-between rounded-[14px] p-6 lg:col-span-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Skill pulse
            </p>
            <p className="mt-3 text-[clamp(36px,8vw,52px)] font-medium tabular-nums tracking-[-2px]" style={{ color: "#3ECF8E" }}>
              {avgSkill ?? "—"}
            </p>
            <p className="mt-2 max-w-[220px] text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Average score across your full taxonomy — open the profile for the circular breakdown.
            </p>
          </div>
          <Link
            href="/skills"
            className="mt-6 inline-flex w-fit items-center rounded-full px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--green)", color: "#050505" }}
          >
            Skill profile →
          </Link>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <article className="dashboard-card glass-panel rounded-[14px] p-5 lg:col-span-4">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">Top concepts</h2>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
            Ordered by taxonomy
          </p>
          <div className="mt-5 space-y-4">
            {topSkills.map((s) => (
              <SkillBar key={s.concept} concept={s.concept} score={s.score} />
            ))}
          </div>
        </article>

        <article className="dashboard-card glass-panel min-h-[280px] rounded-[14px] p-5 lg:col-span-8">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">This week&apos;s assignment</h2>
          {assignments.length === 0 ? (
            <div className="mt-4 rounded-[12px] border border-white/[0.06] bg-[rgba(5,5,5,0.35)] p-4 backdrop-blur-sm">
              <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                No assignment yet
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                Run a sync to generate targeted problems for your biggest skill gap.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-[10px] border border-white/[0.06] bg-[rgba(5,5,5,0.35)] px-3 py-3 backdrop-blur-sm"
                >
                  <div>
                    <p className="text-[14px]">{a.problem_title}</p>
                    <p className="text-[12px]" style={{ color: "var(--green)" }}>
                      {a.concept_target}
                    </p>
                  </div>
                  <a href={a.platform_url} target="_blank" className="text-[13px] font-medium" style={{ color: "var(--green)" }} rel="noreferrer">
                    Solve →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <article className="dashboard-card glass-panel rounded-[14px] p-5 lg:col-span-8">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">8-week growth</h2>
          <div className="mt-4 h-[min(280px,40vh)] min-h-[220px] lg:h-[300px]">
            <SkillsTimeline history={history} />
          </div>
        </article>

        <article className="dashboard-card glass-panel max-h-[min(420px,55vh)] overflow-y-auto rounded-[14px] p-5 lg:col-span-4">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">Recent activity</h2>
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <p className="truncate">{s.problem_title}</p>
                  <p style={{ color: "var(--text-secondary)" }}>{s.result}</p>
                </div>
                <span className="shrink-0 text-right" style={{ color: "var(--text-muted)" }}>
                  {formatDateTime(s.submitted_at)}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
