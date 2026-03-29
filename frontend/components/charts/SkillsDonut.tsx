"use client";

import { useMemo } from "react";
import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

/** Green-forward palette (Er. Forge accent + teal/emerald steps) — shared with skills legend */
export const SKILL_PIPE_COLORS = [
  "#3ECF8E",
  "#2dd4a8",
  "#22c997",
  "#5eedb8",
  "#1abf88",
  "#7ef5cc",
  "#18a878",
  "#8ef9d4",
  "#15996c",
  "#9efce0",
  "#0f8f62",
  "#b1ffe8"
];

type Skill = { concept: string; score: number };

export function SkillsDonut({ skills }: { skills: Skill[] }) {
  const { labels, data, colors, overall } = useMemo(() => {
    const labels = skills.map((s) => s.concept);
    const data = skills.map((s) => Math.max(s.score, 2));
    const colors = skills.map((_, i) => SKILL_PIPE_COLORS[i % SKILL_PIPE_COLORS.length]);
    const overall =
      skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length) : 0;
    return { labels, data, colors, overall };
  }, [skills]);

  if (skills.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-[13px]" style={{ color: "var(--text-muted)" }}>
        No skill data yet
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="relative h-[300px] w-full md:h-[340px]">
        <Doughnut
          data={{
            labels,
            datasets: [
              {
                data,
                backgroundColor: colors,
                borderColor: "rgba(5,5,5,0.92)",
                borderWidth: 3,
                hoverOffset: 8,
                spacing: 1
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "66%",
            animation: {
              animateRotate: true,
              duration: 650,
              easing: "easeOutQuart"
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "rgba(12,12,12,0.92)",
                borderColor: "rgba(62,207,142,0.25)",
                borderWidth: 1,
                titleColor: "rgba(255,255,255,0.9)",
                bodyColor: "rgba(255,255,255,0.65)",
                padding: 10,
                callbacks: {
                  label(ctx) {
                    const i = ctx.dataIndex;
                    const s = skills[i];
                    return s ? ` ${s.concept}: ${s.score}` : "";
                  }
                }
              }
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Overall
          </p>
          <p className="text-[clamp(28px,7vw,40px)] font-medium tabular-nums tracking-[-1px]" style={{ color: "#3ECF8E" }}>
            {overall}
          </p>
        </div>
      </div>
    </div>
  );
}
