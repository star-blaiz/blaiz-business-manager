const express = require("express");

const {
    createAgentSupportTicket,
    getAgentSupportTickets,
    getAgentSupportTicket,
    replyToAgentSupportTicket,
    closeAgentSupportTicket
} = require("../controllers/agentSupportController");

const protect =
    require("../middleware/authMiddleware");

const router =
    express.Router();


/* =========================================
   AGENT SUPPORT TICKETS
========================================= */

router.post(
    "/",
    protect,
    createAgentSupportTicket
);


router.get(
    "/",
    protect,
    getAgentSupportTickets
);


router.get(
    "/:id",
    protect,
    getAgentSupportTicket
);


router.post(
    "/:id/reply",
    protect,
    replyToAgentSupportTicket
);


router.patch(
    "/:id/close",
    protect,
    closeAgentSupportTicket
);


module.exports =
    router;