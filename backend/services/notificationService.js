const Notification = require("../models/notification");
const User = require("../models/user");

/* ==================================================
   CREATE NOTIFICATION FOR ONE USER
================================================== */

async function createNotification({
  storeId,
  recipientId,
  actorId = null,
  category,
  type,
  title,
  message,
  relatedId = null,
  reference = null,
}) {
  try {
    if (!storeId) {
      throw new Error("Notification storeId is required.");
    }

    if (!recipientId) {
      throw new Error("Notification recipientId is required.");
    }

    if (!category) {
      throw new Error("Notification category is required.");
    }

    if (!type) {
      throw new Error("Notification type is required.");
    }

    if (!title) {
      throw new Error("Notification title is required.");
    }

    if (!message) {
      throw new Error("Notification message is required.");
    }

    const notification = await Notification.create({
      storeId,
      recipientId,
      actorId,
      category,
      type,
      title,
      message,
      relatedId,
      reference,
      isRead: false,
      readAt: null,
    });

    return notification;

  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
}


/* ==================================================
   GET USERS BELONGING TO STORE
================================================== */

async function getStoreUsers(storeId) {
  try {
    const users = await User.find({
      storeId: storeId,
      status: "active",
    }).select(
      "_id name email phone accountType role storeId"
    );

    return users;

  } catch (error) {
    console.error(
      "Get store users for notification error:",
      error
    );

    throw error;
  }
}


/* ==================================================
   CHECK WHETHER USER SHOULD RECEIVE CATEGORY
================================================== */

function userCanReceiveNotification(user, category) {

  /* OWNER RECEIVES EVERYTHING */
  if (user.accountType === "owner") {
    return true;
  }


  /* ONLY WORKERS CONTINUE */
  if (user.accountType !== "worker") {
    return false;
  }


  /* SALES WORKER */
  if (user.role === "sales") {

    return [
      "sale",
      "receipt",
      "verification",
      "customer",
    ].includes(category);
  }


  /* INVENTORY WORKER */
  if (user.role === "inventory") {

    return [
      "product",
      "inventory",
    ].includes(category);
  }


  return false;
}


/* ==================================================
   NOTIFY APPROPRIATE STORE USERS
================================================== */

async function notifyStoreUsers({
  storeId,
  actorId = null,
  category,
  type,
  title,
  message,
  relatedId = null,
  reference = null,
}) {
  try {

    const users = await getStoreUsers(storeId);

    const recipients = users.filter((user) =>
      userCanReceiveNotification(
        user,
        category
      )
    );


    if (!recipients.length) {
      return [];
    }


    const notifications = [];


    for (const user of recipients) {

      const notification =
        await createNotification({
          storeId,
          recipientId: user._id,
          actorId,
          category,
          type,
          title,
          message,
          relatedId,
          reference,
        });

      notifications.push(notification);
    }


    return notifications;

  } catch (error) {

    console.error(
      "Notify store users error:",
      error
    );

    throw error;
  }
}


/* ==================================================
   EXPORTS
================================================== */

module.exports = {
  createNotification,
  getStoreUsers,
  userCanReceiveNotification,
  notifyStoreUsers,
};