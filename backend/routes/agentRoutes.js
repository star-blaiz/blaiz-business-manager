const express = require("express");

const {
  registerAgent,
} = require("../controllers/agentController");

const router = express.Router();

/* =========================================
   AGENT REGISTRATION
========================================= */

router.post(
  "/register",
  registerAgent
);

module.exports = router;