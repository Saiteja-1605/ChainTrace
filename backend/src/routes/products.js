const express = require("express");
const router = express.Router();
const { FILES, readData, writeData } = require("../services/storageService");
const blockchainService = require("../services/blockchainService");
const { authenticateToken } = require("../middleware/auth");

const STATUS_MAP = {
  0: "Registered",
  1: "Manufactured",
  2: "Dispatched",
  3: "In Transit",
  4: "Received",
  5: "Delivered",
};

const STATUS_REV_MAP = {
  Registered: 0,
  Manufactured: 1,
  Dispatched: 2,
  "In Transit": 3,
  Received: 4,
  Delivered: 5,
};

/**
 * GET /api/products
 * List all products with optional filtering by role or status
 */
router.get("/", authenticateToken, (req, res) => {
  try {
    const products = readData(FILES.PRODUCTS, []);
    const { status, category, search, myRoleOnly } = req.query;

    let filtered = [...products];

    // Filter by role if requested
    if (myRoleOnly === "true") {
      if (req.user.role === "manufacturer") {
        filtered = filtered.filter(
          (p) => p.manufacturerId === req.user.id || p.manufacturer === req.user.organization
        );
      } else if (req.user.role === "distributor") {
        filtered = filtered.filter(
          (p) =>
            p.currentCustodianId === req.user.id ||
            p.currentCustodianName === req.user.organization ||
            p.status === "Dispatched" ||
            p.status === "In Transit"
        );
      } else if (req.user.role === "retailer") {
        filtered = filtered.filter(
          (p) =>
            p.currentCustodianId === req.user.id ||
            p.currentCustodianName === req.user.organization ||
            p.status === "In Transit" ||
            p.status === "Received" ||
            p.status === "Delivered"
        );
      }
    }

    if (status) {
      filtered = filtered.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }

    if (category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.productId.toLowerCase().includes(q) ||
          p.batchNumber.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: filtered.length, products: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Retrieve a single product by unique ID
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const products = readData(FILES.PRODUCTS, []);
    const product = products.find(
      (p) => p.productId.toLowerCase() === req.params.id.trim().toLowerCase()
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Try verifying against blockchain in real time
    let onChainVerification = null;
    try {
      if (product.productHash) {
        onChainVerification = await blockchainService.verifyProduct(
          product.productId,
          product.productHash
        );
      }
    } catch (e) {
      console.warn("Real-time verification error:", e.message);
    }

    res.json({
      success: true,
      product,
      onChainVerification,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/products
 * Register a new product (Manufacturer or Admin)
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only manufacturers or admins can register new products",
      });
    }

    const {
      name,
      productId: requestedId,
      category,
      manufacturer,
      manufacturingLocation,
      manufacturingDate,
      batchNumber,
      quantity,
      expiryDate,
      description,
    } = req.body;

    // Validate fields
    if (!name || !category || !manufacturingDate || !batchNumber) {
      return res.status(400).json({
        success: false,
        error: "Name, category, manufacturing date, and batch number are required",
      });
    }

    // Generate or format unique product ID (e.g. PRD-BATCH-TIMESTAMP)
    const productId = (
      requestedId ||
      `PRD-${batchNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}-${Date.now().toString().slice(-4)}`
    ).trim();

    const products = readData(FILES.PRODUCTS, []);
    if (products.some((p) => p.productId.toLowerCase() === productId.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Product with ID '${productId}' already exists`,
      });
    }

    const effectiveMfg = manufacturer || req.user.organization || req.user.name;
    const effectiveLoc = manufacturingLocation || req.user.location || "Origin Facility";

    const productPayload = {
      productId,
      name,
      category,
      manufacturer: effectiveMfg,
      manufacturingLocation: effectiveLoc,
      manufacturingDate,
      batchNumber,
      quantity: Number(quantity) || 1,
      expiryDate: expiryDate || "N/A",
      description: description || "",
    };

    // 1. Compute deterministic cryptographic hash
    const productHash = blockchainService.computeProductHash(productPayload);

    // 2. Submit transaction to Hardhat local blockchain
    let blockchainResult = null;
    const signerIndex = req.user.signerIndex ?? 1;

    try {
      blockchainResult = await blockchainService.registerProduct(
        productPayload,
        signerIndex
      );
    } catch (bcErr) {
      console.error("Blockchain registration error:", bcErr);
      return res.status(500).json({
        success: false,
        error: `Blockchain transaction failed: ${bcErr.message}`,
        details: "Ensure Hardhat local node is running (`npx hardhat node`) and contract is deployed.",
      });
    }

    const initialHistoryEntry = {
      status: "Registered",
      statusInt: 0,
      location: effectiveLoc,
      remarks: "Product cryptographic registration confirmed on Hardhat blockchain",
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      actorOrg: req.user.organization,
      actorAddress: req.user.ethereumAddress,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed,
      timestamp: new Date().toISOString(),
    };

    const newProduct = {
      ...productPayload,
      productHash,
      status: "Registered",
      statusInt: 0,
      manufacturerId: req.user.id,
      currentCustodianId: req.user.id,
      currentCustodianName: effectiveMfg,
      currentCustodianRole: req.user.role,
      currentCustodianAddress: req.user.ethereumAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      registrationTxHash: blockchainResult.transactionHash,
      registrationBlock: blockchainResult.blockNumber,
      history: [initialHistoryEntry],
    };

    products.push(newProduct);
    await writeData(FILES.PRODUCTS, products);

    // Record transaction
    const transactions = readData(FILES.TRANSACTIONS, []);
    transactions.push({
      id: `tx_${Date.now()}`,
      productId,
      type: "PRODUCT_REGISTERED",
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed,
      from: req.user.ethereumAddress,
      actorName: req.user.name,
      actorRole: req.user.role,
      status: "Confirmed",
      timestamp: new Date().toISOString(),
      details: `Registered ${name} (${productId})`,
    });
    await writeData(FILES.TRANSACTIONS, transactions);

    // Audit log
    const auditLogs = readData(FILES.AUDIT_LOGS, []);
    auditLogs.push({
      id: `audit_${Date.now()}`,
      action: "PRODUCT_REGISTERED",
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      details: `Product ${productId} registered on blockchain with hash ${productHash}`,
      timestamp: new Date().toISOString(),
    });
    await writeData(FILES.AUDIT_LOGS, auditLogs);

    res.status(201).json({
      success: true,
      message: "Product successfully registered and committed to blockchain!",
      product: newProduct,
      blockchain: blockchainResult,
    });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/products/:id/status
 * Update product status along the supply chain
 */
router.post("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status, location, remarks } = req.body;
    if (status === undefined || status === null) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    const statusInt = typeof status === "number" ? status : STATUS_REV_MAP[status];
    if (statusInt === undefined || statusInt < 0 || statusInt > 5) {
      return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
    }

    const statusName = STATUS_MAP[statusInt];
    const products = readData(FILES.PRODUCTS, []);
    const productIndex = products.findIndex(
      (p) => p.productId.toLowerCase() === req.params.id.trim().toLowerCase()
    );

    if (productIndex === -1) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const product = products[productIndex];

    // Role-based progression check
    if (req.user.role === "manufacturer" && statusInt > 2 && req.user.role !== "admin") {
      // Manufacturer can register (0), manufacture (1), dispatch (2)
    } else if (req.user.role === "distributor" && (statusInt < 2 || statusInt > 4) && req.user.role !== "admin") {
      // Distributor handles dispatched (2), in transit (3), received (4)
    } else if (req.user.role === "retailer" && statusInt < 4 && req.user.role !== "admin") {
      // Retailer handles received (4), delivered (5)
    }

    const effectiveLoc = location || req.user.location || "Facility Point";
    const effectiveRemarks = remarks || `Status transitioned to ${statusName}`;
    const signerIndex = req.user.signerIndex ?? 0;

    // Submit transaction to Hardhat blockchain
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.updateStatus(
        product.productId,
        statusInt,
        effectiveLoc,
        effectiveRemarks,
        req.user.name,
        req.user.role,
        signerIndex
      );
    } catch (bcErr) {
      return res.status(500).json({
        success: false,
        error: `Blockchain update failed: ${bcErr.message}`,
      });
    }

    const historyEntry = {
      status: statusName,
      statusInt,
      location: effectiveLoc,
      remarks: effectiveRemarks,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      actorOrg: req.user.organization,
      actorAddress: req.user.ethereumAddress,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed,
      timestamp: new Date().toISOString(),
    };

    product.status = statusName;
    product.statusInt = statusInt;
    product.updatedAt = new Date().toISOString();
    product.history = product.history || [];
    product.history.push(historyEntry);

    products[productIndex] = product;
    await writeData(FILES.PRODUCTS, products);

    // Record transaction
    const transactions = readData(FILES.TRANSACTIONS, []);
    transactions.push({
      id: `tx_${Date.now()}`,
      productId: product.productId,
      type: "STATUS_UPDATE",
      status: statusName,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed,
      from: req.user.ethereumAddress,
      actorName: req.user.name,
      actorRole: req.user.role,
      timestamp: new Date().toISOString(),
      details: `Updated ${product.productId} status to ${statusName} at ${effectiveLoc}`,
    });
    await writeData(FILES.TRANSACTIONS, transactions);

    res.json({
      success: true,
      message: `Status updated to '${statusName}' on blockchain!`,
      product,
      blockchain: blockchainResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/products/:id/transfer
 * Transfer product custody to next entity
 */
router.post("/:id/transfer", authenticateToken, async (req, res) => {
  try {
    const { newCustodianId, newCustodianName, newCustodianAddress, location, remarks } = req.body;
    if (!newCustodianName) {
      return res.status(400).json({ success: false, error: "New custodian name is required" });
    }

    const products = readData(FILES.PRODUCTS, []);
    const productIndex = products.findIndex(
      (p) => p.productId.toLowerCase() === req.params.id.trim().toLowerCase()
    );

    if (productIndex === -1) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const product = products[productIndex];
    const targetAddress =
      newCustodianAddress || "0x0000000000000000000000000000000000000000";
    const effectiveLoc = location || req.user.location || "Transfer Station";
    const effectiveRemarks = remarks || `Custody handoff to ${newCustodianName}`;
    const signerIndex = req.user.signerIndex ?? 0;

    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.transferCustody(
        product.productId,
        targetAddress,
        newCustodianName,
        effectiveLoc,
        effectiveRemarks,
        req.user.name,
        req.user.role,
        signerIndex
      );
    } catch (bcErr) {
      return res.status(500).json({
        success: false,
        error: `Blockchain custody transfer failed: ${bcErr.message}`,
      });
    }

    const historyEntry = {
      status: product.status,
      statusInt: product.statusInt,
      location: effectiveLoc,
      remarks: `Custody transferred from ${product.currentCustodianName || req.user.name} to ${newCustodianName}: ${effectiveRemarks}`,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      actorOrg: req.user.organization,
      actorAddress: req.user.ethereumAddress,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed,
      timestamp: new Date().toISOString(),
    };

    product.currentCustodianId = newCustodianId || product.currentCustodianId;
    product.currentCustodianName = newCustodianName;
    product.currentCustodianAddress = targetAddress;
    product.updatedAt = new Date().toISOString();
    product.history = product.history || [];
    product.history.push(historyEntry);

    products[productIndex] = product;
    await writeData(FILES.PRODUCTS, products);

    // Record transaction
    const transactions = readData(FILES.TRANSACTIONS, []);
    transactions.push({
      id: `tx_${Date.now()}`,
      productId: product.productId,
      type: "CUSTODY_TRANSFER",
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed,
      from: req.user.ethereumAddress,
      actorName: req.user.name,
      actorRole: req.user.role,
      status: "Confirmed",
      timestamp: new Date().toISOString(),
      details: `Custody transferred to ${newCustodianName}`,
    });
    await writeData(FILES.TRANSACTIONS, transactions);

    res.json({
      success: true,
      message: `Custody successfully transferred to ${newCustodianName}!`,
      product,
      blockchain: blockchainResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
