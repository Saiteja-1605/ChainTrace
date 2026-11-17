const mongoose = require("mongoose");

const statusRecordSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    statusInt: { type: Number, required: true },
    location: { type: String, default: "Checkpoint" },
    remarks: { type: String, default: "" },
    actorId: { type: String },
    actorName: { type: String },
    actorRole: { type: String },
    actorOrg: { type: String },
    actorAddress: { type: String },
    transactionHash: { type: String },
    blockNumber: { type: Number },
    gasUsed: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    manufacturer: { type: String, required: true },
    manufacturingLocation: { type: String, required: true },
    manufacturingDate: { type: String, required: true },
    batchNumber: { type: String, required: true, index: true },
    quantity: { type: Number, default: 1 },
    expiryDate: { type: String, default: "N/A" },
    description: { type: String, default: "" },
    productHash: { type: String, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["Registered", "Manufactured", "Dispatched", "In Transit", "Received", "Delivered"],
      default: "Registered",
      index: true,
    },
    statusInt: { type: Number, default: 0 },
    manufacturerId: { type: String },
    currentCustodianId: { type: String },
    currentCustodianName: { type: String },
    currentCustodianRole: { type: String },
    currentCustodianAddress: { type: String },
    registrationTxHash: { type: String },
    registrationBlock: { type: Number },
    history: [statusRecordSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
