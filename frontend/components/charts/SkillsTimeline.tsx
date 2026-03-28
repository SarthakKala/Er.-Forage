"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { SkillHistory } from "@/lib/types";
import { scoreTone } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function SkillsTimeline({ history }: { history: SkillHistory[] }) {
  const labels = Array.from(
    new Set(
      history.flatMap((h) =>
        h.snapshots.map((s) =>
          new Date(s.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        )
      )
    )
  );

  return (
    <Line
      data={{
        labels,
        datasets: history
          .filter((h) => h.snapshots.length > 0)
          .slice(0, 6)
          .map((h) => ({
            label: h.concept,
            data: h.snapshots.map((s) => s.score),
            borderColor: scoreTone(h.snapshots[h.snapshots.length - 1]?.score ?? 50),
            pointRadius: 2,
            borderWidth: 2,
            tension: 0.35
          }))
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "rgba(255,255,255,0.5)" } }
        },
        scales: {
          x: { ticks: { color: "rgba(255,255,255,0.45)" }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: {
            min: 0,
            max: 100,
            ticks: { color: "rgba(255,255,255,0.45)" },
            grid: { color: "rgba(255,255,255,0.06)" }
          }
        }
      }}
    />
  );
}
