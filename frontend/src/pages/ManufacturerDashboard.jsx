import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import {
  Building2,
  PlusCircle,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Boxes,
  ShieldCheck,
  Hash,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

export function ManufacturerDashboard({
  onOpenRegisterModal,
  onOpenQRModal,
  onOpenStatusModal,
  onSelectProduct,
}) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({ myRoleOnly: "true" });
      if (res.success && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.warn("Failed to load manufacturer products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productId.toLowerCase().includes(search.toLowerCase()) ||
      p.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  const registeredCount = products.filter((p) => p.status === "Registered").length;
  const manufacturedCount = products.filter((p) => p.status === "Manufactured").length;
  const dispatchedCount = products.filter((p) => p.status === "Dispatched").length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Manufacturing Facility Operations</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{user?.organization || user?.name}</h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Mint cryptographic hashes for newly manufactured batches and manage product custody handoffs
          </p>
        </div>
        <button
          onClick={onOpenRegisterModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Batch</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Batches</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{products.length}</h3>
          <span className="text-[11px] text-blue-600 font-medium">On-Chain Registered</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Manufacture</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{registeredCount}</h3>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting Assembly</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manufactured</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{manufacturedCount}</h3>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for Dispatch</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dispatched</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{dispatchedCount}</h3>
          <span className="text-[11px] text-indigo-600 font-medium">En Route to Distributor</span>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Registered Production Inventory</h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 sm:w-64"
              />
            </div>
            <button
              onClick={loadProducts}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Batch & Expiry</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">On-Chain Hash</th>
                <th className="py-3 px-4">Custodian</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.productId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                    <div className="font-mono text-[11px] text-blue-600">{p.productId}</div>
                    <div className="text-[10px] text-slate-400">{p.category}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-medium text-slate-800">{p.batchNumber}</div>
                    <div className="text-[11px] text-slate-500">Exp: {p.expiryDate || "N/A"}</div>
                    <div className="text-[10px] text-slate-400">Qty: {p.quantity} units</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-[160px]">
                    <div className="truncate" title={p.productHash}>
                      {p.productHash ? `${p.productHash.slice(0, 10)}...${p.productHash.slice(-6)}` : "Pending"}
                    </div>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Anchored
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium truncate max-w-[140px]">
                      {p.currentCustodianName || p.manufacturer}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenQRModal(p)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Generate & View QR Code"
                    >
                      <QrCode className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => onOpenStatusModal(p)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Update Lifecycle Status or Transfer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                    </button>
                    <button
                      onClick={() => onSelectProduct(p.productId)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      title="View Provenance Journey"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    No products found. Click "Register New Batch" to add your first batch to the blockchain!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
