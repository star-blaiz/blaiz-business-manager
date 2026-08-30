const express = require("express");

const {
  verifyReceipt,
  getReceipt,
  getReceipts,
} = require("../controllers/receiptController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Public route.
 *
 * Customers do NOT need an account
 * to verify a receipt.
 */

router.post(
  "/verify",
  verifyReceipt
);

/*
 * Store users can retrieve their
 * own store's receipt.
 */
router.get(
  "/",
  protect,
  getReceipts
);

router.get(
  "/:receiptNumber",
  protect,
  getReceipt
);

module.exports = router;