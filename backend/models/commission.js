const mongoose = require("mongoose");

const commissionSchema =
    new mongoose.Schema(
        {
            agentId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "Agent",
                required: true,
                index: true
            },

            sourceType: {
                type: String,
                enum: [
                    "first_upgrade",
                    "renewal",
                    "bonus"
                ],
                required: true,
                index: true
            },

            plan: {
                type: String,
                enum: [
                    "monthly",
                    "sixMonths",
                    "yearly"
                ],
                default: null,
                index: true
            },

            paymentReference: {
                type: String,
                trim: true,
                default: null
            },

            storeId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "Store",
                default: null,
                index: true
            },

            paymentAmount: {
                type: Number,
                required: true,
                min: 0
            },

            commissionAmount: {
                type: Number,
                required: true,
                min: 0
            },

            status: {
                type: String,
                enum: [
                    "pending",
                    "approved",
                    "paid",
                    "withheld"
                ],
                default: "pending",
                index: true
            },

            withholdingReason: {
                type: String,
                trim: true,
                default: null
            },

            paidAt: {
                type: Date,
                default: null
            },

            paidBy: {
                type:
                    mongoose.Schema.Types.ObjectId,
                default: null
            },

            bonusNote: {
                type: String,
                trim: true,
                default: null
            },

            adminNote: {
                type: String,
                trim: true,
                default: null
            }
        },
        {
            timestamps: true,
            collection: "commissions"
        }
    );

module.exports =
    mongoose.model(
        "Commission",
        commissionSchema
    );