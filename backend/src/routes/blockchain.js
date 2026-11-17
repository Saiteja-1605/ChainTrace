const express = require("express");
const router = express.Router();
const { FILES, readData } = require("../services/storageService");
const blockchainService = require("../services/blockchainService");

/**
 * GET /api/blockchain/status
 * Node connectivity, current block, contract address
 */
router.get("/status", async (req, res) => {
  try {
    const status = await blockchainService.isConnected();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/blockchain/transactions
 * All recorded blockchain transactions
 */
router.get("/transactions", (req, res) => {
  try {
    const transactions = readData(FILES.TRANSACTIONS, []);
    // Newest first
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/blockchain/tx/:txHash
 * Fetch live confirmed transaction receipt from Hardhat RPC
 */
router.get("/tx/:txHash", async (req, res) => {
  try {
    const txHash = req.params.txHash;
    const tx = await blockchainService.provider.getTransaction(txHash);
    const receipt = await blockchainService.provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return res.status(404).json({ success: false, error: "Transaction receipt not found on chain" });
    }

    res.json({
      success: true,
      transaction: {
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to,
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
        value: tx.value.toString(),
      },
      receipt: {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "Success (1)" : "Reverted (0)",
        logsCount: receipt.logs.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
