import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import {
  Truck,
  Send,
  QrCode,
  RefreshCw,
  Search,
  Eye,
  SlidersHorizontal,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";

export function DistributorDashboard({
  onOpenQRModal,
  onOpenStatusModal,
  onSelectProduct,
  onOpenScanner,
}) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      if (res.success && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.warn("Failed to load distributor shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter relevant shipments for logistics
  const relevantProducts = products.filter(
    (p) =>
      p.status === "Dispatched" ||
      p.status === "In Transit" ||
      p.status === "Received" ||
      p.currentCustodianName?.toLowerCase().includes("swiftlogix") ||
      p.currentCustodianId === user?.id
  );

  const displayList = relevantProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productId.toLowerCase().includes(search.toLowerCase()) ||
      p.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  const dispatchedCount = products.filter((p) => p.status === "Dispatched").length;
  const inTransitCount = products.filter((p) => p.status === "In Transit").length;
  const deliveredCount = products.filter((p) => p.status === "Delivered").length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-semibold mb-2">
            <Truck className="w-3.5 h-3.5" />
            <span>Global Logistics & Freight Distribution</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{user?.organization || user?.name}</h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Accept shipments from manufacturers, log checkpoint custody, and transition cargo in transit
          </p>
        </div>
        <button
          onClick={onOpenScanner}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Inbound Shipment</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Awaiting Logistics Pickup
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{dispatchedCount}</h3>
          <span className="text-[11px] text-amber-600 font-medium">Dispatched by Factory</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Freight In Transit
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{inTransitCount}</h3>
          <span className="text-[11px] text-blue-600 font-medium">Moving along Corridor</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed Deliveries
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{deliveredCount}</h3>
          <span className="text-[11px] text-emerald-600 font-medium">Delivered to Retail / Customer</span>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Freight & Shipment Manifest</h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
              {displayList.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search shipment manifest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 sm:w-64"
              />
            </div>
            <button
              onClick={loadProducts}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Shipment Details</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Current Custodian</th>
                <th className="py-3 px-4">Origin / Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.map((p) => (
                <tr key={p.productId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                    <div className="font-mono text-[11px] text-blue-600">{p.productId}</div>
                    <div className="text-[10px] text-slate-400">Batch: {p.batchNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{p.manufacturer}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {p.currentCustodianName || "Pending"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{p.manufacturingLocation}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenStatusModal(p)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold border border-blue-200 transition-colors inline-flex items-center gap-1"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Update Checkpoint</span>
                    </button>
                    <button
                      onClick={() => onOpenQRModal(p)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      title="QR Label"
                    >
                      <QrCode className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => onSelectProduct(p.productId)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Inspect Provenance"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    No active freight shipments currently assigned. Use "Scan Inbound Shipment" to log products.
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
