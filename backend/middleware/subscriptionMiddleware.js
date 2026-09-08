/*const Store = require("../models/store");

const checkSubscription = async (req, res, next) => {
  try {
    if (!req.user || !req.user.storeId) {
      return res.status(403).json({
        success: false,
        message: "No store is associated with this account.",
      });
    }

    const store = await Store.findById(req.user.storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const now = new Date();

    if (
      store.plan === "premium" &&
      store.subscriptionExpiry &&
      store.subscriptionExpiry <= now
    ) {
      store.plan = "free";
      store.subscriptionStatus = "expired";

      await store.save();
    }

    req.store = store;

    next();
  } catch (error) {
    console.error("Subscription check error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check store subscription.",
    });
  }
};

module.exports = checkSubscription;*/

const Store = require("../models/store");
const Subscription = require("../models/subscription");

const checkSubscription = async (req, res, next) => {
  try {
    if (!req.user || !req.user.storeId) {
      return res.status(403).json({
        success: false,
        message: "No store is associated with this account.",
      });
    }

    const store = await Store.findById(req.user.storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const now = new Date();

    /*
     * Find the current premium subscription.
     * Subscription expiryDate is the authoritative expiry date.
     */
    const subscription = await Subscription.findOne({
  storeId: store._id,
  plan: {
    $in: [
      "monthly",
      "six-month",
      "annual",
      "premium",
    ],
  },
  status: "active",
}).sort({
  createdAt: -1,
});

/*
 * If there is an active subscription whose expiry
 * date has passed, expire it immediately.
 */
if (
  subscription &&
  subscription.expiryDate &&
  new Date(subscription.expiryDate) <= now
) {
  subscription.status = "expired";
  await subscription.save();
}

/*
 * Re-check for the latest valid subscription.
 */
const validSubscription = await Subscription.findOne({
  storeId: store._id,
  plan: {
    $in: [
      "monthly",
      "six-month",
      "annual",
      "premium",
    ],
  },
  status: "active",
  expiryDate: {
    $gt: now,
  },
}).sort({
  createdAt: -1,
});

/*
 * Synchronize Store with the actual subscription.
 */
if (validSubscription) {

  store.plan = "premium";

  store.subscriptionStatus = "active";

  store.subscriptionStart =
    validSubscription.startDate;

  store.subscriptionExpiry =
    validSubscription.expiryDate;

  await store.save();

} else if (
  store.plan === "premium" ||
  store.subscriptionStatus === "active"
) {

  store.plan = "free";

  store.subscriptionStatus = "expired";

  await store.save();
}

    req.store = store;

    next();
  } catch (error) {
    console.error("Subscription check error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check subscription status.",
    });
  }
};

module.exports = checkSubscription;