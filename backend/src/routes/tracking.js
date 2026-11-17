const express = require("express");
const router = express.Router();
const { FILES, readData } = require("../services/storageService");
const blockchainService = require("../services/blockchainService");

/**
 * GET /api/tracking/:productId
 * Public tracking and cryptographic verification endpoint
 */
router.get("/:productId", async (req, res) => {
  try {
    const rawId = req.params.productId.trim();
    const products = readData(FILES.PRODUCTS, []);
    const product = products.find((p) => p.productId.toLowerCase() === rawId.toLowerCase());

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `No product found with ID '${rawId}'`,
        verified: false,
      });
    }

    // Verify cryptographic integrity on Hardhat blockchain
    let onChainVerification = {
      verified: false,
      note: "Blockchain node connection pending",
    };

    let onChainHistory = [];
    let onChainLive = null;

    try {
      if (product.productHash) {
        onChainVerification = await blockchainService.verifyProduct(
          product.productId,
          product.productHash
        );
      }
      onChainHistory = await blockchainService.getProductHistory(product.productId);
      onChainLive = await blockchainService.getProduct(product.productId);
    } catch (bcErr) {
      console.warn("Could not query on-chain state:", bcErr.message);
      onChainVerification = {
        verified: false,
        error: bcErr.message,
      };
    }

    // Calculate authenticity badge
    const isAuthentic = onChainVerification.verified === true;

    res.json({
      success: true,
      productId: product.productId,
      name: product.name,
      category: product.category,
      batchNumber: product.batchNumber,
      manufacturer: product.manufacturer,
      manufacturingLocation: product.manufacturingLocation,
      manufacturingDate: product.manufacturingDate,
      expiryDate: product.expiryDate,
      quantity: product.quantity,
      description: product.description,
      currentStatus: product.status,
      currentCustodianName: product.currentCustodianName,
      productHash: product.productHash,
      registrationTxHash: product.registrationTxHash,
      registrationBlock: product.registrationBlock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Verification payload
      blockchainVerification: {
        isAuthentic,
        status: isAuthentic ? "VERIFIED_AUTHENTIC" : "UNVERIFIED_OR_TAMPERED",
        storedOnChainHash: onChainVerification.storedHash || "N/A",
        computedLocalHash: product.productHash,
        hashesMatch: isAuthentic,
        onChainCustodian: onChainLive ? onChainLive.currentCustodian : null,
      },
      // Supply chain timeline
      history: product.history || [],
      onChainHistoryCount: onChainHistory.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
