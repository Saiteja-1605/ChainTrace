import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Link as ChainIcon,
  ShieldCheck,
  Building2,
  Truck,
  Store,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";

const DEMO_USERS = [
  {
    role: "Admin",
    email: "admin@chaintrace.local",
    name: "Arthur Pendelton",
    org: "ChainTrace Regulatory Authority",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Shield,
    desc: "Oversee system provenance, audit blockchain logs, and manage entities.",
  },
  {
    role: "Manufacturer",
    email: "manufacturer@chaintrace.local",
    name: "Apex BioPharma Labs",
    org: "Apex Pharmaceuticals Ltd.",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Building2,
    desc: "Register products, mint cryptographic hashes on-chain, and dispatch shipments.",
  },
  {
    role: "Distributor",
    email: "distributor@chaintrace.local",
    name: "SwiftLogix Global",
    org: "SwiftLogix Logistics Group",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Truck,
    desc: "Accept freight custody, verify transit conditions, and advance status to In Transit.",
  },
  {
    role: "Retailer",
    email: "retailer@chaintrace.local",
    name: "CareWell Pharmacy",
    org: "CareWell Health Retailers",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    icon: Store,
    desc: "Receive shipments, verify authenticity on-chain, and hand over to consumers.",
  },
];

export function LoginPage({ onOpenPublicTracking }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@chaintrace.local");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-xl shadow-blue-500/25 mb-4">
          <ChainIcon className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">ChainTrace</h2>
        <p className="mt-1.5 text-xs text-blue-200/80 font-medium tracking-wide uppercase">
          Blockchain-Based Supply Chain Tracking & Traceability
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Login Form */}
          <div className="p-8 sm:p-10 lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access role-specific supply chain credentials and blockchain actions
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@chaintrace.local"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Public verify prompt */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={onOpenPublicTracking}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>Verify a Product Without Logging In</span>
              </button>
            </div>
          </div>

          {/* Right: 1-Click Demo Accounts Selector */}
          <div className="p-8 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Demo Accounts (1-Click Fill)
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Password: password123
                </span>
              </div>

              <div className="space-y-2.5">
                {DEMO_USERS.map((demo) => {
                  const Icon = demo.icon;
                  const isSelected = email.toLowerCase() === demo.email.toLowerCase();
                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleSelectDemo(demo.email)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-900">{demo.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${demo.badge}`}>
                          {demo.role}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{demo.email}</div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{demo.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 text-[11px] text-slate-400 bg-white p-3 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-600 block mb-0.5">
                Localhost Ethereum Architecture
              </span>
              Passwords use bcrypt hashing. Real transactions confirm against the local Hardhat
              RPC node with zero external cloud dependencies.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
