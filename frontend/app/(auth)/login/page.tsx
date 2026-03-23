"use client";

import { useEffect, useMemo, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    created_at: string;
  };
};

export default function LoginPage() {
  const [status, setStatus] = useState("Not authenticated");
  const [profile, setProfile] = useState<MeResponse["user"] | null>(null);

  const tokenFromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }, []);

  useEffect(() => {
    if (tokenFromUrl) {
      localStorage.setItem("erforge_jwt", tokenFromUrl);
      window.history.replaceState({}, "", "/login");
      setStatus("JWT received from Google OAuth callback.");
    }
  }, [tokenFromUrl]);

  async function fetchMe() {
    const token = localStorage.getItem("erforge_jwt");
    if (!token) {
      setStatus("No JWT found in localStorage.");
      return;
    }

    const response = await fetch(`${apiBase}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      setStatus("JWT invalid or expired.");
      return;
    }

    const data: MeResponse = await response.json();
    setProfile(data.user);
    setStatus("Authenticated. /auth/me returned your profile.");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="text-white/70 text-sm">
          Sign in with Google, receive a JWT, and verify profile via <code>/api/v1/auth/me</code>.
        </p>

        <a
          href={`${apiBase}/auth/google`}
          className="inline-flex w-full justify-center rounded-md bg-[#3ECF8E] px-4 py-2 font-semibold text-[#050505]"
        >
          Continue with Google
        </a>

        <button
          onClick={fetchMe}
          className="inline-flex w-full justify-center rounded-md border border-white/20 px-4 py-2"
        >
          Check /auth/me
        </button>

        <p className="text-sm text-white/70">{status}</p>

        {profile ? (
          <pre className="text-xs overflow-auto rounded-md bg-black/30 p-3">
            {JSON.stringify(profile, null, 2)}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
