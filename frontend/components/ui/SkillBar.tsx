import { scoreTone } from "@/lib/utils";

export function SkillBar({ concept, score }: { concept: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span style={{ color: "var(--text-primary)" }}>{concept}</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {score}%
        </span>
      </div>
      <div className="mt-2 h-[3px] overflow-hidden rounded-[2px]" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-[2px] skill-bar-fill"
          data-score={score}
          style={{ width: `${score}%`, background: scoreTone(score) }}
        />
      </div>
    </div>
  );
}
