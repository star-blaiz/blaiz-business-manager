const express = require("express");

const {
  createSale,
  getSales,
  getSale,
} = require("../controllers/saleController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

/*
 * OWNER + SALES
 * Can make/record sales.
 */
router.post(
  "/",
  allowRoles("owner", "sales"),
  createSale
);

/*
 * OWNER + SALES
 * Can view sales.
 */
router.get(
  "/",
  allowRoles("owner", "sales"),
  getSales
);

/*
 * OWNER + SALES
 * Can view individual sales.
 */
router.get(
  "/:saleId",
  allowRoles("owner", "sales"),
  getSale
);

module.exports = router;