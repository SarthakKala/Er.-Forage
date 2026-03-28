"use client";

import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function SkillsRadar({ labels, values }: { labels: string[]; values: number[] }) {
  return (
    <Radar
      data={{
        labels,
        datasets: [
          {
            label: "Skill score",
            data: values,
            borderColor: "#3ECF8E",
            backgroundColor: "rgba(62,207,142,0.18)",
            pointBackgroundColor: "#3ECF8E",
            pointBorderColor: "#3ECF8E"
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 550,
          easing: "easeInOutQuart"
        },
        plugins: {
          legend: { display: false }
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { color: "rgba(255,255,255,0.35)", backdropColor: "transparent" },
            grid: { color: "rgba(255,255,255,0.08)" },
            pointLabels: { color: "rgba(255,255,255,0.6)", font: { size: 10 } }
          }
        }
      }}
    />
  );
}
