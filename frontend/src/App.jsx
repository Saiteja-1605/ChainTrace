import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { QRCodeModal } from "./components/QRCodeModal";
import { QRScannerModal } from "./components/QRScannerModal";
import { RegisterProductModal } from "./components/RegisterProductModal";
import { StatusUpdateModal } from "./components/StatusUpdateModal";

import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ManufacturerDashboard } from "./pages/ManufacturerDashboard";
import { DistributorDashboard } from "./pages/DistributorDashboard";
import { RetailerDashboard } from "./pages/RetailerDashboard";
import { ProductManagement } from "./pages/ProductManagement";
import { PublicTrackingPage } from "./pages/PublicTrackingPage";
import { BlockchainExplorer } from "./pages/BlockchainExplorer";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-semibold">
        Initializing ChainTrace Security Context...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MainLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [qrModalProduct, setQrModalProduct] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [statusModalProduct, setStatusModalProduct] = useState(null);
  const [selectedTxHash, setSelectedTxHash] = useState(null);

  const handleScanSuccess = (productId) => {
    setScannerOpen(false);
    navigate(`/verify?track=${encodeURIComponent(productId)}`);
  };

  const handleSelectProduct = (productId) => {
    navigate(`/verify?track=${encodeURIComponent(productId)}`);
  };

  const handleSelectTx = (txHash) => {
    setSelectedTxHash(txHash);
    navigate("/blockchain");
  };

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user?.role) {
      case "admin":
        return (
          <AdminDashboard
            onSelectProduct={handleSelectProduct}
            onSelectTx={handleSelectTx}
            onOpenRegisterModal={() => setRegisterModalOpen(true)}
          />
        );
      case "manufacturer":
        return (
          <ManufacturerDashboard
            onOpenRegisterModal={() => setRegisterModalOpen(true)}
            onOpenQRModal={(p) => setQrModalProduct(p)}
            onOpenStatusModal={(p) => setStatusModalProduct(p)}
            onSelectProduct={handleSelectProduct}
          />
        );
      case "distributor":
        return (
          <DistributorDashboard
            onOpenQRModal={(p) => setQrModalProduct(p)}
            onOpenStatusModal={(p) => setStatusModalProduct(p)}
            onSelectProduct={handleSelectProduct}
            onOpenScanner={() => setScannerOpen(true)}
          />
        );
      case "retailer":
        return (
          <RetailerDashboard
            onOpenQRModal={(p) => setQrModalProduct(p)}
            onOpenStatusModal={(p) => setStatusModalProduct(p)}
            onSelectProduct={handleSelectProduct}
            onOpenScanner={() => setScannerOpen(true)}
          />
        );
      default:
        return (
          <AdminDashboard
            onSelectProduct={handleSelectProduct}
            onSelectTx={handleSelectTx}
            onOpenRegisterModal={() => setRegisterModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        onOpenScanner={() => setScannerOpen(true)}
        onOpenPublicTracking={() => navigate("/verify")}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar onOpenRegisterModal={() => setRegisterModalOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route
              path="/products"
              element={
                <ProductManagement
                  onOpenRegisterModal={() => setRegisterModalOpen(true)}
                  onOpenQRModal={(p) => setQrModalProduct(p)}
                  onOpenStatusModal={(p) => setStatusModalProduct(p)}
                  onSelectProduct={handleSelectProduct}
                />
              }
            />
            <Route
              path="/blockchain"
              element={
                <BlockchainExplorer
                  initialTxHash={selectedTxHash}
                  onSelectProduct={handleSelectProduct}
                />
              }
            />
            <Route
              path="/verify"
              element={
                <PublicTrackingPage
                  onOpenScanner={() => setScannerOpen(true)}
                  onSelectTx={handleSelectTx}
                />
              }
            />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      {qrModalProduct && (
        <QRCodeModal
          product={qrModalProduct}
          onClose={() => setQrModalProduct(null)}
          onOpenTracking={handleSelectProduct}
        />
      )}

      {scannerOpen && (
        <QRScannerModal
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}

      {registerModalOpen && (
        <RegisterProductModal
          onClose={() => setRegisterModalOpen(false)}
          onSuccess={(newProduct) => {
            setRegisterModalOpen(false);
            setQrModalProduct(newProduct);
          }}
        />
      )}

      {statusModalProduct && (
        <StatusUpdateModal
          product={statusModalProduct}
          onClose={() => setStatusModalProduct(null)}
          onSuccess={() => {
            setStatusModalProduct(null);
            // Re-render or trigger refresh
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function PublicVerifyWrapper() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleScanSuccess = (productId) => {
    setScannerOpen(false);
    navigate(`/verify?track=${encodeURIComponent(productId)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        onOpenScanner={() => setScannerOpen(true)}
        onOpenPublicTracking={() => navigate("/verify")}
      />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <PublicTrackingPage onOpenScanner={() => setScannerOpen(true)} />
      </div>
      {scannerOpen && (
        <QRScannerModal
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                onOpenPublicTracking={() => (window.location.href = "/verify")}
              />
            }
          />
          {/* Public verification standalone route */}
          <Route path="/verify" element={<PublicVerifyWrapper />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
