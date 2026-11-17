import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Printer, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";

export function QRCodeModal({ product, onClose, onOpenTracking }) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  if (!product) return null;

  const trackingUrl = `${window.location.origin}?track=${encodeURIComponent(product.productId)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Scale up for high resolution
    const size = 600;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `QRCode-${product.productId}.png`;
      a.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
      <div
        id="printable-qr-modal"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Traceability QR Label</h3>
              <p className="text-xs text-blue-200/80">ChainTrace Blockchain Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* QR Container */}
          <div
            ref={qrRef}
            className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 inline-block shadow-inner mb-4"
          >
            <QRCodeSVG
              value={trackingUrl}
              size={210}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231d4ed8'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>",
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          </div>

          <div className="space-y-1 mb-5">
            <h4 className="font-bold text-lg text-slate-900">{product.name}</h4>
            <p className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
              {product.productId}
            </p>
            <p className="text-xs text-slate-500">
              Batch: <span className="font-medium text-slate-700">{product.batchNumber}</span> |
              Mfg: <span className="font-medium text-slate-700">{product.manufacturer}</span>
            </p>
          </div>

          {/* Product Hash info */}
          {product.productHash && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-5 text-left text-xs">
              <span className="font-semibold text-slate-500 block mb-0.5">
                On-Chain Cryptographic Hash:
              </span>
              <span className="font-mono text-slate-700 break-all select-all text-[11px]">
                {product.productHash}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print Label
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? "Link Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenTracking(product.productId);
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
