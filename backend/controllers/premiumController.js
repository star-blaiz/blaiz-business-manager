const crypto = require("crypto");
const axios = require("axios");

const Store = require("../models/store");
const Subscription = require("../models/subscription");

const PREMIUM_PRICE = 30000;
const PREMIUM_DURATION_DAYS = 365;
const PREMIUM_AMOUNT_KOBO = PREMIUM_PRICE * 100;


/* =========================================
   PAYSTACK HEADERS
========================================= */

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


/* =========================================
   CALCULATE PREMIUM EXPIRY
========================================= */

const calculatePremiumDates = (
  existingExpiry = null
) => {

  const now = new Date();

  let startDate = now;

  if (
    existingExpiry &&
    new Date(existingExpiry) > now
  ) {

    startDate =
      new Date(existingExpiry);

  }

  const expiryDate =
    new Date(startDate);

  expiryDate.setDate(
    expiryDate.getDate() +
      PREMIUM_DURATION_DAYS
  );

  return {
    startDate,
    expiryDate,
  };

};


/* =========================================
   ACTIVATE PREMIUM
========================================= */

const activatePremium = async ({
  store,
  paymentReference,
  paymentId,
}) => {

  /*
   * Prevent duplicate processing.
   */

  const existingSubscription =
    await Subscription.findOne({
      paymentReference,
    });

  if (existingSubscription) {

    return {
      alreadyProcessed: true,
      subscription:
        existingSubscription,
    };

  }


  /*
   * Calculate subscription dates.
   *
   * If Premium is still active,
   * extend from the existing expiry.
   */

  const {
    startDate,
    expiryDate,
  } =
    calculatePremiumDates(
      store.subscriptionExpiry
    );


  /*
   * Create subscription record.
   */

  const subscription =
    await Subscription.create({

      storeId:
        store._id,

      plan:
        "premium",

      amount:
        PREMIUM_PRICE,

      currency:
        "NGN",

      status:
        "active",

      paymentReference,

      startDate,

      expiryDate,

    });


  /*
   * Update store.
   */

  store.plan =
    "premium";

  store.subscriptionStatus =
    "active";

  store.subscriptionStart =
    startDate;

  store.subscriptionExpiry =
    expiryDate;

  store.lastPremiumReference =
    paymentReference;

  if (paymentId) {

    store.lastPremiumPaymentId =
      String(paymentId);

  }

  store.premiumAmount =
    PREMIUM_PRICE;


  await store.save();


  return {
    alreadyProcessed: false,
    subscription,
  };

};


/* =========================================
   INITIALIZE PREMIUM PAYMENT
========================================= */

const initializePremiumPayment =
  async (req, res) => {

    try {

      const store =
        await Store.findOne({

          _id:
            req.user.storeId,

          ownerId:
            req.user._id,

        });


      if (!store) {

        return res.status(404).json({

          success: false,

          message:
            "Store not found.",

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
       * Create unique payment reference.
       */

      const reference =
        `BLAIZ-${store._id}-${Date.now()}-${crypto
          .randomBytes(4)
          .toString("hex")}`;


      /*
       * Optional callback URL.
       */

      const callbackUrl =
        process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/premium-payment`
          : undefined;


      const payload = {

        email:
          req.user.email,

        /*
         * ₦30,000 = 3,000,000 kobo.
         */

        amount:
          String(
            PREMIUM_AMOUNT_KOBO
          ),

        currency:
          "NGN",

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

        currency:
          "NGN",

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


/* =========================================
   VERIFY PREMIUM PAYMENT
========================================= */

const verifyPremiumPayment =
  async (req, res) => {

    try {

      const {
        reference,
      } = req.body;


      if (!reference) {

        return res.status(400).json({

          success: false,

          message:
            "Payment reference is required.",

        });

      }


      /*
       * Ask Paystack to verify
       * the transaction.
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
       * Payment must be successful.
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
       * Verify amount.
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
       * Verify currency.
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
       * Read metadata.
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

      } catch {

        metadata = {};

      }


      if (!metadata.storeId) {

        return res.status(400).json({

          success: false,

          message:
            "Payment store information is missing.",

        });

      }


      /*
       * Payment must belong to
       * the logged-in owner.
       */

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

          _id:
            metadata.storeId,

          ownerId:
            req.user._id,

        });


      if (!store) {

        return res.status(404).json({

          success: false,

          message:
            "Store associated with this payment was not found.",

        });

      }


      /*
       * Activate Premium.
       */

      const result =
        await activatePremium({

          store,

          paymentReference:
            paystackData.reference,

          paymentId:
            paystackData.id,

        });


      return res.status(200).json({

        success: true,

        paid: true,

        alreadyProcessed:
          result.alreadyProcessed,

        message:
          result.alreadyProcessed
            ? "Premium payment has already been processed."
            : "Premium activated successfully.",

        premium: {

          active: true,

          plan:
            "premium",

          amount:
            PREMIUM_PRICE,

          currency:
            "NGN",

          startDate:
            result.subscription.startDate,

          expiry:
            result.subscription.expiryDate,

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


/* =========================================
   PAYSTACK WEBHOOK
========================================= */

const paystackWebhook =
  async (req, res) => {

    try {

      /*
       * Paystack signature.
       */

      const signature =
        req.headers[
          "x-paystack-signature"
        ];


      if (!signature) {

        return res.status(401).json({

          success: false,

          message:
            "Missing Paystack signature.",

        });

      }


      /*
       * Calculate expected signature.
       */

      const hash =
        crypto
          .createHmac(
            "sha512",
            process.env.PAYSTACK_SECRET_KEY
          )
          .update(
  req.rawBody || JSON.stringify(req.body)
)
          .digest("hex");


      /*
       * Compare signatures securely.
       */

      if (
        hash !==
        signature
      ) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid Paystack signature.",

        });

      }


      const event =
        req.body;


      /*
       * We only process successful
       * charge events.
       */

      if (
        event.event !==
        "charge.success"
      ) {

        return res.status(200).json({

          success: true,

          message:
            "Event received.",

        });

      }


      const paystackData =
        event.data;


      if (!paystackData) {

        return res.status(400).json({

          success: false,

          message:
            "Payment data is missing.",

        });

      }


      /*
       * Verify amount.
       */

      if (
        Number(paystackData.amount) !==
        PREMIUM_AMOUNT_KOBO
      ) {

        return res.status(200).json({

          success: true,

          message:
            "Payment amount does not match Premium price.",

        });

      }


      /*
       * Verify currency.
       */

      if (
        paystackData.currency !==
        "NGN"
      ) {

        return res.status(200).json({

          success: true,

          message:
            "Invalid payment currency.",

        });

      }


      /*
       * Read metadata.
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

      } catch {

        metadata = {};

      }


      if (
        !metadata.storeId ||
        !metadata.ownerId
      ) {

        return res.status(200).json({

          success: true,

          message:
            "Payment metadata is incomplete.",

        });

      }


      /*
       * Find store.
       */

      const store =
        await Store.findOne({

          _id:
            metadata.storeId,

          ownerId:
            metadata.ownerId,

        });


      if (!store) {

        return res.status(200).json({

          success: true,

          message:
            "Store associated with payment was not found.",

        });

      }


      /*
       * Activate Premium.
       */

      const result =
        await activatePremium({

          store,

          paymentReference:
            paystackData.reference,

          paymentId:
            paystackData.id,

        });


      console.log(

        result.alreadyProcessed

          ? "Paystack webhook: payment already processed."

          : "Paystack webhook: Premium activated successfully."

      );


      /*
       * Always acknowledge successful
       * receipt of the webhook.
       */

      return res.status(200).json({

        success: true,

        message:
          result.alreadyProcessed
            ? "Payment already processed."
            : "Payment processed successfully.",

      });


    } catch (error) {

      console.error(

        "Paystack webhook error:",

        error

      );


      return res.status(500).json({

        success: false,

        message:
          "Webhook processing failed.",

      });

    }

  };


/* =========================================
   GET PREMIUM STATUS
========================================= */

const getPremiumStatus =
  async (req, res) => {

    try {

      const store =
        await Store.findOne({

          _id:
            req.user.storeId,

          ownerId:
            req.user._id,

        });


      if (!store) {

        return res.status(404).json({

          success: false,

          message:
            "Store not found.",

        });

      }


      const now =
        new Date();


      let active =
        false;


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

        store.plan =
          "free";

        store.subscriptionStatus =
          "expired";

        await store.save();


        /*
         * Mark the active subscription
         * as expired.
         */

        await Subscription.updateMany(

          {

            storeId:
              store._id,

            status:
              "active",

          },

          {

            $set: {
              status:
                "expired",
            },

          }

        );

      }


      const expiry =
        store.subscriptionExpiry
          ? new Date(
              store.subscriptionExpiry
            )
          : null;


      let daysRemaining =
        0;


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
                (
                  1000 *
                  60 *
                  60 *
                  24
                )

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

          currency:
            "NGN",

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


/* =========================================
   EXPORTS
========================================= */

module.exports = {

  initializePremiumPayment,

  verifyPremiumPayment,

  paystackWebhook,

  getPremiumStatus,

};