"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, API_BASE } from "@/lib/axios";
import type { User } from "@/lib/types";
import { InlineSpinner } from "@/components/ui/States";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const tokenFromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("token");
  }, []);
  const oauthError = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  }, []);

  useEffect(() => {
    if (!tokenFromUrl) return;
    localStorage.setItem("erforge_jwt", tokenFromUrl);
    window.history.replaceState({}, "", "/login");
    setStatus("Signed in. Loading your workspace...");
  }, [tokenFromUrl]);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    gsap.killTweensOf(".page-content");
    gsap.fromTo(".page-content", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    return () => gsap.killTweensOf(".page-content");
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("erforge_jwt") : null;
    if (!token) return;
    setChecking(true);
    Promise.all([
      api.get<{ user: User }>("/auth/me"),
      api.get<{ submissions: unknown[] }>("/submissions?page=1&pageSize=1")
    ])
      .then(([, subs]) => {
        const hasHistory = (subs.data.submissions?.length ?? 0) > 0;
        router.replace(hasHistory ? "/dashboard" : "/onboarding");
      })
      .catch(() => {
        localStorage.removeItem("erforge_jwt");
        setStatus("Session expired. Please sign in again.");
      })
      .finally(() => setChecking(false));
  }, [router, tokenFromUrl]);

  return (
    <main className="page-content flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-[560px] text-center">
        <h1
          className="font-medium leading-[1.05] tracking-[-3px]"
          style={{ fontSize: "clamp(56px, 8vw, 96px)", color: "var(--text-primary)" }}
        >
          Build the engineering career you can prove.
        </h1>

        <p className="mx-auto mt-6 max-w-[460px] text-[15px]" style={{ color: "var(--text-secondary)" }}>
          No password. No setup. Just connect LeetCode and go.
        </p>

        <a
          href={`${API_BASE}/auth/google`}
          className="mx-auto mt-10 inline-flex w-full max-w-[360px] items-center justify-center rounded-[8px] px-6 py-3 text-[13px] font-medium"
          style={{ background: "#ffffff", color: "#050505" }}
        >
          Continue with Google
        </a>

        <p className="mt-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Already have an account? Sign in
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
