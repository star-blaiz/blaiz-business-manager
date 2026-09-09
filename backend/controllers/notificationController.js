const Notification = require("../models/notification");

/* ==================================================
   GET NOTIFICATIONS
================================================== */

async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const storeId = req.user.storeId;

    const notifications = await Notification.find({
      recipientId: userId,
      storeId: storeId,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      notifications,
    });

  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notifications.",
    });
  }
}


/* ==================================================
   GET UNREAD COUNT
================================================== */

async function getUnreadNotificationCount(req, res) {
  try {
    const userId = req.user._id;
    const storeId = req.user.storeId;

    const count = await Notification.countDocuments({
      recipientId: userId,
      storeId: storeId,
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });

  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to get notification count.",
    });
  }
}


/* ==================================================
   MARK ONE NOTIFICATION AS READ
================================================== */

async function markNotificationAsRead(req, res) {
  try {
    const userId = req.user._id;
    const storeId = req.user.storeId;

    const notificationId = req.params.id;

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientId: userId,
          storeId: storeId,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      notification,
    });

  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
}


/* ==================================================
   MARK ALL NOTIFICATIONS AS READ
================================================== */

async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user._id;
    const storeId = req.user.storeId;

    await Notification.updateMany(
      {
        recipientId: userId,
        storeId: storeId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read.",
    });

  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
}


/* ==================================================
   EXPORTS
================================================== */

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};