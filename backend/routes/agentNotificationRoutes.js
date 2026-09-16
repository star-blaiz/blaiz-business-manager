const express = require("express");

const {
  getAgentNotifications,
  getUnreadAgentNotificationCount,
  markAgentNotificationAsRead,
  markAllAgentNotificationsAsRead,
} = require("../controllers/agentNotificationController");

const protect =
  require("../middleware/authMiddleware");

const router =
  express.Router();


/* =========================================
   GET AGENT NOTIFICATIONS
========================================= */

router.get(
  "/",
  protect,
  getAgentNotifications
);


/* =========================================
   GET UNREAD AGENT NOTIFICATION COUNT
========================================= */

router.get(
  "/unread-count",
  protect,
  getUnreadAgentNotificationCount
);


/* =========================================
   MARK ONE NOTIFICATION AS READ
========================================= */

router.patch(
  "/:id/read",
  protect,
  markAgentNotificationAsRead
);


/* =========================================
   MARK ALL NOTIFICATIONS AS READ
========================================= */

router.patch(
  "/read-all",
  protect,
  markAllAgentNotificationsAsRead
);


module.exports = router;