import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Cpu,
  Layers,
  Hash,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function BlockchainExplorer({ initialTxHash, onSelectProduct }) {
  const [transactions, setTransactions] = useState([]);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTxDetails, setActiveTxDetails] = useState(null);
  const [txDetailsLoading, setTxDetailsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, statusRes] = await Promise.all([
        api.getBlockchainTransactions(),
        api.getBlockchainStatus(),
      ]);
      if (txRes.success) setTransactions(txRes.transactions);
      if (statusRes.success) setBlockchainStatus(statusRes);
    } catch (err) {
      console.warn("Failed to load blockchain explorer:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (initialTxHash) {
      inspectTransaction(initialTxHash);
    }
  }, [initialTxHash]);

  const inspectTransaction = async (hash) => {
    try {
      setTxDetailsLoading(true);
      const res = await api.getTransactionReceipt(hash);
      if (res.success) {
        setActiveTxDetails(res);
      }
    } catch (err) {
      console.warn("Failed to inspect tx:", err);
      // Fallback: display basic info from local transactions
      const local = transactions.find((t) => t.transactionHash === hash);
      if (local) {
        setActiveTxDetails({
          success: true,
          transaction: {
            hash: local.transactionHash,
            blockNumber: local.blockNumber,
            from: local.from,
            to: blockchainStatus?.contractAddress,
          },
          receipt: {
            gasUsed: local.gasUsed,
            status: "Confirmed",
          },
        });
      }
    } finally {
      setTxDetailsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardhat Local EVM Explorer</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Blockchain Ledger Explorer</h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Real-time validation of mined blocks, smart contract state transitions, and cryptographic transaction receipts
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Node Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                blockchainStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <h3 className="text-lg font-extrabold text-slate-900">
              {blockchainStatus?.connected ? "Active & Syncing" : "Disconnected"}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">RPC: http://127.0.0.1:8545</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Block Height</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
            #{blockchainStatus?.blockNumber ?? 0}
          </h3>
          <span className="text-[11px] text-blue-600 font-medium">Chain ID: {blockchainStatus?.chainId || "31337"}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Confirmed Txns</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{transactions.length}</h3>
          <span className="text-[11px] text-emerald-600 font-medium">100% Confirmation Rate</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Smart Contract</p>
          <div className="font-mono text-xs font-bold text-slate-800 truncate mt-2" title={blockchainStatus?.contractAddress}>
            {blockchainStatus?.contractAddress
              ? `${blockchainStatus.contractAddress.slice(0, 10)}...${blockchainStatus.contractAddress.slice(-6)}`
              : "Deploying..."}
          </div>
          <span className="text-[11px] text-purple-600 font-medium">SupplyChain.sol (0.8.20)</span>
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Decentralized Transaction Ledger</h3>
          <span className="text-xs text-slate-400">{transactions.length} confirmed entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transaction Hash</th>
                <th className="py-3 px-4">Method / Action</th>
                <th className="py-3 px-4">Product ID</th>
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Gas Consumed</th>
                <th className="py-3 px-4">Signer Role</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <button
                      onClick={() => inspectTransaction(tx.transactionHash)}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <span>
                        {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-6)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <button
                      onClick={() => onSelectProduct && onSelectProduct(tx.productId)}
                      className="hover:text-blue-600"
                    >
                      {tx.productId}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">#{tx.blockNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{tx.gasUsed}</td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="font-semibold">{tx.actorName}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{tx.actorRole}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => inspectTransaction(tx.transactionHash)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold border border-blue-200 transition-colors text-[11px]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No transactions recorded on the Hardhat node yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {activeTxDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Ethereum Transaction Receipt</h3>
                  <p className="text-xs text-blue-200/80">Confirmed by Hardhat Local Node</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTxDetails(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Transaction Hash
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-800 break-all select-all text-xs">
                    {activeTxDetails.transaction?.hash}
                  </span>
                  <button
                    onClick={() => handleCopy(activeTxDetails.transaction?.hash)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Copy Hash"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Block Number
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    #{activeTxDetails.transaction?.blockNumber}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Gas Consumed
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {activeTxDetails.receipt?.gasUsed} units
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  From (Signer Address)
                </span>
                <span className="font-mono text-slate-800 break-all select-all block">
                  {activeTxDetails.transaction?.from}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  To (Contract Address)
                </span>
                <span className="font-mono text-slate-800 break-all select-all block">
                  {activeTxDetails.transaction?.to}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mined & Confirmed
                </span>
                <button
                  onClick={() => setActiveTxDetails(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
