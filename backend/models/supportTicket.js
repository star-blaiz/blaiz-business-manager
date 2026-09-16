const mongoose = require("mongoose");

const supportTicketSchema =
    new mongoose.Schema(
        {
            ticketNumber: {
                type: String,
                required: true,
                unique: true,
                trim: true,
                index: true
            },

            storeId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
},

ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
},

agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    default: null,
    index: true
},

requesterType: {
    type: String,
    enum: ["store", "agent"],
    default: "store",
    index: true
},

            subject: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200
            },

            category: {
                type: String,
                required: true,
                enum: [
                    "account",
                    "login",
                    "workers",
                    "inventory",
                    "sales",
                    "customers",
                    "receipts",
                    "premium",
                    "payments",
                    "referrals",
                    "earnings",
                    "technical",
                    "other"
                ]
            },

            priority: {
                type: String,
                enum: [
                    "low",
                    "normal",
                    "high",
                    "urgent"
                ],
                default: "normal"
            },

            status: {
                type: String,
                enum: [
                    "open",
                    "in_progress",
                    "waiting_for_user",
                    "resolved",
                    "closed"
                ],
                default: "open",
                index: true
            },

            assignedAdminId: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
                index: true
            },

            lastMessageAt: {
                type: Date,
                default: Date.now,
                index: true
            },

            resolvedAt: {
                type: Date,
                default: null
            },

            closedAt: {
                type: Date,
                default: null
            }
        },
        {
            timestamps: true,
            collection: "supporttickets"
        }
    );

supportTicketSchema.index({
    storeId: 1,
    status: 1,
    createdAt: -1
});

supportTicketSchema.index({
    ownerId: 1,
    status: 1,
    lastMessageAt: -1
});

supportTicketSchema.index({
    agentId: 1,
    status: 1,
    lastMessageAt: -1
});

module.exports =
    mongoose.model(
        "SupportTicket",
        supportTicketSchema
    );