const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");

const PasswordReset = require("../models/passwordReset");
const sendEmail = require("../config/email");

const User = require("../models/user");
const Store = require("../models/store");
const Product = require("../models/product");
const Customer = require("../models/customer");
const Sale = require("../models/sale");
const Receipt = require("../models/receipt");
const Subscription = require("../models/subscription");
const ActivityLog = require("../models/activitylog");

const generateToken = require("../utils/generateToken");


const normalizeIdentifier = (value) => {
  if (!value) return "";

  return value.trim().toLowerCase();
};


/* =========================================
   REGISTER OWNER
========================================= */

const registerOwner = async (req, res) => {

  let owner = null;

  try {

    const {
      name,
      email,
      phone,
      password,
      storeName,
      storePhone,
      storeEmail,
      storeAddress,
      businessType,
    } = req.body;


    /* -----------------------------------------
       BASIC VALIDATION
    ----------------------------------------- */

    if (!name || !password || !storeName) {

      return res.status(400).json({
        success: false,
        message:
          "Name, password and store name are required.",
      });
    }


    if (!email && !phone) {

      return res.status(400).json({
        success: false,
        message:
          "Email or phone number is required.",
      });
    }


    if (password.length < 6) {

      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters.",
      });
    }


    /* -----------------------------------------
       NORMALIZE USER DETAILS
    ----------------------------------------- */

    const normalizedEmail =
      email
        ? normalizeIdentifier(email)
        : undefined;


    const normalizedPhone =
      phone
        ? phone.trim()
        : undefined;


    /* -----------------------------------------
       CHECK EXISTING ACCOUNT
    ----------------------------------------- */

    const existingUserQuery = [];


    if (normalizedEmail) {

      existingUserQuery.push({
        email: normalizedEmail,
      });

    }


    if (normalizedPhone) {

      existingUserQuery.push({
        phone: normalizedPhone,
      });

    }


    const existingUser =
      await User.findOne({
        $or: existingUserQuery,
      });


    if (existingUser) {

      return res.status(409).json({
        success: false,
        message:
          "An account with these details already exists.",
      });

    }


    /* -----------------------------------------
       PASSWORD HASH
    ----------------------------------------- */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );


    /* -----------------------------------------
       CREATE OWNER
    ----------------------------------------- */

    owner =
      await User.create({

        name:
          name.trim(),

        email:
          normalizedEmail,

        phone:
          normalizedPhone,

        passwordHash,

        accountType:
          "owner",

        role:
          "owner",

        storeId:
          null,

        status:
          "active",
      });


    /* -----------------------------------------
       CREATE STORE
    ----------------------------------------- */

    const storeEmailValue =
      storeEmail &&
      storeEmail.trim()
        ? normalizeIdentifier(
            storeEmail
          )
        : undefined;


    const store =
      await Store.create({

        ownerId:
          owner._id,

        storeName:
          storeName.trim(),

        phone:
          storePhone &&
          storePhone.trim()
            ? storePhone.trim()
            : undefined,

        /*
         * IMPORTANT:
         * Do NOT save an empty string.
         */

        email:
          storeEmailValue,

        address:
          storeAddress &&
          storeAddress.trim()
            ? storeAddress.trim()
            : undefined,

        businessType:
          businessType &&
          businessType.trim()
            ? businessType.trim()
            : undefined,

        logo:
          "blaiz-log.jpg",

        plan:
          "free",

        subscriptionStatus:
          "inactive",
      });


    /* -----------------------------------------
       CONNECT OWNER TO STORE
    ----------------------------------------- */

    owner.storeId =
      store._id;

    await owner.save();


    /* -----------------------------------------
       CREATE TOKEN
    ----------------------------------------- */

    const token =
      generateToken(owner);


    return res.status(201).json({

      success: true,

      message:
        "Account and store created successfully.",

      token,

      user: {

        id:
          owner._id,

        name:
          owner.name,

        email:
          owner.email,

        phone:
          owner.phone,

        accountType:
          owner.accountType,

        role:
          owner.role,

        storeId:
          owner.storeId,
      },

      store: {

        id:
          store._id,

        storeName:
          store.storeName,

        plan:
          store.plan,

        subscriptionStatus:
          store.subscriptionStatus,
      },

    });


  } catch (error) {

    console.error(
      "Register owner error:",
      error
    );


    /*
     * -----------------------------------------
     * CLEAN UP PARTIAL OWNER
     * -----------------------------------------
     *
     * If the owner was created but the store
     * failed, remove the owner so we don't
     * leave an incomplete account behind.
     */

    if (owner) {

      try {

        await User.findByIdAndDelete(
          owner._id
        );

        console.log(
          "Partial owner account removed."
        );

      } catch (cleanupError) {

        console.error(
          "Owner cleanup error:",
          cleanupError
        );

      }

    }


    /* -----------------------------------------
       DUPLICATE KEY ERROR
    ----------------------------------------- */

    if (error.code === 11000) {

      return res.status(409).json({

        success: false,

        message:
          "Some of the account or store details already exist.",
      });

    }


    return res.status(500).json({

      success: false,

      message:
        "Unable to create account.",
    });

  }
};


/* =========================================
   LOGIN
========================================= */

const login = async (req, res) => {

  try {

    const {
      identifier,
      password,
    } = req.body;


    if (
      !identifier ||
      !password
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Login details and password are required.",
      });

    }


    const normalizedIdentifier =
      normalizeIdentifier(
        identifier
      );


    const user =
      await User.findOne({

        $or: [

          {
            email:
              normalizedIdentifier,
          },

          {
            phone:
              identifier.trim(),
          },

        ],

      });


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid login details or password.",
      });

    }


    const passwordMatch =
      await bcrypt.compare(
        password,
        user.passwordHash
      );


    if (!passwordMatch) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid login details or password.",
      });

    }


    if (
      user.status !==
      "active"
    ) {

      return res.status(403).json({

        success: false,

        message:
          "This account is currently inactive.",
      });

    }


    const store =
      user.storeId
        ? await Store.findById(
            user.storeId
          )
        : null;


    if (
      user.accountType ===
        "worker" &&
      !store
    ) {

      return res.status(403).json({

        success: false,

        message:
          "Worker store could not be found.",
      });

    }


    /* -----------------------------------------
       CHECK PREMIUM EXPIRY
    ----------------------------------------- */

    if (store) {

      const now =
        new Date();


      if (
        store.plan ===
          "premium" &&
        store.subscriptionExpiry &&
        store.subscriptionExpiry <=
          now
      ) {

        store.plan =
          "free";

        store.subscriptionStatus =
          "expired";

        await store.save();

      }


      /*
       * Workers cannot access the store
       * when Premium has expired.
       */

      if (
        user.accountType ===
          "worker" &&
        store.plan !==
          "premium"
      ) {

        return res.status(403).json({

          success: false,

          code:
            "SUBSCRIPTION_REQUIRED",

          message:
            "This store's Premium subscription has expired. The owner must renew the subscription before workers can access the store.",
        });

      }

    }


    user.lastLogin =
      new Date();

    await user.save();


    const token =
      generateToken(user);


    return res.status(200).json({

      success: true,

      message:
        "Login successful.",

      token,

      user: {

        id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        phone:
          user.phone,

        accountType:
          user.accountType,

        role:
          user.role,

        storeId:
          user.storeId,
      },


      store:
        store
          ? {

              id:
                store._id,

              storeName:
                store.storeName,

              plan:
                store.plan,

              subscriptionStatus:
                store.subscriptionStatus,

              subscriptionExpiry:
                store.subscriptionExpiry,

            }

          : null,

    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to log in.",
    });

  }

};


/* =========================================
   GET CURRENT USER
========================================= */

const getMe = async (req, res) => {

  try {

    const user =
      req.user;


    const store =
      user.storeId
        ? await Store.findById(
            user.storeId
          )
        : null;


    return res.status(200).json({

      success: true,

      user: {

        id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        phone:
          user.phone,

        accountType:
          user.accountType,

        role:
          user.role,

        storeId:
          user.storeId,

      },

      store,

    });

  } catch (error) {

    console.error(
      "Get current user error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to load account information.",
    });

  }

};

/* =========================================
   FORGOT PASSWORD - SEND OTP
========================================= */

const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;


    if (!email) {

      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });

    }


    const normalizedEmail =
      normalizeIdentifier(email);


    const user =
      await User.findOne({
        email: normalizedEmail,
      });


    /*
     * Do not reveal whether an email
     * belongs to an account.
     */

    if (!user) {

      return res.status(200).json({
        success: true,
        message:
          "If an account exists with that email, a password reset OTP has been sent.",
      });

    }


    /*
     * Remove any previous reset requests
     * belonging to this user.
     */

    await PasswordReset.deleteMany({
      userId: user._id,
    });


    /*
     * Generate a secure 6-digit OTP.
     */

    const otp =
      crypto
        .randomInt(100000, 1000000)
        .toString();


    /*
     * Store only a hash of the OTP.
     */

    const otpHash =
      crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");


    /*
     * OTP expires after exactly 5 minutes.
     */

    const expiresAt =
      new Date(
        Date.now() +
        5 * 60 * 1000
      );


    await PasswordReset.create({

      userId:
        user._id,

      email:
        normalizedEmail,

      otpHash,

      expiresAt,

      attempts:
        0,

      verified:
        false,

    });


    /*
     * Send OTP to the user's email.
     */

    await sendEmail({

      to:
        normalizedEmail,

      subject:
        "Blaiz Business Manager - Password Reset OTP",

      text:
        `Your Blaiz Business Manager password reset OTP is ${otp}. This OTP will expire in 5 minutes. If you did not request a password reset, please ignore this email.`,

      html:
        `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">

          <h2>
            Blaiz Business Manager
          </h2>

          <p>
            You requested to reset your password.
          </p>

          <p>
            Your password reset OTP is:
          </p>

          <h1 style="letter-spacing: 5px;">
            ${otp}
          </h1>

          <p>
            This OTP will expire in
            <strong>5 minutes</strong>.
          </p>

          <p>
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

        </div>
        `,

    });


    return res.status(200).json({

      success: true,

      message:
        "If an account exists with that email, a password reset OTP has been sent.",

    });


  } catch (error) {

    console.error(
      "Forgot password error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to send password reset OTP. Please try again.",

    });

  }

};

/* =========================================
   VERIFY PASSWORD RESET OTP
========================================= */

const verifyResetOtp = async (req, res) => {

  try {

    const {
      email,
      otp,
    } = req.body;


    if (!email || !otp) {

      return res.status(400).json({

        success: false,

        message:
          "Email and OTP are required.",

      });

    }


    const normalizedEmail =
      normalizeIdentifier(email);


    const resetRequest =
      await PasswordReset.findOne({

        email:
          normalizedEmail,

        verified:
          false,

      });


    if (!resetRequest) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid or expired OTP.",

      });

    }


    /*
     * Check whether the OTP has expired.
     */

    if (
      resetRequest.expiresAt <=
      new Date()
    ) {

      await PasswordReset.deleteOne({

        _id:
          resetRequest._id,

      });


      return res.status(400).json({

        success: false,

        message:
          "This OTP has expired. Please request a new one.",

      });

    }


    /*
     * Limit incorrect OTP attempts.
     */

    if (
      resetRequest.attempts >= 5
    ) {

      await PasswordReset.deleteOne({

        _id:
          resetRequest._id,

      });


      return res.status(429).json({

        success: false,

        message:
          "Too many incorrect attempts. Please request a new OTP.",

      });

    }


    /*
     * Hash the OTP entered by the user.
     */

    const otpHash =
      crypto
        .createHash("sha256")
        .update(
          otp.toString().trim()
        )
        .digest("hex");


    /*
     * Compare the entered OTP
     * with the stored hash.
     */

    if (
      otpHash !==
      resetRequest.otpHash
    ) {

      resetRequest.attempts += 1;

      await resetRequest.save();


      return res.status(400).json({

        success: false,

        message:
          "Incorrect OTP.",

      });

    }


    /*
     * OTP is correct.
     */

    resetRequest.verified =
      true;

    resetRequest.verifiedAt =
      new Date();

    await resetRequest.save();


    return res.status(200).json({

      success: true,

      message:
        "OTP verified successfully.",

    });


  } catch (error) {

    console.error(
      "Verify reset OTP error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to verify OTP. Please try again.",

    });

  }

};

/* =========================================
   RESET PASSWORD
========================================= */

const resetPassword = async (req, res) => {

  try {

    const {
      email,
      newPassword,
    } = req.body;


    if (!email || !newPassword) {

      return res.status(400).json({

        success: false,

        message:
          "Email and new password are required.",

      });

    }


    if (newPassword.length < 6) {

      return res.status(400).json({

        success: false,

        message:
          "New password must contain at least 6 characters.",

      });

    }


    const normalizedEmail =
      normalizeIdentifier(email);


    /*
     * Find the OTP verification record.
     */

    const resetRequest =
      await PasswordReset.findOne({

        email:
          normalizedEmail,

        verified:
          true,

      });


    if (!resetRequest) {

      return res.status(400).json({

        success: false,

        message:
          "Please verify your OTP before resetting your password.",

      });

    }


    /*
     * Make sure the original OTP
     * has not expired.
     */

    if (
      resetRequest.expiresAt <=
      new Date()
    ) {

      await PasswordReset.deleteOne({

        _id:
          resetRequest._id,

      });


      return res.status(400).json({

        success: false,

        message:
          "Your OTP verification has expired. Please request a new OTP.",

      });

    }


    /*
     * Find the account.
     */

    const user =
      await User.findOne({

        _id:
          resetRequest.userId,

        email:
          normalizedEmail,

      });


    if (!user) {

      return res.status(404).json({

        success: false,

        message:
          "Account not found.",

      });

    }


    /*
     * Hash the new password.
     */

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );


    /*
     * Update the password.
     */

    user.passwordHash =
      passwordHash;


    /*
     * Update the account login
     * timestamp is NOT necessary here.
     */

    await user.save();


    /*
     * Delete the reset request so
     * the same OTP cannot be reused.
     */

    await PasswordReset.deleteOne({

      _id:
        resetRequest._id,

    });


    return res.status(200).json({

      success: true,

      message:
        "Password reset successfully. You can now log in with your new password.",

    });


  } catch (error) {

    console.error(
      "Reset password error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to reset password. Please try again.",

    });

  }

};

/* =========================================
   DELETE STORE
========================================= */

const deleteStore = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    /*
     * Only the store owner can delete
     * the entire store.
     */

    if (
      req.user.accountType !== "owner" ||
      req.user.role !== "owner"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the store owner can delete the store.",
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete the store.",
      });
    }

    /*
     * Get the owner account.
     */

    const owner = await User.findById(req.user._id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner account not found.",
      });
    }

    /*
     * Verify the owner's password.
     */

    const passwordMatch = await bcrypt.compare(
      password,
      owner.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    /*
     * The owner must have a store.
     */

    if (!owner.storeId) {
      return res.status(404).json({
        success: false,
        message: "No store is associated with this account.",
      });
    }

    const storeId = owner.storeId;

    const store = await Store.findOne({
      _id: storeId,
      ownerId: owner._id,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    /*
     * =========================================
     * DELETE EVERYTHING IN ONE TRANSACTION
     * =========================================
     */

    await session.withTransaction(async () => {

      /*
       * Delete all products.
       */

      await Product.deleteMany(
        {
          storeId,
        },
        {
          session,
        }
      );

      /*
       * Delete all customers.
       */

      await Customer.deleteMany(
        {
          storeId,
        },
        {
          session,
        }
      );

      /*
       * Delete all sales.
       */

      await Sale.deleteMany(
        {
          storeId,
        },
        {
          session,
        }
      );

      /*
       * Delete all receipts.
       */

      await Receipt.deleteMany(
        {
          storeId,
        },
        {
          session,
        }
      );

      /*
       * Delete all subscriptions.
       */

      await Subscription.deleteMany(
        {
          storeId,
        },
        {
          session,
        }
      );

      /*
       * Delete all activity logs.
       */

      await ActivityLog.deleteMany(
        {
          storeId,
        },
        {
          session,
        }
      );

      /*
       * Delete all workers belonging
       * to this store.
       */

      await User.deleteMany(
        {
          storeId,
          accountType: "worker",
        },
        {
          session,
        }
      );

      /*
       * Delete the owner account.
       */

      await User.deleteOne(
        {
          _id: owner._id,
        },
        {
          session,
        }
      );

      /*
       * Finally delete the store.
       */

      await Store.deleteOne(
        {
          _id: storeId,
          ownerId: owner._id,
        },
        {
          session,
        }
      );
    });

    /*
     * =========================================
     * SUCCESS
     * =========================================
     */

    return res.status(200).json({
      success: true,
      message:
        "Your store and all associated data have been permanently deleted.",
    });

  } catch (error) {

    console.error(
      "Delete store error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the store. No data was deleted.",
    });

  } finally {

    await session.endSession();

  }
};


/* =========================================
   EXPORTS
========================================= */

module.exports = {

  registerOwner,

  login,

  getMe,

  deleteStore,

  forgotPassword,

  verifyResetOtp,

  resetPassword,
};