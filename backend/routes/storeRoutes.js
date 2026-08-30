const express = require("express");

const {
  getMyStore,
  updateStore,
  deleteStore,
} = require("../controllers/storeController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


router.get(
  "/my-store",
  protect,
  getMyStore
);


router.put(
  "/my-store",
  protect,
  allowRoles("owner"),
  updateStore
);


/* =========================================
   DELETE STORE
========================================= */

router.delete(
  "/my-store",
  protect,
  allowRoles("owner"),
  deleteStore
);


module.exports = router;