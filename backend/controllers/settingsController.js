const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Store = require("../models/store");


/* =========================================
   GET SETTINGS
========================================= */

const getSettings = async (req, res) => {
  try {

    const user = await User.findById(
      req.user._id
    ).select(
      "name email phone accountType role status"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }


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


    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        role: user.role,
        status: user.status,
      },

      store: {
        id: store._id,
        storeName: store.storeName,
        phone: store.phone,
        email: store.email,
        address: store.address,
        businessType: store.businessType,
        logo: store.logo,
        plan: store.plan,
        subscriptionStatus:
          store.subscriptionStatus,
        subscriptionStart:
          store.subscriptionStart,
        subscriptionExpiry:
          store.subscriptionExpiry,
      },
    });

  } catch (error) {

    console.error(
      "Get settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load settings.",
    });
  }
};


/* =========================================
   UPDATE ACCOUNT
========================================= */

const updateAccount = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
    } = req.body;


    const user = await User.findById(
      req.user._id
    );


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }


    /* -----------------------------------------
       NAME
    ----------------------------------------- */

    if (name !== undefined) {

      const trimmedName =
        String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty.",
        });
      }

      user.name =
        trimmedName;
    }


    /* -----------------------------------------
       EMAIL
    ----------------------------------------- */

    if (email !== undefined) {

      const trimmedEmail =
        String(email).trim().toLowerCase();


      if (trimmedEmail) {

        const existingEmail =
          await User.findOne({
            email: trimmedEmail,
            _id: {
              $ne: user._id,
            },
          });


        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message:
              "This email is already being used by another account.",
          });
        }


        user.email =
          trimmedEmail;

      } else {

        user.email =
          undefined;

      }
    }


    /* -----------------------------------------
       PHONE
    ----------------------------------------- */

    if (phone !== undefined) {

      const trimmedPhone =
        String(phone).trim();


      if (trimmedPhone) {

        const existingPhone =
          await User.findOne({
            phone: trimmedPhone,
            _id: {
              $ne: user._id,
            },
          });


        if (existingPhone) {
          return res.status(409).json({
            success: false,
            message:
              "This phone number is already being used by another account.",
          });
        }


        user.phone =
          trimmedPhone;

      } else {

        user.phone =
          undefined;

      }
    }


    /*
     * The account must always have
     * either email or phone.
     */

    if (
      !user.email &&
      !user.phone
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Your account must have an email address or phone number.",
      });

    }


    await user.save();


    return res.status(200).json({
      success: true,

      message:
        "Account information updated successfully.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountType:
          user.accountType,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {

    console.error(
      "Update account error:",
      error
    );


    if (error.code === 11000) {

      return res.status(409).json({
        success: false,
        message:
          "The email or phone number is already in use.",
      });

    }


    return res.status(500).json({
      success: false,
      message:
        "Unable to update account information.",
    });
  }
};


/* =========================================
   CHANGE PASSWORD
========================================= */

const changePassword = async (
  req,
  res
) => {

  try {

    const {
      currentPassword,
      newPassword,
    } = req.body;


    if (
      !currentPassword ||
      !newPassword
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });

    }


    if (
      newPassword.length < 6
    ) {

      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 6 characters.",
      });

    }


    const user =
      await User.findById(
        req.user._id
      );


    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "Account not found.",
      });

    }


    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );


    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message:
          "Current password is incorrect.",
      });

    }


    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash
      );


    if (samePassword) {

      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });

    }


    user.passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );


    await user.save();


    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully.",
    });

  } catch (error) {

    console.error(
      "Change password error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Unable to change password.",
    });
  }
};


module.exports = {
  getSettings,
  updateAccount,
  changePassword,
};