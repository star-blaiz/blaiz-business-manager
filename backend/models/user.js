const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    phone: {
      type: String,
      trim: true,
      sparse: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    accountType: {
      type: String,
      enum: ["owner", "worker"],
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "sales", "inventory"],
      required: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("User", userSchema);