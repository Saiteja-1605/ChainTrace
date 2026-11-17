const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { FILES, readData, writeData } = require("../services/storageService");
const { JWT_SECRET, authenticateToken, authorizeRoles } = require("../middleware/auth");

/**
 * Public demo accounts metadata for login page quick switcher
 */
router.get("/demo-accounts", (req, res) => {
  const users = readData(FILES.USERS, []);
  const publicAccounts = users.map((u) => ({
    email: u.email,
    role: u.role,
    name: u.name,
    organization: u.organization,
    location: u.location,
    ethereumAddress: u.ethereumAddress,
    demoPassword: "password123",
  }));
  res.json({ success: true, accounts: publicAccounts });
});

/**
 * Login endpoint
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const users = readData(FILES.USERS, []);
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Record audit log
    const auditLogs = readData(FILES.AUDIT_LOGS, []);
    auditLogs.push({
      id: `audit_${Date.now()}`,
      action: "USER_LOGIN",
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      details: `User logged in from ${req.ip || "local"}`,
      timestamp: new Date().toISOString(),
    });
    await writeData(FILES.AUDIT_LOGS, auditLogs);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        location: user.location,
        ethereumAddress: user.ethereumAddress,
        signerIndex: user.signerIndex,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server authentication error" });
  }
});

/**
 * Get current user
 */
router.get("/me", authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

/**
 * Get all users
 */
router.get("/users", authenticateToken, (req, res) => {
  const users = readData(FILES.USERS, []);
  const safeUsers = users.map((u) => {
    const { password, ...safe } = u;
    return safe;
  });
  res.json({ success: true, users: safeUsers });
});

/**
 * Create a new user (Admin only)
 */
router.post("/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role, organization, location, ethereumAddress } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const users = readData(FILES.USERS, []);
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, error: "Email is already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      organization: organization || "Independent",
      location: location || "Global",
      ethereumAddress: ethereumAddress || "0x0000000000000000000000000000000000000000",
      signerIndex: role === "manufacturer" ? 1 : role === "distributor" ? 2 : role === "retailer" ? 3 : 0,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeData(FILES.USERS, users);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
