const express = require("express");

const {
  requestAccountDeletion,
  verifyAccountDeletion,
  permanentlyDeleteAccount,
} = require("../controllers/accountDeletionController");

const router = express.Router();


/* =========================================
   REQUEST ACCOUNT DELETION OTP
========================================= */

router.post(
  "/request",
  requestAccountDeletion
);


/* =========================================
   VERIFY ACCOUNT DELETION OTP
========================================= */

router.post(
  "/verify",
  verifyAccountDeletion
);


/* =========================================
   PERMANENT ACCOUNT DELETION
========================================= */

router.post(
  "/delete",
  permanentlyDeleteAccount
);


module.exports = router;