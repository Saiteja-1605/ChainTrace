const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    status: { type: String, default: "Confirmed" },
    transactionHash: { type: String, required: true, index: true },
    blockNumber: { type: Number },
    gasUsed: { type: String },
    from: { type: String },
    to: { type: String },
    actorName: { type: String },
    actorRole: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
