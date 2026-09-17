const crypto = require("crypto");

const User = require("../models/user");
const Store = require("../models/store");
const Product = require("../models/product");
const Customer = require("../models/customer");
const Sale = require("../models/sale");
const Receipt = require("../models/receipt");
const AccountDeletion = require("../models/accountDeletion");

const sendEmail = require("../config/email");


/* =========================================
   REQUEST ACCOUNT DELETION OTP
========================================= */

const requestAccountDeletion = async (req, res) => {

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the email address associated with your Blaiz Business Manager account.",
      });
    }

    const user = await User.findOne({
      email,
    });

    /*
     * Do not reveal whether the email exists.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with that email address, a verification code has been sent.",
      });
    }

    /*
     * Only Store Owner accounts currently
     * support permanent account deletion.
     */
    if (
      user.accountType !== "owner" ||
      user.role !== "owner"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This account type cannot be permanently deleted through this page. Please contact Blaiz Business Manager support.",
      });
    }

    /*
     * Remove any previous deletion requests
     * for this user.
     */
    await AccountDeletion.deleteMany({
      userId: user._id,
    });

    /*
     * Generate a 6-digit OTP.
     */
    const otp =
      crypto
        .randomInt(100000, 1000000)
        .toString();

    /*
     * Hash the OTP before storing it.
     */
    const otpHash =
      crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    /*
     * OTP expires after 10 minutes.
     */
    const expiresAt =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    await AccountDeletion.create({
      userId: user._id,
      email: user.email,
      otpHash,
      expiresAt,
    });

    await sendEmail({
      to: user.email,

      subject:
        "Blaiz Business Manager Account Deletion Verification",

      text:
        `Your Blaiz Business Manager account deletion verification code is ${otp}. ` +
        `This code expires in 10 minutes. ` +
        `If you did not request account deletion, you can safely ignore this email.`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Blaiz Business Manager</h2>

          <p>
            You requested permanent deletion of your
            Blaiz Business Manager account.
          </p>

          <p>
            Your verification code is:
          </p>

          <div
            style="
              font-size: 30px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 20px 0;
            "
          >
            ${otp}
          </div>

          <p>
            This code expires in <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request account deletion,
            you can safely ignore this email.
          </p>

          <p>
            <strong>
              Account deletion is permanent and cannot be undone.
            </strong>
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with that email address, a verification code has been sent.",
    });

  } catch (error) {

    console.error(
      "Request account deletion error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process the deletion request right now. Please try again later.",
    });
  }
};


/* =========================================
   VERIFY ACCOUNT DELETION OTP
========================================= */

const verifyAccountDeletion = async (req, res) => {

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();

    const otp =
      String(req.body.otp || "")
        .trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your email address and verification code.",
      });
    }

    const deletionRequest =
      await AccountDeletion.findOne({
        email,
        verified: false,
      });

    if (!deletionRequest) {
      return res.status(400).json({
        success: false,
        message:
          "This verification request is invalid or has expired. Please request a new code.",
      });
    }

    if (
      deletionRequest.expiresAt <=
      new Date()
    ) {

      await AccountDeletion.deleteOne({
        _id: deletionRequest._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Your verification code has expired. Please request a new code.",
      });
    }

    if (deletionRequest.attempts >= 5) {

      await AccountDeletion.deleteOne({
        _id: deletionRequest._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new verification code.",
      });
    }

    const otpHash =
      crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    if (
      otpHash !==
      deletionRequest.otpHash
    ) {

      deletionRequest.attempts += 1;

      await deletionRequest.save();

      return res.status(400).json({
        success: false,
        message:
          "The verification code is incorrect. Please check the code and try again.",
      });
    }

    deletionRequest.verified = true;
    deletionRequest.verifiedAt = new Date();

    await deletionRequest.save();

    return res.status(200).json({
      success: true,
      message:
        "Your email has been verified. You can now permanently delete your account.",
    });

  } catch (error) {

    console.error(
      "Verify account deletion error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify your request right now. Please try again later.",
    });
  }
};


/* =========================================
   PERMANENTLY DELETE ACCOUNT
========================================= */

const permanentlyDeleteAccount = async (
  req,
  res
) => {

  const session =
    await Store.startSession();

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide the email address used for verification.",
      });
    }

    const deletionRequest =
      await AccountDeletion.findOne({
        email,
        verified: true,
      });

    if (!deletionRequest) {
      return res.status(403).json({
        success: false,
        message:
          "Your account deletion request has not been verified. Please verify your email first.",
      });
    }

    const user =
      await User.findOne({
        _id: deletionRequest.userId,
        email,
      });

    if (!user) {

      await AccountDeletion.deleteOne({
        _id: deletionRequest._id,
      });

      return res.status(404).json({
        success: false,
        message:
          "The account could not be found.",
      });
    }

    if (
      user.accountType !== "owner" ||
      user.role !== "owner"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This account type cannot be permanently deleted through this page.",
      });
    }

    const store =
      await Store.findOne({
        _id: user.storeId,
        ownerId: user._id,
      }).session(session);

    if (!store) {
      return res.status(404).json({
        success: false,
        message:
          "The store associated with this account could not be found.",
      });
    }

    const storeId = store._id;

    await session.withTransaction(
      async () => {

        await Product.deleteMany(
          { storeId },
          { session }
        );

        await Customer.deleteMany(
          { storeId },
          { session }
        );

        await Sale.deleteMany(
          { storeId },
          { session }
        );

        await Receipt.deleteMany(
          { storeId },
          { session }
        );

        await User.deleteMany(
          {
            storeId,
            accountType: "worker",
          },
          { session }
        );

        await Store.deleteOne(
          {
            _id: storeId,
          },
          { session }
        );

        await User.deleteOne(
          {
            _id: user._id,
            accountType: "owner",
            role: "owner",
          },
          { session }
        );
      }
    );

    await AccountDeletion.deleteMany({
      userId: user._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Your Blaiz Business Manager account and associated store data have been permanently deleted.",
    });

  } catch (error) {

    console.error(
      "Permanent account deletion error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete your account right now. Please try again later.",
    });

  } finally {

    await session.endSession();

  }
};


module.exports = {
  requestAccountDeletion,
  verifyAccountDeletion,
  permanentlyDeleteAccount,
};