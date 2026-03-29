"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, API_BASE } from "@/lib/axios";
import { clearSessionToken, safeRedirectPath, setSessionToken } from "@/lib/auth-storage";
import type { User } from "@/lib/types";
import { InlineSpinner } from "@/components/ui/States";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const NOISE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/></svg>`
);

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [googleAuthHref, setGoogleAuthHref] = useState(`${API_BASE}/auth/google`);

  const tokenFromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("token");
  }, []);
  const oauthError = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  }, []);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("redirect");
    setGoogleAuthHref(
      r ? `${API_BASE}/auth/google?redirect=${encodeURIComponent(r)}` : `${API_BASE}/auth/google`
    );
  }, []);

  useEffect(() => {
    if (!tokenFromUrl) return;
    const params = new URLSearchParams(window.location.search);
    const redirectRaw = params.get("redirect");
    setSessionToken(tokenFromUrl);
    window.history.replaceState({}, "", "/login");
    setStatus("Signed in. Loading your workspace...");
    setChecking(true);
    Promise.all([
      api.get<{ user: User }>("/auth/me"),
      api.get<{ submissions: unknown[] }>("/submissions?page=1&pageSize=1")
    ])
      .then(([, subs]) => {
        const hasHistory = (subs.data.submissions?.length ?? 0) > 0;
        const fallback = hasHistory ? "/dashboard" : "/onboarding";
        router.replace(safeRedirectPath(redirectRaw, fallback));
      })
      .catch(() => {
        clearSessionToken();
        setStatus("Session error. Please sign in again.");
      })
      .finally(() => setChecking(false));
  }, [tokenFromUrl, router]);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    gsap.killTweensOf(".page-content");
    gsap.fromTo(".page-content", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    return () => gsap.killTweensOf(".page-content");
  }, []);

  useEffect(() => {
    if (tokenFromUrl) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("erforge_jwt") : null;
    if (!token) return;
    setChecking(true);
    const redirectRaw = new URLSearchParams(window.location.search).get("redirect");
    Promise.all([
      api.get<{ user: User }>("/auth/me"),
      api.get<{ submissions: unknown[] }>("/submissions?page=1&pageSize=1")
    ])
      .then(([, subs]) => {
        const hasHistory = (subs.data.submissions?.length ?? 0) > 0;
        const fallback = hasHistory ? "/dashboard" : "/onboarding";
        router.replace(safeRedirectPath(redirectRaw, fallback));
      })
      .catch(() => {
        clearSessionToken();
        setStatus("Session expired. Please sign in again.");
      })
      .finally(() => setChecking(false));
  }, [router, tokenFromUrl]);

  return (
    <main className="page-content relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Base + vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 100%, #0a120e 0%, #030403 45%, #020202 100%)"
          }}
        />
        {/* Primary aurora — top left */}
        <div
          className="login-aurora-a absolute -left-[30%] -top-[35%] h-[min(720px,95vw)] w-[min(720px,95vw)] rounded-full blur-[100px] md:blur-[120px]"
          style={{
            background: "radial-gradient(circle closest-side, rgba(62,207,142,0.42) 0%, rgba(62,207,142,0.12) 42%, transparent 72%)"
          }}
        />
        {/* Secondary pool — bottom right */}
        <div
          className="login-aurora-b absolute -bottom-[28%] -right-[22%] h-[min(640px,90vw)] w-[min(640px,90vw)] rounded-full blur-[90px] md:blur-[110px]"
          style={{
            background:
              "radial-gradient(circle closest-side, rgba(34,160,110,0.35) 0%, rgba(62,207,142,0.08) 45%, transparent 70%)"
          }}
        />
        {/* Center lift */}
        <div
          className="absolute left-1/2 top-[38%] h-[min(520px,70vh)] w-[min(900px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(62,207,142,0.14) 0%, transparent 62%)"
          }}
        />
        {/* Diagonal mesh accent */}
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "linear-gradient(115deg, transparent 0%, rgba(62,207,142,0.07) 38%, transparent 55%, rgba(62,207,142,0.04) 78%, transparent 100%)"
          }}
        />
        {/* Soft horizon band */}
        <div
          className="absolute inset-x-0 top-[55%] h-[45%]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(62,207,142,0.045) 40%, transparent)"
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(ellipse 90% 75% at 50% 42%, black 8%, rgba(0,0,0,0.55) 55%, transparent 88%)"
          }}
        />
        {/* Conic “ring” glow */}
        <div
          className="absolute left-1/2 top-1/2 h-[min(140vw,900px)] w-[min(140vw,900px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.22]"
          style={{
            background: `conic-gradient(from 210deg at 50% 50%, transparent 0deg, rgba(62,207,142,0.35) 52deg, transparent 110deg, rgba(62,207,142,0.15) 200deg, transparent 280deg)`,
            filter: "blur(38px)"
          }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,${NOISE_SVG}")`, backgroundRepeat: "repeat" }}
        />
        {/* Bottom edge fade for depth */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <section className="relative z-10 w-full max-w-[560px] text-center">
        <p
          className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em]"
          style={{ color: "rgba(62,207,142,0.85)" }}
        >
          Er.Forge
        </p>
        <h1
          className="font-medium leading-[1.02] tracking-[-2.5px]"
          style={{ fontSize: "clamp(40px, 7vw, 76px)", color: "var(--text-primary)" }}
        >
          Proof beats practice.
        </h1>

        <p className="mx-auto mt-6 max-w-[440px] text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Sign in once. We sync your LeetCode story, run AI on every solve, and map real skills — so your next move is
          data-backed, not guessed.
        </p>

        <a
          href={googleAuthHref}
          className="glass-panel mx-auto mt-10 inline-flex w-full max-w-[360px] items-center justify-center rounded-full px-6 py-3.5 text-[14px] font-medium shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(62,207,142,0.15)]"
          style={{ background: "rgba(255,255,255,0.96)", color: "#050505" }}
        >
          Continue with Google
        </a>

        <p className="mt-5 text-[13px]" style={{ color: "var(--text-muted)" }}>
          New here? One click — we&apos;ll route you to connect LeetCode.
        </p>

        {oauthError ? (
          <p className="mt-6 text-[13px]" style={{ color: "var(--red)" }}>
            OAuth failed: {oauthError}
          </p>
        ) : null}
        {status ? (
          <p className="mt-6 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {status}
          </p>
        ) : null}
        {checking ? (
          <div className="mt-4 flex justify-center">
            <InlineSpinner label="Checking account..." />
          </div>
        ) : null}
      </section>
    </main>
  );
}
