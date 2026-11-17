const jwt = require("jsonwebtoken");
const { FILES, readData } = require("../services/storageService");

const JWT_SECRET = process.env.JWT_SECRET || "chaintrace_super_secure_demo_secret_2026";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Invalid or expired session token" });
    }

    // Attach fresh user info from local storage
    const users = readData(FILES.USERS, []);
    const liveUser = users.find((u) => u.id === user.id);
    if (!liveUser) {
      return res.status(401).json({ success: false, error: "User record no longer exists" });
    }

    req.user = {
      id: liveUser.id,
      name: liveUser.name,
      email: liveUser.email,
      role: liveUser.role,
      organization: liveUser.organization,
      location: liveUser.location,
      ethereumAddress: liveUser.ethereumAddress,
      signerIndex: liveUser.signerIndex,
    };

    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  authorizeRoles,
};
