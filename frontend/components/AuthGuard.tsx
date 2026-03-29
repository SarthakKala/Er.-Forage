"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AUTH_LS_KEY, syncCookieFromStorage } from "@/lib/auth-storage";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    syncCookieFromStorage();
    const token = localStorage.getItem(AUTH_LS_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#050505" }}
      >
        <div
          className="h-6 w-6 animate-spin rounded-full"
          style={{
            border: "1.5px solid rgba(62,207,142,0.2)",
            borderTopColor: "#3ECF8E"
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
