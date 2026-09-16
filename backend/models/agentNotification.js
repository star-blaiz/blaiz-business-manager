const mongoose = require("mongoose");

const agentNotificationSchema = new mongoose.Schema(
  {
    /*
     * Agent who should receive the notification
     */
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    /*
     * Notification category
     *
     * Examples:
     * referral
     * commission
     * payout
     * account
     * security
     * store
     * premium
     * system
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
     * store_referred
     * commission_created
     * commission_approved
     * payout_created
     * payout_paid
     * payout_failed
     * account_approved
     * account_rejected
     * account_suspended
     * account_restored
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
     * Optional related document
     *
     * This can later contain:
     * - Store ID
     * - Commission ID
     * - Payout ID
     * - Other related record
     */
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    /*
     * Optional reference
     *
     * Examples:
     * referral code
     * payout reference
     * transaction reference
     */
    reference: {
      type: String,
      default: null,
      trim: true,
    },

    /*
     * Whether the Agent has read
     * the notification
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

    /*
     * Whether this notification
     * should trigger an immediate
     * in-app alert/toast
     *
     * Useful for events such as:
     * account suspension
     * account restoration
     * security alerts
     */
    showToast: {
      type: Boolean,
      default: false,
    },

    /*
     * Whether the notification requires
     * the Agent to take an action
     *
     * Example:
     * suspended account -> logout
     */
    requiresAction: {
      type: Boolean,
      default: false,
    },

    /*
     * Action associated with the notification
     *
     * Example:
     * logout
     * view_payout
     * view_commission
     */
    actionType: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


/*
 * Fast loading of an Agent's notifications
 */
agentNotificationSchema.index({
  agentId: 1,
  isRead: 1,
  createdAt: -1,
});


/*
 * Fast loading of recent Agent notifications
 */
agentNotificationSchema.index({
  agentId: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model(
    "AgentNotification",
    agentNotificationSchema
  );