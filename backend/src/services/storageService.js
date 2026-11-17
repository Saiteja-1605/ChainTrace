const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");

const DATA_DIR = path.join(__dirname, "../../data");

// Ensure local data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  USERS: path.join(DATA_DIR, "users.json"),
  PRODUCTS: path.join(DATA_DIR, "products.json"),
  TRANSACTIONS: path.join(DATA_DIR, "transactions.json"),
  AUDIT_LOGS: path.join(DATA_DIR, "audit_logs.json"),
};

let useMongoDB = false;
let mongoConnectionStatus = "disconnected";
let writeQueue = Promise.resolve();

// In-memory synced caches for high performance synchronous API compatibility
let memoryCache = {
  users: null,
  products: null,
  transactions: null,
  auditLogs: null,
};

function getCollectionKey(filePath) {
  if (filePath === FILES.USERS || filePath.includes("users")) return "users";
  if (filePath === FILES.PRODUCTS || filePath.includes("products")) return "products";
  if (filePath === FILES.TRANSACTIONS || filePath.includes("transactions")) return "transactions";
  if (filePath === FILES.AUDIT_LOGS || filePath.includes("audit_logs")) return "auditLogs";
  return null;
}

/**
 * Connect to MongoDB Atlas if MONGODB_URI is provided
 */
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("[StorageService] No MONGODB_URI provided. Running with local JSON persistence.");
    return false;
  }

  try {
    console.log("[StorageService] Connecting to MongoDB Atlas...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    useMongoDB = true;
    mongoConnectionStatus = "connected";
    console.log("[StorageService] Successfully connected to MongoDB Atlas!");

    // Hydrate memory cache from MongoDB
    await refreshCacheFromMongoDB();
    return true;
  } catch (err) {
    console.warn("[StorageService] MongoDB Atlas connection failed:", err.message);
    console.log("[StorageService] Falling back to local JSON file persistence.");
    useMongoDB = false;
    mongoConnectionStatus = `error: ${err.message}`;
    return false;
  }
}

/**
 * Load collections from MongoDB into memory cache
 */
async function refreshCacheFromMongoDB() {
  if (!useMongoDB) return;
  try {
    memoryCache.users = await User.find({}).lean();
    memoryCache.products = await Product.find({}).lean();
    memoryCache.transactions = await Transaction.find({}).lean();
    memoryCache.auditLogs = await AuditLog.find({}).lean();

    // Mirror to local JSON files as persistence safety backup
    if (memoryCache.users.length) writeDataSync(FILES.USERS, memoryCache.users);
    if (memoryCache.products.length) writeDataSync(FILES.PRODUCTS, memoryCache.products);
    if (memoryCache.transactions.length) writeDataSync(FILES.TRANSACTIONS, memoryCache.transactions);
    if (memoryCache.auditLogs.length) writeDataSync(FILES.AUDIT_LOGS, memoryCache.auditLogs);
  } catch (e) {
    console.warn("[StorageService] Error refreshing cache from MongoDB:", e.message);
  }
}

/**
 * Read data (supports MongoDB memory cache & JSON file fallback)
 */
function readData(filePath, fallback = []) {
  const key = getCollectionKey(filePath);
  if (useMongoDB && key && memoryCache[key] !== null) {
    return memoryCache[key];
  }

  try {
    if (!fs.existsSync(filePath)) {
      writeDataSync(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

/**
 * Synchronous write helper
 */
function writeDataSync(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpFile = `${filePath}.${Date.now()}-${Math.random().toString(36).slice(2, 6)}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpFile, filePath);
}

/**
 * Safely and atomically write data (persists to MongoDB Atlas & local JSON)
 */
function writeData(filePath, data) {
  const key = getCollectionKey(filePath);
  if (key) {
    memoryCache[key] = data;
  }

  writeQueue = writeQueue.then(async () => {
    try {
      // 1. Write to local JSON atomically
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      const tmpPath = `${filePath}.${Date.now()}-${Math.random().toString(36).substring(2, 7)}.tmp`;
      await fs.promises.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
      await fs.promises.rename(tmpPath, filePath);

      // 2. If MongoDB is connected, persist changes to MongoDB Atlas
      if (useMongoDB && key) {
        await syncKeyToMongoDB(key, data);
      }
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err.message);
      throw err;
    }
  });
  return writeQueue;
}

/**
 * Sync memory array data to MongoDB Atlas collection
 */
async function syncKeyToMongoDB(key, data) {
  try {
    if (key === "users") {
      for (const item of data) {
        await User.findOneAndUpdate({ id: item.id }, item, { upsert: true, new: true });
      }
    } else if (key === "products") {
      for (const item of data) {
        await Product.findOneAndUpdate({ productId: item.productId }, item, { upsert: true, new: true });
      }
    } else if (key === "transactions") {
      for (const item of data) {
        await Transaction.findOneAndUpdate({ id: item.id }, item, { upsert: true, new: true });
      }
    } else if (key === "auditLogs") {
      for (const item of data) {
        await AuditLog.findOneAndUpdate({ id: item.id }, item, { upsert: true, new: true });
      }
    }
  } catch (err) {
    console.warn(`[StorageService] Warning: Failed to sync ${key} to MongoDB:`, err.message);
  }
}

/**
 * Initialize default demo accounts and initial schema
 */
async function initializeData() {
  await connectMongoDB();

  const isProduction = process.env.NODE_ENV === "production";
  const users = readData(FILES.USERS, []);

  // Seed default demo users if users list is empty and NOT in strict production
  if (users.length === 0) {
    console.log("[StorageService] Initializing default system demo users...");
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash("password123", salt);

    const defaultUsers = [
      {
        id: "usr_admin_1",
        name: "Arthur Pendelton",
        email: "admin@chaintrace.local",
        password: demoPasswordHash,
        role: "admin",
        organization: "ChainTrace Global Regulatory Authority",
        location: "Geneva, Switzerland",
        ethereumAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        signerIndex: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_mfg_1",
        name: "Apex BioPharma Labs",
        email: "manufacturer@chaintrace.local",
        password: demoPasswordHash,
        role: "manufacturer",
        organization: "Apex Pharmaceuticals Ltd.",
        location: "Boston, USA",
        ethereumAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        signerIndex: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_dist_1",
        name: "SwiftLogix Global Freight",
        email: "distributor@chaintrace.local",
        password: demoPasswordHash,
        role: "distributor",
        organization: "SwiftLogix Logistics Group",
        location: "Frankfurt Logistics Hub, Germany",
        ethereumAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        signerIndex: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_ret_1",
        name: "CareWell Metro Pharmacy",
        email: "retailer@chaintrace.local",
        password: demoPasswordHash,
        role: "retailer",
        organization: "CareWell Health Retailers",
        location: "London Central Branch, UK",
        ethereumAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        signerIndex: 3,
        createdAt: new Date().toISOString(),
      },
    ];

    await writeData(FILES.USERS, defaultUsers);
  }

  // Ensure arrays exist
  if (!fs.existsSync(FILES.PRODUCTS)) writeDataSync(FILES.PRODUCTS, []);
  if (!fs.existsSync(FILES.TRANSACTIONS)) writeDataSync(FILES.TRANSACTIONS, []);
  if (!fs.existsSync(FILES.AUDIT_LOGS)) writeDataSync(FILES.AUDIT_LOGS, []);
}

function getDatabaseStatus() {
  return {
    type: useMongoDB ? "MongoDB Atlas" : "Local JSON Datastore",
    connected: useMongoDB,
    status: mongoConnectionStatus,
    models: ["User", "Product", "Transaction", "AuditLog"],
  };
}

module.exports = {
  FILES,
  readData,
  writeData,
  initializeData,
  getDatabaseStatus,
};
