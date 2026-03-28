"use client";

import React from "react";

export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl p-5"
          style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
        >
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton mt-4 h-3 w-full rounded" />
          <div className="skeleton mt-2 h-3 w-4/5 rounded" />
          <div className="skeleton mt-2 h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--bg-surface)", border: "0.5px solid var(--bg-border)" }}
    >
      <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-[8px] px-5 py-2 text-[13px] font-medium"
          style={{ background: "var(--green)", color: "#050505" }}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function InlineSpinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
      <span
        className="inline-block h-3 w-3 animate-spin rounded-full"
        style={{ border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "var(--green)" }}
      />
      {label ?? "Loading"}
    </span>
  );
}
