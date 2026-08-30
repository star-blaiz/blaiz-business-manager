const express = require("express");

const {
  initializePremiumPayment,
  verifyPremiumPayment,
  getPremiumStatus,
} = require("../controllers/premiumController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

/*
 * Only the store owner can buy Premium.
 */

router.post(
  "/initialize",
  allowRoles("owner"),
  initializePremiumPayment
);

router.post(
  "/verify",
  allowRoles("owner"),
  verifyPremiumPayment
);

router.get(
  "/status",
  allowRoles("owner"),
  getPremiumStatus
);

module.exports = router;