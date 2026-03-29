"use client";

import AuthGuard from "@/components/AuthGuard";
import { Shell } from "@/components/layout/Shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Shell>{children}</Shell>
    </AuthGuard>
  );
}
