const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
      unique: true,
    },

    receiptNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customerName: {
      type: String,
      default: "Walk-in Customer",
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
    },

    debt: {
      type: Number,
      default: 0,
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.index(
  { storeId: 1, receiptNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);