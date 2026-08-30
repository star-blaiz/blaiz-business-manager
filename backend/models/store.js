const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    businessType: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
      default: "blaiz-log.jpg",
    },

    plan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive",
    },

    subscriptionStart: {
      type: Date,
      default: null,
    },

    subscriptionExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Store", storeSchema);