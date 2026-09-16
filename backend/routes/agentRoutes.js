const express = require("express");
const protect =
  require("../middleware/authMiddleware");

const {
  registerAgent,
} = require("../controllers/agentController");

const {
  getAgentDashboard,
} = require("../controllers/agentDashboardController");

const {
    getAgentAccount,
    updateAgentProfile,
    updateAgentBankDetails,
} = require("../controllers/agentAccountController");

const router = express.Router();

/* =========================================
   AGENT REGISTRATION
========================================= */

router.post(
  "/register",
  registerAgent
);

/* =========================================
   AGENT DASHBOARD
========================================= */

router.get(
  "/dashboard",
  protect,
  getAgentDashboard
);

/* =========================================
   AGENT ACCOUNT
========================================= */

router.get(
    "/account",
    protect,
    getAgentAccount
);

router.put(
    "/account/profile",
    protect,
    updateAgentProfile
);

router.put(
    "/account/bank",
    protect,
    updateAgentBankDetails
);

module.exports = router;