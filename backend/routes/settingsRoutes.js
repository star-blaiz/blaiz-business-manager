const express = require("express");

const {
  getSettings,
  updateAccount,
  changePassword,
} = require("../controllers/settingsController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


/* =========================================
   ALL SETTINGS ROUTES REQUIRE LOGIN
========================================= */

router.use(protect);


/* =========================================
   GET SETTINGS
========================================= */

router.get(
  "/",
  getSettings
);


/* =========================================
   UPDATE ACCOUNT
========================================= */

router.put(
  "/account",
  allowRoles("owner"),
  updateAccount
);


/* =========================================
   CHANGE PASSWORD
========================================= */

router.put(
  "/password",
  allowRoles("owner"),
  changePassword
);


module.exports = router;