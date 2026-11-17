import React from "react";
import { CheckCircle2, Clock, Truck, Package, Store, Box } from "lucide-react";

export function StatusBadge({ status, size = "md" }) {
  const normalized = (status || "Registered").toLowerCase();

  const configs = {
    registered: {
      label: "Registered",
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      icon: Box,
    },
    manufactured: {
      label: "Manufactured",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: Package,
    },
    dispatched: {
      label: "Dispatched",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      icon: Truck,
    },
    "in transit": {
      label: "In Transit",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: Clock,
    },
    received: {
      label: "Received",
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
      icon: Store,
    },
    delivered: {
      label: "Delivered",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-300",
      icon: CheckCircle2,
    },
  };

  const config = configs[normalized] || configs.registered;
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : size === "lg"
      ? "text-sm px-3.5 py-1.5 gap-2 font-semibold"
      : "text-xs px-2.5 py-1 gap-1.5 font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}
