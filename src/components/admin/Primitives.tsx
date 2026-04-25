import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  // import inline to avoid circular dep
  const palette = [
    { bg: "hsl(var(--brand-primary-soft))", fg: "hsl(var(--brand-primary))" },
    { bg: "hsl(var(--brand-info-soft))", fg: "hsl(var(--brand-info))" },
    { bg: "hsl(var(--brand-success-soft))", fg: "hsl(var(--brand-success))" },
    { bg: "hsl(var(--brand-warning-soft))", fg: "hsl(var(--brand-warning))" },
    { bg: "hsl(var(--brand-danger-soft))", fg: "hsl(var(--brand-danger))" },
    { bg: "hsl(var(--gray-200))", fg: "hsl(var(--gray-700))" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const c = palette[h % palette.length];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold flex-shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: c.bg,
        color: c.fg,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  pulse = false,
}: {
  children: ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "primary" | "neutral";
  pulse?: boolean;
}) {
  const variants: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-brand-primary-soft text-brand-primary",
    success: "bg-brand-success-soft text-brand-success",
    danger: "bg-brand-danger-soft text-brand-danger",
    warning: "bg-brand-warning-soft text-[hsl(var(--brand-warning))]",
    info: "bg-brand-info-soft text-brand-info",
    neutral: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("dg-badge", variants[variant])}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "hsl(var(--brand-warning))" : isHalf ? "url(#half)" : "none"}
            stroke="hsl(var(--brand-warning))"
            strokeWidth={1.5}
          >
            {isHalf && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="hsl(var(--brand-warning))" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9.3 9 9" />
          </svg>
        );
      })}
    </div>
  );
}

export function PaymentBadge({ method }: { method: "wave" | "orange_money" | "mtn_momo" }) {
  const map = {
    wave: { label: "Wave", color: "info" as const, char: "W" },
    orange_money: { label: "Orange Money", color: "primary" as const, char: "OM" },
    mtn_momo: { label: "MTN MoMo", color: "warning" as const, char: "MTN" },
  };
  const m = map[method];
  const colors: Record<string, { bg: string; fg: string }> = {
    info: { bg: "hsl(var(--brand-info-soft))", fg: "hsl(var(--brand-info))" },
    primary: { bg: "hsl(var(--brand-primary-soft))", fg: "hsl(var(--brand-primary))" },
    warning: { bg: "hsl(var(--brand-warning-soft))", fg: "hsl(var(--brand-warning))" },
  };
  const c = colors[m.color];
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold"
        style={{ background: c.bg, color: c.fg }}
      >
        {m.char}
      </div>
      <span className="text-sm text-gray-700 font-medium">{m.label}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: "completed" | "in_progress" | "dispute" }) {
  if (status === "completed") return <Badge variant="success">✓ Terminé</Badge>;
  if (status === "in_progress") return <Badge variant="info">⟳ En cours</Badge>;
  return <Badge variant="danger" pulse>⚠ Litige</Badge>;
}
