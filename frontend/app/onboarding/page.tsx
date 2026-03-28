"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SkillsRadar } from "@/components/charts/SkillsRadar";
import { ErrorState, InlineSpinner, LoadingCards } from "@/components/ui/States";
import { api } from "@/lib/axios";
import type { SkillPoint } from "@/lib/types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [sessionToken, setSessionToken] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [statusText, setStatusText] = useState("Waiting to start sync...");
  const [skills, setSkills] = useState<SkillPoint[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const token = localStorage.getItem("erforge_jwt");
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
    setStatusText("Sync started. Fetching your submissions...");
    setProgress(12);
    const progressTicker = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8 + 3);
        return Math.min(next, 92);
      });
    }, 900);

    const poll = setInterval(async () => {
      try {
        const r = await api.get<{ status: string; lastSyncedAt: string | null; errorMessage: string | null }>("/sync/status");
        if (r.data.status === "in_progress") {
          setStatusText("Analyzing submissions and generating your profile...");
          return;
        }
        if (r.data.status === "failed") {
          clearInterval(poll);
          clearInterval(progressTicker);
          setError(r.data.errorMessage ?? "Sync failed.");
          return;
        }
        if (r.data.status === "complete") {
          clearInterval(poll);
          clearInterval(progressTicker);
          setProgress(100);
          await loadProfile();
          setStep(3);
        }
      } catch {
        clearInterval(poll);
        clearInterval(progressTicker);
        setError("Failed to poll sync status.");
      }
    }, 2000);

    api.post("/sync").catch(() => {
      clearInterval(poll);
      clearInterval(progressTicker);
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

  return (
    <main className="page-content mx-auto flex min-h-screen w-full max-w-[920px] items-center px-6 py-16">
      <section className="w-full rounded-xl p-8" style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}>
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
            <p className="mt-3 text-[15px]" style={{ color: "var(--text-secondary)" }}>
              {statusText}
            </p>
            <div className="mt-8 h-[3px] w-full overflow-hidden rounded" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded transition-[width] duration-500"
                style={{ width: `${progress}%`, background: "var(--green)" }}
              />
            </div>
            <p className="mt-3 text-[12px] tabular-nums" style={{ color: "var(--text-muted)" }}>
              {progress}%
            </p>
            <div className="mt-6">
              <InlineSpinner label="Processing..." />
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
