"use client";

import { useEffect, useMemo, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { SKILL_PIPE_COLORS, SkillsDonut } from "@/components/charts/SkillsDonut";
import { SkillsTimeline } from "@/components/charts/SkillsTimeline";
import { SkillBar } from "@/components/ui/SkillBar";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import type { SkillHistory, SkillPoint } from "@/lib/types";
import { orderSkillScores } from "@/lib/utils";

export default function SkillsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillPoint[]>([]);
  const [history, setHistory] = useState<SkillHistory[]>([]);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    gsap.killTweensOf(".page-content");
    gsap.fromTo(
      ".page-content",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
    return () => gsap.killTweensOf(".page-content");
  }, []);

  useGSAP(
    () => {
      if (loading) return;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      gsap.killTweensOf(".skill-bar-fill");
      gsap.set(".skill-bar-fill", { width: "0%" });
      gsap.registerPlugin(ScrollTrigger);

      gsap.fromTo(
        ".skill-bar-fill",
        { width: "0%" },
        {
          width: (i, el) => `${(el as HTMLElement).dataset.score ?? "0"}%`,
          duration: 0.55,
          stagger: 0.06,
          ease: "power3.out",
          delay: 0.1,
          scrollTrigger: {
            trigger: ".skills-container",
            start: "top 80%",
            once: true
          }
        }
      );

      return () => gsap.killTweensOf(".skill-bar-fill");
    },
    { dependencies: [loading] }
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sk, hist] = await Promise.all([
        api.get<{ skills: SkillPoint[] }>("/skills"),
        api.get<{ concepts: SkillHistory[] }>("/skills/history")
      ]);
      setSkills(sk.data.skills);
      setHistory(hist.data.concepts);
    } catch {
      setError("Failed to load skill profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ranked = useMemo(() => [...skills].sort((a, b) => a.score - b.score), [skills]);
  const ordered = useMemo(() => orderSkillScores(skills), [skills]);

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

  return (
    <div className="page-content space-y-6 skills-container">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-medium tracking-[-1.5px]">Skill profile</h1>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Updated today
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <article className="glass-panel rounded-[14px] p-6 lg:col-span-5">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">Where your skills go</h2>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
            Segment size reflects relative weight in the ring
          </p>
          <div className="mt-5">
            <SkillsDonut skills={ordered} />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-8 border-t border-white/6 pt-6">
            {ordered.map((s, i) => (
              <div key={s.concept} className="flex min-w-0 items-center gap-3 py-2 text-[13px]">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: SKILL_PIPE_COLORS[i % SKILL_PIPE_COLORS.length] }}
                />
                <span className="truncate" style={{ color: "rgba(255,255,255,0.88)" }}>
                  {s.concept}
                </span>
                <span className="ml-auto shrink-0 tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {s.score}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-panel rounded-[14px] p-5 lg:col-span-7">
          <h2 className="text-[18px] font-medium tracking-[-0.3px]">Ranked concepts</h2>
          <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
            Weakest first — where to focus next
          </p>
          <div className="mt-5 space-y-4">
            {ranked.map((s) => (
              <SkillBar key={s.concept} concept={s.concept} score={s.score} />
            ))}
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-[14px] p-5">
        <h2 className="text-[18px] font-medium tracking-[-0.3px]">Growth timeline</h2>
        <div className="mt-4 h-[min(320px,42vh)] min-h-[240px]">
          <SkillsTimeline history={history} />
        </div>
      </section>
    </div>
  );
}
