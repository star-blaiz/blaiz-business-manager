const Store = require("../models/store");

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

module.exports = checkSubscription;