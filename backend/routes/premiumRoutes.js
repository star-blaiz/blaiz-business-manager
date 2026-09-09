const express = require("express");

const {
  initializePremiumPayment,
  verifyPremiumPayment,
  initializeMonthlyPremiumPayment,
  verifyMonthlyPremiumPayment,
  initializeSixMonthPremiumPayment,
  verifySixMonthPremiumPayment,
  getPremiumStatus,
  getPaymentHistory,
  paystackWebhook,
} = require("../controllers/premiumController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
 * ==========================================
 * PAYSTACK WEBHOOK
 * ==========================================
 *
 * IMPORTANT:
 * This route must NOT use the protect
 * middleware because Paystack calls it
 * directly.
 *
 * We will connect the actual webhook
 * controller here.
 */

/*
 * ==========================================
 * PAYSTACK WEBHOOK
 * ==========================================
 *
 * Paystack calls this endpoint directly.
 * No JWT authentication is required.
 */

router.post(
  "/webhook",
  paystackWebhook
);


/*
 * ==========================================
 * PROTECTED PREMIUM ROUTES
 * ==========================================
 */

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

router.post(
  "/monthly/initialize",
  allowRoles("owner"),
  initializeMonthlyPremiumPayment
);

router.post(
  "/monthly/verify",
  allowRoles("owner"),
  verifyMonthlyPremiumPayment
);

router.post(
  "/six-month/initialize",
  allowRoles("owner"),
  initializeSixMonthPremiumPayment
);

router.post(
  "/six-month/verify",
  allowRoles("owner"),
  verifySixMonthPremiumPayment
);

router.get(
  "/payment-history",
  allowRoles("owner"),
  getPaymentHistory
);

router.get(
  "/status",
  allowRoles("owner"),
  getPremiumStatus
);


module.exports = router;