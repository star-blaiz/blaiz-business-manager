const express = require("express");

const {
    createSupportTicket,
    getSupportTickets,
    getSupportTicket,
    replyToSupportTicket,
    closeSupportTicket
} = require("../controllers/supportController");

const protect =
    require("../middleware/authMiddleware");

const router =
    express.Router();


/* =========================================
   SUPPORT TICKETS
========================================= */

router.post(
    "/",
    protect,
    createSupportTicket
);


router.get(
    "/",
    protect,
    getSupportTickets
);


router.get(
    "/:id",
    protect,
    getSupportTicket
);


router.post(
    "/:id/reply",
    protect,
    replyToSupportTicket
);


router.patch(
    "/:id/close",
    protect,
    closeSupportTicket
);


module.exports =
    router;