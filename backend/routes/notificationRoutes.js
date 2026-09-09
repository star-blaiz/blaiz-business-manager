const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

/* ==================================================
   NOTIFICATION ROUTES
================================================== */

/* Get current user's notifications */
router.get(
  "/",
  protect,
  getNotifications
);


/* Get unread notification count */
router.get(
  "/unread-count",
  protect,
  getUnreadNotificationCount
);


/* Mark one notification as read */
router.patch(
  "/:id/read",
  protect,
  markNotificationAsRead
);


/* Mark all notifications as read */
router.patch(
  "/read-all",
  protect,
  markAllNotificationsAsRead
);


module.exports = router;