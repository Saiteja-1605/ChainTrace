require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const storageService = require("./services/storageService");
const { initializeData } = storageService;
const blockchainService = require("./services/blockchainService");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const trackingRoutes = require("./routes/tracking");
const blockchainRoutes = require("./routes/blockchain");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const bc = await blockchainService.isConnected();
  const db = storageService.getDatabaseStatus();
  res.json({
    status: "online",
    service: "ChainTrace Supply Chain Backend",
    timestamp: new Date().toISOString(),
    database: db,
    blockchain: bc,
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Boot server
async function startServer() {
  await initializeData();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(` ChainTrace Backend Server running on http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();
