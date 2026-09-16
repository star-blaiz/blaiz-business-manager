const express = require("express");

const {
    getAgentSessionStatus
} = require(
    "../controllers/agentStatusController"
);

const router =
    express.Router();

/* =========================================
   GET AGENT SESSION STATUS

   This route intentionally does NOT use
   authMiddleware because it must still be
   accessible when the Agent is suspended.
========================================= */

router.get(
    "/session-status",
    getAgentSessionStatus
);

module.exports = router;