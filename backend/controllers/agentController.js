const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Agent = require("../models/agent");
const sendEmail = require("../config/email");

/* =========================================
   HELPER FUNCTIONS
========================================= */

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
  return cleanString(value).replace(/\s+/g, "");
}

function normalizeNIN(value) {
  return cleanString(value).replace(/\s+/g, "");
}

function maskNIN(nin) {
  if (!nin) {
    return "";
  }

  if (nin.length <= 4) {
    return "*".repeat(nin.length);
  }

  return (
    "*".repeat(nin.length - 4) +
    nin.slice(-4)
  );
}

/* =========================================
   VALIDATION
========================================= */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isValidPhone(phone) {
  return /^[0-9+()\-]{7,20}$/.test(phone);
}

function isValidNIN(nin) {
  return /^\d{11}$/.test(nin);
}

function isValidDateOfBirth(dateOfBirth) {
  const date = new Date(dateOfBirth);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (date > new Date()) {
    return false;
  }

  return true;
}

/* =========================================
   GENERATE REFERRAL CODE
========================================= */

async function generateReferralCode(
  nameKnownToPeople
) {
  const baseName = cleanString(
    nameKnownToPeople
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const safeBaseName =
    baseName || "AGENT";

  let referralCode;

  do {
    const randomPart =
      crypto.randomBytes(3).toString("hex")
        .toUpperCase();

    referralCode =
      `BLAIZ-${safeBaseName}-${randomPart}`;

    const existing =
      await Agent.findOne({
        referralCode,
      });

    if (!existing) {
      break;
    }
  } while (true);

  return referralCode;
}

/* =========================================
   SEND APPLICATION EMAIL
========================================= */

async function sendApplicationReceivedEmail(
  email,
  name
) {
  try {
    await sendEmail({
      to: email,

      subject:
        "Blaiz Business Manager - Agent Application Received",

      text: `
Hello ${name},

Your Blaiz Business Manager Agent application has been received successfully.

Your application is currently pending admin review and approval.

Approval usually takes 2–5 days.

You will receive another email once your application has been reviewed.

Thank you for your interest in becoming a Blaiz Business Manager Agent.

Blaiz Business Manager
      `,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Blaiz Business Manager</h2>

            <p>Hello ${name},</p>

            <p>
                Your Blaiz Business Manager Agent application
                has been received successfully.
            </p>

            <p>
                Your application is currently
                <strong>pending admin review and approval.</strong>
            </p>

            <p>
                Approval usually takes
                <strong>2–5 days.</strong>
            </p>

            <p>
                You will receive another email once your
                application has been reviewed.
            </p>

            <p>
                Thank you for your interest in becoming a
                Blaiz Business Manager Agent.
            </p>

            <br>

            <p>
                <strong>Blaiz Business Manager</strong>
            </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error(
      "Agent application email failed:",
      error.message
    );

    return false;
  }
}

/* =========================================
   REGISTER AGENT
========================================= */

const registerAgent = async (
  req,
  res
) => {
  try {
    const {
      fullName,
      nameKnownToPeople,
      nin,
      dateOfBirth,
      gender,
      relationshipStatus,
      phone,
      email,
      currentAddress,
      state,
      lga,
      homeAddress,
      password,
      confirmPassword,
      termsAccepted,
    } = req.body;

    /* =====================================
       CLEAN INPUT
    ===================================== */

    const cleanFullName =
      cleanString(fullName);

    const cleanNameKnownToPeople =
      cleanString(nameKnownToPeople);

    const cleanNIN =
      normalizeNIN(nin);

    const cleanPhone =
      normalizePhone(phone);

    const cleanEmail =
      normalizeEmail(email);

    const cleanCurrentAddress =
      cleanString(currentAddress);

    const cleanState =
      cleanString(state);

    const cleanLGA =
      cleanString(lga);

    const cleanHomeAddress =
      cleanString(homeAddress);

    /* =====================================
       REQUIRED FIELD CHECK
    ===================================== */

    if (
      !cleanFullName ||
      !cleanNameKnownToPeople ||
      !cleanNIN ||
      !dateOfBirth ||
      !gender ||
      !relationshipStatus ||
      !cleanPhone ||
      !cleanEmail ||
      !cleanCurrentAddress ||
      !cleanState ||
      !cleanLGA ||
      !cleanHomeAddress ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill in all required Agent registration fields.",
      });
    }

    /* =====================================
       TERMS & PRIVACY
    ===================================== */

    if (termsAccepted !== true) {
      return res.status(400).json({
        success: false,
        message:
          "You must agree to the Terms of Use and Privacy Policy.",
      });
    }

    /* =====================================
       EMAIL VALIDATION
    ===================================== */

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    /* =====================================
       PHONE VALIDATION
    ===================================== */

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid active phone number.",
      });
    }

    /* =====================================
       NIN VALIDATION
    ===================================== */

    if (!isValidNIN(cleanNIN)) {
      return res.status(400).json({
        success: false,
        message:
          "NIN must contain exactly 11 digits.",
      });
    }

    /* =====================================
       DATE OF BIRTH VALIDATION
    ===================================== */

    if (!isValidDateOfBirth(dateOfBirth)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid date of birth.",
      });
    }

    /* =====================================
       PASSWORD CONFIRMATION
    ===================================== */

    if (
      password !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    /* =====================================
       PASSWORD LENGTH
    ===================================== */

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }

    /* =====================================
       FIND EXISTING AGENT RECORDS
       
       We check email, phone and NIN
       separately because rejected Agents
       are allowed to reapply.
    ===================================== */

    const existingByEmail =
      await Agent.findOne({
        email: cleanEmail,
      });

    const existingByPhone =
      await Agent.findOne({
        phone: cleanPhone,
      });

    const existingByNIN =
      await Agent.findOne({
        nin: cleanNIN,
      });

    /* =====================================
       COLLECT UNIQUE MATCHES
    ===================================== */

    const existingAgents = [];

    [
      existingByEmail,
      existingByPhone,
      existingByNIN,
    ].forEach((agent) => {
      if (
        agent &&
        !existingAgents.some(
          (existing) =>
            existing._id.toString() ===
            agent._id.toString()
        )
      ) {
        existingAgents.push(agent);
      }
    });

    /* =====================================
       CONFLICTING AGENT RECORDS
       
       Example:
       Email belongs to Agent A
       NIN belongs to Agent B

       Never overwrite either account.
    ===================================== */

    if (existingAgents.length > 1) {
      return res.status(409).json({
        success: false,
        message:
          "One or more of these details are already associated with another Agent account.",
      });
    }

    /* =====================================
       EXISTING AGENT FOUND
    ===================================== */

    if (existingAgents.length === 1) {
      const existingAgent =
        existingAgents[0];

      /* ===================================
         PENDING APPLICATION
      =================================== */

      if (
        existingAgent.applicationStatus ===
        "pending"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Your Agent application is already pending review.",
        });
      }

      /* ===================================
         APPROVED / ACTIVE AGENT
      =================================== */

      if (
        existingAgent.applicationStatus ===
          "approved" ||
        existingAgent.status ===
          "active"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An approved Agent account already exists with these details.",
        });
      }

      /* ===================================
         REJECTED APPLICATION
         
         ALLOW REAPPLICATION
      =================================== */

      if (
        existingAgent.applicationStatus ===
        "rejected"
      ) {
        const newPasswordHash =
          await bcrypt.hash(
            password,
            12
          );

        /*
         * Update the SAME Agent record.
         *
         * This means:
         * - no duplicate Agent account
         * - referral code is preserved
         * - previous application history remains
         * - new information can be corrected
         */

        existingAgent.fullName =
          cleanFullName;

        existingAgent.nameKnownToPeople =
          cleanNameKnownToPeople;

        existingAgent.nin =
          cleanNIN;

        existingAgent.dateOfBirth =
          new Date(dateOfBirth);

        existingAgent.gender =
          gender;

        existingAgent.relationshipStatus =
          relationshipStatus;

        existingAgent.phone =
          cleanPhone;

        existingAgent.email =
          cleanEmail;

        existingAgent.currentAddress =
          cleanCurrentAddress;

        existingAgent.state =
          cleanState;

        existingAgent.lga =
          cleanLGA;

        existingAgent.homeAddress =
          cleanHomeAddress;

        existingAgent.passwordHash =
          newPasswordHash;

        /* ================================
           RESET APPLICATION STATUS
        ================================= */

        existingAgent.applicationStatus =
          "pending";

        existingAgent.rejectionReason =
          null;

        existingAgent.reviewedAt =
          null;

        existingAgent.reviewedBy =
          null;

        /* ================================
           RESET ACCOUNT STATUS
        ================================= */

        existingAgent.status =
          "pending";

        existingAgent.lastLogin =
          null;

        /* ================================
           TERMS & PRIVACY
        ================================= */

        existingAgent.termsAccepted =
          true;

        existingAgent.termsAcceptedAt =
          new Date();

        existingAgent.termsVersion =
          "1.0";

        existingAgent.privacyPolicyVersion =
          "1.0";

        /*
         * IMPORTANT:
         *
         * We deliberately do NOT modify:
         *
         * - referralCode
         * - bankAccountName
         * - bankAccountNumber
         * - bankName
         * - bankDetailsUpdatedAt
         *
         * Bank details are not part of registration.
         */

        await existingAgent.save();

        /* ================================
           SEND APPLICATION EMAIL AGAIN
        ================================= */

        await sendApplicationReceivedEmail(
          existingAgent.email,
          existingAgent.fullName
        );

        return res.status(200).json({
          success: true,

          message:
            "Application submitted successfully. Your request has been sent to the admin for review and approval. Approval usually takes 2–5 days.",

          reapplication: true,

          agent: {
            id: existingAgent._id,
            fullName:
              existingAgent.fullName,
            nameKnownToPeople:
              existingAgent.nameKnownToPeople,
            nin:
              maskNIN(existingAgent.nin),
            dateOfBirth:
              existingAgent.dateOfBirth,
            gender:
              existingAgent.gender,
            relationshipStatus:
              existingAgent.relationshipStatus,
            phone:
              existingAgent.phone,
            email:
              existingAgent.email,
            currentAddress:
              existingAgent.currentAddress,
            state:
              existingAgent.state,
            lga:
              existingAgent.lga,
            homeAddress:
              existingAgent.homeAddress,
            applicationStatus:
              existingAgent.applicationStatus,
            status:
              existingAgent.status,
            referralCode:
              existingAgent.referralCode,
            termsAccepted:
              existingAgent.termsAccepted,
            termsVersion:
              existingAgent.termsVersion,
            privacyPolicyVersion:
              existingAgent.privacyPolicyVersion,
          },
        });
      }
    }

    /* =====================================
       NEW AGENT REGISTRATION
    ===================================== */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    /* =====================================
       GENERATE REFERRAL CODE
    ===================================== */

    const referralCode =
      await generateReferralCode(
        cleanNameKnownToPeople
      );

    /* =====================================
       CREATE AGENT
       
       BANK DETAILS ARE INTENTIONALLY
       NOT INCLUDED HERE.
    ===================================== */

    const agent =
      await Agent.create({
        fullName:
          cleanFullName,

        nameKnownToPeople:
          cleanNameKnownToPeople,

        nin:
          cleanNIN,

        dateOfBirth:
          new Date(dateOfBirth),

        gender:
          gender,

        relationshipStatus:
          relationshipStatus,

        phone:
          cleanPhone,

        email:
          cleanEmail,

        currentAddress:
          cleanCurrentAddress,

        state:
          cleanState,

        lga:
          cleanLGA,

        homeAddress:
          cleanHomeAddress,

        passwordHash:
          passwordHash,

        applicationStatus:
          "pending",

        rejectionReason:
          null,

        reviewedAt:
          null,

        reviewedBy:
          null,

        status:
          "pending",

        lastLogin:
          null,

        termsAccepted:
          true,

        termsAcceptedAt:
          new Date(),

        termsVersion:
          "1.0",

        privacyPolicyVersion:
          "1.0",

        referralCode:
          referralCode,
      });

    /* =====================================
       SEND APPLICATION RECEIVED EMAIL
    ===================================== */

    await sendApplicationReceivedEmail(
      agent.email,
      agent.fullName
    );

    /* =====================================
       SUCCESS RESPONSE
    ===================================== */

    return res.status(201).json({
      success: true,

      message:
        "Application submitted successfully. Your request has been sent to the admin for review and approval. Approval usually takes 2–5 days.",

      reapplication: false,

      agent: {
        id: agent._id,

        fullName:
          agent.fullName,

        nameKnownToPeople:
          agent.nameKnownToPeople,

        nin:
          maskNIN(agent.nin),

        dateOfBirth:
          agent.dateOfBirth,

        gender:
          agent.gender,

        relationshipStatus:
          agent.relationshipStatus,

        phone:
          agent.phone,

        email:
          agent.email,

        currentAddress:
          agent.currentAddress,

        state:
          agent.state,

        lga:
          agent.lga,

        homeAddress:
          agent.homeAddress,

        applicationStatus:
          agent.applicationStatus,

        status:
          agent.status,

        referralCode:
          agent.referralCode,

        termsAccepted:
          agent.termsAccepted,

        termsVersion:
          agent.termsVersion,

        privacyPolicyVersion:
          agent.privacyPolicyVersion,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER AGENT ERROR:",
      error
    );

    /* =====================================
       DUPLICATE KEY ERROR
    ===================================== */

    if (error.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      let message =
        "An Agent account already exists with one or more of these details.";

      if (
        duplicateField ===
        "email"
      ) {
        message =
          "An Agent account already exists with this email address.";
      }

      if (
        duplicateField ===
        "phone"
      ) {
        message =
          "An Agent account already exists with this phone number.";
      }

      if (
        duplicateField ===
        "nin"
      ) {
        message =
          "An Agent account already exists with this NIN.";
      }

      if (
        duplicateField ===
        "referralCode"
      ) {
        message =
          "Unable to generate a unique referral code. Please try again.";
      }

      return res.status(409).json({
        success: false,
        message,
      });
    }

    /* =====================================
       GENERAL ERROR
    ===================================== */

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit Agent application. Please try again.",
    });
  }
};

/* =========================================
   EXPORTS
========================================= */

module.exports = {
  registerAgent,
};