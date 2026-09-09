const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    /*
     * The store this notification belongs to
     */
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    /*
     * The user who should receive the notification
     *
     * For example:
     * - Owner
     * - Sales worker
     * - Inventory worker
     */
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * User who performed the action
     */
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * Notification category
     *
     * Examples:
     * sale
     * customer
     * inventory
     * product
     * receipt
     * verification
     * worker
     * premium
     * security
     */
    category: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Notification type
     *
     * Examples:
     * sale_created
     * product_added
     * product_updated
     * customer_added
     * receipt_verified
     * premium_upgraded
     */
    type: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Notification title
     */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Notification message
     */
    message: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Optional ID of the related item
     *
     * Example:
     * sale ID
     * product ID
     * customer ID
     * receipt ID
     */
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    /*
     * Optional reference number
     *
     * Example:
     * Receipt number
     */
    reference: {
      type: String,
      default: null,
      trim: true,
    },

    /*
     * Whether the notification has been read
     */
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * When the notification was read
     */
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


/*
 * Useful indexes for fast notification loading
 */
notificationSchema.index({
  recipientId: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  storeId: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );