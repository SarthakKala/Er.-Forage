"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { api } from "@/lib/axios";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import type { User } from "@/lib/types";

type Connection = {
  id: string;
  platform: string;
  connected_at: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, cons] = await Promise.all([
        api.get<{ user: User }>("/auth/me"),
        api.get<{ connections: Connection[] }>("/connections")
      ]);
      setUser(me.data.user);
      setConnections(cons.data.connections ?? []);
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    gsap.killTweensOf(".page-content");
    gsap.fromTo(".page-content", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    return () => gsap.killTweensOf(".page-content");
  }, []);

  async function disconnect(id: string) {
    await api.delete(`/connections/${id}`);
    await load();
  }

  async function signOut() {
    localStorage.removeItem("erforge_jwt");
    router.replace("/login");
  }

  async function deleteAccount() {
    await api.delete("/auth/me");
    localStorage.removeItem("erforge_jwt");
    router.replace("/login");
  }

  if (loading)
    return (
      <div className="page-content">
        <LoadingCards count={3} />
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  return (
    <div className="page-content space-y-6">
      <h1 className="text-[32px] font-medium tracking-[-1.5px]">Settings</h1>

      <section
        className="rounded-xl p-5"
        style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
      >
        <h2 className="text-[18px] font-medium tracking-[-0.3px]">Account</h2>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-[44px] w-[44px] overflow-hidden rounded-full"
              style={{ border: "0.5px solid var(--bg-border)", background: "var(--bg-base)" }}
            >
              <Image
                src={user?.avatar_url || "/vercel.svg"}
                alt={user?.name ?? "Avatar"}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-[15px]">{user?.name}</p>
              <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {user?.email}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
                Managed by Google OAuth (read-only).
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="rounded-[8px] px-4 py-2 text-[13px]"
            style={{
              border: "0.5px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.02)",
              color: "rgba(255,255,255,0.8)"
            }}
          >
            Sign out
          </button>
        </div>
      </section>

      <section
        className="rounded-xl p-5"
        style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
      >
        <h2 className="text-[18px] font-medium tracking-[-0.3px]">Connections</h2>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Platforms you’ve linked for syncing submissions.
        </p>

        <div className="mt-4 space-y-3">
          {connections.length === 0 ? (
            <div
              className="rounded-[10px] px-4 py-4"
              style={{ background: "var(--bg-base)", border: "0.5px solid var(--bg-border)" }}
            >
              <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                No connections yet
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                Connect LeetCode to start syncing submissions and generating assignments.
              </p>
              <button
                onClick={() => router.push("/onboarding")}
                className="mt-4 rounded-[10px] px-4 py-2 text-[13px] font-medium"
                style={{ background: "#3ECF8E", color: "#050505" }}
              >
                Connect LeetCode
              </button>
            </div>
          ) : (
            connections.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] px-4 py-4"
                style={{ background: "var(--bg-base)", border: "0.5px solid var(--bg-border)" }}
              >
                <div>
                  <p className="text-[14px] capitalize" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {c.platform}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
                    Username: <span style={{ color: "rgba(255,255,255,0.55)" }}>Connected</span>
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    Connected {new Date(c.connected_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => disconnect(c.id)}
                  className="rounded-[10px] px-3 py-2 text-[12px]"
                  style={{ border: "0.5px solid rgba(239,68,68,0.35)", color: "rgba(239,68,68,0.9)" }}
                >
                  Disconnect
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section
        className="rounded-xl p-5"
        style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
      >
        <h2 className="text-[18px] font-medium tracking-[-0.3px]">Data</h2>
        <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          Manage exports and account deletion.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button
            onClick={() => alert("Export is coming soon.")}
            className="rounded-[10px] px-4 py-3 text-left"
            style={{ background: "var(--bg-base)", border: "0.5px solid var(--bg-border)" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
              Export my data
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
              Download submissions, scores, and reports.
            </p>
          </button>

          <button
            onClick={() => {
              setDeleteConfirm("");
              setDeleteOpen(true);
            }}
            className="rounded-[10px] px-4 py-3 text-left"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "0.5px solid rgba(239,68,68,0.25)"
            }}
          >
            <p className="text-[13px] font-medium" style={{ color: "rgba(239,68,68,0.95)" }}>
              Delete account
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Permanently removes your data from Er. Forge.
            </p>
          </button>
        </div>
      </section>

      {deleteOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-[520px] rounded-xl p-5"
            style={{ background: "#0f0f0f", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            <h3 className="text-[18px] font-medium tracking-[-0.3px]">Delete account</h3>
            <p className="mt-2 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              This is permanent. Type <span style={{ color: "rgba(255,255,255,0.9)" }}>DELETE</span>{" "}
              to confirm.
            </p>

            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mt-4 w-full rounded-[10px] px-3 py-2 text-[13px] outline-none"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)"
              }}
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="rounded-[10px] px-4 py-2 text-[13px]"
                style={{
                  border: "0.5px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.8)"
                }}
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirm.trim().toUpperCase() !== "DELETE"}
                onClick={async () => {
                  try {
                    await deleteAccount();
                  } catch {
                    alert("Failed to delete account.");
                  }
                }}
                className="rounded-[10px] px-4 py-2 text-[13px] font-medium disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.95)", color: "#050505" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

