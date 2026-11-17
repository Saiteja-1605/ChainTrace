import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import {
  Boxes,
  Cpu,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  Hash,
  ExternalLink,
  RefreshCw,
  Activity,
  Layers,
} from "lucide-react";

export function AdminDashboard({ onSelectProduct, onSelectTx, onOpenRegisterModal }) {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, usersRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getUsers(),
      ]);
      if (sumRes.success) setSummary(sumRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
    } catch (err) {
      console.warn("Error fetching admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Regulatory Authority & Master Admin</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">System Provenance Overview</h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Global monitoring of decentralized supply chain ledgers, smart contract state, and participant entities
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <span>+ Mint Product</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Products
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary?.totalProducts ?? 0}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">Recorded on Ledger</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Blockchain Txns
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary?.totalTransactions ?? 0}
            </h3>
            <span className="text-[11px] text-blue-600 font-medium">EVM Confirmed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Block
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              #{summary?.currentBlockNumber ?? 0}
            </h3>
            <span className="text-[11px] text-teal-600 font-medium">Hardhat Chain 31337</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Entities & Roles
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {users.length}
            </h3>
            <span className="text-[11px] text-purple-600 font-medium">Authorized Participants</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Status Breakdown & Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Product Lifecycle Distribution</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(summary?.statusCounts || {}).map(([st, count]) => (
              <div key={st} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <StatusBadge status={st} size="sm" />
                <div className="text-xl font-black text-slate-900 mt-2">{count}</div>
                <div className="text-[11px] text-slate-400">Items active</div>
              </div>
            ))}
          </div>
        </div>

        {/* Participant Entities Directory */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Network Participants</span>
          </h3>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-[11px] text-slate-500">{u.organization} · {u.location}</div>
                  <div className="font-mono text-[10px] text-blue-600 truncate max-w-[200px]">
                    {u.ethereumAddress}
                  </div>
                </div>
                <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 shadow-sm">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Blockchain Transactions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Recent Confirmed Blockchain Transactions</span>
          </h3>
          <span className="text-xs text-slate-400">Mined in local blocks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3">Tx Hash</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Product ID</th>
                <th className="pb-3">Block #</th>
                <th className="pb-3">Gas Used</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.recentTransactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-mono">
                    <button
                      onClick={() => onSelectTx && onSelectTx(tx.transactionHash)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>
                        {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-6)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </button>
                  </td>
                  <td className="py-3 font-semibold text-slate-800">{tx.type}</td>
                  <td className="py-3 font-mono">
                    <button
                      onClick={() => onSelectProduct && onSelectProduct(tx.productId)}
                      className="text-slate-900 hover:text-blue-600 font-semibold"
                    >
                      {tx.productId}
                    </button>
                  </td>
                  <td className="py-3 font-mono text-slate-600">#{tx.blockNumber}</td>
                  <td className="py-3 font-mono text-slate-500">{tx.gasUsed}</td>
                  <td className="py-3 text-slate-400">
                    {new Date(tx.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {(!summary?.recentTransactions || summary.recentTransactions.length === 0) && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No transactions recorded yet. Register a product to begin generating on-chain transactions!
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
