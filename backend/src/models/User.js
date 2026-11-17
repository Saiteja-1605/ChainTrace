const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manufacturer", "distributor", "retailer"],
      index: true,
    },
    organization: { type: String, default: "Independent" },
    location: { type: String, default: "Global" },
    ethereumAddress: { type: String, default: "0x0000000000000000000000000000000000000000" },
    signerIndex: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
