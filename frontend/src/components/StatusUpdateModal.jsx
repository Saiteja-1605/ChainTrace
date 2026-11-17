import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { X, RefreshCw, Send, Loader2, ShieldCheck, MapPin, AlertCircle } from "lucide-react";

const STATUS_OPTIONS = [
  { value: 1, label: "Manufactured", description: "Production, bottling, packaging complete" },
  { value: 2, label: "Dispatched", description: "Departed production line or warehouse" },
  { value: 3, label: "In Transit", description: "Currently moving via freight / cold chain" },
  { value: 4, label: "Received", description: "Arrived at logistics hub or retail warehouse" },
  { value: 5, label: "Delivered", description: "Delivered to end retail store or customer" },
];

export function StatusUpdateModal({ product, onClose, onSuccess }) {
  const { user } = useAuth();
  const [mode, setMode] = useState("status"); // 'status' | 'custody'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Status form state
  const [statusVal, setStatusVal] = useState(
    Math.min((product.statusInt ?? 0) + 1, 5)
  );
  const [location, setLocation] = useState(user?.location || "");
  const [remarks, setRemarks] = useState("");

  // Custody form state
  const [newCustodianName, setNewCustodianName] = useState("");
  const [newCustodianAddress, setNewCustodianAddress] = useState("");

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.updateProductStatus(product.productId, {
        status: Number(statusVal),
        location: location.trim() || user?.location || "Facility Checkpoint",
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        onSuccess(res.product, res.blockchain);
      } else {
        setError(res.error || "Failed to update status");
      }
    } catch (err) {
      setError(err.message || "Failed to submit status update to blockchain");
    } finally {
      setLoading(false);
    }
  };

  const handleCustodySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.transferCustody(product.productId, {
        newCustodianName: newCustodianName.trim(),
        newCustodianAddress: newCustodianAddress.trim() || undefined,
        location: location.trim() || user?.location || "Handoff Station",
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        onSuccess(res.product, res.blockchain);
      } else {
        setError(res.error || "Failed to transfer custody");
      }
    } catch (err) {
      setError(err.message || "Failed to submit custody transfer to blockchain");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Supply Chain Update</h3>
            <p className="text-xs text-blue-200/80">
              Product: <span className="font-mono text-white font-semibold">{product.productId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setMode("status")}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mode === "status"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <RefreshCw className="w-4 h-4" /> Update Status
          </button>
          <button
            onClick={() => setMode("custody")}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mode === "custody"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-4 h-4" /> Transfer Custody
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "status" ? (
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Supply Chain Status *
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} – {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Checkpoint Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frankfurt Air Logistics Terminal 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inspection Remarks / Handover Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Temperature sustained at -20°C, seal intact, barcode verified."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing to Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Commit on Chain</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCustodySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Custodian Name / Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SwiftLogix Freight or CareWell Pharmacy"
                  value={newCustodianName}
                  onChange={(e) => setNewCustodianName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Ethereum Wallet Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="0x... (defaults to system account)"
                  value={newCustodianAddress}
                  onChange={(e) => setNewCustodianAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Warehouse Bay 4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transfer Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Custody transferred with sign-off bill of lading #BOL-8821"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transferring on Chain...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transfer Custody</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
