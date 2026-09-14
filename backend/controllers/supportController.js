const mongoose = require("mongoose");

const Store = require("../models/store");
const SupportTicket = require("../models/supportTicket");
const SupportMessage = require("../models/supportMessage");

const {
    notifyStoreUsers
} = require("../services/notificationService");


/* =========================================
   HELPERS
========================================= */

const cleanString = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
};


const validObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};


const generateTicketNumber = async () => {

    const latestTicket =
        await SupportTicket
            .findOne({})
            .sort({ createdAt: -1 })
            .select("ticketNumber");

    let nextNumber = 1;

    if (
        latestTicket &&
        latestTicket.ticketNumber
    ) {
        const match =
            latestTicket.ticketNumber.match(
                /^BLZ-(\d+)$/
            );

        if (match) {
            nextNumber =
                Number(match[1]) + 1;
        }
    }

    let ticketNumber =
        `BLZ-${String(nextNumber).padStart(6, "0")}`;

    /*
     * Extra protection against duplicate
     * ticket numbers.
     */
    while (
        await SupportTicket.exists({
            ticketNumber
        })
    ) {
        nextNumber++;

        ticketNumber =
            `BLZ-${String(nextNumber).padStart(6, "0")}`;
    }

    return ticketNumber;
};


/* =========================================
   CREATE SUPPORT TICKET
========================================= */

const createSupportTicket =
    async (req, res) => {

        try {

            const {
                subject,
                category,
                message
            } = req.body;


            const cleanSubject =
                cleanString(subject);

            const cleanCategory =
                cleanString(category);

            const cleanMessage =
                cleanString(message);


            if (!cleanSubject) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Support ticket subject is required."
                });
            }


            if (!cleanCategory) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Support ticket category is required."
                });
            }


            if (!cleanMessage) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Support ticket message is required."
                });
            }


            const allowedCategories = [
                "account",
                "login",
                "workers",
                "inventory",
                "sales",
                "customers",
                "receipts",
                "premium",
                "payments",
                "technical",
                "other"
            ];


            if (
                !allowedCategories.includes(
                    cleanCategory
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid support ticket category."
                });
            }


            const store =
                await Store.findById(
                    req.user.storeId
                );


            if (!store) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Store not found."
                });
            }


            const ticketNumber =
                await generateTicketNumber();


            const ticket =
                await SupportTicket.create({
                    ticketNumber,

                    storeId:
                        store._id,

                    ownerId:
                        store.ownerId,

                    subject:
                        cleanSubject,

                    category:
                        cleanCategory,

                    priority:
                        "normal",

                    status:
                        "open",

                    lastMessageAt:
                        new Date()
                });


            await SupportMessage.create({
                ticketId:
                    ticket._id,

                senderType:
                    "user",

                senderId:
                    req.user._id,

                message:
                    cleanMessage,

                isInternal:
                    false,

                readByUser:
                    true,

                readByAdmin:
                    false
            });


            /*
             * Notify all users of the store.
             */
            try {

                await notifyStoreUsers({
                    storeId:
                        store._id,

                    actorId:
                        req.user._id,

                    category:
                        "support",

                    type:
                        "support_ticket_created",

                    title:
                        "Support ticket created",

                    message:
                        `Support ticket ${ticketNumber} has been created.`,

                    relatedId:
                        ticket._id,

                    reference:
                        ticketNumber
                });

            } catch (notificationError) {

                console.error(
                    "Support ticket notification error:",
                    notificationError
                );
            }


            return res.status(201).json({
                success: true,

                message:
                    "Support ticket created successfully.",

                ticket: {
                    _id:
                        ticket._id,

                    ticketNumber:
                        ticket.ticketNumber,

                    subject:
                        ticket.subject,

                    category:
                        ticket.category,

                    priority:
                        ticket.priority,

                    status:
                        ticket.status,

                    createdAt:
                        ticket.createdAt,

                    lastMessageAt:
                        ticket.lastMessageAt
                }
            });

        } catch (error) {

            console.error(
                "Create support ticket error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to create support ticket."
            });
        }
    };


/* =========================================
   GET STORE SUPPORT TICKETS
========================================= */

const getSupportTickets =
    async (req, res) => {

        try {

            const tickets =
                await SupportTicket
                    .find({
                        storeId:
                            req.user.storeId
                    })
                    .sort({
                        lastMessageAt: -1
                    });


            return res.status(200).json({
                success: true,

                tickets,

                count:
                    tickets.length
            });

        } catch (error) {

            console.error(
                "Get support tickets error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load support tickets."
            });
        }
    };


/* =========================================
   GET ONE SUPPORT TICKET
========================================= */

const getSupportTicket =
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (!validObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid support ticket."
                });
            }


            const ticket =
                await SupportTicket.findOne({
                    _id:
                        id,

                    storeId:
                        req.user.storeId
                });


            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Support ticket not found."
                });
            }


            const messages =
                await SupportMessage
                    .find({
                        ticketId:
                            ticket._id,

                        isInternal:
                            false
                    })
                    .sort({
                        createdAt: 1
                    });


            /*
             * Mark admin messages as read
             * when the user opens the ticket.
             */
            await SupportMessage.updateMany(
                {
                    ticketId:
                        ticket._id,

                    senderType:
                        "admin",

                    isInternal:
                        false
                },
                {
                    $set: {
                        readByUser:
                            true
                    }
                }
            );


            return res.status(200).json({
                success: true,

                ticket,

                messages
            });

        } catch (error) {

            console.error(
                "Get support ticket error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load support ticket."
            });
        }
    };


/* =========================================
   REPLY TO SUPPORT TICKET
========================================= */

const replyToSupportTicket =
    async (req, res) => {

        try {

            const {
                id
            } = req.params;

            const {
                message
            } = req.body;


            const cleanMessage =
                cleanString(message);


            if (!validObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid support ticket."
                });
            }


            if (!cleanMessage) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Message is required."
                });
            }


            const ticket =
                await SupportTicket.findOne({
                    _id:
                        id,

                    storeId:
                        req.user.storeId
                });


            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Support ticket not found."
                });
            }


            if (
                ticket.status ===
                "closed"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This support ticket is closed."
                });
            }


            const newMessage =
                await SupportMessage.create({
                    ticketId:
                        ticket._id,

                    senderType:
                        "user",

                    senderId:
                        req.user._id,

                    message:
                        cleanMessage,

                    isInternal:
                        false,

                    readByUser:
                        true,

                    readByAdmin:
                        false
                });


            ticket.status =
                "open";

            ticket.lastMessageAt =
                new Date();

            ticket.resolvedAt =
                null;

            ticket.closedAt =
                null;


            await ticket.save();


            try {

                await notifyStoreUsers({
                    storeId:
                        ticket.storeId,

                    actorId:
                        req.user._id,

                    category:
                        "support",

                    type:
                        "support_user_replied",

                    title:
                        "Support ticket updated",

                    message:
                        `A new reply was added to ${ticket.ticketNumber}.`,

                    relatedId:
                        ticket._id,

                    reference:
                        ticket.ticketNumber
                });

            } catch (notificationError) {

                console.error(
                    "Support reply notification error:",
                    notificationError
                );
            }


            return res.status(201).json({
                success: true,

                message:
                    "Reply sent successfully.",

                reply:
                    newMessage,

                ticket: {
                    status:
                        ticket.status,

                    lastMessageAt:
                        ticket.lastMessageAt
                }
            });

        } catch (error) {

            console.error(
                "Reply to support ticket error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send support reply."
            });
        }
    };


/* =========================================
   CLOSE SUPPORT TICKET
========================================= */

const closeSupportTicket =
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (!validObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid support ticket."
                });
            }


            const ticket =
                await SupportTicket.findOne({
                    _id:
                        id,

                    storeId:
                        req.user.storeId
                });


            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Support ticket not found."
                });
            }


            ticket.status =
                "closed";

            ticket.closedAt =
                new Date();

            ticket.lastMessageAt =
                new Date();


            await ticket.save();


            return res.status(200).json({
                success: true,

                message:
                    "Support ticket closed successfully.",

                ticket: {
                    _id:
                        ticket._id,

                    ticketNumber:
                        ticket.ticketNumber,

                    status:
                        ticket.status,

                    closedAt:
                        ticket.closedAt
                }
            });

        } catch (error) {

            console.error(
                "Close support ticket error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to close support ticket."
            });
        }
    };


/* =========================================
   EXPORTS
========================================= */

module.exports = {

    createSupportTicket,

    getSupportTickets,

    getSupportTicket,

    replyToSupportTicket,

    closeSupportTicket

};