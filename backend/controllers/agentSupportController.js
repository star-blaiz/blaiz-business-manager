const mongoose = require("mongoose");

const SupportTicket =
    require("../models/supportTicket");

const SupportMessage =
    require("../models/supportMessage");


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
   CREATE AGENT SUPPORT TICKET
========================================= */

const createAgentSupportTicket =
    async (req, res) => {

        try {

            if (!req.agent) {

                return res.status(401).json({
                    success: false,
                    message: "Agent authentication required."
                });

            }


            const {
                subject,
                category,
                message
            } = req.body;


            const cleanSubject =
                cleanString(subject);

            const cleanCategory =
                cleanString(category).toLowerCase();

            const cleanMessage =
                cleanString(message);


            if (
                !cleanSubject ||
                !cleanCategory ||
                !cleanMessage
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Subject, category and message are required."
                });

            }


            const allowedCategories = [
                "account",
                "login",
                "referrals",
                "earnings",
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
                    message: "Invalid support category."
                });

            }


            const ticketNumber =
                await generateTicketNumber();


            const ticket =
                await SupportTicket.create({

                    ticketNumber,

                    storeId: null,

                    ownerId: null,

                    agentId:
                        req.agent._id,

                    requesterType: "agent",

                    subject:
                        cleanSubject,

                    category:
                        cleanCategory,

                    priority: "normal",

                    status: "open",

                    lastMessageAt:
                        new Date()

                });


            const supportMessage =
                await SupportMessage.create({

                    ticketId:
                        ticket._id,

                    senderType: "user",

                    senderId:
                        req.agent._id,

                    message:
                        cleanMessage,

                    isInternal: false,

                    readByUser: true,

                    readByAdmin: false

                });


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

                    lastMessageAt:
                        ticket.lastMessageAt

                },

                supportMessage

            });

        } catch (error) {

            console.error(
                "Create Agent Support Ticket Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to create support ticket."

            });

        }

    };


/* =========================================
   GET AGENT SUPPORT TICKETS
========================================= */

const getAgentSupportTickets =
    async (req, res) => {

        try {

            if (!req.agent) {

                return res.status(401).json({
                    success: false,
                    message: "Agent authentication required."
                });

            }


            const tickets =
                await SupportTicket
                    .find({

                        agentId:
                            req.agent._id,

                        requesterType:
                            "agent"

                    })
                    .sort({

                        lastMessageAt: -1

                    });


            return res.json({

                success: true,

                tickets

            });

        } catch (error) {

            console.error(
                "Get Agent Support Tickets Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to load support tickets."

            });

        }

    };


/* =========================================
   GET SINGLE AGENT SUPPORT TICKET
========================================= */

const getAgentSupportTicket =
    async (req, res) => {

        try {

            if (!req.agent) {

                return res.status(401).json({
                    success: false,
                    message: "Agent authentication required."
                });

            }


            const {
                id
            } = req.params;


            if (
                !validObjectId(id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid support ticket ID."

                });

            }


            const ticket =
                await SupportTicket.findOne({

                    _id: id,

                    agentId:
                        req.agent._id,

                    requesterType:
                        "agent"

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


            return res.json({

                success: true,

                ticket,

                messages

            });

        } catch (error) {

            console.error(
                "Get Agent Support Ticket Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to load support ticket."

            });

        }

    };


/* =========================================
   REPLY TO AGENT SUPPORT TICKET
========================================= */

const replyToAgentSupportTicket =
    async (req, res) => {

        try {

            if (!req.agent) {

                return res.status(401).json({
                    success: false,
                    message: "Agent authentication required."
                });

            }


            const {
                id
            } = req.params;


            const cleanMessage =
                cleanString(
                    req.body.message
                );


            if (
                !validObjectId(id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid support ticket ID."

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

                    _id: id,

                    agentId:
                        req.agent._id,

                    requesterType:
                        "agent"

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


            const reply =
                await SupportMessage.create({

                    ticketId:
                        ticket._id,

                    senderType:
                        "user",

                    senderId:
                        req.agent._id,

                    message:
                        cleanMessage,

                    isInternal:
                        false,

                    readByUser:
                        true,

                    readByAdmin:
                        false

                });


            ticket.lastMessageAt =
                new Date();


            if (
                ticket.status ===
                "waiting_for_user"
            ) {

                ticket.status =
                    "in_progress";

            }


            ticket.resolvedAt =
                null;

            ticket.closedAt =
                null;


            await ticket.save();


            return res.json({

                success: true,

                message:
                    "Reply sent successfully.",

                reply,

                ticket: {

                    _id:
                        ticket._id,

                    ticketNumber:
                        ticket.ticketNumber,

                    status:
                        ticket.status,

                    lastMessageAt:
                        ticket.lastMessageAt

                }

            });

        } catch (error) {

            console.error(
                "Reply To Agent Support Ticket Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to send reply."

            });

        }

    };


/* =========================================
   CLOSE AGENT SUPPORT TICKET
========================================= */

const closeAgentSupportTicket =
    async (req, res) => {

        try {

            if (!req.agent) {

                return res.status(401).json({
                    success: false,
                    message: "Agent authentication required."
                });

            }


            const {
                id
            } = req.params;


            if (
                !validObjectId(id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid support ticket ID."

                });

            }


            const ticket =
                await SupportTicket.findOne({

                    _id: id,

                    agentId:
                        req.agent._id,

                    requesterType:
                        "agent"

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


            return res.json({

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
                "Close Agent Support Ticket Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to close support ticket."

            });

        }

    };


module.exports = {

    createAgentSupportTicket,

    getAgentSupportTickets,

    getAgentSupportTicket,

    replyToAgentSupportTicket,

    closeAgentSupportTicket

};