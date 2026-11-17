import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Timeline } from "../components/Timeline";
import { StatusBadge } from "../components/StatusBadge";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  QrCode,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  ExternalLink,
  MapPin,
  Calendar,
  Box,
  Cpu,
  Layers,
  Lock,
} from "lucide-react";

export function PublicTrackingPage({ initialProductId, onOpenScanner, onSelectTx }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryProductId = searchParams.get("track") || initialProductId || "";
  const [productIdInput, setProductIdInput] = useState(queryProductId);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (idToFetch) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await api.getTracking(idToFetch.trim());
      if (res.success) {
        setTrackingData(res);
      } else {
        setError(res.error || "Product not found or verification failed");
        setTrackingData(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch verification from blockchain");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryProductId) {
      setProductIdInput(queryProductId);
      fetchTracking(queryProductId);
    }
  }, [queryProductId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (productIdInput.trim()) {
      setSearchParams({ track: productIdInput.trim() });
      fetchTracking(productIdInput.trim());
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAuthentic = trackingData?.blockchainVerification?.isAuthentic === true;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Search & Scanner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Public Provenance Verification Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Product Provenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scan a QR code or enter the unique Product Identifier to verify cryptographic hashes on the Ethereum blockchain.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Enter Product ID (e.g. PRD-BATCH-2026-A)"
              value={productIdInput}
              onChange={(e) => setProductIdInput(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={onOpenScanner}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Scan QR Code"
          >
            <QrCode className="w-5 h-5 text-blue-600" />
          </button>
        </form>

        {error && (
          <div className="max-w-xl mx-auto mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verification Result Showcase */}
      {trackingData && (
        <div className="space-y-6">
          {/* Authenticity Certificate Banner */}
          <div
            className={`p-6 rounded-2xl border text-white shadow-xl transition-all ${
              isAuthentic
                ? "bg-gradient-to-r from-emerald-950 via-teal-900 to-navy-900 border-emerald-500/40"
                : "bg-gradient-to-r from-rose-950 via-rose-900 to-navy-900 border-rose-500/40"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                    isAuthentic
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-400/40"
                  }`}
                >
                  {isAuthentic ? (
                    <ShieldCheck className="w-8 h-8" />
                  ) : (
                    <ShieldAlert className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isAuthentic
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-400/30"
                      }`}
                    >
                      {isAuthentic ? "Blockchain Verified Authentic" : "Tamper Alert / Unverified"}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Block #{trackingData.registrationBlock ?? "N/A"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black mt-1 text-white">{trackingData.name}</h2>
                  <p className="text-xs text-slate-300">
                    ID: <span className="font-mono text-emerald-300">{trackingData.productId}</span> ·
                    Manufacturer: <span className="font-medium text-white">{trackingData.manufacturer}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Link Copied" : "Share Link"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Hash Comparison Panel */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  On-Chain Stored Hash (Hardhat EVM):
                </div>
                <div className="font-mono text-emerald-300 break-all select-all text-[11px]">
                  {trackingData.blockchainVerification.storedOnChainHash}
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Computed SHA-3 / Keccak256 Hash:
                </div>
                <div className="font-mono text-teal-300 break-all select-all text-[11px]">
                  {trackingData.blockchainVerification.computedLocalHash}
                </div>
              </div>
            </div>
          </div>

          {/* Product Specifications Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider text-slate-400">
              Verified Product Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Category</span>
                <span className="font-bold text-slate-900">{trackingData.category}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Batch / Lot Number</span>
                <span className="font-mono font-bold text-slate-900">{trackingData.batchNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Manufacturing Date</span>
                <span className="font-bold text-slate-900">{trackingData.manufacturingDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Expiry Date</span>
                <span className="font-bold text-slate-900">{trackingData.expiryDate || "N/A"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Origin Location</span>
                <span className="font-bold text-slate-900">{trackingData.manufacturingLocation}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Batch Quantity</span>
                <span className="font-bold text-slate-900">{trackingData.quantity} units</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={trackingData.currentStatus} size="sm" />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 block mb-0.5">Current Custodian</span>
                <span className="font-bold text-slate-900 truncate block">
                  {trackingData.currentCustodianName || trackingData.manufacturer}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Supply Chain Provenance Timeline */}
          <Timeline
            currentStatus={trackingData.currentStatus}
            history={trackingData.history}
            onSelectTx={onSelectTx}
          />
        </div>
      )}
    </div>
  );
}
