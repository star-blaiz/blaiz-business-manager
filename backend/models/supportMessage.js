const mongoose = require("mongoose");

const supportMessageSchema =
    new mongoose.Schema(
        {
            ticketId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SupportTicket",
                required: true,
                index: true
            },

            senderType: {
                type: String,
                required: true,
                enum: ["user", "admin"]
            },

            senderId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                index: true
            },

            message: {
                type: String,
                required: true,
                trim: true,
                maxlength: 5000
            },

            isInternal: {
                type: Boolean,
                default: false
            },

            readByUser: {
                type: Boolean,
                default: false
            },

            readByAdmin: {
                type: Boolean,
                default: false
            },

            isAutomatic: {
    type: Boolean,
    default: false
}
        },
        {
            timestamps: true,
            collection: "supportmessages"
        }
    );

supportMessageSchema.index({
    ticketId: 1,
    createdAt: 1
});

supportMessageSchema.index({
    ticketId: 1,
    senderType: 1,
    createdAt: -1
});

module.exports =
    mongoose.model(
        "SupportMessage",
        supportMessageSchema
    );