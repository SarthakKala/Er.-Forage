import Link from "next/link";
import { notFound } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://localhost:4000/api/v1";

type SnapshotPayload = {
  user: { id: string; name: string; email: string };
  generatedAt: string;
  skillScores: Array<{ concept: string; score: number; last_updated: string | null }>;
  skillHistory: Array<{
    concept: string;
    snapshots: Array<{ score: number; recorded_at: string }>;
  }>;
  stats: {
    totalSubmissions: number;
    problemsSolved: number;
    completedAssignments: number;
    weeksActive: number;
  };
};

type PublicReportApi = {
  snapshot_data: SnapshotPayload;
  created_at: string;
};

function barTone(score: number): { fill: string; track: string } {
  if (score < 40) {
    return { fill: "rgba(239,68,68,0.75)", track: "rgba(255,255,255,0.06)" };
  }
  if (score < 60) {
    return { fill: "rgba(251,191,36,0.75)", track: "rgba(255,255,255,0.06)" };
  }
  return { fill: "#3ECF8E", track: "rgba(255,255,255,0.06)" };
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

async function fetchReport(token: string): Promise<PublicReportApi | null> {
  const res = await fetch(`${API_BASE}/public/report/${token}`, {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Report request failed (${res.status})`);
  }

  return (await res.json()) as PublicReportApi;
}

function buildTimelineRows(
  history: SnapshotPayload["skillHistory"],
  maxRows = 48
): Array<{ recorded_at: string; concept: string; score: number }> {
  const rows = history.flatMap((h) =>
    h.snapshots.map((s) => ({
      recorded_at: s.recorded_at,
      concept: h.concept,
      score: s.score
    }))
  );
  rows.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  return rows.slice(-maxRows);
}

export default async function PublicGrowthReportPage({
  params
}: {
  params: { token: string };
}) {
  const { token } = params;
  const data = await fetchReport(token);

  if (!data) {
    notFound();
  }

  const snap = data.snapshot_data as SnapshotPayload;
  const timelineRows = buildTimelineRows(snap.skillHistory ?? []);
  const hasTimeline = timelineRows.length > 0;
  const overall =
    snap.skillScores && snap.skillScores.length > 0
      ? Math.round(snap.skillScores.reduce((a, b) => a + (b.score ?? 0), 0) / snap.skillScores.length)
      : 0;

  return (
    <div
      className="min-h-screen"
      style={{ background: "#050505", color: "rgba(255,255,255,0.9)" }}
    >
      <div className="mx-auto max-w-[880px] px-6 py-12 md:px-10 md:py-16">
        <p
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.85)" }}>Er</span>
          <span style={{ color: "#3ECF8E" }}>.</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>Forge</span>
        </p>

        <h1
          className="mt-8 font-medium leading-[1.05] tracking-[-1.5px]"
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            color: "rgba(255,255,255,0.9)"
          }}
        >
          {snap.user?.name ?? "Engineer"}
          <span className="block mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            Engineering Growth Report
          </span>
        </h1>

        <p className="mt-6 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          Generated {formatShortDate(data.created_at ?? snap.generatedAt)}
        </p>

        <section className="mt-10 grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div
            className="rounded-xl p-6"
            style={{
              background: "#0f0f0f",
              border: "0.5px solid rgba(255,255,255,0.06)"
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Overall score
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p
                className="font-medium tabular-nums tracking-[-1.2px]"
                style={{ fontSize: "clamp(40px, 5vw, 64px)", color: "#3ECF8E" }}
              >
                {overall}
              </p>
              <div className="text-right">
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {snap.stats?.weeksActive ?? 0} weeks active
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {snap.stats?.problemsSolved ?? 0} problems solved
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              A recruiter-ready snapshot of real, tracked improvement — not a one-off score.
            </p>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "#0f0f0f",
              border: "0.5px solid rgba(255,255,255,0.06)"
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Summary
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Submissions
                </p>
                <p className="mt-1 text-[18px] font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {snap.stats?.totalSubmissions ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Assignments completed
                </p>
                <p className="mt-1 text-[18px] font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {snap.stats?.completedAssignments ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Strong areas show consistency; weak areas show measurable momentum.
            </p>
          </div>
        </section>

        <section
          className="mt-8 rounded-xl p-6 md:p-7"
          style={{
            background: "#0f0f0f",
            border: "0.5px solid rgba(255,255,255,0.06)"
          }}
        >
          <h2
            className="text-[18px] font-medium tracking-[-0.3px]"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Skill scores
          </h2>
          <ul className="mt-6 space-y-5">
            {(snap.skillScores ?? []).map((row) => {
              const { fill, track } = barTone(row.score);
              return (
                <li key={row.concept}>
                  <div className="flex items-baseline justify-between gap-4 text-[13px]">
                    <span style={{ color: "rgba(255,255,255,0.9)" }}>{row.concept}</span>
                    <span
                      className="tabular-nums"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {row.score}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-[7px] overflow-hidden rounded-md"
                    style={{ background: track }}
                  >
                    <div
                      className="h-full rounded-md transition-[width] duration-[800ms] ease-out"
                      style={{ width: `${row.score}%`, background: fill }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {hasTimeline ? (
          <section
            className="mt-8 rounded-xl p-5 md:p-6"
            style={{
              background: "#0f0f0f",
              border: "0.5px solid rgba(255,255,255,0.06)"
            }}
          >
            <h2
              className="text-[18px] font-medium tracking-[-0.3px]"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Growth timeline
            </h2>
            <p className="mt-2 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Snapshots from your tracked history (most recent first).
            </p>
            <ul
              className="mt-6 border-t text-[13px]"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {[...timelineRows].reverse().map((row, i) => (
                <li
                  key={`${row.recorded_at}-${row.concept}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                  style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {formatShortDate(row.recorded_at)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>{row.concept}</span>
                  <span
                    className="tabular-nums font-medium"
                    style={{ color: "#3ECF8E" }}
                  >
                    {row.score}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{
              background: "#0f0f0f",
              border: "0.5px solid rgba(255,255,255,0.06)"
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Submissions
            </p>
            <p
              className="mt-2 text-[28px] font-medium tabular-nums tracking-[-0.8px]"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {snap.stats?.totalSubmissions ?? 0}
            </p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: "#0f0f0f",
              border: "0.5px solid rgba(255,255,255,0.06)"
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Problems solved
            </p>
            <p
              className="mt-2 text-[28px] font-medium tabular-nums tracking-[-0.8px]"
              style={{ color: "#3ECF8E" }}
            >
              {snap.stats?.problemsSolved ?? 0}
            </p>
          </div>
        </section>

        <footer
          className="mt-16 pt-8"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}
        >
          <Link
            href="/"
            className="text-[13px] transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Built with Er<span style={{ color: "#3ECF8E" }}>.</span>Forge
          </Link>
        </footer>
      </div>
    </div>
  );
}
