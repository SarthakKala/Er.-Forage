"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { api } from "@/lib/axios";
import type { User } from "@/lib/types";
import { AUTH_LS_KEY } from "@/lib/auth-storage";
import { formatRelativeTime } from "@/lib/utils";
import {
  IconAssignments,
  IconDashboard,
  IconPortfolio,
  IconSettings,
  IconSkills,
  IconSubmissions
} from "@/components/icons/NavIcons";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const SIDEBAR_W = 72;

const navItems: Array<{
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/submissions", label: "Submissions", Icon: IconSubmissions },
  { href: "/skills", label: "Skills", Icon: IconSkills },
  { href: "/assignments", label: "Assignments", Icon: IconAssignments },
  { href: "/portfolio", label: "Portfolio", Icon: IconPortfolio },
  { href: "/settings", label: "Settings", Icon: IconSettings }
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; kind: "success" | "error"; message: string }>>([]);
  const shownToastIds = useRef<Set<string>>(new Set());
  const prevSyncing = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_LS_KEY);
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
    <div className="relative min-h-screen bg-[#050505] text-[rgba(255,255,255,0.9)]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -left-24 top-[-80px] h-[min(480px,55vh)] w-[min(480px,55vh)] rounded-full opacity-90"
          style={{
            background: "radial-gradient(circle, rgba(62,207,142,0.09) 0%, transparent 68%)"
          }}
        />
        <div
          className="absolute bottom-[-100px] right-[-60px] h-[min(420px,50vh)] w-[min(420px,50vh)] rounded-full opacity-80"
          style={{
            background: "radial-gradient(circle, rgba(62,207,142,0.05) 0%, transparent 70%)"
          }}
        />
      </div>
      <header
        className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between px-5"
        style={{
          background: "rgba(5,5,5,0.88)",
          borderBottom: "1px solid rgba(62,207,142,0.12)",
          backdropFilter: "blur(14px)"
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
            type="button"
            onClick={runSyncWithErrors}
            disabled={syncing}
            className="sync-btn rounded-[8px] px-3 py-1.5 text-[13px] disabled:opacity-50"
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
        className="fixed bottom-0 left-0 top-12 z-40 flex shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] py-3"
        style={{
          width: SIDEBAR_W,
          background: "rgba(5,5,5,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)"
        }}
      >
        <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Main">
          {navItems.map((item) => {
            const NavIcon = item.Icon;
            const highlighted =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                title={item.label}
                aria-current={highlighted ? "page" : undefined}
                className="group relative flex h-11 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
                style={{
                  color: highlighted ? "var(--green)" : "rgba(255,255,255,0.38)",
                  background: highlighted ? "rgba(62,207,142,0.1)" : "transparent",
                  boxShadow: highlighted ? "inset 0 0 0 1px rgba(62,207,142,0.2)" : undefined
                }}
              >
                {highlighted ? (
                  <span
                    className="absolute left-0 top-1/2 h-[52%] w-[3px] -translate-y-1/2 rounded-r-full"
                    style={{ background: "var(--green)" }}
                  />
                ) : null}
                <NavIcon className="relative z-[1]" />
                <span
                  className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[200] hidden -translate-y-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-medium opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 md:block"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    background: "rgba(12,12,12,0.95)",
                    color: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(8px)"
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/[0.06] px-2 pb-2 pt-3">
          <Link
            href="/settings"
            title={user?.name ? `${user.name} — Settings` : "Settings"}
            className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[11px] font-medium transition-opacity hover:opacity-90"
            style={{ border: "1px solid var(--bg-border)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}
          >
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user?.name ?? "Account"}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              (user?.name?.[0] ?? "·").toUpperCase()
            )}
          </Link>
        </div>
      </aside>

      <main className="relative z-10 pb-10 pl-[calc(72px+1.25rem)] pr-5 pt-[72px] sm:pl-[calc(72px+2rem)] sm:pr-8">
        <div className="mx-auto max-w-[1280px]">{children}</div>
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
