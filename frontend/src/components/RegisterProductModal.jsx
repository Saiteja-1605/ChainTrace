import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { X, Sparkles, Box, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Pharmaceuticals & Healthcare",
  "Food, Dairy & Beverages",
  "High-Tech Electronics",
  "Automotive & Aerospace Parts",
  "Luxury Goods & Apparel",
  "Industrial Chemicals",
  "Consumer Packaged Goods",
];

export function RegisterProductModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    name: "",
    productId: "",
    category: CATEGORIES[0],
    manufacturer: user?.organization || user?.name || "Global Manufacturer",
    manufacturingLocation: user?.location || "Main Manufacturing Facility",
    manufacturingDate: today,
    batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    quantity: 100,
    expiryDate: nextYear,
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateId = () => {
    const cleanBatch = formData.batchNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      productId: `PRD-${cleanBatch || "LOT"}-${randomSuffix}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        productId:
          formData.productId.trim() ||
          `PRD-${formData.batchNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-${Date.now().toString().slice(-4)}`,
      };

      const res = await api.registerProduct(payload);
      if (res.success && res.product) {
        onSuccess(res.product, res.blockchain);
      } else {
        setError(res.error || "Failed to register product");
      }
    } catch (err) {
      setError(err.message || "Product registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Register Product to Blockchain</h3>
              <p className="text-xs text-blue-200/80">
                Mints cryptographic provenance record onto Hardhat local EVM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. mRNA-1273 Vaccine Vials"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>

            {/* Product ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Unique Product ID (On-Chain)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <input
                type="text"
                name="productId"
                placeholder="Leave blank for auto-generation"
                value={formData.productId}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono text-slate-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Lot Number *
              </label>
              <input
                type="text"
                name="batchNumber"
                required
                value={formData.batchNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono text-slate-900"
              />
            </div>

            {/* Manufacturer Organization */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer Entity *
              </label>
              <input
                type="text"
                name="manufacturer"
                required
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>

            {/* Manufacturing Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturing Location *
              </label>
              <input
                type="text"
                name="manufacturingLocation"
                required
                value={formData.manufacturingLocation}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>

            {/* Manufacturing Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturing Date *
              </label>
              <input
                type="date"
                name="manufacturingDate"
                required
                value={formData.manufacturingDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                required
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Specifications
              </label>
              <input
                type="text"
                name="description"
                placeholder="Storage conditions, certifications, etc."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
              />
            </div>
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
                  <span>Submitting to Blockchain...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register & Commit to Hardhat Node</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
