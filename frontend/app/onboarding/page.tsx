"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SkillsRadar } from "@/components/charts/SkillsRadar";
import { ErrorState, InlineSpinner, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import { AUTH_LS_KEY } from "@/lib/auth-storage";
import type { SkillPoint } from "@/lib/types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type Step = 1 | 2 | 3;

/** Rotating copy while sync runs — avoids a “frozen” feel when the bar nears completion */
const SYNC_MESSAGES = [
  "Pulling your latest submissions from LeetCode…",
  "Normalizing problems, languages, and outcomes…",
  "Spotting patterns in how you approach each topic…",
  "Scoring concepts against the full taxonomy…",
  "Running AI pass on code and explanations…",
  "Stitching history into your live skill profile…",
  "Polishing aggregates — almost ready to unlock…"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [sessionToken, setSessionToken] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [syncMessageIndex, setSyncMessageIndex] = useState(0);
  const [skills, setSkills] = useState<SkillPoint[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(8);
  const pollRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);

  function clearSyncIntervals() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    pollRef.current = null;
    tickerRef.current = null;
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_LS_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .get<{ submissions: unknown[] }>("/submissions?page=1&pageSize=1")
      .then((r) => {
        if ((r.data.submissions?.length ?? 0) > 0) router.replace("/dashboard");
      })
      .catch(() => null);
  }, [router]);

  useEffect(() => {
    return () => clearSyncIntervals();
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    setSyncMessageIndex(0);
    const id = window.setInterval(() => {
      setSyncMessageIndex((i) => (i + 1) % SYNC_MESSAGES.length);
    }, 2400);
    return () => clearInterval(id);
  }, [step]);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    gsap.killTweensOf(".page-content");
    gsap.fromTo(".page-content", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    return () => gsap.killTweensOf(".page-content");
  }, []);

  async function connectLeetCode() {
    setError(null);
    if (!sessionToken || !csrfToken) {
      setError("Both sessionToken and csrfToken are required.");
      return;
    }
    try {
      await api.post("/connections", { platform: "leetcode", sessionToken, csrfToken });
      setStep(2);
      await runSyncFlow();
    } catch (e) {
      setError("Failed to connect LeetCode. Verify tokens from browser cookies.");
    }
  }

  async function runSyncFlow() {
    clearSyncIntervals();
    setProgress(12);
    /**
     * Progress is intentionally decoupled from wall time: fast ramp to ~82%, then slow creep toward ~99%
     * while the backend works, so the bar never “dies” at 92% like a hard cap.
     */
    tickerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const p = prev;
        if (p >= 99) return Math.min(p + Math.random() * 0.06, 99.6);
        if (p >= 82) return Math.min(p + (Math.random() * 0.85 + 0.12) * (1 + (98 - p) * 0.04), 99.2);
        const bump = Math.random() * 7 + 3;
        return Math.min(p + bump, 82);
      });
    }, 650);

    pollRef.current = window.setInterval(async () => {
      try {
        const r = await api.get<{ status: string; lastSyncedAt: string | null; errorMessage: string | null }>("/sync/status");
        if (r.data.status === "in_progress") {
          return;
        }
        if (r.data.status === "failed") {
          clearSyncIntervals();
          setError(r.data.errorMessage ?? "Sync failed.");
          return;
        }
        if (r.data.status === "complete") {
          clearSyncIntervals();
          setProgress(100);
          await loadProfile();
          setStep(3);
        }
      } catch {
        clearSyncIntervals();
        setError("Failed to poll sync status.");
      }
    }, 2000);

    api.post("/sync").catch(() => {
      clearSyncIntervals();
      setError("Sync failed.");
    });
  }

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const r = await api.get<{ skills: SkillPoint[] }>("/skills");
      setSkills(r.data.skills);
    } finally {
      setLoadingProfile(false);
    }
  }

  const topGaps = useMemo(
    () => [...skills].sort((a, b) => a.score - b.score).slice(0, 3),
    [skills]
  );

  const progressLabel =
    progress >= 100 ? "100" : progress >= 99 ? progress.toFixed(1) : String(Math.round(Math.min(progress, 99.9)));

  return (
    <main className="relative page-content mx-auto flex min-h-screen w-full max-w-[920px] items-center px-6 py-16">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(62,207,142,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(62,207,142,0.06), transparent 50%), #050505"
        }}
      />
      <section className="glass-panel w-full rounded-[14px] p-8">
        <div className="mb-8 flex gap-3">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="h-2 w-2 rounded-full"
              style={{ background: step >= n ? "var(--green)" : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>

        {step === 1 ? (
          <div>
            <h1 className="text-[42px] font-medium tracking-[-1.5px]">Connect your LeetCode account</h1>
            <p className="mt-3 text-[15px]" style={{ color: "var(--text-secondary)" }}>
              Open LeetCode in your browser, inspect cookies, then copy values for <code>LEETCODE_SESSION</code> and <code>csrftoken</code>.
            </p>
            <div className="mt-8 space-y-4">
              <label className="block text-[13px]">
                <span style={{ color: "var(--text-secondary)" }}>Session token (LEETCODE_SESSION)</span>
                <input
                  value={sessionToken}
                  onChange={(e) => setSessionToken(e.target.value)}
                  className="mt-2 w-full rounded-[8px] px-3 py-2 text-[14px]"
                  style={{ background: "var(--bg-base)", border: "0.5px solid rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
                />
              </label>
              <label className="block text-[13px]">
                <span style={{ color: "var(--text-secondary)" }}>CSRF token (csrftoken)</span>
                <input
                  value={csrfToken}
                  onChange={(e) => setCsrfToken(e.target.value)}
                  className="mt-2 w-full rounded-[8px] px-3 py-2 text-[14px]"
                  style={{ background: "var(--bg-base)", border: "0.5px solid rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
                />
              </label>
            </div>
            <button
              onClick={connectLeetCode}
              className="mt-8 rounded-[8px] px-6 py-2 text-[13px] font-medium"
              style={{ background: "var(--green)", color: "#050505" }}
            >
              Connect & sync
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h1 className="text-[42px] font-medium tracking-[-1.5px]">Syncing your history</h1>
            <p
              key={syncMessageIndex}
              className="mt-4 min-h-[3rem] text-[15px] leading-relaxed transition-opacity duration-300"
              style={{ color: "var(--text-secondary)" }}
            >
              {SYNC_MESSAGES[syncMessageIndex]}
            </p>
            <div
              className="mt-8 h-[4px] w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: "linear-gradient(90deg, #2bbf7a 0%, #3ECF8E 45%, #6ef0b8 100%)",
                  boxShadow: "0 0 18px rgba(62,207,142,0.38)"
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-[12px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                {progressLabel}%
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Large histories can take a minute — the bar keeps moving until we&apos;re done.
              </p>
            </div>
            <div className="mt-6">
              <InlineSpinner label="Working…" />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="text-[42px] font-medium tracking-[-1.5px]">Your profile is ready</h1>
            {loadingProfile ? (
              <div className="mt-6">
                <LoadingCards count={2} />
              </div>
            ) : (
              <>
                <div className="mt-6 h-[360px] rounded-xl p-4" style={{ background: "var(--bg-base)", border: "0.5px solid var(--bg-border)" }}>
                  <SkillsRadar labels={skills.map((s) => s.concept)} values={skills.map((s) => s.score)} />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {topGaps.map((g) => (
                    <span
                      key={g.concept}
                      className="rounded px-2 py-1 text-[11px]"
                      style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.9)" }}
                    >
                      {g.concept}
                    </span>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-8 rounded-[8px] px-6 py-2 text-[13px] font-medium"
              style={{ background: "var(--green)", color: "#050505" }}
            >
              Go to dashboard
            </button>
          </div>
        ) : null}

        {error ? <div className="mt-8"><ErrorState message={error} onRetry={() => setError(null)} /></div> : null}
      </section>
    </main>
  );
}
