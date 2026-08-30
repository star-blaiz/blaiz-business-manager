const express = require("express");

const {
  addCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} = require("../controllers/customerController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

/*
 * OWNER + SALES
 * Can add customers.
 */
router.post(
  "/",
  allowRoles("owner", "sales"),
  addCustomer
);

/*
 * OWNER + SALES + INVENTORY
 * Can view customers.
 */
router.get(
  "/",
  getCustomers
);

/*
 * OWNER + SALES
 * Can search customers.
 */
router.get(
  "/search",
  allowRoles("owner", "sales"),
  searchCustomers
);

/*
 * OWNER + SALES + INVENTORY
 * Can view a single customer.
 */
router.get(
  "/:customerId",
  getCustomer
);

/*
 * OWNER + SALES
 * Can edit customers.
 */
router.put(
  "/:customerId",
  allowRoles("owner", "sales"),
  updateCustomer
);

/*
 * OWNER + INVENTORY
 * Can delete customers.
 */
router.delete(
  "/:customerId",
  allowRoles("owner", "inventory"),
  deleteCustomer
);

module.exports = router;