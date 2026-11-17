const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true },
    actorId: { type: String },
    actorName: { type: String },
    actorRole: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
