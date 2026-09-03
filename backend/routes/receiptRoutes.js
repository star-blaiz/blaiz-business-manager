const express = require("express");

const {
  verifyReceipt,
  getReceipt,
  getReceipts,
} = require("../controllers/receiptController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Only authenticated store users can verify receipts.
 * Customers cannot access receipt verification.
 */
router.post(
  "/verify",
  protect,
  verifyReceipt
);

/*
 * Store users can retrieve receipts
 * belonging to their own store.
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