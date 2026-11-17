import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Link as ChainIcon,
  ShieldCheck,
  QrCode,
  LogOut,
  Cpu,
  User,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function Navbar({ onOpenScanner, onOpenPublicTracking }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [metaMaskAddress, setMetaMaskAddress] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function checkChain() {
      try {
        const res = await api.getBlockchainStatus();
        if (isMounted && res.success) {
          setBlockchainInfo(res);
        }
      } catch (err) {
        if (isMounted) setBlockchainInfo({ connected: false });
      }
    }
    checkChain();
    const interval = setInterval(checkChain, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setMetaMaskAddress(accounts[0]);
        }
      } catch (e) {
        console.warn("MetaMask connection denied:", e.message);
      }
    } else {
      alert("MetaMask extension not detected in your browser. (MetaMask is optional; local Hardhat node is actively handling transactions!)");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "manufacturer":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "distributor":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "retailer":
        return "bg-teal-100 text-teal-800 border-teal-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <header className="bg-navy-950 text-white border-b border-navy-900 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <ChainIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  ChainTrace
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Blockchain Traceability
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Blockchain Status & MetaMask Optional */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900/80 border border-navy-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  blockchainInfo?.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="text-slate-300 font-medium">Hardhat Local Node:</span>
              <span className="font-mono text-blue-300">
                {blockchainInfo?.connected
                  ? `Block #${blockchainInfo.blockNumber ?? 0}`
                  : "Connecting..."}
              </span>
            </div>

            {/* Optional MetaMask Connect */}
            <button
              onClick={connectMetaMask}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900/60 hover:bg-navy-800 border border-navy-800 text-xs text-slate-300 hover:text-white transition-colors"
              title="MetaMask wallet connection (Optional)"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {metaMaskAddress
                  ? `${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}`
                  : "Connect MetaMask (Opt)"}
              </span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick QR Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-blue-500/25"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>

            {/* Public Verify button */}
            <button
              onClick={onOpenPublicTracking}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-700 text-white text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Verify Product</span>
            </button>

            {/* User profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-navy-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
                <span
                  className={`capitalize px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadge(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-900 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
