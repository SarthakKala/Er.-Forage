"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/axios";
import type { User } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const nav = [
  {
    title: "WORKSPACE",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/submissions", label: "Submissions" },
      { href: "/skills", label: "Skills" }
    ]
  },
  {
    title: "GROWTH",
    items: [
      { href: "/assignments", label: "Assignments" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/portfolio", label: "Reports" }
    ]
  },
  {
    title: "ACCOUNT",
    items: [{ href: "/settings", label: "Settings" }]
  }
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; kind: "success" | "error"; message: string }>>([]);
  const shownToastIds = useRef<Set<string>>(new Set());
  const prevSyncing = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("erforge_jwt");
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .get<{ user: User }>("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => router.replace("/login"));

    api
      .get<{ lastSyncedAt: string | null }>("/sync/status")
      .then((r) => setLastSync(r.data.lastSyncedAt))
      .catch(() => null);
  }, [router]);

  function pushToast(kind: "success" | "error", message: string) {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = document.querySelector<HTMLElement>(`[data-toast-id="${id}"]`);
      if (el && !prefersReduced) {
        gsap.killTweensOf(el);
        gsap.to(el, {
          y: 20,
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => setToasts((prev) => prev.filter((t) => t.id !== id))
        });
      } else {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }
    }, 3200);
  }

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    if (!latest) return;
    if (shownToastIds.current.has(latest.id)) return;

    const el = document.querySelector<HTMLElement>(`[data-toast-id="${latest.id}"]`);
    if (!el) return;
    shownToastIds.current.add(latest.id);
    gsap.killTweensOf(el);
    gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
  }, [toasts.length]);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const btn = document.querySelector<HTMLElement>(".sync-btn");
    const spinner = document.querySelector<HTMLElement>(".sync-spinner");
    if (!btn || !spinner) return;

    const wasSyncing = prevSyncing.current;
    prevSyncing.current = syncing;

    gsap.killTweensOf(spinner);
    gsap.killTweensOf(btn);

    if (syncing) {
      gsap.fromTo(spinner, { rotation: 0 }, { rotation: 360, duration: 0.6, repeat: -1, ease: "none" });
    } else if (wasSyncing) {
      gsap.fromTo(
        btn,
        { scale: 1.15, borderColor: "var(--green)", color: "var(--green)" },
        { scale: 1, duration: 0.4, ease: "back.out", borderColor: "var(--bg-border)", color: "var(--text-secondary)" }
      );
    }
  }, [syncing]);

  useGSAP(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const items = Array.from(document.querySelectorAll<HTMLElement>(".nav-item"));
    const listeners: Array<{
      el: HTMLElement;
      enter: (e: Event) => void;
      leave: (e: Event) => void;
    }> = [];

    items.forEach((item) => {
      const border = item.querySelector<HTMLElement>(".nav-left-border");
      const active = item.dataset.active === "true";
      if (!border) return;

      if (active) {
        border.style.width = "4px";
        border.style.opacity = "1";
      } else {
        border.style.width = "0px";
        border.style.opacity = "0";
      }

      const enter = () => {
        gsap.to(border, { width: "4px", opacity: 1, duration: 0.2, ease: "power2.out" });
        gsap.to(item, { paddingLeft: 20, duration: 0.2, ease: "power2.out" });
      };
      const leave = () => {
        if (active) {
          gsap.to(border, { width: "4px", opacity: 1, duration: 0.2, ease: "power2.out" });
        } else {
          gsap.to(border, { width: "0px", opacity: 0, duration: 0.2, ease: "power2.out" });
        }
        gsap.to(item, { paddingLeft: 16, duration: 0.2, ease: "power2.out" });
      };

      item.addEventListener("mouseenter", enter);
      item.addEventListener("mouseleave", leave);
      listeners.push({ el: item, enter, leave });
    });

    return () => {
      listeners.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      gsap.killTweensOf(".nav-left-border");
      gsap.killTweensOf(".nav-item");
    };
  }, [pathname]);

  async function runSync() {
    setSyncing(true);
    try {
      const r = await api.post<{ lastSyncedAt: string }>("/sync");
      setLastSync(r.data.lastSyncedAt);
      pushToast("success", "Sync complete.");
    } finally {
      setSyncing(false);
    }
  }

  async function runSyncWithErrors() {
    setSyncing(true);
    try {
      const r = await api.post<{ lastSyncedAt: string }>("/sync");
      setLastSync(r.data.lastSyncedAt);
      pushToast("success", "Sync complete.");
    } catch {
      pushToast("error", "Sync failed. Try again.");
    } finally {
      setSyncing(false);
    }
  }

  const syncLabel = useMemo(() => {
    return lastSync ? `Synced ${formatRelativeTime(lastSync)}` : "Never synced";
  }, [lastSync]);

  return (
    <div className="min-h-screen bg-[#050505] text-[rgba(255,255,255,0.9)]">
      <header
        className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between px-5"
        style={{
          background: "rgba(5,5,5,0.9)",
          borderBottom: "0.5px solid var(--bg-border)",
          backdropFilter: "blur(12px)"
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[13px] font-medium"
            style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)", color: "var(--green)" }}
          >
            E
          </div>
          <div className="text-[18px] font-medium tracking-[-0.3px]">
            <span style={{ color: "rgba(255,255,255,0.9)" }}>Er</span>
            <span style={{ color: "var(--green)" }}>.</span>
            <span style={{ color: "rgba(255,255,255,0.9)" }}>Forge</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.08em]"
            style={{ background: "var(--green-dim)", color: "var(--green)", border: "0.5px solid var(--green-border)" }}
          >
            {syncLabel}
          </span>
          <button
            onClick={runSyncWithErrors}
            disabled={syncing}
            className="sync-btn rounded-[8px] px-3 py-1.5 text-[13px]"
            style={{
              border: "0.5px solid var(--bg-border)",
              color: "var(--text-secondary)",
              background: "transparent"
            }}
          >
            {syncing ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="sync-spinner"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderTopColor: "var(--green)"
                  }}
                />
                Sync now
              </span>
            ) : (
              "Sync now"
            )}
          </button>
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
              style={{ border: "0.5px solid var(--bg-border)" }}
            />
          ) : (
            <div className="h-8 w-8 overflow-hidden rounded-full" style={{ border: "0.5px solid var(--bg-border)" }}>
              <div className="flex h-full w-full items-center justify-center text-[11px]" style={{ background: "var(--bg-surface)" }}>
                {(user?.name?.[0] ?? "U").toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </header>

      <aside
        className="fixed bottom-0 left-0 top-12 w-[220px] overflow-y-auto px-3 py-4"
        style={{
          borderRight: "0.5px solid var(--bg-border)",
          background: "var(--bg-base)"
        }}
      >
        <div
          className="mx-1 mb-4 rounded-[12px] px-3 py-3"
          style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
        >
          <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Workspace
          </p>
          <p className="mt-1 truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {user?.name ?? "—"}
          </p>
        </div>
        {nav.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="px-3 pb-2 text-[10px] tracking-[0.08em] uppercase" style={{ color: "var(--text-muted)" }}>
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={`${section.title}-${item.href}-${item.label}`}
                  href={item.href}
                  className="nav-item mx-1 mb-1 flex items-center gap-2 rounded-[6px] py-2 text-[13px]"
                  data-active={active ? "true" : "false"}
                  style={{
                    color: active ? "var(--green)" : "rgba(255,255,255,0.4)",
                    background: active ? "rgba(62,207,142,0.08)" : "transparent",
                    position: "relative",
                    paddingLeft: 16,
                    paddingRight: 16
                  }}
                >
                  <span
                    className="nav-left-border"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      height: "60%",
                      width: active ? "4px" : "0px",
                      opacity: active ? 1 : 0,
                      borderRadius: 999,
                      background: "var(--green)"
                    }}
                  />
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: active ? "var(--green)" : "rgba(255,255,255,0.3)" }}
                  />
                  <span style={{ position: "relative" }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <main className="ml-[220px] px-8 pb-8 pt-[80px]">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>

      <div className="fixed bottom-5 right-5 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-toast-id={t.id}
            className="toast rounded-[8px] px-4 py-3 text-[13px]"
            style={{
              background: "var(--bg-surface)",
              border: "0.5px solid var(--bg-border)",
              color: "var(--text-primary)"
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-[10px] w-[10px] rounded-full"
                style={{
                  background: t.kind === "success" ? "var(--green)" : "var(--red)"
                }}
              />
              <span>{t.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
