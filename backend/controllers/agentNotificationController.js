const AgentNotification =
  require("../models/agentNotification");


/* ==================================================
   GET AGENT NOTIFICATIONS
================================================== */

async function getAgentNotifications(
  req,
  res
) {

  try {

    if (!req.agent) {

      return res.status(401).json({

        success: false,

        message:
          "Agent authentication required.",

      });

    }


    const notifications =
      await AgentNotification.find({

        agentId:
          req.agent._id,

      })
      .sort({
        createdAt: -1,
      })
      .limit(100);


    return res.status(200).json({

      success: true,

      notifications,

    });


  } catch (error) {

    console.error(
      "Get Agent notifications error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load Agent notifications.",

    });

  }

}


/* ==================================================
   GET UNREAD AGENT NOTIFICATION COUNT
================================================== */

async function getUnreadAgentNotificationCount(
  req,
  res
) {

  try {

    if (!req.agent) {

      return res.status(401).json({

        success: false,

        message:
          "Agent authentication required.",

      });

    }


    const count =
      await AgentNotification.countDocuments({

        agentId:
          req.agent._id,

        isRead: false,

      });


    return res.status(200).json({

      success: true,

      count,

    });


  } catch (error) {

    console.error(
      "Get unread Agent notification count error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to get Agent notification count.",

    });

  }

}


/* ==================================================
   MARK ONE AGENT NOTIFICATION AS READ
================================================== */

async function markAgentNotificationAsRead(
  req,
  res
) {

  try {

    if (!req.agent) {

      return res.status(401).json({

        success: false,

        message:
          "Agent authentication required.",

      });

    }


    const notificationId =
      req.params.id;


    const notification =
      await AgentNotification.findOneAndUpdate(

        {

          _id:
            notificationId,

          agentId:
            req.agent._id,

        },

        {

          $set: {

            isRead: true,

            readAt:
              new Date(),

          },

        },

        {

          new: true,

        }

      );


    if (!notification) {

      return res.status(404).json({

        success: false,

        message:
          "Agent notification not found.",

      });

    }


    return res.status(200).json({

      success: true,

      notification,

    });


  } catch (error) {

    console.error(
      "Mark Agent notification as read error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to mark Agent notification as read.",

    });

  }

}


/* ==================================================
   MARK ALL AGENT NOTIFICATIONS AS READ
================================================== */

async function markAllAgentNotificationsAsRead(
  req,
  res
) {

  try {

    if (!req.agent) {

      return res.status(401).json({

        success: false,

        message:
          "Agent authentication required.",

      });

    }


    await AgentNotification.updateMany(

      {

        agentId:
          req.agent._id,

        isRead: false,

      },

      {

        $set: {

          isRead: true,

          readAt:
            new Date(),

        },

      }

    );


    return res.status(200).json({

      success: true,

      message:
        "All Agent notifications marked as read.",

    });


  } catch (error) {

    console.error(
      "Mark all Agent notifications as read error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to mark all Agent notifications as read.",

    });

  }

}


/* ==================================================
   CREATE AGENT NOTIFICATION
================================================== */

async function createAgentNotification({

  agentId,

  category,

  type,

  title,

  message,

  relatedId = null,

  reference = null,

  showToast = false,

  requiresAction = false,

  actionType = null,

}) {

  try {

    if (!agentId) {

      throw new Error(
        "Agent ID is required."
      );

    }


    const notification =
      await AgentNotification.create({

        agentId,

        category,

        type,

        title,

        message,

        relatedId,

        reference,

        showToast,

        requiresAction,

        actionType,

      });


    return notification;


  } catch (error) {

    console.error(
      "Create Agent notification error:",
      error
    );

    throw error;

  }

}


/* ==================================================
   EXPORTS
================================================== */

module.exports = {

  getAgentNotifications,

  getUnreadAgentNotificationCount,

  markAgentNotificationAsRead,

  markAllAgentNotificationsAsRead,

  createAgentNotification,

};