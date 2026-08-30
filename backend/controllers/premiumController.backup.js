const crypto = require("crypto");
const axios = require("axios");

const Store = require("../models/store");

const PREMIUM_PRICE = 30000;
const PREMIUM_DURATION_DAYS = 365;
const PREMIUM_AMOUNT_KOBO = PREMIUM_PRICE * 100;

const getPaystackHeaders = () => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured."
    );
  }

  return {
    Authorization:
      `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

    "Content-Type":
      "application/json",
  };
};

const initializePremiumPayment = async (
  req,
  res
) => {
  try {
    const store = await Store.findOne({
      _id: req.user.storeId,
      ownerId: req.user._id,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    if (!req.user.email) {
      return res.status(400).json({
        success: false,
        message:
          "Your account needs an email address before Premium payment can continue.",
      });
    }

    /*
     * Create a unique reference.
     */

    const reference =
      `BLAIZ-${store._id}-${Date.now()}-${crypto
        .randomBytes(4)
        .toString("hex")}`;

    const callbackUrl =
      process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/premium-payment`
        : undefined;

    const payload = {
      email: req.user.email,

      /*
       * Paystack expects the amount
       * in the smallest currency unit.
       *
       * ₦30,000 = 3,000,000 kobo.
       */

      amount:
        String(PREMIUM_AMOUNT_KOBO),

      currency: "NGN",

      reference,

      metadata: JSON.stringify({
        storeId:
          String(store._id),

        ownerId:
          String(req.user._id),

        product:
          "Blaiz Business Manager Premium",

        duration:
          "365 days",
      }),
    };

    if (callbackUrl) {
      payload.callback_url =
        callbackUrl;
    }

    const response =
      await axios.post(
        "https://api.paystack.co/transaction/initialize",
        payload,
        {
          headers:
            getPaystackHeaders(),
        }
      );

    if (
      !response.data ||
      !response.data.status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to initialize Premium payment.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Premium payment initialized.",

      authorizationUrl:
        response.data.data
          .authorization_url,

      accessCode:
        response.data.data
          .access_code,

      reference:
        response.data.data
          .reference,

      amount:
        PREMIUM_PRICE,

      currency: "NGN",
    });
  } catch (error) {
    console.error(
      "Initialize Premium payment error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to initialize Premium payment.",
    });
  }
};

const verifyPremiumPayment = async (
  req,
  res
) => {
  try {
    const { reference } =
      req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference is required.",
      });
    }

    /*
     * Ask Paystack directly whether
     * the transaction succeeded.
     */

    const response =
      await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers:
            getPaystackHeaders(),
        }
      );

    const paystackData =
      response.data?.data;

    if (
      !response.data?.status ||
      !paystackData
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to verify payment.",
      });
    }

    /*
     * Payment must actually be successful.
     */

    if (
      paystackData.status !==
      "success"
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Premium payment was not successful.",
        paymentStatus:
          paystackData.status,
      });
    }

    /*
     * IMPORTANT:
     *
     * Verify the exact amount.
     *
     * ₦30,000 = 3,000,000 kobo.
     */

    if (
      Number(paystackData.amount) !==
      PREMIUM_AMOUNT_KOBO
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Payment amount does not match the Premium price.",
      });
    }

    /*
     * Verify currency too.
     */

    if (
      paystackData.currency !==
      "NGN"
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Invalid payment currency.",
      });
    }

    /*
     * Locate the store from metadata.
     */

    let metadata = {};

    try {
      if (
        typeof paystackData.metadata ===
        "string"
      ) {
        metadata =
          JSON.parse(
            paystackData.metadata
          );
      } else {
        metadata =
          paystackData.metadata ||
          {};
      }
    } catch (error) {
      metadata = {};
    }

    if (
      !metadata.storeId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment store information is missing.",
      });
    }

    if (
      String(metadata.ownerId) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This payment does not belong to the current store owner.",
      });
    }

    const store =
      await Store.findOne({
        _id: metadata.storeId,
        ownerId: req.user._id,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message:
          "Store associated with this payment was not found.",
      });
    }

    /*
     * Prevent a payment from being
     * processed twice.
     */

    if (
      store.lastPremiumReference ===
      paystackData.reference
    ) {
      return res.status(200).json({
        success: true,
        paid: true,
        alreadyProcessed: true,
        message:
          "Premium payment has already been processed.",
        premium: {
          active: true,
          expiry:
            store.subscriptionExpiry,
        },
      });
    }

    const now = new Date();

    /*
     * If Premium is still active,
     * extend from the current expiry.
     *
     * If it has expired, start from now.
     */

    let startDate = now;

    if (
      store.plan === "premium" &&
      store.subscriptionExpiry &&
      new Date(
        store.subscriptionExpiry
      ) > now
    ) {
      startDate =
        new Date(
          store.subscriptionExpiry
        );
    }

    const expiry =
      new Date(startDate);

    expiry.setDate(
      expiry.getDate() +
        PREMIUM_DURATION_DAYS
    );

    store.plan = "premium";

    store.subscriptionStatus =
      "active";

    store.subscriptionStart =
      now;

    store.subscriptionExpiry =
      expiry;

    store.lastPremiumReference =
      paystackData.reference;

    store.lastPremiumPaymentId =
      String(paystackData.id);

    store.premiumAmount =
      PREMIUM_PRICE;

    await store.save();

    return res.status(200).json({
      success: true,

      paid: true,

      message:
        "Premium activated successfully.",

      premium: {
        active: true,

        plan: "premium",

        amount:
          PREMIUM_PRICE,

        currency: "NGN",

        startDate:
          store.subscriptionStart,

        expiry:
          store.subscriptionExpiry,

        durationDays:
          PREMIUM_DURATION_DAYS,
      },
    });
  } catch (error) {
    console.error(
      "Verify Premium payment error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify Premium payment.",
    });
  }
};

const getPremiumStatus = async (
  req,
  res
) => {
  try {
    const store =
      await Store.findOne({
        _id: req.user.storeId,
        ownerId: req.user._id,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message:
          "Store not found.",
      });
    }

    const now = new Date();

    let active = false;

    if (
      store.plan === "premium" &&
      store.subscriptionExpiry &&
      new Date(
        store.subscriptionExpiry
      ) > now
    ) {
      active = true;
    }

    /*
     * Automatically lock expired Premium.
     */

    if (
      store.plan === "premium" &&
      !active
    ) {
      store.plan = "free";
      store.subscriptionStatus =
        "expired";

      await store.save();
    }

    const expiry =
      store.subscriptionExpiry
        ? new Date(
            store.subscriptionExpiry
          )
        : null;

    let daysRemaining = 0;

    if (
      active &&
      expiry
    ) {
      const difference =
        expiry.getTime() -
        now.getTime();

      daysRemaining =
        Math.max(
          0,
          Math.ceil(
            difference /
              (1000 * 60 * 60 * 24)
          )
        );
    }

    return res.status(200).json({
      success: true,

      premium: {
        active,

        plan:
          active
            ? "premium"
            : "free",

        price:
          PREMIUM_PRICE,

        currency: "NGN",

        expiry,

        daysRemaining,

        subscriptionStatus:
          active
            ? "active"
            : store.subscriptionStatus ||
              "inactive",
      },
    });
  } catch (error) {
    console.error(
      "Get Premium status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load Premium status.",
    });
  }
};

module.exports = {
  initializePremiumPayment,
  verifyPremiumPayment,
  getPremiumStatus,
};