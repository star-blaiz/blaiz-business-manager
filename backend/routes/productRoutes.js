const express = require("express");

const {
  addProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStockProducts,
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

/*
 * Both owner and inventory workers
 * can manage inventory.
 */

router.post(
  "/",
  allowRoles("owner", "inventory"),
  addProduct
);

router.get(
  "/",
  getProducts
);

router.get(
  "/low-stock",
  getLowStockProducts
);

router.get(
  "/:productId",
  getProduct
);

router.put(
  "/:productId",
  allowRoles("owner", "inventory"),
  updateProduct
);

router.delete(
  "/:productId",
  allowRoles("owner", "inventory"),
  deleteProduct
);

router.patch(
  "/:productId/stock",
  allowRoles("owner", "inventory"),
  adjustStock
);

module.exports = router;