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
    resetAgentPassword,
    deactivateAgentAccount,
    deleteAgentAccount,
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

/* =========================================
   AGENT SETTINGS
========================================= */

router.put(
    "/settings/password",
    protect,
    resetAgentPassword
);

router.put(
    "/settings/deactivate",
    protect,
    deactivateAgentAccount
);

/* =========================================
   PERMANENT ACCOUNT DELETION
========================================= */

router.delete(

    "/settings/delete",

    protect,

    deleteAgentAccount

);

module.exports = router;