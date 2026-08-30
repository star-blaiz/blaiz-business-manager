const express = require("express");

const {
  registerOwner,
  login,
  getMe,
  deleteStore,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerOwner);

router.post("/login", login);

router.get("/me", protect, getMe);

/* =========================================
   PASSWORD RESET
========================================= */

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/verify-reset-otp",
  verifyResetOtp
);

router.post(
  "/reset-password",
  resetPassword
);

/*
 * Delete the owner's entire store and
 * all data belonging to that store.
 *
 * Owner only is enforced inside the controller.
 */
router.delete("/delete-store", protect, deleteStore);

module.exports = router;