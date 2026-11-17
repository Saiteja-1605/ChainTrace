import React from "react";
import { CheckCircle2, Clock, MapPin, User, Hash, Box, ExternalLink } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

const ORDERED_STEPS = [
  { key: "Registered", title: "Product Registered", role: "Manufacturer" },
  { key: "Manufactured", title: "Manufacturing Completed", role: "Manufacturer" },
  { key: "Dispatched", title: "Dispatched for Freight", role: "Distributor" },
  { key: "In Transit", title: "In Transit & Logistics", role: "Distributor" },
  { key: "Received", title: "Received at Retail Outlet", role: "Retailer" },
  { key: "Delivered", title: "Delivered / Handed Over", role: "Customer" },
];

export function Timeline({ currentStatus, history = [], onSelectTx }) {
  const currentStepIndex = ORDERED_STEPS.findIndex(
    (s) => s.key.toLowerCase() === (currentStatus || "").toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* Visual Stepper Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6">
          Supply Chain Milestone Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {ORDERED_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                    : isCompleted
                    ? "bg-slate-50 border-emerald-400"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {step.role}
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-900 leading-tight">
                  {step.key}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {isCurrent ? "Active Stage" : isCompleted ? "Completed" : "Upcoming"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Chronological Event Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Cryptographically timestamped transactions anchored to the Ethereum blockchain
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {history.length} Event{history.length === 1 ? "" : "s"} Recorded
          </span>
        </div>

        <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {history.map((record, index) => {
            const isLast = index === history.length - 1;
            return (
              <div key={index} className="relative group">
                {/* Node icon indicator */}
                <div
                  className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ${
                    isLast
                      ? "border-blue-600 text-blue-600 ring-4 ring-blue-100"
                      : "border-slate-400 text-slate-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isLast ? "bg-blue-600" : "bg-slate-400"
                    }`}
                  />
                </div>

                {/* Event Card */}
                <div className="bg-slate-50/80 hover:bg-slate-50 transition-colors border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={record.status} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(record.timestamp).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {record.transactionHash && (
                      <button
                        onClick={() => onSelectTx && onSelectTx(record.transactionHash)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                        title="Inspect transaction"
                      >
                        <Hash className="w-3 h-3 text-blue-500" />
                        <span>
                          {record.transactionHash.slice(0, 10)}...
                          {record.transactionHash.slice(-6)}
                        </span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </button>
                    )}
                  </div>

                  {/* Remarks */}
                  <p className="text-sm text-slate-800 font-medium mb-3">
                    {record.remarks || "Status updated"}
                  </p>

                  {/* Details metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{record.location || "Unspecified Point"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {record.actorName} ({record.actorRole})
                      </span>
                    </div>

                    {record.blockNumber && (
                      <div className="flex items-center gap-1.5 font-mono text-slate-500">
                        <Box className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Block #{record.blockNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
