const express = require("express");
const router = express.Router();
const { FILES, readData } = require("../services/storageService");
const blockchainService = require("../services/blockchainService");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/analytics/summary
 * Aggregate metrics for dashboards
 */
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const products = readData(FILES.PRODUCTS, []);
    const transactions = readData(FILES.TRANSACTIONS, []);
    const users = readData(FILES.USERS, []);
    const auditLogs = readData(FILES.AUDIT_LOGS, []);

    const statusCounts = {
      Registered: 0,
      Manufactured: 0,
      Dispatched: 0,
      "In Transit": 0,
      Received: 0,
      Delivered: 0,
    };

    const categoryCounts = {};

    products.forEach((p) => {
      if (statusCounts[p.status] !== undefined) {
        statusCounts[p.status]++;
      }
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    let bcStatus = { connected: false, blockNumber: 0 };
    try {
      bcStatus = await blockchainService.isConnected();
    } catch (e) {
      // safe fallback
    }

    res.json({
      success: true,
      stats: {
        totalProducts: products.length,
        totalTransactions: transactions.length,
        totalUsers: users.length,
        blockchainConnected: bcStatus.connected,
        currentBlockNumber: bcStatus.blockNumber || 0,
        statusCounts,
        categoryCounts,
        recentTransactions: transactions.slice(-5).reverse(),
        recentAuditLogs: auditLogs.slice(-10).reverse(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
