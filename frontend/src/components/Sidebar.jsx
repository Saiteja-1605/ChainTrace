import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  Cpu,
  Search,
  Building2,
  Truck,
  Store,
  Shield,
  HelpCircle,
} from "lucide-react";

export function Sidebar({ onOpenRegisterModal }) {
  const { user } = useAuth();
  const location = useLocation();

  const getDashboardIcon = () => {
    switch (user?.role) {
      case "admin":
        return Shield;
      case "manufacturer":
        return Building2;
      case "distributor":
        return Truck;
      case "retailer":
        return Store;
      default:
        return LayoutDashboard;
    }
  };

  const DashboardIcon = getDashboardIcon();

  const navItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: DashboardIcon,
    },
    {
      to: "/products",
      label: "Product Catalog",
      icon: Boxes,
    },
    {
      to: "/blockchain",
      label: "Blockchain Explorer",
      icon: Cpu,
    },
    {
      to: "/verify",
      label: "Public Verification",
      icon: Search,
    },
  ];

  const canRegister = user?.role === "manufacturer" || user?.role === "admin";

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        {/* User Context Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Active Workspace
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {user?.organization || user?.name}
          </div>
          <div className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>{user?.location || "Local Workspace"}</span>
          </div>
        </div>

        {/* Quick Action Button */}
        {canRegister && (
          <button
            onClick={onOpenRegisterModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Product</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200/80 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-600">ChainTrace Core v1.0</div>
        <div>Hardhat EVM Local Network</div>
        <div className="text-[10px] text-slate-400">Zero Cloud · 100% Localhost</div>
      </div>
    </aside>
  );
}
