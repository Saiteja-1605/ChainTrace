import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Upload, AlertCircle, Search, Sparkles } from "lucide-react";
import { api } from "../services/api";

export function QRScannerModal({ onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState("camera"); // camera | upload | manual
  const [manualId, setManualId] = useState("");
  const [demoProducts, setDemoProducts] = useState([]);
  const [scannerError, setScannerError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerInstanceRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch quick demo products to allow fast testing
    api.getProducts().then((res) => {
      if (res.success && res.products) {
        setDemoProducts(res.products.slice(0, 5));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        await scannerInstanceRef.current.clear();
      } catch (err) {
        console.warn("Camera stop error:", err);
      }
      scannerInstanceRef.current = null;
      setIsScanning(false);
    }
  };

  const handleDecodedText = (decodedText) => {
    stopCamera();
    // Parse product ID from url if full link (e.g. ?track=PRD-123 or just PRD-123)
    let prodId = decodedText.trim();
    if (prodId.includes("track=")) {
      try {
        const url = new URL(prodId);
        prodId = url.searchParams.get("track") || prodId;
      } catch (e) {
        const match = prodId.match(/track=([^&]+)/);
        if (match) prodId = decodeURIComponent(match[1]);
      }
    }
    onScanSuccess(prodId);
  };

  const startCamera = async () => {
    setScannerError("");
    try {
      const html5QrCode = new Html5Qrcode("qr-camera-region");
      scannerInstanceRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.warn("Camera start failed:", err);
      setScannerError(
        "Camera access unavailable or permission denied. You can upload a QR image or select a demo product below."
      );
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-file-region");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err) {
      setScannerError("Could not decode QR code from the selected image. Please try another file or enter Product ID.");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      handleDecodedText(manualId.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Scan Product QR Code</h3>
            <p className="text-xs text-blue-200/80">Instant Traceability & Blockchain Verification</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === "camera"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" /> Live Camera
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === "manual"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search className="w-4 h-4" /> Manual ID
          </button>
        </div>

        <div className="p-6">
          {scannerError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{scannerError}</span>
            </div>
          )}

          {activeTab === "camera" && (
            <div>
              <div
                id="qr-camera-region"
                className="w-full bg-slate-900 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center text-slate-400 text-xs"
              />
              <p className="text-center text-xs text-slate-500 mt-3">
                Align the product QR code label inside the frame
              </p>
            </div>
          )}

          {activeTab === "upload" && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Click to select QR Code image</p>
                <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div id="qr-file-region" className="hidden" />
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Identifier / Batch ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. PRD-BATCH-2026-A"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Trace Product Verification
              </button>
            </form>
          )}

          {/* Quick Demo Pickers */}
          {demoProducts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Test: Select Registered Product</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {demoProducts.map((p) => (
                  <button
                    key={p.productId}
                    onClick={() => handleDecodedText(p.productId)}
                    className="text-[11px] font-mono bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
                  >
                    {p.name} ({p.productId})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
